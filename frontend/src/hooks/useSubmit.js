import { useState } from 'react';

// Penanganan kirim formulir: cegah submit bawaan, atur loading, dan tangkap error.
export function useSubmit(aksi) {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await aksi();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return { onSubmit, loading, error };
}
