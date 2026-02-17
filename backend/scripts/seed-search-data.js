/**
 * Seed Search V2 Data
 * Generates demo events and synonyms for testing
 */

const mongoose = require('mongoose');
const UserEvent = require('../models/UserEvent');
const Synonym = require('../models/Synonym');
const Product = require('../models/Product');
require('dotenv').config();

async function seedEvents() {
  console.log('🌱 Seeding user events...');

  const products = await Product.find({ isActive: true }).limit(20).lean();
  if (products.length === 0) {
    console.log('⚠️ No products found. Please seed products first.');
    return;
  }

  const deviceIds = [
    'demo_device_1',
    'demo_device_2',
    'demo_device_3',
    'demo_device_4',
    'demo_device_5'
  ];

  const eventTypes = ['search', 'view', 'click', 'add_to_cart', 'purchase'];
  const queries = [
    'dress', 'shirt', 'shoes', 'bag', 'jacket',
    'red dress', 'blue shirt', 'black shoes',
    'summer dress', 'casual wear', 'formal wear'
  ];

  const events = [];
  const now = Date.now();

  // Generate 500 demo events
  for (let i = 0; i < 500; i++) {
    const deviceId = deviceIds[Math.floor(Math.random() * deviceIds.length)];
    const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
    const product = products[Math.floor(Math.random() * products.length)];
    
    const event = {
      deviceId,
      sessionId: `session_${deviceId}_${Math.floor(i / 10)}`,
      eventType,
      timestamp: new Date(now - Math.random() * 7 * 24 * 60 * 60 * 1000), // Last 7 days
    };

    if (eventType === 'search') {
      event.query = queries[Math.floor(Math.random() * queries.length)];
    } else {
      event.productId = product._id;
      event.category = product.category;
    }

    if (eventType === 'purchase' || eventType === 'add_to_cart') {
      event.priceAtTime = product.price;
      event.quantity = Math.floor(Math.random() * 3) + 1;
    }

    if (eventType === 'view') {
      event.dwellTime = Math.floor(Math.random() * 120) + 10; // 10-130 seconds
    }

    events.push(event);
  }

  // Bulk insert
  await UserEvent.insertMany(events);
  console.log(`✅ Created ${events.length} demo events`);
}

async function seedSynonyms() {
  console.log('🌱 Seeding synonyms...');

  const synonyms = [
    // Clothing
    { term: 'dress', variants: ['gown', 'frock', 'outfit', 'attire'] },
    { term: 'shirt', variants: ['blouse', 'top', 'tee', 't-shirt', 'polo'] },
    { term: 'pants', variants: ['trousers', 'slacks', 'jeans', 'chinos'] },
    { term: 'shorts', variants: ['bermuda', 'cutoffs'] },
    { term: 'skirt', variants: ['mini', 'maxi', 'midi'] },
    { term: 'jacket', variants: ['coat', 'blazer', 'cardigan', 'hoodie'] },
    { term: 'sweater', variants: ['pullover', 'jumper', 'knit'] },
    
    // Footwear
    { term: 'shoes', variants: ['footwear', 'sneakers', 'boots', 'sandals', 'heels'] },
    { term: 'sneakers', variants: ['trainers', 'kicks', 'runners'] },
    { term: 'boots', variants: ['booties', 'ankle boots'] },
    
    // Accessories
    { term: 'bag', variants: ['purse', 'handbag', 'tote', 'clutch', 'backpack'] },
    { term: 'belt', variants: ['waistband', 'strap'] },
    { term: 'hat', variants: ['cap', 'beanie', 'fedora'] },
    { term: 'scarf', variants: ['shawl', 'wrap'] },
    
    // Colors
    { term: 'red', variants: ['crimson', 'scarlet', 'burgundy', 'maroon'] },
    { term: 'blue', variants: ['navy', 'azure', 'cobalt', 'royal blue'] },
    { term: 'black', variants: ['dark', 'ebony', 'noir'] },
    { term: 'white', variants: ['ivory', 'cream', 'pearl', 'off-white'] },
    { term: 'green', variants: ['emerald', 'olive', 'lime'] },
    { term: 'yellow', variants: ['gold', 'mustard', 'lemon'] },
    { term: 'pink', variants: ['rose', 'blush', 'coral'] },
    { term: 'purple', variants: ['violet', 'lavender', 'plum'] },
    { term: 'brown', variants: ['tan', 'beige', 'khaki', 'camel'] },
    { term: 'gray', variants: ['grey', 'silver', 'charcoal'] },
    
    // Styles
    { term: 'casual', variants: ['everyday', 'relaxed', 'informal'] },
    { term: 'formal', variants: ['dressy', 'elegant', 'sophisticated'] },
    { term: 'sporty', variants: ['athletic', 'active', 'gym'] },
    { term: 'vintage', variants: ['retro', 'classic', 'antique'] },
    { term: 'modern', variants: ['contemporary', 'current', 'trendy'] },
    
    // Occasions
    { term: 'party', variants: ['celebration', 'event', 'festive'] },
    { term: 'wedding', variants: ['bridal', 'ceremony'] },
    { term: 'work', variants: ['office', 'professional', 'business'] },
    { term: 'summer', variants: ['warm weather', 'hot season'] },
    { term: 'winter', variants: ['cold weather', 'snow season'] },
    
    // Descriptors
    { term: 'cheap', variants: ['affordable', 'budget', 'inexpensive', 'economical'] },
    { term: 'expensive', variants: ['premium', 'luxury', 'high-end', 'designer'] },
    { term: 'new', variants: ['latest', 'fresh', 'recent', 'newest'] },
    { term: 'sale', variants: ['discount', 'offer', 'deal', 'clearance'] },
    { term: 'comfortable', variants: ['comfy', 'cozy', 'soft'] },
    { term: 'stylish', variants: ['fashionable', 'chic', 'trendy'] },
    { term: 'beautiful', variants: ['pretty', 'gorgeous', 'lovely', 'stunning'] },
    { term: 'quality', variants: ['premium', 'high-quality', 'durable'] }
  ];

  for (const synData of synonyms) {
    await Synonym.findOneAndUpdate(
      { term: synData.term },
      { ...synData, isActive: true, createdBy: 'seed' },
      { upsert: true, new: true }
    );
  }

  console.log(`✅ Created/updated ${synonyms.length} synonym entries`);
}

async function main() {
  try {
    console.log('🚀 Starting seed process...');
    
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('📦 Connected to MongoDB');

    await seedSynonyms();
    await seedEvents();

    console.log('✅ Seed completed successfully!');
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { seedEvents, seedSynonyms };
