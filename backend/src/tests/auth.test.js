import crypto from 'node:crypto';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { auth, buatKlien, daftarAkun, db, mulaiServer, tutupServer } from '../test-utils.js';

const { hashPassword, verifyPassword, signToken, optionalAuth, requireAuth } = auth;

describe('hash kata sandi', () => {
  it('menghasilkan format salt:hash dan salt berbeda tiap kali', () => {
    const a = hashPassword('sandi-rahasia');
    const b = hashPassword('sandi-rahasia');
    expect(a).toMatch(/^[0-9a-f]+:[0-9a-f]+$/);
    expect(a).not.toBe(b);
  });

  it('verifyPassword menerima sandi benar dan menolak yang salah', () => {
    const h = hashPassword('sandi-rahasia');
    expect(verifyPassword('sandi-rahasia', h)).toBe(true);
    expect(verifyPassword('salah', h)).toBe(false);
  });

  it('verifyPassword menolak data tersimpan yang rusak', () => {
    expect(verifyPassword('x', '')).toBe(false);
    expect(verifyPassword('x', 'tanpa-pemisah')).toBe(false);
    expect(verifyPassword('x', 'abcd:12')).toBe(false); // panjang hash tidak sama
    expect(verifyPassword('x', undefined)).toBe(false);
  });
});

describe('middleware autentikasi', () => {
  afterEach(() => vi.useRealTimers());

  function jalankan(header) {
    const req = { headers: header ? { authorization: header } : {} };
    const next = vi.fn();
    optionalAuth(req, {}, next);
    expect(next).toHaveBeenCalledOnce();
    return req;
  }

  function buatUser(email, role = 'mahasiswa') {
    const info = db
      .prepare('INSERT INTO users (nama, email, password_hash, role) VALUES (?, ?, ?, ?)')
      .run('Uji', email, 'x:y', role);
    return Number(info.lastInsertRowid);
  }

  it('tanpa header: userId dan role null', () => {
    const req = jalankan(null);
    expect(req.userId).toBeNull();
    expect(req.role).toBeNull();
  });

  it('token valid untuk pengguna yang ada mengisi userId dan role', () => {
    const id = buatUser('mw1@contoh.com', 'admin');
    const req = jalankan(`Bearer ${signToken({ id })}`);
    expect(req.userId).toBe(id);
    expect(req.role).toBe('admin');
  });

  it('token valid tetapi pengguna sudah tidak ada: dianggap tamu', () => {
    const req = jalankan(`Bearer ${signToken({ id: 987654 })}`);
    expect(req.userId).toBeNull();
  });

  it('header tanpa awalan Bearer diabaikan', () => {
    const id = buatUser('mw2@contoh.com');
    expect(jalankan(signToken({ id })).userId).toBeNull();
  });

  it('token tanpa titik pemisah ditolak', () => {
    expect(jalankan('Bearer tokenrusak').userId).toBeNull();
  });

  it('tanda tangan yang diubah ditolak (panjang berbeda maupun sama)', () => {
    const id = buatUser('mw3@contoh.com');
    const [body] = signToken({ id }).split('.');
    expect(jalankan(`Bearer ${body}.pendek`).userId).toBeNull();
    const palsu = crypto.createHmac('sha256', 'kunci-lain').update(body).digest('base64url');
    expect(jalankan(`Bearer ${body}.${palsu}`).userId).toBeNull();
  });

  it('isi token yang bukan JSON ditolak walau tanda tangannya benar', () => {
    const body = Buffer.from('bukan json').toString('base64url');
    const sig = crypto.createHmac('sha256', process.env.JWT_SECRET).update(body).digest('base64url');
    expect(jalankan(`Bearer ${body}.${sig}`).userId).toBeNull();
  });

  it('token kedaluwarsa ditolak', () => {
    const id = buatUser('mw4@contoh.com');
    const token = signToken({ id });
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(Date.now() + 8 * 24 * 60 * 60 * 1000);
    expect(jalankan(`Bearer ${token}`).userId).toBeNull();
  });

  it('requireAuth membalas 401 untuk tamu dan meneruskan pengguna masuk', () => {
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };
    const next = vi.fn();
    requireAuth({ userId: null }, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();

    requireAuth({ userId: 1 }, res, next);
    expect(next).toHaveBeenCalledOnce();
  });
});

describe('API /auth', () => {
  let server;
  let panggil;

  beforeAll(async () => {
    const s = await mulaiServer();
    server = s.server;
    panggil = buatKlien(s.base);
  });
  afterAll(() => tutupServer(server));

  const valid = { nama: 'Martha', email: 'Martha@Contoh.com', password: 'rahasia123' };

  it('register menolak nama pendek, email salah, dan sandi pendek', async () => {
    let r = await panggil('POST', '/auth/register', { body: { ...valid, nama: 'M' } });
    expect(r.status).toBe(400);
    expect(r.data.error).toMatch(/nama/i);

    r = await panggil('POST', '/auth/register', { body: { ...valid, email: 'bukan-email' } });
    expect(r.status).toBe(400);
    expect(r.data.error).toMatch(/email/i);

    r = await panggil('POST', '/auth/register', { body: { ...valid, password: '123' } });
    expect(r.status).toBe(400);
    expect(r.data.error).toMatch(/sandi/i);
  });

  it('register berhasil: peran mahasiswa, email huruf kecil, token diberikan', async () => {
    const r = await panggil('POST', '/auth/register', { body: valid });
    expect(r.status).toBe(201);
    expect(r.data.token).toBeTruthy();
    expect(r.data.user).toMatchObject({ nama: 'Martha', email: 'martha@contoh.com', role: 'mahasiswa' });
    expect(r.data.user.password_hash).toBeUndefined();
  });

  it('register menolak email yang sudah terdaftar (tanpa membedakan huruf besar)', async () => {
    const r = await panggil('POST', '/auth/register', { body: { ...valid, email: 'MARTHA@contoh.com' } });
    expect(r.status).toBe(409);
  });

  it('register tanpa body dianggap data tidak valid', async () => {
    const r = await panggil('POST', '/auth/register');
    expect(r.status).toBe(400);
  });

  it('login berhasil dengan email dan sandi yang benar', async () => {
    const r = await panggil('POST', '/auth/login', { body: { email: ' MARTHA@contoh.com ', password: 'rahasia123' } });
    expect(r.status).toBe(200);
    expect(r.data.token).toBeTruthy();
    expect(r.data.user.email).toBe('martha@contoh.com');
  });

  it('login gagal untuk sandi salah dan email tak dikenal', async () => {
    let r = await panggil('POST', '/auth/login', { body: { email: 'martha@contoh.com', password: 'salah-sandi' } });
    expect(r.status).toBe(401);
    r = await panggil('POST', '/auth/login', { body: { email: 'tidak@ada.com', password: 'rahasia123' } });
    expect(r.status).toBe(401);
    r = await panggil('POST', '/auth/login');
    expect(r.status).toBe(401);
  });

  it('GET /auth/me butuh token dan mengembalikan data akun', async () => {
    const { token } = await daftarAkun(panggil, 'Budi', 'budi@contoh.com');
    let r = await panggil('GET', '/auth/me');
    expect(r.status).toBe(401);
    r = await panggil('GET', '/auth/me', { token });
    expect(r.status).toBe(200);
    expect(r.data).toMatchObject({ nama: 'Budi', email: 'budi@contoh.com', role: 'mahasiswa' });
  });
});
