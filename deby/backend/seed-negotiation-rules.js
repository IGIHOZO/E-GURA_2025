const mongoose = require('mongoose');
require('dotenv').config();

const NegotiationRule = require('./models/NegotiationRule');
const FeatureFlag = require('./models/FeatureFlag');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ecommerce';

// Seed data for 5 products
const seedRules = [
  {
    sku: 'PROD-001',
    productName: {
      en: 'Premium Wireless Headphones',
      rw: 'Amatwi ya Wireless Premium'
    },
    basePrice: 45000,
    minPrice: 38000,
    maxDiscountPct: 15,
    maxRounds: 3,
    clearanceFlag: false,
    stockLevel: 50,
    bundlePairs: [
      {
        mainSku: 'PROD-001',
        bundleSku: 'PROD-ACC-001',
        bundlePrice: 50000,
        bundleDescription: {
          en: 'Add carrying case for 5,000 RWF',
          rw: 'Ongeraho agasanduku ko kubika kuri 5,000 RWF'
        }
      }
    ],
    segmentRules: [
      { segment: 'new', maxDiscountPct: 10, minPurchaseCount: 0, maxPurchaseCount: 0 },
      { segment: 'returning', maxDiscountPct: 15, minPurchaseCount: 1, maxPurchaseCount: 4 },
      { segment: 'vip', maxDiscountPct: 20, minPurchaseCount: 5, maxPurchaseCount: null }
    ],
    fallbackPerks: {
      freeShipping: { enabled: true, threshold: null },
      freeGift: { 
        enabled: true, 
        giftDescription: { 
          en: 'Free cleaning cloth', 
          rw: 'Igitambaro cyo gusukura ubuntu' 
        } 
      },
      extendedWarranty: { enabled: true, months: 12 }
    },
    enabled: true,
    priority: 1,
    metadata: {
      category: 'Electronics',
      margin: 35,
      costPrice: 29250,
      lastUpdated: new Date(),
      updatedBy: 'system'
    }
  },
  {
    sku: 'PROD-002',
    productName: {
      en: 'Smart Watch Series X',
      rw: 'Isaha Yubwenge Series X'
    },
    basePrice: 85000,
    minPrice: 72000,
    maxDiscountPct: 15,
    maxRounds: 3,
    clearanceFlag: false,
    stockLevel: 30,
    bundlePairs: [
      {
        mainSku: 'PROD-002',
        bundleSku: 'PROD-ACC-002',
        bundlePrice: 95000,
        bundleDescription: {
          en: 'Add extra strap for 10,000 RWF',
          rw: 'Ongeraho umukandara wundi kuri 10,000 RWF'
        }
      }
    ],
    segmentRules: [
      { segment: 'new', maxDiscountPct: 12, minPurchaseCount: 0, maxPurchaseCount: 0 },
      { segment: 'returning', maxDiscountPct: 15, minPurchaseCount: 1, maxPurchaseCount: 4 },
      { segment: 'vip', maxDiscountPct: 18, minPurchaseCount: 5, maxPurchaseCount: null }
    ],
    fallbackPerks: {
      freeShipping: { enabled: true, threshold: null },
      freeGift: { enabled: false, giftDescription: { en: '', rw: '' } },
      extendedWarranty: { enabled: true, months: 24 }
    },
    enabled: true,
    priority: 2,
    metadata: {
      category: 'Electronics',
      margin: 30,
      costPrice: 59500,
      lastUpdated: new Date(),
      updatedBy: 'system'
    }
  },
  {
    sku: 'PROD-003',
    productName: {
      en: 'Leather Messenger Bag',
      rw: 'Agasanduku k\'uruhu'
    },
    basePrice: 35000,
    minPrice: 28000,
    maxDiscountPct: 20,
    maxRounds: 3,
    clearanceFlag: true, // Clearance item
    stockLevel: 15,
    bundlePairs: [],
    segmentRules: [
      { segment: 'new', maxDiscountPct: 18, minPurchaseCount: 0, maxPurchaseCount: 0 },
      { segment: 'returning', maxDiscountPct: 20, minPurchaseCount: 1, maxPurchaseCount: 4 },
      { segment: 'vip', maxDiscountPct: 25, minPurchaseCount: 5, maxPurchaseCount: null }
    ],
    fallbackPerks: {
      freeShipping: { enabled: true, threshold: null },
      freeGift: { enabled: false, giftDescription: { en: '', rw: '' } },
      extendedWarranty: { enabled: false, months: 0 }
    },
    enabled: true,
    priority: 3,
    metadata: {
      category: 'Fashion',
      margin: 40,
      costPrice: 21000,
      lastUpdated: new Date(),
      updatedBy: 'system'
    }
  },
  {
    sku: 'PROD-004',
    productName: {
      en: 'Portable Bluetooth Speaker',
      rw: 'Haut-parleur ya Bluetooth Itwara'
    },
    basePrice: 25000,
    minPrice: 20000,
    maxDiscountPct: 20,
    maxRounds: 3,
    clearanceFlag: false,
    stockLevel: 100,
    bundlePairs: [
      {
        mainSku: 'PROD-004',
        bundleSku: 'PROD-004-BUNDLE',
        bundlePrice: 45000,
        bundleDescription: {
          en: 'Buy 2 speakers, get both for 45,000 RWF',
          rw: 'Gura haut-parleur 2, ubone zombi kuri 45,000 RWF'
        }
      }
    ],
    segmentRules: [
      { segment: 'new', maxDiscountPct: 15, minPurchaseCount: 0, maxPurchaseCount: 0 },
      { segment: 'returning', maxDiscountPct: 20, minPurchaseCount: 1, maxPurchaseCount: 4 },
      { segment: 'vip', maxDiscountPct: 25, minPurchaseCount: 5, maxPurchaseCount: null }
    ],
    fallbackPerks: {
      freeShipping: { enabled: true, threshold: null },
      freeGift: { 
        enabled: true, 
        giftDescription: { 
          en: 'Free AUX cable', 
          rw: 'Insinga ya AUX ubuntu' 
        } 
      },
      extendedWarranty: { enabled: true, months: 6 }
    },
    enabled: true,
    priority: 1,
    metadata: {
      category: 'Electronics',
      margin: 45,
      costPrice: 13750,
      lastUpdated: new Date(),
      updatedBy: 'system'
    }
  },
  {
    sku: 'PROD-005',
    productName: {
      en: 'Fitness Tracker Band',
      rw: 'Umukandara wo Gukurikirana Imyitozo'
    },
    basePrice: 18000,
    minPrice: 15000,
    maxDiscountPct: 16,
    maxRounds: 3,
    clearanceFlag: false,
    stockLevel: 75,
    bundlePairs: [],
    segmentRules: [
      { segment: 'new', maxDiscountPct: 12, minPurchaseCount: 0, maxPurchaseCount: 0 },
      { segment: 'returning', maxDiscountPct: 16, minPurchaseCount: 1, maxPurchaseCount: 4 },
      { segment: 'vip', maxDiscountPct: 20, minPurchaseCount: 5, maxPurchaseCount: null }
    ],
    fallbackPerks: {
      freeShipping: { enabled: true, threshold: null },
      freeGift: { enabled: false, giftDescription: { en: '', rw: '' } },
      extendedWarranty: { enabled: true, months: 12 }
    },
    enabled: true,
    priority: 1,
    metadata: {
      category: 'Electronics',
      margin: 38,
      costPrice: 11160,
      lastUpdated: new Date(),
      updatedBy: 'system'
    }
  }
];

// Feature flag for A/B testing
const featureFlag = {
  name: 'ai_negotiation',
  enabled: true,
  rolloutPercentage: 50, // 50% of users
  targetSegments: ['all'],
  targetSkus: [], // Empty = all SKUs
  description: 'AI-powered price negotiation feature',
  metadata: {
    createdBy: 'system',
    lastModifiedBy: 'system',
    notes: 'Initial rollout at 50% for A/B testing'
  }
};

async function seedNegotiationData() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('✓ Connected to MongoDB');

    // Clear existing data
    console.log('\nClearing existing negotiation rules...');
    await NegotiationRule.deleteMany({});
    console.log('✓ Cleared negotiation rules');

    // Insert rules
    console.log('\nSeeding negotiation rules...');
    for (const rule of seedRules) {
      await NegotiationRule.create(rule);
      console.log(`✓ Created rule for ${rule.sku} - ${rule.productName.en}`);
    }

    // Create feature flag
    console.log('\nCreating feature flag...');
    await FeatureFlag.findOneAndUpdate(
      { name: featureFlag.name },
      featureFlag,
      { upsert: true, new: true }
    );
    console.log('✓ Created feature flag: ai_negotiation');

    // Summary
    console.log('\n========================================');
    console.log('Seed Data Summary');
    console.log('========================================');
    console.log(`Total Rules Created: ${seedRules.length}`);
    console.log(`Feature Flags: 1`);
    console.log('\nProduct Details:');
    seedRules.forEach(rule => {
      console.log(`  ${rule.sku}: ${rule.productName.en}`);
      console.log(`    Base: ${rule.basePrice.toLocaleString()} RWF`);
      console.log(`    Floor: ${rule.minPrice.toLocaleString()} RWF`);
      console.log(`    Max Discount: ${rule.maxDiscountPct}%`);
      console.log(`    Stock: ${rule.stockLevel}`);
      console.log(`    Clearance: ${rule.clearanceFlag ? 'Yes' : 'No'}`);
      console.log('');
    });

    console.log('✓ Seed completed successfully!');
    
    await mongoose.connection.close();
    console.log('✓ Database connection closed');
    
    process.exit(0);
  } catch (error) {
    console.error('✗ Seed failed:', error);
    process.exit(1);
  }
}

// Run seed
if (require.main === module) {
  seedNegotiationData();
}

module.exports = { seedRules, featureFlag };
