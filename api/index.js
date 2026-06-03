// Handler Vercel serverless
const express = require('express');
const app = express();

// Charger les middlewares et routes depuis server.js
require('./server')(app);

// Export pour Vercel
module.exports = app;
