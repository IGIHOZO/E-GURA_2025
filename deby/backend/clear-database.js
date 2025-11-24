const mongoose = require('mongoose');
require('dotenv').config();

const clearDatabase = async () => {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();

    console.log(`\n📊 Found ${collections.length} collections`);

    let totalDeleted = 0;

    for (const collection of collections) {
      const collectionName = collection.name;
      
      // Count documents before deletion
      const count = await db.collection(collectionName).countDocuments();
      
      if (count > 0) {
        console.log(`\n🗑️  Clearing collection: ${collectionName} (${count} documents)`);
        const result = await db.collection(collectionName).deleteMany({});
        console.log(`   ✅ Deleted ${result.deletedCount} documents`);
        totalDeleted += result.deletedCount;
      } else {
        console.log(`\n⚪ Skipping empty collection: ${collectionName}`);
      }
    }
    console.log('\n✅ Database cleared successfully!');
    console.log('\n📋 Summary:');
    console.log(`   - Collections found: ${collections.length}`);
    console.log(`   - Total documents deleted: ${totalDeleted}`);
    console.log(`   - Database is now empty`);
    console.log('\n⚠️  Note: Orders in admin dashboard may be from localStorage');
    console.log('   To clear localStorage, visit: http://localhost:4000/clear-storage.html');

    await mongoose.connection.close();
    console.log('\n🔌 Disconnected from MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error clearing database:', error);
    process.exit(1);
  }
};

clearDatabase();
