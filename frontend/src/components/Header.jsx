import { NavLink, Link } from 'react-router-dom';
import { useAuth } from '../AuthContext.jsx';

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
  const admin = user.role === 'admin';
  return (
    <div className="akun">
      <div className="akun__chip">
        <span className={`akun__badge ${admin ? 'akun__badge--admin' : ''}`}>{admin ? 'ADMIN' : 'MAHASISWA'}</span>
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

export default function Header() {
  return (
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
  );
}
