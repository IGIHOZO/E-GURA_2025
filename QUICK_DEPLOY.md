# ⚡ Quick Deployment Guide - egura.rw

## 🎯 TL;DR - Fast Track

Copy and paste these commands in order on your **remote server** (SSH into: igihozo@167.172.121.245)

---

## 📋 Phase 1: System Setup (10 min)

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install PostgreSQL, Nginx, utilities
sudo apt install -y postgresql postgresql-contrib nginx unzip certbot python3-certbot-nginx

# Install PM2
sudo npm install -g pm2

# Verify installations
node -v && npm -v && psql --version && nginx -v && pm2 -v
```

---

## 📂 Phase 2: Project Setup (5 min)

```bash
# Create project directory
sudo mkdir -p /var/www/egura
sudo chown -R igihozo:igihozo /var/www/egura

# Extract files
cd /var/www/egura
unzip ~/deby.zip

# Copy database file
cp ~/deby_ecommerce.sql /var/www/egura/
```

---

## 🗄️ Phase 3: Database Setup (5 min)

```bash
# Create database and user
sudo -u postgres psql << EOF
CREATE DATABASE deby_ecommerce;
CREATE USER deby_user WITH ENCRYPTED PASSWORD 'ChangeThisPassword123!';
GRANT ALL PRIVILEGES ON DATABASE deby_ecommerce TO deby_user;
ALTER DATABASE deby_ecommerce OWNER TO deby_user;
\q
EOF

# Import database
sudo -u postgres psql -d deby_ecommerce -f /var/www/egura/deby_ecommerce.sql

# Verify tables
sudo -u postgres psql -d deby_ecommerce -c "\dt"
```

---

## ⚙️ Phase 4: Environment Config (3 min)

### Backend .env
```bash
cat > /var/www/egura/backend/.env << 'EOF'
PORT=5000
NODE_ENV=production

POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=deby_ecommerce
POSTGRES_USER=deby_user
POSTGRES_PASSWORD=ChangeThisPassword123!

JWT_SECRET=change-this-to-random-secret-key-$(openssl rand -hex 32)

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

DATABASE_TYPE=postgres
EOF
```

### Frontend .env
```bash
cat > /var/www/egura/frontend/.env << 'EOF'
VITE_API_URL=https://egura.rw/api
VITE_APP_NAME=E-Gura
EOF
```

**⚠️ IMPORTANT:** Edit these files with your actual credentials!

```bash
nano /var/www/egura/backend/.env  # Update Cloudinary, JWT, DB password
```

---

## 📦 Phase 5: Build & Install (10 min)

```bash
# Backend
cd /var/www/egura/backend
npm install --production

# Frontend
cd /var/www/egura/frontend
npm install
npm run build

# Create logs directory
mkdir -p /var/www/egura/logs
```

---

## 🚀 Phase 6: Start Backend (2 min)

```bash
cd /var/www/egura/backend

# Start with PM2
pm2 start index.js --name egura-backend -i 2 --env production

# Save PM2 config
pm2 save

# Setup auto-start on boot
pm2 startup systemd -u igihozo --hp /home/igihozo
# Copy and run the command PM2 outputs!

# Check status
pm2 status
pm2 logs egura-backend --lines 20
```

---

## 🌐 Phase 7: Nginx Configuration (5 min)

```bash
sudo nano /etc/nginx/sites-available/egura.rw
```

**Paste this:**
```nginx
upstream backend {
    server 127.0.0.1:5000;
    keepalive 64;
}

server {
    listen 80;
    server_name egura.rw www.egura.rw;
    
    client_max_body_size 50M;
    
    location / {
        root /var/www/egura/frontend/dist;
        try_files $uri $uri/ /index.html;
    }
    
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
    }
}
```

**Enable site:**
```bash
sudo ln -s /etc/nginx/sites-available/egura.rw /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default  # Remove default
sudo nginx -t  # Test config
sudo systemctl reload nginx
```

---

## 🔒 Phase 8: SSL Certificate (3 min)

```bash
# Get SSL certificate
sudo certbot --nginx -d egura.rw -d www.egura.rw

# Follow prompts and choose to redirect HTTP to HTTPS
```

---

## 🔥 Phase 9: Firewall (1 min)

```bash
sudo ufw allow 22/tcp   # SSH
sudo ufw allow 80/tcp   # HTTP
sudo ufw allow 443/tcp  # HTTPS
sudo ufw enable
sudo ufw status
```

---

## ✅ Phase 10: Testing

```bash
# Test backend
curl http://localhost:5000/api/health

# Test domain (after SSL)
curl https://egura.rw/api/health

# Should return:
# {"status":"ok","database":"connected","dbType":"PostgreSQL"}
```

**Visit in browser:** https://egura.rw

---

## 📊 Monitoring Commands

```bash
# PM2 status
pm2 status

# View logs
pm2 logs egura-backend

# Monitor in real-time
pm2 monit

# Restart app
pm2 restart egura-backend

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

---

## 🚨 Quick Troubleshooting

### Backend won't start?
```bash
pm2 logs egura-backend --lines 100
# Check for database connection errors
# Verify .env file has correct credentials
```

### Database connection failed?
```bash
# Test database
psql -U deby_user -d deby_ecommerce -h localhost
# Enter password from .env file
```

### 502 Bad Gateway?
```bash
# Check if backend is running
pm2 status

# Restart backend
pm2 restart egura-backend

# Check Nginx error log
sudo tail -f /var/log/nginx/error.log
```

---

## ⏱️ Total Time: ~45 minutes

1. ✅ System Setup (10 min)
2. ✅ Project Setup (5 min)
3. ✅ Database Setup (5 min)
4. ✅ Environment Config (3 min)
5. ✅ Build & Install (10 min)
6. ✅ Start Backend (2 min)
7. ✅ Nginx Config (5 min)
8. ✅ SSL Certificate (3 min)
9. ✅ Firewall (1 min)
10. ✅ Testing (1 min)

---

## 📝 Post-Deployment Checklist

- [ ] Visit https://egura.rw - Homepage loads
- [ ] Test product browsing
- [ ] Test search functionality
- [ ] Test admin login: https://egura.rw/admin-login
- [ ] Check SSL (green padlock in browser)
- [ ] Verify PM2 auto-start: `sudo reboot` then `pm2 status`

---

## 🎉 Success Indicators

✅ Backend logs show: "All systems operational!"  
✅ Frontend loads without errors  
✅ HTTPS working with valid certificate  
✅ API endpoints responding  
✅ Database connected  

**You're live! 🚀**

---

**Need detailed guide?** See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)
