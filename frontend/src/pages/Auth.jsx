import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext.jsx';

function Bentuk({ daftar }) {
  const { masuk, daftar: kirimDaftar } = useAuth();
  const navigate = useNavigate();
  const dari = useLocation().state?.dari || '/';
  const [f, setF] = useState({ nama: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const ubah = (k) => (e) => setF({ ...f, [k]: e.target.value });

  async function kirim(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (daftar) await kirimDaftar(f);
      else await masuk(f.email, f.password);
      navigate(dari, { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="pagehead">
        <h1>{daftar ? 'Buat akun' : 'Masuk'}</h1>
        <p>{daftar ? 'Simpan lomba incaranmu dan tambahkan lomba baru.' : 'Masuk untuk melihat lomba tersimpan dan menambah lomba.'}</p>
      </div>
      <form className="form auth" onSubmit={kirim} noValidate>
        {error && <p className="notice notice--error" role="alert">{error}</p>}
        {daftar && (
          <div className="field">
            <label htmlFor="nama">Nama</label>
            <input id="nama" className="input" value={f.nama} onChange={ubah('nama')} autoComplete="name" required />
          </div>
        )}
        <div className="field">
          <label htmlFor="username">Email</label>
          <input id="username" name="username" type="email" className="input" value={f.email} onChange={ubah('email')} autoComplete="email" required />
        </div>
        <div className="field">
          <label htmlFor="password">Kata sandi</label>
          <input id="password" name="password" type="password" className="input" value={f.password} onChange={ubah('password')} autoComplete={daftar ? 'new-password' : 'current-password'} required />
        </div>
        <div className="form__actions">
          <button id="btn-submit" type="submit" className="btn" disabled={loading}>{loading ? 'Memproses…' : daftar ? 'Buat akun' : 'Masuk'}</button>
        </div>
        <p className="auth__alt">
          {daftar ? 'Sudah punya akun? ' : 'Belum punya akun? '}
          <Link to={daftar ? '/masuk' : '/daftar'} state={{ dari }}>{daftar ? 'Masuk' : 'Daftar'}</Link>
        </p>
      </form>
    </>
  );
}

export const Masuk = () => <Bentuk daftar={false} />;
export const Daftar = () => <Bentuk daftar />;
