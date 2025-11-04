# Sistem Akun Admin & Tenant

Dokumen ini menjelaskan cara kerja sistem akun di Kost Management System.

## 🔐 Sistem Autentikasi

Aplikasi ini menggunakan **Manus OAuth** untuk autentikasi. Semua user (admin dan tenant) login menggunakan sistem OAuth yang sama.

## 👤 Jenis Akun

Ada 2 jenis role dalam sistem:

1. **Admin** - Pengelola kost (owner/manager)
2. **Penghuni** (Tenant) - Anak kos yang menyewa kamar

## 🎯 Admin Account

### Cara Setup Admin Default

Admin **TIDAK** perlu registrasi manual. Admin ditentukan otomatis berdasarkan `OWNER_OPEN_ID` di environment variable.

**Langkah setup:**

1. Login pertama kali ke aplikasi menggunakan akun yang ingin dijadikan admin
2. Cek `openId` Anda di database:
   ```sql
   SELECT id, openId, name, email, role FROM users;
   ```
3. Copy `openId` Anda
4. Set di file `.env`:
   ```env
   OWNER_OPEN_ID="openid_anda_disini"
   OWNER_NAME="Nama Admin"
   ```
5. Restart aplikasi
6. Login lagi, role Anda otomatis jadi `admin`

**Catatan:**
- Hanya 1 admin utama (owner) yang bisa diset via `OWNER_OPEN_ID`
- Admin bisa promote user lain jadi admin via database manual jika perlu
- Admin punya akses penuh ke semua fitur management

### Fitur Admin

- ✅ Kelola kamar (CRUD)
- ✅ Buat akun tenant langsung dari dashboard
- ✅ Generate invoice bulanan untuk semua tenant
- ✅ Monitor status pembayaran semua tenant
- ✅ Kelola laporan masalah dari tenant
- ✅ Kirim reminder pembayaran via WhatsApp

## 🏠 Tenant Account

### Cara Buat Akun Tenant

Ada 2 cara untuk membuat akun tenant:

#### Cara 1: Admin Buat Akun Tenant (Recommended)

1. Login sebagai admin
2. Buka menu **Lihat Penghuni**
3. Klik tombol **Buat Akun Penghuni**
4. Isi form:
   - Nama lengkap
   - Email
   - Nomor HP
   - Pilih kamar yang tersedia
5. Klik **Buat Akun**

Sistem akan:
- Membuat akun tenant otomatis
- Assign kamar ke tenant
- Set status kamar jadi "terisi"

#### Cara 2: Tenant Registrasi Sendiri

1. Tenant buka halaman `/tenant/register`
2. Login dengan OAuth (jika belum login)
3. Isi form registrasi:
   - Nama lengkap
   - Email
   - Nomor HP
   - Pilih kamar yang tersedia
4. Submit form

Sistem akan:
- Cek ketersediaan kamar
- Assign kamar ke tenant
- Redirect ke dashboard tenant

### Login Tenant

1. Buka aplikasi
2. Klik **Login** (akan redirect ke OAuth provider)
3. Login dengan akun yang sudah terdaftar
4. Otomatis redirect ke dashboard tenant

**Catatan:**
- Tenant yang belum assign kamar akan diminta registrasi dulu
- Tenant hanya bisa lihat data mereka sendiri (invoice, laporan, dll)

### Fitur Tenant

- ✅ Lihat informasi kamar dan profil
- ✅ Lihat invoice dan riwayat pembayaran
- ✅ Bayar invoice via Xendit (multiple payment methods)
- ✅ Lapor masalah/keluhan via web
- ✅ Track status laporan masalah

## 🔄 Flow Lengkap

### Flow Admin

```
1. Set OWNER_OPEN_ID di .env
2. Login pertama kali → Role otomatis jadi admin
3. Buat kamar-kamar di menu "Kelola Kamar"
4. Buat akun tenant di menu "Lihat Penghuni"
5. Generate invoice bulanan setiap bulan
6. Monitor pembayaran di "Status Pembayaran"
7. Kelola laporan masalah di "Kelola Laporan"
```

### Flow Tenant

```
1. Admin buat akun tenant (atau tenant registrasi sendiri)
2. Tenant login via OAuth
3. Lihat invoice di dashboard
4. Bayar invoice via Xendit
5. Lapor masalah jika ada keluhan
6. Track status laporan
```

## 🔧 Troubleshooting

### Admin tidak bisa akses dashboard admin

**Penyebab:** `OWNER_OPEN_ID` tidak match dengan openId di database

**Solusi:**
1. Cek openId di database: `SELECT openId FROM users WHERE email='admin@example.com';`
2. Pastikan `OWNER_OPEN_ID` di `.env` sama persis dengan openId di database
3. Restart aplikasi

### Tenant tidak bisa registrasi

**Penyebab:** Semua kamar sudah terisi

**Solusi:**
1. Admin buat kamar baru di menu "Kelola Kamar"
2. Atau admin ubah status kamar yang sudah tidak terpakai jadi "kosong"

### Tenant tidak bisa login

**Penyebab:** Akun belum dibuat atau OAuth gagal

**Solusi:**
1. Pastikan tenant sudah punya akun (admin buat atau registrasi sendiri)
2. Cek apakah OAuth provider berfungsi normal
3. Cek logs aplikasi untuk error detail

## 📝 Best Practices

### Untuk Admin

1. **Setup admin dulu** sebelum buat tenant
2. **Buat semua kamar** sebelum tenant registrasi
3. **Generate invoice rutin** setiap awal bulan (atau setup cron job)
4. **Monitor pembayaran** secara berkala
5. **Backup database** secara rutin

### Untuk Tenant

1. **Simpan kredensial login** dengan aman
2. **Bayar invoice sebelum jatuh tempo** untuk hindari denda
3. **Lapor masalah segera** jika ada keluhan
4. **Update profil** jika ada perubahan kontak

## 🔐 Security Notes

- **Password:** Sistem menggunakan OAuth, tidak ada password yang disimpan di aplikasi
- **Session:** Session disimpan di cookie dengan JWT token
- **Role:** Role dicek di setiap request untuk authorize akses
- **Database:** Jangan expose database ke public internet

## 💡 Tips

### Promote User Jadi Admin (Manual)

Jika perlu tambah admin lain:

```sql
UPDATE users SET role = 'admin' WHERE id = <user_id>;
```

### Reset Role Tenant

Jika salah set role:

```sql
UPDATE users SET role = 'penghuni' WHERE id = <user_id>;
```

### Cek Semua Admin

```sql
SELECT id, name, email, role FROM users WHERE role = 'admin';
```

---

**Pertanyaan?** Baca dokumentasi lengkap di `README.md` dan `DEPLOYMENT.md`

