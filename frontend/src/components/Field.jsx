// <select> dengan daftar opsi { value, label }; `kosong` menambah opsi pertama bernilai ''.
export function Select({ options, kosong, ...props }) {
  return (
    <select className="input" {...props}>
      {kosong && <option value="">{kosong}</option>}
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}

// Satu kolom formulir: label + kontrol (`as`: 'input' | 'textarea' | 'select').
export default function Field({ id, label, as = 'input', ...props }) {
  const Kontrol = as === 'select' ? Select : as;
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <Kontrol id={id} className="input" {...props} />
    </div>
  );
}
