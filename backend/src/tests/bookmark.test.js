import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { buatKlien, daftarAkun, mulaiServer, tambahKategori, tambahLomba, tanggal, tutupServer } from '../test-utils.js';

describe('API /bookmark', () => {
  let server;
  let panggil;
  let a;
  let b;
  let dekat;
  let jauh;

  beforeAll(async () => {
    const s = await mulaiServer();
    server = s.server;
    panggil = buatKlien(s.base);
    a = await daftarAkun(panggil, 'Akun A', 'a@contoh.com');
    b = await daftarAkun(panggil, 'Akun B', 'b@contoh.com');
    const kat = tambahKategori('Programming');
    jauh = tambahLomba({ judul: 'Lomba Jauh', kategori_id: kat, deadline: tanggal(60) });
    dekat = tambahLomba({ judul: 'Lomba Dekat', kategori_id: kat, deadline: tanggal(7) });
  });
  afterAll(() => tutupServer(server));

  it('semua endpoint menolak tamu dengan 401', async () => {
    expect((await panggil('GET', '/bookmark')).status).toBe(401);
    expect((await panggil('POST', '/bookmark', { body: { lomba_id: dekat } })).status).toBe(401);
    expect((await panggil('DELETE', `/bookmark/${dekat}`)).status).toBe(401);
  });

  it('POST menolak lomba_id kosong dan lomba yang tidak ada', async () => {
    let r = await panggil('POST', '/bookmark', { token: a.token, body: {} });
    expect(r.status).toBe(400);
    r = await panggil('POST', '/bookmark', { token: a.token, body: { lomba_id: 999999 } });
    expect(r.status).toBe(404);
  });

  it('POST menyimpan lomba, lalu memperbarui catatan jika disimpan lagi', async () => {
    let r = await panggil('POST', '/bookmark', { token: a.token, body: { lomba_id: jauh, catatan: 'Ajak tim' } });
    expect(r.status).toBe(201);
    expect(r.data).toMatchObject({ lomba_id: jauh, catatan: 'Ajak tim' });

    r = await panggil('POST', '/bookmark', { token: a.token, body: { lomba_id: jauh, catatan: 'Siapkan proposal' } });
    expect(r.status).toBe(200);
    expect(r.data.message).toMatch(/diperbarui/i);

    r = await panggil('POST', '/bookmark', { token: a.token, body: { lomba_id: dekat } });
    expect(r.status).toBe(201);
    expect(r.data.catatan).toBeNull();
  });

  it('GET hanya menampilkan simpanan milik sendiri, urut deadline terdekat', async () => {
    const r = await panggil('GET', '/bookmark', { token: a.token });
    expect(r.status).toBe(200);
    expect(r.data.map((x) => x.judul)).toEqual(['Lomba Dekat', 'Lomba Jauh']);
    expect(r.data[1]).toMatchObject({ catatan: 'Siapkan proposal', tersimpan: 1, kategori_nama: 'Programming' });

    const kosong = await panggil('GET', '/bookmark', { token: b.token });
    expect(kosong.data).toEqual([]);
  });

  it('DELETE menghapus simpanan sendiri dan 404 jika tidak ada', async () => {
    let r = await panggil('DELETE', `/bookmark/${dekat}`, { token: b.token });
    expect(r.status).toBe(404); // milik A, bukan B

    r = await panggil('DELETE', `/bookmark/${dekat}`, { token: a.token });
    expect(r.status).toBe(200);
    r = await panggil('DELETE', `/bookmark/${dekat}`, { token: a.token });
    expect(r.status).toBe(404);
  });
});
