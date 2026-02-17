const mongoose = require('mongoose');
require('dotenv').config();
const Product = require('./models/Product');
const NegotiationRule = require('./models/NegotiationRule');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ecommerce';

async function syncRules() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('✓ Connected to MongoDB\n');

    // Get all products
    const products = await Product.find({});
    console.log(`Found ${products.length} products\n`);

    if (products.length === 0) {
      console.log('⚠ No products found in database. Please add products first.');
      await mongoose.connection.close();
      process.exit(0);
    }

    let created = 0;
    let skipped = 0;

    for (const product of products) {
      const sku = product.sku || product._id.toString();
      
      // Check if rule already exists
      let existingRule = await NegotiationRule.findOne({ sku });
      
      if (existingRule) {
        // Update existing rule with latest product settings
        existingRule.basePrice = product.price || existingRule.basePrice;
        existingRule.minPrice = product.minBargainPrice || Math.floor(existingRule.basePrice * 0.75);
        existingRule.maxDiscountPct = product.maxBargainDiscount || 25;
        existingRule.stockLevel = product.stockQuantity || existingRule.stockLevel;
        existingRule.clearanceFlag = product.isSale || false;
        existingRule.enabled = product.bargainEnabled !== undefined ? product.bargainEnabled : true;
        
        await existingRule.save();
        console.log(`✓ Updated: ${product.name}`);
        skipped++;
        continue;
      }

      // Calculate prices using product's bargain settings if available
      const basePrice = product.price || 50000;
      const minPrice = product.minBargainPrice || Math.floor(basePrice * 0.75);
      const maxDiscountPct = product.maxBargainDiscount || 25;
      const bargainStrategy = product.bargainStrategy || 'balanced';
      
      // Adjust segment rules based on strategy
      let segmentRules;
      if (bargainStrategy === 'aggressive') {
        segmentRules = [
          { segment: 'new', maxDiscountPct: maxDiscountPct - 5, minPurchaseCount: 0, maxPurchaseCount: 0 },
          { segment: 'returning', maxDiscountPct: maxDiscountPct, minPurchaseCount: 1, maxPurchaseCount: 4 },
          { segment: 'vip', maxDiscountPct: Math.min(maxDiscountPct + 5, 50), minPurchaseCount: 5, maxPurchaseCount: null }
        ];
      } else if (bargainStrategy === 'conservative') {
        segmentRules = [
          { segment: 'new', maxDiscountPct: Math.max(maxDiscountPct - 10, 5), minPurchaseCount: 0, maxPurchaseCount: 0 },
          { segment: 'returning', maxDiscountPct: Math.max(maxDiscountPct - 5, 10), minPurchaseCount: 1, maxPurchaseCount: 4 },
          { segment: 'vip', maxDiscountPct: maxDiscountPct, minPurchaseCount: 5, maxPurchaseCount: null }
        ];
      } else { // balanced
        segmentRules = [
          { segment: 'new', maxDiscountPct: Math.max(maxDiscountPct - 8, 10), minPurchaseCount: 0, maxPurchaseCount: 0 },
          { segment: 'returning', maxDiscountPct: maxDiscountPct, minPurchaseCount: 1, maxPurchaseCount: 4 },
          { segment: 'vip', maxDiscountPct: Math.min(maxDiscountPct + 3, 40), minPurchaseCount: 5, maxPurchaseCount: null }
        ];
      }
      
      // Create rule
      const rule = await NegotiationRule.create({
        sku: sku,
        productName: {
          en: product.name,
          rw: product.name // Can be translated later
        },
        basePrice: basePrice,
        minPrice: minPrice,
        maxDiscountPct: maxDiscountPct,
        maxRounds: 3,
        clearanceFlag: product.isSale || false,
        stockLevel: product.stockQuantity || 100,
        bundlePairs: [],
        segmentRules: segmentRules,
        fallbackPerks: {
          freeShipping: { 
            enabled: true, 
            threshold: null 
          },
          freeGift: { 
            enabled: true, 
            giftDescription: { 
              en: 'Free gift with purchase', 
              rw: 'Impano ubuntu' 
            } 
          },
          extendedWarranty: { 
            enabled: true, 
            months: 12 
          }
        },
        enabled: true,
        priority: 1,
        metadata: {
          category: product.category || 'General',
          margin: 35,
          costPrice: Math.floor(basePrice * 0.65),
          lastUpdated: new Date(),
          updatedBy: 'system'
        }
      });

      console.log(`✓ Created: ${product.name}`);
      console.log(`  SKU: ${sku}`);
      console.log(`  Base Price: ${basePrice.toLocaleString()} RWF`);
      console.log(`  Min Price: ${minPrice.toLocaleString()} RWF`);
      console.log(`  Max Discount: 25%\n`);
      created++;
    }

    console.log('========================================');
    console.log('Sync Summary');
    console.log('========================================');
    console.log(`Total Products: ${products.length}`);
    console.log(`Rules Created: ${created}`);
    console.log(`Rules Skipped: ${skipped}`);
    console.log('========================================\n');

    if (created > 0) {
      console.log('✓ All products are now available for negotiation!');
    } else {
      console.log('✓ All products already had negotiation rules.');
    }

    await mongoose.connection.close();
    console.log('✓ Database connection closed');
    
    process.exit(0);
  } catch (error) {
    console.error('✗ Sync failed:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

// Run sync
if (require.main === module) {
  syncRules();
}

module.exports = syncRules;
