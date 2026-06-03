module.exports = (req, res) => {
  try {
    const response = {
      status: 'ok',
      message: 'Recette Manager Sync API is running',
      database: process.env.DATABASE_URL ? 'configured' : 'not-configured',
      timestamp: new Date().toISOString(),
      timestamp_ms: Date.now()
    };

    const json = JSON.stringify(response);

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(json);
  } catch (error) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: error.message }));
  }
};
