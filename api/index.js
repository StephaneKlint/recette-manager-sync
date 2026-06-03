// Vercel Serverless Function Handler
// Re-export the Express app from app.js

const { app } = require('../app.js');

// Export pour Vercel
module.exports = app;
