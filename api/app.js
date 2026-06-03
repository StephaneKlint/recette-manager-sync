// Vercel Serverless Function - Export Express app
const express = require('express');
const { Pool } = require('pg');

// Create Express app
const app = express();

// Middleware
app.use(express.json());

// PostgreSQL Connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    environment: process.env.NODE_ENV || 'development',
    database: process.env.DATABASE_URL ? 'configured' : 'not-configured',
    timestamp: new Date().toISOString()
  });
});

// List cahiers endpoint
app.get('/api/cahiers', async (req, res) => {
  try {
    if (!process.env.DATABASE_URL) {
      return res.json([]);
    }
    const result = await pool.query('SELECT * FROM cahiers ORDER BY updated_at DESC LIMIT 10');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Default endpoint
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Recette Manager Sync</title>
      <meta charset="utf-8">
      <style>
        body { font-family: system-ui; margin: 40px; background: #0f1419; color: #e0e0e0; }
        h1 { color: #01696f; }
        .box { background: #1a1f26; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .ok { color: #059669; }
      </style>
    </head>
    <body>
      <h1>🚀 Recette Manager Sync</h1>
      <div class="box">
        <p><span class="ok">✅ API Running on Vercel!</span></p>
        <p>Endpoints:</p>
        <ul>
          <li><a href="/api/health">/api/health</a></li>
          <li><a href="/api/cahiers">/api/cahiers</a></li>
        </ul>
        <p>Database: <strong>${process.env.DATABASE_URL ? '✅ Configured (Neon)' : '❌ Not configured'}</strong></p>
      </div>
    </body>
    </html>
  `);
});

// Export for Vercel
module.exports = app;
