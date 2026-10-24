import { NavLink, Link, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext.jsx';
import Beranda from './pages/Beranda.jsx';
import Detail from './pages/Detail.jsx';
import FormLomba from './pages/FormLomba.jsx';
import Tersimpan from './pages/Tersimpan.jsx';
import { Masuk, Daftar } from './pages/Auth.jsx';

function Logo() {
  return (
    <svg width="24" height="24" viewBox="0 0 32 32" aria-hidden="true">
      <circle cx="16" cy="16" r="14" fill="none" stroke="currentColor" strokeWidth="2" />
      <circle cx="16" cy="16" r="8" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M16 16 L27 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <circle cx="24" cy="21" r="2.6" fill="currentColor" />
    </svg>
  );
}

function Wajib({ children }) {
  const { user, siap } = useAuth();
  const lokasi = useLocation();
  if (!siap) return <p className="notice">Memuat…</p>;
  if (!user) return <Navigate to="/masuk" replace state={{ dari: lokasi.pathname }} />;
  return children;
}

function Akun() {
  const { user, keluar } = useAuth();
  if (!user) {
    return (
      <div className="akun">
        <Link to="/masuk" className="btn btn--ghost btn--small">Masuk</Link>
        <Link to="/daftar" className="btn btn--small">Daftar</Link>
      </div>
    );
  }
  return (
    <div className="akun">
      <div className="akun__chip">
        <span className={`akun__badge ${user.role === 'admin' ? 'akun__badge--admin' : ''}`}>{user.role === 'admin' ? 'ADMIN' : 'MAHASISWA'}</span>
        <span className="akun__nama">{user.nama}</span>
        <button type="button" className="akun__keluar" onClick={keluar} aria-label="Keluar dari akun">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <path d="M16 17l5-5-5-5" />
            <path d="M21 12H9" />
          </svg>
        </button>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <>
      <header className="topbar">
        <div className="topbar__inner">
          <Link to="/" className="brand">
            <span className="brand__mark"><Logo /></span>
            <span className="brand__text">
              <strong>Lomba<em>Radar</em></strong>
              <small>Pantau deadline lomba mahasiswa</small>
            </span>
          </Link>
          <nav className="nav" aria-label="Menu utama">
            <NavLink to="/" end>Beranda</NavLink>
            <NavLink to="/tersimpan">Tersimpan</NavLink>
            <NavLink to="/lomba/baru" className="nav__pill"><i aria-hidden="true" />Tambah lomba</NavLink>
          </nav>
          <Akun />
        </div>
      </header>
      <main className="container">
        <Routes>
          <Route path="/" element={<Beranda />} />
          <Route path="/masuk" element={<Masuk />} />
          <Route path="/daftar" element={<Daftar />} />
          <Route path="/lomba/baru" element={<Wajib><FormLomba /></Wajib>} />
          <Route path="/lomba/:id" element={<Detail />} />
          <Route path="/lomba/:id/edit" element={<Wajib><FormLomba /></Wajib>} />
          <Route path="/tersimpan" element={<Wajib><Tersimpan /></Wajib>} />
          <Route path="*" element={<p className="notice">Halaman tidak ditemukan. <Link to="/">Kembali ke beranda</Link></p>} />
        </Routes>
      </main>
      <footer className="footer">LombaRadar · Proyek 1 PABWE</footer>
    </>
  );
}
