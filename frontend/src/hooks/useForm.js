import { useState } from 'react';

// State formulir: `bind('nama')` menghasilkan { value, onChange } untuk satu kolom.
export function useForm(awal) {
  const [values, setValues] = useState(awal);
  const bind = (k) => ({
    value: values[k],
    onChange: (e) => setValues((v) => ({ ...v, [k]: e.target.value })),
  });
  return { values, setValues, bind };
}
