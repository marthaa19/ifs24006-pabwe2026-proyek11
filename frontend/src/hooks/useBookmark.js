import { api } from '../api.js';
import { useGuard } from './useGuard.js';

// Aksi simpan / lepas bookmark. Mengembalikan true jika berhasil, error dikirim ke `setError`.
export function useBookmark(setError) {
  const jaga = useGuard(setError);
  return {
    simpan: (id, catatan = '') => jaga(() => api.simpanBookmark(id, catatan)),
    lepas: (id) => jaga(() => api.hapusBookmark(id)),
  };
}
