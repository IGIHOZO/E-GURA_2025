const { sequelize } = require('./config/database');
require('./models-postgres'); // Load all models

/**
 * Sync database schema with models
 * This will update column types without losing data
 */

async function syncDatabase() {
  try {
    console.log('🔄 Syncing database schema...\n');

    // Test connection
    await sequelize.authenticate();
    console.log('✅ Database connection established\n');

    // Sync with alter: true (updates schema without dropping tables)
    console.log('📊 Updating table structures...');
    await sequelize.sync({ alter: true });

    console.log('\n✅ Database schema synchronized successfully!');
    console.log('\n📝 Changes applied:');
    console.log('   - Column lengths increased for URLs and long text');
    console.log('   - name: VARCHAR(500)');
    console.log('   - slug: VARCHAR(600)');
    console.log('   - mainImage: TEXT (unlimited length)');
    console.log('   - images array: TEXT[]');
    console.log('   - video: TEXT');
    console.log('   - seoTitle: VARCHAR(500)');
    console.log('   - category: VARCHAR(300)');
    console.log('   - All other string arrays: TEXT[]');
    console.log('\n💡 You can now add products with long URLs!\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error syncing database:', error);
    console.error('\nDetails:', error.message);
    process.exit(1);
  }
}

// Run sync
syncDatabase();
