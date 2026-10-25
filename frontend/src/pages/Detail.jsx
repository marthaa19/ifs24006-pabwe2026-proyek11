import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../AuthContext.jsx';
import BookmarkPanel from '../components/BookmarkPanel.jsx';
import { Galat, Memuat } from '../components/Status.jsx';
import { useAsync } from '../hooks/useAsync.js';
import { useBookmark } from '../hooks/useBookmark.js';
import { useGuard } from '../hooks/useGuard.js';
import { formatTanggal, infoDeadline } from '../utils.js';

export default function Detail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: lomba, setData: setLomba, loading, error, setError } = useAsync(() => api.getLombaById(id), [id]);
  const bookmark = useBookmark(setError);
  const jaga = useGuard(setError);

  async function ubahSimpanan(aksi, tersimpan) {
    if (await aksi()) {
      setLomba({ ...lomba, tersimpan });
      setError('');
    }
  }

  async function hapus() {
    if (!window.confirm(`Hapus lomba "${lomba.judul}"? Tindakan ini tidak bisa dibatalkan.`)) return;
    if (await jaga(() => api.hapusLomba(lomba.id))) navigate('/');
  }

  if (loading) return <Memuat judul="Memuat detail lomba" teks="Memuat detail lomba…" />;
  if (error && !lomba) {
    return (
      <>
        <h1 className="visually-hidden">Detail lomba tidak tersedia</h1>
        <Galat pesan={error} />
        <p><Link to="/">Kembali ke beranda</Link></p>
      </>
    );
  }

  const d = infoDeadline(lomba.deadline);
  const fakta = [
    ['Kategori', lomba.kategori_nama],
    ['Tingkat', lomba.tingkat],
    ['Pelaksanaan', lomba.mode],
    ['Biaya', lomba.biaya],
    ['Hadiah', lomba.hadiah],
    ['Deadline', formatTanggal(lomba.deadline)],
  ];
  const bisaKelola = user && (user.role === 'admin' || lomba.created_by === user.id);

  return (
    <article className="detail">
      <p><Link to="/" className="backlink">Kembali ke daftar lomba</Link></p>

      <header className={`detail__head detail__head--${d.tone}`}>
        <div className="detail__count">
          <strong>{d.angka}</strong>
          <span>{d.label}</span>
        </div>
        <div>
          <h1>{lomba.judul}</h1>
          <p className="row__by">{lomba.penyelenggara}</p>
        </div>
      </header>

      <Galat pesan={error} />

      {lomba.deskripsi && <p className="detail__desc">{lomba.deskripsi}</p>}

      <dl className="facts">
        {fakta.map(([nama, nilai]) => (
          <div key={nama}><dt>{nama}</dt><dd>{nilai || '-'}</dd></div>
        ))}
      </dl>

      {lomba.link_pendaftaran && (
        <p>
          <a className="btn" href={lomba.link_pendaftaran} target="_blank" rel="noopener noreferrer">
            Buka halaman pendaftaran
          </a>
        </p>
      )}

      <BookmarkPanel
        tersimpan={Boolean(lomba.tersimpan)}
        onSimpan={(catatan) => ubahSimpanan(() => bookmark.simpan(lomba.id, catatan), 1)}
        onLepas={() => ubahSimpanan(() => bookmark.lepas(lomba.id), 0)}
      />

      {bisaKelola && (
        <section className="admin">
          <Link className="btn btn--ghost" to={`/lomba/${lomba.id}/edit`}>Edit lomba</Link>
          <button type="button" className="btn btn--danger" onClick={hapus}>Hapus lomba</button>
        </section>
      )}
    </article>
  );
}
