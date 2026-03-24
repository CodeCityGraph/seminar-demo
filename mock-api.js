const http = require('http');
const { randomBytes, scryptSync, timingSafeEqual } = require('crypto');
const fs = require('fs');
const { MongoClient } = require('mongodb');
const path = require('path');
const url = require('url');

const PORT = Number(process.env.PORT || 3000);
const STATIC_DIR = path.resolve(process.env.STATIC_DIR || process.cwd());
const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB = process.env.MONGODB_DB || 'seminar_demo';
const USERS_COLLECTION = process.env.MONGODB_USERS_COLLECTION || 'users';

let cachedClient;
let cachedDb;

const isAlpha = (s) => typeof s === 'string' && /^[A-Za-z]+$/.test(s);
const isValidEmail = (em) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em || '');
const isValidPassword = (pw) =>
  typeof pw === 'string' &&
  pw.length >= 8 &&
  pw.length <= 20 &&
  /[a-z]/.test(pw) &&
  /[A-Z]/.test(pw) &&
  /[^A-Za-z0-9]/.test(pw);

const normalizeEmail = (email) => String(email || '').trim().toLowerCase();

const toPasswordHash = (password) => {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
};

const isPasswordMatch = (password, storedHash) => {
  if (typeof storedHash !== 'string' || !storedHash.includes(':')) {
    return false;
  }

  const [salt, hashHex] = storedHash.split(':');
  const candidate = scryptSync(password, salt, 64).toString('hex');
  const hashBuf = Buffer.from(hashHex, 'hex');
  const candidateBuf = Buffer.from(candidate, 'hex');

  if (hashBuf.length !== candidateBuf.length) {
    return false;
  }

  return timingSafeEqual(hashBuf, candidateBuf);
};

async function getUsersCollection() {
  if (!MONGODB_URI) {
    return null;
  }

  if (!cachedDb) {
    const client = cachedClient || new MongoClient(MONGODB_URI);
    try {
      await client.connect();
      cachedClient = client;
      cachedDb = client.db(MONGODB_DB);
    } catch (err) {
      cachedClient = undefined;
      cachedDb = undefined;
      throw err;
    }
  }

  const users = cachedDb.collection(USERS_COLLECTION);
  await users.createIndex({ emailLower: 1 }, { unique: true });
  return users;
}

async function validatePayload(parsed) {
  const formType = parsed.formType || 'contact';
  const emailLower = normalizeEmail(parsed.email);

  if (formType === 'login') {
    if (!isValidEmail(parsed.email)) return { ok: false, code: 400, error: 'invalid email' };
    if (!isValidPassword(parsed.password)) return { ok: false, code: 400, error: 'invalid password' };

    const users = await getUsersCollection();
    if (users) {
      const existingUser = await users.findOne({ emailLower });
      if (!existingUser || !isPasswordMatch(parsed.password, existingUser.passwordHash)) {
        return { ok: false, code: 401, error: 'invalid credentials' };
      }
    }
  } else if (formType === 'signup') {
    if (!isAlpha(parsed.firstName)) return { ok: false, code: 400, error: 'invalid first name' };
    if (!isAlpha(parsed.lastName)) return { ok: false, code: 400, error: 'invalid last name' };
    if (!isValidEmail(parsed.email)) return { ok: false, code: 400, error: 'invalid email' };
    if (!isValidPassword(parsed.password)) return { ok: false, code: 400, error: 'invalid password' };

    const users = await getUsersCollection();
    if (users) {
      try {
        await users.insertOne({
          firstName: parsed.firstName,
          lastName: parsed.lastName,
          email: parsed.email,
          emailLower,
          passwordHash: toPasswordHash(parsed.password),
          createdAt: new Date(),
        });
      } catch (err) {
        if (err && err.code === 11000) return { ok: false, code: 409, error: 'user already exists' };
        throw err;
      }
    }
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

      validatePayload(payload)
        .then((result) => {
          if (!result.ok) {
            sendJson(res, result.code, { error: result.error });
            return;
          }
          sendJson(res, 200, result.body);
        })
        .catch((err) => {
          console.error('mock submit handler error', err);
          sendJson(res, 500, { error: 'server error' });
        });
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
