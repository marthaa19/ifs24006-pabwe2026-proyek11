import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import FilterBar from '../components/FilterBar.jsx';
import LombaRow from '../components/LombaRow.jsx';
import PageHead from '../components/PageHead.jsx';
import { Galat } from '../components/Status.jsx';
import { useAsync } from '../hooks/useAsync.js';
import { useBookmark } from '../hooks/useBookmark.js';
import { useDebounced } from '../hooks/useDebounced.js';

export default function Beranda() {
  const [filters, setFilters] = useState({ kategori: '', tingkat: '', status: 'aktif', sort: 'deadline' });
  const [pencarian, setPencarian] = useState('');
  const q = useDebounced(pencarian, 300);
  const params = useMemo(() => ({ q, ...filters }), [q, filters]);

  const { data: kategori } = useAsync(() => api.getKategori(), [], []);
  const { data: items, setData: setItems, loading, error, setError } = useAsync(() => api.getLomba(params), [params], []);
  const bookmark = useBookmark(setError);

  const ubah = (kunci, nilai) => setFilters((f) => ({ ...f, [kunci]: nilai }));

  async function toggleBookmark(lomba) {
    const berhasil = lomba.tersimpan ? await bookmark.lepas(lomba.id) : await bookmark.simpan(lomba.id);
    if (berhasil) setItems((list) => list.map((x) => (x.id === lomba.id ? { ...x, tersimpan: x.tersimpan ? 0 : 1 } : x)));
  }

  return (
    <>
      <PageHead judul="Deadline terdekat">{loading ? 'Memuat lomba…' : `${items.length} lomba ditemukan`}</PageHead>
      <FilterBar pencarian={pencarian} onCari={setPencarian} filters={filters} onUbah={ubah} kategori={kategori} />
      <Galat pesan={error} />

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
