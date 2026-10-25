// Menggunakan SQLite bawaan Node.js (node:sqlite), butuh Node.js >= 22.5.
// Tidak ada paket native, jadi tidak perlu kompilasi / Visual Studio.
const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const fs = require('fs');

// Lokasi database: atur lewat DB_PATH (mis. /tmp/lombaradar.db di hosting serverless
// yang sistem filenya hanya-baca). Bawaan: data/lombaradar.db di akar repo.
const dbPath = process.env.DB_PATH || path.join(__dirname, '..', 'data', 'lombaradar.db');
if (dbPath !== ':memory:') fs.mkdirSync(path.dirname(dbPath), { recursive: true });
const db = new DatabaseSync(dbPath);
db.exec('PRAGMA foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS kategori (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nama TEXT NOT NULL UNIQUE
  );

  CREATE TABLE IF NOT EXISTS lomba (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    judul TEXT NOT NULL,
    penyelenggara TEXT NOT NULL,
    kategori_id INTEGER NOT NULL REFERENCES kategori(id),
    deskripsi TEXT,
    tingkat TEXT,
    mode TEXT,
    hadiah TEXT,
    biaya TEXT,
    deadline DATE NOT NULL,
    link_pendaftaran TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nama TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Migrasi: kolom peran pengguna dan pemilik lomba (untuk database versi lama).
const kolomDari = (t) => db.prepare(`PRAGMA table_info(${t})`).all().map((c) => c.name);
if (!kolomDari('users').includes('role')) db.exec("ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'mahasiswa'");
if (!kolomDari('lomba').includes('created_by')) db.exec('ALTER TABLE lomba ADD COLUMN created_by INTEGER REFERENCES users(id) ON DELETE SET NULL');

// Bookmark kini milik pengguna. Tabel versi lama (tanpa user_id) dibuat ulang.
const kolom = db.prepare('PRAGMA table_info(bookmark)').all();
if (kolom.length > 0 && !kolom.some((k) => k.name === 'user_id')) db.exec('DROP TABLE bookmark');

db.exec(`
  CREATE TABLE IF NOT EXISTS bookmark (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    lomba_id INTEGER NOT NULL REFERENCES lomba(id) ON DELETE CASCADE,
    catatan TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_id, lomba_id)
  );
`);

module.exports = db;
