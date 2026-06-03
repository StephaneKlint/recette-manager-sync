module.exports = (req, res) => {
  res.status(200).json({
    message: 'Recette Manager Sync API',
    endpoints: {
      health: '/api/health',
      cahiers: '/api/cahiers',
      lots: '/api/lots'
    }
  });
};
