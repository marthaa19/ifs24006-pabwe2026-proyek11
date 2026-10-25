import { useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../api.js';
import Field from '../components/Field.jsx';
import PageHead from '../components/PageHead.jsx';
import { Galat } from '../components/Status.jsx';
import { BIAYA, MODE, TINGKAT, opsiKategori } from '../constants.js';
import { useAsync } from '../hooks/useAsync.js';
import { useForm } from '../hooks/useForm.js';
import { useSubmit } from '../hooks/useSubmit.js';

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

// Data lomba dari API -> nilai awal formulir (kolom kosong memakai nilai bawaan).
const dariLomba = (l) => ({
  ...Object.fromEntries(Object.keys(KOSONG).map((k) => [k, l[k] || KOSONG[k]])),
  kategori_id: String(l.kategori_id),
});

export default function FormLomba() {
  const { id } = useParams();
  const edit = Boolean(id);
  const navigate = useNavigate();
  const { values: form, setValues, bind } = useForm(KOSONG);
  const { data: kategori, error: galatKategori } = useAsync(() => api.getKategori(), [], []);
  const { data: lomba, error: galatLomba } = useAsync(() => (edit ? api.getLombaById(id) : null), [edit, id]);

  useEffect(() => {
    setValues(lomba ? dariLomba(lomba) : KOSONG);
  }, [lomba, setValues]);

  const { onSubmit, loading, error: galatKirim } = useSubmit(async () => {
    const payload = { ...form, kategori_id: Number(form.kategori_id) };
    const hasil = edit ? await api.ubahLomba(id, payload) : await api.tambahLomba(payload);
    navigate(`/lomba/${hasil.id}`);
  });

  const kembali = edit ? `/lomba/${id}` : '/';

  return (
    <>
      <p><Link to={kembali} className="backlink">Kembali</Link></p>
      <PageHead judul={edit ? 'Edit lomba' : 'Tambah lomba'} />
      <Galat pesan={galatKirim || galatLomba || galatKategori} />

      <form className="form" onSubmit={onSubmit}>
        <Field id="judul" label="Judul lomba" required {...bind('judul')} />
        <Field id="penyelenggara" label="Penyelenggara" required {...bind('penyelenggara')} />

        <div className="field-row">
          <Field id="kategori" label="Kategori" as="select" required kosong="Pilih kategori" options={opsiKategori(kategori)} {...bind('kategori_id')} />
          <Field id="deadline" label="Deadline pendaftaran" type="date" required {...bind('deadline')} />
        </div>

        <div className="field-row field-row--3">
          <Field id="tingkat" label="Tingkat" as="select" options={TINGKAT} {...bind('tingkat')} />
          <Field id="mode" label="Pelaksanaan" as="select" options={MODE} {...bind('mode')} />
          <Field id="biaya" label="Biaya" as="select" options={BIAYA} {...bind('biaya')} />
        </div>

        <Field id="hadiah" label="Hadiah" placeholder="Misalnya: Rp5.000.000 dan sertifikat" {...bind('hadiah')} />
        <Field id="link" label="Link pendaftaran" type="url" placeholder="https://" {...bind('link_pendaftaran')} />
        <Field id="deskripsi" label="Deskripsi" as="textarea" rows="4" {...bind('deskripsi')} />

        <div className="form__actions">
          <button type="submit" className="btn" disabled={loading}>{loading ? 'Menyimpan…' : 'Simpan lomba'}</button>
          <Link className="btn btn--ghost" to={kembali}>Batal</Link>
        </div>
      </form>
    </>
  );
}
