# RentRide — Aplikasi Manajemen Sewa Motor

Developed by:
Syrilus Christiano Putra Arsam
(2301020019)

---

## 📱 Deskripsi Aplikasi

RentRide adalah aplikasi mobile manajemen sewa motor berbasis React Native (Expo) yang dikembangkan untuk membantu pengguna dalam proses pemesanan dan pengelolaan rental motor. Aplikasi ini menggunakan **Supabase** sebagai backend database dan **Zustand** untuk state management, dengan dukungan **real-time updates** menggunakan Supabase subscriptions.

Aplikasi ini dikembangkan dengan **Expo Router** untuk sistem navigasi berbasis file yang intuitif dan modern.

---

## 🏗️ Arsitektur Aplikasi

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND                             │
│  ┌───────────┐  ┌───────────┐  ┌───────────┐               │
│  │  Expo     │  │ Zustand   │  │ Async     │               │
│  │  Router   │  │ Store     │  │ Storage   │               │
│  └─────┬─────┘  └─────┬─────┘  └─────┬─────┘               │
│        │              │              │                      │
│  ┌─────┴──────────────┴──────────────┴──────────────┐       │
│  │              React Native Components              │       │
│  └───────────────────────────────────────────────────┘       │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                        BACKEND                              │
│  ┌───────────────────────────────────────────────────┐      │
│  │              Supabase                             │      │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐          │      │
│  │  │ Auth     │ │ Database │ │ Realtime │          │      │
│  │  └──────────┘ └──────────┘ └──────────┘          │      │
│  └───────────────────────────────────────────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

---

## ✨ Fitur Utama

### 👤 Autentikasi Pengguna
- **Register** - Pendaftaran akun baru dengan nama, email, dan nomor telepon
- **Login** - Sistem autentikasi berbasis Supabase Auth
- **Session Management** - Penyimpanan sesi menggunakan AsyncStorage
- **Auto-refresh Token** - Token auth diperbarui secara otomatis

### 🏍️ Manajemen Motor (Admin)
- **Tambah Motor** - Menambahkan data motor lengkap (nama, brand, kategori, CC, BBM, harga, stok)
- **Edit Motor** - Memperbarui informasi motor yang ada
- **Hapus Motor** - Menghapus motor dari inventori
- **Real-time Inventory** - Stok motor otomatis ter-update saat transaksi
- **Kategori Motor** - Filtering berdasarkan kategori (matic, sport, dll)

### 📅 Sistem Booking
- **Kalender Interaktif** - Pemilihan tanggal mulai dan akhir sewa
- **Kalkulasi Durasi** - Otomatisasi hitung lama sewa (hari)
- **Kalkulasi Harga** - Total harga = harga per hari × durasi
- **Informasi Stok** - Menampilkan ketersediaan unit secara real-time

### 💳 Transaksi & Pembayaran
- **Status Transaksi** - 5 status: pending → confirmed → ongoing → completed/cancelled
- **Order Number** - Format unik: `ORD-{timestamp}-{random}`
- **Riwayat Transaksi** - User dapat melihat semua transaksi mereka
- **Filter Status** - Filter transaksi berdasarkan status
- **Notifikasi Real-time** - Update status langsung tanpa refresh

### 👨‍💼 Admin Panel
- **Kelola Transaksi** - Update status transaksi (konfirmasi, mulai, selesaikan)
- **Pengembalian Motor** - Sistem pencatatan motor yang dikembalikan
- **Dashboard** - Overview semua transaksi

### 🔗 Deep Linking
- **Share Links** - Bagikan link promo ke teman
- **Promo Attribution** - Lacak referral dari deep link
- **Direct Booking** - Klik link langsung ke halaman booking motor

---

## 🔄 Alur Algoritma Aplikasi

### 1. Alur Booking Motor
```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Home      │───▶│   Login     │───▶│  Pilih Motor│
│   Screen    │    │   Required  │    │   (cek stok)│
└─────────────┘    └─────────────┘    └──────┬──────┘
                                             │
                     ┌─────────────────────────┘
                     ▼
              ┌─────────────┐    ┌─────────────┐
              │Pilih Tanggal│───▶│   Isi Data  │
              │   Sewa      │    │   Diri      │
              └──────┬──────┘    └──────┬──────┘
                     │                  │
                     ▼                  ▼
              ┌─────────────┐    ┌─────────────┐
              │Kalkulasi    │───▶│  Konfirmasi │
              │Total Harga  │    │  Pesanan    │
              └──────┬──────┘    └──────┬──────┘
                     │                  │
                     ▼                  ▼
              ┌─────────────┐    ┌─────────────┐
              │   Simpan    │◀───│   Bayar     │
              │   Transaksi │    │   (Pending) │
              └──────┬──────┘    └─────────────┘
                     │
                     ▼
              ┌─────────────┐
              │   Status    │
              │  Updated    │
              │ (Realtime)  │
              └─────────────┘
```

### 2. Alur Status Transaksi
```
                    ┌─────────────────┐
                    │     PENDING     │
                    │  (Menunggu)     │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │    CONFIRMED    │◀──────────┐
                    │  (Dikonfirmasi) │           │
                    └────────┬────────┘           │
                             │                    │
                    ┌────────▼────────┐    ┌──────▼──────┐
                    │    ONGOING      │    │  CANCELLED  │
                    │  (Berlangsung)  │    │ (Dibatalkan)│
                    └────────┬────────┘    └─────────────┘
                             │
                    ┌────────▼────────┐
                    │   COMPLETED     │
                    │    (Selesai)    │
                    └─────────────────┘
```

### 3. Alur Update Stok Otomatis
```
┌─────────────────────────────────────────────────────────┐
│              TRANSACTION STATUS CHANGE                  │
├─────────────────────────────────────────────────────────┤
│  pending ──confirmed  │  Stok -1 (motor disewa)        │
│  ongoing ──completed  │  Stok +1 (motor dikembalikan)  │
│  confirmed ─cancelled │  Stok +1 (pesanan dibatalkan)  │
└─────────────────────────────────────────────────────────┘
```

---

## 🛠️ Teknologi yang Digunakan

| Teknologi | Deskripsi |
|-----------|-----------|
| ⚛️ **React Native (Expo)** | Framework untuk membuat aplikasi mobile cross-platform (iOS & Android) |
| 🧭 **Expo Router** | Sistem navigasi berbasis file yang intuitif dan type-safe |
| 🗄️ **Supabase** | Backend-as-a-Service dengan PostgreSQL, Auth, dan Realtime subscriptions |
| 📦 **Zustand** | State management yang ringan dan sederhana |
| 💾 **AsyncStorage** | Penyimpanan data lokal di perangkat |
| 🔗 **Deep Linking** | Handle URL schemes untuk navigasi dan promo tracking |
| 🎨 **TypeScript** | Bahasa pemrograman dengan tipe data yang aman |
| 📱 **React Native StyleSheet** | Styling komponen dengan CSS-like syntax |

---

## 📁 Struktur Proyek

```
RentBike/
├── app/
│   ├── (tabs)/              # Tab navigation screens
│   │   ├── home.tsx         # Home screen - daftar motor
│   │   ├── explore.tsx      # Explore - browse kategori
│   │   └── profile.tsx      # User profile
│   ├── booking/             # Booking flow
│   │   ├── date.tsx         # Pilih tanggal sewa
│   │   ├── detailbooking.tsx # Isi data & konfirmasi
│   │   ├── confirmbooking.tsx # Konfirmasi akhir
│   │   ├── payment.tsx      # Halaman pembayaran
│   │   └── transaction.tsx  # Riwayat transaksi
│   ├── user/                # Authentication
│   │   ├── login.tsx        # Login screen
│   │   ├── register.tsx     # Register screen
│   │   └── verify.tsx       # OTP verification
│   ├── admin/               # Admin features
│   │   ├── ReturnMotor.tsx  # Pengembalian motor
│   │   └── ReturnMotorScreen.tsx
│   └── _layout.tsx          # Root layout
├── store/                   # State management
│   ├── useAuthStore.ts      # Auth state (user, login, logout)
│   ├── useBikeStore.ts      # Bike state (CRUD, realtime)
│   └── useTransactionStore.ts # Transaction state
├── lib/                     # Utilities
│   ├── supabase.ts          # Supabase client config
│   ├── deeplink.ts          # Deep link handler
│   └── shareLinks.ts        # Share functionality
├── hooks/                   # Custom hooks
│   └── useDeepLink.ts       # Deep link hook
├── types/                   # TypeScript types
│   ├── Bike.ts              # Bike interface
│   └── deepLink.ts          # Deep link types
└── constants/               # Constants
    └── theme.ts             # Theme colors & styles
```

---

## ⚙️ Cara Menjalankan Aplikasi

### 1. Clone Repository
```bash
git clone https://github.com/tianarsamm/UTS_PemrogramanMobile.git
cd RentRide
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Setup Environment Variables
Buat file `.env` di root project:
```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 4. Jalankan Aplikasi
```bash
npx expo start
```

### 5. Scan QR Code
Gunakan **Expo Go** di perangkat mobile (iOS/Android) untuk scan QR code.

---

## 📋 Database Schema (Supabase)

### Tabel: `users`
| Kolom | Tipe | Deskripsi |
|-------|------|-----------|
| id | UUID | Primary key |
| full_name | TEXT | Nama lengkap user |
| email | TEXT | Email user |
| phone | TEXT | Nomor telepon |
| role | TEXT | Role ('user' atau 'admin') |
| avatar_url | TEXT | URL foto profil |

### Tabel: `bikes`
| Kolom | Tipe | Deskripsi |
|-------|------|-----------|
| id | UUID | Primary key |
| name | TEXT | Nama motor |
| brand | TEXT | Brand motor (Honda, Yamaha, dll) |
| category | TEXT | Kategori (matic, sport, bebek) |
| fuel | TEXT | Tipe BBM |
| cc | INTEGER | Kapasitas mesin (CC) |
| price | INTEGER | Harga sewa per hari |
| unit | INTEGER | Stok tersedia |
| image_url | TEXT | URL gambar motor |
| created_at | TIMESTAMP | Waktu dibuat |

### Tabel: `transactions`
| Kolom | Tipe | Deskripsi |
|-------|------|-----------|
| id | UUID | Primary key |
| order_number | TEXT | Nomor pesanan unik |
| user_id | UUID | Foreign key ke users |
| bike_id | UUID | Foreign key ke bikes |
| bike_name | TEXT | Nama motor (denormalized) |
| bike_price | INTEGER | Harga per hari |
| duration | INTEGER | Lama sewa (hari) |
| start_date | DATE | Tanggal mulai |
| end_date | DATE | Tanggal akhir |
| total_price | INTEGER | Total harga |
| status | TEXT | Status (pending/confirmed/ongoing/completed/cancelled) |
| created_at | TIMESTAMP | Waktu dibuat |
| updated_at | TIMESTAMP | Waktu diperbarui |

---

## 🔧 Konfigurasi Deep Link

Deep link untuk aplikasi RentRide dapat dikonfigurasi di `app.json`:

```json
{
  "expo": {
    "scheme": "rentride",
    "extra": {
      "eas": {
        "projectId": "your-project-id"
      }
    }
  }
}
```

**Contoh Penggunaan Deep Link:**
```
rentride://booking?bikeId=xxx&promo=DISCONT20
```

---

## 📝 Catatan Pengembangan

- Aplikasi ini menggunakan **mock authentication** untuk development. Implementasi Supabase Auth dapat diaktifkan dengan membuka komentar di `store/useAuthStore.ts`
- Untuk production, pastikan RLS (Row Level Security) di Supabase dikonfigurasi dengan benar
- Stok motor di-update secara otomatis melalui Supabase Realtime subscriptions

---

## 📄 Lisensi

Proyek ini dikembangkan untuk keperluan tugas akhir mata kuliah Pemrograman Mobile.

