import { useState } from 'react';
import { Link } from 'react-router-dom';

// Panel simpan / lepas lomba di halaman Detail.
export default function BookmarkPanel({ tersimpan, onSimpan, onLepas }) {
  const [catatan, setCatatan] = useState('');

  return (
    <section className="panel">
      {tersimpan ? (
        <>
          <p>Lomba ini ada di daftar simpananmu. Ubah catatan di halaman <Link to="/tersimpan">Tersimpan</Link>.</p>
          <button type="button" className="btn btn--ghost" onClick={onLepas}>Hapus dari simpanan</button>
        </>
      ) : (
        <>
          <label htmlFor="catatan">Catatan (opsional)</label>
          <textarea
            id="catatan"
            className="input"
            rows="2"
            value={catatan}
            onChange={(e) => setCatatan(e.target.value)}
            placeholder="Misalnya: cari anggota tim"
          />
          <button type="button" className="btn" onClick={() => onSimpan(catatan)}>Simpan lomba</button>
        </>
      )}
    </section>
  );
}
