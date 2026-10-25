// Daftar pilihan yang dipakai bersama oleh filter (Beranda) dan formulir lomba.
export const TINGKAT = [
  { value: 'kampus', label: 'Kampus' },
  { value: 'nasional', label: 'Nasional' },
  { value: 'internasional', label: 'Internasional' },
];
export const MODE = [
  { value: 'online', label: 'Online' },
  { value: 'offline', label: 'Offline' },
  { value: 'hybrid', label: 'Hybrid' },
];
export const BIAYA = [
  { value: 'gratis', label: 'Gratis' },
  { value: 'berbayar', label: 'Berbayar' },
];
export const URUTAN = [
  { value: 'deadline', label: 'Deadline terdekat' },
  { value: 'terbaru', label: 'Terbaru ditambahkan' },
];
export const STATUS = [
  { value: 'aktif', label: 'Masih buka' },
  { value: '', label: 'Semua' },
  { value: 'lewat', label: 'Sudah lewat' },
];

// Data kategori dari API -> bentuk opsi <select>.
export const opsiKategori = (daftar) => daftar.map((k) => ({ value: k.id, label: k.nama }));
