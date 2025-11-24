#!/bin/bash

# E-Gura Store - DigitalOcean Ubuntu VPS Deployment Script
# Run this script on your Ubuntu VPS after initial setup

set -e

echo "🚀 Starting E-Gura Store Deployment on Ubuntu VPS..."

# Update system
echo "📦 Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install Node.js 20.x
echo "📦 Installing Node.js 20.x..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install PostgreSQL
echo "📦 Installing PostgreSQL..."
sudo apt install -y postgresql postgresql-contrib

# Install Nginx
echo "📦 Installing Nginx..."
sudo apt install -y nginx

# Install PM2 (Process Manager)
echo "📦 Installing PM2..."
sudo npm install -g pm2

# Install Git
echo "📦 Installing Git..."
sudo apt install -y git

# Setup PostgreSQL Database
echo "🗄️  Setting up PostgreSQL database..."
sudo -u postgres psql <<EOF
CREATE DATABASE egura_store;
CREATE USER egura_admin WITH PASSWORD 'CHANGE_THIS_PASSWORD';
GRANT ALL PRIVILEGES ON DATABASE egura_store TO egura_admin;
\q
EOF

# Create application directory
echo "📁 Creating application directory..."
sudo mkdir -p /var/www/egura
sudo chown -R $USER:$USER /var/www/egura

# Clone repository (you'll need to replace with your actual repo)
echo "📥 Cloning repository..."
# cd /var/www
# git clone YOUR_REPOSITORY_URL egura

# Navigate to backend
cd /var/www/egura/backend

# Install backend dependencies
echo "📦 Installing backend dependencies..."
npm install --production

# Setup environment file
echo "⚙️  Setting up environment variables..."
cp .env.production .env

# Run database migrations
echo "🗄️  Running database migrations..."
# Add your migration command here if you have one
# npm run migrate

# Build frontend
echo "🎨 Building frontend..."
cd /var/www/egura/frontend
npm install
npm run build

# Setup PM2 to run backend
echo "🔄 Setting up PM2 process manager..."
cd /var/www/egura/backend
pm2 start index.js --name "egura-backend" --time
pm2 save
pm2 startup

# Configure Nginx
echo "🌐 Configuring Nginx..."
sudo tee /etc/nginx/sites-available/egura > /dev/null <<'NGINX_CONFIG'
# E-Gura Store Nginx Configuration

# Redirect HTTP to HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name egura.rw www.egura.rw;
    
    return 301 https://$server_name$request_uri;
}

# HTTPS Server
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name egura.rw www.egura.rw;

    # SSL Certificates (will be configured with Certbot)
    ssl_certificate /etc/letsencrypt/live/egura.rw/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/egura.rw/privkey.pem;
    
    # SSL Configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json application/javascript;

    # Frontend (React App)
    location / {
        root /var/www/egura/frontend/dist;
        try_files $uri $uri/ /index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Uploads directory
    location /uploads/ {
        alias /var/www/egura/backend/uploads/;
        expires 1y;
        add_header Cache-Control "public";
    }
}
NGINX_CONFIG

# Enable Nginx site
sudo ln -sf /etc/nginx/sites-available/egura /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration
echo "🧪 Testing Nginx configuration..."
sudo nginx -t

# Restart Nginx
echo "🔄 Restarting Nginx..."
sudo systemctl restart nginx

# Install Certbot for SSL
echo "🔒 Installing Certbot for SSL certificates..."
sudo apt install -y certbot python3-certbot-nginx

# Setup SSL (you'll need to run this manually)
echo "📝 To setup SSL, run:"
echo "sudo certbot --nginx -d egura.rw -d www.egura.rw"

# Setup firewall
echo "🔥 Configuring firewall..."
sudo ufw allow 'Nginx Full'
sudo ufw allow OpenSSH
sudo ufw --force enable

# Create log rotation
echo "📄 Setting up log rotation..."
sudo tee /etc/logrotate.d/egura > /dev/null <<'LOGROTATE'
/var/www/egura/backend/*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 www-data www-data
    sharedscripts
    postrotate
        pm2 reloadLogs
    endscript
}
LOGROTATE

echo "✅ Deployment complete!"
echo ""
echo "📋 Next steps:"
echo "1. Edit /var/www/egura/backend/.env with your actual credentials"
echo "2. Run: sudo certbot --nginx -d egura.rw -d www.egura.rw"
echo "3. Check backend status: pm2 status"
echo "4. Check backend logs: pm2 logs egura-backend"
echo "5. Visit your site: https://egura.rw"
echo ""
echo "🔄 Useful commands:"
echo "  pm2 restart egura-backend  # Restart backend"
echo "  pm2 logs egura-backend     # View logs"
echo "  pm2 monit                  # Monitor processes"
echo "  sudo systemctl status nginx # Check Nginx"
echo "  sudo nginx -t              # Test Nginx config"
