# 🚀 Complete Deployment Guide - E-Gura Store on DigitalOcean Ubuntu VPS

## 📋 Prerequisites
- DigitalOcean account
- Domain name (e.g., egura.rw)
- SSH key pair
- Basic terminal knowledge

---

## STEP 1: CREATE DIGITALOCEAN DROPLET

### 1.1 Create Droplet
```bash
# Login to DigitalOcean Dashboard
# Click "Create" → "Droplets"

# Select:
- Distribution: Ubuntu 22.04 LTS
- Plan: Basic ($12/month - 2GB RAM, 1 CPU, 50GB SSD)
- Datacenter: Choose closest to Rwanda (e.g., Amsterdam or Frankfurt)
- Authentication: SSH Key (recommended) or Password
- Hostname: egura-store
```

### 1.2 Get Droplet IP
```bash
# After creation, note your droplet IP address
# Example: 165.227.xxx.xxx
```

---

## STEP 2: INITIAL SERVER SETUP

### 2.1 Connect to Server
```bash
# From your local machine (Windows PowerShell or Git Bash)
ssh root@YOUR_DROPLET_IP

# If using SSH key:
ssh -i path/to/your/private_key root@YOUR_DROPLET_IP
```

### 2.2 Update System
```bash
# Update package list
apt update

# Upgrade all packages
apt upgrade -y

# Install essential tools
apt install -y curl wget git build-essential
```

### 2.3 Create Non-Root User
```bash
# Create new user
adduser egura

# Add to sudo group
usermod -aG sudo egura

# Switch to new user
su - egura
```

---

## STEP 3: INSTALL NODE.JS & NPM

### 3.1 Install Node.js 20.x (LTS)
```bash
# Add NodeSource repository
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -

# Install Node.js
sudo apt install -y nodejs

# Verify installation
node --version  # Should show v20.x.x
npm --version   # Should show 10.x.x
```

### 3.2 Install PM2 (Process Manager)
```bash
# Install PM2 globally
sudo npm install -g pm2

# Verify installation
pm2 --version
```

---

## STEP 4: INSTALL & CONFIGURE POSTGRESQL

### 4.1 Install PostgreSQL
```bash
# Install PostgreSQL 15
sudo apt install -y postgresql postgresql-contrib

# Start PostgreSQL service
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Verify installation
sudo systemctl status postgresql
```

### 4.2 Create Database & User
```bash
# Switch to postgres user
sudo -u postgres psql

# Inside PostgreSQL prompt:
CREATE DATABASE egura_store;
CREATE USER egura_user WITH ENCRYPTED PASSWORD 'your_secure_password_here';
GRANT ALL PRIVILEGES ON DATABASE egura_store TO egura_user;
ALTER DATABASE egura_store OWNER TO egura_user;

# Exit PostgreSQL
\q
```

### 4.3 Configure PostgreSQL for Remote Access (if needed)
```bash
# Edit postgresql.conf
sudo nano /etc/postgresql/15/main/postgresql.conf

# Find and change:
listen_addresses = 'localhost'  # Keep as localhost for security

# Edit pg_hba.conf
sudo nano /etc/postgresql/15/main/pg_hba.conf

# Add this line for local connections:
local   all   egura_user   md5

# Restart PostgreSQL
sudo systemctl restart postgresql
```

---

## STEP 5: INSTALL NGINX (WEB SERVER)

### 5.1 Install Nginx
```bash
# Install Nginx
sudo apt install -y nginx

# Start Nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# Check status
sudo systemctl status nginx

# Test: Visit http://YOUR_DROPLET_IP in browser
# You should see "Welcome to nginx" page
```

### 5.2 Configure Firewall
```bash
# Allow SSH, HTTP, and HTTPS
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status
```

---

## STEP 6: CLONE & SETUP PROJECT

### 6.1 Create Project Directory
```bash
# Create directory
sudo mkdir -p /var/www/egura
sudo chown -R egura:egura /var/www/egura

# Navigate to directory
cd /var/www/egura
```

### 6.2 Clone Repository (if using Git)
```bash
# If you have a Git repository:
git clone https://github.com/yourusername/egura-store.git .

# OR upload files manually using SCP/SFTP
```

### 6.3 Upload Files Manually (Alternative)
```bash
# From your local machine (Windows PowerShell):
# Navigate to your project directory
cd C:\Users\EGURA1\Documents\deby_project\var\www\deby\deby

# Upload backend
scp -r backend egura@YOUR_DROPLET_IP:/var/www/egura/

# Upload frontend
scp -r frontend egura@YOUR_DROPLET_IP:/var/www/egura/
```

---

## STEP 7: CONFIGURE BACKEND

### 7.1 Install Backend Dependencies
```bash
# Navigate to backend
cd /var/www/egura/backend

# Install dependencies
npm install

# Install production dependencies
npm install --production
```

### 7.2 Create Environment File
```bash
# Create .env file
nano .env

# Add the following (adjust values):
```

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=egura_store
DB_USER=egura_user
DB_PASSWORD=your_secure_password_here

# Server Configuration
PORT=5001
NODE_ENV=production

# JWT Secret (generate a random string)
JWT_SECRET=your_very_long_random_secret_key_here_min_32_chars

# Frontend URL
FRONTEND_URL=https://egura.rw
CORS_ORIGIN=https://egura.rw

# Admin Credentials
ADMIN_EMAIL=admin@egura.rw
ADMIN_PASSWORD=your_admin_password_here

# Session Secret
SESSION_SECRET=another_random_secret_key_here

# File Upload
MAX_FILE_SIZE=10485760

# Email Configuration (Optional - for order notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password

# Mobile Money API (Configure based on your provider)
MOMO_API_KEY=your_momo_api_key
MOMO_API_SECRET=your_momo_secret
```

```bash
# Save and exit (Ctrl+X, Y, Enter)

# Set proper permissions
chmod 600 .env
```

### 7.3 Initialize Database
```bash
# Run database migrations/setup
npm run setup  # or whatever your setup script is

# If you have a seed script:
npm run seed
```

---

## STEP 8: CONFIGURE FRONTEND

### 8.1 Install Frontend Dependencies
```bash
# Navigate to frontend
cd /var/www/egura/frontend

# Install dependencies
npm install
```

### 8.2 Create Environment File
```bash
# Create .env.production file
nano .env.production

# Add the following:
```

```env
VITE_API_URL=https://api.egura.rw
VITE_APP_URL=https://egura.rw
```

```bash
# Save and exit
```

### 8.3 Build Frontend
```bash
# Build for production
npm run build

# This creates a 'dist' folder with optimized files
```

---

## STEP 9: SETUP PM2 FOR BACKEND

### 9.1 Create PM2 Ecosystem File
```bash
# Navigate to project root
cd /var/www/egura

# Create ecosystem.config.js
nano ecosystem.config.js
```

```javascript
module.exports = {
  apps: [{
    name: 'egura-backend',
    cwd: '/var/www/egura/backend',
    script: 'index.js',
    instances: 2,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 5001
    },
    error_file: '/var/www/egura/logs/backend-error.log',
    out_file: '/var/www/egura/logs/backend-out.log',
    log_file: '/var/www/egura/logs/backend-combined.log',
    time: true,
    max_memory_restart: '500M',
    watch: false,
    autorestart: true
  }]
};
```

```bash
# Save and exit

# Create logs directory
mkdir -p /var/www/egura/logs
```

### 9.2 Start Backend with PM2
```bash
# Start application
pm2 start ecosystem.config.js

# Check status
pm2 status

# View logs
pm2 logs egura-backend

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
# Follow the command it gives you (run with sudo)
```

---

## STEP 10: CONFIGURE NGINX

### 10.1 Create Nginx Configuration
```bash
# Create site configuration
sudo nano /etc/nginx/sites-available/egura.rw
```

```nginx
# Frontend Server (Main Site)
server {
    listen 80;
    server_name egura.rw www.egura.rw;

    root /var/www/egura/frontend/dist;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/javascript application/json;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Main location
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Static assets caching
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # API proxy
    location /api {
        proxy_pass http://localhost:5001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }

    # Deny access to hidden files
    location ~ /\. {
        deny all;
    }
}

# API Server (Optional - separate subdomain)
server {
    listen 80;
    server_name api.egura.rw;

    location / {
        proxy_pass http://localhost:5001;
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

```bash
# Save and exit

# Enable site
sudo ln -s /etc/nginx/sites-available/egura.rw /etc/nginx/sites-enabled/

# Remove default site
sudo rm /etc/nginx/sites-enabled/default

# Test Nginx configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

---

## STEP 11: SETUP SSL WITH LET'S ENCRYPT

### 11.1 Install Certbot
```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx
```

### 11.2 Configure Domain DNS
```bash
# Before running certbot, configure your domain DNS:
# Go to your domain registrar (e.g., Namecheap, GoDaddy)
# Add A records:
# - egura.rw → YOUR_DROPLET_IP
# - www.egura.rw → YOUR_DROPLET_IP
# - api.egura.rw → YOUR_DROPLET_IP (if using separate API subdomain)

# Wait 5-10 minutes for DNS propagation
# Test DNS: ping egura.rw
```

### 11.3 Obtain SSL Certificate
```bash
# Get SSL certificate
sudo certbot --nginx -d egura.rw -d www.egura.rw -d api.egura.rw

# Follow prompts:
# - Enter email address
# - Agree to terms
# - Choose redirect HTTP to HTTPS (option 2)

# Test auto-renewal
sudo certbot renew --dry-run
```

---

## STEP 12: OPTIMIZE & SECURE

### 12.1 Setup Automatic Backups
```bash
# Create backup script
sudo nano /usr/local/bin/backup-egura.sh
```

```bash
#!/bin/bash
# Backup script for E-Gura Store

BACKUP_DIR="/var/backups/egura"
DATE=$(date +%Y%m%d_%H%M%S)

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup database
sudo -u postgres pg_dump egura_store > $BACKUP_DIR/db_backup_$DATE.sql

# Backup uploaded files (if any)
tar -czf $BACKUP_DIR/files_backup_$DATE.tar.gz /var/www/egura/backend/uploads

# Keep only last 7 days of backups
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete

echo "Backup completed: $DATE"
```

```bash
# Make executable
sudo chmod +x /usr/local/bin/backup-egura.sh

# Add to crontab (daily at 2 AM)
sudo crontab -e

# Add this line:
0 2 * * * /usr/local/bin/backup-egura.sh >> /var/log/egura-backup.log 2>&1
```

### 12.2 Setup Log Rotation
```bash
# Create logrotate config
sudo nano /etc/logrotate.d/egura
```

```
/var/www/egura/logs/*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 egura egura
    sharedscripts
    postrotate
        pm2 reloadLogs
    endscript
}
```

### 12.3 Install Fail2Ban (Security)
```bash
# Install Fail2Ban
sudo apt install -y fail2ban

# Start and enable
sudo systemctl start fail2ban
sudo systemctl enable fail2ban

# Check status
sudo fail2ban-client status
```

---

## STEP 13: MONITORING & MAINTENANCE

### 13.1 Install Monitoring Tools
```bash
# Install htop for system monitoring
sudo apt install -y htop

# Install netstat for network monitoring
sudo apt install -y net-tools
```

### 13.2 Useful PM2 Commands
```bash
# View application status
pm2 status

# View logs
pm2 logs egura-backend

# Restart application
pm2 restart egura-backend

# Stop application
pm2 stop egura-backend

# Monitor resources
pm2 monit

# View detailed info
pm2 info egura-backend
```

### 13.3 Useful Nginx Commands
```bash
# Test configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx

# Restart Nginx
sudo systemctl restart nginx

# View error logs
sudo tail -f /var/log/nginx/error.log

# View access logs
sudo tail -f /var/log/nginx/access.log
```

### 13.4 Database Management
```bash
# Connect to database
psql -U egura_user -d egura_store

# Backup database manually
pg_dump -U egura_user egura_store > backup.sql

# Restore database
psql -U egura_user egura_store < backup.sql

# View database size
psql -U egura_user -d egura_store -c "SELECT pg_size_pretty(pg_database_size('egura_store'));"
```

---

## STEP 14: DEPLOYMENT CHECKLIST

### ✅ Pre-Deployment
- [ ] Domain DNS configured
- [ ] SSL certificate obtained
- [ ] Database created and configured
- [ ] Environment variables set
- [ ] Frontend built successfully
- [ ] Backend dependencies installed

### ✅ Post-Deployment
- [ ] Website accessible via HTTPS
- [ ] API endpoints working
- [ ] Database connections successful
- [ ] PM2 running and auto-restart enabled
- [ ] Nginx serving files correctly
- [ ] SSL certificate auto-renewal configured
- [ ] Backups scheduled
- [ ] Monitoring tools installed
- [ ] Firewall configured
- [ ] Admin account created

---

## STEP 15: TROUBLESHOOTING

### Issue: Website Not Loading
```bash
# Check Nginx status
sudo systemctl status nginx

# Check Nginx logs
sudo tail -f /var/log/nginx/error.log

# Test Nginx configuration
sudo nginx -t
```

### Issue: API Not Responding
```bash
# Check PM2 status
pm2 status

# View backend logs
pm2 logs egura-backend

# Restart backend
pm2 restart egura-backend
```

### Issue: Database Connection Failed
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Test database connection
psql -U egura_user -d egura_store

# Check PostgreSQL logs
sudo tail -f /var/log/postgresql/postgresql-15-main.log
```

### Issue: SSL Certificate Issues
```bash
# Renew certificate manually
sudo certbot renew

# Check certificate status
sudo certbot certificates

# Test SSL configuration
curl -I https://egura.rw
```

---

## STEP 16: UPDATING THE APPLICATION

### Update Backend
```bash
# Navigate to backend
cd /var/www/egura/backend

# Pull latest changes (if using Git)
git pull origin main

# Install new dependencies
npm install

# Restart with PM2
pm2 restart egura-backend
```

### Update Frontend
```bash
# Navigate to frontend
cd /var/www/egura/frontend

# Pull latest changes
git pull origin main

# Install new dependencies
npm install

# Rebuild
npm run build

# Reload Nginx
sudo systemctl reload nginx
```

---

## 📊 PERFORMANCE OPTIMIZATION

### Enable HTTP/2
```bash
# Edit Nginx config
sudo nano /etc/nginx/sites-available/egura.rw

# Change:
listen 443 ssl http2;

# Reload Nginx
sudo systemctl reload nginx
```

### Setup Redis Cache (Optional)
```bash
# Install Redis
sudo apt install -y redis-server

# Start Redis
sudo systemctl start redis-server
sudo systemctl enable redis-server

# Test Redis
redis-cli ping  # Should return PONG
```

### Database Optimization
```bash
# Connect to PostgreSQL
sudo -u postgres psql egura_store

# Create indexes for better performance
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_price ON products(price);
CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
```

---

## 🔐 SECURITY BEST PRACTICES

1. **Keep System Updated**
```bash
sudo apt update && sudo apt upgrade -y
```

2. **Use Strong Passwords**
- Database passwords: 32+ characters
- Admin passwords: 16+ characters
- JWT secrets: 64+ characters

3. **Disable Root Login**
```bash
sudo nano /etc/ssh/sshd_config
# Set: PermitRootLogin no
sudo systemctl restart sshd
```

4. **Setup Firewall Rules**
```bash
sudo ufw status
# Only allow necessary ports: 22, 80, 443
```

5. **Regular Backups**
- Daily database backups
- Weekly full system backups
- Store backups off-site

---

## 📞 SUPPORT & RESOURCES

### Useful Links:
- DigitalOcean Docs: https://docs.digitalocean.com
- Nginx Docs: https://nginx.org/en/docs/
- PM2 Docs: https://pm2.keymetrics.io/docs/
- PostgreSQL Docs: https://www.postgresql.org/docs/
- Let's Encrypt: https://letsencrypt.org/docs/

### Quick Commands Reference:
```bash
# System
sudo systemctl status SERVICE_NAME
sudo systemctl restart SERVICE_NAME
htop

# Application
pm2 status
pm2 logs
pm2 restart all

# Nginx
sudo nginx -t
sudo systemctl reload nginx

# Database
psql -U egura_user -d egura_store
```

---

## ✅ DEPLOYMENT COMPLETE!

Your E-Gura Store is now live at:
- 🌐 **Website:** https://egura.rw
- 🔧 **API:** https://api.egura.rw (or https://egura.rw/api)
- 🔒 **SSL:** Enabled with auto-renewal
- 📊 **Monitoring:** PM2 + Nginx logs
- 💾 **Backups:** Automated daily

**Next Steps:**
1. Test all functionality
2. Add products to database
3. Configure payment gateways
4. Setup Google Analytics
5. Submit sitemap to Google Search Console

**Congratulations! Your e-commerce platform is now live! 🎉**
