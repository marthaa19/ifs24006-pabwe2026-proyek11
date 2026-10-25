import { Select } from './Field.jsx';
import { STATUS, TINGKAT, URUTAN, opsiKategori } from '../constants.js';

// Kolom pencarian + filter di Beranda. `onUbah(kunci, nilai)` memperbarui satu filter.
export default function FilterBar({ pencarian, onCari, filters, onUbah, kategori }) {
  const pilih = (kunci) => ({ value: filters[kunci], onChange: (e) => onUbah(kunci, e.target.value) });

  return (
    <section className="toolbar" aria-label="Pencarian dan filter">
      <input
        type="search"
        className="input toolbar__search"
        placeholder="Cari judul, penyelenggara, atau deskripsi"
        value={pencarian}
        onChange={(e) => onCari(e.target.value)}
        aria-label="Cari lomba"
      />
      <div className="toolbar__row">
        <Select aria-label="Kategori" kosong="Semua kategori" options={opsiKategori(kategori)} {...pilih('kategori')} />
        <Select aria-label="Tingkat" kosong="Semua tingkat" options={TINGKAT} {...pilih('tingkat')} />
        <Select aria-label="Urutan" options={URUTAN} {...pilih('sort')} />
      </div>
      <div className="segmented" role="group" aria-label="Status lomba">
        {STATUS.map((s) => (
          <button
            key={s.label}
            type="button"
            className={filters.status === s.value ? 'is-active' : ''}
            aria-pressed={filters.status === s.value}
            onClick={() => onUbah('status', s.value)}
          >
            {s.label}
          </button>
        ))}
      </div>
    </section>
  );
}
