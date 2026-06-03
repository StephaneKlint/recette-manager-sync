module.exports = (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.write('{"status":"ok","timestamp":"' + new Date().toISOString() + '"}');
  res.end();
};
