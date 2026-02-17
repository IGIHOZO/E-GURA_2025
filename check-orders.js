// Quick script to check orders in database
const { Order } = require('./backend/models');

(async () => {
  try {
    const orders = await Order.findAll({
      order: [['createdAt', 'DESC']]
    });
    
    console.log('\n📦 CHECKING ORDERS IN DATABASE\n');
    console.log('Total orders:', orders.length);
    console.log('\n');
    
    if (orders.length > 0) {
      console.log('Orders found:');
      orders.forEach((order, index) => {
        const phone = order.customerInfo?.phoneNumber || order.shippingAddress?.phone;
        const email = order.customerInfo?.email || order.shippingAddress?.email;
        console.log(`${index + 1}. ${order.orderNumber}`);
        console.log(`   Phone: ${phone}`);
        console.log(`   Email: ${email}`);
        console.log(`   Status: ${order.status}`);
        console.log(`   Total: ${order.total} RWF`);
        console.log('');
      });
    } else {
      console.log('⚠️  NO ORDERS IN DATABASE');
      console.log('This is why account shows 0 orders.');
      console.log('Place an order through checkout to test.');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
})();
