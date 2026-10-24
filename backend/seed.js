// Data contoh. GANTI dengan data lomba nyata (judul, deadline, link) sebelum dikumpulkan.
const db = require('./db');

const kategori = ['Programming', 'UI/UX', 'Data & AI', 'Business Case', 'Karya Tulis'];

const lomba = [
  ['GEMASTIK (Contoh)', 'Kemdiktisaintek', 'Programming', 'Pemrograman, pengembangan aplikasi, dan keamanan siber tingkat mahasiswa.', 'nasional', 'offline', 'Piala dan sertifikat', 'gratis', '2026-11-20', 'https://example.com/gemastik'],
  ['Hackathon Kampus Merdeka (Contoh)', 'Komunitas Developer', 'Programming', 'Hackathon 48 jam membangun solusi digital.', 'nasional', 'online', 'Rp10.000.000', 'gratis', '2026-10-28', 'https://example.com/hackathon'],
  ['Competitive Programming Cup (Contoh)', 'Informatika Fair', 'Programming', 'Kompetisi algoritma individu.', 'kampus', 'offline', 'Rp2.000.000', 'berbayar', '2026-11-05', 'https://example.com/cp'],
  ['Web Dev Challenge (Contoh)', 'Tech Community', 'Programming', 'Bangun aplikasi web fullstack dalam 2 minggu.', 'nasional', 'online', 'Rp5.000.000', 'gratis', '2026-11-12', 'https://example.com/webdev'],
  ['UI/UX Design Sprint (Contoh)', 'Design Society', 'UI/UX', 'Rancang prototipe aplikasi untuk isu sosial.', 'nasional', 'online', 'Rp7.500.000', 'berbayar', '2026-10-30', 'https://example.com/uiux'],
  ['Mobile App Redesign (Contoh)', 'Creative Hub', 'UI/UX', 'Redesign antarmuka aplikasi layanan publik.', 'kampus', 'online', 'Rp1.500.000', 'gratis', '2026-11-08', 'https://example.com/redesign'],
  ['Product Design Contest (Contoh)', 'Startup Week', 'UI/UX', 'Presentasikan desain produk digital inovatif.', 'internasional', 'online', 'USD 500', 'gratis', '2026-12-01', 'https://example.com/product'],
  ['Data Science Competition (Contoh)', 'Data Community', 'Data & AI', 'Prediksi dan analisis dataset nyata.', 'nasional', 'online', 'Rp15.000.000', 'gratis', '2026-11-15', 'https://example.com/datasci'],
  ['AI for Good Hackathon (Contoh)', 'AI Indonesia', 'Data & AI', 'Solusi AI untuk masalah lingkungan dan pendidikan.', 'nasional', 'online', 'Rp8.000.000', 'gratis', '2026-11-25', 'https://example.com/aigood'],
  ['Machine Learning Challenge (Contoh)', 'ML Club', 'Data & AI', 'Bangun model klasifikasi terbaik.', 'kampus', 'online', 'Rp3.000.000', 'gratis', '2026-10-26', 'https://example.com/ml'],
  ['Business Case Competition (Contoh)', 'Entrepreneur Society', 'Business Case', 'Selesaikan studi kasus bisnis perusahaan nyata.', 'nasional', 'offline', 'Rp12.000.000', 'berbayar', '2026-11-18', 'https://example.com/bcc'],
  ['Startup Pitch Day (Contoh)', 'Inkubator Bisnis', 'Business Case', 'Pitching ide startup di depan investor.', 'nasional', 'offline', 'Pendanaan awal', 'gratis', '2026-12-05', 'https://example.com/pitch'],
  ['Lomba Esai Nasional (Contoh)', 'Forum Mahasiswa', 'Karya Tulis', 'Esai bertema transformasi digital.', 'nasional', 'online', 'Rp4.000.000', 'gratis', '2026-11-02', 'https://example.com/esai'],
  ['Karya Tulis Ilmiah (Contoh)', 'Pusat Penelitian', 'Karya Tulis', 'Kompetisi KTI bidang teknologi.', 'nasional', 'offline', 'Rp6.000.000', 'berbayar', '2026-11-30', 'https://example.com/kti'],
  ['Lomba Lama (Contoh, sudah lewat)', 'Panitia Lama', 'Programming', 'Contoh lomba yang deadline-nya sudah lewat untuk menguji filter status.', 'kampus', 'online', '-', 'gratis', '2026-09-01', 'https://example.com/lama'],
];

const insertKat = db.prepare('INSERT OR IGNORE INTO kategori (nama) VALUES (?)');
const getKat = db.prepare('SELECT id FROM kategori WHERE nama = ?');
const insertLomba = db.prepare(`
  INSERT INTO lomba (judul, penyelenggara, kategori_id, deskripsi, tingkat, mode, hadiah, biaya, deadline, link_pendaftaran)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

function run() {
  db.exec('BEGIN');
  try {
    kategori.forEach((k) => insertKat.run(k));
    const sudahAda = db.prepare('SELECT COUNT(*) AS n FROM lomba').get().n;
    if (sudahAda > 0) {
      db.exec('COMMIT');
      console.log(`Tabel lomba sudah berisi ${sudahAda} data, seed dilewati.`);
      return;
    }
    lomba.forEach(([judul, peny, kat, desk, tingkat, mode, hadiah, biaya, deadline, link]) => {
      const kid = getKat.get(kat).id;
      insertLomba.run(judul, peny, kid, desk, tingkat, mode, hadiah, biaya, deadline, link);
    });
    db.exec('COMMIT');
    console.log(`Seed selesai: ${kategori.length} kategori, ${lomba.length} lomba.`);
  } catch (e) {
    db.exec('ROLLBACK');
    throw e;
  }
}

// Akun admin: dibuat (atau dipromosikan) setiap seed dijalankan.
// Atur lewat ADMIN_EMAIL dan ADMIN_PASSWORD; nilai bawaan hanya untuk pengembangan lokal.
function buatAdmin() {
  const { hashPassword } = require('./auth');
  const email = (process.env.ADMIN_EMAIL || 'admin@lombaradar.id').trim().toLowerCase();
  const ada = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (ada) {
    db.prepare("UPDATE users SET role = 'admin' WHERE id = ?").run(ada.id);
    console.log(`Akun ${email} dijadikan admin.`);
    return;
  }
  db.prepare("INSERT INTO users (nama, email, password_hash, role) VALUES (?, ?, ?, 'admin')")
    .run('Admin', email, hashPassword(process.env.ADMIN_PASSWORD || 'admin123'));
  console.log(`Akun admin dibuat: ${email}`);
}

buatAdmin();
run();
