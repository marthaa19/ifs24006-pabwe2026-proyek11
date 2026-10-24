import { describe, test, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import LombaRow from '../components/LombaRow.jsx';
import { bekukanTanggal, lombaContoh } from '../test-utils.jsx';

const tampil = (props) =>
  render(
    <MemoryRouter>
      <LombaRow {...props} />
    </MemoryRouter>
  );

beforeEach(bekukanTanggal);

describe('LombaRow', () => {
  test('menampilkan judul sebagai tautan ke halaman detail', () => {
    tampil({ lomba: lombaContoh({ id: 12 }) });
    const link = screen.getByRole('link', { name: 'Hackathon Nasional' });
    expect(link).toHaveAttribute('href', '/lomba/12');
    expect(screen.getByText('Komunitas Dev')).toBeInTheDocument();
  });

  test('menampilkan tag kategori, tingkat, mode, dan biaya', () => {
    tampil({ lomba: lombaContoh() });
    for (const t of ['Programming', 'nasional', 'online', 'gratis']) {
      expect(screen.getByText(t)).toBeInTheDocument();
    }
  });

  test('tag yang kosong tidak ditampilkan', () => {
    tampil({ lomba: lombaContoh({ mode: null, biaya: '' }) });
    expect(screen.queryByText('online')).not.toBeInTheDocument();
    expect(screen.queryByText('gratis')).not.toBeInTheDocument();
  });

  test('hitung mundur: 3 hari lagi → tone urgent', () => {
    const { container } = tampil({ lomba: lombaContoh({ deadline: '2026-10-27' }) });
    expect(screen.getByLabelText('3 hari lagi')).toBeInTheDocument();
    expect(container.querySelector('article')).toHaveClass('row--urgent');
  });

  test('deadline jauh → tone calm', () => {
    const { container } = tampil({ lomba: lombaContoh({ deadline: '2026-12-31' }) });
    expect(container.querySelector('article')).toHaveClass('row--calm');
  });

  test('deadline lewat → tone past dan tulisan "Lewat"', () => {
    const { container } = tampil({ lomba: lombaContoh({ deadline: '2026-10-20' }) });
    expect(container.querySelector('article')).toHaveClass('row--past');
    expect(screen.getByText('Lewat')).toBeInTheDocument();
    expect(screen.getByText('4 hari lalu')).toBeInTheDocument();
  });

  test('deadline hari ini', () => {
    tampil({ lomba: lombaContoh({ deadline: '2026-10-24' }) });
    expect(screen.getByText('Hari ini')).toBeInTheDocument();
  });

  test('menampilkan tanggal deadline dan hadiah', () => {
    tampil({ lomba: lombaContoh({ deadline: '2026-10-27', hadiah: 'Rp10.000.000' }) });
    expect(screen.getByText(/Deadline 27 Oktober 2026/)).toBeInTheDocument();
    expect(screen.getByText(/Hadiah Rp10\.000\.000/)).toBeInTheDocument();
  });

  test('tanpa onToggle tidak ada tombol simpan', () => {
    tampil({ lomba: lombaContoh() });
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  test('tombol "Simpan" memanggil onToggle dengan data lomba', () => {
    const onToggle = vi.fn();
    const lomba = lombaContoh({ tersimpan: 0 });
    tampil({ lomba, onToggle });
    const tombol = screen.getByRole('button', { name: /Simpan/ });
    expect(tombol).toHaveAttribute('aria-pressed', 'false');
    fireEvent.click(tombol);
    expect(onToggle).toHaveBeenCalledWith(lomba);
  });

  test('lomba tersimpan menampilkan tombol "Tersimpan" yang aktif', () => {
    tampil({ lomba: lombaContoh({ tersimpan: 1 }), onToggle: () => {} });
    const tombol = screen.getByRole('button', { name: /Tersimpan/ });
    expect(tombol).toHaveAttribute('aria-pressed', 'true');
    expect(tombol).toHaveClass('save--on');
  });

  test('children dirender di dalam kartu', () => {
    tampil({ lomba: lombaContoh(), children: <p>Isi tambahan</p> });
    expect(screen.getByText('Isi tambahan')).toBeInTheDocument();
  });
});
