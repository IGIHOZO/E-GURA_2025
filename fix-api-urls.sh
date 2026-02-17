#!/bin/bash
# Fix all hardcoded localhost:5000 URLs to use nginx proxy

echo "🔧 Fixing API URLs..."

cd /var/www/deby/deby/frontend/src

# Replace all variations of localhost:5000 with /api
find . -type f \( -name "*.js" -o -name "*.jsx" \) -exec sed -i "s|'http://localhost:5000/api|'/api|g" {} +
find . -type f \( -name "*.js" -o -name "*.jsx" \) -exec sed -i 's|"http://localhost:5000/api"|"/api"|g' {} +
find . -type f \( -name "*.js" -o -name "*.jsx" \) -exec sed -i 's|`http://localhost:5000/api`|`/api`|g' {} +
find . -type f \( -name "*.js" -o -name "*.jsx" \) -exec sed -i "s|'http://localhost:5000'|''|g" {} +

echo "✅ URLs fixed! Now rebuilding..."

cd /var/www/deby/deby/frontend
sudo npm run build
sudo chown -R igihozo:igihozo dist
sudo systemctl reload nginx

echo "✅ Done!"
