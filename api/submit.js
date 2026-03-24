// /api/submit.js

import { randomBytes, scryptSync, timingSafeEqual } from 'crypto';
import { MongoClient } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB = process.env.MONGODB_DB || 'seminar_demo';
const USERS_COLLECTION = process.env.MONGODB_USERS_COLLECTION || 'users';

let cachedClient;
let cachedDb;

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
    throw new Error('Missing MONGODB_URI secret');
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

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const parsed = req.body || {};

    const formType = parsed.formType || 'contact';

    const isAlpha = (s) => typeof s === 'string' && /^[A-Za-z]+$/.test(s);
    const isValidEmail = (em) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em || '');
    const isValidPassword = (pw) =>
      pw &&
      pw.length >= 8 &&
      pw.length <= 20 &&
      /[a-z]/.test(pw) &&
      /[A-Z]/.test(pw) &&
      /[^A-Za-z0-9]/.test(pw);

    const emailLower = normalizeEmail(parsed.email);

    try {
      if (formType === 'login') {
        if (!isValidEmail(parsed.email)) {
          return res.status(400).json({ error: 'invalid email' });
        }
        if (!isValidPassword(parsed.password)) {
          return res.status(400).json({ error: 'invalid password' });
        }

        const users = await getUsersCollection();
        const existingUser = await users.findOne({ emailLower });
        if (!existingUser || !isPasswordMatch(parsed.password, existingUser.passwordHash)) {
          return res.status(401).json({ error: 'invalid credentials' });
        }

        return res.status(200).json({ success: true, message: 'logged in' });
      }

      if (formType === 'signup') {
        if (!isAlpha(parsed.firstName)) {
          return res.status(400).json({ error: 'invalid first name' });
        }
        if (!isAlpha(parsed.lastName)) {
          return res.status(400).json({ error: 'invalid last name' });
        }
        if (!isValidEmail(parsed.email)) {
          return res.status(400).json({ error: 'invalid email' });
        }
        if (!isValidPassword(parsed.password)) {
          return res.status(400).json({ error: 'invalid password' });
        }

        const users = await getUsersCollection();
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
          if (err && err.code === 11000) {
            return res.status(409).json({ error: 'user already exists' });
          }
          throw err;
        }

        return res.status(200).json({ success: true, message: 'account created' });
      }

      if (!isAlpha(parsed.firstName)) {
        return res.status(400).json({ error: 'invalid first name' });
      }
      if (!isAlpha(parsed.lastName)) {
        return res.status(400).json({ error: 'invalid last name' });
      }
      if (!isValidEmail(parsed.email)) {
        return res.status(400).json({ error: 'invalid email' });
      }

      if (parsed.fail500) {
        return res.status(500).json({ error: 'server error' });
      }

      return res.status(200).json({ success: true, received: parsed });
    } catch (err) {
      console.error('submit handler error', err);
      return res.status(500).json({ error: 'server error' });
    }
  }

  return res.status(405).end();
}