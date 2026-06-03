// Simple Vercel Serverless Function - NO Express
export default function handler(req, res) {
  // Health check endpoint
  if (req.url === '/api/health' || req.url === '/api/health?') {
    return res.status(200).json({
      status: 'ok',
      database: process.env.DATABASE_URL ? 'configured' : 'not-configured',
      timestamp: new Date().toISOString()
    });
  }

  // Default API response
  if (req.url.startsWith('/api')) {
    return res.status(200).json({
      message: 'Recette Manager Sync API',
      endpoints: {
        health: '/api/health',
        cahiers: '/api/cahiers',
        lots: '/api/lots'
      }
    });
  }

  // Homepage
  res.status(200).setHeader('Content-Type', 'text/html');
  res.send(`
    <!DOCTYPE html>
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
    </html>
  `);
}
