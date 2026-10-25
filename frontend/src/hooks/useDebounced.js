import { useEffect, useState } from 'react';

// Mengembalikan `nilai` yang baru berubah setelah `jeda` ms tanpa perubahan.
export function useDebounced(nilai, jeda = 300) {
  const [hasil, setHasil] = useState(nilai);
  useEffect(() => {
    const t = setTimeout(() => setHasil(nilai), jeda);
    return () => clearTimeout(t);
  }, [nilai, jeda]);
  return hasil;
}
