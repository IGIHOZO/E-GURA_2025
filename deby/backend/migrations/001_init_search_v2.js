/**
 * Migration: Initialize Search V2
 * Creates feature flags and initial data
 */

const mongoose = require('mongoose');
const FeatureFlag = require('../models/FeatureFlag');
const Synonym = require('../models/Synonym');

async function up() {
  console.log('🚀 Running migration: Initialize Search V2');

  try {
    // 1. Create feature flags
    const flags = [
      {
        name: 'search.v2.enabled',
        enabled: true,
        rolloutPercentage: 100,
        targetSegments: ['all'],
        description: 'Enable Search V2 with hybrid search and personalization',
        metadata: {
          createdBy: 'system',
          notes: 'Main feature flag for Search V2'
        }
      },
      {
        name: 'search.v1.enabled',
        enabled: false,
        rolloutPercentage: 0,
        targetSegments: ['all'],
        description: 'Legacy search system (for rollback)',
        metadata: {
          createdBy: 'system',
          notes: 'Keep disabled unless rolling back'
        }
      },
      {
        name: 'search.personalization.enabled',
        enabled: true,
        rolloutPercentage: 100,
        targetSegments: ['all'],
        description: 'Enable personalized search results and recommendations',
        metadata: {
          createdBy: 'system',
          notes: 'Can be disabled for privacy compliance'
        }
      },
      {
        name: 'search.vector.enabled',
        enabled: true,
        rolloutPercentage: 100,
        targetSegments: ['all'],
        description: 'Enable vector similarity search',
        metadata: {
          createdBy: 'system',
          notes: 'Falls back to keyword-only if disabled'
        }
      }
    ];

    for (const flagData of flags) {
      await FeatureFlag.findOneAndUpdate(
        { name: flagData.name },
        flagData,
        { upsert: true, new: true }
      );
      console.log(`✅ Created/updated feature flag: ${flagData.name}`);
    }

    // 2. Create initial synonyms
    const synonyms = [
      { term: 'dress', variants: ['gown', 'frock', 'outfit'] },
      { term: 'shirt', variants: ['blouse', 'top', 'tee'] },
      { term: 'pants', variants: ['trousers', 'slacks', 'jeans'] },
      { term: 'shoes', variants: ['footwear', 'sneakers', 'boots'] },
      { term: 'bag', variants: ['purse', 'handbag', 'tote'] },
      { term: 'jacket', variants: ['coat', 'blazer', 'cardigan'] },
      { term: 'skirt', variants: ['mini', 'maxi', 'midi'] },
      { term: 'red', variants: ['crimson', 'scarlet', 'burgundy'] },
      { term: 'blue', variants: ['navy', 'azure', 'cobalt'] },
      { term: 'black', variants: ['dark', 'ebony', 'noir'] },
      { term: 'white', variants: ['ivory', 'cream', 'pearl'] },
      { term: 'cheap', variants: ['affordable', 'budget', 'inexpensive'] },
      { term: 'expensive', variants: ['premium', 'luxury', 'high-end'] },
      { term: 'new', variants: ['latest', 'fresh', 'recent'] },
      { term: 'sale', variants: ['discount', 'offer', 'deal'] }
    ];

    for (const synData of synonyms) {
      await Synonym.findOneAndUpdate(
        { term: synData.term },
        { ...synData, isActive: true, createdBy: 'system' },
        { upsert: true, new: true }
      );
    }
    console.log(`✅ Created ${synonyms.length} synonym entries`);

    console.log('✅ Migration completed successfully');
    return { success: true };
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

async function down() {
  console.log('🔄 Rolling back migration: Initialize Search V2');

  try {
    // Remove feature flags
    await FeatureFlag.deleteMany({ name: /^search\./ });
    console.log('✅ Removed feature flags');

    // Remove synonyms created by system
    await Synonym.deleteMany({ createdBy: 'system' });
    console.log('✅ Removed system synonyms');

    console.log('✅ Rollback completed');
    return { success: true };
  } catch (error) {
    console.error('❌ Rollback failed:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  const mongoose = require('mongoose');
  require('dotenv').config();

  mongoose.connect(process.env.MONGODB_URI)
    .then(async () => {
      console.log('📦 Connected to MongoDB');
      const action = process.argv[2] || 'up';
      
      if (action === 'up') {
        await up();
      } else if (action === 'down') {
        await down();
      } else {
        console.error('Usage: node 001_init_search_v2.js [up|down]');
      }
      
      await mongoose.disconnect();
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Database connection failed:', error);
      process.exit(1);
    });
}

module.exports = { up, down };
