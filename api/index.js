module.exports = (req, res) => {
  if (req.url === '/' || req.url === '') {
    res.setHeader('Content-Type', 'text/html');
    res.write('<h1>Recette Manager Sync</h1><p><a href="/health">Health Check</a></p>');
    res.end();
  } else {
    res.statusCode = 404;
    res.write('Not found');
    res.end();
  }
};
