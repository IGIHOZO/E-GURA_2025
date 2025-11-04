/**
 * Search Diagnostics Script
 * Checks all search-related components and fixes issues
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/ecommerce';

async function diagnoseSearch() {
  console.log('🔍 Starting Search Diagnostics...\n');

  try {
    // 1. Connect to MongoDB
    console.log('📊 Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000
    });
    console.log('✅ MongoDB connected\n');

    // 2. Check Feature Flags
    console.log('🚩 Checking Feature Flags...');
    const FeatureFlag = require('./backend/models/FeatureFlag');
    
    const searchV2Flag = await FeatureFlag.findOne({ name: 'search.v2.enabled' });
    console.log('search.v2.enabled:', searchV2Flag ? 
      `${searchV2Flag.enabled ? '✅ ENABLED' : '❌ DISABLED'}` : 
      '⚠️  NOT FOUND');

    if (!searchV2Flag || !searchV2Flag.enabled) {
      console.log('🔧 Fixing: Enabling search.v2.enabled...');
      await FeatureFlag.findOneAndUpdate(
        { name: 'search.v2.enabled' },
        { 
          name: 'search.v2.enabled',
          enabled: true,
          rolloutPercentage: 100,
          targetSegments: ['all'],
          description: 'Enable Search V2 hybrid search engine'
        },
        { upsert: true, new: true }
      );
      console.log('✅ search.v2.enabled is now ENABLED\n');
    } else {
      console.log('✅ search.v2.enabled is already enabled\n');
    }

    // 3. Check Products
    console.log('📦 Checking Products...');
    const Product = require('./backend/models/Product');
    const productCount = await Product.countDocuments({ isActive: true });
    console.log(`Found ${productCount} active products`);
    
    if (productCount === 0) {
      console.log('⚠️  No products found. Search will return empty results.\n');
    } else {
      console.log('✅ Products available for search\n');
    }

    // 4. Check Indexes
    console.log('📊 Checking Database Indexes...');
    const productIndexes = await Product.collection.getIndexes();
    console.log('Product indexes:', Object.keys(productIndexes).join(', '));
    
    const hasTextIndex = Object.keys(productIndexes).some(key => key.includes('text'));
    if (!hasTextIndex) {
      console.log('🔧 Creating text index for products...');
      await Product.collection.createIndex({ 
        name: 'text', 
        description: 'text', 
        tags: 'text', 
        brand: 'text' 
      });
      console.log('✅ Text index created\n');
    } else {
      console.log('✅ Text index exists\n');
    }

    // 5. Check Required Models
    console.log('📋 Checking Required Models...');
    const models = [
      'ProductVector',
      'Synonym',
      'UserEvent'
    ];

    for (const modelName of models) {
      try {
        const Model = require(`./backend/models/${modelName}`);
        const count = await Model.countDocuments();
        console.log(`✅ ${modelName}: ${count} documents`);
      } catch (error) {
        console.log(`⚠️  ${modelName}: Model may not exist or has issues`);
      }
    }
    console.log('');

    // 6. Test Search Engine
    console.log('🔍 Testing Search Engine...');
    const searchEngineV2 = require('./backend/services/searchEngineV2');
    
    try {
      const testResult = await searchEngineV2.search({
        query: 'dress',
        filters: {},
        sortBy: 'relevance',
        page: 1,
        limit: 5
      });
      
      console.log('✅ Search engine working!');
      console.log(`   Found ${testResult.pagination.total} results for "dress"`);
      console.log(`   Latency: ${testResult.performance.latency}ms\n`);
    } catch (error) {
      console.log('❌ Search engine error:', error.message);
      console.log('   Stack:', error.stack, '\n');
    }

    // 7. Summary
    console.log('═══════════════════════════════════════');
    console.log('📊 DIAGNOSIS SUMMARY');
    console.log('═══════════════════════════════════════');
    console.log(`✅ MongoDB: Connected`);
    console.log(`${searchV2Flag?.enabled ? '✅' : '❌'} Feature Flag: ${searchV2Flag?.enabled ? 'Enabled' : 'Disabled/Missing'}`);
    console.log(`${productCount > 0 ? '✅' : '⚠️ '} Products: ${productCount} active`);
    console.log(`${hasTextIndex ? '✅' : '❌'} Text Index: ${hasTextIndex ? 'Present' : 'Missing'}`);
    console.log('═══════════════════════════════════════\n');

    if (searchV2Flag?.enabled && productCount > 0 && hasTextIndex) {
      console.log('🎉 Search should be working now!');
      console.log('   Try searching on: http://localhost:3000/shop');
    } else {
      console.log('⚠️  Some issues detected. Please check the logs above.');
    }

  } catch (error) {
    console.error('❌ Diagnostic Error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await mongoose.connection.close();
    console.log('\n👋 Disconnected from MongoDB');
    process.exit(0);
  }
}

diagnoseSearch();
