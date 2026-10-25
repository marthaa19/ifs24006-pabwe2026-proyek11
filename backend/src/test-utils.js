// Fungsi bantu bersama untuk pengujian back-end.
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

export const db = require('./db.js');
export const auth = require('./auth.js');

export async function mulaiServer() {
  const app = require('./server.js');
  const server = await new Promise((resolve) => {
    const s = app.listen(0, () => resolve(s));
  });
  const base = `http://127.0.0.1:${server.address().port}`;
  return { server, base };
}

export function tutupServer(server) {
  return new Promise((resolve) => server.close(resolve));
}

// Klien kecil untuk memanggil API: kembali { status, data }
export function buatKlien(base) {
  return async function panggil(method, path, { body, token } = {}) {
    const headers = {};
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    if (token) headers.Authorization = `Bearer ${token}`;
    const res = await fetch(`${base}/api${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    let data = null;
    try {
      data = await res.json();
    } catch {
      /* respons kosong */
    }
    return { status: res.status, data };
  };
}

export async function daftarAkun(panggil, nama, email, password = 'rahasia123') {
  const { data } = await panggil('POST', '/auth/register', { body: { nama, email, password } });
  return data; // { token, user }
}

export function jadikanAdmin(userId) {
  db.prepare("UPDATE users SET role = 'admin' WHERE id = ?").run(userId);
}

// Tanggal YYYY-MM-DD relatif terhadap hari ini (UTC, sama dengan date('now') di SQLite)
export function tanggal(offsetHari) {
  const d = new Date(Date.now() + offsetHari * 86400000);
  return d.toISOString().slice(0, 10);
}

export function tambahKategori(nama) {
  return Number(db.prepare('INSERT INTO kategori (nama) VALUES (?)').run(nama).lastInsertRowid);
}

export function tambahLomba(o) {
  const info = db.prepare(`
    INSERT INTO lomba (judul, penyelenggara, kategori_id, deskripsi, tingkat, mode, hadiah, biaya, deadline, link_pendaftaran, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    o.judul, o.penyelenggara || 'Panitia', o.kategori_id, o.deskripsi || null, o.tingkat || null,
    o.mode || null, o.hadiah || null, o.biaya || null, o.deadline, o.link || null, o.created_by ?? null,
  );
  return Number(info.lastInsertRowid);
}
