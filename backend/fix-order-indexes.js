const mongoose = require('mongoose');
require('dotenv').config();

async function fixIndexes() {
  try {
    console.log('🔧 Fixing Order Indexes...\n');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    const Order = mongoose.connection.collection('orders');
    
    // Drop old indexes
    console.log('\n🗑️  Dropping old indexes...');
    try {
      await Order.dropIndex('externalId_1');
      console.log('  ✅ Dropped externalId_1');
    } catch (e) {
      console.log('  ⚠️  externalId_1 not found');
    }
    
    try {
      await Order.dropIndex('referenceNumber_1');
      console.log('  ✅ Dropped referenceNumber_1');
    } catch (e) {
      console.log('  ⚠️  referenceNumber_1 not found');
    }
    
    // Create new sparse indexes
    console.log('\n✨ Creating new sparse indexes...');
    await Order.createIndex({ externalId: 1 }, { unique: true, sparse: true });
    console.log('  ✅ Created sparse index on externalId');
    
    await Order.createIndex({ referenceNumber: 1 }, { unique: true, sparse: true });
    console.log('  ✅ Created sparse index on referenceNumber');
    
    console.log('\n✅ Index fix complete!\n');
    
    await mongoose.connection.close();
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

fixIndexes();
