#!/bin/bash
# Import database to PostgreSQL on server

echo "🗄️ Importing database to PostgreSQL..."

cd /var/www/deby/deby

# Check if database exists
echo "📋 Checking PostgreSQL connection..."
sudo -u postgres psql -c "\l" | grep deby_ecommerce

if [ $? -ne 0 ]; then
    echo "📝 Creating database..."
    sudo -u postgres psql -c "CREATE DATABASE deby_ecommerce;"
    sudo -u postgres psql -c "CREATE USER deby_user WITH PASSWORD 'your_password';"
    sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE deby_ecommerce TO deby_user;"
fi

# Run database sync to create tables
echo "🔄 Creating tables..."
cd backend
npm run sync-db

echo ""
echo "✅ Database setup complete!"
echo ""
echo "⚠️  Your deby_ecommerce.sql file is a MySQL dump."
echo "   You need to either:"
echo "   1. Convert it to PostgreSQL format, or"
echo "   2. Use the backend seeder scripts to populate data"
echo ""
echo "To seed sample data:"
echo "   cd /var/www/deby/deby/backend"
echo "   npm run seed"
