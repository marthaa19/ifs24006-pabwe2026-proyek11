// Helper bersama untuk test backend: database sementara + server pada port acak.
const fs = require('fs');
const os = require('os');
const path = require('path');

function siapkanDb() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'lombaradar-test-'));
  process.env.DB_PATH = path.join(dir, 'test.db');
  return dir;
}

function tanggal(offsetHari) {
  const d = new Date();
  d.setDate(d.getDate() + offsetHari);
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

async function mulaiServer(app) {
  const server = await new Promise((resolve) => {
    const s = app.listen(0, () => resolve(s));
  });
  const base = `http://127.0.0.1:${server.address().port}`;

  async function req(metode, url, { body, token } = {}) {
    const res = await fetch(base + url, {
      method: metode,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    let data = null;
    try { data = await res.json(); } catch { /* respons kosong */ }
    return { status: res.status, body: data };
  }

  return { server, req, tutup: () => new Promise((r) => server.close(r)) };
}

module.exports = { siapkanDb, tanggal, mulaiServer };
