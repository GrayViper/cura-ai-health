const { handleSearch } = require('./lib/medical-api');

module.exports = async function handler(req, res) {
  const url = new URL(req.url || '/', 'https://example.com');
  if (req.method !== 'GET') {
    res.statusCode = 405;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({ error: 'Method not allowed' }));
    return;
  }

  if (url.pathname === '/api/search' || url.pathname === '/search') {
    await handleSearch(req, res);
    return;
  }

  res.statusCode = 404;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify({ error: 'Not found' }));
};
