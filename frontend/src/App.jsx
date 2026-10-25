import { lazy, Suspense } from 'react';
import { Link, Route, Routes } from 'react-router-dom';
import Header from './components/Header.jsx';
import Wajib from './components/Wajib.jsx';
import { Memuat } from './components/Status.jsx';
import Beranda from './pages/Beranda.jsx';
import { Masuk, Daftar } from './pages/Auth.jsx';

// Beranda dan halaman Masuk/Daftar langsung dimuat; halaman lain dimuat saat dibutuhkan (code splitting) agar JavaScript awal lebih kecil.
const Detail = lazy(() => import('./pages/Detail.jsx'));
const FormLomba = lazy(() => import('./pages/FormLomba.jsx'));
const Tersimpan = lazy(() => import('./pages/Tersimpan.jsx'));

const TidakDitemukan = () => (
  <>
    <h1>Halaman tidak ditemukan</h1>
    <p className="notice"><Link to="/">Kembali ke beranda</Link></p>
  </>
);

export default function App() {
  return (
    <>
      <Header />
      <main className="container">
        <Suspense fallback={<Memuat role="status" />}>
          <Routes>
            <Route path="/" element={<Beranda />} />
            <Route path="/masuk" element={<Masuk />} />
            <Route path="/daftar" element={<Daftar />} />
            <Route path="/lomba/baru" element={<Wajib><FormLomba /></Wajib>} />
            <Route path="/lomba/:id" element={<Detail />} />
            <Route path="/lomba/:id/edit" element={<Wajib><FormLomba /></Wajib>} />
            <Route path="/tersimpan" element={<Wajib><Tersimpan /></Wajib>} />
            <Route path="*" element={<TidakDitemukan />} />
          </Routes>
        </Suspense>
      </main>
      <footer className="footer">LombaRadar · Proyek 1 PABWE</footer>
    </>
  );
}
