// Simple Vercel API endpoint
module.exports = (req, res) => {
  // Health check
  if (req.url === '/health' || req.url === '/api/health' || req.url === '') {
    return res.status(200).json({
      status: 'ok',
      environment: 'production',
      database: process.env.DATABASE_URL ? 'configured' : 'not-configured',
      websocket: 'ready',
      timestamp: new Date().toISOString()
    });
  }

  // List cahiers (mock)
  if (req.method === 'GET' && req.url === '/api/cahiers') {
    return res.status(200).json([
      {
        id: '1',
        nom: 'Cahier Test 1',
        type: 'Unitaire',
        status: 'En cours'
      }
    ]);
  }

  // Default 404
  res.status(404).json({ error: 'Not found' });
};
