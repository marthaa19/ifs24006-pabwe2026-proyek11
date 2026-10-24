// Unit test untuk backend/auth.js (hash kata sandi dan token).
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const { siapkanDb } = require('./helpers');

const dir = siapkanDb();
const { hashPassword, verifyPassword, signToken, optionalAuth, requireAuth } = require('../auth');
const db = require('../db');

after(() => {
  db.close();
  fs.rmSync(dir, { recursive: true, force: true });
});

const resPalsu = () => {
  const r = { kode: null, isi: null };
  r.status = (k) => { r.kode = k; return r; };
  r.json = (b) => { r.isi = b; return r; };
  return r;
};

describe('hashPassword / verifyPassword', () => {
  test('hash berformat salt:hash dan bukan teks asli', () => {
    const h = hashPassword('rahasia123');
    assert.match(h, /^[0-9a-f]{32}:[0-9a-f]{128}$/);
    assert.ok(!h.includes('rahasia123'));
  });

  test('kata sandi yang sama menghasilkan hash berbeda (salt acak)', () => {
    assert.notEqual(hashPassword('sama'), hashPassword('sama'));
  });

  test('verifyPassword menerima kata sandi benar', () => {
    assert.equal(verifyPassword('rahasia123', hashPassword('rahasia123')), true);
  });

  test('verifyPassword menolak kata sandi salah', () => {
    assert.equal(verifyPassword('salah', hashPassword('rahasia123')), false);
  });

  test('verifyPassword menolak format tersimpan yang rusak', () => {
    assert.equal(verifyPassword('x', ''), false);
    assert.equal(verifyPassword('x', 'tanpa-titik-dua'), false);
    assert.equal(verifyPassword('x', undefined), false);
  });
});

describe('signToken / optionalAuth', () => {
  let userId;
  before(() => {
    const info = db.prepare("INSERT INTO users (nama, email, password_hash, role) VALUES ('Uji', 'uji@x.id', 'h', 'mahasiswa')").run();
    userId = Number(info.lastInsertRowid);
  });

  const jalankan = (header) => {
    const req = { headers: header ? { authorization: header } : {} };
    let lanjut = false;
    optionalAuth(req, {}, () => { lanjut = true; });
    return { req, lanjut };
  };

  test('token valid mengisi userId dan role', () => {
    const { req, lanjut } = jalankan(`Bearer ${signToken({ id: userId })}`);
    assert.equal(lanjut, true);
    assert.equal(req.userId, userId);
    assert.equal(req.role, 'mahasiswa');
  });

  test('tanpa header tetap lanjut sebagai tamu', () => {
    const { req, lanjut } = jalankan(null);
    assert.equal(lanjut, true);
    assert.equal(req.userId, null);
    assert.equal(req.role, null);
  });

  test('token dengan tanda tangan diubah ditolak', () => {
    const t = signToken({ id: userId });
    const [body] = t.split('.');
    const { req } = jalankan(`Bearer ${body}.tandatanganpalsu`);
    assert.equal(req.userId, null);
  });

  test('payload diubah (id lain) ditolak karena tanda tangan tidak cocok', () => {
    const [, sig] = signToken({ id: userId }).split('.');
    const bodyPalsu = Buffer.from(JSON.stringify({ id: 999, exp: Date.now() + 1e9 })).toString('base64url');
    const { req } = jalankan(`Bearer ${bodyPalsu}.${sig}`);
    assert.equal(req.userId, null);
  });

  test('token kedaluwarsa ditolak', (t) => {
    const asli = Date.now;
    const token = signToken({ id: userId });
    t.mock.method(Date, 'now', () => asli() + 8 * 24 * 60 * 60 * 1000);
    const { req } = jalankan(`Bearer ${token}`);
    assert.equal(req.userId, null);
  });

  test('token milik user yang sudah tidak ada ditolak', () => {
    const { req } = jalankan(`Bearer ${signToken({ id: 424242 })}`);
    assert.equal(req.userId, null);
  });

  test('skema selain Bearer diabaikan', () => {
    const { req } = jalankan(`Basic ${signToken({ id: userId })}`);
    assert.equal(req.userId, null);
  });
});

describe('requireAuth', () => {
  test('menolak dengan 401 jika belum masuk', () => {
    const res = resPalsu();
    let lanjut = false;
    requireAuth({ userId: null }, res, () => { lanjut = true; });
    assert.equal(lanjut, false);
    assert.equal(res.kode, 401);
    assert.ok(res.isi.error);
  });

  test('meneruskan jika sudah masuk', () => {
    let lanjut = false;
    requireAuth({ userId: 1 }, resPalsu(), () => { lanjut = true; });
    assert.equal(lanjut, true);
  });
});
