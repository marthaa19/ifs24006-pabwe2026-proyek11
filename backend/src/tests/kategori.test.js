import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { buatKlien, db, mulaiServer, tambahKategori, tutupServer } from '../test-utils.js';

describe('API /kategori', () => {
  let server;
  let panggil;

  beforeAll(async () => {
    const s = await mulaiServer();
    server = s.server;
    panggil = buatKlien(s.base);
    tambahKategori('Programming');
    tambahKategori('Esai');
  });
  afterAll(() => tutupServer(server));

  it('GET mengembalikan daftar kategori terurut abjad', async () => {
    const r = await panggil('GET', '/kategori');
    expect(r.status).toBe(200);
    expect(r.data.map((k) => k.nama)).toEqual(['Esai', 'Programming']);
  });

  it('POST menolak nama kosong', async () => {
    let r = await panggil('POST', '/kategori', { body: { nama: '   ' } });
    expect(r.status).toBe(400);
    r = await panggil('POST', '/kategori');
    expect(r.status).toBe(400);
  });

  it('POST menambah kategori baru', async () => {
    const r = await panggil('POST', '/kategori', { body: { nama: '  UI/UX ' } });
    expect(r.status).toBe(201);
    expect(r.data.nama).toBe('UI/UX');
    expect(r.data.id).toBeTruthy();
  });

  it('POST menolak kategori ganda dengan 409', async () => {
    const r = await panggil('POST', '/kategori', { body: { nama: 'Programming' } });
    expect(r.status).toBe(409);
  });

  it('POST membalas 500 untuk kegagalan database lain', async () => {
    const spy = vi.spyOn(db, 'prepare').mockImplementationOnce(() => {
      throw new Error('disk penuh');
    });
    const r = await panggil('POST', '/kategori', { body: { nama: 'Baru' } });
    spy.mockRestore();
    expect(r.status).toBe(500);
    expect(r.data.error).toMatch(/gagal/i);
  });
});
