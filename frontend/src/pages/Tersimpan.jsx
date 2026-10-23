import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import LombaRow from '../components/LombaRow.jsx';

function CatatanEditor({ lomba, onHapus }) {
  const [catatan, setCatatan] = useState(lomba.catatan || '');
  const [status, setStatus] = useState('');

  async function simpan() {
    try {
      await api.simpanBookmark(lomba.id, catatan);
      setStatus('Catatan disimpan');
    } catch (e) {
      setStatus(e.message);
    }
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
        <button type="button" className="btn btn--small" onClick={simpan}>Simpan catatan</button>
        <button type="button" className="btn btn--small btn--ghost" onClick={() => onHapus(lomba)}>Hapus dari simpanan</button>
        {status && <span className="catatan__status" role="status">{status}</span>}
      </div>
    </div>
  );
}

export default function Tersimpan() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .getBookmark()
      .then(setItems)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  async function hapus(lomba) {
    try {
      await api.hapusBookmark(lomba.id);
      setItems((list) => list.filter((x) => x.id !== lomba.id));
    } catch (e) {
      setError(e.message);
    }
  }

  return (
    <>
      <section className="pagehead">
        <h1>Lomba tersimpan</h1>
        <p>{loading ? 'Memuat…' : `${items.length} lomba, diurutkan dari deadline terdekat`}</p>
      </section>

      {error && <p className="notice notice--error" role="alert">{error}</p>}

      {!error && !loading && items.length === 0 && (
        <div className="empty">
          <p>Kamu belum menyimpan lomba apa pun.</p>
          <p>Buka <Link to="/">beranda</Link> lalu tekan Simpan pada lomba yang menarik.</p>
        </div>
      )}

      <section className="list">
        {items.map((l) => (
          <LombaRow key={l.id} lomba={l}>
            <CatatanEditor lomba={l} onHapus={hapus} />
          </LombaRow>
        ))}
      </section>
    </>
  );
}
