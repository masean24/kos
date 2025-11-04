# Panduan Deploy ke VPS

Dokumen ini menjelaskan langkah lengkap untuk deploy aplikasi Kost Management System ke VPS Anda sendiri.

## 📋 Prasyarat

- VPS dengan Ubuntu 20.04 / 22.04 (minimal 1GB RAM)
- Domain atau subdomain (opsional, bisa pakai IP)
- Akses SSH ke VPS
- MySQL/MariaDB database

## 🗄️ Database

Aplikasi ini menggunakan **MySQL** atau **MariaDB**. Anda bisa pilih salah satu:

### Opsi 1: Install MySQL di VPS yang sama

```bash
# Install MySQL
sudo apt update
sudo apt install mysql-server -y

# Secure installation
sudo mysql_secure_installation

# Login ke MySQL
sudo mysql

# Buat database dan user
CREATE DATABASE kost_management;
CREATE USER 'kostuser'@'localhost' IDENTIFIED BY 'password_aman_anda';
GRANT ALL PRIVILEGES ON kost_management.* TO 'kostuser'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### Opsi 2: Gunakan Database External (Recommended)

Gunakan managed database seperti:
- **PlanetScale** (Free tier available)
- **Railway** (Free tier available)
- **DigitalOcean Managed Database**
- **AWS RDS**

Keuntungan: Backup otomatis, scaling mudah, maintenance minimal.

## 🚀 Langkah Deploy

### 1. Install Dependencies di VPS

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 22.x
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs

# Install pnpm
npm install -g pnpm

# Install PM2 untuk process management
npm install -g pm2

# Install Nginx
sudo apt install nginx -y
```

### 2. Clone & Setup Project

```bash
# Clone project (atau upload via SFTP/SCP)
cd /var/www
sudo mkdir kost-management
sudo chown $USER:$USER kost-management
cd kost-management

# Upload semua file project ke folder ini
# Atau gunakan git jika sudah di repository

# Install dependencies
pnpm install
```

### 3. Setup Environment Variables

```bash
# Buat file .env
nano .env
```

Isi dengan:

```env
# Database
DATABASE_URL="mysql://kostuser:password_aman_anda@localhost:3306/kost_management"

# JWT Secret (generate random string)
JWT_SECRET="your_random_jwt_secret_here_min_32_chars"

# OAuth (jika pakai Manus OAuth, atau ganti dengan OAuth provider lain)
OAUTH_SERVER_URL="https://api.manus.im"
VITE_OAUTH_PORTAL_URL="https://portal.manus.im"

# App Info
VITE_APP_TITLE="Kost Management System"
VITE_APP_ID="your_app_id"
OWNER_OPEN_ID="your_admin_openid"
OWNER_NAME="Admin Name"

# Xendit (opsional)
XENDIT_API_KEY="xnd_development_xxx"
XENDIT_WEBHOOK_TOKEN="your_webhook_token"

# WhatsApp Bot (opsional)
ENABLE_WHATSAPP_BOT=true

# Production
NODE_ENV=production
PORT=3000
```

**Catatan penting:**
- `DATABASE_URL`: Sesuaikan dengan kredensial database Anda
- `JWT_SECRET`: Generate random string minimal 32 karakter
- `OWNER_OPEN_ID`: OpenID dari akun yang akan jadi admin default

### 4. Setup Database Schema

```bash
# Push schema ke database
pnpm db:push
```

### 5. Build Project

```bash
# Build frontend dan backend
pnpm build
```

### 6. Setup PM2

```bash
# Start aplikasi dengan PM2
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 startup script
pm2 startup
# Jalankan command yang muncul (biasanya sudo ...)
```

Buat file `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [{
    name: 'kost-management',
    script: 'tsx',
    args: 'server/_core/index.ts',
    cwd: '/var/www/kost-management',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
};
```

### 7. Setup Nginx Reverse Proxy

```bash
# Buat nginx config
sudo nano /etc/nginx/sites-available/kost-management
```

Isi dengan:

```nginx
server {
    listen 80;
    server_name your_domain.com;  # Ganti dengan domain Anda atau IP

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

Enable site:

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/kost-management /etc/nginx/sites-enabled/

# Test nginx config
sudo nginx -t

# Restart nginx
sudo systemctl restart nginx
```

### 8. Setup SSL dengan Let's Encrypt (Opsional tapi Recommended)

```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx -y

# Get SSL certificate
sudo certbot --nginx -d your_domain.com

# Auto renewal
sudo certbot renew --dry-run
```

### 9. Setup Firewall

```bash
# Allow SSH, HTTP, HTTPS
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

## 🤖 Setup WhatsApp Bot (Opsional)

Jika ingin aktifkan WhatsApp bot:

1. Set `ENABLE_WHATSAPP_BOT=true` di `.env`
2. Restart aplikasi: `pm2 restart kost-management`
3. Lihat logs untuk QR code: `pm2 logs kost-management`
4. Scan QR code dengan WhatsApp
5. Bot akan terkoneksi dan siap kirim pesan

**Catatan:** Folder `wa-auth` akan menyimpan session WhatsApp. Jangan hapus folder ini atau Anda harus scan QR lagi.

## 📱 Setup Admin Default

Untuk set akun admin tanpa perlu registrasi:

1. Login ke aplikasi menggunakan OAuth provider
2. Cek `openId` Anda di database:
   ```sql
   SELECT id, openId, name, email, role FROM users;
   ```
3. Copy `openId` Anda
4. Set di `.env`:
   ```env
   OWNER_OPEN_ID="openid_anda_disini"
   ```
5. Restart aplikasi: `pm2 restart kost-management`
6. Login lagi, role Anda otomatis jadi `admin`

## ⏰ Setup Automatic Monthly Invoice Generation

Sistem sudah include script untuk generate invoice otomatis setiap bulan.

```bash
# Test script manual
cd /var/www/kost-management
node --import tsx server/cron-invoice.ts

# Setup cron job
crontab -e

# Tambahkan baris ini (generate invoice setiap tanggal 1 jam 00:00)
0 0 1 * * cd /var/www/kost-management && node --import tsx server/cron-invoice.ts >> /var/log/kost-cron.log 2>&1
```

Cron job akan:
- Jalan otomatis setiap tanggal 1 jam 00:00
- Generate invoice untuk semua penghuni aktif
- Set jatuh tempo tanggal 10
- Log output ke `/var/log/kost-cron.log`

**Cek log cron:**
```bash
tail -f /var/log/kost-cron.log
```

## 🔧 Maintenance Commands

```bash
# Lihat status aplikasi
pm2 status

# Lihat logs
pm2 logs kost-management

# Restart aplikasi
pm2 restart kost-management

# Stop aplikasi
pm2 stop kost-management

# Update aplikasi (setelah upload file baru)
cd /var/www/kost-management
pnpm install
pnpm build
pm2 restart kost-management
```

## 📊 Monitoring

```bash
# Install PM2 monitoring
pm2 install pm2-logrotate

# Setup log rotation
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

## 🔐 Security Checklist

- [ ] Ganti default passwords
- [ ] Setup SSL/HTTPS
- [ ] Enable firewall (ufw)
- [ ] Disable root SSH login
- [ ] Setup automatic security updates
- [ ] Backup database secara berkala
- [ ] Jangan expose database port ke public

## 🐛 Troubleshooting

### Aplikasi tidak bisa connect ke database

```bash
# Cek apakah MySQL running
sudo systemctl status mysql

# Test connection
mysql -u kostuser -p -h localhost kost_management
```

### Port 3000 sudah dipakai

```bash
# Cek process yang pakai port 3000
sudo lsof -i :3000

# Kill process
sudo kill -9 <PID>
```

### Nginx error 502 Bad Gateway

```bash
# Cek apakah aplikasi running
pm2 status

# Cek logs
pm2 logs kost-management

# Restart aplikasi
pm2 restart kost-management
```

### WhatsApp bot tidak connect

```bash
# Cek logs untuk QR code
pm2 logs kost-management

# Hapus session lama dan scan ulang
rm -rf wa-auth
pm2 restart kost-management
```

## 📦 Backup & Restore

### Backup Database

```bash
# Backup
mysqldump -u kostuser -p kost_management > backup_$(date +%Y%m%d).sql

# Restore
mysql -u kostuser -p kost_management < backup_20250104.sql
```

### Backup WhatsApp Session

```bash
# Backup folder wa-auth
tar -czf wa-auth-backup.tar.gz wa-auth/

# Restore
tar -xzf wa-auth-backup.tar.gz
```

## 🌐 Alternative: Deploy ke Platform Lain

Jika tidak ingin setup VPS manual, bisa deploy ke:

1. **Railway** - Deploy dengan 1 klik, free tier available
2. **Render** - Free tier untuk web service
3. **Fly.io** - Free tier dengan global CDN
4. **DigitalOcean App Platform** - Managed deployment

Semua platform di atas support Node.js dan MySQL.

---

**Selamat! Aplikasi Anda sudah running di VPS 🎉**

Akses di: `http://your_domain.com` atau `http://your_vps_ip`
