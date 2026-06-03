const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const compression = require('compression');
const { v4: uuid } = require('uuid');

const app = express();

// Middlewares
app.use(cors());
app.use(compression());
app.use(express.json({ limit: '50mb' }));

// PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Init DB avec schéma complet
(async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS cahiers (
        id TEXT PRIMARY KEY,
        numero TEXT, nom TEXT, type TEXT, status TEXT DEFAULT 'À faire',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        data JSONB NOT NULL
      );
      CREATE TABLE IF NOT EXISTS lots (
        id TEXT PRIMARY KEY,
        numero TEXT, nom TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        data JSONB NOT NULL
      );
      CREATE TABLE IF NOT EXISTS testeurs (
        id TEXT PRIMARY KEY,
        nom TEXT, email TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        data JSONB NOT NULL
      );
      CREATE TABLE IF NOT EXISTS executions (
        id TEXT PRIMARY KEY,
        cahier_id TEXT, run_id TEXT, case_id TEXT, testeur_id TEXT, status TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        data JSONB NOT NULL
      );
      CREATE TABLE IF NOT EXISTS anomalies (
        id TEXT PRIMARY KEY,
        cahier_id TEXT, description TEXT, statut TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        data JSONB NOT NULL
      );
    `);
    console.log('✅ Base de données initialisée');
  } catch (error) {
    console.error('DB init error:', error.message);
  }
})();

// ===== CAHIERS =====
app.get('/api/cahiers', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM cahiers ORDER BY updated_at DESC LIMIT 1000');
    const cahiers = result.rows.map(row => ({ id: row.id, ...row.data }));
    res.json(cahiers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/cahiers', async (req, res) => {
  try {
    const { id, numero, nom, type, ...data } = req.body;
    const cahier_id = id || uuid();
    await pool.query(
      'INSERT INTO cahiers (id, numero, nom, type, data) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (id) DO UPDATE SET data = $5, updated_at = NOW()',
      [cahier_id, numero, nom, type, JSON.stringify({ id: cahier_id, numero, nom, type, ...data })]
    );
    res.json({ id: cahier_id, numero, nom, type, ...data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/cahiers/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM cahiers WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ id: result.rows[0].id, ...result.rows[0].data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/cahiers/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM cahiers WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===== LOTS =====
app.get('/api/lots', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM lots ORDER BY updated_at DESC');
    const lots = result.rows.map(row => ({ id: row.id, ...row.data }));
    res.json(lots);
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
      [lot_id, numero, nom, JSON.stringify({ id: lot_id, numero, nom, ...data })]
    );
    res.json({ id: lot_id, numero, nom, ...data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===== TESTEURS =====
app.get('/api/testeurs', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM testeurs');
    const testeurs = result.rows.map(row => ({ id: row.id, ...row.data }));
    res.json(testeurs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/testeurs', async (req, res) => {
  try {
    const { id, nom, email, ...data } = req.body;
    const testeur_id = id || uuid();
    await pool.query(
      'INSERT INTO testeurs (id, nom, email, data) VALUES ($1, $2, $3, $4) ON CONFLICT (id) DO UPDATE SET data = $4',
      [testeur_id, nom, email, JSON.stringify({ id: testeur_id, nom, email, ...data })]
    );
    res.json({ id: testeur_id, nom, email, ...data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===== EXECUTIONS =====
app.get('/api/executions', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM executions ORDER BY created_at DESC LIMIT 1000');
    const executions = result.rows.map(row => ({ id: row.id, ...row.data }));
    res.json(executions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/executions', async (req, res) => {
  try {
    const { cahier_id, run_id, case_id, testeur_id, status, ...data } = req.body;
    const execution_id = uuid();
    await pool.query(
      'INSERT INTO executions (id, cahier_id, run_id, case_id, testeur_id, status, data) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [execution_id, cahier_id, run_id, case_id, testeur_id, status, JSON.stringify({ id: execution_id, cahier_id, run_id, case_id, testeur_id, status, ...data })]
    );
    res.json({ id: execution_id, cahier_id, run_id, case_id, testeur_id, status, ...data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===== ANOMALIES =====
app.get('/api/anomalies', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM anomalies ORDER BY updated_at DESC');
    const anomalies = result.rows.map(row => ({ id: row.id, ...row.data }));
    res.json(anomalies);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/anomalies', async (req, res) => {
  try {
    const { id, cahier_id, description, statut, ...data } = req.body;
    const anomaly_id = id || uuid();
    await pool.query(
      'INSERT INTO anomalies (id, cahier_id, description, statut, data) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (id) DO UPDATE SET data = $5, updated_at = NOW()',
      [anomaly_id, cahier_id, description, statut, JSON.stringify({ id: anomaly_id, cahier_id, description, statut, ...data })]
    );
    res.json({ id: anomaly_id, cahier_id, description, statut, ...data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===== BULK IMPORT (pour importer toutes les données) =====
app.post('/api/import-data', async (req, res) => {
  try {
    const { cahiers = [], lots = [], testeurs = [], anomalies = [] } = req.body;

    let imported = 0;

    // Import cahiers
    for (const cahier of cahiers) {
      const id = cahier.id || uuid();
      await pool.query(
        'INSERT INTO cahiers (id, numero, nom, type, data) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (id) DO UPDATE SET data = $5',
        [id, cahier.numero, cahier.nom, cahier.type, JSON.stringify(cahier)]
      );
      imported++;
    }

    // Import lots
    for (const lot of lots) {
      const id = lot.id || uuid();
      await pool.query(
        'INSERT INTO lots (id, numero, nom, data) VALUES ($1, $2, $3, $4) ON CONFLICT (id) DO UPDATE SET data = $4',
        [id, lot.numero, lot.nom, JSON.stringify(lot)]
      );
      imported++;
    }

    // Import testeurs
    for (const testeur of testeurs) {
      const id = testeur.id || uuid();
      await pool.query(
        'INSERT INTO testeurs (id, nom, email, data) VALUES ($1, $2, $3, $4) ON CONFLICT (id) DO UPDATE SET data = $4',
        [id, testeur.nom, testeur.email, JSON.stringify(testeur)]
      );
      imported++;
    }

    // Import anomalies
    for (const anomaly of anomalies) {
      const id = anomaly.id || uuid();
      await pool.query(
        'INSERT INTO anomalies (id, cahier_id, description, statut, data) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (id) DO UPDATE SET data = $5',
        [id, anomaly.cahier_id, anomaly.description, anomaly.statut, JSON.stringify(anomaly)]
      );
      imported++;
    }

    res.json({ success: true, imported });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===== EXPORT DATA (pour exporter toutes les données) =====
app.get('/api/export-data', async (req, res) => {
  try {
    const cahiers = await pool.query('SELECT data FROM cahiers');
    const lots = await pool.query('SELECT data FROM lots');
    const testeurs = await pool.query('SELECT data FROM testeurs');
    const anomalies = await pool.query('SELECT data FROM anomalies');

    res.json({
      cahiers: cahiers.rows.map(r => r.data),
      lots: lots.rows.map(r => r.data),
      testeurs: testeurs.rows.map(r => r.data),
      anomalies: anomalies.rows.map(r => r.data),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===== HEALTH =====
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    database: process.env.DATABASE_URL ? 'configured' : 'not-configured'
  });
});

// ===== 404 =====
app.use((req, res) => {
  res.status(404).json({ error: 'Route non trouvée' });
});

module.exports = app;
