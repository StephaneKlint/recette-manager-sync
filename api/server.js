const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const compression = require('compression');
const { v4: uuid } = require('uuid');
require('dotenv').config();

module.exports = function(app) {

// Middleware
app.use(cors());
app.use(compression());
app.use(express.json());

// PostgreSQL Pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Initialiser la base de données
async function initializeDatabase() {
  try {
    // Créer les tables si elles n'existent pas
    await pool.query(`
      CREATE TABLE IF NOT EXISTS cahiers (
        id TEXT PRIMARY KEY,
        numero TEXT NOT NULL,
        nom TEXT NOT NULL,
        type TEXT NOT NULL,
        status TEXT DEFAULT 'À faire',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        data JSONB NOT NULL
      );

      CREATE TABLE IF NOT EXISTS lots (
        id TEXT PRIMARY KEY,
        numero TEXT NOT NULL,
        nom TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        data JSONB NOT NULL
      );

      CREATE TABLE IF NOT EXISTS executions (
        id TEXT PRIMARY KEY,
        cahier_id TEXT NOT NULL,
        run_id TEXT NOT NULL,
        case_id TEXT NOT NULL,
        testeur_id TEXT NOT NULL,
        status TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (cahier_id) REFERENCES cahiers(id)
      );
    `);

    console.log('✅ Base de données initialisée');
  } catch (error) {
    console.error('❌ Erreur initialisation DB:', error);
  }
}

initializeDatabase();

// Routes: CAHIERS
app.get('/api/cahiers', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM cahiers ORDER BY updated_at DESC');
    res.json(result.rows.map(row => ({
      id: row.id,
      numero: row.numero,
      nom: row.nom,
      type: row.type,
      status: row.status,
      ...row.data
    })));
  } catch (error) {
    console.error('Erreur GET /cahiers:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/cahiers', async (req, res) => {
  try {
    const { id, numero, nom, type, ...data } = req.body;
    const cahier_id = id || uuid();

    await pool.query(
      'INSERT INTO cahiers (id, numero, nom, type, data) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (id) DO UPDATE SET data = $5, updated_at = NOW()',
      [cahier_id, numero, nom, type, JSON.stringify(data)]
    );

    res.json({ id: cahier_id, numero, nom, type, ...data });
  } catch (error) {
    console.error('Erreur POST /cahiers:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/cahiers/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM cahiers WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Cahier non trouvé' });
    }
    const row = result.rows[0];
    res.json({
      id: row.id,
      numero: row.numero,
      nom: row.nom,
      type: row.type,
      status: row.status,
      ...row.data
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Routes: LOTS
app.get('/api/lots', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM lots ORDER BY updated_at DESC');
    res.json(result.rows.map(row => ({
      id: row.id,
      numero: row.numero,
      nom: row.nom,
      ...row.data
    })));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/lots', async (req, res) => {
  try {
    const { id, numero, nom, ...data } = req.body;
    const lot_id = id || uuid();

    await pool.query(
      'INSERT INTO lots (id, numero, nom, data) VALUES ($1, $2, $3, $4) ON CONFLICT (id) DO UPDATE SET data = $4, updated_at = NOW()',
      [lot_id, numero, nom, JSON.stringify(data)]
    );

    res.json({ id: lot_id, numero, nom, ...data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Routes: EXECUTIONS
app.post('/api/executions', async (req, res) => {
  try {
    const { cahier_id, run_id, case_id, testeur_id, status } = req.body;
    const execution_id = uuid();

    await pool.query(
      'INSERT INTO executions (id, cahier_id, run_id, case_id, testeur_id, status) VALUES ($1, $2, $3, $4, $5, $6)',
      [execution_id, cahier_id, run_id, case_id, testeur_id, status]
    );

    res.json({ id: execution_id, cahier_id, run_id, case_id, testeur_id, status });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/cahiers/:cahier_id/executions', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM executions WHERE cahier_id = $1 ORDER BY created_at DESC',
      [req.params.cahier_id]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    database: process.env.DATABASE_URL ? 'configured' : 'not-configured'
  });
});

// 404
app.use((req, res) => {
  res.status(404).json({ error: 'Route non trouvée' });
});

};
