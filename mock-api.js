import http from 'http';
import fs from 'fs';
import path from 'path';

const port = 3000;
const root = process.cwd();

function contentTypeFor(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case '.html': return 'text/html; charset=utf-8';
    case '.js': return 'application/javascript; charset=utf-8';
    case '.css': return 'text/css; charset=utf-8';
    case '.json': return 'application/json; charset=utf-8';
    case '.png': return 'image/png';
    case '.jpg': case '.jpeg': return 'image/jpeg';
    case '.svg': return 'image/svg+xml';
    case '.txt': return 'text/plain; charset=utf-8';
    default: return 'application/octet-stream';
  }
}

const server = http.createServer((req, res) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    });
    return res.end();
  }

  // API route: POST /submit
  if (req.method === 'POST' && req.url === '/submit') {
    let body = '';
    req.on('data', (chunk) => (body += chunk));
    req.on('end', () => {
      let parsed = {};
      try { parsed = JSON.parse(body || '{}'); } catch (e) { /* ignore */ }

      // Basic server-side validation depending on form type
      const formType = parsed.formType || 'contact';
      const isAlpha = (s) => typeof s === 'string' && /^[A-Za-z]+$/.test(s);
      const isValidEmail = (em) => {
        if (!em || typeof em !== 'string') return false;
        // simple RFC-lite check
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em);
      };

      if (formType === 'login') {
        // For login, only require a valid email and a password
        if (!isValidEmail(parsed.email)) {
          res.writeHead(400, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
          return res.end(JSON.stringify({ error: 'invalid email' }));
        }
        if (!parsed.password || typeof parsed.password !== 'string' || parsed.password.length < 8) {
          res.writeHead(400, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
          return res.end(JSON.stringify({ error: 'invalid password' }));
        }
      } else {
        // contact/signup: require names and a valid email
        if (!parsed.firstName || !isAlpha(parsed.firstName)) {
          res.writeHead(400, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
          return res.end(JSON.stringify({ error: 'invalid first name' }));
        }
        if (!parsed.lastName || !isAlpha(parsed.lastName)) {
          res.writeHead(400, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
          return res.end(JSON.stringify({ error: 'invalid last name' }));
        }
        if (!isValidEmail(parsed.email)) {
          res.writeHead(400, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
          return res.end(JSON.stringify({ error: 'invalid email' }));
        }
      }

      if (parsed && parsed.fail500) {
        res.writeHead(500, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        return res.end(JSON.stringify({ error: 'server error' }));
      }
      if (parsed && parsed.bad) {
        res.writeHead(400, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        return res.end(JSON.stringify({ error: 'validation' }));
      }

      res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
      res.end(JSON.stringify({ success: true, received: parsed }));
    });
    return;
  }

  // Serve static files for GET requests
  if (req.method === 'GET') {
    let urlPath = decodeURIComponent(req.url.split('?')[0]);
    if (urlPath === '/') urlPath = '/index.html';
    const fsPath = path.join(root, urlPath.replace(/^\//, ''));

    fs.stat(fsPath, (err, stats) => {
      if (!err && stats.isFile()) {
        const stream = fs.createReadStream(fsPath);
        res.writeHead(200, { 'Content-Type': contentTypeFor(fsPath) });
        stream.pipe(res);
      } else {
        // fallback to index.html for SPA routes
        const indexPath = path.join(root, 'index.html');
        fs.readFile(indexPath, (rErr, data) => {
          if (rErr) {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('Not found');
            return;
          }
          res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
          res.end(data);
        });
      }
    });
    return;
  }

  res.writeHead(405, { 'Content-Type': 'text/plain' });
  res.end('Method not allowed');
});

server.listen(port, () => console.log(`Mock API + static server listening on http://localhost:${port}`));
