# E-Gura Ubuntu Server Deployment Guide

## Prerequisites
- Ubuntu 22.04 LTS Server
- Domain name pointed to server IP
- SSH access to server

## Step 1: Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Install Nginx
sudo apt install -y nginx

# Install PM2 (Process Manager)
sudo npm install -g pm2

# Install Certbot (SSL)
sudo apt install -y certbot python3-certbot-nginx
```

## Step 2: Database Setup

```bash
# Switch to postgres user
sudo -u postgres psql

# Create database and user
CREATE DATABASE egura_store;
CREATE USER egura_admin WITH ENCRYPTED PASSWORD 'YOUR_STRONG_PASSWORD';
GRANT ALL PRIVILEGES ON DATABASE egura_store TO egura_admin;
ALTER USER egura_admin WITH SUPERUSER;
\q
```

## Step 3: Upload Project

```bash
# Create app directory
sudo mkdir -p /var/www/egura
sudo chown -R $USER:$USER /var/www/egura

# Upload files (from local machine)
# Option 1: SCP
scp -r ./deby/* user@your-server:/var/www/egura/

# Option 2: Git
cd /var/www/egura
git clone your-repo-url .
```

## Step 4: Backend Setup

```bash
cd /var/www/egura/backend

# Install dependencies
npm install --production

# Create .env file
cp .env.production .env

# Edit .env with your actual values
nano .env
# Update: POSTGRES_PASSWORD, JWT_SECRET, CLOUDINARY credentials, etc.

# Run migrations
npm run migrate

# Start with PM2
pm2 start index.js --name egura-backend
pm2 save
pm2 startup
```

## Step 5: Frontend Build

```bash
cd /var/www/egura/frontend

# Install dependencies
npm install

# Create production .env
echo "VITE_API_URL=https://api.egura.rw" > .env.production

# Build for production
npm run build

# Move build to nginx directory
sudo mkdir -p /var/www/html/egura
sudo cp -r dist/* /var/www/html/egura/
```

## Step 6: Nginx Configuration

```bash
sudo nano /etc/nginx/sites-available/egura
```

Add this configuration:

```nginx
# Frontend
server {
    listen 80;
    server_name egura.rw www.egura.rw;
    root /var/www/html/egura;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}

# Backend API
server {
    listen 80;
    server_name api.egura.rw;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        client_max_body_size 50M;
    }
}
```

Enable site:

```bash
sudo ln -s /etc/nginx/sites-available/egura /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## Step 7: SSL Certificate

```bash
sudo certbot --nginx -d egura.rw -d www.egura.rw -d api.egura.rw
```

## Step 8: Firewall Setup

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

## Step 9: Final Checks

```bash
# Check backend status
pm2 status
pm2 logs egura-backend

# Test API
curl https://api.egura.rw/api/health

# Check nginx
sudo systemctl status nginx
```

## Maintenance Commands

```bash
# Restart backend
pm2 restart egura-backend

# View logs
pm2 logs egura-backend --lines 100

# Update application
cd /var/www/egura
git pull
cd backend && npm install
pm2 restart egura-backend
cd ../frontend && npm install && npm run build
sudo cp -r dist/* /var/www/html/egura/

# Database backup
pg_dump -U egura_admin egura_store > backup_$(date +%Y%m%d).sql

# Update sales count
cd /var/www/egura/backend
npm run update-sales
```

## Environment Variables Required

| Variable | Description |
|----------|-------------|
| `PORT` | Backend port (5000) |
| `NODE_ENV` | production |
| `POSTGRES_HOST` | localhost |
| `POSTGRES_DB` | egura_store |
| `POSTGRES_USER` | egura_admin |
| `POSTGRES_PASSWORD` | Your strong password |
| `JWT_SECRET` | Random 32+ char string |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret |

## Troubleshooting

**502 Bad Gateway**: Backend not running - `pm2 restart egura-backend`

**Database connection error**: Check PostgreSQL - `sudo systemctl status postgresql`

**Permission denied**: Fix ownership - `sudo chown -R www-data:www-data /var/www/html/egura`

**SSL issues**: Renew certificate - `sudo certbot renew`
