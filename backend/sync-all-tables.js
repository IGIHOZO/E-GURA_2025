const { sequelize } = require('./config/database');

// Import all models to ensure they're registered
const Product = require('./models-postgres/Product');
const User = require('./models-postgres/User');

/**
 * Sync all database tables
 * This will create/update tables for all models
 */

async function syncAllTables() {
  try {
    console.log('🔄 Syncing all database tables...\n');

    // Test connection
    await sequelize.authenticate();
    console.log('✅ Database connection established\n');

    // Sync all models with alter: true (updates schema without dropping tables)
    console.log('📊 Updating table structures...');
    await sequelize.sync({ alter: true });

    console.log('\n✅ All database tables synchronized successfully!');
    console.log('\n📝 Tables synced:');
    console.log('   - Products (product catalog)');
    console.log('   - Users (authentication & profiles)');
    console.log('\n💡 Database is ready for use!\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error syncing tables:', error);
    console.error('\nDetails:', error.message);
    process.exit(1);
  }
}

// Run sync
syncAllTables();
