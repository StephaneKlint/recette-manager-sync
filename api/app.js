// Vercel Serverless Handler
const express = require('express');
const { Pool } = require('pg');

// Create Express app
const app = express();
app.use(express.json());

// PostgreSQL pool
let pool = null;
if (process.env.DATABASE_URL) {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
}

// Health endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    database: pool ? 'configured' : 'not-configured',
    timestamp: new Date().toISOString()
  });
});

// Cahiers endpoint
app.get('/api/cahiers', (req, res) => {
  res.json([]);
});

// Home page
app.get('/', (req, res) => {
  res.send(`<!DOCTYPE html><html><body><h1>Recette Manager</h1><p>✅ API Running</p></body></html>`);
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Export handler for Vercel
module.exports = app;
