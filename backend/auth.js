// Autentikasi tanpa paket tambahan: scrypt untuk kata sandi, token bertanda tangan HMAC.
const crypto = require('crypto');
const db = require('./db');

const SECRET = process.env.JWT_SECRET || 'ganti-rahasia-ini-saat-deploy';
const MASA_BERLAKU = 7 * 24 * 60 * 60 * 1000; // 7 hari

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password, tersimpan) {
  const [salt, hash] = String(tersimpan).split(':');
  if (!salt || !hash) return false;
  const a = Buffer.from(hash, 'hex');
  const b = crypto.scryptSync(password, salt, 64);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

const tanda = (body) => crypto.createHmac('sha256', SECRET).update(body).digest('base64url');

function signToken(payload) {
  const body = Buffer.from(JSON.stringify({ ...payload, exp: Date.now() + MASA_BERLAKU })).toString('base64url');
  return `${body}.${tanda(body)}`;
}

function readToken(token) {
  if (!token) return null;
  const [body, sig] = token.split('.');
  if (!body || !sig) return null;
  const a = Buffer.from(sig);
  const b = Buffer.from(tanda(body));
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const data = JSON.parse(Buffer.from(body, 'base64url').toString());
    return data.exp > Date.now() ? data : null;
  } catch {
    return null;
  }
}

function optionalAuth(req, res, next) {
  const h = req.headers.authorization || '';
  const data = readToken(h.startsWith('Bearer ') ? h.slice(7) : null);
  req.userId = null;
  req.role = null;
  if (data) {
    const u = db.prepare('SELECT id, role FROM users WHERE id = ?').get(data.id);
    if (u) {
      req.userId = u.id;
      req.role = u.role;
    }
  }
  next();
}

function requireAuth(req, res, next) {
  if (!req.userId) return res.status(401).json({ error: 'Silakan masuk terlebih dahulu' });
  next();
}

module.exports = { hashPassword, verifyPassword, signToken, optionalAuth, requireAuth };
