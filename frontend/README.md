# LombaRadar (Front-end)

Antarmuka web **LombaRadar**, aplikasi pemantau deadline lomba mahasiswa. Pengguna dapat mencari dan memfilter lomba, melihat detailnya, menambah atau mengubah data lomba, serta menyimpan lomba incaran beserta catatan pribadi. Repository ini hanya berisi front-end; API ada di repository terpisah.

Proyek 1 mata kuliah **Pengembangan Aplikasi Berbasis Web (PABWE) 2026**, dikerjakan secara individu.

| | |
|---|---|
| Nama | Martha Saulina Nababan |
| NIM | 11S24006 |
| Program Studi | Informatika, Institut Teknologi Del |

## Tautan

| Artefak | URL |
|---|---|
| Aplikasi online (front-end) | `ISI_URL_FRONTEND` |
| API online (back-end) | `ISI_URL_BACKEND/api` |
| Repository back-end | `ISI_URL_REPOSITORY_BACKEND` |
| Repository front-end (ini) | `ISI_URL_REPOSITORY_FRONTEND` |
| Video YouTube (menjalankan di komputer lokal) | `ISI_URL_YOUTUBE` |

## Teknologi

| Lapisan | Teknologi |
|---|---|
| Framework | ReactJS 18, React Router 6 (`HashRouter`) |
| Build tool | Vite |
| Pengujian | Vitest, React Testing Library, jsdom |

## Fitur

- Daftar lomba diurutkan dari deadline terdekat, dengan penanda hitung mundur (hari lagi, hari ini, lewat).
- Pencarian berdasarkan judul, penyelenggara, atau deskripsi.
- Filter kategori, tingkat (kampus, nasional, internasional), dan status (masih buka, semua, sudah lewat).
- Halaman detail lomba, serta tambah, ubah, dan hapus lomba.
- Simpan lomba ke daftar bookmark, lengkap dengan catatan pribadi yang bisa diedit.
- Daftar akun dan masuk. Ada dua peran: **admin** dan **mahasiswa**. Tamu boleh melihat daftar dan detail lomba. Mahasiswa dapat menambah lomba dan mengelola lomba miliknya sendiri. Admin dapat mengelola semua lomba.

## Struktur Proyek

```
.
├── src/
│   ├── App.jsx            # routing (halaman dimuat lazy)
│   ├── api.js             # pemanggilan API
│   ├── AuthContext.jsx    # status akun yang sedang masuk
│   ├── authPath.js        # pemetaan /auth/login dan /auth/register ke rute
│   ├── constants.js       # daftar pilihan (tingkat, pelaksanaan, biaya, urutan, status)
│   ├── utils.js           # format tanggal dan hitung deadline
│   ├── hooks/             # useAsync, useBookmark, useGuard, useForm, useSubmit, useDebounced
│   ├── components/        # Header, Wajib, Field, FilterBar, LombaRow, BookmarkPanel, CatatanEditor, PageHead, Status
│   ├── pages/             # Beranda, Detail, FormLomba, Tersimpan, Auth
│   ├── __tests__/         # pengujian (Vitest)
│   ├── setupTests.js
│   └── test-utils.jsx
├── .env.example
├── .env.production
├── vercel.json
├── sonar-project.properties
└── Jenkinsfile
```

## Menjalankan di Komputer Lokal

Jalankan dulu API (lihat README repository back-end), lalu:

```bash
git clone ISI_URL_REPOSITORY_FRONTEND
cd NAMA_FOLDER_REPOSITORY
cp .env.example .env        # di Command Prompt Windows: copy .env.example .env
npm install
npm run dev
```

Front-end berjalan di `http://localhost:5173`.

### Variabel lingkungan

| Variabel | Default | Keterangan |
|---|---|---|
| `VITE_API_URL` | `http://localhost:3000/api` | Alamat API yang dipanggil front-end. Nilainya ditanam saat build |

Untuk build produksi, nilai `VITE_API_URL` diambil dari file `.env.production`. **Isi dengan alamat API online sebelum deploy.**

### Build untuk produksi

```bash
npm run build      # hasil di dist/
npm run preview    # mencoba hasil build secara lokal
```

## Pengujian

```bash
npm test                 # menjalankan seluruh pengujian
npm run test:coverage    # beserta laporan coverage (coverage/lcov.info)
```

## Deployment dan Jenkins

File `Jenkinsfile` di akar repository menjalankan tahap: checkout, install dependency, test dengan coverage, pemindaian keamanan Trivy, analisis SonarQube, Quality Gate, pengemasan, publikasi artefak, dan deploy.

`ISI_RINGKASAN_PIPELINE_JENKINS` (tambahkan tangkapan layar hasil build Jenkins di sini)

Untuk Vercel: impor repository ini dengan preset **Vite**, lalu isi environment variable `VITE_API_URL` dengan alamat API online. File `vercel.json` mengarahkan semua alamat ke `index.html` sehingga `/auth/login` dan `/auth/register` tetap terbuka.

## Lisensi

ISC
