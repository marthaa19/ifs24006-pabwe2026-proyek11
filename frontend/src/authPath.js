// Alamat berbasis path (/auth/login, /auth/register) dipetakan ke rute HashRouter.
const PETA = { '/auth/login': '#/masuk', '/auth/register': '#/daftar' };

// Mengembalikan hash tujuan jika path cocok dan hash belum menunjuk rute; selain itu null.
export function hashUntukPath(pathname, hash) {
  const path = String(pathname || '').replace(/\/+$/, '');
  if (!PETA[path]) return null;
  if (String(hash || '').startsWith('#/')) return null;
  return PETA[path];
}
