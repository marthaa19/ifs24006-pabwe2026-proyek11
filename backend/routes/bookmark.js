const express = require('express');
const db = require('../db');
const router = express.Router();

// GET /api/bookmark
router.get('/', (req, res) => {
  const rows = db.prepare(`
    SELECT b.id AS bookmark_id, b.catatan, b.created_at AS disimpan_pada,
           l.*, k.nama AS kategori_nama, 1 AS tersimpan
    FROM bookmark b
    JOIN lomba l ON l.id = b.lomba_id
    JOIN kategori k ON k.id = l.kategori_id
    ORDER BY l.deadline ASC
  `).all();
  res.json(rows);
});

// POST /api/bookmark  { lomba_id, catatan }
router.post('/', (req, res) => {
  const { lomba_id, catatan } = req.body;
  if (!lomba_id) return res.status(400).json({ error: 'lomba_id wajib diisi' });
  const lomba = db.prepare('SELECT id FROM lomba WHERE id = ?').get(lomba_id);
  if (!lomba) return res.status(404).json({ error: 'Lomba tidak ditemukan' });

  const ada = db.prepare('SELECT id FROM bookmark WHERE lomba_id = ?').get(lomba_id);
  if (ada) {
    db.prepare('UPDATE bookmark SET catatan = ? WHERE lomba_id = ?').run(catatan || null, lomba_id);
    return res.json({ message: 'Catatan bookmark diperbarui' });
  }
  const info = db.prepare('INSERT INTO bookmark (lomba_id, catatan) VALUES (?, ?)').run(lomba_id, catatan || null);
  res.status(201).json({ id: info.lastInsertRowid, lomba_id, catatan: catatan || null });
});

// DELETE /api/bookmark/:lomba_id
router.delete('/:lomba_id', (req, res) => {
  const info = db.prepare('DELETE FROM bookmark WHERE lomba_id = ?').run(req.params.lomba_id);
  if (info.changes === 0) return res.status(404).json({ error: 'Bookmark tidak ditemukan' });
  res.json({ message: 'Bookmark dihapus' });
});

module.exports = router;
