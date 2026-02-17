#!/bin/bash

# E-Gura Store - Quick Deployment Script for Ubuntu VPS
# Run this script on your DigitalOcean droplet

set -e  # Exit on error

echo "🚀 E-Gura Store Deployment Script"
echo "=================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}Please run as root (use sudo)${NC}"
    exit 1
fi

# Get non-root user
read -p "Enter the username to run the application (default: egura): " APP_USER
APP_USER=${APP_USER:-egura}

# Get database password
read -sp "Enter PostgreSQL password for egura_user: " DB_PASSWORD
echo ""

# Get domain name
read -p "Enter your domain name (e.g., egura.rw): " DOMAIN_NAME

echo ""
echo -e "${GREEN}Starting deployment...${NC}"
echo ""

# Step 1: Update system
echo -e "${YELLOW}[1/10] Updating system packages...${NC}"
apt update && apt upgrade -y

# Step 2: Install essential tools
echo -e "${YELLOW}[2/10] Installing essential tools...${NC}"
apt install -y curl wget git build-essential ufw fail2ban

# Step 3: Install Node.js
echo -e "${YELLOW}[3/10] Installing Node.js 20.x...${NC}"
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Install PM2
npm install -g pm2

# Step 4: Install PostgreSQL
echo -e "${YELLOW}[4/10] Installing PostgreSQL...${NC}"
apt install -y postgresql postgresql-contrib

# Start PostgreSQL
systemctl start postgresql
systemctl enable postgresql

# Create database and user
echo -e "${YELLOW}[5/10] Setting up database...${NC}"
sudo -u postgres psql <<EOF
CREATE DATABASE egura_store;
CREATE USER egura_user WITH ENCRYPTED PASSWORD '$DB_PASSWORD';
GRANT ALL PRIVILEGES ON DATABASE egura_store TO egura_user;
ALTER DATABASE egura_store OWNER TO egura_user;
\q
EOF

# Step 5: Install Nginx
echo -e "${YELLOW}[6/10] Installing Nginx...${NC}"
apt install -y nginx
systemctl start nginx
systemctl enable nginx

# Step 6: Configure firewall
echo -e "${YELLOW}[7/10] Configuring firewall...${NC}"
ufw allow OpenSSH
ufw allow 'Nginx Full'
echo "y" | ufw enable

# Step 7: Create application user
echo -e "${YELLOW}[8/10] Creating application user...${NC}"
if id "$APP_USER" &>/dev/null; then
    echo "User $APP_USER already exists"
else
    adduser --disabled-password --gecos "" $APP_USER
    usermod -aG sudo $APP_USER
fi

# Step 8: Create project directory
echo -e "${YELLOW}[9/10] Creating project directory...${NC}"
mkdir -p /var/www/egura
chown -R $APP_USER:$APP_USER /var/www/egura

# Create logs directory
mkdir -p /var/www/egura/logs
chown -R $APP_USER:$APP_USER /var/www/egura/logs

# Step 9: Install Certbot for SSL
echo -e "${YELLOW}[10/10] Installing Certbot...${NC}"
apt install -y certbot python3-certbot-nginx

echo ""
echo -e "${GREEN}✅ Base system setup complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Upload your project files to /var/www/egura/"
echo "2. Configure backend .env file"
echo "3. Install dependencies: cd /var/www/egura/backend && npm install"
echo "4. Build frontend: cd /var/www/egura/frontend && npm install && npm run build"
echo "5. Configure Nginx (see DEPLOYMENT_GUIDE_DIGITALOCEAN.md)"
echo "6. Start backend with PM2: pm2 start ecosystem.config.js"
echo "7. Get SSL certificate: sudo certbot --nginx -d $DOMAIN_NAME -d www.$DOMAIN_NAME"
echo ""
echo -e "${GREEN}Deployment script finished!${NC}"
