const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/sewithdebby';

async function findCustomers() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    const db = mongoose.connection.db;
    
    console.log('📍 Current Database:', db.databaseName);
    console.log('📍 Connection URI:', MONGO_URI);
    
    // List all collections
    console.log('\n📂 Collections in database:');
    const collections = await db.listCollections().toArray();
    console.log('─'.repeat(50));
    
    if (collections.length === 0) {
      console.log('⚠️  No collections found!');
    } else {
      for (const collection of collections) {
        const count = await db.collection(collection.name).countDocuments();
        console.log(`📁 ${collection.name}: ${count} documents`);
        
        // If it's users collection, show some data
        if (collection.name === 'users' && count > 0) {
          console.log('\n   👥 Sample users:');
          const users = await db.collection('users').find().limit(5).toArray();
          users.forEach((user, i) => {
            console.log(`   ${i + 1}. ${user.firstName} ${user.lastName} - ${user.email}`);
          });
        }
      }
    }
    
    console.log('─'.repeat(50));
    
    // Check if users collection exists
    const usersCollection = collections.find(c => c.name === 'users');
    if (!usersCollection) {
      console.log('\n⚠️  "users" collection does not exist!');
      console.log('This means no one has registered yet.');
    }
    
    // List all databases
    console.log('\n🗄️  All databases on MongoDB server:');
    console.log('─'.repeat(50));
    const admin = db.admin();
    const databases = await admin.listDatabases();
    databases.databases.forEach(database => {
      console.log(`📊 ${database.name} (${(database.sizeOnDisk / 1024 / 1024).toFixed(2)} MB)`);
    });
    console.log('─'.repeat(50));

    await mongoose.connection.close();
    console.log('\n👋 Database connection closed\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    console.error('\nError details:', error.message);
    process.exit(1);
  }
}

findCustomers();
