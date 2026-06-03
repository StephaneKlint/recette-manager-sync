module.exports = (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'Recette Manager Sync API is running',
    database: process.env.DATABASE_URL ? 'configured' : 'not-configured',
    timestamp: new Date().toISOString()
  });
};
