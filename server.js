import http from 'http';
import { URL } from 'url';

const PORT = process.env.PORT || 3000;

function parseJSONBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => (body += chunk));
    req.on('end', () => {
      try {
        if (!body) return resolve({});
        const parsed = JSON.parse(body);
        resolve(parsed);
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

function validatePayload(formType, payload) {
  const required = {
    contact: ['firstName', 'lastName', 'email', 'message'],
    login: ['email', 'password'],
    signup: ['firstName', 'lastName', 'email', 'password'],
  };

  const fields = required[formType] || [];
  const missing = fields.filter((f) => !payload[f]);
  return missing;
}

const server = http.createServer(async (req, res) => {
  // Add CORS headers for cross-origin requests from the frontend
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }
  // Respond to Chrome DevTools optional manifest to silence 404 noise
  if (req.method === 'GET' && req.url === '/.well-known/appspecific/com.chrome.devtools.json') {
    res.statusCode = 204;
    res.setHeader('Content-Type', 'application/json');
    // return an empty JSON body (DevTools treats this as absence of app config)
    res.end('{}');
    return;
  }
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (req.method === 'POST' && url.pathname === '/submit') {
    try {
      const payload = await parseJSONBody(req);
      const formType = payload.formType || 'contact';

      // Simulate a 500 server error when email contains 'servererror'
      if (payload.email && String(payload.email).includes('servererror')) {
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'Internal server error (simulated)' }));
        return;
      }

      // Simulate a 404 when email contains 'notfound'
      if (payload.email && String(payload.email).includes('notfound')) {
        res.statusCode = 404;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'Resource not found (simulated)' }));
        return;
      }

      // Validate required fields
      const missing = validatePayload(formType, payload);
      if (missing.length > 0) {
        res.statusCode = 400;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'Missing fields', missing }));
        return;
      }

      // All good
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ status: 'ok' }));
    } catch (err) {
      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Invalid JSON' }));
    }
    return;
  }

  // Fallback for other routes
  res.statusCode = 404;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({ error: 'Not found' }));
});

server.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Server running on http://localhost:${PORT}`);
});
