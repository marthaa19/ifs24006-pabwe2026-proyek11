// Menggunakan SQLite bawaan Node.js (node:sqlite), butuh Node.js >= 22.5.
// Tidak ada paket native, jadi tidak perlu kompilasi / Visual Studio.
const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const fs = require('fs');

const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const dbPath = process.env.DB_PATH || path.join(dataDir, 'lombaradar.db');
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

  CREATE TABLE IF NOT EXISTS bookmark (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    lomba_id INTEGER NOT NULL UNIQUE REFERENCES lomba(id) ON DELETE CASCADE,
    catatan TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

module.exports = db;
