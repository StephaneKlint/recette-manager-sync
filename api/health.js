export default function handler(req, res) {
  res.json({
    status: 'ok',
    message: 'Recette Manager Sync API',
    database: process.env.DATABASE_URL ? 'configured' : 'not-configured',
    timestamp: new Date().toISOString()
  });
}
