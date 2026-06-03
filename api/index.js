// Vercel API endpoint - handles all /api/* routes
const express = require('express');
const { Pool } = require('pg');

const app = express();
app.use(express.json());

// PostgreSQL pool
let pool = null;
if (process.env.DATABASE_URL) {
  try {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });
  } catch (e) {
    console.error('DB connection error:', e.message);
  }
}

// Health endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    database: pool ? 'configured' : 'not-configured',
    timestamp: new Date().toISOString()
  });
});

// Default response
app.get('/api/', (req, res) => {
  res.json({
    message: 'Recette Manager Sync API',
    database: pool ? 'configured' : 'not-configured'
  });
});

// Any other /api/* routes
app.all('*', (req, res) => {
  res.status(404).json({ error: 'Not found' });
});

module.exports = app;
