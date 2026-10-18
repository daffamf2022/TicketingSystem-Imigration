# SIAP-Prioritas 🇮🇩

**Sistem Informasi Layanan Prioritas Paspor**

SIAP.PRIORITAS adalah prototipe akademik untuk pengelolaan permohonan layanan prioritas bagi lansia, penyandang disabilitas, ibu hamil, dan balita di Kantor Imigrasi Kelas I TPI Yogyakarta.

> ⚠️ **Disclaimer**: Ini adalah prototipe akademik untuk penelitian dan demonstrasi, belum terhubung dengan layanan produksi Imigrasi. Kode pengajuan dan nomor antrean yang dihasilkan bukan nomor resmi M-Paspor.

---

## ✨ Fitur Utama

### Untuk Pemohon
- 📋 **Panduan Berkas** — Pengecekan kategori prioritas & checklist dokumen dinamis berdasarkan jenis permohonan
- 🗓️ **Permohonan Layanan** — Pemilihan jadwal hari ini, kategori prioritas, kebutuhan bantuan, dan unggah dokumen
- 🎟️ **Bukti Permohonan** — Kode pengajuan terpisah dari nomor antrean yang diterbitkan setelah disetujui
- 📜 **Riwayat Reservasi** — Akses dan cetak ulang tiket yang pernah dibuat

### Untuk Petugas Imigrasi
- 🖥️ **Dashboard Petugas Layanan Prioritas** — Daftar permohonan, preview berkas, dan tindakan setujui/tolak/selesai/batalkan
- 🔒 **Akses Terbatas** — Pendaftaran petugas memerlukan NIP (Nomor Induk Pegawai) yang unik
- ✉️ **Atur Ulang Kata Sandi** — Tautan satu kali pakai yang dikirim melalui SMTP

### Aksesibilitas (A11Y)
- ♿ **Widget Aksesibilitas** (CTRL+U) dengan 12 fitur:
  - Ukuran teks (3 level)
  - Kontras tinggi, Hitam-Putih murni
  - Sorot tautan, Spasi teks, Tinggi garis
  - Animasi dijeda, Sembunyikan gambar
  - Font ramah disleksia, Kursor besar
  - Perataan teks (Kiri/Tengah/Kanan)
  - Kejenuhan warna (Rendah/Tinggi/Mono)

---

## 🏗️ Tech Stack

| Layer | Teknologi |
|---|---|
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS v4 |
| **Backend** | Node.js, Express 5, TypeScript |
| **ORM** | Prisma 7 (adapter PostgreSQL) |
| **Database** | Supabase PostgreSQL |
| **Auth** | JWT (`jsonwebtoken`) + `bcryptjs` |
| **Upload** | Multer (disk storage) |

---

## 📁 Struktur Proyek

```
SIAP-prioritas/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma          # Model database
│   ├── src/
│   │   ├── controllers/           # authController, reservationController, quotaController
│   │   ├── middlewares/           # auth, role, upload, date, error
│   │   ├── routes/                # authRoutes, reservationRoutes, quotaRoutes
│   │   ├── lib/prisma.ts          # Prisma client singleton
│   │   ├── seed.ts                # Seeder kuota hari ini
│   │   └── server.ts              # Entry point Express
│   └── .env.example
└── frontend/
    └── src/
        ├── components/            # Navbar, AuthForm, ProtectedRoute, AccessibilityWidget, ...
        ├── context/               # AccessibilityContext + Provider
        ├── pages/                 # Guide, Reservation, TicketDetail, LoginPage, AdminDashboard
        ├── services/              # api.ts, authService.ts, reservationService.ts
        └── App.tsx
```

---

## 🚀 Instalasi & Menjalankan Lokal

### Prasyarat
- Node.js >= 18
- Akun Supabase dengan project yang sudah dibuat

### 1. Clone & Install

```bash
git clone https://github.com/<username>/SIAP-prioritas.git
cd SIAP-prioritas
```

### 2. Setup Backend

```bash
cd backend

# Salin file environment (Windows PowerShell)
Copy-Item .env.example .env
# macOS/Linux: cp .env.example .env
# Isi DATABASE_URL, JWT_SECRET, dan konfigurasi SMTP pada file .env

# Install dependensi
npm install

# Terapkan migrasi database
npx prisma migrate deploy

# Generate Prisma Client
npm run prisma:generate

# Seed kuota untuk hari ini
npm run db:seed

# Buat akun petugas pertama (ikuti prompt untuk nama, NIP, email, dan password)
npm run admin:create

# Jalankan server dev
npm run dev
```

> Jika database lama sebelumnya dibuat menggunakan `prisma db push` dan belum memiliki riwayat migrasi, tandai migrasi awal sebagai sudah diterapkan satu kali sebelum `migrate deploy`: `npx prisma migrate resolve --applied 20260708141704_init`. Migrasi baru menambahkan tabel token reset dan memastikan akun petugas memiliki NIP; petugas lama tanpa NIP akan diturunkan menjadi pemohon sampai diperbarui lewat `npm run admin:create`.

Backend berjalan di: `http://localhost:5000`

### 3. Setup Frontend

```bash
cd ../frontend

npm install
npm run dev
```

Frontend berjalan di: `http://localhost:5173`

---

## ⚙️ Konfigurasi Environment (`backend/.env`)

Di Supabase, buka project lalu pilih **Connect**. Pilih metode koneksi **Direct connection** untuk backend yang dapat terhubung melalui IPv6. Jika koneksi langsung tidak tersedia di jaringan Anda atau aplikasi gagal terhubung, pilih **Session pooler** sebagai gantinya. Salin URI yang ditampilkan; jangan merangkai host atau username sendiri.

```env
PORT=5000
DATABASE_URL="postgresql://postgres.[PROJECT-REF]:[PASSWORD]@[POOLER-HOST]:5432/postgres?sslmode=require"
JWT_SECRET="ganti_dengan_secret_yang_kuat"
```

> **Penting**: Ganti placeholder URL dengan URI yang disalin dari dashboard Supabase, lalu ganti `[YOUR-PASSWORD]` bila masih ada. Jika password berisi karakter khusus, gunakan versi URL-encoded. Jangan unggah atau commit file `.env`.
>
> Ini menyiapkan skema baru di Supabase. Data yang sudah ada di MySQL/MariaDB tidak disalin otomatis; ekspor/impor perlu dilakukan terpisah jika data lama ingin dipertahankan.

> Akun petugas dibuat dari terminal backend dengan `npm run admin:create`, bukan melalui registrasi publik. Perintah meminta nama, NIP, email, dan password; password tidak ditampilkan saat diketik. Migrasi akan menurunkan akun lama ber-role petugas tanpa NIP menjadi pemohon hingga identitasnya dilengkapi melalui perintah tersebut.
>
> Untuk mengirim tautan atur ulang kata sandi, isi `FRONTEND_URL`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, dan `SMTP_FROM` pada `backend/.env`. Tanpa konfigurasi itu, aplikasi akan menyampaikan dengan jelas bahwa tautan belum dapat dikirim.

---

## 🗄️ Skema Database

```
users          — id, username, nik, name, email, password, role (CUSTOMER/OFFICER), nip?
password_reset_tokens — token reset tersimpan dalam bentuk hash dan memiliki masa berlaku
quotas         — id, date, start_time, end_time, max_quota, remaining_quota
reservations   — id, user_id, quota_id, application_code, queue_number, status
companions     — id, reservation_id, needs_disability_facility, disability_type, companion_name, companion_nik
documents      — id, reservation_id, document_type, file_path
```

---

## 🔐 API Endpoints

### Auth
| Method | Endpoint | Akses |
|---|---|---|
| POST | `/api/auth/register` | Publik |
| POST | `/api/auth/login` | Publik |
| POST | `/api/auth/password-reset-link` | Publik (email akun pemohon) |
| POST | `/api/auth/reset-password` | Publik (token sekali pakai) |
| POST | `/api/auth/users/:id/password-reset-link` | Petugas |

### Reservasi
| Method | Endpoint | Akses |
|---|---|---|
| GET | `/api/quotas` | Publik |
| POST | `/api/reservations` | Login sebagai CUSTOMER (kategori prioritas, hari yang sama) |
| GET | `/api/reservations` | Login (CUSTOMER: milik sendiri, OFFICER: semua) |
| GET | `/api/reservations/:id` | Login (pemilik tiket) |
| PATCH | `/api/reservations/:id/status` | OFFICER only |

Pemohon hanya dapat memiliki satu permohonan berstatus `PENDING` atau `VERIFIED` pada satu tanggal pelayanan, meskipun memilih slot waktu yang berbeda. Permohonan berstatus `REJECTED`, `COMPLETED`, atau `CANCELLED` tidak membatasi pengajuan baru pada tanggal tersebut.
Pemohon harus mendaftar dan masuk sebelum mengajukan permohonan. Reservasi ditautkan ke ID akun dari token login, bukan ke identitas yang dikirim melalui formulir. Riwayat dan detail tiket hanya dapat diakses oleh pemilik akun yang masuk.
Nama pengguna harus unik dan dapat digunakan bersama NIK atau email untuk masuk. Email pendaftaran digunakan untuk informasi akun dan pengiriman tautan pemulihan kata sandi.
Untuk akun yang sudah ada saat migrasi nama pengguna diterapkan, nama pengguna awal diisi menggunakan NIK. Pengiriman tautan pemulihan memerlukan konfigurasi SMTP dan `FRONTEND_URL` pada backend.

---

## 👤 Peran Pengguna

| Peran | Pendaftaran | Akses |
|---|---|---|
| Pemohon (`CUSTOMER`) | Nama pengguna + email + NIK + kata sandi | Permohonan layanan prioritas |
| Petugas (`OFFICER`) | Email + password | Dashboard Petugas Layanan Prioritas |

---

## 📸 Tangkapan Layar

> *Tambahkan screenshot halaman utama, reservasi, dashboard petugas, dan widget aksesibilitas di sini.*

---

## 📜 Lisensi

Proyek ini dibuat untuk keperluan akademis. Tidak berafiliasi dengan Ditjen Imigrasi RI atau aplikasi M-Paspor resmi.

---

*Dibuat dengan ❤️ menggunakan React + Express + Prisma*
