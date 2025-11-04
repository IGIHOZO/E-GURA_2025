require('dotenv').config();
const { sequelize, Order } = require('./models-postgres');

async function checkOrderData() {
  try {
    console.log('🔍 Checking database connection...');
    console.log('✅ Models loaded!\n');

    // Fetch the most recent order
    const order = await Order.findOne({
      order: [['createdAt', 'DESC']]
    });

    if (!order) {
      console.log('❌ No orders found in database');
      process.exit(0);
    }

    console.log('📦 Most Recent Order:');
    console.log('Order ID:', order.id);
    console.log('Order Number:', order.orderNumber);
    console.log('Status:', order.status);
    console.log('\n📋 Items Data Structure:');
    console.log(JSON.stringify(order.items, null, 2));

    if (order.items && order.items.length > 0) {
      console.log('\n🔍 First Item Fields:');
      const item = order.items[0];
      console.log('- product:', item.product);
      console.log('- productId:', item.productId);
      console.log('- name:', item.name);
      console.log('- productName:', item.productName);
      console.log('- image:', item.image);
      console.log('- mainImage:', item.mainImage);
      console.log('- productImage:', item.productImage);
      console.log('- images:', item.images);
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkOrderData();
