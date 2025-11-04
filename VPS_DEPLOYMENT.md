# VPS Deployment Guide - Kost Management System

Panduan lengkap untuk deploy Kost Management System ke VPS Anda sendiri.

## Prerequisites

Pastikan VPS Anda sudah terinstall:
- **Node.js** v18 atau lebih baru
- **pnpm** package manager
- **MySQL** atau **MariaDB**
- **PM2** (untuk process management)
- **Nginx** (optional, untuk reverse proxy)

## 1. Clone Repository

```bash
cd /root
git clone https://github.com/masean24/kos.git kost-management
cd kost-management
```

## 2. Install Dependencies

```bash
pnpm install
```

## 3. Setup Database

Buat database MySQL:

```bash
mysql -u root -p
```

```sql
CREATE DATABASE kost_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'kost_user'@'localhost' IDENTIFIED BY 'your_strong_password';
GRANT ALL PRIVILEGES ON kost_db.* TO 'kost_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

## 4. Configure Environment Variables

Buat file `.env` di root project:

```bash
nano .env
```

Isi dengan konfigurasi berikut:

```env
# Database Configuration (WAJIB)
DATABASE_URL="mysql://kost_user:your_strong_password@localhost:3306/kost_db"

# JWT Secret untuk session (WAJIB - generate random string panjang)
JWT_SECRET="your-very-long-random-secret-key-minimum-32-characters"

# Application Info (Optional)
VITE_APP_TITLE="Kost Management System"
VITE_APP_LOGO="https://your-domain.com/logo.png"

# Server Port (Optional, default 3000)
PORT=3000
NODE_ENV=production
```

**Generate JWT_SECRET yang aman:**
```bash
openssl rand -base64 32
```

## 5. Push Database Schema

```bash
pnpm db:push
```

Ini akan membuat semua tabel yang diperlukan di database.

## 6. Create First Admin User

Setelah database schema ter-push, buat user admin pertama secara manual:

```bash
mysql -u kost_user -p kost_db
```

```sql
INSERT INTO users (username, password, name, email, role, createdAt, updatedAt, lastSignedIn) 
VALUES (
  'admin',
  '$2b$10$YourHashedPasswordHere',  -- Ganti dengan hash bcrypt
  'Administrator',
  'admin@example.com',
  'admin',
  NOW(),
  NOW(),
  NOW()
);
```

**Untuk generate password hash:**
```bash
node -e "const bcrypt = require('bcrypt'); bcrypt.hash('your_password', 10, (err, hash) => console.log(hash));"
```

## 7. Build untuk Production

```bash
pnpm build
```

## 8. Start dengan PM2

```bash
# Start aplikasi
pm2 start npm --name "kost-management" -- start

# Save PM2 configuration
pm2 save

# Setup PM2 untuk auto-start saat VPS restart
pm2 startup
# Jalankan command yang muncul dari output di atas
```

## 9. Setup Nginx Reverse Proxy (Optional tapi Recommended)

Buat konfigurasi Nginx:

```bash
nano /etc/nginx/sites-available/kost-management
```

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable site dan restart Nginx:

```bash
ln -s /etc/nginx/sites-available/kost-management /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
```

## 10. Setup SSL dengan Let's Encrypt (Recommended)

```bash
apt install certbot python3-certbot-nginx
certbot --nginx -d your-domain.com
```

## Management Commands

```bash
# Lihat logs
pm2 logs kost-management

# Restart aplikasi
pm2 restart kost-management

# Stop aplikasi
pm2 stop kost-management

# Lihat status
pm2 status

# Monitor resource usage
pm2 monit
```

## Update Aplikasi

Untuk update ke versi terbaru:

```bash
cd /root/kost-management
git pull origin master
pnpm install
pnpm build
pm2 restart kost-management
```

## Troubleshooting

### Database Connection Error
- Pastikan MySQL service running: `systemctl status mysql`
- Cek DATABASE_URL di `.env` sudah benar
- Test koneksi: `mysql -u kost_user -p kost_db`

### Port Already in Use
- Ganti PORT di `.env` ke port lain (misal 3001)
- Atau kill process yang menggunakan port 3000:
  ```bash
  lsof -ti:3000 | xargs kill -9
  ```

### Permission Denied
- Pastikan user memiliki akses ke folder:
  ```bash
  chown -R $USER:$USER /root/kost-management
  ```

### PM2 Not Starting on Boot
- Jalankan ulang: `pm2 startup` dan ikuti instruksi
- Pastikan `pm2 save` sudah dijalankan

## Security Checklist

- ✅ Gunakan JWT_SECRET yang panjang dan random
- ✅ Setup firewall (UFW):
  ```bash
  ufw allow 22
  ufw allow 80
  ufw allow 443
  ufw enable
  ```
- ✅ Gunakan SSL/HTTPS (Let's Encrypt)
- ✅ Ganti default MySQL root password
- ✅ Backup database secara berkala
- ✅ Update sistem secara rutin: `apt update && apt upgrade`

## Backup Database

Setup cron job untuk backup otomatis:

```bash
crontab -e
```

Tambahkan (backup setiap hari jam 2 pagi):
```
0 2 * * * mysqldump -u kost_user -pyour_password kost_db > /root/backups/kost_db_$(date +\%Y\%m\%d).sql
```

## Support

Jika ada masalah, cek:
1. PM2 logs: `pm2 logs kost-management`
2. Nginx logs: `tail -f /var/log/nginx/error.log`
3. MySQL logs: `tail -f /var/log/mysql/error.log`

---

**Selamat! Aplikasi Kost Management System Anda sudah berjalan di VPS! 🎉**
