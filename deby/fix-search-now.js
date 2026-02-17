/**
 * Quick Fix for Search V2
 * This script will:
 * 1. Enable all search feature flags
 * 2. Check database connection
 * 3. Verify products exist
 */

const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ecommerce';

async function fixSearch() {
  try {
    console.log('🔧 Fixing Search V2...\n');
    
    // Connect to MongoDB
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB Connected\n');

    // Define models
    const FeatureFlag = mongoose.model('FeatureFlag', new mongoose.Schema({
      name: { type: String, unique: true },
      enabled: Boolean,
      rolloutPercentage: { type: Number, default: 100 },
      targetSegments: [String],
      description: String
    }, { timestamps: true }));

    const Product = mongoose.model('Product', new mongoose.Schema({}, { strict: false }));

    // Step 1: Enable feature flags
    console.log('📋 Step 1: Enabling Feature Flags...');
    
    const flags = [
      { name: 'search.v2.enabled', description: 'Search V2 Main Toggle' },
      { name: 'search.recommendations.enabled', description: 'AI Recommendations' },
      { name: 'search.vector.enabled', description: 'Vector Search' },
      { name: 'search.personalization.enabled', description: 'Personalized Results' }
    ];

    for (const flag of flags) {
      await FeatureFlag.findOneAndUpdate(
        { name: flag.name },
        { 
          $set: { 
            enabled: true, 
            rolloutPercentage: 100,
            targetSegments: ['all'],
            description: flag.description
          } 
        },
        { upsert: true, new: true }
      );
      console.log(`  ✅ ${flag.name}`);
    }

    // Step 2: Check products
    console.log('\n📦 Step 2: Checking Products...');
    const productCount = await Product.countDocuments();
    const activeProducts = await Product.countDocuments({ isActive: true });
    
    console.log(`  Total Products: ${productCount}`);
    console.log(`  Active Products: ${activeProducts}`);

    if (productCount === 0) {
      console.log('\n⚠️  WARNING: No products in database!');
      console.log('  Please add products via admin panel first.');
    } else if (activeProducts === 0) {
      console.log('\n⚠️  WARNING: No active products!');
      console.log('  Activating all products...');
      await Product.updateMany({}, { $set: { isActive: true } });
      console.log('  ✅ All products activated');
    }

    // Step 3: Sample products
    if (productCount > 0) {
      console.log('\n📋 Sample Products:');
      const samples = await Product.find().limit(3).select('name category price isActive').lean();
      samples.forEach((p, i) => {
        console.log(`  ${i + 1}. ${p.name} - ${p.price} RWF (${p.isActive ? 'Active' : 'Inactive'})`);
      });
    }

    // Step 4: Verify flags
    console.log('\n🔍 Step 3: Verifying Feature Flags...');
    const enabledFlags = await FeatureFlag.find({ enabled: true }).lean();
    console.log(`  Enabled Flags: ${enabledFlags.length}`);
    enabledFlags.forEach(f => {
      console.log(`  ✅ ${f.name}`);
    });

    console.log('\n✅ Search Fix Complete!\n');
    console.log('🧪 Test Search:');
    console.log('  1. Health Check:');
    console.log('     GET http://localhost:5000/api/v2/search/health\n');
    console.log('  2. Search Products:');
    console.log('     POST http://localhost:5000/api/v2/search');
    console.log('     Body: { "query": "test" }\n');
    console.log('  3. Or just refresh your frontend and try searching!\n');

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('\nTroubleshooting:');
    console.error('  1. Make sure MongoDB is running');
    console.error('  2. Check connection string in .env');
    console.error('  3. Restart backend server after running this script\n');
    process.exit(1);
  }
}

fixSearch();
