const mongoose = require('mongoose');
const User = require('./models/User');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/sewithdebby';

async function clearFakeCustomers() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    console.log('\n📊 Current customers in database:');
    const allUsers = await User.find().select('-password');
    console.log(`Total users: ${allUsers.length}`);
    
    if (allUsers.length > 0) {
      console.log('\n👥 List of all users:');
      console.log('─'.repeat(60));
      allUsers.forEach((user, index) => {
        console.log(`${index + 1}. ${user.firstName} ${user.lastName}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Phone: ${user.phone}`);
        console.log(`   Created: ${user.createdAt}`);
        console.log(`   Orders: ${user.totalOrders || 0} | Spent: ${(user.totalSpent || 0).toLocaleString()} RWF`);
        console.log('');
      });
      console.log('─'.repeat(60));
    }

    // Delete fake/sample customers (those with @email.com or temp emails)
    console.log('\n🗑️  Removing sample/fake customers...');
    const result = await User.deleteMany({
      $or: [
        { email: { $regex: '@email.com$' } },
        { email: { $regex: '^guest_' } },
        { email: { $regex: '@temp.com$' } }
      ]
    });
    
    console.log(`✅ Deleted ${result.deletedCount} fake/sample customers`);

    // Show remaining real customers
    console.log('\n📊 Real registered customers:');
    const realUsers = await User.find().select('-password');
    console.log(`Total real users: ${realUsers.length}`);
    
    if (realUsers.length > 0) {
      console.log('\n👥 Real customers:');
      console.log('─'.repeat(60));
      realUsers.forEach((user, index) => {
        console.log(`${index + 1}. ${user.firstName} ${user.lastName}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Phone: ${user.phone}`);
        console.log(`   Registered: ${user.createdAt}`);
        console.log(`   Orders: ${user.totalOrders || 0} | Spent: ${(user.totalSpent || 0).toLocaleString()} RWF`);
        if (user.addresses && user.addresses.length > 0) {
          console.log(`   Address: ${user.addresses[0].city}, ${user.addresses[0].district}`);
        }
        console.log('');
      });
      console.log('─'.repeat(60));
      console.log('\n✅ These are your REAL customers!');
      console.log('🌐 View them at: http://localhost:5173/admin → Customers tab');
    } else {
      console.log('\n⚠️  No real customers found yet.');
      console.log('\n💡 To get real customers:');
      console.log('   1. Go to: http://localhost:5173/register');
      console.log('   2. Register a new account');
      console.log('   3. Or place an order (customer auto-created)');
      console.log('   4. Check admin dashboard again');
    }

    await mongoose.connection.close();
    console.log('\n👋 Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

clearFakeCustomers();
