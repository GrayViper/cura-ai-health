const MAX_QUERY_LENGTH = 240;
const RATE_LIMIT = Number(process.env.SEARCH_RATE_LIMIT || 30);
const RATE_WINDOW_MS = 60 * 1000;
const requestLog = new Map();

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

function getClientIp(req) {
  const headers = req && req.headers ? req.headers : {};
  const forwardedFor = Array.isArray(headers['x-forwarded-for'])
    ? headers['x-forwarded-for'][0]
    : headers['x-forwarded-for'];
  if (forwardedFor) return String(forwardedFor).split(',')[0].trim();
  if (req && req.socket && req.socket.remoteAddress) return req.socket.remoteAddress;
  return 'unknown';
}

function isRateLimited(ip) {
  const now = Date.now();
  const recent = (requestLog.get(ip) || []).filter(time => now - time < RATE_WINDOW_MS);
  recent.push(now);
  requestLog.set(ip, recent);
  return recent.length > RATE_LIMIT;
}

function sendJson(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(body));
}

function sendPlainText(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.end(body);
}

async function handleSearch(req, res) {
  const url = new URL(req.url, 'https://example.com');
  const query = sanitizeQuery(url.searchParams.get('q'));
  const sources = (url.searchParams.get('sources') || 'pubmed,nih,who,cdc')
    .split(',')
    .map(source => source.trim().toLowerCase())
    .filter(Boolean)
    .slice(0, 4);

  if (!query) return sendJson(res, 400, { error: 'A non-empty search query is required.' });
  if (isRateLimited(getClientIp(req))) {
    return sendJson(res, 429, { error: 'Search rate limit exceeded. Try again shortly.' });
  }

  const domains = allowedDomains(sources);
  const upstream = new URL(process.env.SEARXNG_URL || 'http://127.0.0.1:8888/search');
  upstream.searchParams.set('q', domains.length ? `${query} (${domains.map(domain => `site:${domain}`).join(' OR ')})` : query);
  upstream.searchParams.set('format', 'json');

  try {
    const upstreamResponse = await fetch(upstream);
    if (!upstreamResponse.ok) throw new Error(`SearXNG returned HTTP ${upstreamResponse.status}`);
    const data = await upstreamResponse.json();
    return sendJson(res, 200, {
      query,
      sources,
      results: normalizeResults(data),
      disclaimer: 'Search results are educational references. A qualified clinician must review them before clinical use.'
    });
  } catch (error) {
    return sendJson(res, 502, { error: 'Medical search is temporarily unavailable.' });
  }
}

async function handleSemanticSearch(req, res) {
  const url = new URL(req.url, 'https://example.com');
  const query = sanitizeQuery(url.searchParams.get('q'));
  const semanticEndpoint = process.env.SEMANTIC_ENDPOINT || '';

  if (!query) return sendJson(res, 400, { error: 'A non-empty search query is required.' });
  if (!semanticEndpoint) return sendJson(res, 503, { error: 'Semantic search is disabled for this deployment.' });
  if (isRateLimited(`semantic:${getClientIp(req)}`)) {
    return sendJson(res, 429, { error: 'Semantic search quota exceeded. Try again shortly.' });
  }

  try {
    const semanticResponse = await fetch(semanticEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(process.env.SEMANTIC_API_KEY ? { Authorization: `Bearer ${process.env.SEMANTIC_API_KEY}` } : {})
      },
      body: JSON.stringify({ query, maxTokens: 500 })
    });
    if (!semanticResponse.ok) throw new Error(`Semantic provider returned HTTP ${semanticResponse.status}`);
    const data = await semanticResponse.json();
    return sendJson(res, 200, {
      query,
      summary: String(data.summary || data.text || data.output || '').slice(0, 3000),
      provenance: Array.isArray(data.provenance) ? data.provenance : [],
      disclaimer: 'Semantic output is an educational aid and requires human clinical review.'
    });
  } catch (error) {
    return sendJson(res, 502, { error: 'Semantic search is temporarily unavailable.' });
  }
}

function handleHealth(req, res) {
  sendJson(res, 200, { status: 'healthy' });
}

function handleMetrics(req, res) {
  const metrics = [
    '# HELP cura_http_requests_total Total HTTP requests received by the Cura application.',
    '# TYPE cura_http_requests_total counter',
    `cura_http_requests_total 0`,
    '# HELP cura_process_uptime_seconds Process uptime in seconds.',
    '# TYPE cura_process_uptime_seconds gauge',
    `cura_process_uptime_seconds ${process.uptime()}`
  ].join('\n');
  sendPlainText(res, 200, `${metrics}\n`);
}

module.exports = {
  sanitizeQuery,
  allowedDomains,
  normalizeResults,
  getClientIp,
  isRateLimited,
  sendJson,
  sendPlainText,
  handleSearch,
  handleSemanticSearch,
  handleHealth,
  handleMetrics
};
