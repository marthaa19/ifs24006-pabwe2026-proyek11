const express = require('express');
const db = require('../db');
const router = express.Router();

// GET /api/kategori
router.get('/', (req, res) => {
  const rows = db.prepare('SELECT id, nama FROM kategori ORDER BY nama').all();
  res.json(rows);
});

// POST /api/kategori
router.post('/', (req, res) => {
  const nama = (req.body.nama || '').trim();
  if (!nama) return res.status(400).json({ error: 'Nama kategori wajib diisi' });
  try {
    const info = db.prepare('INSERT INTO kategori (nama) VALUES (?)').run(nama);
    res.status(201).json({ id: info.lastInsertRowid, nama });
  } catch (e) {
    if (String(e.message).includes('UNIQUE')) {
      return res.status(409).json({ error: 'Kategori sudah ada' });
    }
    res.status(500).json({ error: 'Gagal menambah kategori' });
  }
});

module.exports = router;
