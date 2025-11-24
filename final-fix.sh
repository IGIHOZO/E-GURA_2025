#!/bin/bash
# Final fix for React 19 bundling issue

echo "🔧 Applying final React 19 fix..."

cd /var/www/deby/deby/frontend

# Clean everything
echo "🧹 Deep clean..."
sudo rm -rf dist node_modules/.vite .vite

# Rebuild with fixed config
echo "🏗️ Building with React 19 fix..."
sudo npm run build

# Check if build was successful
if [ -f "dist/index.html" ]; then
    echo "✅ Build successful!"
    
    # Fix permissions
    sudo chown -R igihozo:igihozo dist
    
    # Reload nginx
    sudo systemctl reload nginx
    
    echo "✅ Done! Site should work now at https://egura.rw"
else
    echo "❌ Build failed!"
    exit 1
fi
