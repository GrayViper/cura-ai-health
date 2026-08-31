const searchHandler = require('./search');
const semanticSearchHandler = require('./semantic-search');
const healthHandler = require('./health');
const metricsHandler = require('./metrics');

module.exports = async function handler(req, res) {
  const url = new URL(req.url || '/', 'https://example.com');

  if (url.pathname === '/api/search' || url.pathname === '/search') {
    return searchHandler(req, res);
  }

  if (url.pathname === '/api/semantic-search' || url.pathname === '/semantic-search') {
    return semanticSearchHandler(req, res);
  }

  if (url.pathname === '/health') {
    return healthHandler(req, res);
  }

  if (url.pathname === '/metrics') {
    return metricsHandler(req, res);
  }

  res.statusCode = 404;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify({ error: 'Not found' }));
};
