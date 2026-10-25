# LombaRadar API (Back-end)

REST API untuk **LombaRadar**, aplikasi web pemantau deadline lomba mahasiswa. Repository ini hanya berisi back-end; front-end ada di repository terpisah.

Proyek 1 mata kuliah **Pengembangan Aplikasi Berbasis Web (PABWE) 2026**, dikerjakan secara individu.

| | |
|---|---|
| Nama | Martha Saulina Nababan |
| NIM | 11S24006 |
| Program Studi | Informatika, Institut Teknologi Del |

## Tautan

| Artefak | URL |
|---|---|
| API online (back-end) | `ISI_URL_BACKEND/api` |
| Aplikasi online (front-end) | `ISI_URL_FRONTEND` |
| Repository front-end | `ISI_URL_REPOSITORY_FRONTEND` |
| Repository back-end (ini) | `ISI_URL_REPOSITORY_BACKEND` |
| Video YouTube (menjalankan di komputer lokal) | `ISI_URL_YOUTUBE` |

## Teknologi

| Lapisan | Teknologi |
|---|---|
| Framework | Express.js 4, CORS |
| Database | SQLite (modul bawaan Node.js, `node:sqlite`) |
| Pengujian | Vitest dengan laporan coverage (v8) |
| Runtime | Node.js **22.5 atau lebih baru** |

> Back-end memakai SQLite bawaan Node.js, sehingga tidak ada paket native yang perlu dikompilasi. Konsekuensinya, Node.js di bawah 22.5 tidak bisa menjalankannya.

## Struktur Proyek

```
.
├── src/
│   ├── server.js        # titik masuk Express
│   ├── db.js            # koneksi SQLite dan pembuatan tabel
│   ├── auth.js          # hash kata sandi, token, middleware
│   ├── seed.js          # data awal dan akun admin
│   ├── routes/          # auth, kategori, lomba, bookmark
│   ├── tests/           # pengujian (Vitest)
│   └── test-utils.js    # fungsi bantu pengujian
├── package.json
├── vitest.config.mjs
├── sonar-project.properties
```

## Menjalankan di Komputer Lokal

```bash
git clone ISI_URL_REPOSITORY_BACKEND
cd NAMA_FOLDER_REPOSITORY
npm install
npm run seed
npm start
```

API berjalan di `http://localhost:3000`. Cek dengan membuka `http://localhost:3000/api`, hasilnya:

```json
{ "nama": "LombaRadar API", "status": "ok" }
```

Catatan:

- File database dibuat otomatis di `data/lombaradar.db` dan tidak ikut di-commit, jadi `npm run seed` wajib dijalankan setelah clone.
- `npm run seed` aman dijalankan berulang: jika tabel `lomba` sudah berisi data, pengisian lomba dilewati.

### Variabel lingkungan

| Variabel | Default | Keterangan |
|---|---|---|
| `PORT` | `3000` | Port server API |
| `DB_PATH` | `data/lombaradar.db` | Lokasi file SQLite. Di hosting serverless gunakan `/tmp/lombaradar.db` |
| `AUTO_SEED` | kosong | Jika `true`, seed dijalankan otomatis saat server menyala (berguna di hosting yang databasenya dibuat ulang) |
| `ADMIN_EMAIL` | `admin@lombaradar.id` | Email akun admin yang dibuat oleh seed |
| `ADMIN_PASSWORD` | `admin123` | Kata sandi akun admin. **Ganti saat deploy** |
| `JWT_SECRET` | kunci bawaan (hanya lokal) | Kunci penanda token. **Wajib diganti dengan teks acak yang panjang saat deploy** |

### Akun admin

`npm run seed` membuat akun admin (bawaan lokal: `admin@lombaradar.id` / `admin123`). Untuk memakai email sendiri, atur `ADMIN_EMAIL` dan `ADMIN_PASSWORD` sebelum seed (di PowerShell: `$env:ADMIN_EMAIL="emailku@contoh.com"; $env:ADMIN_PASSWORD="sandi-kuat"; npm run seed`). Jika emailnya sudah terdaftar, akun tersebut dijadikan admin.

## Dokumentasi API

Base URL: `http://localhost:3000/api`

| Metode | Endpoint | Keterangan |
|---|---|---|
| GET | `/api` | Cek status API |
| POST | `/auth/register` | Daftar akun. Body: `{ "nama", "email", "password" }` (kata sandi minimal 6 karakter). Mengembalikan `{ token, user }` |
| POST | `/auth/login` | Masuk. Body: `{ "email", "password" }`. Mengembalikan `{ token, user }` |
| GET | `/auth/me` | Data akun yang sedang masuk (perlu token) |
| GET | `/kategori` | Daftar kategori |
| POST | `/kategori` | Tambah kategori. Body: `{ "nama": "..." }` |
| GET | `/lomba` | Daftar lomba (mendukung filter, lihat di bawah) |
| GET | `/lomba/:id` | Detail satu lomba |
| POST | `/lomba` | Tambah lomba (perlu token) |
| PUT | `/lomba/:id` | Ubah lomba (perlu token; admin atau pemilik lomba) |
| DELETE | `/lomba/:id` | Hapus lomba (perlu token; admin atau pemilik lomba) |
| GET | `/bookmark` | Daftar lomba tersimpan milik akun, diurutkan dari deadline terdekat (perlu token) |
| POST | `/bookmark` | Simpan lomba atau perbarui catatannya. Body: `{ "lomba_id": 1, "catatan": "..." }` (perlu token) |
| DELETE | `/bookmark/:lomba_id` | Hapus lomba dari simpanan (perlu token) |

Endpoint yang bertanda "perlu token" membutuhkan header `Authorization: Bearer <token>`.

**Parameter query `GET /lomba`**

| Parameter | Nilai | Keterangan |
|---|---|---|
| `q` | teks | Cari di judul, penyelenggara, dan deskripsi |
| `kategori` | id kategori | Filter kategori |
| `tingkat` | `kampus`, `nasional`, `internasional` | Filter tingkat |
| `status` | `aktif`, `lewat` | Deadline belum lewat atau sudah lewat |
| `sort` | `deadline` (default), `terbaru` | Urutan hasil |

**Body `POST /lomba` dan `PUT /lomba/:id`**

Field wajib: `judul`, `penyelenggara`, `kategori_id`, `deadline` (format `YYYY-MM-DD`).
Field opsional: `deskripsi`, `tingkat`, `mode`, `hadiah`, `biaya`, `link_pendaftaran`.

**Contoh**

```bash
curl "http://localhost:3000/api/lomba?status=aktif&tingkat=nasional&q=hackathon"

curl -X POST http://localhost:3000/api/lomba \
  -H "Content-Type: application/json" \
  -d '{"judul":"Contoh Lomba","penyelenggara":"Panitia","kategori_id":1,"deadline":"2026-12-31"}'
```

**Kode respons**

| Kode | Arti |
|---|---|
| 200 / 201 | Berhasil / berhasil dibuat |
| 400 | Data tidak valid, pesan ada di field `error` |
| 401 | Belum masuk, token tidak valid, atau email/kata sandi salah |
| 403 | Tidak berhak mengubah atau menghapus lomba milik orang lain |
| 404 | Data atau endpoint tidak ditemukan |
| 409 | Data sudah ada (kategori duplikat atau email sudah terdaftar) |

## Skema Database

```
users     (id, nama, email UNIQUE, password_hash, role, created_at)
kategori  (id, nama UNIQUE)
lomba     (id, created_by -> users.id, judul, penyelenggara, kategori_id -> kategori.id, deskripsi, tingkat,
           mode, hadiah, biaya, deadline, link_pendaftaran, created_at)
bookmark  (id, user_id -> users.id, lomba_id -> lomba.id, catatan, created_at,
           UNIQUE (user_id, lomba_id), keduanya ON DELETE CASCADE)
```

Kata sandi disimpan sebagai hash scrypt, bukan teks asli. Menghapus sebuah lomba otomatis menghapus bookmark yang terkait.


## Pengujian

```bash
npm test                 # menjalankan seluruh pengujian
npm run test:coverage    # beserta laporan coverage (coverage/lcov.info)
```

Pengujian memakai database sementara di memori (`DB_PATH=:memory:`), sehingga data asli tidak tersentuh. Cakupannya meliputi hash kata sandi dan token, seluruh endpoint (autentikasi, kategori, lomba, bookmark), hak akses admin dan pemilik, validasi, kode error, serta skrip seed.

## Deployment dan Jenkins

File `Jenkinsfile` di akar repository menjalankan tahap: checkout, install dependency, test dengan coverage, pemindaian keamanan Trivy, analisis SonarQube, Quality Gate, pengemasan, publikasi artefak, dan deploy.

`ISI_RINGKASAN_PIPELINE_JENKINS` (tambahkan tangkapan layar hasil build Jenkins di sini)

Catatan hosting: SQLite menyimpan data di file lokal. Di hosting serverless (misalnya Vercel) sistem file bersifat sementara, sehingga data kembali ke data awal setiap instance baru menyala. Atur `DB_PATH=/tmp/lombaradar.db` dan `AUTO_SEED=true` agar aplikasi selalu hidup dengan kategori, data contoh, dan akun admin.

## Lisensi

ISC
