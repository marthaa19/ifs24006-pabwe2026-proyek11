import { useEffect, useState } from 'react';

// Menjalankan fungsi async setiap `deps` berubah dan mengelola data / loading / error.
// Hasil permintaan lama diabaikan jika deps sudah berubah atau komponen sudah dilepas.
export function useAsync(fn, deps, awal = null) {
  const [data, setData] = useState(awal);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let batal = false;
    setLoading(true);
    Promise.resolve(fn())
      .then((hasil) => {
        if (batal) return;
        setData(hasil);
        setError('');
      })
      .catch((e) => !batal && setError(e.message))
      .finally(() => !batal && setLoading(false));
    return () => {
      batal = true;
    };
    // `fn` sengaja tidak masuk deps: pemanggil menentukan kapan permintaan diulang lewat `deps`.
  }, deps);

  return { data, setData, loading, error, setError };
}
