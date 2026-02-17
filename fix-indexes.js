const mongoose = require('mongoose');
require('dotenv').config();

async function fixIndexes() {
  try {
    console.log('🔧 Connecting to MongoDB...');
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/ecommerce';
    console.log('URI:', mongoUri);
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB\n');

    const db = mongoose.connection.db;
    const ordersCollection = db.collection('orders');

    console.log('📋 Current indexes:');
    const indexes = await ordersCollection.indexes();
    indexes.forEach(index => {
      console.log(`  - ${index.name}:`, JSON.stringify(index.key));
    });

    console.log('\n🗑️  Dropping problematic indexes...');
    
    try {
      await ordersCollection.dropIndex('externalId_1');
      console.log('✅ Dropped externalId_1 index');
    } catch (err) {
      console.log('⚠️  externalId_1 index not found or already dropped');
    }

    try {
      await ordersCollection.dropIndex('referenceNumber_1');
      console.log('✅ Dropped referenceNumber_1 index');
    } catch (err) {
      console.log('⚠️  referenceNumber_1 index not found or already dropped');
    }

    console.log('\n✨ Creating new sparse indexes...');
    
    await ordersCollection.createIndex({ externalId: 1 }, { unique: true, sparse: true });
    console.log('✅ Created sparse index on externalId');

    await ordersCollection.createIndex({ referenceNumber: 1 }, { unique: true, sparse: true });
    console.log('✅ Created sparse index on referenceNumber');

    console.log('\n📋 New indexes:');
    const newIndexes = await ordersCollection.indexes();
    newIndexes.forEach(index => {
      console.log(`  - ${index.name}:`, JSON.stringify(index.key), index.sparse ? '(sparse)' : '');
    });

    console.log('\n✅ Index fix complete!');
    
    await mongoose.connection.close();
    console.log('✅ Database connection closed');
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixIndexes();
