const express = require('express');
const db = require('../db');
const { requireAuth } = require('../auth');
const router = express.Router();

router.use(requireAuth);

// GET /api/bookmark  (milik pengguna yang masuk)
router.get('/', (req, res) => {
  const rows = db.prepare(`
    SELECT b.id AS bookmark_id, b.catatan, b.created_at AS disimpan_pada,
           l.*, k.nama AS kategori_nama, 1 AS tersimpan
    FROM bookmark b
    JOIN lomba l ON l.id = b.lomba_id
    JOIN kategori k ON k.id = l.kategori_id
    WHERE b.user_id = ?
    ORDER BY l.deadline ASC
  `).all(req.userId);
  res.json(rows);
});

// POST /api/bookmark  { lomba_id, catatan }
router.post('/', (req, res) => {
  const { lomba_id, catatan } = req.body;
  if (!lomba_id) return res.status(400).json({ error: 'lomba_id wajib diisi' });
  if (!db.prepare('SELECT id FROM lomba WHERE id = ?').get(lomba_id)) {
    return res.status(404).json({ error: 'Lomba tidak ditemukan' });
  }
  const ada = db.prepare('SELECT id FROM bookmark WHERE lomba_id = ? AND user_id = ?').get(lomba_id, req.userId);
  if (ada) {
    db.prepare('UPDATE bookmark SET catatan = ? WHERE id = ?').run(catatan || null, ada.id);
    return res.json({ message: 'Catatan bookmark diperbarui' });
  }
  const info = db.prepare('INSERT INTO bookmark (user_id, lomba_id, catatan) VALUES (?, ?, ?)')
    .run(req.userId, lomba_id, catatan || null);
  res.status(201).json({ id: Number(info.lastInsertRowid), lomba_id, catatan: catatan || null });
});

// DELETE /api/bookmark/:lomba_id
router.delete('/:lomba_id', (req, res) => {
  const info = db.prepare('DELETE FROM bookmark WHERE lomba_id = ? AND user_id = ?').run(req.params.lomba_id, req.userId);
  if (info.changes === 0) return res.status(404).json({ error: 'Bookmark tidak ditemukan' });
  res.json({ message: 'Bookmark dihapus' });
});

module.exports = router;
