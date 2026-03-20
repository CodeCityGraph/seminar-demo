const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = Number(process.env.PORT || 3000);
const STATIC_DIR = path.resolve(process.env.STATIC_DIR || process.cwd());

const isAlpha = (s) => typeof s === 'string' && /^[A-Za-z]+$/.test(s);
const isValidEmail = (em) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em || '');
const isValidPassword = (pw) =>
  typeof pw === 'string' &&
  pw.length >= 8 &&
  pw.length <= 20 &&
  /[a-z]/.test(pw) &&
  /[A-Z]/.test(pw) &&
  /[^A-Za-z0-9]/.test(pw);

function validatePayload(parsed) {
  const formType = parsed.formType || 'contact';

  if (formType === 'login') {
    if (!isValidEmail(parsed.email)) return { ok: false, code: 400, error: 'invalid email' };
    if (!isValidPassword(parsed.password)) return { ok: false, code: 400, error: 'invalid password' };
  } else if (formType === 'signup') {
    if (!isAlpha(parsed.firstName)) return { ok: false, code: 400, error: 'invalid first name' };
    if (!isAlpha(parsed.lastName)) return { ok: false, code: 400, error: 'invalid last name' };
    if (!isValidEmail(parsed.email)) return { ok: false, code: 400, error: 'invalid email' };
    if (!isValidPassword(parsed.password)) return { ok: false, code: 400, error: 'invalid password' };
  } else {
    if (!isAlpha(parsed.firstName)) return { ok: false, code: 400, error: 'invalid first name' };
    if (!isAlpha(parsed.lastName)) return { ok: false, code: 400, error: 'invalid last name' };
    if (!isValidEmail(parsed.email)) return { ok: false, code: 400, error: 'invalid email' };
  }

  if (parsed.fail500) return { ok: false, code: 500, error: 'server error' };

  return { ok: true, code: 200, body: { success: true, received: parsed } };
}

function sendJson(res, code, body) {
  const json = JSON.stringify(body);
  res.writeHead(code, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(json),
  });
  res.end(json);
}

function contentTypeFor(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.html') return 'text/html; charset=utf-8';
  if (ext === '.css') return 'text/css; charset=utf-8';
  if (ext === '.js') return 'application/javascript; charset=utf-8';
  if (ext === '.json') return 'application/json; charset=utf-8';
  if (ext === '.svg') return 'image/svg+xml';
  if (ext === '.png') return 'image/png';
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg';
  return 'application/octet-stream';
}

function serveStatic(reqPath, res) {
  const safePath = reqPath === '/' ? '/index.html' : reqPath;
  const absPath = path.resolve(path.join(STATIC_DIR, `.${safePath}`));

  if (!absPath.startsWith(STATIC_DIR)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  fs.readFile(absPath, (err, data) => {
    if (err) {
      if (safePath !== '/index.html') {
        const fallback = path.join(STATIC_DIR, 'index.html');
        fs.readFile(fallback, (fallbackErr, fallbackData) => {
          if (fallbackErr) {
            res.writeHead(404);
            res.end('Not found');
            return;
          }
          res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
          res.end(fallbackData);
        });
        return;
      }
      res.writeHead(404);
      res.end('Not found');
      return;
    }

    res.writeHead(200, { 'Content-Type': contentTypeFor(absPath) });
    res.end(data);
  });
}

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url || '/', true);
  const pathname = parsedUrl.pathname || '/';

  if ((pathname === '/api/submit' || pathname === '/submit') && req.method === 'POST') {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => {
      let payload = {};
      try {
        const raw = Buffer.concat(chunks).toString('utf-8').trim();
        payload = raw ? JSON.parse(raw) : {};
      } catch {
        sendJson(res, 400, { error: 'invalid json' });
        return;
      }

      const result = validatePayload(payload);
      if (!result.ok) {
        sendJson(res, result.code, { error: result.error });
        return;
      }
      sendJson(res, 200, result.body);
    });
    return;
  }

  if ((pathname === '/api/submit' || pathname === '/submit') && req.method !== 'POST') {
    res.writeHead(405);
    res.end();
    return;
  }

  serveStatic(pathname, res);
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`mock-api server running at http://127.0.0.1:${PORT}`);
  console.log(`serving static files from: ${STATIC_DIR}`);
});
