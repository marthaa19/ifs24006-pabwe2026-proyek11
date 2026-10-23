import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import LombaRow from '../components/LombaRow.jsx';

const STATUS = [
  { nilai: 'aktif', label: 'Masih buka' },
  { nilai: '', label: 'Semua' },
  { nilai: 'lewat', label: 'Sudah lewat' },
];

export default function Beranda() {
  const [filters, setFilters] = useState({ q: '', kategori: '', tingkat: '', status: 'aktif', sort: 'deadline' });
  const [qInput, setQInput] = useState('');
  const [kategori, setKategori] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.getKategori().then(setKategori).catch(() => {});
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setFilters((f) => ({ ...f, q: qInput })), 300);
    return () => clearTimeout(t);
  }, [qInput]);

  useEffect(() => {
    let batal = false;
    setLoading(true);
    api
      .getLomba(filters)
      .then((data) => {
        if (batal) return;
        setItems(data);
        setError('');
      })
      .catch((e) => !batal && setError(e.message))
      .finally(() => !batal && setLoading(false));
    return () => {
      batal = true;
    };
  }, [filters]);

  const ubah = (k, v) => setFilters((f) => ({ ...f, [k]: v }));

  async function toggleBookmark(lomba) {
    try {
      if (lomba.tersimpan) await api.hapusBookmark(lomba.id);
      else await api.simpanBookmark(lomba.id, '');
      setItems((list) => list.map((x) => (x.id === lomba.id ? { ...x, tersimpan: x.tersimpan ? 0 : 1 } : x)));
    } catch (e) {
      setError(e.message);
    }
  }

  return (
    <>
      <section className="pagehead">
        <h1>Deadline terdekat</h1>
        <p>{loading ? 'Memuat lomba…' : `${items.length} lomba ditemukan`}</p>
      </section>

      <section className="toolbar" aria-label="Pencarian dan filter">
        <input
          type="search"
          className="input toolbar__search"
          placeholder="Cari judul, penyelenggara, atau deskripsi"
          value={qInput}
          onChange={(e) => setQInput(e.target.value)}
          aria-label="Cari lomba"
        />
        <div className="toolbar__row">
          <select className="input" value={filters.kategori} onChange={(e) => ubah('kategori', e.target.value)} aria-label="Kategori">
            <option value="">Semua kategori</option>
            {kategori.map((k) => (
              <option key={k.id} value={k.id}>{k.nama}</option>
            ))}
          </select>
          <select className="input" value={filters.tingkat} onChange={(e) => ubah('tingkat', e.target.value)} aria-label="Tingkat">
            <option value="">Semua tingkat</option>
            <option value="kampus">Kampus</option>
            <option value="nasional">Nasional</option>
            <option value="internasional">Internasional</option>
          </select>
          <select className="input" value={filters.sort} onChange={(e) => ubah('sort', e.target.value)} aria-label="Urutan">
            <option value="deadline">Deadline terdekat</option>
            <option value="terbaru">Terbaru ditambahkan</option>
          </select>
        </div>
        <div className="segmented" role="group" aria-label="Status lomba">
          {STATUS.map((s) => (
            <button
              key={s.label}
              type="button"
              className={filters.status === s.nilai ? 'is-active' : ''}
              aria-pressed={filters.status === s.nilai}
              onClick={() => ubah('status', s.nilai)}
            >
              {s.label}
            </button>
          ))}
        </div>
      </section>

      {error && <p className="notice notice--error" role="alert">{error}</p>}

      {!error && !loading && items.length === 0 && (
        <div className="empty">
          <p>Belum ada lomba yang cocok dengan filter ini.</p>
          <p>Ubah filter, atau <Link to="/lomba/baru">tambah lomba baru</Link>.</p>
        </div>
      )}

      <section className="list">
        {items.map((l) => (
          <LombaRow key={l.id} lomba={l} onToggle={toggleBookmark} />
        ))}
      </section>
    </>
  );
}
