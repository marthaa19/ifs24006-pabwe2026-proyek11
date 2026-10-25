// Membungkus aksi async: error dikirim ke `setError`, hasilnya true jika berhasil.
export function useGuard(setError) {
  return async (aksi) => {
    try {
      await aksi();
      return true;
    } catch (e) {
      setError(e.message);
      return false;
    }
  };
}
