// Integration test REST API (Express + SQLite sementara). Memakai fetch bawaan Node.
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { siapkanDb, tanggal, mulaiServer } = require('./helpers');

const dir = siapkanDb();
// Folder front-end tiruan agar server menyajikan index.html untuk alamat berbasis path.
const distUji = fs.mkdtempSync(path.join(os.tmpdir(), 'dist-uji-'));
fs.writeFileSync(path.join(distUji, 'index.html'), '<!doctype html><html><body><div id="root"></div></body></html>');
process.env.FRONTEND_DIST = distUji;
const app = require('../server');
const db = require('../db');
const { hashPassword } = require('../auth');

let s; // { req, tutup }
let katProg;
let katDesain;
let adminToken;
let andiToken;
let budiToken;
let lombaAndi; // id lomba milik Andi

const lombaValid = (o = {}) => ({
  judul: 'Lomba Uji',
  penyelenggara: 'Panitia',
  kategori_id: katProg,
  deadline: tanggal(10),
  ...o,
});

before(async () => {
  s = await mulaiServer(app);
  katProg = Number(db.prepare("INSERT INTO kategori (nama) VALUES ('Programming')").run().lastInsertRowid);
  katDesain = Number(db.prepare("INSERT INTO kategori (nama) VALUES ('UI/UX')").run().lastInsertRowid);
  db.prepare("INSERT INTO users (nama, email, password_hash, role) VALUES ('Admin', 'admin@uji.id', ?, 'admin')").run(hashPassword('admin123'));

  adminToken = (await s.req('POST', '/api/auth/login', { body: { email: 'admin@uji.id', password: 'admin123' } })).body.token;
  andiToken = (await s.req('POST', '/api/auth/register', { body: { nama: 'Andi', email: 'andi@uji.id', password: 'andi123' } })).body.token;
  budiToken = (await s.req('POST', '/api/auth/register', { body: { nama: 'Budi', email: 'budi@uji.id', password: 'budi123' } })).body.token;
});

after(async () => {
  await s.tutup();
  db.close();
  fs.rmSync(dir, { recursive: true, force: true });
});

describe('Status API dan 404', () => {
  test('GET /api mengembalikan status ok', async () => {
    const r = await s.req('GET', '/api');
    assert.equal(r.status, 200);
    assert.deepEqual(r.body, { nama: 'LombaRadar API', status: 'ok' });
  });

  test('endpoint tidak dikenal mengembalikan 404 JSON', async () => {
    const r = await s.req('GET', '/api/tidak-ada');
    assert.equal(r.status, 404);
    assert.ok(r.body.error);
  });
});

describe('Halaman /auth/login dan /auth/register', () => {
  for (const alamat of ['/auth/login', '/auth/register']) {
    test(`GET ${alamat} → 200 index.html tanpa redirect`, async () => {
      const res = await fetch(s.base + alamat, { redirect: 'manual' });
      assert.equal(res.status, 200);
      assert.match(res.headers.get('content-type'), /text\/html/);
      assert.match(await res.text(), /id="root"/);
    });
  }

  test('alamat /api yang tidak ada tetap 404 JSON, bukan index.html', async () => {
    const r = await s.req('GET', '/api/tidak-ada');
    assert.equal(r.status, 404);
    assert.ok(r.body.error);
  });
});

describe('Auth', () => {
  test('register berhasil: 201, token, role mahasiswa, tanpa password', async () => {
    const r = await s.req('POST', '/api/auth/register', { body: { nama: 'Citra', email: '  Citra@Uji.ID ', password: 'citra123' } });
    assert.equal(r.status, 201);
    assert.ok(r.body.token);
    assert.equal(r.body.user.email, 'citra@uji.id'); // dinormalisasi
    assert.equal(r.body.user.role, 'mahasiswa');
    assert.equal(r.body.user.password_hash, undefined);
  });

  test('register menolak nama < 2 karakter', async () => {
    const r = await s.req('POST', '/api/auth/register', { body: { nama: 'A', email: 'a@uji.id', password: '123456' } });
    assert.equal(r.status, 400);
    assert.match(r.body.error, /Nama/);
  });

  test('register menolak email tidak valid', async () => {
    const r = await s.req('POST', '/api/auth/register', { body: { nama: 'Dewi', email: 'bukan-email', password: '123456' } });
    assert.equal(r.status, 400);
    assert.match(r.body.error, /email/i);
  });

  test('register menolak kata sandi < 6 karakter', async () => {
    const r = await s.req('POST', '/api/auth/register', { body: { nama: 'Dewi', email: 'dewi@uji.id', password: '12345' } });
    assert.equal(r.status, 400);
    assert.match(r.body.error, /Kata sandi/);
  });

  test('register menolak email yang sudah terdaftar (409)', async () => {
    const r = await s.req('POST', '/api/auth/register', { body: { nama: 'Andi 2', email: 'ANDI@uji.id', password: 'andi123' } });
    assert.equal(r.status, 409);
  });

  test('login berhasil mengembalikan token dan user', async () => {
    const r = await s.req('POST', '/api/auth/login', { body: { email: 'andi@uji.id', password: 'andi123' } });
    assert.equal(r.status, 200);
    assert.ok(r.body.token);
    assert.equal(r.body.user.nama, 'Andi');
  });

  test('login gagal: kata sandi salah → 401', async () => {
    const r = await s.req('POST', '/api/auth/login', { body: { email: 'andi@uji.id', password: 'salah' } });
    assert.equal(r.status, 401);
  });

  test('login gagal: email tidak terdaftar → 401', async () => {
    const r = await s.req('POST', '/api/auth/login', { body: { email: 'hantu@uji.id', password: 'apa-saja' } });
    assert.equal(r.status, 401);
  });

  test('GET /auth/me dengan token mengembalikan akun', async () => {
    const r = await s.req('GET', '/api/auth/me', { token: adminToken });
    assert.equal(r.status, 200);
    assert.equal(r.body.email, 'admin@uji.id');
    assert.equal(r.body.role, 'admin');
  });

  test('GET /auth/me tanpa token → 401', async () => {
    assert.equal((await s.req('GET', '/api/auth/me')).status, 401);
  });

  test('GET /auth/me dengan token ngawur → 401', async () => {
    assert.equal((await s.req('GET', '/api/auth/me', { token: 'ngawur.token' })).status, 401);
  });
});

describe('Kategori', () => {
  test('GET /kategori mengembalikan daftar terurut nama', async () => {
    const r = await s.req('GET', '/api/kategori');
    assert.equal(r.status, 200);
    const nama = r.body.map((k) => k.nama);
    assert.deepEqual(nama, [...nama].sort());
    assert.ok(nama.includes('Programming'));
  });

  test('POST /kategori menambah kategori (201)', async () => {
    const r = await s.req('POST', '/api/kategori', { body: { nama: '  Karya Tulis ' } });
    assert.equal(r.status, 201);
    assert.equal(r.body.nama, 'Karya Tulis');
    assert.ok(r.body.id);
  });

  test('POST /kategori duplikat → 409', async () => {
    assert.equal((await s.req('POST', '/api/kategori', { body: { nama: 'Programming' } })).status, 409);
  });

  test('POST /kategori tanpa nama → 400', async () => {
    assert.equal((await s.req('POST', '/api/kategori', { body: { nama: '   ' } })).status, 400);
    assert.equal((await s.req('POST', '/api/kategori', { body: {} })).status, 400);
  });
});

describe('Lomba: tambah dan validasi', () => {
  test('POST tanpa token → 401', async () => {
    assert.equal((await s.req('POST', '/api/lomba', { body: lombaValid() })).status, 401);
  });

  test('POST valid → 201, tersimpan 0, created_by = pembuat', async () => {
    const r = await s.req('POST', '/api/lomba', {
      token: andiToken,
      body: lombaValid({ judul: 'Hackathon Andi', deskripsi: 'Bangun aplikasi', tingkat: 'nasional', mode: 'online', hadiah: 'Rp1.000.000', biaya: 'gratis', link_pendaftaran: 'https://example.com' }),
    });
    assert.equal(r.status, 201);
    assert.equal(r.body.judul, 'Hackathon Andi');
    assert.equal(r.body.kategori_nama, 'Programming');
    assert.equal(r.body.tersimpan, 0);
    const andi = (await s.req('GET', '/api/auth/me', { token: andiToken })).body;
    assert.equal(r.body.created_by, andi.id);
    lombaAndi = r.body.id;
  });

  test('POST field opsional kosong disimpan sebagai null', async () => {
    const r = await s.req('POST', '/api/lomba', { token: andiToken, body: lombaValid() });
    assert.equal(r.status, 201);
    assert.equal(r.body.deskripsi, null);
    assert.equal(r.body.hadiah, null);
  });

  for (const field of ['judul', 'penyelenggara', 'kategori_id', 'deadline']) {
    test(`POST tanpa ${field} → 400`, async () => {
      const body = lombaValid();
      delete body[field];
      const r = await s.req('POST', '/api/lomba', { token: andiToken, body });
      assert.equal(r.status, 400);
      assert.match(r.body.error, new RegExp(field));
    });
  }

  test('POST judul hanya spasi → 400', async () => {
    assert.equal((await s.req('POST', '/api/lomba', { token: andiToken, body: lombaValid({ judul: '   ' }) })).status, 400);
  });

  test('POST format deadline salah → 400', async () => {
    const r = await s.req('POST', '/api/lomba', { token: andiToken, body: lombaValid({ deadline: '31/12/2026' }) });
    assert.equal(r.status, 400);
    assert.match(r.body.error, /YYYY-MM-DD/);
  });

  test('POST kategori_id tidak ada → 400', async () => {
    const r = await s.req('POST', '/api/lomba', { token: andiToken, body: lombaValid({ kategori_id: 99999 }) });
    assert.equal(r.status, 400);
    assert.match(r.body.error, /kategori_id/);
  });
});

describe('Lomba: baca, cari, filter, urut', () => {
  before(async () => {
    // Data khusus untuk filter (judul unik agar mudah dicari)
    await s.req('POST', '/api/lomba', { token: adminToken, body: lombaValid({ judul: 'FILTER-aktif-dekat', deadline: tanggal(2), tingkat: 'kampus', penyelenggara: 'Himpunan Zeta' }) });
    await s.req('POST', '/api/lomba', { token: adminToken, body: lombaValid({ judul: 'FILTER-aktif-jauh', deadline: tanggal(60), tingkat: 'nasional', kategori_id: katDesain, deskripsi: 'berisi kata kunci-ajaib' }) });
    await s.req('POST', '/api/lomba', { token: adminToken, body: lombaValid({ judul: 'FILTER-lewat', deadline: tanggal(-5), tingkat: 'internasional' }) });
  });

  const judulDari = (r) => r.body.map((l) => l.judul);

  test('GET /lomba mengembalikan array', async () => {
    const r = await s.req('GET', '/api/lomba');
    assert.equal(r.status, 200);
    assert.ok(Array.isArray(r.body));
    assert.ok(r.body.length >= 4);
  });

  test('default diurutkan deadline terdekat dulu', async () => {
    const r = await s.req('GET', '/api/lomba');
    const d = r.body.map((l) => l.deadline);
    assert.deepEqual(d, [...d].sort());
  });

  test('status=aktif hanya deadline belum lewat', async () => {
    const r = await s.req('GET', '/api/lomba?status=aktif');
    assert.ok(judulDari(r).includes('FILTER-aktif-dekat'));
    assert.ok(!judulDari(r).includes('FILTER-lewat'));
    assert.ok(r.body.every((l) => l.deadline >= tanggal(0)));
  });

  test('status=lewat hanya deadline sudah lewat', async () => {
    const r = await s.req('GET', '/api/lomba?status=lewat');
    assert.deepEqual(judulDari(r).filter((j) => j.startsWith('FILTER')), ['FILTER-lewat']);
  });

  test('filter tingkat', async () => {
    const r = await s.req('GET', '/api/lomba?tingkat=internasional');
    assert.deepEqual(judulDari(r), ['FILTER-lewat']);
  });

  test('filter kategori', async () => {
    const r = await s.req('GET', `/api/lomba?kategori=${katDesain}`);
    assert.deepEqual(judulDari(r), ['FILTER-aktif-jauh']);
  });

  test('q mencari di judul', async () => {
    const r = await s.req('GET', '/api/lomba?q=aktif-dekat');
    assert.deepEqual(judulDari(r), ['FILTER-aktif-dekat']);
  });

  test('q mencari di penyelenggara', async () => {
    const r = await s.req('GET', '/api/lomba?q=Zeta');
    assert.deepEqual(judulDari(r), ['FILTER-aktif-dekat']);
  });

  test('q mencari di deskripsi', async () => {
    const r = await s.req('GET', '/api/lomba?q=kunci-ajaib');
    assert.deepEqual(judulDari(r), ['FILTER-aktif-jauh']);
  });

  test('q tanpa hasil → array kosong', async () => {
    const r = await s.req('GET', '/api/lomba?q=tidak-ada-yang-cocok-xyz');
    assert.equal(r.status, 200);
    assert.deepEqual(r.body, []);
  });

  test('kombinasi filter bekerja bersamaan', async () => {
    const r = await s.req('GET', `/api/lomba?status=aktif&tingkat=nasional&kategori=${katDesain}`);
    assert.deepEqual(judulDari(r), ['FILTER-aktif-jauh']);
  });

  test('sort=terbaru menaruh data yang paling akhir ditambahkan di depan', async () => {
    const r = await s.req('GET', '/api/lomba?sort=terbaru');
    assert.equal(r.body[0].judul, 'FILTER-lewat');
  });

  test('input q berisi tanda kutip tidak merusak query (parameterized)', async () => {
    const r = await s.req('GET', '/api/lomba?q=' + encodeURIComponent("'; DROP TABLE lomba; --"));
    assert.equal(r.status, 200);
    assert.equal((await s.req('GET', '/api/lomba')).status, 200);
  });

  test('GET /lomba/:id mengembalikan detail', async () => {
    const r = await s.req('GET', `/api/lomba/${lombaAndi}`);
    assert.equal(r.status, 200);
    assert.equal(r.body.judul, 'Hackathon Andi');
    assert.equal(r.body.kategori_nama, 'Programming');
  });

  test('GET /lomba/:id tidak ada → 404', async () => {
    assert.equal((await s.req('GET', '/api/lomba/99999')).status, 404);
  });
});

describe('Lomba: ubah dan hapus (hak akses)', () => {
  test('PUT tanpa token → 401', async () => {
    assert.equal((await s.req('PUT', `/api/lomba/${lombaAndi}`, { body: lombaValid() })).status, 401);
  });

  test('PUT oleh mahasiswa lain → 403', async () => {
    const r = await s.req('PUT', `/api/lomba/${lombaAndi}`, { token: budiToken, body: lombaValid({ judul: 'Dibajak' }) });
    assert.equal(r.status, 403);
    assert.equal((await s.req('GET', `/api/lomba/${lombaAndi}`)).body.judul, 'Hackathon Andi');
  });

  test('PUT lomba tidak ada → 404', async () => {
    assert.equal((await s.req('PUT', '/api/lomba/99999', { token: adminToken, body: lombaValid() })).status, 404);
  });

  test('PUT oleh pemilik berhasil dan data berubah', async () => {
    const r = await s.req('PUT', `/api/lomba/${lombaAndi}`, { token: andiToken, body: lombaValid({ judul: 'Hackathon Andi v2', hadiah: 'Rp2.000.000' }) });
    assert.equal(r.status, 200);
    assert.equal(r.body.judul, 'Hackathon Andi v2');
    assert.equal(r.body.hadiah, 'Rp2.000.000');
  });

  test('PUT dengan data tidak valid → 400', async () => {
    const r = await s.req('PUT', `/api/lomba/${lombaAndi}`, { token: andiToken, body: lombaValid({ deadline: 'besok' }) });
    assert.equal(r.status, 400);
  });

  test('PUT oleh admin pada lomba orang lain berhasil', async () => {
    const r = await s.req('PUT', `/api/lomba/${lombaAndi}`, { token: adminToken, body: lombaValid({ judul: 'Diubah Admin' }) });
    assert.equal(r.status, 200);
    assert.equal(r.body.judul, 'Diubah Admin');
  });

  test('DELETE tanpa token → 401', async () => {
    assert.equal((await s.req('DELETE', `/api/lomba/${lombaAndi}`)).status, 401);
  });

  test('DELETE oleh mahasiswa lain → 403', async () => {
    assert.equal((await s.req('DELETE', `/api/lomba/${lombaAndi}`, { token: budiToken })).status, 403);
  });

  test('DELETE lomba tidak ada → 404', async () => {
    assert.equal((await s.req('DELETE', '/api/lomba/99999', { token: adminToken })).status, 404);
  });

  test('DELETE oleh pemilik berhasil, lalu GET → 404', async () => {
    const baru = await s.req('POST', '/api/lomba', { token: budiToken, body: lombaValid({ judul: 'Milik Budi' }) });
    const r = await s.req('DELETE', `/api/lomba/${baru.body.id}`, { token: budiToken });
    assert.equal(r.status, 200);
    assert.equal((await s.req('GET', `/api/lomba/${baru.body.id}`)).status, 404);
  });

  test('DELETE oleh admin pada lomba tanpa pemilik (data awal) berhasil', async () => {
    const id = Number(db.prepare("INSERT INTO lomba (judul, penyelenggara, kategori_id, deadline) VALUES ('Data Awal', 'Seed', ?, ?)").run(katProg, tanggal(5)).lastInsertRowid);
    assert.equal((await s.req('DELETE', `/api/lomba/${id}`, { token: budiToken })).status, 403); // mahasiswa tidak boleh
    assert.equal((await s.req('DELETE', `/api/lomba/${id}`, { token: adminToken })).status, 200);
  });
});

describe('Bookmark', () => {
  let lombaId;
  before(async () => {
    const r = await s.req('POST', '/api/lomba', { token: adminToken, body: lombaValid({ judul: 'Untuk Bookmark', deadline: tanggal(3) }) });
    lombaId = r.body.id;
  });

  test('semua endpoint bookmark butuh token (401)', async () => {
    assert.equal((await s.req('GET', '/api/bookmark')).status, 401);
    assert.equal((await s.req('POST', '/api/bookmark', { body: { lomba_id: lombaId } })).status, 401);
    assert.equal((await s.req('DELETE', `/api/bookmark/${lombaId}`)).status, 401);
  });

  test('awalnya daftar bookmark kosong', async () => {
    assert.deepEqual((await s.req('GET', '/api/bookmark', { token: andiToken })).body, []);
  });

  test('POST tanpa lomba_id → 400', async () => {
    assert.equal((await s.req('POST', '/api/bookmark', { token: andiToken, body: {} })).status, 400);
  });

  test('POST lomba tidak ada → 404', async () => {
    assert.equal((await s.req('POST', '/api/bookmark', { token: andiToken, body: { lomba_id: 99999 } })).status, 404);
  });

  test('POST menyimpan bookmark dengan catatan (201)', async () => {
    const r = await s.req('POST', '/api/bookmark', { token: andiToken, body: { lomba_id: lombaId, catatan: 'ajak tim' } });
    assert.equal(r.status, 201);
    assert.equal(r.body.catatan, 'ajak tim');
  });

  test('POST lagi pada lomba yang sama memperbarui catatan, bukan menggandakan', async () => {
    const r = await s.req('POST', '/api/bookmark', { token: andiToken, body: { lomba_id: lombaId, catatan: 'catatan baru' } });
    assert.equal(r.status, 200);
    const daftar = (await s.req('GET', '/api/bookmark', { token: andiToken })).body;
    assert.equal(daftar.length, 1);
    assert.equal(daftar[0].catatan, 'catatan baru');
    assert.equal(daftar[0].judul, 'Untuk Bookmark');
    assert.equal(daftar[0].tersimpan, 1);
  });

  test('bookmark bersifat pribadi: user lain tidak melihatnya', async () => {
    assert.deepEqual((await s.req('GET', '/api/bookmark', { token: budiToken })).body, []);
  });

  test('flag tersimpan di GET /lomba hanya untuk pemilik bookmark', async () => {
    const untukAndi = (await s.req('GET', `/api/lomba/${lombaId}`, { token: andiToken })).body;
    const untukBudi = (await s.req('GET', `/api/lomba/${lombaId}`, { token: budiToken })).body;
    const tamu = (await s.req('GET', `/api/lomba/${lombaId}`)).body;
    assert.equal(untukAndi.tersimpan, 1);
    assert.equal(untukBudi.tersimpan, 0);
    assert.equal(tamu.tersimpan, 0);
  });

  test('daftar bookmark diurutkan dari deadline terdekat', async () => {
    const dekat = (await s.req('POST', '/api/lomba', { token: adminToken, body: lombaValid({ judul: 'Bookmark Dekat', deadline: tanggal(1) }) })).body.id;
    await s.req('POST', '/api/bookmark', { token: andiToken, body: { lomba_id: dekat } });
    const daftar = (await s.req('GET', '/api/bookmark', { token: andiToken })).body;
    assert.deepEqual(daftar.map((b) => b.judul), ['Bookmark Dekat', 'Untuk Bookmark']);
  });

  test('DELETE bookmark yang tidak dimiliki → 404', async () => {
    assert.equal((await s.req('DELETE', `/api/bookmark/${lombaId}`, { token: budiToken })).status, 404);
  });

  test('DELETE menghapus bookmark', async () => {
    assert.equal((await s.req('DELETE', `/api/bookmark/${lombaId}`, { token: andiToken })).status, 200);
    assert.equal((await s.req('DELETE', `/api/bookmark/${lombaId}`, { token: andiToken })).status, 404);
  });

  test('menghapus lomba ikut menghapus bookmark terkait (ON DELETE CASCADE)', async () => {
    const id = (await s.req('POST', '/api/lomba', { token: adminToken, body: lombaValid({ judul: 'Akan Dihapus' }) })).body.id;
    await s.req('POST', '/api/bookmark', { token: budiToken, body: { lomba_id: id } });
    assert.equal((await s.req('GET', '/api/bookmark', { token: budiToken })).body.length, 1);
    await s.req('DELETE', `/api/lomba/${id}`, { token: adminToken });
    assert.deepEqual((await s.req('GET', '/api/bookmark', { token: budiToken })).body, []);
  });
});
