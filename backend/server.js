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

app.use('/api/auth', require('./routes/auth'));
app.use('/api/kategori', require('./routes/kategori'));
app.use('/api/lomba', require('./routes/lomba'));
app.use('/api/bookmark', require('./routes/bookmark'));

// Produksi satu-link: jika front-end sudah di-build (frontend/dist), Express ikut menyajikannya.
// Front-end memakai BrowserRouter, jadi alamat seperti /auth/login dan /auth/register harus
// menjawab index.html (React Router yang menampilkan halamannya, alamat di browser tidak berubah).
const distDir = process.env.FRONTEND_DIST || path.join(__dirname, '..', 'frontend', 'dist');
if (fs.existsSync(path.join(distDir, 'index.html'))) {
  app.use(express.static(distDir));
  app.get(/^\/(?!api(?:\/|$)).*/, (req, res) => res.sendFile(path.join(distDir, 'index.html')));
}

app.use((req, res) => res.status(404).json({ error: 'Endpoint tidak ditemukan' }));

if (require.main === module) {
  app.listen(PORT, () => console.log(`LombaRadar API berjalan di http://localhost:${PORT}`));
}

module.exports = app;
