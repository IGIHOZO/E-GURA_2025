// Sync Order model with database
require('dotenv').config();
const { sequelize } = require('./config/database');
const Order = require('./models-postgres/Order');

async function syncOrderModel() {
  try {
    console.log('🔄 Syncing Order model with database...');
    
    // Sync Order model - alter: true will update existing tables
    await Order.sync({ alter: true });
    
    console.log('✅ Order model synced successfully!');
    console.log('📊 Model structure:');
    console.log('   - userId: UUID (nullable)');
    console.log('   - orderNumber: STRING');
    console.log('   - items: JSONB');
    console.log('   - totalAmount: DECIMAL');
    console.log('   - total: DECIMAL');
    console.log('   - status: ENUM');
    console.log('   - shippingAddress: JSONB');
    console.log('   - customerInfo: JSONB');
    
    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error syncing Order model:', error);
    process.exit(1);
  }
}

syncOrderModel();
