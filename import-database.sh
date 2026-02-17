#!/bin/bash
# Import database to PostgreSQL (not MySQL!)

echo "🗄️ Importing database..."

# The backend uses PostgreSQL, not MySQL
# Check backend/.env for database credentials

cd /var/www/deby/deby

# First, let's check what database the backend is using
echo "📋 Checking backend database configuration..."
grep -i "DB\|DATABASE" backend/.env

echo ""
echo "⚠️  NOTE: Your deby_ecommerce.sql appears to be a MySQL dump"
echo "   But your backend likely uses PostgreSQL"
echo ""
echo "Please confirm:"
echo "1. What database engine is the backend using? (MySQL or PostgreSQL)"
echo "2. What are the database credentials?"
echo ""
echo "Then we can convert and import properly."
