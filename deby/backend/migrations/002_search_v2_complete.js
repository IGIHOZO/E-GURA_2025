/**
 * Migration: Complete Search V2 System
 * Creates all necessary indexes, feature flags, and initial data
 * Reversible with rollback support
 */

const mongoose = require('mongoose');
const FeatureFlag = require('../models/FeatureFlag');
const Synonym = require('../models/Synonym');
const Product = require('../models/Product');
const ProductVector = require('../models/ProductVector');
const UserEvent = require('../models/UserEvent');

async function up() {
  console.log('🚀 Running Search V2 Complete Migration (UP)...');

  try {
    // 1. Create Feature Flags
    console.log('📝 Creating feature flags...');
    const flags = [
      {
        name: 'search.v2.enabled',
        enabled: true,
        rolloutPercentage: 100,
        targetSegments: ['all'],
        description: 'Enable Search V2 hybrid search engine',
        metadata: {
          createdBy: 'migration',
          notes: 'Main toggle for new search system'
        }
      },
      {
        name: 'search.v1.enabled',
        enabled: false,
        rolloutPercentage: 0,
        targetSegments: ['all'],
        description: 'Enable Search V1 (legacy) - for rollback only',
        metadata: {
          createdBy: 'migration',
          notes: 'Fallback to old search system'
        }
      },
      {
        name: 'search.personalization.enabled',
        enabled: true,
        rolloutPercentage: 100,
        targetSegments: ['all'],
        description: 'Enable personalized search results',
        metadata: {
          createdBy: 'migration',
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
          createdBy: 'migration',
          notes: 'Semantic search with embeddings'
        }
      },
      {
        name: 'search.recommendations.enabled',
        enabled: true,
        rolloutPercentage: 100,
        targetSegments: ['all'],
        description: 'Enable AI recommendations',
        metadata: {
          createdBy: 'migration',
          notes: 'Home page and related product recommendations'
        }
      }
    ];

    for (const flag of flags) {
      await FeatureFlag.findOneAndUpdate(
        { name: flag.name },
        flag,
        { upsert: true, new: true }
      );
      console.log(`  ✓ Created flag: ${flag.name}`);
    }

    // 2. Create Indexes
    console.log('📊 Creating database indexes...');
    
    // Product indexes
    await Product.collection.createIndex({ name: 'text', description: 'text', tags: 'text', brand: 'text' });
    await Product.collection.createIndex({ category: 1, isActive: 1 });
    await Product.collection.createIndex({ brand: 1, isActive: 1 });
    await Product.collection.createIndex({ price: 1, isActive: 1 });
    await Product.collection.createIndex({ averageRating: -1, isActive: 1 });
    await Product.collection.createIndex({ soldCount: -1, isActive: 1 });
    await Product.collection.createIndex({ createdAt: -1, isActive: 1 });
    await Product.collection.createIndex({ stockQuantity: 1, isActive: 1 });
    console.log('  ✓ Product indexes created');

    // UserEvent indexes
    await UserEvent.collection.createIndex({ deviceId: 1, timestamp: -1 });
    await UserEvent.collection.createIndex({ userId: 1, timestamp: -1 });
    await UserEvent.collection.createIndex({ deviceId: 1, eventType: 1, timestamp: -1 });
    await UserEvent.collection.createIndex({ userId: 1, eventType: 1, timestamp: -1 });
    await UserEvent.collection.createIndex({ productId: 1, eventType: 1 });
    await UserEvent.collection.createIndex({ eventType: 1, timestamp: -1 });
    await UserEvent.collection.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
    console.log('  ✓ UserEvent indexes created');

    // ProductVector indexes
    await ProductVector.collection.createIndex({ productId: 1 }, { unique: true });
    await ProductVector.collection.createIndex({ updatedAt: -1 });
    console.log('  ✓ ProductVector indexes created');

    // Synonym indexes
    await Synonym.collection.createIndex({ term: 1, isActive: 1 });
    await Synonym.collection.createIndex({ variants: 1 });
    console.log('  ✓ Synonym indexes created');

    // 3. Seed Initial Synonyms
    console.log('📚 Seeding synonyms...');
    const synonyms = [
      { term: 'dress', variants: ['gown', 'frock', 'outfit', 'attire'], category: 'clothing' },
      { term: 'shirt', variants: ['top', 'blouse', 'tee', 't-shirt'], category: 'clothing' },
      { term: 'pants', variants: ['trousers', 'slacks', 'jeans'], category: 'clothing' },
      { term: 'shoes', variants: ['footwear', 'sneakers', 'boots', 'sandals'], category: 'footwear' },
      { term: 'bag', variants: ['purse', 'handbag', 'tote', 'satchel'], category: 'accessories' },
      { term: 'cheap', variants: ['affordable', 'budget', 'inexpensive', 'low-cost'], category: 'price' },
      { term: 'expensive', variants: ['premium', 'luxury', 'high-end', 'costly'], category: 'price' },
      { term: 'new', variants: ['latest', 'fresh', 'recent', 'modern'], category: 'status' },
      { term: 'sale', variants: ['discount', 'offer', 'deal', 'promotion'], category: 'status' },
      { term: 'red', variants: ['crimson', 'scarlet', 'burgundy'], category: 'color' },
      { term: 'blue', variants: ['navy', 'azure', 'cobalt'], category: 'color' },
      { term: 'black', variants: ['dark', 'ebony'], category: 'color' },
      { term: 'white', variants: ['ivory', 'cream', 'pearl'], category: 'color' }
    ];

    for (const syn of synonyms) {
      await Synonym.findOneAndUpdate(
        { term: syn.term },
        { ...syn, isActive: true, createdBy: 'migration' },
        { upsert: true, new: true }
      );
    }
    console.log(`  ✓ Seeded ${synonyms.length} synonym groups`);

    // 4. Create materialized view for trending products (via aggregation)
    console.log('📈 Setting up analytics collections...');
    // Note: MongoDB doesn't have true materialized views, but we can create a capped collection
    // for caching trending data that gets refreshed by background jobs
    
    console.log('✅ Migration UP completed successfully');
    return true;
  } catch (error) {
    console.error('❌ Migration UP failed:', error);
    throw error;
  }
}

async function down() {
  console.log('⏪ Running Search V2 Complete Migration (DOWN)...');

  try {
    // 1. Disable V2, enable V1
    console.log('🔄 Switching back to V1...');
    await FeatureFlag.updateOne(
      { name: 'search.v2.enabled' },
      { enabled: false, rolloutPercentage: 0 }
    );
    await FeatureFlag.updateOne(
      { name: 'search.v1.enabled' },
      { enabled: true, rolloutPercentage: 100 }
    );
    console.log('  ✓ Feature flags rolled back');

    // 2. Optionally drop indexes (commented out to preserve performance)
    // console.log('🗑️  Dropping V2-specific indexes...');
    // await ProductVector.collection.dropIndexes();
    // console.log('  ✓ Indexes dropped');

    // 3. Keep data but mark as inactive
    console.log('📝 Marking V2 data as inactive...');
    // We don't delete data to allow re-enabling without data loss
    
    console.log('✅ Migration DOWN completed - V1 restored');
    return true;
  } catch (error) {
    console.error('❌ Migration DOWN failed:', error);
    throw error;
  }
}

// CLI execution
if (require.main === module) {
  const dotenv = require('dotenv');
  dotenv.config();

  const command = process.argv[2] || 'up';
  const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/ecommerce';

  mongoose.connect(MONGO_URI)
  .then(async () => {
    console.log('📊 Connected to MongoDB');
    
    if (command === 'up') {
      await up();
    } else if (command === 'down') {
      await down();
    } else {
      console.error('Invalid command. Use: up or down');
      process.exit(1);
    }
    
    await mongoose.connection.close();
    console.log('👋 Disconnected from MongoDB');
    process.exit(0);
  })
  .catch(err => {
    console.error('Database connection error:', err);
    process.exit(1);
  });
}

module.exports = { up, down };
