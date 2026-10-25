import { Link } from 'react-router-dom';
import { api } from '../api.js';
import CatatanEditor from '../components/CatatanEditor.jsx';
import LombaRow from '../components/LombaRow.jsx';
import PageHead from '../components/PageHead.jsx';
import { Galat } from '../components/Status.jsx';
import { useAsync } from '../hooks/useAsync.js';
import { useBookmark } from '../hooks/useBookmark.js';

export default function Tersimpan() {
  const { data: items, setData: setItems, loading, error, setError } = useAsync(() => api.getBookmark(), [], []);
  const bookmark = useBookmark(setError);

  async function hapus(lomba) {
    if (await bookmark.lepas(lomba.id)) setItems((list) => list.filter((x) => x.id !== lomba.id));
  }

  return (
    <>
      <PageHead judul="Lomba tersimpan">{loading ? 'Memuat…' : `${items.length} lomba, diurutkan dari deadline terdekat`}</PageHead>
      <Galat pesan={error} />

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
