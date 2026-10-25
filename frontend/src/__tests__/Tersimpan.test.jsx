import { describe, test, expect, beforeEach, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Tersimpan from '../pages/Tersimpan.jsx';
import { api } from '../api.js';
import { bekukanTanggal, lombaContoh, renderDiRouter } from '../test-utils.jsx';

vi.mock('../api.js', () => ({
  api: { getBookmark: vi.fn(), simpanBookmark: vi.fn(), hapusBookmark: vi.fn() },
  getToken: vi.fn(() => null),
  setToken: vi.fn(),
}));

const tampil = () => renderDiRouter(<Tersimpan />);

beforeEach(() => {
  bekukanTanggal();
  Object.values(api).forEach((f) => f.mockReset());
  api.getBookmark.mockResolvedValue([
    lombaContoh({ id: 1, judul: 'Lomba Satu', catatan: 'ajak Budi', tersimpan: 1 }),
    lombaContoh({ id: 2, judul: 'Lomba Dua', catatan: null, tersimpan: 1, deadline: '2026-11-20' }),
  ]);
  api.simpanBookmark.mockResolvedValue({});
  api.hapusBookmark.mockResolvedValue({});
});

describe('Tersimpan', () => {
  test('menampilkan lomba tersimpan beserta jumlahnya', async () => {
    tampil();
    expect(screen.getByText('Memuat…')).toBeInTheDocument();
    expect(await screen.findByText('Lomba Satu')).toBeInTheDocument();
    expect(screen.getByText('Lomba Dua')).toBeInTheDocument();
    expect(screen.getByText(/2 lomba, diurutkan dari deadline terdekat/)).toBeInTheDocument();
  });

  test('catatan yang ada terisi di textarea', async () => {
    tampil();
    await screen.findByText('Lomba Satu');
    const kolom = screen.getAllByLabelText('Catatan untuk lomba ini');
    expect(kolom[0]).toHaveValue('ajak Budi');
    expect(kolom[1]).toHaveValue('');
  });

  test('daftar kosong menampilkan petunjuk menuju beranda', async () => {
    api.getBookmark.mockResolvedValue([]);
    tampil();
    expect(await screen.findByText('Kamu belum menyimpan lomba apa pun.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'beranda' })).toHaveAttribute('href', '/');
  });

  test('error saat memuat ditampilkan', async () => {
    api.getBookmark.mockRejectedValue(new Error('Silakan masuk terlebih dahulu'));
    tampil();
    expect(await screen.findByRole('alert')).toHaveTextContent('Silakan masuk terlebih dahulu');
  });

  test('mengubah dan menyimpan catatan', async () => {
    api.getBookmark.mockResolvedValue([lombaContoh({ id: 1, judul: 'Lomba Satu', catatan: 'lama', tersimpan: 1 })]);
    const user = userEvent.setup();
    tampil();
    const kolom = await screen.findByLabelText('Catatan untuk lomba ini');
    await user.clear(kolom);
    await user.type(kolom, 'catatan baru');
    await user.click(screen.getByRole('button', { name: 'Simpan catatan' }));
    await waitFor(() => expect(api.simpanBookmark).toHaveBeenCalledWith(1, 'catatan baru'));
    expect(await screen.findByRole('status')).toHaveTextContent('Catatan disimpan');
  });

  test('status "Catatan disimpan" hilang saat catatan diedit lagi', async () => {
    api.getBookmark.mockResolvedValue([lombaContoh({ id: 1, catatan: '', tersimpan: 1 })]);
    const user = userEvent.setup();
    tampil();
    const kolom = await screen.findByLabelText('Catatan untuk lomba ini');
    await user.click(screen.getByRole('button', { name: 'Simpan catatan' }));
    await screen.findByRole('status');
    await user.type(kolom, 'x');
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  test('gagal menyimpan catatan menampilkan pesan error di samping tombol', async () => {
    api.getBookmark.mockResolvedValue([lombaContoh({ id: 1, tersimpan: 1 })]);
    api.simpanBookmark.mockRejectedValue(new Error('Lomba tidak ditemukan'));
    const user = userEvent.setup();
    tampil();
    await user.click(await screen.findByRole('button', { name: 'Simpan catatan' }));
    expect(await screen.findByRole('status')).toHaveTextContent('Lomba tidak ditemukan');
  });

  test('"Hapus dari simpanan" memanggil API dan membuang kartu dari daftar', async () => {
    const user = userEvent.setup();
    tampil();
    await screen.findByText('Lomba Satu');
    await user.click(screen.getAllByRole('button', { name: 'Hapus dari simpanan' })[0]);
    await waitFor(() => expect(api.hapusBookmark).toHaveBeenCalledWith(1));
    await waitFor(() => expect(screen.queryByText('Lomba Satu')).not.toBeInTheDocument());
    expect(screen.getByText('Lomba Dua')).toBeInTheDocument();
  });
});
