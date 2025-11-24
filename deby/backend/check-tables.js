const { sequelize } = require('./config/database');

async function checkTables() {
  try {
    console.log('Checking database tables...\n');
    
    // List all tables
    const [results] = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);
    
    console.log('📊 Available tables:');
    results.forEach(row => {
      console.log('  -', row.table_name);
    });
    
    // Check Products table specifically
    console.log('\n🔍 Checking Products table...');
    try {
      const [products] = await sequelize.query('SELECT * FROM "Products" LIMIT 1');
      console.log('✅ "Products" table exists (capital P)');
      if (products.length > 0) {
        console.log('Sample product:', products[0].id, products[0].name);
      }
    } catch (e) {
      console.log('❌ "Products" table not found');
    }
    
    try {
      const [products] = await sequelize.query('SELECT * FROM products LIMIT 1');
      console.log('✅ "products" table exists (lowercase p)');
      if (products.length > 0) {
        console.log('Sample product:', products[0].id, products[0].name);
      }
    } catch (e) {
      console.log('❌ "products" table not found');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
  
  process.exit(0);
}

checkTables();
