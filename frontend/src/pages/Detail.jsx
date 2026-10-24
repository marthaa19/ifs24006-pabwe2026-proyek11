import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../AuthContext.jsx';
import { formatTanggal, infoDeadline } from '../utils.js';

export default function Detail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [lomba, setLomba] = useState(null);
  const [catatan, setCatatan] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api
      .getLombaById(id)
      .then((data) => {
        setLomba(data);
        setError('');
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  async function simpan() {
    try {
      await api.simpanBookmark(lomba.id, catatan);
      setLomba({ ...lomba, tersimpan: 1 });
      setError('');
    } catch (e) {
      setError(e.message);
    }
  }

  async function lepas() {
    try {
      await api.hapusBookmark(lomba.id);
      setLomba({ ...lomba, tersimpan: 0 });
      setError('');
    } catch (e) {
      setError(e.message);
    }
  }

  async function hapus() {
    if (!window.confirm(`Hapus lomba "${lomba.judul}"? Tindakan ini tidak bisa dibatalkan.`)) return;
    try {
      await api.hapusLomba(lomba.id);
      navigate('/');
    } catch (e) {
      setError(e.message);
    }
  }

  if (loading) {
    return (
      <>
        <h1 className="visually-hidden">Memuat detail lomba</h1>
        <p className="notice">Memuat detail lomba…</p>
      </>
    );
  }
  if (error && !lomba) {
    return (
      <>
        <h1 className="visually-hidden">Detail lomba tidak tersedia</h1>
        <p className="notice notice--error" role="alert">{error}</p>
        <p><Link to="/">Kembali ke beranda</Link></p>
      </>
    );
  }

  const d = infoDeadline(lomba.deadline);

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

      {error && <p className="notice notice--error" role="alert">{error}</p>}

      {lomba.deskripsi && <p className="detail__desc">{lomba.deskripsi}</p>}

      <dl className="facts">
        <div><dt>Kategori</dt><dd>{lomba.kategori_nama}</dd></div>
        <div><dt>Tingkat</dt><dd>{lomba.tingkat || '-'}</dd></div>
        <div><dt>Pelaksanaan</dt><dd>{lomba.mode || '-'}</dd></div>
        <div><dt>Biaya</dt><dd>{lomba.biaya || '-'}</dd></div>
        <div><dt>Hadiah</dt><dd>{lomba.hadiah || '-'}</dd></div>
        <div><dt>Deadline</dt><dd>{formatTanggal(lomba.deadline)}</dd></div>
      </dl>

      {lomba.link_pendaftaran && (
        <p>
          <a className="btn" href={lomba.link_pendaftaran} target="_blank" rel="noopener noreferrer">
            Buka halaman pendaftaran
          </a>
        </p>
      )}

      <section className="panel">
        {lomba.tersimpan ? (
          <>
            <p>Lomba ini ada di daftar simpananmu. Ubah catatan di halaman <Link to="/tersimpan">Tersimpan</Link>.</p>
            <button type="button" className="btn btn--ghost" onClick={lepas}>Hapus dari simpanan</button>
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
            <button type="button" className="btn" onClick={simpan}>Simpan lomba</button>
          </>
        )}
      </section>

      {user && (user.role === 'admin' || lomba.created_by === user.id) && (
        <section className="admin">
          <Link className="btn btn--ghost" to={`/lomba/${lomba.id}/edit`}>Edit lomba</Link>
          <button type="button" className="btn btn--danger" onClick={hapus}>Hapus lomba</button>
        </section>
      )}
    </article>
  );
}
