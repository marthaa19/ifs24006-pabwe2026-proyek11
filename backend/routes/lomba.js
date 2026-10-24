const express = require('express');
const db = require('../db');
const { requireAuth } = require('../auth');
const router = express.Router();

const selectLomba = (uid) => `
  SELECT l.*, k.nama AS kategori_nama,
         CASE WHEN b.id IS NULL THEN 0 ELSE 1 END AS tersimpan
  FROM lomba l
  JOIN kategori k ON k.id = l.kategori_id
  LEFT JOIN bookmark b ON b.lomba_id = l.id AND b.user_id = ${Number(uid) || 0}
`;

function validasi(body) {
  const wajib = ['judul', 'penyelenggara', 'kategori_id', 'deadline'];
  const kurang = wajib.filter((f) => !body[f] || String(body[f]).trim() === '');
  if (kurang.length) return `Field wajib diisi: ${kurang.join(', ')}`;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(body.deadline)) return 'Format deadline harus YYYY-MM-DD';
  const kat = db.prepare('SELECT id FROM kategori WHERE id = ?').get(body.kategori_id);
  if (!kat) return 'kategori_id tidak ditemukan';
  return null;
}

// GET /api/lomba?kategori=&q=&status=aktif|lewat&tingkat=&sort=deadline|terbaru
router.get('/', (req, res) => {
  const { kategori, q, status, tingkat, sort } = req.query;
  const where = [];
  const params = [];

  if (kategori) { where.push('l.kategori_id = ?'); params.push(kategori); }
  if (tingkat) { where.push('l.tingkat = ?'); params.push(tingkat); }
  if (q) {
    where.push('(l.judul LIKE ? OR l.penyelenggara LIKE ? OR l.deskripsi LIKE ?)');
    params.push(`%${q}%`, `%${q}%`, `%${q}%`);
  }
  if (status === 'aktif') where.push("l.deadline >= date('now')");
  if (status === 'lewat') where.push("l.deadline < date('now')");

  let sql = selectLomba(req.userId);
  if (where.length) sql += ' WHERE ' + where.join(' AND ');
  sql += sort === 'terbaru' ? ' ORDER BY l.created_at DESC, l.id DESC' : ' ORDER BY l.deadline ASC';

  res.json(db.prepare(sql).all(...params));
});

// GET /api/lomba/:id
router.get('/:id', (req, res) => {
  const row = db.prepare(selectLomba(req.userId) + ' WHERE l.id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Lomba tidak ditemukan' });
  res.json(row);
});

// Admin boleh mengelola semua lomba; pengguna lain hanya lomba yang ia tambahkan sendiri.
const bolehKelola = (req, row) => req.role === 'admin' || (row.created_by != null && row.created_by === req.userId);

// POST /api/lomba
router.post('/', requireAuth, (req, res) => {
  const err = validasi(req.body);
  if (err) return res.status(400).json({ error: err });
  const b = req.body;
  const info = db.prepare(`
    INSERT INTO lomba (judul, penyelenggara, kategori_id, deskripsi, tingkat, mode, hadiah, biaya, deadline, link_pendaftaran, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(b.judul, b.penyelenggara, b.kategori_id, b.deskripsi || null, b.tingkat || null,
         b.mode || null, b.hadiah || null, b.biaya || null, b.deadline, b.link_pendaftaran || null, req.userId);
  const row = db.prepare(selectLomba(req.userId) + ' WHERE l.id = ?').get(info.lastInsertRowid);
  res.status(201).json(row);
});

// PUT /api/lomba/:id
router.put('/:id', requireAuth, (req, res) => {
  const ada = db.prepare('SELECT id, created_by FROM lomba WHERE id = ?').get(req.params.id);
  if (!ada) return res.status(404).json({ error: 'Lomba tidak ditemukan' });
  if (!bolehKelola(req, ada)) return res.status(403).json({ error: 'Kamu hanya bisa mengubah lomba yang kamu tambahkan' });
  const err = validasi(req.body);
  if (err) return res.status(400).json({ error: err });
  const b = req.body;
  db.prepare(`
    UPDATE lomba SET judul=?, penyelenggara=?, kategori_id=?, deskripsi=?, tingkat=?, mode=?,
                     hadiah=?, biaya=?, deadline=?, link_pendaftaran=?
    WHERE id = ?
  `).run(b.judul, b.penyelenggara, b.kategori_id, b.deskripsi || null, b.tingkat || null,
         b.mode || null, b.hadiah || null, b.biaya || null, b.deadline, b.link_pendaftaran || null,
         req.params.id);
  res.json(db.prepare(selectLomba(req.userId) + ' WHERE l.id = ?').get(req.params.id));
});

// DELETE /api/lomba/:id
router.delete('/:id', requireAuth, (req, res) => {
  const ada = db.prepare('SELECT id, created_by FROM lomba WHERE id = ?').get(req.params.id);
  if (!ada) return res.status(404).json({ error: 'Lomba tidak ditemukan' });
  if (!bolehKelola(req, ada)) return res.status(403).json({ error: 'Kamu hanya bisa menghapus lomba yang kamu tambahkan' });
  db.prepare('DELETE FROM lomba WHERE id = ?').run(req.params.id);
  res.json({ message: 'Lomba dihapus' });
});

module.exports = router;
