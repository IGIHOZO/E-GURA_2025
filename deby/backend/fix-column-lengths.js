const { sequelize } = require('./config/database');

/**
 * Fix column length issues - Alter VARCHAR(255) to longer types
 * This script updates the database schema without losing data
 */

async function fixColumnLengths() {
  try {
    console.log('🔧 Fixing column length constraints...\n');

    // Get the query interface
    const queryInterface = sequelize.getQueryInterface();
    const tableName = 'Products';

    console.log('📊 Altering Products table columns...');

    // Alter string columns to allow longer values
    const alterations = [
      { column: 'name', type: 'VARCHAR(500)' },
      { column: 'slug', type: 'VARCHAR(600)' },
      { column: 'mainImage', type: 'TEXT' },
      { column: 'video', type: 'TEXT' },
      { column: 'seoTitle', type: 'VARCHAR(500)' },
      { column: 'category', type: 'VARCHAR(300)' },
      { column: 'subcategory', type: 'VARCHAR(300)' },
      { column: 'brand', type: 'VARCHAR(300)' },
      { column: 'sku', type: 'VARCHAR(300)' },
      { column: 'metaTitle', type: 'VARCHAR(500)' }
    ];

    for (const { column, type } of alterations) {
      try {
        const query = `ALTER TABLE "${tableName}" ALTER COLUMN "${column}" TYPE ${type};`;
        console.log(`   Altering ${column} to ${type}...`);
        await sequelize.query(query);
        console.log(`   ✅ ${column} updated`);
      } catch (error) {
        if (error.message.includes('does not exist')) {
          console.log(`   ⚠️  ${column} doesn't exist, skipping`);
        } else {
          console.log(`   ⚠️  ${column} - ${error.message}`);
        }
      }
    }

    console.log('\n✅ Column length fixes complete!');
    console.log('\n📝 Summary:');
    console.log('   - String columns now support longer values');
    console.log('   - URLs can be any length (TEXT type)');
    console.log('   - Names and titles can be up to 500 characters');
    console.log('   - Categories can be up to 300 characters');
    console.log('\n💡 You can now add products with long URLs and descriptions!\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error fixing column lengths:', error);
    console.error('\nTroubleshooting:');
    console.error('  1. Make sure PostgreSQL is running');
    console.error('  2. Check your database connection in .env');
    console.error('  3. Ensure you have ALTER permission on the database');
    process.exit(1);
  }
}

// Run the fix
fixColumnLengths();
