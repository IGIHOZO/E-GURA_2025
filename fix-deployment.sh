#!/bin/bash
# Fix deployment white screen issue

echo "🔧 Fixing E-Gura deployment..."

# Navigate to frontend
cd /var/www/deby/deby/frontend

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Build frontend
echo "🏗️ Building frontend..."
npm run build

# Check if build succeeded
if [ ! -d "dist" ]; then
    echo "❌ Build failed - dist directory not created"
    exit 1
fi

# Update nginx config
echo "⚙️ Updating nginx configuration..."
sudo sed -i 's|root /var/www/egura/frontend/dist;|root /var/www/deby/deby/frontend/dist;|g' /etc/nginx/sites-available/egura.rw

# Test nginx config
echo "✅ Testing nginx configuration..."
sudo nginx -t

if [ $? -eq 0 ]; then
    # Reload nginx
    echo "🔄 Reloading nginx..."
    sudo systemctl reload nginx
    echo "✅ Deployment fixed! Visit https://egura.rw"
else
    echo "❌ Nginx configuration has errors. Please fix manually."
    exit 1
fi
