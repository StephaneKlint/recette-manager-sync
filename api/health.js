module.exports = (req, res) => {
  const response = {
    status: 'ok',
    message: 'Recette Manager Sync API is running',
    database: process.env.DATABASE_URL ? 'configured' : 'not-configured',
    timestamp: new Date().toISOString()
  };

  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(response));
};
