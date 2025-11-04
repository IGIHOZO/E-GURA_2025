#!/bin/bash
# Fix React bundle corruption and rebuild

echo "🔧 Fixing React bundle issues..."

cd /var/www/deby/deby/frontend

# Clean existing build
echo "🧹 Cleaning old build..."
sudo rm -rf dist node_modules/.vite

# Clear npm cache
echo "🗑️ Clearing npm cache..."
npm cache clean --force

# Rebuild
echo "🏗️ Rebuilding frontend with clean state..."
sudo npm run build

# Fix permissions
echo "🔐 Fixing permissions..."
sudo chown -R igihozo:igihozo dist

# Reload nginx
echo "🔄 Reloading nginx..."
sudo systemctl reload nginx

echo "✅ Done! Check https://egura.rw"
