const mongoose = require('mongoose');
const User = require('./models/User');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/sewithdebby';

async function checkRealCustomers() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get ALL users from database
    const allUsers = await User.find().select('-password');
    
    console.log('📊 DATABASE STATUS');
    console.log('═'.repeat(70));
    console.log(`Total Users in Database: ${allUsers.length}`);
    console.log('═'.repeat(70));
    
    if (allUsers.length === 0) {
      console.log('\n⚠️  No users found in database!');
      console.log('\nPossible reasons:');
      console.log('1. Database is empty');
      console.log('2. Wrong database connection');
      console.log('3. Users in different collection');
      
      // Check database name
      console.log('\n📍 Current Database:', mongoose.connection.name);
      console.log('📍 Connection URI:', MONGO_URI);
      
    } else {
      console.log('\n👥 ALL REGISTERED CUSTOMERS:');
      console.log('─'.repeat(70));
      
      allUsers.forEach((user, index) => {
        console.log(`\n${index + 1}. ${user.firstName} ${user.lastName}`);
        console.log(`   📧 Email: ${user.email}`);
        console.log(`   📱 Phone: ${user.phone}`);
        console.log(`   📅 Registered: ${new Date(user.createdAt).toLocaleString()}`);
        console.log(`   🛍️  Total Orders: ${user.totalOrders || 0}`);
        console.log(`   💰 Total Spent: ${(user.totalSpent || 0).toLocaleString()} RWF`);
        console.log(`   ✅ Active: ${user.isActive ? 'Yes' : 'No'}`);
        console.log(`   ✉️  Email Verified: ${user.emailVerified ? 'Yes' : 'No'}`);
        console.log(`   📲 Phone Verified: ${user.phoneVerified ? 'Yes' : 'No'}`);
        
        if (user.addresses && user.addresses.length > 0) {
          console.log(`   📍 Addresses: ${user.addresses.length}`);
          user.addresses.forEach((addr, i) => {
            console.log(`      ${i + 1}. ${addr.city}, ${addr.district} - ${addr.address}`);
          });
        } else {
          console.log(`   📍 Addresses: None`);
        }
        
        if (user.lastLogin) {
          console.log(`   🕐 Last Login: ${new Date(user.lastLogin).toLocaleString()}`);
        }
      });
      
      console.log('\n' + '─'.repeat(70));
      console.log(`\n✅ Found ${allUsers.length} REAL registered customer(s)!`);
      console.log('\n🌐 These customers should appear in your admin dashboard at:');
      console.log('   http://localhost:5173/admin → Customers tab');
    }

    await mongoose.connection.close();
    console.log('\n👋 Database connection closed\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    console.error('\nError details:', error.message);
    process.exit(1);
  }
}

checkRealCustomers();
