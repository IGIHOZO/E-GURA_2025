#!/bin/bash
#
# SEWITHDEBBY Automated Deployment Script
# Server: egura.rw (167.172.121.245)
# User: igihozo
#
# Usage: bash deploy.sh
#

set -e  # Exit on error

echo "🚀 SEWITHDEBBY Deployment Script"
echo "================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
SERVER_USER="igihozo"
SERVER_IP="167.172.121.245"
DOMAIN="egura.rw"
PROJECT_DIR="/var/www/egura"
DB_NAME="deby_ecommerce"
DB_USER="deby_user"

echo "Server: $SERVER_USER@$SERVER_IP"
echo "Domain: $DOMAIN"
echo ""

# Function to execute remote commands
remote_exec() {
    ssh $SERVER_USER@$SERVER_IP "$@"
}

# Step 1: Check connection
echo -e "${YELLOW}Step 1: Testing SSH connection...${NC}"
if remote_exec "echo 'Connected successfully'"; then
    echo -e "${GREEN}✅ SSH connection successful${NC}"
else
    echo -e "${RED}❌ SSH connection failed${NC}"
    exit 1
fi
echo ""

# Step 2: Update system
echo -e "${YELLOW}Step 2: Updating system packages...${NC}"
remote_exec "sudo apt update && sudo apt upgrade -y"
echo -e "${GREEN}✅ System updated${NC}"
echo ""

# Step 3: Install Node.js
echo -e "${YELLOW}Step 3: Installing Node.js 18.x...${NC}"
remote_exec "curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash - && sudo apt install -y nodejs"
echo -e "${GREEN}✅ Node.js installed${NC}"
remote_exec "node -v && npm -v"
echo ""

# Step 4: Install PostgreSQL
echo -e "${YELLOW}Step 4: Installing PostgreSQL...${NC}"
remote_exec "sudo apt install -y postgresql postgresql-contrib"
echo -e "${GREEN}✅ PostgreSQL installed${NC}"
echo ""

# Step 5: Install Nginx
echo -e "${YELLOW}Step 5: Installing Nginx...${NC}"
remote_exec "sudo apt install -y nginx"
remote_exec "sudo systemctl start nginx && sudo systemctl enable nginx"
echo -e "${GREEN}✅ Nginx installed and started${NC}"
echo ""

# Step 6: Install PM2
echo -e "${YELLOW}Step 6: Installing PM2...${NC}"
remote_exec "sudo npm install -g pm2"
echo -e "${GREEN}✅ PM2 installed${NC}"
echo ""

# Step 7: Install utilities
echo -e "${YELLOW}Step 7: Installing utilities (unzip, certbot)...${NC}"
remote_exec "sudo apt install -y unzip certbot python3-certbot-nginx"
echo -e "${GREEN}✅ Utilities installed${NC}"
echo ""

# Step 8: Create project directory
echo -e "${YELLOW}Step 8: Setting up project directory...${NC}"
remote_exec "sudo mkdir -p $PROJECT_DIR && sudo chown -R $SERVER_USER:$SERVER_USER $PROJECT_DIR"
echo -e "${GREEN}✅ Project directory created${NC}"
echo ""

# Step 9: Extract project files
echo -e "${YELLOW}Step 9: Extracting project files...${NC}"
remote_exec "cd $PROJECT_DIR && unzip -o ~/deby.zip"
remote_exec "cp ~/deby_ecommerce.sql $PROJECT_DIR/"
echo -e "${GREEN}✅ Files extracted${NC}"
echo ""

# Step 10: Setup database
echo -e "${YELLOW}Step 10: Setting up PostgreSQL database...${NC}"
read -sp "Enter password for database user '$DB_USER': " DB_PASSWORD
echo ""

remote_exec "sudo -u postgres psql -c \"CREATE DATABASE $DB_NAME;\" || echo 'Database may already exist'"
remote_exec "sudo -u postgres psql -c \"CREATE USER $DB_USER WITH ENCRYPTED PASSWORD '$DB_PASSWORD';\" || echo 'User may already exist'"
remote_exec "sudo -u postgres psql -c \"GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;\""
remote_exec "sudo -u postgres psql -c \"ALTER DATABASE $DB_NAME OWNER TO $DB_USER;\""

echo -e "${GREEN}✅ Database created${NC}"
echo ""

# Step 11: Import database
echo -e "${YELLOW}Step 11: Importing database...${NC}"
remote_exec "sudo -u postgres psql -d $DB_NAME -f $PROJECT_DIR/deby_ecommerce.sql"
echo -e "${GREEN}✅ Database imported${NC}"
echo ""

# Step 12: Create backend .env
echo -e "${YELLOW}Step 12: Creating backend environment file...${NC}"
read -p "Enter Cloudinary Cloud Name: " CLOUDINARY_NAME
read -p "Enter Cloudinary API Key: " CLOUDINARY_KEY
read -sp "Enter Cloudinary API Secret: " CLOUDINARY_SECRET
echo ""
read -p "Enter JWT Secret (or press Enter to generate): " JWT_SECRET

if [ -z "$JWT_SECRET" ]; then
    JWT_SECRET=$(openssl rand -base64 32)
    echo "Generated JWT Secret: $JWT_SECRET"
fi

remote_exec "cat > $PROJECT_DIR/backend/.env << 'EOL'
PORT=5000
NODE_ENV=production

POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=$DB_NAME
POSTGRES_USER=$DB_USER
POSTGRES_PASSWORD=$DB_PASSWORD

JWT_SECRET=$JWT_SECRET

CLOUDINARY_CLOUD_NAME=$CLOUDINARY_NAME
CLOUDINARY_API_KEY=$CLOUDINARY_KEY
CLOUDINARY_API_SECRET=$CLOUDINARY_SECRET

DATABASE_TYPE=postgres
EOL"

echo -e "${GREEN}✅ Backend .env created${NC}"
echo ""

# Step 13: Create frontend .env
echo -e "${YELLOW}Step 13: Creating frontend environment file...${NC}"
remote_exec "cat > $PROJECT_DIR/frontend/.env << 'EOL'
VITE_API_URL=https://$DOMAIN/api
VITE_APP_NAME=E-Gura
EOL"
echo -e "${GREEN}✅ Frontend .env created${NC}"
echo ""

# Step 14: Install dependencies
echo -e "${YELLOW}Step 14: Installing backend dependencies...${NC}"
remote_exec "cd $PROJECT_DIR/backend && npm install --production"
echo -e "${GREEN}✅ Backend dependencies installed${NC}"
echo ""

echo -e "${YELLOW}Step 15: Installing and building frontend...${NC}"
remote_exec "cd $PROJECT_DIR/frontend && npm install && npm run build"
echo -e "${GREEN}✅ Frontend built${NC}"
echo ""

# Step 16: Create logs directory
echo -e "${YELLOW}Step 16: Creating logs directory...${NC}"
remote_exec "mkdir -p $PROJECT_DIR/logs"
echo -e "${GREEN}✅ Logs directory created${NC}"
echo ""

# Step 17: Configure firewall
echo -e "${YELLOW}Step 17: Configuring firewall...${NC}"
remote_exec "sudo ufw allow 22/tcp && sudo ufw allow 80/tcp && sudo ufw allow 443/tcp && echo 'y' | sudo ufw enable" || echo "Firewall already configured"
echo -e "${GREEN}✅ Firewall configured${NC}"
echo ""

# Step 18: Start backend with PM2
echo -e "${YELLOW}Step 18: Starting backend with PM2...${NC}"
remote_exec "cd $PROJECT_DIR/backend && pm2 start index.js --name egura-backend -i 2 && pm2 save"
remote_exec "pm2 startup systemd -u $SERVER_USER --hp /home/$SERVER_USER | tail -1" > /tmp/pm2_startup.sh
echo -e "${GREEN}✅ Backend started with PM2${NC}"
echo ""

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✅ Deployment Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Next steps:"
echo "1. Configure Nginx: See DEPLOYMENT_GUIDE.md Step 7"
echo "2. Setup SSL: sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN"
echo "3. Test: https://$DOMAIN"
echo ""
echo "Access logs: pm2 logs egura-backend"
echo "Check status: pm2 status"
echo ""
