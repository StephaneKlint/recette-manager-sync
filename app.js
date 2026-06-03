const express = require('express');
const { createServer } = require('http');
const { Server: SocketIOServer } = require('socket.io');
const cors = require('cors');
const compression = require('compression');
const { Pool } = require('pg');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const app = express();
const httpServer = createServer(app);
const io = new SocketIOServer(httpServer, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
  transports: ['websocket', 'polling']
});

// Configuration
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Middleware
app.use(compression());
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(express.static('public')); // Serve static files

// PostgreSQL Connection Pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

console.log(`[${NODE_ENV.toUpperCase()}] Starting Recette Manager Sync server...`);

// Test DB connection and initialize tables
if (process.env.DATABASE_URL) {
  pool.query('SELECT NOW()', async (err) => {
    if (err) {
      console.error('[DB] ❌ Connection failed:', err.message);
    } else {
      console.log('[DB] ✅ Connected successfully');
      await initDatabase();
    }
  });
} else {
  console.warn('[DB] ⚠️ DATABASE_URL not set - running in memory mode');
}

// ============================================
// DATABASE INITIALIZATION
// ============================================

async function initDatabase() {
  try {
    const client = await pool.connect();

    // Cahiers table
    await client.query(`
      CREATE TABLE IF NOT EXISTS cahiers (
        id TEXT PRIMARY KEY,
        nom TEXT NOT NULL,
        type TEXT,
        lotId TEXT,
        status TEXT DEFAULT 'En cours',
        owner TEXT,
        data JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Lots table
    await client.query(`
      CREATE TABLE IF NOT EXISTS lots (
        id TEXT PRIMARY KEY,
        numero TEXT NOT NULL,
        nom TEXT NOT NULL,
        cahierIds TEXT[] DEFAULT '{}',
        status TEXT DEFAULT 'En cours',
        data JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Testeurs table
    await client.query(`
      CREATE TABLE IF NOT EXISTS testeurs (
        id TEXT PRIMARY KEY,
        nom TEXT NOT NULL,
        email TEXT,
        roles TEXT[] DEFAULT '{}',
        data JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Executions table (test case executions by testeur)
    await client.query(`
      CREATE TABLE IF NOT EXISTS executions (
        id TEXT PRIMARY KEY,
        cahier_id TEXT NOT NULL,
        case_id TEXT NOT NULL,
        testeur_id TEXT NOT NULL,
        statut TEXT,
        result TEXT,
        data JSONB,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        FOREIGN KEY(cahier_id) REFERENCES cahiers(id) ON DELETE CASCADE
      );
      CREATE INDEX IF NOT EXISTS idx_executions_cahier ON executions(cahier_id, testeur_id);
    `);

    // Anomalies table
    await client.query(`
      CREATE TABLE IF NOT EXISTS anomalies (
        id TEXT PRIMARY KEY,
        cahier_id TEXT NOT NULL,
        titre TEXT,
        severite TEXT,
        status TEXT DEFAULT 'Ouvert',
        data JSONB,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        FOREIGN KEY(cahier_id) REFERENCES cahiers(id) ON DELETE CASCADE
      );
      CREATE INDEX IF NOT EXISTS idx_anomalies_cahier ON anomalies(cahier_id);
    `);

    // Backups table (cahier backups)
    await client.query(`
      CREATE TABLE IF NOT EXISTS backups (
        id SERIAL PRIMARY KEY,
        cahier_id TEXT REFERENCES cahiers(id) ON DELETE CASCADE,
        version INT NOT NULL,
        device TEXT,
        data JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_backups_cahier ON backups(cahier_id, version);
    `);

    // Collaborators table (track who's viewing what)
    await client.query(`
      CREATE TABLE IF NOT EXISTS collaborators (
        id SERIAL PRIMARY KEY,
        cahier_id TEXT REFERENCES cahiers(id),
        testeur_id TEXT,
        device_id TEXT,
        last_seen TIMESTAMP DEFAULT NOW(),
        UNIQUE(cahier_id, device_id)
      );
    `);

    client.release();
    console.log('[DB] ✅ Tables initialized successfully');
  } catch (err) {
    console.error('[DB] ❌ Init error:', err.message);
  }
}

// ============================================
// REST API ENDPOINTS
// ============================================

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    environment: NODE_ENV,
    database: process.env.DATABASE_URL ? 'configured' : 'not-configured',
    websocket: 'ready',
    timestamp: new Date().toISOString()
  });
});

// Get all cahiers
app.get('/api/cahiers', async (req, res) => {
  try {
    if (!process.env.DATABASE_URL) {
      return res.json([]);
    }
    const result = await pool.query('SELECT * FROM cahiers ORDER BY updated_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('[API] cahiers GET error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Get cahier by ID
app.get('/api/cahiers/:id', async (req, res) => {
  try {
    if (!process.env.DATABASE_URL) {
      return res.json({});
    }
    const result = await pool.query('SELECT * FROM cahiers WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Cahier not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('[API] cahier GET error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Create/Update cahier
app.post('/api/cahiers', async (req, res) => {
  try {
    if (!process.env.DATABASE_URL) {
      return res.json({ id: uuidv4(), ...req.body });
    }
    const { id, nom, type, lotId, status, data, owner } = req.body;
    const cahierId = id || uuidv4();

    await pool.query(
      `INSERT INTO cahiers (id, nom, type, lotId, status, owner, data, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
       ON CONFLICT (id) DO UPDATE SET
       nom = $2, type = $3, lotId = $4, status = $5, data = $7, updated_at = NOW()`,
      [cahierId, nom, type, lotId, status, owner, JSON.stringify(data)]
    );

    // Broadcast to WebSocket clients
    io.emit('cahier-updated', { cahierId, nom, type, status });

    res.json({ id: cahierId, ...req.body });
  } catch (err) {
    console.error('[API] cahier POST error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Delete cahier
app.delete('/api/cahiers/:id', async (req, res) => {
  try {
    if (!process.env.DATABASE_URL) {
      return res.json({ success: true });
    }
    await pool.query('DELETE FROM cahiers WHERE id = $1', [req.params.id]);
    io.emit('cahier-deleted', { cahierId: req.params.id });
    res.json({ success: true });
  } catch (err) {
    console.error('[API] cahier DELETE error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Get all lots
app.get('/api/lots', async (req, res) => {
  try {
    if (!process.env.DATABASE_URL) {
      return res.json([]);
    }
    const result = await pool.query('SELECT * FROM lots ORDER BY updated_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('[API] lots GET error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Create/Update lot
app.post('/api/lots', async (req, res) => {
  try {
    if (!process.env.DATABASE_URL) {
      return res.json({ id: uuidv4(), ...req.body });
    }
    const { id, numero, nom, cahierIds, status, data } = req.body;
    const lotId = id || uuidv4();

    await pool.query(
      `INSERT INTO lots (id, numero, nom, cahierIds, status, data, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())
       ON CONFLICT (id) DO UPDATE SET
       numero = $2, nom = $3, cahierIds = $4, status = $5, data = $6, updated_at = NOW()`,
      [lotId, numero, nom, cahierIds || [], status, JSON.stringify(data)]
    );

    io.emit('lot-updated', { lotId, numero, nom, status });
    res.json({ id: lotId, ...req.body });
  } catch (err) {
    console.error('[API] lot POST error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Record test execution
app.post('/api/executions', async (req, res) => {
  try {
    if (!process.env.DATABASE_URL) {
      return res.json({ id: uuidv4(), ...req.body });
    }
    const { id, cahier_id, case_id, testeur_id, statut, result, data } = req.body;
    const executionId = id || uuidv4();

    await pool.query(
      `INSERT INTO executions (id, cahier_id, case_id, testeur_id, statut, result, data, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
       ON CONFLICT (id) DO UPDATE SET
       statut = $5, result = $6, data = $7, updated_at = NOW()`,
      [executionId, cahier_id, case_id, testeur_id, statut, result, JSON.stringify(data)]
    );

    io.emit('execution-recorded', {
      executionId, cahier_id, case_id, testeur_id, statut, result
    });
    res.json({ id: executionId, ...req.body });
  } catch (err) {
    console.error('[API] execution POST error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Get testeur executions for a cahier
app.get('/api/cahiers/:cahierId/executions/:testeurId', async (req, res) => {
  try {
    if (!process.env.DATABASE_URL) {
      return res.json([]);
    }
    const { cahierId, testeurId } = req.params;
    const result = await pool.query(
      'SELECT * FROM executions WHERE cahier_id = $1 AND testeur_id = $2 ORDER BY updated_at DESC',
      [cahierId, testeurId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('[API] executions GET error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// WEBSOCKET EVENTS
// ============================================

const connectedUsers = new Map();

io.on('connection', (socket) => {
  console.log(`[WS] ✅ Client connected: ${socket.id}`);

  // Join a cahier's room for real-time updates
  socket.on('join-cahier', ({ cahierId, testeurId, deviceId }) => {
    socket.join(`cahier-${cahierId}`);
    connectedUsers.set(socket.id, { cahierId, testeurId, deviceId });

    const roomSockets = io.sockets.adapter.rooms.get(`cahier-${cahierId}`);
    const countInRoom = roomSockets ? roomSockets.size : 0;

    console.log(`[WS] ${testeurId} joined cahier ${cahierId} (${countInRoom} users)`);
    io.to(`cahier-${cahierId}`).emit('user-joined', {
      testeurId,
      usersInRoom: countInRoom
    });
  });

  // Broadcast when cahier is modified (execution, anomaly, etc.)
  socket.on('cahier-modified', ({ cahierId, modification }) => {
    io.to(`cahier-${cahierId}`).emit('cahier-modified', {
      cahierId,
      modification,
      timestamp: new Date().toISOString()
    });
    console.log(`[WS] Cahier ${cahierId} modified:`, modification.type);
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    const userData = connectedUsers.get(socket.id);
    if (userData) {
      connectedUsers.delete(socket.id);
      const { cahierId, testeurId } = userData;
      const roomSockets = io.sockets.adapter.rooms.get(`cahier-${cahierId}`);
      const countInRoom = roomSockets ? roomSockets.size : 0;

      io.to(`cahier-${cahierId}`).emit('user-left', {
        testeurId,
        usersInRoom: countInRoom
      });
      console.log(`[WS] ${testeurId} left (${countInRoom} users remaining)`);
    }
  });
});

// ============================================
// SERVER START
// ============================================

httpServer.listen(PORT, () => {
  console.log(`\n🚀 Recette Manager Sync server running`);
  console.log(`📍 http://localhost:${PORT}`);
  console.log(`🌍 Environment: ${NODE_ENV}`);
  console.log(`💾 Database: ${process.env.DATABASE_URL ? 'PostgreSQL (Neon)' : 'Memory mode'}`);
  console.log(`🔌 WebSocket: Ready\n`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n[SERVER] Shutting down gracefully...');
  httpServer.close(() => {
    pool.end();
    console.log('[SERVER] ✅ Closed');
    process.exit(0);
  });
});

module.exports = { app, io };
