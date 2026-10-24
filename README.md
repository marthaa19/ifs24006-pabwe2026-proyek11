# LombaRadar

Aplikasi web untuk memantau deadline lomba mahasiswa. Pengguna dapat mencari dan memfilter lomba, melihat detailnya, menambah atau mengubah data lomba, serta menyimpan lomba incaran beserta catatan pribadi.

Proyek 1 mata kuliah **Pengembangan Aplikasi Berbasis Web (PABWE) 2026**, dikerjakan secara individu.

| | |
|---|---|
| Nama | Martha Saulina Nababan |
| NIM | 11S24006 |
| Program Studi | Informatika, Institut Teknologi Del |

## Tautan

| Artefak | URL |
|---|---|
| Aplikasi online (frontend) | `ISI_URL_FRONTEND` |
| API online (backend) | `ISI_URL_BACKEND/api` |
| Video YouTube (menjalankan di komputer lokal) | `ISI_URL_YOUTUBE` |
| Repository GitHub | `ISI_URL_REPOSITORY` |

## Teknologi

| Lapisan | Teknologi |
|---|---|
| Back-end | Express.js 4, SQLite (modul bawaan `node:sqlite`), CORS |
| Front-end | ReactJS 18, React Router 6 (`HashRouter`), Vite 5 |
| Runtime | Node.js **22.5 atau lebih baru** |

> Back-end memakai SQLite bawaan Node.js, sehingga tidak ada paket native yang perlu dikompilasi. Konsekuensinya, Node.js versi lama (di bawah 22.5) tidak akan bisa menjalankan back-end.

## Fitur

- Daftar lomba diurutkan dari deadline terdekat, dengan penanda hitung mundur (hari lagi, hari ini, lewat).
- Pencarian berdasarkan judul, penyelenggara, atau deskripsi.
- Filter kategori, tingkat (kampus, nasional, internasional), dan status (masih buka, semua, sudah lewat).
- Pengurutan berdasarkan deadline terdekat atau terbaru ditambahkan.
- Halaman detail lomba.
- Tambah, ubah, dan hapus lomba (CRUD) dengan validasi di sisi server.
- Simpan lomba ke daftar bookmark, lengkap dengan catatan pribadi yang bisa diedit.
- Daftar akun dan masuk (autentikasi berbasis token). Ada dua peran: **admin** dan **mahasiswa**. Tamu boleh melihat daftar dan detail lomba. Mahasiswa dapat menambah lomba, mengubah dan menghapus lomba miliknya sendiri, serta menyimpan bookmark pribadi. Admin dapat mengelola semua lomba, termasuk data awal.

## Struktur Proyek

```
ifs24006-pabwe2026-proyek1/
├── backend/
│   ├── server.js          # titik masuk Express
│   ├── db.js              # koneksi SQLite dan pembuatan tabel
│   ├── auth.js            # hash kata sandi, token, middleware
│   ├── seed.js            # data awal
│   ├── routes/
│   │   ├── auth.js
│   │   ├── kategori.js
│   │   ├── lomba.js
│   │   └── bookmark.js
│   └── package.json
└── frontend/
    ├── src/
    │   ├── App.jsx        # layout dan routing
    │   ├── api.js         # pemanggilan API
    │   ├── AuthContext.jsx # status akun yang sedang masuk
    │   ├── utils.js       # format tanggal dan hitung deadline
    │   ├── components/LombaRow.jsx
    │   └── pages/         # Beranda, Detail, FormLomba, Tersimpan, Auth
    ├── .env.example
    └── package.json
```

## Menjalankan di Komputer Lokal

### Prasyarat

- Git
- Node.js 22.5 atau lebih baru (cek dengan `node -v`)

### 1. Clone repository

```bash
git clone ISI_URL_REPOSITORY
cd ifs24006-pabwe2026-proyek1
```

### 2. Jalankan back-end

```bash
cd backend
npm install
npm run seed
npm start
```

Back-end berjalan di `http://localhost:3000`. Cek dengan membuka `http://localhost:3000/api`, hasilnya:

```json
{ "nama": "LombaRadar API", "status": "ok" }
```

Catatan:

- File database dibuat otomatis di `backend/data/lombaradar.db` dan tidak ikut di-commit, jadi `npm run seed` wajib dijalankan setelah clone.
- `npm run seed` aman dijalankan berulang: jika tabel `lomba` sudah berisi data, proses seed dilewati.
- Biarkan terminal ini tetap terbuka.

### 3. Jalankan front-end

Buka terminal baru dari folder utama proyek.

```bash
cd frontend
cp .env.example .env        # di Command Prompt Windows: copy .env.example .env
npm install
npm run dev
```

Front-end berjalan di `http://localhost:5173`.

### Variabel lingkungan

| Variabel | Lokasi | Default | Keterangan |
|---|---|---|---|
| `PORT` | back-end | `3000` | Port server API |
| `DB_PATH` | back-end | `backend/data/lombaradar.db` | Lokasi file SQLite |
| `ADMIN_EMAIL` | back-end (saat seed) | `admin@lombaradar.id` | Email akun admin yang dibuat oleh `npm run seed` |
| `ADMIN_PASSWORD` | back-end (saat seed) | `admin123` | Kata sandi akun admin. **Ganti saat deploy** |
| `JWT_SECRET` | back-end | kunci bawaan (hanya untuk lokal) | Kunci penanda token. **Wajib diganti dengan teks acak yang panjang saat deploy** |
| `VITE_API_URL` | front-end (`.env`) | `http://localhost:3000/api` | Alamat API yang dipanggil front-end |

### Akun admin

`npm run seed` membuat akun admin (bawaan lokal: `admin@lombaradar.id` / `admin123`). Untuk memakai email sendiri, atur `ADMIN_EMAIL` dan `ADMIN_PASSWORD` sebelum seed (di PowerShell: `$env:ADMIN_EMAIL="emailku@contoh.com"; $env:ADMIN_PASSWORD="sandi-kuat"; npm run seed`). Jika emailnya sudah terdaftar, akun tersebut dijadikan admin.

### Build front-end untuk produksi

```bash
cd frontend
npm run build      # hasil di frontend/dist
npm run preview    # mencoba hasil build secara lokal
```

Untuk deploy, set `VITE_API_URL` ke alamat API online **sebelum** menjalankan `npm run build`, karena nilainya ditanam saat proses build.

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

## Deployment

### Vercel (satu link, `vercel.json`)

Dua service dalam satu project: `backend` (Express) di `/api/*` dan `frontend` (Vite) di jalur lainnya. Front-end dibuild dengan `VITE_API_URL=/api` (`frontend/.env.production`).

1. Impor repository di Vercel, nama project `ifs24006-pabwe2026-proyek1`. Biarkan konfigurasi multi-service dari `vercel.json`.
2. Tambahkan Environment Variables: `JWT_SECRET` (teks acak panjang) dan `ADMIN_PASSWORD`.
3. Deploy. Aplikasi ada di `https://ifs24006-pabwe2026-proyek1.vercel.app`, API di `/api`.

Catatan: di Vercel, SQLite disimpan di `/tmp` sehingga bersifat sementara. Data awal dan akun admin dibuat ulang otomatis saat instance baru, tetapi akun dan lomba yang ditambahkan pengguna dapat hilang.

### Render (alternatif, data permanen)

`render.yaml` menjalankan API sekaligus menyajikan front-end hasil build dalam satu service dengan disk persisten (plan berbayar).

## Pengujian dan Deployment (Jenkins)

### Menjalankan test secara lokal

```bash
cd backend && npm test        # 79 test: unit auth + integrasi API (node:test, DB sementara)
cd frontend && npm install && npm test   # Vitest + React Testing Library
```

### Pipeline Jenkins

File `Jenkinsfile` di akar repository menjalankan tahap berikut secara berurutan: info lingkungan, back-end install, back-end test, front-end install, front-end test, front-end build. Hasil test dilaporkan ke Jenkins dalam format JUnit (`test-results/junit.xml`).

`ISI_RINGKASAN_PIPELINE_JENKINS` (tambahkan tangkapan layar hasil build Jenkins di sini)

## Lisensi

ISC
