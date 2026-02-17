const mongoose = require('mongoose');
require('dotenv').config();

const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/ecommerce';

// Define FeatureFlag schema inline
const featureFlagSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true,
    unique: true,
    index: true 
  },
  enabled: { 
    type: Boolean, 
    default: false 
  },
  rolloutPercentage: { 
    type: Number, 
    min: 0,
    max: 100,
    default: 0
  },
  targetSegments: [{
    type: String,
    enum: ['new', 'returning', 'vip', 'all']
  }],
  targetSkus: [String],
  description: String,
  metadata: {
    createdBy: String,
    lastModifiedBy: String,
    notes: String
  }
}, {
  timestamps: true
});

const FeatureFlag = mongoose.model('FeatureFlag', featureFlagSchema);

async function enableSearchV2() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Enable Search V2 feature flags
    const flags = [
      {
        name: 'search.v2.enabled',
        enabled: true,
        rolloutPercentage: 100,
        targetSegments: ['all'],
        description: 'Enable Search V2 with hybrid search (BM25 + Vector)'
      },
      {
        name: 'search.recommendations.enabled',
        enabled: true,
        rolloutPercentage: 100,
        targetSegments: ['all'],
        description: 'Enable personalized recommendations'
      },
      {
        name: 'search.v1.enabled',
        enabled: true,
        rolloutPercentage: 100,
        targetSegments: ['all'],
        description: 'Enable Search V1 (legacy fallback)'
      }
    ];

    console.log('\n🚀 Enabling search feature flags...');
    for (const flag of flags) {
      const result = await FeatureFlag.findOneAndUpdate(
        { name: flag.name },
        flag,
        { upsert: true, new: true }
      );
      console.log(`✅ ${flag.name}: ${result.enabled ? 'ENABLED' : 'DISABLED'} (${result.rolloutPercentage}%)`);
    }

    console.log('\n✅ All search feature flags enabled successfully!');
    console.log('\n📊 Current feature flags:');
    const allFlags = await FeatureFlag.find({ name: /^search\./ }).lean();
    allFlags.forEach(flag => {
      console.log(`  - ${flag.name}: ${flag.enabled ? '✅ ENABLED' : '❌ DISABLED'} (${flag.rolloutPercentage}%)`);
    });

    await mongoose.connection.close();
    console.log('\n✅ Done! Search V2 is now enabled.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

enableSearchV2();
