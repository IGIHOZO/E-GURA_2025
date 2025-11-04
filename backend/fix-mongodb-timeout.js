/**
 * Fix MongoDB Timeout Issues
 * This script helps identify and fix MongoDB connection timeout errors
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 MongoDB Timeout Fix Script\n');
console.log('═'.repeat(50));

// Check DATABASE_TYPE in .env
const envPath = path.join(__dirname, '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const databaseType = envContent.match(/DATABASE_TYPE=(\w+)/)?.[1] || 'mongodb';

console.log(`\n📊 Current DATABASE_TYPE: ${databaseType}`);

if (databaseType === 'postgres') {
  console.log('\n✅ You are configured to use PostgreSQL');
  console.log('\n⚠️  However, some routes are still trying to use MongoDB!');
  console.log('\n🔧 Solutions:\n');
  console.log('Option 1: START MONGODB SERVICE (Recommended for now)');
  console.log('─'.repeat(50));
  console.log('Windows:');
  console.log('  1. Press Win + R');
  console.log('  2. Type: services.msc');
  console.log('  3. Find "MongoDB" service');
  console.log('  4. Right-click → Start\n');
  console.log('OR from Command Prompt (as Admin):');
  console.log('  net start MongoDB\n');
  
  console.log('\nOption 2: USE HYBRID MODE (Both databases)');
  console.log('─'.repeat(50));
  console.log('Keep MongoDB running for legacy routes');
  console.log('New features use PostgreSQL\n');
  
  console.log('\nOption 3: FULLY MIGRATE TO POSTGRESQL');
  console.log('─'.repeat(50));
  console.log('Requires updating all routes to use Sequelize');
  console.log('Run: node migrate-all-routes.js (coming soon)\n');
  
  console.log('═'.repeat(50));
  console.log('\n🚀 QUICK FIX: Start MongoDB service now!\n');
  console.log('Then restart your backend: npm start\n');
  
} else {
  console.log('\n📊 You are configured to use MongoDB');
  console.log('\n⚠️  MongoDB is not running or not accessible!');
  console.log('\n🔧 Solutions:\n');
  console.log('1. START MONGODB SERVICE');
  console.log('─'.repeat(50));
  console.log('Windows:');
  console.log('  net start MongoDB\n');
  console.log('2. CHECK MONGODB URI');
  console.log('─'.repeat(50));
  console.log(`  Current: ${envContent.match(/MONGODB_URI=.*/)?.[0]}`);
  console.log('  Make sure MongoDB is running on that address\n');
  
  console.log('3. SWITCH TO POSTGRESQL');
  console.log('─'.repeat(50));
  console.log('  Change DATABASE_TYPE=postgres in .env');
  console.log('  Then start MongoDB anyway (hybrid mode)\n');
}

// Check if MongoDB is running
console.log('═'.repeat(50));
console.log('\n🔍 Testing MongoDB connection...\n');

const mongoose = require('mongoose');
const MONGO_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ecommerce';

mongoose.connect(MONGO_URI, {
  serverSelectionTimeoutMS: 3000
})
.then(() => {
  console.log('✅ MongoDB IS RUNNING! Connection successful.');
  console.log('   The timeout error might be from a specific route.');
  console.log('   Try restarting the backend server.\n');
  mongoose.connection.close();
  process.exit(0);
})
.catch((err) => {
  console.log('❌ MongoDB IS NOT RUNNING!');
  console.log(`   Error: ${err.message}\n`);
  console.log('💡 ACTION REQUIRED:');
  console.log('   1. Start MongoDB service (see instructions above)');
  console.log('   2. OR install MongoDB: https://www.mongodb.com/try/download/community');
  console.log('   3. Then restart your backend\n');
  process.exit(1);
});
