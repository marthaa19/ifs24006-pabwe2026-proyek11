import { vi } from 'vitest';

// Tanggal "hari ini" tetap agar hitung mundur deadline stabil: 24 Oktober 2026.
// Hanya Date yang dipalsukan; setTimeout/Promise tetap asli supaya waitFor berjalan normal.
export function bekukanTanggal() {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(2026, 9, 24, 12, 0, 0));
}

export const lombaContoh = (o = {}) => ({
  id: 1,
  judul: 'Hackathon Nasional',
  penyelenggara: 'Komunitas Dev',
  kategori_id: 1,
  kategori_nama: 'Programming',
  deskripsi: 'Bangun aplikasi dalam 48 jam',
  tingkat: 'nasional',
  mode: 'online',
  hadiah: 'Rp10.000.000',
  biaya: 'gratis',
  deadline: '2026-10-27',
  link_pendaftaran: 'https://example.com/daftar',
  created_by: 7,
  tersimpan: 0,
  ...o,
});
