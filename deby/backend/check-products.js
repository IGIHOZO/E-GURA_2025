// Quick script to check products in database
require('dotenv').config();
const { Product } = require('./models');

async function checkProducts() {
  try {
    console.log('🔍 Checking products in database...\n');
    
    const products = await Product.findAll({
      limit: 10,
      attributes: ['id', 'name', 'price', 'stockQuantity', 'isActive']
    });

    console.log(`📦 Found ${products.length} products:\n`);
    
    if (products.length === 0) {
      console.log('❌ No products found in database!');
      console.log('\n💡 Run: node seed-products.js to add sample products');
    } else {
      products.forEach((p, i) => {
        console.log(`${i + 1}. ${p.name}`);
        console.log(`   Price: ${p.price} RWF | Stock: ${p.stockQuantity} | Active: ${p.isActive}`);
      });
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkProducts();
