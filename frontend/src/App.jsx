import { NavLink, Link, Route, Routes } from 'react-router-dom';
import Beranda from './pages/Beranda.jsx';
import Detail from './pages/Detail.jsx';
import FormLomba from './pages/FormLomba.jsx';
import Tersimpan from './pages/Tersimpan.jsx';

function Logo() {
  return (
    <svg width="28" height="28" viewBox="0 0 32 32" aria-hidden="true">
      <circle cx="16" cy="16" r="14" fill="none" stroke="currentColor" strokeWidth="2" />
      <circle cx="16" cy="16" r="8" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M16 16 L27 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <circle cx="24" cy="21" r="2.6" fill="var(--urgent)" />
    </svg>
  );
}

export default function App() {
  return (
    <>
      <header className="topbar">
        <div className="topbar__inner">
          <Link to="/" className="brand">
            <Logo />
            <span>LombaRadar</span>
          </Link>
          <nav className="nav" aria-label="Menu utama">
            <NavLink to="/" end>Beranda</NavLink>
            <NavLink to="/tersimpan">Tersimpan</NavLink>
            <NavLink to="/lomba/baru" className="nav__cta">Tambah lomba</NavLink>
          </nav>
        </div>
      </header>
      <main className="container">
        <Routes>
          <Route path="/" element={<Beranda />} />
          <Route path="/lomba/baru" element={<FormLomba />} />
          <Route path="/lomba/:id" element={<Detail />} />
          <Route path="/lomba/:id/edit" element={<FormLomba />} />
          <Route path="/tersimpan" element={<Tersimpan />} />
          <Route path="*" element={<p className="notice">Halaman tidak ditemukan. <Link to="/">Kembali ke beranda</Link></p>} />
        </Routes>
      </main>
      <footer className="footer">LombaRadar · Proyek 1 PABWE</footer>
    </>
  );
}
