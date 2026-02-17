const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({ path: './backend/.env' });

const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/ecommerce';

// Feature Flag Schema
const featureFlagSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, index: true },
  enabled: { type: Boolean, default: false },
  rolloutPercentage: { type: Number, min: 0, max: 100, default: 0 },
  targetSegments: [{ type: String, enum: ['new', 'returning', 'vip', 'all'] }],
  targetSkus: [String],
  description: String,
  metadata: {
    createdBy: String,
    lastModifiedBy: String,
    notes: String
  }
}, { timestamps: true });

const FeatureFlag = mongoose.model('FeatureFlag', featureFlagSchema);

async function fixSearchFeatureFlags() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Connected to MongoDB');

    // Check and enable search.v2.enabled flag
    const searchV2Flag = await FeatureFlag.findOne({ name: 'search.v2.enabled' });
    
    if (!searchV2Flag) {
      console.log('Creating search.v2.enabled feature flag...');
      await FeatureFlag.create({
        name: 'search.v2.enabled',
        enabled: true,
        rolloutPercentage: 100,
        targetSegments: ['all'],
        description: 'Enable Search V2 with hybrid search capabilities'
      });
      console.log('✅ Created and enabled search.v2.enabled flag');
    } else if (!searchV2Flag.enabled) {
      console.log('Enabling search.v2.enabled feature flag...');
      searchV2Flag.enabled = true;
      searchV2Flag.rolloutPercentage = 100;
      searchV2Flag.targetSegments = ['all'];
      await searchV2Flag.save();
      console.log('✅ Enabled search.v2.enabled flag');
    } else {
      console.log('✅ search.v2.enabled flag is already enabled');
    }

    // Check and enable search.recommendations.enabled flag
    const recoFlag = await FeatureFlag.findOne({ name: 'search.recommendations.enabled' });
    
    if (!recoFlag) {
      console.log('Creating search.recommendations.enabled feature flag...');
      await FeatureFlag.create({
        name: 'search.recommendations.enabled',
        enabled: true,
        rolloutPercentage: 100,
        targetSegments: ['all'],
        description: 'Enable personalized recommendations'
      });
      console.log('✅ Created and enabled search.recommendations.enabled flag');
    } else if (!recoFlag.enabled) {
      console.log('Enabling search.recommendations.enabled feature flag...');
      recoFlag.enabled = true;
      recoFlag.rolloutPercentage = 100;
      recoFlag.targetSegments = ['all'];
      await recoFlag.save();
      console.log('✅ Enabled search.recommendations.enabled flag');
    } else {
      console.log('✅ search.recommendations.enabled flag is already enabled');
    }

    // List all feature flags
    console.log('\n📋 All Feature Flags:');
    const allFlags = await FeatureFlag.find({});
    allFlags.forEach(flag => {
      console.log(`  - ${flag.name}: ${flag.enabled ? '✅ ENABLED' : '❌ DISABLED'} (${flag.rolloutPercentage}%)`);
    });

    console.log('\n✅ Search feature flags are now properly configured!');
    console.log('You can now use Search V2 at http://localhost:5000/api/v2/search');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Disconnected from MongoDB');
    process.exit(0);
  }
}

fixSearchFeatureFlags();
