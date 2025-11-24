const { sequelize } = require('./config/database');
const Product = require('./models-postgres/Product');

/**
 * Clear all products from database
 * This will delete ALL products but keep the table structure
 */

async function clearProducts() {
  try {
    console.log('🗑️  Starting to clear products...\n');

    // Connect to database
    await sequelize.authenticate();
    console.log('✅ Database connection established\n');

    // Count products before deletion
    const countBefore = await Product.count();
    console.log(`📊 Current products in database: ${countBefore}\n`);

    if (countBefore === 0) {
      console.log('ℹ️  Database is already empty. No products to delete.\n');
      process.exit(0);
    }

    // Ask for confirmation (will auto-proceed after 5 seconds)
    console.log('⚠️  WARNING: This will delete ALL products from the database!');
    console.log('   Table structure will remain intact.');
    console.log('   This action cannot be undone.\n');
    console.log('   Proceeding in 3 seconds...\n');

    // Wait 3 seconds
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Delete all products
    console.log('🗑️  Deleting all products...');
    const deletedCount = await Product.destroy({
      where: {},
      truncate: true // This is faster and resets auto-increment
    });

    console.log(`✅ Successfully deleted ${countBefore} products!\n`);

    // Verify deletion
    const countAfter = await Product.count();
    console.log(`📊 Products remaining: ${countAfter}\n`);

    if (countAfter === 0) {
      console.log('✅ Database is now empty and ready for new products!\n');
      console.log('💡 You can now:');
      console.log('   1. Add products through admin dashboard');
      console.log('   2. Use API endpoints to create products');
      console.log('   3. Import products from a file\n');
    } else {
      console.log('⚠️  Warning: Some products may still remain');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error clearing products:', error);
    console.error('\nDetails:', error.message);
    console.error('\nTroubleshooting:');
    console.error('  1. Make sure PostgreSQL is running');
    console.error('  2. Check your database connection in .env');
    console.error('  3. Verify you have DELETE permissions');
    process.exit(1);
  }
}

// Run the clear operation
clearProducts();
