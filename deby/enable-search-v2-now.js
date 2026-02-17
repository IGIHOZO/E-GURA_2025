/**
 * Enable Search V2 Feature Flags
 * Run this to activate the search functionality
 */

const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ecommerce';

async function enableSearchV2() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    const FeatureFlag = mongoose.model('FeatureFlag', new mongoose.Schema({
      name: String,
      enabled: Boolean,
      rolloutPercentage: Number,
      targetSegments: [String],
      description: String,
      metadata: Object
    }, { timestamps: true }));

    // Feature flags to enable
    const flags = [
      {
        name: 'search.v2.enabled',
        enabled: true,
        rolloutPercentage: 100,
        targetSegments: ['all'],
        description: 'Enable Search V2 with hybrid search'
      },
      {
        name: 'search.recommendations.enabled',
        enabled: true,
        rolloutPercentage: 100,
        targetSegments: ['all'],
        description: 'Enable AI recommendations'
      },
      {
        name: 'search.vector.enabled',
        enabled: true,
        rolloutPercentage: 100,
        targetSegments: ['all'],
        description: 'Enable vector similarity search'
      },
      {
        name: 'search.personalization.enabled',
        enabled: true,
        rolloutPercentage: 100,
        targetSegments: ['all'],
        description: 'Enable personalized search results'
      }
    ];

    console.log('\n🚀 Enabling Search V2 feature flags...\n');

    for (const flag of flags) {
      const result = await FeatureFlag.findOneAndUpdate(
        { name: flag.name },
        { $set: flag },
        { upsert: true, new: true }
      );
      console.log(`✅ ${flag.name}: ${result.enabled ? 'ENABLED' : 'DISABLED'}`);
    }

    // Check product count
    const Product = mongoose.model('Product', new mongoose.Schema({}, { strict: false }));
    const productCount = await Product.countDocuments();
    console.log(`\n📦 Products in database: ${productCount}`);

    if (productCount === 0) {
      console.log('\n⚠️  WARNING: No products found in database!');
      console.log('   Please add products via the admin panel before testing search.');
    }

    console.log('\n✅ Search V2 is now ENABLED!');
    console.log('\n📡 Test the search:');
    console.log('   GET  http://localhost:5000/api/v2/search/health');
    console.log('   POST http://localhost:5000/api/v2/search');
    console.log('   Body: { "query": "your search term" }');

    await mongoose.connection.close();
    console.log('\n✅ Done!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

enableSearchV2();
