# 🚀 SEWITHDEBBY Deployment Guide - egura.rw

## Server Information
- **IP:** 167.172.121.245
- **Domain:** egura.rw
- **User:** igihozo
- **OS:** Ubuntu/Debian Linux
- **Files:** deby.zip, deby_ecommerce.sql

---

## 📋 Pre-Deployment Checklist

- [ ] Server SSH access verified
- [ ] Domain DNS pointed to server IP
- [ ] Files uploaded (deby.zip, deby_ecommerce.sql)
- [ ] Root/sudo access available

---

## 🔧 Step 1: Connect and Verify Server

```bash
# Connect to server
ssh igihozo@167.172.121.245

# Verify files
ls -lh
# Should show: deby.zip and deby_ecommerce.sql

# Update system
sudo apt update && sudo apt upgrade -y
```

---

## 📦 Step 2: Install System Requirements

### 2.1 Install Node.js 18.x LTS
```bash
# Install Node.js repository
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -

# Install Node.js and npm
sudo apt install -y nodejs

# Verify installation
node -v  # Should be v18.x.x
npm -v   # Should be 9.x.x or higher
```

### 2.2 Install PostgreSQL 14+
```bash
# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Verify installation
sudo systemctl status postgresql

# Check version
psql --version  # Should be 12+ (14+ recommended)
```

### 2.3 Install Nginx
```bash
# Install Nginx
sudo apt install -y nginx

# Start and enable Nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# Verify
sudo systemctl status nginx
```

### 2.4 Install PM2 (Process Manager)
```bash
# Install PM2 globally
sudo npm install -g pm2

# Verify
pm2 --version
```

### 2.5 Install Certbot (SSL)
```bash
# Install Certbot for Let's Encrypt SSL
sudo apt install -y certbot python3-certbot-nginx
```

### 2.6 Install Unzip
```bash
sudo apt install -y unzip
```

---

## 📂 Step 3: Extract and Setup Project

```bash
# Create project directory
sudo mkdir -p /var/www/egura
sudo chown -R igihozo:igihozo /var/www/egura

# Extract files
cd /var/www/egura
unzip ~/deby.zip

# Verify structure
ls -la
# Should show: backend/, frontend/, etc.

# Copy database file
cp ~/deby_ecommerce.sql /var/www/egura/
```

---

## 🗄️ Step 4: Setup PostgreSQL Database

### 4.1 Create Database and User
```bash
# Switch to postgres user
sudo -u postgres psql

# In PostgreSQL prompt:
CREATE DATABASE deby_ecommerce;
CREATE USER deby_user WITH ENCRYPTED PASSWORD 'YourSecurePassword123!';
GRANT ALL PRIVILEGES ON DATABASE deby_ecommerce TO deby_user;
ALTER DATABASE deby_ecommerce OWNER TO deby_user;

# Exit
\q
```

### 4.2 Import Database
```bash
# Import the SQL file
sudo -u postgres psql -d deby_ecommerce -f /var/www/egura/deby_ecommerce.sql

# Verify import
sudo -u postgres psql -d deby_ecommerce -c "\dt"
# Should list all tables
```

### 4.3 Configure PostgreSQL for Remote Access
```bash
# Edit PostgreSQL config
sudo nano /etc/postgresql/14/main/postgresql.conf

# Find and update:
listen_addresses = 'localhost'  # Keep as localhost for security

# Edit pg_hba.conf
sudo nano /etc/postgresql/14/main/pg_hba.conf

# Add line (for local connections):
local   deby_ecommerce  deby_user                   md5

# Restart PostgreSQL
sudo systemctl restart postgresql
```

---

## ⚙️ Step 5: Configure Environment Variables

### 5.1 Backend Environment
```bash
cd /var/www/egura/backend

# Create .env file
nano .env
```

**Backend .env content:**
```bash
# Server Configuration
PORT=5000
NODE_ENV=production

# PostgreSQL Database
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=deby_ecommerce
POSTGRES_USER=deby_user
POSTGRES_PASSWORD=YourSecurePassword123!

# JWT Secret (CHANGE THIS!)
JWT_SECRET=your-super-secret-jwt-key-CHANGE-THIS-TO-RANDOM-STRING

# Cloudinary (Media uploads)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# SMS Gateway (INTOUCH)
INTOUCH_USERNAME=your_username
INTOUCH_PASSWORD=your_password
INTOUCH_SENDER=EGURA
INTOUCH_API_URL=https://www.intouchsms.co.rw/api/sendsms/.json

# MTN Mobile Money
MTN_API_URL=https://momodeveloper.mtn.com
MTN_SUBSCRIPTION_KEY=your_subscription_key
MTN_API_USER=your_api_user
MTN_API_KEY=your_api_key
MTN_CALLBACK_URL=https://egura.rw/api/payments/mtn/callback
MTN_ENVIRONMENT=production

# AI Configuration (Optional)
LLM_PROVIDER=groq
LLM_API_KEY=your_groq_api_key
LLM_MODEL=llama-3.1-70b-versatile
LLM_MAX_TOKENS=800
LLM_TEMPERATURE=0.8

# Database Type
DATABASE_TYPE=postgres
```

### 5.2 Frontend Environment
```bash
cd /var/www/egura/frontend

# Create .env file
nano .env
```

**Frontend .env content:**
```bash
VITE_API_URL=https://egura.rw/api
VITE_APP_NAME=E-Gura
```

---

## 📦 Step 6: Install Dependencies and Build

### 6.1 Backend Setup
```bash
cd /var/www/egura/backend

# Install dependencies
npm install --production

# Test database connection
node -e "require('./config/database').testConnection()"
# Should show: ✅ PostgreSQL connection established
```

### 6.2 Frontend Build
```bash
cd /var/www/egura/frontend

# Install dependencies
npm install

# Build for production
npm run build

# Verify build
ls -la dist/
# Should show built files
```

---

## 🌐 Step 7: Configure Nginx

### 7.1 Create Nginx Configuration
```bash
sudo nano /etc/nginx/sites-available/egura.rw
```

**Nginx Configuration:**
```nginx
# Backend API Server
upstream backend {
    server 127.0.0.1:5000;
    keepalive 64;
}

# Main server block
server {
    listen 80;
    listen [::]:80;
    server_name egura.rw www.egura.rw;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Client body size (for file uploads)
    client_max_body_size 50M;

    # Logs
    access_log /var/log/nginx/egura_access.log;
    error_log /var/log/nginx/egura_error.log;

    # Frontend - Serve static files
    location / {
        root /var/www/egura/frontend/dist;
        try_files $uri $uri/ /index.html;
        
        # Cache static assets
        location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # Backend API
    location /api {
        proxy_pass http://backend;
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

    # Health check endpoint
    location /health {
        proxy_pass http://backend/api/health;
        access_log off;
    }
}
```

### 7.2 Enable Site
```bash
# Create symbolic link
sudo ln -s /etc/nginx/sites-available/egura.rw /etc/nginx/sites-enabled/

# Remove default site (optional)
sudo rm /etc/nginx/sites-enabled/default

# Test Nginx configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

---

## 🔒 Step 8: Setup SSL with Let's Encrypt

```bash
# Obtain SSL certificate
sudo certbot --nginx -d egura.rw -d www.egura.rw

# Follow prompts:
# - Enter email address
# - Agree to terms
# - Choose to redirect HTTP to HTTPS (recommended: Yes)

# Verify auto-renewal
sudo certbot renew --dry-run

# Certificate will auto-renew every 90 days
```

---

## 🔄 Step 9: Setup PM2 Process Manager

### 9.1 Create PM2 Ecosystem File
```bash
cd /var/www/egura

# Create ecosystem file
nano ecosystem.config.js
```

**ecosystem.config.js:**
```javascript
module.exports = {
  apps: [
    {
      name: 'egura-backend',
      script: './backend/index.js',
      cwd: '/var/www/egura/backend',
      instances: 2,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 5000
      },
      error_file: '/var/www/egura/logs/backend-error.log',
      out_file: '/var/www/egura/logs/backend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      max_memory_restart: '500M',
      watch: false
    }
  ]
};
```

### 9.2 Create Logs Directory
```bash
mkdir -p /var/www/egura/logs
```

### 9.3 Start Application with PM2
```bash
cd /var/www/egura

# Start application
pm2 start ecosystem.config.js

# Check status
pm2 status

# View logs
pm2 logs egura-backend --lines 50

# Save PM2 configuration
pm2 save

# Setup PM2 to start on system boot
pm2 startup systemd -u igihozo --hp /home/igihozo
# Copy and run the command it outputs
```

---

## 🧪 Step 10: Testing and Verification

### 10.1 Test Backend API
```bash
# Health check
curl http://localhost:5000/api/health

# Should return:
# {"status":"ok","database":"connected","dbType":"PostgreSQL"}

# Test from domain
curl https://egura.rw/api/health
```

### 10.2 Test Frontend
```bash
# Visit in browser:
https://egura.rw

# Should load the homepage
```

### 10.3 Check Logs
```bash
# PM2 logs
pm2 logs egura-backend

# Nginx logs
sudo tail -f /var/log/nginx/egura_access.log
sudo tail -f /var/log/nginx/egura_error.log

# PostgreSQL logs
sudo tail -f /var/log/postgresql/postgresql-14-main.log
```

---

## 🛠️ Useful Commands

### PM2 Management
```bash
# View status
pm2 status

# Restart app
pm2 restart egura-backend

# Stop app
pm2 stop egura-backend

# View logs
pm2 logs egura-backend

# Monitor
pm2 monit

# Reload (zero-downtime)
pm2 reload egura-backend
```

### Nginx Management
```bash
# Test config
sudo nginx -t

# Reload
sudo systemctl reload nginx

# Restart
sudo systemctl restart nginx

# View logs
sudo tail -f /var/log/nginx/egura_error.log
```

### PostgreSQL Management
```bash
# Connect to database
psql -U deby_user -d deby_ecommerce

# Backup database
pg_dump -U deby_user deby_ecommerce > backup_$(date +%Y%m%d).sql

# View connections
sudo -u postgres psql -c "SELECT * FROM pg_stat_activity;"
```

---

## 🔥 Firewall Configuration

```bash
# Install UFW (if not installed)
sudo apt install -y ufw

# Allow SSH
sudo ufw allow 22/tcp

# Allow HTTP and HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status
```

---

## 📊 Performance Optimization

### Enable Gzip in Nginx
```bash
sudo nano /etc/nginx/nginx.conf

# Add in http block:
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json;
gzip_disable "MSIE [1-6]\.";

# Reload
sudo systemctl reload nginx
```

### PostgreSQL Tuning
```bash
sudo nano /etc/postgresql/14/main/postgresql.conf

# Adjust based on server RAM (example for 2GB RAM):
shared_buffers = 512MB
effective_cache_size = 1536MB
maintenance_work_mem = 128MB
work_mem = 8MB
max_connections = 100

# Restart
sudo systemctl restart postgresql
```

---

## 🚨 Troubleshooting

### Backend not starting?
```bash
# Check logs
pm2 logs egura-backend --lines 100

# Test manually
cd /var/www/egura/backend
NODE_ENV=production node index.js
```

### Database connection issues?
```bash
# Test connection
psql -U deby_user -d deby_ecommerce -h localhost

# Check PostgreSQL status
sudo systemctl status postgresql

# Check credentials in .env file
```

### SSL certificate issues?
```bash
# Renew manually
sudo certbot renew

# Check certificate
sudo certbot certificates
```

### Nginx 502 Bad Gateway?
```bash
# Check if backend is running
pm2 status

# Check Nginx error log
sudo tail -f /var/log/nginx/egura_error.log

# Test backend directly
curl http://localhost:5000/api/health
```

---

## 📝 Post-Deployment Tasks

- [ ] Test all major features (products, cart, checkout, admin)
- [ ] Set up database backup cron job
- [ ] Configure monitoring (optional: install Netdata)
- [ ] Set up log rotation
- [ ] Configure email notifications
- [ ] Test payment integration (MTN Mobile Money)
- [ ] Test SMS notifications
- [ ] Update DNS records if needed (A, CNAME, MX)

---

## 🔄 Database Backup Script

```bash
# Create backup script
nano /var/www/egura/backup.sh
```

**backup.sh:**
```bash
#!/bin/bash
BACKUP_DIR="/var/www/egura/backups"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

# Backup database
pg_dump -U deby_user deby_ecommerce > $BACKUP_DIR/db_backup_$DATE.sql

# Keep only last 7 days
find $BACKUP_DIR -name "db_backup_*.sql" -mtime +7 -delete

echo "Backup completed: db_backup_$DATE.sql"
```

```bash
# Make executable
chmod +x /var/www/egura/backup.sh

# Add to crontab (daily at 2 AM)
crontab -e

# Add line:
0 2 * * * /var/www/egura/backup.sh >> /var/www/egura/logs/backup.log 2>&1
```

---

## ✅ Deployment Checklist

### Pre-Deployment
- [x] Server access verified
- [x] Files uploaded
- [x] Domain DNS configured

### Server Setup
- [ ] Node.js installed
- [ ] PostgreSQL installed
- [ ] Nginx installed
- [ ] PM2 installed
- [ ] Certbot installed

### Application Setup
- [ ] Files extracted
- [ ] Database created and imported
- [ ] Environment variables configured
- [ ] Dependencies installed
- [ ] Frontend built

### Web Server
- [ ] Nginx configured
- [ ] SSL certificate obtained
- [ ] Firewall configured

### Process Management
- [ ] PM2 configured
- [ ] Application started
- [ ] PM2 startup enabled

### Testing
- [ ] Backend health check passes
- [ ] Frontend loads correctly
- [ ] SSL working (HTTPS)
- [ ] API endpoints responding

### Monitoring
- [ ] Logs accessible
- [ ] Backup script created
- [ ] Monitoring setup (optional)

---

**Deployment Time Estimate:** 45-60 minutes  
**Status:** Ready to deploy  
**Last Updated:** {{ current_date }}
