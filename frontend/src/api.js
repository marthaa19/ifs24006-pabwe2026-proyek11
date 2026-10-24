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

export const api = {
  register: (body) => request('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  login: (body) => request('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  me: () => request('/auth/me'),
  getLomba: (params) => request('/lomba?' + new URLSearchParams(bersihkan(params))),
  getLombaById: (id) => request(`/lomba/${id}`),
  tambahLomba: (body) => request('/lomba', { method: 'POST', body: JSON.stringify(body) }),
  ubahLomba: (id, body) => request(`/lomba/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  hapusLomba: (id) => request(`/lomba/${id}`, { method: 'DELETE' }),
  getKategori: () => request('/kategori'),
  getBookmark: () => request('/bookmark'),
  simpanBookmark: (lomba_id, catatan) =>
    request('/bookmark', { method: 'POST', body: JSON.stringify({ lomba_id, catatan }) }),
  hapusBookmark: (lomba_id) => request(`/bookmark/${lomba_id}`, { method: 'DELETE' }),
};
