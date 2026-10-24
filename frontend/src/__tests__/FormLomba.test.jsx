import { describe, test, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import FormLomba from '../pages/FormLomba.jsx';
import { api } from '../api.js';
import { lombaContoh } from '../test-utils.jsx';

vi.mock('../api.js', () => ({
  api: { getKategori: vi.fn(), getLombaById: vi.fn(), tambahLomba: vi.fn(), ubahLomba: vi.fn() },
  getToken: vi.fn(() => null),
  setToken: vi.fn(),
}));

const tampil = (awal) =>
  render(
    <MemoryRouter initialEntries={[awal]}>
      <Routes>
        <Route path="/" element={<p>Halaman Beranda</p>} />
        <Route path="/lomba/baru" element={<FormLomba />} />
        <Route path="/lomba/:id/edit" element={<FormLomba />} />
        <Route path="/lomba/:id" element={<p>Halaman Detail</p>} />
      </Routes>
    </MemoryRouter>
  );

beforeEach(() => {
  Object.values(api).forEach((f) => f.mockReset());
  api.getKategori.mockResolvedValue([{ id: 1, nama: 'Programming' }, { id: 2, nama: 'UI/UX' }]);
});

describe('FormLomba: tambah', () => {
  test('menampilkan form kosong dengan nilai bawaan', async () => {
    tampil('/lomba/baru');
    expect(screen.getByRole('heading', { name: 'Tambah lomba' })).toBeInTheDocument();
    await screen.findByRole('option', { name: 'Programming' });
    expect(screen.getByLabelText('Judul lomba')).toHaveValue('');
    expect(screen.getByLabelText('Tingkat')).toHaveValue('nasional');
    expect(screen.getByLabelText('Pelaksanaan')).toHaveValue('online');
    expect(screen.getByLabelText('Biaya')).toHaveValue('gratis');
    expect(api.getLombaById).not.toHaveBeenCalled();
  });

  test('kolom wajib ditandai required', async () => {
    tampil('/lomba/baru');
    await screen.findByRole('option', { name: 'Programming' });
    for (const label of ['Judul lomba', 'Penyelenggara', 'Kategori', 'Deadline pendaftaran']) {
      expect(screen.getByLabelText(label)).toBeRequired();
    }
  });

  test('submit mengirim data (kategori_id sebagai angka) lalu membuka halaman detail', async () => {
    api.tambahLomba.mockResolvedValue({ id: 9 });
    const user = userEvent.setup();
    tampil('/lomba/baru');
    await screen.findByRole('option', { name: 'UI/UX' });

    await user.type(screen.getByLabelText('Judul lomba'), 'Lomba Baru');
    await user.type(screen.getByLabelText('Penyelenggara'), 'Panitia X');
    await user.selectOptions(screen.getByLabelText('Kategori'), '2');
    fireEvent.change(screen.getByLabelText('Deadline pendaftaran'), { target: { value: '2026-12-31' } });
    await user.selectOptions(screen.getByLabelText('Tingkat'), 'kampus');
    await user.type(screen.getByLabelText('Hadiah'), 'Rp1.000.000');
    await user.click(screen.getByRole('button', { name: 'Simpan lomba' }));

    await waitFor(() => expect(api.tambahLomba).toHaveBeenCalledTimes(1));
    expect(api.tambahLomba).toHaveBeenCalledWith(
      expect.objectContaining({
        judul: 'Lomba Baru',
        penyelenggara: 'Panitia X',
        kategori_id: 2,
        deadline: '2026-12-31',
        tingkat: 'kampus',
        hadiah: 'Rp1.000.000',
      })
    );
    expect(await screen.findByText('Halaman Detail')).toBeInTheDocument();
  });

  test('error dari server ditampilkan dan form dapat dikirim ulang', async () => {
    api.tambahLomba.mockRejectedValue(new Error('Format deadline harus YYYY-MM-DD'));
    const user = userEvent.setup();
    tampil('/lomba/baru');
    await screen.findByRole('option', { name: 'Programming' });
    await user.type(screen.getByLabelText('Judul lomba'), 'L');
    await user.type(screen.getByLabelText('Penyelenggara'), 'P');
    await user.selectOptions(screen.getByLabelText('Kategori'), '1');
    fireEvent.change(screen.getByLabelText('Deadline pendaftaran'), { target: { value: '2026-12-31' } });
    await user.click(screen.getByRole('button', { name: 'Simpan lomba' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Format deadline harus YYYY-MM-DD');
    expect(screen.getByRole('button', { name: 'Simpan lomba' })).toBeEnabled();
  });

  test('tautan Batal kembali ke beranda', async () => {
    tampil('/lomba/baru');
    await screen.findByRole('option', { name: 'Programming' });
    expect(screen.getByRole('link', { name: 'Batal' })).toHaveAttribute('href', '/');
  });
});

describe('FormLomba: edit', () => {
  test('mengisi form dengan data lomba yang ada', async () => {
    api.getLombaById.mockResolvedValue(lombaContoh({ id: 5, judul: 'Lomba Lama', kategori_id: 2, deadline: '2026-11-11', hadiah: null }));
    tampil('/lomba/5/edit');
    expect(screen.getByRole('heading', { name: 'Edit lomba' })).toBeInTheDocument();
    await waitFor(() => expect(screen.getByLabelText('Judul lomba')).toHaveValue('Lomba Lama'));
    expect(api.getLombaById).toHaveBeenCalledWith('5');
    expect(screen.getByLabelText('Deadline pendaftaran')).toHaveValue('2026-11-11');
    await waitFor(() => expect(screen.getByLabelText('Kategori')).toHaveValue('2'));
    expect(screen.getByLabelText('Hadiah')).toHaveValue('');
    expect(screen.getByRole('link', { name: 'Batal' })).toHaveAttribute('href', '/lomba/5');
  });

  test('submit memanggil ubahLomba dengan id dari URL', async () => {
    api.getLombaById.mockResolvedValue(lombaContoh({ id: 5, kategori_id: 1 }));
    api.ubahLomba.mockResolvedValue({ id: 5 });
    const user = userEvent.setup();
    tampil('/lomba/5/edit');
    const judul = await screen.findByDisplayValue('Hackathon Nasional');
    await screen.findByRole('option', { name: 'Programming' });
    await user.clear(judul);
    await user.type(judul, 'Judul Diperbarui');
    await user.click(screen.getByRole('button', { name: 'Simpan lomba' }));

    await waitFor(() => expect(api.ubahLomba).toHaveBeenCalledWith('5', expect.objectContaining({ judul: 'Judul Diperbarui', kategori_id: 1 })));
    expect(api.tambahLomba).not.toHaveBeenCalled();
    expect(await screen.findByText('Halaman Detail')).toBeInTheDocument();
  });

  test('gagal memuat lomba menampilkan error', async () => {
    api.getLombaById.mockRejectedValue(new Error('Lomba tidak ditemukan'));
    tampil('/lomba/404/edit');
    expect(await screen.findByRole('alert')).toHaveTextContent('Lomba tidak ditemukan');
  });
});
