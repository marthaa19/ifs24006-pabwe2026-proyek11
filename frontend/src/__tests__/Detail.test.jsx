import { describe, test, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import Detail from '../pages/Detail.jsx';
import { api } from '../api.js';
import { useAuth } from '../AuthContext.jsx';
import { bekukanTanggal, lombaContoh } from '../test-utils.jsx';

vi.mock('../api.js', () => ({
  api: { getLombaById: vi.fn(), simpanBookmark: vi.fn(), hapusBookmark: vi.fn(), hapusLomba: vi.fn() },
  getToken: vi.fn(() => null),
  setToken: vi.fn(),
}));
vi.mock('../AuthContext.jsx', () => ({ useAuth: vi.fn() }));

const tampil = () =>
  render(
    <MemoryRouter initialEntries={['/lomba/1']}>
      <Routes>
        <Route path="/" element={<p>Halaman Beranda</p>} />
        <Route path="/lomba/:id" element={<Detail />} />
        <Route path="/lomba/:id/edit" element={<p>Halaman Edit</p>} />
      </Routes>
    </MemoryRouter>
  );

beforeEach(() => {
  bekukanTanggal();
  Object.values(api).forEach((f) => f.mockReset());
  api.getLombaById.mockResolvedValue(lombaContoh());
  api.simpanBookmark.mockResolvedValue({});
  api.hapusBookmark.mockResolvedValue({});
  api.hapusLomba.mockResolvedValue({});
  useAuth.mockReturnValue({ user: null });
});

describe('Detail lomba', () => {
  test('menampilkan "Memuat detail lomba…" lalu isi lomba', async () => {
    tampil();
    expect(screen.getByText('Memuat detail lomba…')).toBeInTheDocument();
    expect(await screen.findByRole('heading', { name: 'Hackathon Nasional' })).toBeInTheDocument();
    expect(api.getLombaById).toHaveBeenCalledWith('1');
    expect(screen.getByText('Bangun aplikasi dalam 48 jam')).toBeInTheDocument();
    expect(screen.getByText('Programming')).toBeInTheDocument();
    expect(screen.getByText('Rp10.000.000')).toBeInTheDocument();
    expect(screen.getByText(/27 Oktober 2026/)).toBeInTheDocument();
  });

  test('field kosong ditampilkan sebagai "-"', async () => {
    api.getLombaById.mockResolvedValue(lombaContoh({ hadiah: null, biaya: null, mode: null, tingkat: null }));
    tampil();
    await screen.findByRole('heading', { name: 'Hackathon Nasional' });
    expect(screen.getAllByText('-')).toHaveLength(4);
  });

  test('tautan pendaftaran membuka tab baru dengan rel aman', async () => {
    tampil();
    const link = await screen.findByRole('link', { name: 'Buka halaman pendaftaran' });
    expect(link).toHaveAttribute('href', 'https://example.com/daftar');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', expect.stringContaining('noopener'));
  });

  test('tanpa link pendaftaran tombolnya tidak muncul', async () => {
    api.getLombaById.mockResolvedValue(lombaContoh({ link_pendaftaran: null }));
    tampil();
    await screen.findByRole('heading', { name: 'Hackathon Nasional' });
    expect(screen.queryByRole('link', { name: 'Buka halaman pendaftaran' })).not.toBeInTheDocument();
  });

  test('lomba tidak ditemukan menampilkan pesan error dan tautan kembali', async () => {
    api.getLombaById.mockRejectedValue(new Error('Lomba tidak ditemukan'));
    tampil();
    expect(await screen.findByRole('alert')).toHaveTextContent('Lomba tidak ditemukan');
    expect(screen.getByRole('link', { name: 'Kembali ke beranda' })).toHaveAttribute('href', '/');
  });

  test('menyimpan lomba dengan catatan', async () => {
    const user = userEvent.setup();
    tampil();
    await screen.findByRole('heading', { name: 'Hackathon Nasional' });
    await user.type(screen.getByLabelText('Catatan (opsional)'), 'cari anggota tim');
    await user.click(screen.getByRole('button', { name: 'Simpan lomba' }));
    await waitFor(() => expect(api.simpanBookmark).toHaveBeenCalledWith(1, 'cari anggota tim'));
    expect(await screen.findByRole('button', { name: 'Hapus dari simpanan' })).toBeInTheDocument();
  });

  test('lomba yang sudah tersimpan bisa dilepas', async () => {
    api.getLombaById.mockResolvedValue(lombaContoh({ tersimpan: 1 }));
    const user = userEvent.setup();
    tampil();
    await user.click(await screen.findByRole('button', { name: 'Hapus dari simpanan' }));
    await waitFor(() => expect(api.hapusBookmark).toHaveBeenCalledWith(1));
    expect(await screen.findByRole('button', { name: 'Simpan lomba' })).toBeInTheDocument();
  });

  test('gagal menyimpan menampilkan error tetapi halaman tetap tampil', async () => {
    api.simpanBookmark.mockRejectedValue(new Error('Silakan masuk terlebih dahulu'));
    const user = userEvent.setup();
    tampil();
    await user.click(await screen.findByRole('button', { name: 'Simpan lomba' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Silakan masuk terlebih dahulu');
    expect(screen.getByRole('heading', { name: 'Hackathon Nasional' })).toBeInTheDocument();
  });

  describe('tombol kelola (edit/hapus)', () => {
    const adaTombolKelola = () => screen.queryByRole('link', { name: 'Edit lomba' }) !== null;

    test('tamu tidak melihatnya', async () => {
      tampil();
      await screen.findByRole('heading', { name: 'Hackathon Nasional' });
      expect(adaTombolKelola()).toBe(false);
      expect(screen.queryByRole('button', { name: 'Hapus lomba' })).not.toBeInTheDocument();
    });

    test('mahasiswa lain tidak melihatnya', async () => {
      useAuth.mockReturnValue({ user: { id: 99, role: 'mahasiswa' } });
      tampil();
      await screen.findByRole('heading', { name: 'Hackathon Nasional' });
      expect(adaTombolKelola()).toBe(false);
    });

    test('pemilik lomba melihatnya', async () => {
      useAuth.mockReturnValue({ user: { id: 7, role: 'mahasiswa' } });
      tampil();
      const edit = await screen.findByRole('link', { name: 'Edit lomba' });
      expect(edit).toHaveAttribute('href', '/lomba/1/edit');
      expect(screen.getByRole('button', { name: 'Hapus lomba' })).toBeInTheDocument();
    });

    test('admin melihatnya untuk lomba siapa pun', async () => {
      useAuth.mockReturnValue({ user: { id: 1, role: 'admin' } });
      tampil();
      expect(await screen.findByRole('link', { name: 'Edit lomba' })).toBeInTheDocument();
    });

    test('hapus dengan konfirmasi "OK" memanggil API lalu kembali ke beranda', async () => {
      useAuth.mockReturnValue({ user: { id: 7, role: 'mahasiswa' } });
      const confirm = vi.spyOn(window, 'confirm').mockReturnValue(true);
      const user = userEvent.setup();
      tampil();
      await user.click(await screen.findByRole('button', { name: 'Hapus lomba' }));
      expect(confirm).toHaveBeenCalledWith(expect.stringContaining('Hackathon Nasional'));
      await waitFor(() => expect(api.hapusLomba).toHaveBeenCalledWith(1));
      expect(await screen.findByText('Halaman Beranda')).toBeInTheDocument();
    });

    test('hapus dibatalkan jika konfirmasi ditolak', async () => {
      useAuth.mockReturnValue({ user: { id: 7, role: 'mahasiswa' } });
      vi.spyOn(window, 'confirm').mockReturnValue(false);
      const user = userEvent.setup();
      tampil();
      await user.click(await screen.findByRole('button', { name: 'Hapus lomba' }));
      expect(api.hapusLomba).not.toHaveBeenCalled();
      expect(screen.getByRole('heading', { name: 'Hackathon Nasional' })).toBeInTheDocument();
    });

    test('hapus yang ditolak server menampilkan error', async () => {
      useAuth.mockReturnValue({ user: { id: 7, role: 'mahasiswa' } });
      vi.spyOn(window, 'confirm').mockReturnValue(true);
      api.hapusLomba.mockRejectedValue(new Error('Kamu hanya bisa menghapus lomba yang kamu tambahkan'));
      const user = userEvent.setup();
      tampil();
      await user.click(await screen.findByRole('button', { name: 'Hapus lomba' }));
      expect(await screen.findByRole('alert')).toHaveTextContent('Kamu hanya bisa menghapus');
      expect(screen.queryByText('Halaman Beranda')).not.toBeInTheDocument();
    });
  });
});
