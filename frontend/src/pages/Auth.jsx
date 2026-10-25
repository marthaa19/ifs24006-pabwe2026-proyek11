import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext.jsx';
import Field from '../components/Field.jsx';
import PageHead from '../components/PageHead.jsx';
import { Galat } from '../components/Status.jsx';
import { useForm } from '../hooks/useForm.js';
import { useSubmit } from '../hooks/useSubmit.js';

function Bentuk({ daftar }) {
  const { masuk, daftar: kirimDaftar } = useAuth();
  const navigate = useNavigate();
  const dari = useLocation().state?.dari || '/';
  const { values: f, bind } = useForm({ nama: '', email: '', password: '' });
  const { onSubmit, loading, error } = useSubmit(async () => {
    if (daftar) await kirimDaftar(f);
    else await masuk(f.email, f.password);
    navigate(dari, { replace: true });
  });
  const judul = daftar ? 'Buat akun' : 'Masuk';

  return (
    <>
      <PageHead judul={judul}>
        {daftar ? 'Simpan lomba incaranmu dan tambahkan lomba baru.' : 'Masuk untuk melihat lomba tersimpan dan menambah lomba.'}
      </PageHead>
      <form className="form auth" onSubmit={onSubmit} noValidate>
        <Galat pesan={error} />
        {daftar && <Field id="nama" label="Nama" autoComplete="name" required {...bind('nama')} />}
        <Field id="username" name="username" label="Email" type="email" autoComplete="email" required {...bind('email')} />
        <Field
          id="password"
          name="password"
          label="Kata sandi"
          type="password"
          autoComplete={daftar ? 'new-password' : 'current-password'}
          required
          {...bind('password')}
        />
        <div className="form__actions">
          <button id="btn-submit" type="submit" className="btn" disabled={loading}>{loading ? 'Memproses…' : judul}</button>
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
