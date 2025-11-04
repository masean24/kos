# Kost Management System

Sistem manajemen kost modern yang lengkap dengan fitur admin dashboard, registrasi penghuni, manajemen kamar, dan integrasi pembayaran digital.

## 🚀 Fitur Utama

### Admin Dashboard
- **Dashboard Overview**: Monitoring real-time jumlah kamar, penghuni, dan invoice
- **Manajemen Kamar**: CRUD kamar dengan tracking status (kosong/terisi)
- **Manajemen Penghuni**: Lihat daftar semua penghuni aktif
- **Buat Akun Penghuni**: Admin bisa langsung buat akun penghuni + assign kamar
- **Manajemen Invoice**: Generate invoice bulanan otomatis, konfirmasi pembayaran manual
- **WhatsApp Reminder**: Kirim reminder pembayaran via WA dengan 1 tombol
- **Statistik Pemasukan**: Grafik pemasukan bulanan

### Fitur Penghuni
- **Registrasi Otomatis**: Sistem cek ketersediaan kamar saat pendaftaran
- **Dashboard Personal**: Lihat informasi pribadi dan status invoice
- **Riwayat Invoice**: Daftar lengkap invoice dengan status pembayaran
- **Pembayaran Digital**: Integrasi Xendit (VA, QRIS, e-wallet)

### Integrasi Xendit
- Generate invoice pembayaran via Xendit API
- Support multiple payment methods (Virtual Account, QRIS, e-wallet)
- Webhook untuk update status pembayaran otomatis
- Redirect ke payment page Xendit

## 🛠️ Tech Stack

- **Frontend**: React 19 + Tailwind CSS 4
- **Backend**: Express 4 + tRPC 11
- **Database**: MySQL / MariaDB (via Drizzle ORM)
- **Authentication**: Manus OAuth
- **Payment Gateway**: Xendit
- **WhatsApp Bot**: Baileys
- **Deployment**: Manus Platform / VPS

## 📦 Setup & Installation

### 1. Clone & Install Dependencies

```bash
cd /home/ubuntu/kost-management
pnpm install
```

### 2. Database Setup

Database schema sudah dibuat. Untuk push ke database:

```bash
pnpm db:push
```

### 3. Environment Variables

Environment variables sudah dikonfigurasi otomatis oleh platform. Untuk integrasi Xendit, tambahkan:

- `XENDIT_API_KEY`: Xendit secret API key (dari dashboard Xendit)
- `XENDIT_WEBHOOK_TOKEN`: Token untuk verifikasi webhook (opsional)

Cara menambahkan secrets:
1. Buka Settings → Secrets di Management UI
2. Tambahkan `XENDIT_API_KEY` dengan value API key dari Xendit
3. Tambahkan `XENDIT_WEBHOOK_TOKEN` jika ingin mengaktifkan verifikasi webhook

### 4. Run Development Server

```bash
pnpm dev
```

Server akan berjalan di `http://localhost:3000`

## 📖 Cara Penggunaan

### Setup Awal (Admin)

1. **Login sebagai Admin**
   - Login menggunakan akun owner project
   - Otomatis akan diarahkan ke admin dashboard

2. **Tambah Kamar**
   - Buka menu "Kelola Kamar"
   - Klik "Tambah Kamar"
   - Masukkan nomor kamar dan harga sewa
   - Klik "Simpan"

3. **Generate Invoice Bulanan**
   - Buka menu "Kelola Invoice"
   - Klik "Generate Invoice Bulanan"
   - Pilih bulan dan tanggal jatuh tempo
   - Sistem akan otomatis membuat invoice untuk semua penghuni

### Registrasi Penghuni

1. **Penghuni Login**
   - Klik "Login" di homepage
   - Login menggunakan email/OAuth

2. **Lengkapi Data Registrasi**
   - Masukkan nama, email, nomor HP
   - Masukkan nomor kamar yang ingin ditempati
   - Klik "Cek" untuk validasi ketersediaan kamar
   - Jika tersedia, klik "Daftar Sekarang"

3. **Akses Dashboard Penghuni**
   - Setelah registrasi, otomatis masuk ke dashboard
   - Lihat invoice dan lakukan pembayaran

### Pembayaran (Penghuni)

1. Buka "Riwayat Invoice"
2. Klik tombol "Bayar" pada invoice yang pending
3. Sistem akan redirect ke halaman pembayaran Xendit
4. Pilih metode pembayaran (VA, QRIS, e-wallet)
5. Selesaikan pembayaran
6. Status invoice otomatis update menjadi "Paid"

### Konfirmasi Manual (Admin)

Jika ada error pembayaran atau pembayaran manual:
1. Buka "Kelola Invoice"
2. Klik "Tandai Lunas" pada invoice yang sudah dibayar
3. Status akan berubah menjadi "Paid"

## 🗂️ Struktur Database

### Table: users
- `id`: Primary key
- `openId`: Manus OAuth ID (unique)
- `name`: Nama penghuni
- `email`: Email
- `nomorHp`: Nomor HP
- `role`: admin | penghuni
- `kamarId`: Foreign key ke table kamar

### Table: kamar
- `id`: Primary key
- `nomorKamar`: Nomor kamar (unique)
- `status`: kosong | terisi
- `penghuniId`: Foreign key ke users
- `hargaSewa`: Harga sewa per bulan

### Table: invoice
- `id`: Primary key
- `userId`: Foreign key ke users
- `kamarId`: Foreign key ke kamar
- `bulan`: Format "YYYY-MM"
- `jumlahTagihan`: Nominal tagihan
- `status`: pending | paid
- `xenditInvoiceId`: ID invoice dari Xendit
- `xenditInvoiceUrl`: URL pembayaran Xendit
- `tanggalJatuhTempo`: Deadline pembayaran
- `tanggalDibayar`: Tanggal pembayaran (nullable)

## 🔌 API Endpoints

### tRPC Procedures

**Admin Only:**
- `kamar.create`: Tambah kamar baru
- `kamar.update`: Update data kamar
- `kamar.delete`: Hapus kamar
- `tenant.list`: Lihat daftar penghuni
- `invoice.create`: Buat invoice manual
- `invoice.generateMonthly`: Generate invoice bulanan
- `invoice.updateStatus`: Update status invoice
- `dashboard.stats`: Statistik dashboard
- `dashboard.revenueChart`: Data grafik pemasukan

**Public/Protected:**
- `kamar.list`: Lihat daftar kamar
- `kamar.checkAvailability`: Cek ketersediaan kamar
- `tenant.register`: Registrasi penghuni baru
- `invoice.list`: Lihat invoice (filter by user)
- `invoice.getById`: Detail invoice
- `invoice.createPayment`: Buat pembayaran via Xendit
- `payment.webhook`: Webhook Xendit untuk update status

## 🔐 Role & Permissions

### Admin
- Akses penuh ke semua fitur
- Kelola kamar, penghuni, dan invoice
- Lihat statistik dan laporan

### Penghuni
- Registrasi dengan validasi kamar
- Lihat invoice pribadi
- Melakukan pembayaran
- Lihat riwayat pembayaran

## 🎨 UI/UX Features

- **Clean Minimalist Design**: Desain modern dengan Tailwind CSS
- **Responsive Layout**: Support mobile dan desktop
- **Loading States**: Skeleton dan spinner untuk UX yang smooth
- **Toast Notifications**: Feedback real-time untuk setiap aksi
- **Empty States**: Placeholder informatif untuk data kosong
- **Form Validation**: Validasi input di frontend dan backend

## 🚧 Future Enhancements

- [ ] WhatsApp reminder bot dengan Baileys
- [ ] Automated payment reminders
- [ ] Invoice delivery via WhatsApp
- [ ] Email notifications
- [ ] Invoice PDF download
- [ ] Export data ke Excel
- [ ] Multi-property management

## 📝 Notes

### Database
- Sistem menggunakan **MySQL** atau **MariaDB**
- Di platform Manus: Database sudah disediakan otomatis
- Di VPS: Anda perlu install MySQL/MariaDB sendiri atau gunakan managed database
- Connection string di environment variable `DATABASE_URL`

### Admin Account
- Owner project (sesuai `OWNER_OPEN_ID` di env) otomatis jadi admin
- Tidak perlu registrasi manual untuk admin
- Admin bisa buat akun penghuni langsung dari dashboard

### WhatsApp Bot
- Set `ENABLE_WHATSAPP_BOT=true` untuk aktifkan
- Scan QR code saat pertama kali running
- Session disimpan di folder `wa-auth`
- Bot bisa kirim reminder pembayaran otomatis

### Xendit Integration
- Tambahkan `XENDIT_API_KEY` di environment variables
- Webhook URL: `https://your-domain.com/api/trpc/payment.webhook`
- Support VA, QRIS, e-wallet

### Deployment
- **Platform Manus**: Deploy langsung dengan tombol Publish
- **VPS**: Ikuti panduan lengkap di `DEPLOYMENT.md`

## 🤝 Support

Untuk pertanyaan atau bantuan, silakan hubungi admin atau buka issue di repository.

---

**Built with ❤️ using Manus Platform**
