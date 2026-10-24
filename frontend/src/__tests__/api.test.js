import { describe, test, expect, beforeEach, vi } from 'vitest';
import { api, getToken, setToken } from '../api.js';

const BASE = 'http://localhost:3000/api';

function balas(status, data) {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    json: () => (data === undefined ? Promise.reject(new Error('kosong')) : Promise.resolve(data)),
  });
}

beforeEach(() => {
  localStorage.clear();
  vi.stubGlobal('fetch', vi.fn());
});

describe('token', () => {
  test('setToken menyimpan dan getToken membaca', () => {
    expect(getToken()).toBeNull();
    setToken('abc');
    expect(getToken()).toBe('abc');
    expect(localStorage.getItem('lr_token')).toBe('abc');
  });

  test('setToken(null) menghapus token', () => {
    setToken('abc');
    setToken(null);
    expect(getToken()).toBeNull();
  });
});

describe('request', () => {
  test('GET tanpa token tidak mengirim header Authorization', async () => {
    fetch.mockReturnValue(balas(200, []));
    await api.getKategori();
    const [url, opts] = fetch.mock.calls[0];
    expect(url).toBe(`${BASE}/kategori`);
    expect(opts.headers['Content-Type']).toBe('application/json');
    expect(opts.headers.Authorization).toBeUndefined();
  });

  test('menyertakan Bearer token jika sudah masuk', async () => {
    setToken('tok123');
    fetch.mockReturnValue(balas(200, {}));
    await api.me();
    expect(fetch.mock.calls[0][1].headers.Authorization).toBe('Bearer tok123');
  });

  test('mengembalikan data JSON', async () => {
    fetch.mockReturnValue(balas(200, [{ id: 1, nama: 'Programming' }]));
    expect(await api.getKategori()).toEqual([{ id: 1, nama: 'Programming' }]);
  });

  test('error dari server memakai pesan field "error"', async () => {
    fetch.mockReturnValue(balas(401, { error: 'Email atau kata sandi salah' }));
    await expect(api.login({ email: 'a@b.c', password: 'x' })).rejects.toThrow('Email atau kata sandi salah');
  });

  test('error tanpa body memakai pesan bawaan dengan kode status', async () => {
    fetch.mockReturnValue(balas(500, undefined));
    await expect(api.getKategori()).rejects.toThrow('Permintaan gagal (500)');
  });

  test('gagal terhubung menghasilkan pesan ramah', async () => {
    fetch.mockRejectedValue(new TypeError('Failed to fetch'));
    await expect(api.getKategori()).rejects.toThrow(/Tidak bisa terhubung ke server/);
  });
});

describe('endpoint', () => {
  beforeEach(() => fetch.mockReturnValue(balas(200, {})));

  test('getLomba membuang parameter kosong dari query string', async () => {
    await api.getLomba({ q: '', kategori: '', tingkat: 'nasional', status: 'aktif', sort: 'deadline' });
    const url = new URL(fetch.mock.calls[0][0]);
    expect(url.pathname).toBe('/api/lomba');
    expect(url.searchParams.get('tingkat')).toBe('nasional');
    expect(url.searchParams.get('status')).toBe('aktif');
    expect(url.searchParams.has('q')).toBe(false);
    expect(url.searchParams.has('kategori')).toBe(false);
  });

  test('getLomba tanpa parameter tetap valid', async () => {
    await api.getLomba();
    expect(fetch.mock.calls[0][0]).toBe(`${BASE}/lomba?`);
  });

  test('getLombaById', async () => {
    await api.getLombaById(5);
    expect(fetch.mock.calls[0][0]).toBe(`${BASE}/lomba/5`);
  });

  test('tambahLomba: POST dengan body JSON', async () => {
    await api.tambahLomba({ judul: 'X' });
    const [url, opts] = fetch.mock.calls[0];
    expect(url).toBe(`${BASE}/lomba`);
    expect(opts.method).toBe('POST');
    expect(JSON.parse(opts.body)).toEqual({ judul: 'X' });
  });

  test('ubahLomba: PUT ke /lomba/:id', async () => {
    await api.ubahLomba(3, { judul: 'Y' });
    const [url, opts] = fetch.mock.calls[0];
    expect(url).toBe(`${BASE}/lomba/3`);
    expect(opts.method).toBe('PUT');
  });

  test('hapusLomba: DELETE ke /lomba/:id', async () => {
    await api.hapusLomba(3);
    expect(fetch.mock.calls[0][1].method).toBe('DELETE');
  });

  test('simpanBookmark mengirim lomba_id dan catatan', async () => {
    await api.simpanBookmark(2, 'ajak tim');
    const [url, opts] = fetch.mock.calls[0];
    expect(url).toBe(`${BASE}/bookmark`);
    expect(opts.method).toBe('POST');
    expect(JSON.parse(opts.body)).toEqual({ lomba_id: 2, catatan: 'ajak tim' });
  });

  test('hapusBookmark: DELETE ke /bookmark/:lomba_id', async () => {
    await api.hapusBookmark(2);
    const [url, opts] = fetch.mock.calls[0];
    expect(url).toBe(`${BASE}/bookmark/2`);
    expect(opts.method).toBe('DELETE');
  });

  test('register dan login memakai POST ke /auth', async () => {
    await api.register({ nama: 'A', email: 'a@b.c', password: '123456' });
    await api.login({ email: 'a@b.c', password: '123456' });
    expect(fetch.mock.calls[0][0]).toBe(`${BASE}/auth/register`);
    expect(fetch.mock.calls[1][0]).toBe(`${BASE}/auth/login`);
    expect(fetch.mock.calls[1][1].method).toBe('POST');
  });
});
