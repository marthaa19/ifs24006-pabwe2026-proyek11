const express = require('express');
const db = require('../db');
const { hashPassword, verifyPassword, signToken, requireAuth } = require('../auth');
const router = express.Router();

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const publik = (u) => ({ id: u.id, nama: u.nama, email: u.email, role: u.role });

// POST /api/auth/register  { nama, email, password }
router.post('/register', (req, res) => {
  const nama = String(req.body.nama || '').trim();
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');
  if (nama.length < 2) return res.status(400).json({ error: 'Nama minimal 2 karakter' });
  if (!EMAIL.test(email)) return res.status(400).json({ error: 'Format email tidak valid' });
  if (password.length < 6) return res.status(400).json({ error: 'Kata sandi minimal 6 karakter' });
  if (db.prepare('SELECT id FROM users WHERE email = ?').get(email)) {
    return res.status(409).json({ error: 'Email sudah terdaftar' });
  }
  const info = db.prepare('INSERT INTO users (nama, email, password_hash) VALUES (?, ?, ?)')
    .run(nama, email, hashPassword(password));
  const user = { id: Number(info.lastInsertRowid), nama, email, role: 'mahasiswa' };
  res.status(201).json({ token: signToken({ id: user.id }), user });
});

// POST /api/auth/login  { email, password }
router.post('/login', (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');
  const u = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!u || !verifyPassword(password, u.password_hash)) {
    return res.status(401).json({ error: 'Email atau kata sandi salah' });
  }
  res.json({ token: signToken({ id: u.id }), user: publik(u) });
});

// GET /api/auth/me
router.get('/me', requireAuth, (req, res) => {
  const u = db.prepare('SELECT id, nama, email, role FROM users WHERE id = ?').get(req.userId);
  if (!u) return res.status(401).json({ error: 'Akun tidak ditemukan' });
  res.json(u);
});

module.exports = router;
