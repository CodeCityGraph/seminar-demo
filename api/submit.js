// /api/submit.js

export default function handler(req, res) {
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

    if (formType === 'login') {
      if (!isValidEmail(parsed.email)) {
        return res.status(400).json({ error: 'invalid email' });
      }
      if (!isValidPassword(parsed.password)) {
        return res.status(400).json({ error: 'invalid password' });
      }
    } else if (formType === 'signup') {
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
    } else {
      if (!isAlpha(parsed.firstName)) {
        return res.status(400).json({ error: 'invalid first name' });
      }
      if (!isAlpha(parsed.lastName)) {
        return res.status(400).json({ error: 'invalid last name' });
      }
      if (!isValidEmail(parsed.email)) {
        return res.status(400).json({ error: 'invalid email' });
      }
    }

    if (parsed.fail500) {
      return res.status(500).json({ error: 'server error' });
    }

    return res.status(200).json({ success: true, received: parsed });
  }

  return res.status(405).end();
}