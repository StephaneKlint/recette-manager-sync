module.exports = (req, res) => {
  res.status(200).json({
    status: 'ok',
    environment: 'production',
    database: process.env.DATABASE_URL ? 'configured' : 'not-configured',
    websocket: 'ready',
    timestamp: new Date().toISOString()
  });
};
