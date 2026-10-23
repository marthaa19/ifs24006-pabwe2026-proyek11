import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../api.js';

const KOSONG = {
  judul: '',
  penyelenggara: '',
  kategori_id: '',
  deskripsi: '',
  tingkat: 'nasional',
  mode: 'online',
  hadiah: '',
  biaya: 'gratis',
  deadline: '',
  link_pendaftaran: '',
};

export default function FormLomba() {
  const { id } = useParams();
  const edit = Boolean(id);
  const navigate = useNavigate();
  const [form, setForm] = useState(KOSONG);
  const [kategori, setKategori] = useState([]);
  const [error, setError] = useState('');
  const [kirim, setKirim] = useState(false);

  useEffect(() => {
    api.getKategori().then(setKategori).catch((e) => setError(e.message));
  }, []);

  useEffect(() => {
    if (!edit) {
      setForm(KOSONG);
      return;
    }
    api
      .getLombaById(id)
      .then((l) =>
        setForm({
          judul: l.judul || '',
          penyelenggara: l.penyelenggara || '',
          kategori_id: String(l.kategori_id),
          deskripsi: l.deskripsi || '',
          tingkat: l.tingkat || 'nasional',
          mode: l.mode || 'online',
          hadiah: l.hadiah || '',
          biaya: l.biaya || 'gratis',
          deadline: l.deadline || '',
          link_pendaftaran: l.link_pendaftaran || '',
        })
      )
      .catch((e) => setError(e.message));
  }, [edit, id]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    setError('');
    setKirim(true);
    try {
      const payload = { ...form, kategori_id: Number(form.kategori_id) };
      const hasil = edit ? await api.ubahLomba(id, payload) : await api.tambahLomba(payload);
      navigate(`/lomba/${hasil.id}`);
    } catch (err) {
      setError(err.message);
      setKirim(false);
    }
  }

  return (
    <>
      <p><Link to={edit ? `/lomba/${id}` : '/'} className="backlink">Kembali</Link></p>
      <section className="pagehead">
        <h1>{edit ? 'Edit lomba' : 'Tambah lomba'}</h1>
      </section>

      {error && <p className="notice notice--error" role="alert">{error}</p>}

      <form className="form" onSubmit={submit}>
        <div className="field">
          <label htmlFor="judul">Judul lomba</label>
          <input id="judul" className="input" required value={form.judul} onChange={set('judul')} />
        </div>
        <div className="field">
          <label htmlFor="penyelenggara">Penyelenggara</label>
          <input id="penyelenggara" className="input" required value={form.penyelenggara} onChange={set('penyelenggara')} />
        </div>

        <div className="field-row">
          <div className="field">
            <label htmlFor="kategori">Kategori</label>
            <select id="kategori" className="input" required value={form.kategori_id} onChange={set('kategori_id')}>
              <option value="">Pilih kategori</option>
              {kategori.map((k) => (
                <option key={k.id} value={k.id}>{k.nama}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="deadline">Deadline pendaftaran</label>
            <input id="deadline" type="date" className="input" required value={form.deadline} onChange={set('deadline')} />
          </div>
        </div>

        <div className="field-row field-row--3">
          <div className="field">
            <label htmlFor="tingkat">Tingkat</label>
            <select id="tingkat" className="input" value={form.tingkat} onChange={set('tingkat')}>
              <option value="kampus">Kampus</option>
              <option value="nasional">Nasional</option>
              <option value="internasional">Internasional</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="mode">Pelaksanaan</label>
            <select id="mode" className="input" value={form.mode} onChange={set('mode')}>
              <option value="online">Online</option>
              <option value="offline">Offline</option>
              <option value="hybrid">Hybrid</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="biaya">Biaya</label>
            <select id="biaya" className="input" value={form.biaya} onChange={set('biaya')}>
              <option value="gratis">Gratis</option>
              <option value="berbayar">Berbayar</option>
            </select>
          </div>
        </div>

        <div className="field">
          <label htmlFor="hadiah">Hadiah</label>
          <input id="hadiah" className="input" value={form.hadiah} onChange={set('hadiah')} placeholder="Misalnya: Rp5.000.000 dan sertifikat" />
        </div>
        <div className="field">
          <label htmlFor="link">Link pendaftaran</label>
          <input id="link" type="url" className="input" value={form.link_pendaftaran} onChange={set('link_pendaftaran')} placeholder="https://" />
        </div>
        <div className="field">
          <label htmlFor="deskripsi">Deskripsi</label>
          <textarea id="deskripsi" className="input" rows="4" value={form.deskripsi} onChange={set('deskripsi')} />
        </div>

        <div className="form__actions">
          <button type="submit" className="btn" disabled={kirim}>{kirim ? 'Menyimpan…' : 'Simpan lomba'}</button>
          <Link className="btn btn--ghost" to={edit ? `/lomba/${id}` : '/'}>Batal</Link>
        </div>
      </form>
    </>
  );
}
