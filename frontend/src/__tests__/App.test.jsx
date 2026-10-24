import { describe, test, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import App from '../App.jsx';
import { api } from '../api.js';
import { useAuth } from '../AuthContext.jsx';

vi.mock('../api.js', () => ({
  api: {
    getKategori: vi.fn(), getLomba: vi.fn(), getBookmark: vi.fn(), getLombaById: vi.fn(),
    simpanBookmark: vi.fn(), hapusBookmark: vi.fn(), tambahLomba: vi.fn(), ubahLomba: vi.fn(), hapusLomba: vi.fn(),
  },
  getToken: vi.fn(() => null),
  setToken: vi.fn(),
}));
vi.mock('../AuthContext.jsx', () => ({ useAuth: vi.fn() }));

const tampil = (path = '/') =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>
  );

const sebagaiTamu = () => useAuth.mockReturnValue({ user: null, siap: true, keluar: vi.fn(), masuk: vi.fn(), daftar: vi.fn() });
const sebagai = (user, keluar = vi.fn()) => useAuth.mockReturnValue({ user, siap: true, keluar, masuk: vi.fn(), daftar: vi.fn() });

beforeEach(() => {
  Object.values(api).forEach((f) => f.mockReset());
  api.getKategori.mockResolvedValue([]);
  api.getLomba.mockResolvedValue([]);
  api.getBookmark.mockResolvedValue([]);
  sebagaiTamu();
});

describe('layout dan navigasi', () => {
  test('menampilkan merek, menu utama, dan footer', async () => {
    tampil('/');
    expect(screen.getByText('Pantau deadline lomba mahasiswa')).toBeInTheDocument();
    const nav = screen.getByRole('navigation', { name: 'Menu utama' });
    expect(nav).toHaveTextContent('Beranda');
    expect(nav).toHaveTextContent('Tersimpan');
    expect(nav).toHaveTextContent('Tambah lomba');
    expect(screen.getByText(/Proyek 1 PABWE/)).toBeInTheDocument();
    expect(await screen.findByRole('heading', { name: 'Deadline terdekat' })).toBeInTheDocument();
  });

  test('tamu melihat tombol Masuk dan Daftar', () => {
    tampil('/');
    expect(screen.getByRole('link', { name: 'Masuk' })).toHaveAttribute('href', '/masuk');
    expect(screen.getByRole('link', { name: 'Daftar' })).toHaveAttribute('href', '/daftar');
  });

  test('mahasiswa yang masuk melihat nama dan lencana MAHASISWA', () => {
    sebagai({ id: 1, nama: 'Andi', role: 'mahasiswa' });
    tampil('/');
    expect(screen.getByText('Andi')).toBeInTheDocument();
    expect(screen.getByText('MAHASISWA')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Masuk' })).not.toBeInTheDocument();
  });

  test('admin melihat lencana ADMIN', () => {
    sebagai({ id: 2, nama: 'Admin', role: 'admin' });
    tampil('/');
    expect(screen.getByText('ADMIN')).toBeInTheDocument();
  });

  test('tombol keluar memanggil keluar()', async () => {
    const keluar = vi.fn();
    sebagai({ id: 1, nama: 'Andi', role: 'mahasiswa' }, keluar);
    const user = userEvent.setup();
    tampil('/');
    await user.click(screen.getByRole('button', { name: 'Keluar dari akun' }));
    expect(keluar).toHaveBeenCalledTimes(1);
  });

  test('URL tidak dikenal menampilkan halaman tidak ditemukan', () => {
    tampil('/halaman/ngawur');
    expect(screen.getByText(/Halaman tidak ditemukan/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Kembali ke beranda' })).toHaveAttribute('href', '/');
  });
});

describe('rute yang dilindungi', () => {
  test.each([
    ['/tersimpan'],
    ['/lomba/baru'],
    ['/lomba/3/edit'],
  ])('tamu yang membuka %s diarahkan ke halaman Masuk', (path) => {
    tampil(path);
    expect(screen.getByRole('heading', { name: 'Masuk' })).toBeInTheDocument();
  });

  test('menunggu pemulihan sesi menampilkan "Memuat…" (bukan redirect)', () => {
    useAuth.mockReturnValue({ user: null, siap: false, keluar: vi.fn(), masuk: vi.fn(), daftar: vi.fn() });
    tampil('/tersimpan');
    expect(screen.getByText('Memuat…')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Masuk' })).not.toBeInTheDocument();
  });

  test('pengguna yang sudah masuk dapat membuka halaman Tersimpan', async () => {
    sebagai({ id: 1, nama: 'Andi', role: 'mahasiswa' });
    tampil('/tersimpan');
    expect(await screen.findByRole('heading', { name: 'Lomba tersimpan' })).toBeInTheDocument();
  });

  test('pengguna yang sudah masuk dapat membuka form tambah lomba', async () => {
    sebagai({ id: 1, nama: 'Andi', role: 'mahasiswa' });
    tampil('/lomba/baru');
    expect(await screen.findByRole('heading', { name: 'Tambah lomba' })).toBeInTheDocument();
  });

  test('halaman Daftar dapat dibuka tanpa login', () => {
    tampil('/daftar');
    expect(screen.getByRole('heading', { name: 'Buat akun' })).toBeInTheDocument();
  });
});
