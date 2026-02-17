const mongoose = require('mongoose');
require('dotenv').config();

async function fixAllIndexes() {
  try {
    console.log('🔧 Fixing Order Indexes in ALL databases...\n');
    
    const databases = ['ecommerce', 'sewithdebby'];
    
    for (const dbName of databases) {
      console.log(`\n📦 Processing database: ${dbName}`);
      console.log('═'.repeat(50));
      
      try {
        // Connect to specific database
        const uri = `mongodb://localhost:27017/${dbName}`;
        await mongoose.connect(uri);
        console.log(`✅ Connected to ${dbName}`);
        
        const Order = mongoose.connection.collection('orders');
        
        // Check if collection exists
        const collections = await mongoose.connection.db.listCollections({name: 'orders'}).toArray();
        if (collections.length === 0) {
          console.log(`  ⚠️  No orders collection found in ${dbName}`);
          await mongoose.connection.close();
          continue;
        }
        
        // Drop old indexes
        console.log('\n🗑️  Dropping old indexes...');
        try {
          await Order.dropIndex('externalId_1');
          console.log('  ✅ Dropped externalId_1');
        } catch (e) {
          console.log('  ⚠️  externalId_1 not found or already dropped');
        }
        
        try {
          await Order.dropIndex('referenceNumber_1');
          console.log('  ✅ Dropped referenceNumber_1');
        } catch (e) {
          console.log('  ⚠️  referenceNumber_1 not found or already dropped');
        }
        
        // Create new sparse indexes
        console.log('\n✨ Creating new sparse indexes...');
        await Order.createIndex({ externalId: 1 }, { unique: true, sparse: true });
        console.log('  ✅ Created sparse index on externalId');
        
        await Order.createIndex({ referenceNumber: 1 }, { unique: true, sparse: true });
        console.log('  ✅ Created sparse index on referenceNumber');
        
        console.log(`\n✅ Fixed indexes in ${dbName}`);
        
        await mongoose.connection.close();
        
      } catch (error) {
        console.error(`\n❌ Error processing ${dbName}:`, error.message);
        try {
          await mongoose.connection.close();
        } catch (e) {}
      }
    }
    
    console.log('\n\n🎉 All databases processed!\n');
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ Fatal error:', error.message);
    process.exit(1);
  }
}

fixAllIndexes();
