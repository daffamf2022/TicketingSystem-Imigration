# SIAP-Prioritas 🇮🇩

**Sistem Antrean Paspor Inklusif dan Prioritas**  
Aplikasi web fullstack untuk pengelolaan antrean paspor berbasis prioritas — khususnya dirancang untuk melayani lansia, penyandang disabilitas, ibu hamil, dan balita di Kantor Imigrasi RI.

> ⚠️ **Disclaimer**: Ini adalah purwarupa (*prototype*) untuk keperluan akademis/demonstrasi. Nomor antrean yang dihasilkan bukan bagian dari sistem resmi M-Paspor Dirjen Imigrasi.

---

## ✨ Fitur Utama

### Untuk Pemohon (CUSTOMER)
- 📋 **Panduan Berkas** — Pengecekan kategori prioritas & checklist dokumen dinamis berdasarkan jenis permohonan
- 🗓️ **Reservasi Antrean** — Pemilihan jadwal (Hari Ini / Besok), kategori prioritas, kebutuhan bantuan, dan unggah dokumen
- 🎟️ **Tiket Digital** — Nomor antrean dengan kode `P-` (reguler) atau `D-` (prioritas difabel/lansia)
- 📜 **Riwayat Reservasi** — Akses dan cetak ulang tiket yang pernah dibuat

### Untuk Petugas Imigrasi (OFFICER)
- 🖥️ **Dashboard Petugas** — Tabel antrean real-time dengan filter status, preview berkas, dan update status (`PENDING → VERIFIED → COMPLETED`)
- 🔒 **Akses Terbatas** — Pendaftaran petugas memerlukan NIP (Nomor Induk Pegawai) yang unik

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
| **ORM** | Prisma 7 (adapter MariaDB/MySQL) |
| **Database** | MySQL / MariaDB |
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
│   │   ├── seed.ts                # Seeder kuota hari ini & besok
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
- MySQL / MariaDB berjalan di `localhost:3306`
- XAMPP, Laragon, atau instalasi MySQL standalone

### 1. Clone & Install

```bash
git clone https://github.com/<username>/SIAP-prioritas.git
cd SIAP-prioritas
```

### 2. Setup Backend

```bash
cd backend

# Salin file environment
cp .env.example .env
# Edit DATABASE_URL, JWT_SECRET di .env

# Install dependensi
npm install

# Generate Prisma Client
npx prisma generate

# Push skema ke database (buat tabel)
npx prisma db push

# Seed kuota untuk hari ini & besok
npm run db:seed

# Jalankan server dev
npm run dev
```

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

Buat file `.env` di folder `backend/` berisi:

```env
PORT=5000
DATABASE_URL="mysql://root:PASSWORD@127.0.0.1:3306/siap_prioritas"
JWT_SECRET="ganti_dengan_secret_yang_kuat"
```

> **Catatan**: Gunakan `127.0.0.1` bukan `localhost` untuk menghindari resolusi IPv6 pada Windows.

---

## 🗄️ Skema Database

```
users          — id, nik, name, email, password, role (CUSTOMER/OFFICER), nip?
quotas         — id, date, start_time, end_time, max_quota, remaining_quota
reservations   — id, user_id, quota_id, queue_number, status
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

### Reservasi
| Method | Endpoint | Akses |
|---|---|---|
| GET | `/api/quotas` | Publik |
| POST | `/api/reservations` | Login |
| GET | `/api/reservations` | Login (CUSTOMER: milik sendiri, OFFICER: semua) |
| GET | `/api/reservations/:id` | Login |
| PATCH | `/api/reservations/:id/status` | OFFICER only |

---

## 👤 Peran Pengguna

| Peran | Pendaftaran | Akses |
|---|---|---|
| `CUSTOMER` | Email + NIK | Reservasi, Panduan, Riwayat Tiket |
| `OFFICER` | Email + NIK + **NIP** | Dashboard Petugas (semua antrean) |

---

## 📸 Tangkapan Layar

> *Tambahkan screenshot halaman utama, reservasi, dashboard petugas, dan widget aksesibilitas di sini.*

---

## 📜 Lisensi

Proyek ini dibuat untuk keperluan akademis. Tidak berafiliasi dengan Ditjen Imigrasi RI atau aplikasi M-Paspor resmi.

---

*Dibuat dengan ❤️ menggunakan React + Express + Prisma*
