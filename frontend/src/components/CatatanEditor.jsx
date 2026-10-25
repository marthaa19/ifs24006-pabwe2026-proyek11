import { useState } from 'react';
import { useBookmark } from '../hooks/useBookmark.js';

// Catatan pribadi pada lomba yang tersimpan (halaman Tersimpan).
export default function CatatanEditor({ lomba, onHapus }) {
  const [catatan, setCatatan] = useState(lomba.catatan || '');
  const [status, setStatus] = useState('');
  const { simpan } = useBookmark(setStatus);

  async function simpanCatatan() {
    if (await simpan(lomba.id, catatan)) setStatus('Catatan disimpan');
  }

  return (
    <div className="catatan">
      <label htmlFor={`catatan-${lomba.id}`}>Catatan untuk lomba ini</label>
      <textarea
        id={`catatan-${lomba.id}`}
        className="input"
        rows="2"
        value={catatan}
        onChange={(e) => {
          setCatatan(e.target.value);
          setStatus('');
        }}
        placeholder="Misalnya: ajak tim, siapkan proposal"
      />
      <div className="catatan__actions">
        <button type="button" className="btn btn--small" onClick={simpanCatatan}>Simpan catatan</button>
        <button type="button" className="btn btn--small btn--ghost" onClick={() => onHapus(lomba)}>Hapus dari simpanan</button>
        {status && <span className="catatan__status" role="status">{status}</span>}
      </div>
    </div>
  );
}
