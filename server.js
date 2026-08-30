const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const PORT = Number(process.env.PORT || 3000);
const SEARXNG_URL = process.env.SEARXNG_URL || 'http://127.0.0.1:8888/search';
const SEMANTIC_ENDPOINT = process.env.SEMANTIC_ENDPOINT || '';
const MAX_QUERY_LENGTH = 240;
const RATE_LIMIT = Number(process.env.SEARCH_RATE_LIMIT || 30);
const RATE_WINDOW_MS = 60 * 1000;
const requestLog = new Map();
let totalRequests = 0;

const SOURCE_DOMAINS = {
  pubmed: 'pubmed.ncbi.nlm.nih.gov',
  nih: 'nih.gov',
  who: 'who.int',
  cdc: 'cdc.gov'
};

function sanitizeQuery(value) {
  return String(value || '')
    .replace(/[\u0000-\u001f\u007f]/g, ' ')
    .replace(/\b(?:patient|mrn|medical record number|member id|dob|date of birth)\s*[:#-]?\s*[a-z0-9-]+/gi, ' ')
    .replace(/\b\d{3}[- ]?\d{2}[- ]?\d{4}\b/g, ' ')
    .replace(/\b\d{2}[/-]\d{2}[/-]\d{2,4}\b/g, ' ')
    .replace(/\b[A-Z]{2,5}[- ]?\d{4,}\b/g, ' ')
    .replace(/[^\p{L}\p{N}\s.,;:?()'+/-]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, MAX_QUERY_LENGTH);
}

function allowedDomains(sourceNames) {
  return sourceNames.map(name => SOURCE_DOMAINS[name]).filter(Boolean);
}

function isRateLimited(ip) {
  const now = Date.now();
  const recent = (requestLog.get(ip) || []).filter(time => now - time < RATE_WINDOW_MS);
  recent.push(now);
  requestLog.set(ip, recent);
  return recent.length > RATE_LIMIT;
}

function normalizeResults(data) {
  const results = Array.isArray(data.results) ? data.results : [];
  return results.slice(0, 20).map(result => ({
    title: String(result.title || '').slice(0, 300),
    url: String(result.url || result.link || ''),
    content: String(result.content || result.abstract || '').slice(0, 1000),
    engine: String(result.engine || result.engines || 'unknown'),
    publishedDate: result.publishedDate || null
  })).filter(result => result.title && /^https?:\/\//i.test(result.url));
}

function sendJson(response, status, body) {
  response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  response.end(JSON.stringify(body));
}

function sendMetrics(response) {
  const metrics = [
    '# HELP cura_http_requests_total Total HTTP requests received by the Cura application.',
    '# TYPE cura_http_requests_total counter',
    `cura_http_requests_total ${totalRequests}`,
    '# HELP cura_process_uptime_seconds Process uptime in seconds.',
    '# TYPE cura_process_uptime_seconds gauge',
    `cura_process_uptime_seconds ${process.uptime()}`
  ].join('\n');
  response.writeHead(200, { 'Content-Type': 'text/plain; version=0.0.4; charset=utf-8' });
  response.end(`${metrics}\n`);
}

async function handleSearch(request, response, url) {
  const query = sanitizeQuery(url.searchParams.get('q'));
  const sources = (url.searchParams.get('sources') || 'pubmed,nih,who,cdc')
    .split(',').map(source => source.trim().toLowerCase()).filter(Boolean).slice(0, 4);
  if (!query) return sendJson(response, 400, { error: 'A non-empty search query is required.' });
  if (isRateLimited(request.socket.remoteAddress || 'unknown')) {
    return sendJson(response, 429, { error: 'Search rate limit exceeded. Try again shortly.' });
  }

  const domains = allowedDomains(sources);
  const upstream = new URL(SEARXNG_URL);
  upstream.searchParams.set('q', domains.length ? `${query} (${domains.map(domain => `site:${domain}`).join(' OR ')})` : query);
  upstream.searchParams.set('format', 'json');

  try {
    const upstreamResponse = await fetch(upstream);
    if (!upstreamResponse.ok) throw new Error(`SearXNG returned HTTP ${upstreamResponse.status}`);
    const data = await upstreamResponse.json();
    console.info(JSON.stringify({ event: 'medical_search', query, sources, resultCount: data.results?.length || 0 }));
    return sendJson(response, 200, {
      query,
      sources,
      results: normalizeResults(data),
      disclaimer: 'Search results are educational references. A qualified clinician must review them before clinical use.'
    });
  } catch (error) {
    console.error(JSON.stringify({ event: 'medical_search_error', message: error.message }));
    return sendJson(response, 502, { error: 'Medical search is temporarily unavailable.' });
  }
}

async function handleSemanticSearch(request, response, url) {
  const query = sanitizeQuery(url.searchParams.get('q'));
  if (!query) return sendJson(response, 400, { error: 'A non-empty search query is required.' });
  if (!SEMANTIC_ENDPOINT) return sendJson(response, 503, { error: 'Semantic search is disabled for this deployment.' });
  if (isRateLimited(`semantic:${request.socket.remoteAddress || 'unknown'}`)) {
    return sendJson(response, 429, { error: 'Semantic search quota exceeded. Try again shortly.' });
  }
  try {
    const semanticResponse = await fetch(SEMANTIC_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(process.env.SEMANTIC_API_KEY ? { Authorization: `Bearer ${process.env.SEMANTIC_API_KEY}` } : {}) },
      body: JSON.stringify({ query, maxTokens: 500 })
    });
    if (!semanticResponse.ok) throw new Error(`Semantic provider returned HTTP ${semanticResponse.status}`);
    const data = await semanticResponse.json();
    console.info(JSON.stringify({ event: 'semantic_search', query }));
    return sendJson(response, 200, {
      query,
      summary: String(data.summary || data.text || data.output || '').slice(0, 3000),
      provenance: Array.isArray(data.provenance) ? data.provenance : [],
      disclaimer: 'Semantic output is an educational aid and requires human clinical review.'
    });
  } catch (error) {
    console.error(JSON.stringify({ event: 'semantic_search_error', message: error.message }));
    return sendJson(response, 502, { error: 'Semantic search is temporarily unavailable.' });
  }
}

function serveStatic(response, url) {
  const requested = url.pathname === '/' ? '/index.html' : url.pathname;
  const filePath = path.join(__dirname, requested);
  if (!filePath.startsWith(__dirname) || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    return sendJson(response, 404, { error: 'Not found' });
  }
  const contentTypes = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' };
  response.writeHead(200, { 'Content-Type': contentTypes[path.extname(filePath)] || 'application/octet-stream' });
  fs.createReadStream(filePath).pipe(response);
}

const server = http.createServer((request, response) => {
  totalRequests += 1;
  const url = new URL(request.url, `http://${request.headers.host || 'localhost'}`);
  if (request.method === 'GET' && url.pathname === '/api/search') return handleSearch(request, response, url);
  if (request.method === 'GET' && url.pathname === '/api/semantic-search') return handleSemanticSearch(request, response, url);
  if (request.method === 'GET' && url.pathname === '/health') return sendJson(response, 200, { status: 'healthy' });
  if (request.method === 'GET' && url.pathname === '/metrics') return sendMetrics(response);
  if (request.method === 'GET') return serveStatic(response, url);
  return sendJson(response, 405, { error: 'Method not allowed' });
});

server.listen(PORT, () => console.info(`Cura AI server listening on http://localhost:${PORT}`));