import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../AuthContext.jsx';
import { Memuat } from './Status.jsx';

// Pembungkus rute yang mewajibkan login; tamu diarahkan ke /masuk dan kembali setelah masuk.
export default function Wajib({ children }) {
  const { user, siap } = useAuth();
  const lokasi = useLocation();
  if (!siap) return <Memuat />;
  if (!user) return <Navigate to="/masuk" replace state={{ dari: lokasi.pathname }} />;
  return children;
}
