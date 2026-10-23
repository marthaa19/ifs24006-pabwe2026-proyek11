import { Link } from 'react-router-dom';
import { formatTanggal, infoDeadline } from '../utils.js';

function BookmarkIcon({ filled }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M6 3h12v18l-6-4.5L6 21z"
        fill={filled ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function LombaRow({ lomba, onToggle, children }) {
  const d = infoDeadline(lomba.deadline);
  const tersimpan = Boolean(lomba.tersimpan);
  const tags = [lomba.kategori_nama, lomba.tingkat, lomba.mode, lomba.biaya].filter(Boolean);

  return (
    <article className={`row row--${d.tone}`}>
      <div className="row__count" aria-label={`${d.angka} ${d.label}`}>
        <strong>{d.angka}</strong>
        <span>{d.label}</span>
      </div>

      <div className="row__body">
        <h3 className="row__title">
          <Link to={`/lomba/${lomba.id}`}>{lomba.judul}</Link>
        </h3>
        <p className="row__by">{lomba.penyelenggara}</p>
        <ul className="tags">
          {tags.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
        <p className="row__meta">
          <span>Deadline {formatTanggal(lomba.deadline)}</span>
          {lomba.hadiah && <span>Hadiah {lomba.hadiah}</span>}
        </p>
        {children}
      </div>

      {onToggle && (
        <button
          type="button"
          className={`save ${tersimpan ? 'save--on' : ''}`}
          aria-pressed={tersimpan}
          onClick={() => onToggle(lomba)}
        >
          <BookmarkIcon filled={tersimpan} />
          {tersimpan ? 'Tersimpan' : 'Simpan'}
        </button>
      )}
    </article>
  );
}
