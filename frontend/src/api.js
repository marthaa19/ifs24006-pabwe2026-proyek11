const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const getToken = () => { try { return localStorage.getItem('lr_token'); } catch { return null; } };
export const setToken = (t) => { try { t ? localStorage.setItem('lr_token', t) : localStorage.removeItem('lr_token'); } catch { /* abaikan */ } };

async function request(path, options = {}) {
  let res;
  try {
    res = await fetch(BASE + path, {
      headers: { 'Content-Type': 'application/json', ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}) },
      ...options,
    });
  } catch {
    throw new Error('Tidak bisa terhubung ke server. Pastikan back-end sedang berjalan.');
  }
  let data = null;
  try {
    data = await res.json();
  } catch {
    /* respons kosong */
  }
  if (!res.ok) throw new Error((data && data.error) || `Permintaan gagal (${res.status})`);
  return data;
}

function bersihkan(params) {
  const out = {};
  Object.entries(params || {}).forEach(([k, v]) => {
    if (v !== '' && v !== null && v !== undefined) out[k] = v;
  });
  return out;
}

// Permintaan dengan method dan (opsional) body JSON.
const kirim = (method, path, body) =>
  request(path, body === undefined ? { method } : { method, body: JSON.stringify(body) });

export const api = {
  register: (body) => kirim('POST', '/auth/register', body),
  login: (body) => kirim('POST', '/auth/login', body),
  me: () => request('/auth/me'),
  getLomba: (params) => request('/lomba?' + new URLSearchParams(bersihkan(params))),
  getLombaById: (id) => request(`/lomba/${id}`),
  tambahLomba: (body) => kirim('POST', '/lomba', body),
  ubahLomba: (id, body) => kirim('PUT', `/lomba/${id}`, body),
  hapusLomba: (id) => kirim('DELETE', `/lomba/${id}`),
  getKategori: () => request('/kategori'),
  getBookmark: () => request('/bookmark'),
  simpanBookmark: (lomba_id, catatan) => kirim('POST', '/bookmark', { lomba_id, catatan }),
  hapusBookmark: (lomba_id) => kirim('DELETE', `/bookmark/${lomba_id}`),
};
