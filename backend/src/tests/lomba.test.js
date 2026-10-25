import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  buatKlien, daftarAkun, db, jadikanAdmin, mulaiServer, tambahKategori, tambahLomba, tanggal, tutupServer,
} from '../test-utils.js';

describe('API /lomba', () => {
  let server;
  let panggil;
  let pemilik; // mahasiswa pemilik lomba
  let lain; // mahasiswa lain
  let admin;
  let katProg;
  let katDesain;
  let idAktif;
  let idLewat;
  let idLama; // lomba lama tanpa pemilik

  const baru = (o = {}) => ({
    judul: 'Lomba Baru',
    penyelenggara: 'Panitia Uji',
    kategori_id: katProg,
    deadline: tanggal(20),
    ...o,
  });

  beforeAll(async () => {
    const s = await mulaiServer();
    server = s.server;
    panggil = buatKlien(s.base);

    pemilik = await daftarAkun(panggil, 'Pemilik', 'pemilik@contoh.com');
    lain = await daftarAkun(panggil, 'Lain', 'lain@contoh.com');
    admin = await daftarAkun(panggil, 'Admin', 'admin@contoh.com');
    jadikanAdmin(admin.user.id);

    katProg = tambahKategori('Programming');
    katDesain = tambahKategori('UI/UX');

    idAktif = tambahLomba({
      judul: 'Hackathon Nasional', penyelenggara: 'Komunitas Dev', kategori_id: katProg,
      deskripsi: 'Bangun aplikasi dalam 48 jam', tingkat: 'nasional', deadline: tanggal(10), created_by: pemilik.user.id,
    });
    tambahLomba({
      judul: 'Sprint Desain', penyelenggara: 'Design Society', kategori_id: katDesain,
      tingkat: 'kampus', deadline: tanggal(5), created_by: lain.user.id,
    });
    idLewat = tambahLomba({
      judul: 'Kontes Lama', penyelenggara: 'Panitia Lama', kategori_id: katProg,
      tingkat: 'kampus', deadline: tanggal(-30), created_by: lain.user.id,
    });
    idLama = tambahLomba({ judul: 'Lomba Warisan', kategori_id: katProg, deadline: tanggal(40) });
  });
  afterAll(() => tutupServer(server));

  describe('GET /lomba', () => {
    it('mengurutkan dari deadline terdekat secara bawaan', async () => {
      const r = await panggil('GET', '/lomba');
      expect(r.status).toBe(200);
      expect(r.data.map((l) => l.judul)).toEqual(['Kontes Lama', 'Sprint Desain', 'Hackathon Nasional', 'Lomba Warisan']);
      expect(r.data[0].kategori_nama).toBe('Programming');
    });

    it('menyaring berdasarkan kategori dan tingkat', async () => {
      let r = await panggil('GET', `/lomba?kategori=${katDesain}`);
      expect(r.data.map((l) => l.judul)).toEqual(['Sprint Desain']);
      r = await panggil('GET', '/lomba?tingkat=nasional');
      expect(r.data.map((l) => l.judul)).toEqual(['Hackathon Nasional']);
    });

    it('mencari di judul, penyelenggara, dan deskripsi', async () => {
      let r = await panggil('GET', '/lomba?q=hackathon');
      expect(r.data).toHaveLength(1);
      r = await panggil('GET', '/lomba?q=Design Society');
      expect(r.data.map((l) => l.judul)).toEqual(['Sprint Desain']);
      r = await panggil('GET', '/lomba?q=48 jam');
      expect(r.data.map((l) => l.judul)).toEqual(['Hackathon Nasional']);
      r = await panggil('GET', '/lomba?q=tidak-ada-yang-cocok');
      expect(r.data).toEqual([]);
    });

    it('menyaring status aktif dan lewat', async () => {
      let r = await panggil('GET', '/lomba?status=aktif');
      expect(r.data.map((l) => l.judul)).toEqual(['Sprint Desain', 'Hackathon Nasional', 'Lomba Warisan']);
      r = await panggil('GET', '/lomba?status=lewat');
      expect(r.data.map((l) => l.judul)).toEqual(['Kontes Lama']);
    });

    it('mengurutkan dari yang terbaru ditambahkan', async () => {
      const r = await panggil('GET', '/lomba?sort=terbaru');
      expect(r.data[0].judul).toBe('Lomba Warisan');
    });

    it('menandai lomba yang disimpan pengguna yang masuk', async () => {
      await panggil('POST', '/bookmark', { token: pemilik.token, body: { lomba_id: idAktif } });
      let r = await panggil('GET', '/lomba?tingkat=nasional', { token: pemilik.token });
      expect(r.data[0].tersimpan).toBe(1);
      r = await panggil('GET', '/lomba?tingkat=nasional', { token: lain.token });
      expect(r.data[0].tersimpan).toBe(0);
      r = await panggil('GET', '/lomba?tingkat=nasional');
      expect(r.data[0].tersimpan).toBe(0);
    });
  });

  describe('GET /lomba/:id', () => {
    it('mengembalikan detail lomba', async () => {
      const r = await panggil('GET', `/lomba/${idAktif}`);
      expect(r.status).toBe(200);
      expect(r.data).toMatchObject({ id: idAktif, judul: 'Hackathon Nasional', kategori_nama: 'Programming' });
    });

    it('404 untuk lomba yang tidak ada', async () => {
      const r = await panggil('GET', '/lomba/999999');
      expect(r.status).toBe(404);
    });
  });

  describe('POST /lomba', () => {
    it('401 untuk tamu', async () => {
      const r = await panggil('POST', '/lomba', { body: baru() });
      expect(r.status).toBe(401);
    });

    it('400 jika field wajib kosong', async () => {
      const r = await panggil('POST', '/lomba', { token: pemilik.token, body: { judul: 'Saja' } });
      expect(r.status).toBe(400);
      expect(r.data.error).toMatch(/penyelenggara/);
      expect(r.data.error).toMatch(/deadline/);
    });

    it('400 jika format deadline salah atau kategori tidak ada', async () => {
      let r = await panggil('POST', '/lomba', { token: pemilik.token, body: baru({ deadline: '31/12/2026' }) });
      expect(r.status).toBe(400);
      expect(r.data.error).toMatch(/YYYY-MM-DD/);
      r = await panggil('POST', '/lomba', { token: pemilik.token, body: baru({ kategori_id: 99999 }) });
      expect(r.status).toBe(400);
      expect(r.data.error).toMatch(/kategori/);
    });

    it('201 dan mencatat pembuatnya; field opsional menjadi null', async () => {
      const r = await panggil('POST', '/lomba', { token: pemilik.token, body: baru() });
      expect(r.status).toBe(201);
      expect(r.data).toMatchObject({
        judul: 'Lomba Baru', created_by: pemilik.user.id, kategori_nama: 'Programming',
        deskripsi: null, tingkat: null, mode: null, hadiah: null, biaya: null, link_pendaftaran: null,
      });
    });

    it('201 dengan semua field opsional terisi', async () => {
      const r = await panggil('POST', '/lomba', {
        token: lain.token,
        body: baru({
          judul: 'Lengkap', deskripsi: 'Deskripsi', tingkat: 'nasional', mode: 'online',
          hadiah: 'Rp1.000.000', biaya: 'gratis', link_pendaftaran: 'https://contoh.com/daftar',
        }),
      });
      expect(r.status).toBe(201);
      expect(r.data).toMatchObject({ tingkat: 'nasional', mode: 'online', hadiah: 'Rp1.000.000', biaya: 'gratis' });
    });
  });

  describe('PUT /lomba/:id', () => {
    const ubah = (o = {}) => baru({ judul: 'Judul Diubah', kategori_id: katDesain, ...o });

    it('401 untuk tamu', async () => {
      const r = await panggil('PUT', `/lomba/${idAktif}`, { body: ubah() });
      expect(r.status).toBe(401);
    });

    it('404 untuk lomba yang tidak ada', async () => {
      const r = await panggil('PUT', '/lomba/999999', { token: admin.token, body: ubah() });
      expect(r.status).toBe(404);
    });

    it('403 untuk mahasiswa yang bukan pemilik, termasuk lomba tanpa pemilik', async () => {
      let r = await panggil('PUT', `/lomba/${idAktif}`, { token: lain.token, body: ubah() });
      expect(r.status).toBe(403);
      r = await panggil('PUT', `/lomba/${idLama}`, { token: lain.token, body: ubah() });
      expect(r.status).toBe(403);
    });

    it('400 jika data tidak valid', async () => {
      const r = await panggil('PUT', `/lomba/${idAktif}`, { token: pemilik.token, body: ubah({ judul: '' }) });
      expect(r.status).toBe(400);
    });

    it('pemilik dapat mengubah lombanya', async () => {
      const r = await panggil('PUT', `/lomba/${idAktif}`, { token: pemilik.token, body: ubah({ hadiah: 'Laptop' }) });
      expect(r.status).toBe(200);
      expect(r.data).toMatchObject({ judul: 'Judul Diubah', kategori_nama: 'UI/UX', hadiah: 'Laptop' });
    });

    it('admin dapat mengubah lomba siapa pun, termasuk yang tanpa pemilik', async () => {
      let r = await panggil('PUT', `/lomba/${idAktif}`, { token: admin.token, body: ubah({ judul: 'Oleh Admin' }) });
      expect(r.status).toBe(200);
      expect(r.data.judul).toBe('Oleh Admin');
      r = await panggil('PUT', `/lomba/${idLama}`, { token: admin.token, body: ubah({ judul: 'Warisan Diubah' }) });
      expect(r.status).toBe(200);
    });
  });

  describe('DELETE /lomba/:id', () => {
    it('401 untuk tamu', async () => {
      const r = await panggil('DELETE', `/lomba/${idLewat}`);
      expect(r.status).toBe(401);
    });

    it('404 untuk lomba yang tidak ada', async () => {
      const r = await panggil('DELETE', '/lomba/999999', { token: admin.token });
      expect(r.status).toBe(404);
    });

    it('403 untuk mahasiswa yang bukan pemilik', async () => {
      const r = await panggil('DELETE', `/lomba/${idLewat}`, { token: pemilik.token });
      expect(r.status).toBe(403);
    });

    it('pemilik dapat menghapus lombanya, bookmark ikut terhapus', async () => {
      const id = tambahLomba({ judul: 'Untuk Dihapus', kategori_id: katProg, deadline: tanggal(3), created_by: pemilik.user.id });
      await panggil('POST', '/bookmark', { token: lain.token, body: { lomba_id: id } });
      const r = await panggil('DELETE', `/lomba/${id}`, { token: pemilik.token });
      expect(r.status).toBe(200);
      expect(r.data.message).toMatch(/dihapus/i);
      const sisa = db.prepare('SELECT COUNT(*) AS n FROM bookmark WHERE lomba_id = ?').get(id).n;
      expect(sisa).toBe(0);
      expect((await panggil('GET', `/lomba/${id}`)).status).toBe(404);
    });

    it('admin dapat menghapus lomba siapa pun', async () => {
      const r = await panggil('DELETE', `/lomba/${idLewat}`, { token: admin.token });
      expect(r.status).toBe(200);
    });
  });
});
