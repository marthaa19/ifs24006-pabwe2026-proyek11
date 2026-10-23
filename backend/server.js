const express = require('express');
const cors = require('cors');
require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get('/api', (req, res) => {
  res.json({ nama: 'LombaRadar API', status: 'ok' });
});

app.use('/api/kategori', require('./routes/kategori'));
app.use('/api/lomba', require('./routes/lomba'));
app.use('/api/bookmark', require('./routes/bookmark'));

app.use((req, res) => res.status(404).json({ error: 'Endpoint tidak ditemukan' }));

if (require.main === module) {
  app.listen(PORT, () => console.log(`LombaRadar API berjalan di http://localhost:${PORT}`));
}

module.exports = app;
