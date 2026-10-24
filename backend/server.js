const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('./db');
// Di Vercel database /tmp selalu kosong saat instance baru: isi data awal + akun admin otomatis (idempoten).
if (process.env.VERCEL) require('./seed');
const { optionalAuth } = require('./auth');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(optionalAuth);

app.get('/api', (req, res) => {
  res.json({ nama: 'LombaRadar API', status: 'ok' });
});

// Alamat halaman berbasis path (/auth/login, /auth/register) untuk pengecekan eksternal.
// Front-end memakai HashRouter, jadi halaman ini mengarahkan ke rute hash yang sesuai.
const halamanAuth = { '/auth/login': '/#/masuk', '/auth/register': '/#/daftar' };
app.get(Object.keys(halamanAuth), (req, res) => {
  const tujuan = halamanAuth[req.path];
  const judul = req.path === '/auth/login' ? 'Masuk' : 'Daftar';
  res.status(200).type('html').send(
    `<!doctype html><html lang="id"><head><meta charset="utf-8"><title>${judul} - LombaRadar</title>` +
    `<meta http-equiv="refresh" content="0;url=${tujuan}"><script>location.replace(${JSON.stringify(tujuan)});</script></head>` +
    `<body><p>Mengarahkan ke halaman ${judul}... <a href="${tujuan}">Klik di sini</a> jika tidak berpindah otomatis.</p></body></html>`
  );
});

app.use('/api/auth', require('./routes/auth'));
app.use('/api/kategori', require('./routes/kategori'));
app.use('/api/lomba', require('./routes/lomba'));
app.use('/api/bookmark', require('./routes/bookmark'));

// Produksi satu-link: jika front-end sudah di-build (frontend/dist), Express ikut menyajikannya.
// Front-end memakai HashRouter, jadi tidak perlu fallback rute.
const distDir = path.join(__dirname, '..', 'frontend', 'dist');
if (fs.existsSync(path.join(distDir, 'index.html'))) {
  app.use(express.static(distDir));
}

app.use((req, res) => res.status(404).json({ error: 'Endpoint tidak ditemukan' }));

if (require.main === module) {
  app.listen(PORT, () => console.log(`LombaRadar API berjalan di http://localhost:${PORT}`));
}

module.exports = app;
