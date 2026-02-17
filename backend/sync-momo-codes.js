const { sequelize } = require('./config/database');
const { MomoCode } = require('./models');

const syncMomoCodesTable = async () => {
  try {
    console.log('🔄 Syncing MOMO codes table...');
    
    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connection established');
    
    // Sync the MomoCode model (create table if it doesn't exist)
    await MomoCode.sync({ alter: true });
    console.log('✅ MOMO codes table synced successfully');
    
    // Check if we have any MOMO codes, if not, create a default one
    const existingCodes = await MomoCode.findAll();
    
    if (existingCodes.length === 0) {
      console.log('📱 Creating default MOMO code...');
      
      const defaultCode = await MomoCode.create({
        name: 'Uwase Store Account',
        phoneNumber: '250782540683',
        accountName: 'Uwase',
        description: 'Primary store account for mobile money payments',
        isActive: true,
        isPrimary: true,
        displayOrder: 1,
        network: 'MTN',
        instructions: 'Please include your order number in the payment message'
      });
      
      console.log('✅ Default MOMO code created:', defaultCode.phoneNumber);
    } else {
      console.log(`📱 Found ${existingCodes.length} existing MOMO codes`);
    }
    
    console.log('🎉 MOMO codes setup completed successfully!');
    
  } catch (error) {
    console.error('❌ Error syncing MOMO codes table:', error);
    throw error;
  } finally {
    await sequelize.close();
  }
};

// Run the sync if this file is executed directly
if (require.main === module) {
  syncMomoCodesTable()
    .then(() => {
      console.log('✅ Sync completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Sync failed:', error);
      process.exit(1);
    });
}

module.exports = { syncMomoCodesTable };
