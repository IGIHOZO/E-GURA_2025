# 🚀 E-Gura Store - DigitalOcean Ubuntu VPS Deployment Guide

## 📋 Pre-Deployment Checklist

### 1. DigitalOcean Droplet Setup
- [ ] Create Ubuntu 22.04 LTS Droplet (minimum: 2GB RAM, 2 vCPUs, 50GB SSD)
- [ ] Add SSH key for secure access
- [ ] Point domain `egura.rw` to droplet IP address
  - A record: `egura.rw` → Your Droplet IP
  - A record: `www.egura.rw` → Your Droplet IP

### 2. Required Accounts
- [ ] DigitalOcean account (Droplet)
- [ ] Domain registered (egura.rw)
- [ ] Cloudinary account (for image storage)
- [ ] Payment gateway credentials (InTouch Pay)

---

## 🎯 Step-by-Step Deployment

### Step 1: Connect to Your VPS

```bash
ssh root@YOUR_DROPLET_IP
```

### Step 2: Create Non-Root User (Security)

```bash
adduser egura
usermod -aG sudo egura
su - egura
```

### Step 3: Upload Your Project

Option A: Using Git (Recommended)
```bash
cd /var/www
git clone YOUR_REPOSITORY_URL egura
```

Option B: Using SCP
```bash
# From your local machine
scp -r C:\Users\EGURA1\Documents\deby_project\var\www\deby\deby egura@YOUR_IP:/var/www/egura
```

### Step 4: Run Deployment Script

```bash
cd /var/www/egura
chmod +x deploy-digitalocean.sh
./deploy-digitalocean.sh
```

### Step 5: Configure Environment Variables

```bash
cd /var/www/egura/backend
nano .env
```

Update these critical values:
```env
POSTGRES_PASSWORD=YOUR_STRONG_PASSWORD_HERE
JWT_SECRET=GENERATE_RANDOM_STRING_MIN_32_CHARS
CLOUDINARY_CLOUD_NAME=your_actual_cloudinary_name
CLOUDINARY_API_KEY=your_actual_api_key
CLOUDINARY_API_SECRET=your_actual_api_secret
BASE_URL=https://egura.rw
```

### Step 6: Setup Database

```bash
# Connect to PostgreSQL
sudo -u postgres psql

# Create database and user
CREATE DATABASE egura_store;
CREATE USER egura_admin WITH PASSWORD 'YOUR_STRONG_PASSWORD';
GRANT ALL PRIVILEGES ON DATABASE egura_store TO egura_admin;
\q
```

### Step 7: Install Backend Dependencies

```bash
cd /var/www/egura/backend
npm install --production
```

### Step 8: Build Frontend

```bash
cd /var/www/egura/frontend
npm install
npm run build
```

### Step 9: Start Backend with PM2

```bash
cd /var/www/egura
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### Step 10: Configure Nginx

The deployment script already created the Nginx config. Just verify:

```bash
sudo nginx -t
sudo systemctl restart nginx
```

### Step 11: Setup SSL Certificate (FREE with Let's Encrypt)

```bash
sudo certbot --nginx -d egura.rw -d www.egura.rw
```

Follow the prompts to:
- Enter your email
- Agree to terms
- Choose to redirect HTTP to HTTPS

### Step 12: Verify Deployment

```bash
# Check backend status
pm2 status

# View backend logs
pm2 logs egura-backend

# Check Nginx
sudo systemctl status nginx

# Test your site
curl https://egura.rw
```

---

## 🔧 Post-Deployment Configuration

### Enable Automatic SSL Renewal

```bash
sudo certbot renew --dry-run
```

### Setup Automatic Backups (Database)

Create backup script:
```bash
sudo nano /usr/local/bin/backup-egura-db.sh
```

Add:
```bash
#!/bin/bash
BACKUP_DIR="/var/backups/egura"
mkdir -p $BACKUP_DIR
pg_dump egura_store | gzip > $BACKUP_DIR/egura_$(date +%Y%m%d_%H%M%S).sql.gz
# Keep only last 7 days
find $BACKUP_DIR -name "egura_*.sql.gz" -mtime +7 -delete
```

Make executable and add to cron:
```bash
sudo chmod +x /usr/local/bin/backup-egura-db.sh
sudo crontab -e
```

Add this line (backup daily at 2 AM):
```
0 2 * * * /usr/local/bin/backup-egura-db.sh
```

### Monitor System Resources

```bash
pm2 monit  # Real-time monitoring
```

---

## 📊 Useful PM2 Commands

```bash
pm2 status                    # Check status
pm2 logs egura-backend        # View logs
pm2 restart egura-backend     # Restart app
pm2 stop egura-backend        # Stop app
pm2 delete egura-backend      # Remove from PM2
pm2 monit                     # Live monitoring
pm2 save                      # Save current processes
```

---

## 🌐 Nginx Commands

```bash
sudo nginx -t                     # Test configuration
sudo systemctl start nginx        # Start Nginx
sudo systemctl stop nginx         # Stop Nginx
sudo systemctl restart nginx      # Restart Nginx
sudo systemctl reload nginx       # Reload config
sudo systemctl status nginx       # Check status
```

---

## 🗄️ Database Management

### Connect to Database
```bash
psql -U egura_admin -d egura_store
```

### Backup Database
```bash
pg_dump egura_store > backup_$(date +%Y%m%d).sql
```

### Restore Database
```bash
psql -U egura_admin egura_store < backup_20251114.sql
```

---

## 🔒 Security Checklist

- [x] UFW firewall enabled
- [x] SSL certificate installed
- [x] Non-root user created
- [ ] SSH password authentication disabled (use keys only)
- [ ] Fail2ban installed (prevents brute force)
- [ ] Regular security updates enabled

### Install Fail2ban (Recommended)

```bash
sudo apt install fail2ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

---

## 🚨 Troubleshooting

### Backend Not Starting

```bash
# Check logs
pm2 logs egura-backend --lines 100

# Check if port 5000 is in use
sudo lsof -i :5000

# Restart backend
pm2 restart egura-backend
```

### Nginx 502 Bad Gateway

```bash
# Check backend is running
pm2 status

# Check Nginx error logs
sudo tail -f /var/log/nginx/error.log

# Restart Nginx
sudo systemctl restart nginx
```

### Database Connection Issues

```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Check database exists
sudo -u postgres psql -l

# Verify credentials in .env file
cat /var/www/egura/backend/.env
```

### SSL Certificate Issues

```bash
# Renew certificates manually
sudo certbot renew

# Check certificate expiry
sudo certbot certificates
```

---

## 📈 Performance Optimization

### Enable Redis (Optional - for caching)

```bash
sudo apt install redis-server
sudo systemctl enable redis-server
sudo systemctl start redis-server
```

### Enable Cloudflare CDN (Recommended)

1. Sign up at cloudflare.com
2. Add your domain
3. Update nameservers at your registrar
4. Enable "Always Use HTTPS"
5. Enable "Auto Minify" for JS, CSS, HTML
6. Set caching level to "Standard"

---

## 💰 Estimated Monthly Costs

| Service | Cost | Notes |
|---------|------|-------|
| DigitalOcean Droplet (2GB) | $12/mo | Can start with $6/mo |
| PostgreSQL | $0 | Self-hosted |
| Cloudinary | $0 | Free tier (25GB) |
| SSL Certificate | $0 | Let's Encrypt |
| **Total** | **$12/mo** | Very affordable! |

---

## 🔄 Updating Your Application

### Update Backend Code

```bash
cd /var/www/egura
git pull origin main
cd backend
npm install --production
pm2 restart egura-backend
```

### Update Frontend Code

```bash
cd /var/www/egura/frontend
git pull origin main
npm install
npm run build
sudo systemctl reload nginx
```

---

## 📞 Support & Resources

- DigitalOcean Docs: https://docs.digitalocean.com
- PM2 Documentation: https://pm2.keymetrics.io
- Nginx Documentation: https://nginx.org/en/docs
- Let's Encrypt: https://letsencrypt.org
- PostgreSQL Docs: https://www.postgresql.org/docs

---

## ✅ Final Checklist

After deployment, verify:
- [ ] Website loads at https://egura.rw
- [ ] API endpoints work (check /api/health)
- [ ] Images upload correctly
- [ ] Payment gateway tested
- [ ] Admin panel accessible
- [ ] Mobile responsive
- [ ] SSL certificate active
- [ ] PM2 auto-restart working
- [ ] Database backups scheduled
- [ ] Monitoring in place

**Congratulations! Your E-Gura Store is now live! 🎉**
