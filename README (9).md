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

## Struktur Proyek

```
ifs24006-pabwe2026-proyek1/
├── backend/
│   ├── server.js          # titik masuk Express
│   ├── db.js              # koneksi SQLite dan pembuatan tabel
│   ├── seed.js            # data awal
│   ├── routes/
│   │   ├── kategori.js
│   │   ├── lomba.js
│   │   └── bookmark.js
│   └── package.json
└── frontend/
    ├── src/
    │   ├── App.jsx        # layout dan routing
    │   ├── api.js         # pemanggilan API
    │   ├── utils.js       # format tanggal dan hitung deadline
    │   ├── components/LombaRow.jsx
    │   └── pages/         # Beranda, Detail, FormLomba, Tersimpan
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
| `VITE_API_URL` | front-end (`.env`) | `http://localhost:3000/api` | Alamat API yang dipanggil front-end |

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
| GET | `/kategori` | Daftar kategori |
| POST | `/kategori` | Tambah kategori. Body: `{ "nama": "..." }` |
| GET | `/lomba` | Daftar lomba (mendukung filter, lihat di bawah) |
| GET | `/lomba/:id` | Detail satu lomba |
| POST | `/lomba` | Tambah lomba |
| PUT | `/lomba/:id` | Ubah lomba |
| DELETE | `/lomba/:id` | Hapus lomba |
| GET | `/bookmark` | Daftar lomba tersimpan, diurutkan dari deadline terdekat |
| POST | `/bookmark` | Simpan lomba atau perbarui catatannya. Body: `{ "lomba_id": 1, "catatan": "..." }` |
| DELETE | `/bookmark/:lomba_id` | Hapus lomba dari simpanan |

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
| 404 | Data atau endpoint tidak ditemukan |
| 409 | Data sudah ada (kategori duplikat) |

## Skema Database

```
kategori  (id, nama UNIQUE)
lomba     (id, judul, penyelenggara, kategori_id -> kategori.id, deskripsi, tingkat,
           mode, hadiah, biaya, deadline, link_pendaftaran, created_at)
bookmark  (id, lomba_id UNIQUE -> lomba.id ON DELETE CASCADE, catatan, created_at)
```

Menghapus sebuah lomba otomatis menghapus bookmark yang terkait.

## Pengujian dan Deployment (Jenkins)

`ISI_RINGKASAN_PIPELINE_JENKINS`

## Lisensi

ISC
