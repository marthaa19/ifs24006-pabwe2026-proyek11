import { describe, test, expect, beforeEach, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Beranda from '../pages/Beranda.jsx';
import { api } from '../api.js';
import { bekukanTanggal, lombaContoh, renderDiRouter } from '../test-utils.jsx';

vi.mock('../api.js', () => ({
  api: { getKategori: vi.fn(), getLomba: vi.fn(), simpanBookmark: vi.fn(), hapusBookmark: vi.fn() },
  getToken: vi.fn(() => null),
  setToken: vi.fn(),
}));

const DAFTAR = [
  lombaContoh({ id: 1, judul: 'Hackathon Nasional', deadline: '2026-10-27' }),
  lombaContoh({ id: 2, judul: 'Desain Aplikasi', kategori_nama: 'UI/UX', deadline: '2026-11-10', tersimpan: 1 }),
];

const tampil = () => renderDiRouter(<Beranda />);

beforeEach(() => {
  bekukanTanggal();
  Object.values(api).forEach((f) => f.mockReset());
  api.getKategori.mockResolvedValue([{ id: 1, nama: 'Programming' }, { id: 2, nama: 'UI/UX' }]);
  api.getLomba.mockResolvedValue(DAFTAR);
  api.simpanBookmark.mockResolvedValue({});
  api.hapusBookmark.mockResolvedValue({});
});

describe('Beranda', () => {
  test('memuat lomba dengan filter awal (aktif, deadline terdekat)', async () => {
    tampil();
    expect(await screen.findByText('Hackathon Nasional')).toBeInTheDocument();
    expect(screen.getByText('Desain Aplikasi')).toBeInTheDocument();
    expect(screen.getByText('2 lomba ditemukan')).toBeInTheDocument();
    expect(api.getLomba).toHaveBeenCalledWith(expect.objectContaining({ status: 'aktif', sort: 'deadline', q: '', kategori: '', tingkat: '' }));
  });

  test('menampilkan "Memuat lomba…" saat loading', () => {
    api.getLomba.mockReturnValue(new Promise(() => {}));
    tampil();
    expect(screen.getByText('Memuat lomba…')).toBeInTheDocument();
  });

  test('daftar kategori masuk ke dropdown', async () => {
    tampil();
    expect(await screen.findByRole('option', { name: 'Programming' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'UI/UX' })).toBeInTheDocument();
  });

  test('keadaan kosong menampilkan petunjuk dan tautan tambah lomba', async () => {
    api.getLomba.mockResolvedValue([]);
    tampil();
    expect(await screen.findByText(/Belum ada lomba yang cocok/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'tambah lomba baru' })).toHaveAttribute('href', '/lomba/baru');
    expect(screen.getByText('0 lomba ditemukan')).toBeInTheDocument();
  });

  test('error dari API ditampilkan', async () => {
    api.getLomba.mockRejectedValue(new Error('Tidak bisa terhubung ke server.'));
    tampil();
    expect(await screen.findByRole('alert')).toHaveTextContent('Tidak bisa terhubung ke server.');
    expect(screen.queryByText(/Belum ada lomba yang cocok/)).not.toBeInTheDocument();
  });

  test('tombol status "Sudah lewat" memuat ulang dengan status=lewat', async () => {
    const user = userEvent.setup();
    tampil();
    await screen.findByText('Hackathon Nasional');
    const tombol = screen.getByRole('button', { name: 'Sudah lewat' });
    expect(tombol).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByRole('button', { name: 'Masih buka' })).toHaveAttribute('aria-pressed', 'true');

    await user.click(tombol);
    await waitFor(() => expect(api.getLomba).toHaveBeenLastCalledWith(expect.objectContaining({ status: 'lewat' })));
    expect(screen.getByRole('button', { name: 'Sudah lewat' })).toHaveAttribute('aria-pressed', 'true');
  });

  test('status "Semua" mengirim status kosong', async () => {
    const user = userEvent.setup();
    tampil();
    await screen.findByText('Hackathon Nasional');
    await user.click(screen.getByRole('button', { name: 'Semua' }));
    await waitFor(() => expect(api.getLomba).toHaveBeenLastCalledWith(expect.objectContaining({ status: '' })));
  });

  test('filter kategori, tingkat, dan urutan diteruskan ke API', async () => {
    const user = userEvent.setup();
    tampil();
    await screen.findByRole('option', { name: 'UI/UX' });

    await user.selectOptions(screen.getByLabelText('Kategori'), '2');
    await waitFor(() => expect(api.getLomba).toHaveBeenLastCalledWith(expect.objectContaining({ kategori: '2' })));

    await user.selectOptions(screen.getByLabelText('Tingkat'), 'internasional');
    await waitFor(() => expect(api.getLomba).toHaveBeenLastCalledWith(expect.objectContaining({ kategori: '2', tingkat: 'internasional' })));

    await user.selectOptions(screen.getByLabelText('Urutan'), 'terbaru');
    await waitFor(() => expect(api.getLomba).toHaveBeenLastCalledWith(expect.objectContaining({ sort: 'terbaru' })));
  });

  test('pencarian dikirim setelah jeda (debounce) dengan nilai terakhir', async () => {
    const user = userEvent.setup();
    tampil();
    await screen.findByText('Hackathon Nasional');
    await user.type(screen.getByLabelText('Cari lomba'), 'robot');
    await waitFor(() => expect(api.getLomba).toHaveBeenLastCalledWith(expect.objectContaining({ q: 'robot' })), { timeout: 2000 });
    // tidak ada panggilan untuk huruf setengah jadi
    const nilaiQ = api.getLomba.mock.calls.map(([f]) => f.q);
    expect(nilaiQ).not.toContain('rob');
  });

  test('klik "Simpan" menyimpan bookmark dan tombol berubah menjadi "Tersimpan"', async () => {
    const user = userEvent.setup();
    tampil();
    await screen.findByText('Hackathon Nasional');
    const tombol = screen.getAllByRole('button', { name: /Simpan/ })[0];
    await user.click(tombol);
    await waitFor(() => expect(api.simpanBookmark).toHaveBeenCalledWith(1, ''));
    await waitFor(() => expect(screen.getAllByRole('button', { name: /Tersimpan/ })).toHaveLength(2));
  });

  test('klik "Tersimpan" menghapus bookmark', async () => {
    const user = userEvent.setup();
    tampil();
    await screen.findByText('Desain Aplikasi');
    await user.click(screen.getByRole('button', { name: /Tersimpan/ }));
    await waitFor(() => expect(api.hapusBookmark).toHaveBeenCalledWith(2));
    await waitFor(() => expect(screen.queryByRole('button', { name: /Tersimpan/ })).not.toBeInTheDocument());
  });

  test('gagal menyimpan bookmark menampilkan error dan status tidak berubah', async () => {
    api.simpanBookmark.mockRejectedValue(new Error('Silakan masuk terlebih dahulu'));
    const user = userEvent.setup();
    tampil();
    await screen.findByText('Hackathon Nasional');
    await user.click(screen.getAllByRole('button', { name: /Simpan/ })[0]);
    expect(await screen.findByRole('alert')).toHaveTextContent('Silakan masuk terlebih dahulu');
    expect(screen.getAllByRole('button', { name: /Tersimpan/ })).toHaveLength(1);
  });
});
