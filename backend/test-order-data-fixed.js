require('dotenv').config();
const { Order } = require('./models-postgres');

async function checkOrderData() {
  try {
    console.log('🔍 Fetching most recent order...\n');

    // Fetch the most recent order - use "order:" option name conflicts with SQL "order" keyword
    const orders = await Order.findAll({
      limit: 1,
      order: [['createdAt', 'DESC']]
    });

    if (!orders || orders.length === 0) {
      console.log('❌ No orders found in database');
      console.log('💡 Please place a new order to test');
      process.exit(0);
    }

    const order = orders[0];
    
    console.log('📦 Most Recent Order:');
    console.log('Order ID:', order.id);
    console.log('Order Number:', order.orderNumber);
    console.log('Status:', order.status);
    console.log('Created:', order.createdAt);
    console.log('\n📋 Items Data Structure:');
    console.log(JSON.stringify(order.items, null, 2));

    if (order.items && order.items.length > 0) {
      console.log('\n🔍 First Item Analysis:');
      const item = order.items[0];
      console.log('- product:', item.product || 'MISSING');
      console.log('- productId:', item.productId || 'MISSING');
      console.log('- name:', item.name || 'MISSING');
      console.log('- productName:', item.productName || 'MISSING');
      console.log('- image:', item.image || 'MISSING');
      console.log('- mainImage:', item.mainImage || 'MISSING');
      console.log('- productImage:', item.productImage || 'MISSING');
      console.log('- images:', item.images || 'MISSING');
      
      console.log('\n✅ Fields that have data:');
      Object.keys(item).forEach(key => {
        if (item[key]) {
          console.log(`  ✓ ${key}:`, typeof item[key] === 'string' ? item[key].substring(0, 50) : item[key]);
        }
      });
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkOrderData();
