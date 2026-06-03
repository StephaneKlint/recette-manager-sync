// Vercel Serverless Handler
module.exports = (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle OPTIONS
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Health check endpoint
  if (req.url === '/api/health' || req.url === '/api/health?') {
    res.status(200).setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({
      status: 'ok',
      database: process.env.DATABASE_URL ? 'configured' : 'not-configured',
      timestamp: new Date().toISOString()
    }));
  }

  // Default API response
  if (req.url.startsWith('/api')) {
    res.status(200).setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({
      message: 'Recette Manager Sync API',
      endpoints: {
        health: '/api/health',
        cahiers: '/api/cahiers',
        lots: '/api/lots'
      }
    }));
  }

  // Homepage
  const html = `<!DOCTYPE html>
<html>
<head>
  <title>Recette Manager</title>
  <style>
    body { font-family: system-ui; margin: 40px; background: #0f1419; color: #e0e0e0; }
    h1 { color: #01696f; }
    .box { background: #1a1f26; padding: 20px; border-radius: 8px; }
    .ok { color: #059669; }
  </style>
</head>
<body>
  <h1>🚀 Recette Manager Sync</h1>
  <div class="box">
    <p><span class="ok">✅ API Running on Vercel!</span></p>
    <p>Database: <strong>${process.env.DATABASE_URL ? '✅ Configured (Neon)' : '❌ Not configured'}</strong></p>
    <p><a href="/api/health">Check Health</a></p>
  </div>
</body>
</html>`;

  res.status(200).setHeader('Content-Type', 'text/html');
  return res.end(html);
};
