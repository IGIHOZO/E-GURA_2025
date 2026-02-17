/**
 * Database Connection Diagnostic Tool
 * Run this to check database connectivity and troubleshoot issues
 */

const { Sequelize } = require('sequelize');
require('dotenv').config();

console.log('🔍 Database Connection Diagnostic Tool\n');
console.log('═'.repeat(60));

// Check environment variables
console.log('\n📋 Configuration Check:');
console.log('─'.repeat(60));
console.log('Host:', process.env.POSTGRES_HOST || 'localhost');
console.log('Port:', process.env.POSTGRES_PORT || '5432');
console.log('Database:', process.env.POSTGRES_DB || 'deby_ecommerce');
console.log('User:', process.env.POSTGRES_USER || 'postgres');
console.log('Password:', process.env.POSTGRES_PASSWORD ? '***' + process.env.POSTGRES_PASSWORD.slice(-2) : 'NOT SET');

// Test connection
async function testConnection() {
  console.log('\n🔌 Testing PostgreSQL Connection...');
  console.log('─'.repeat(60));
  
  const sequelize = new Sequelize(
    process.env.POSTGRES_DB || 'deby_ecommerce',
    process.env.POSTGRES_USER || 'postgres',
    process.env.POSTGRES_PASSWORD || 'postgres',
    {
      host: process.env.POSTGRES_HOST || 'localhost',
      port: process.env.POSTGRES_PORT || 5432,
      dialect: 'postgres',
      logging: false
    }
  );

  try {
    // Test authentication
    console.log('Attempting connection...');
    await sequelize.authenticate();
    console.log('✅ Connection successful!');
    
    // Test query
    console.log('\n📊 Testing query execution...');
    const [results] = await sequelize.query('SELECT version()');
    console.log('✅ Query successful!');
    console.log('PostgreSQL Version:', results[0].version.split(' ')[0], results[0].version.split(' ')[1]);
    
    // Check database size
    const [sizeResults] = await sequelize.query(`
      SELECT pg_size_pretty(pg_database_size('${process.env.POSTGRES_DB || 'deby_ecommerce'}')) as size
    `);
    console.log('Database Size:', sizeResults[0].size);
    
    // List tables
    const [tables] = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    console.log('\n📋 Tables in database:', tables.length);
    tables.forEach((table, i) => {
      console.log(`  ${i + 1}. ${table.table_name}`);
    });
    
    // Check active connections
    const [connections] = await sequelize.query(`
      SELECT count(*) as active_connections 
      FROM pg_stat_activity 
      WHERE datname = '${process.env.POSTGRES_DB || 'deby_ecommerce'}'
    `);
    console.log('\n🔗 Active Connections:', connections[0].active_connections);
    
    await sequelize.close();
    console.log('\n═'.repeat(60));
    console.log('✅ All checks passed! Database is healthy.');
    console.log('═'.repeat(60));
    process.exit(0);
    
  } catch (error) {
    console.log('\n❌ Connection failed!');
    console.log('─'.repeat(60));
    console.error('Error:', error.message);
    
    console.log('\n🔧 Troubleshooting Steps:');
    console.log('─'.repeat(60));
    
    if (error.message.includes('ECONNREFUSED')) {
      console.log('1. PostgreSQL is not running');
      console.log('   → Start PostgreSQL service:');
      console.log('     Windows: net start postgresql-x64-14');
      console.log('     macOS: brew services start postgresql');
      console.log('     Linux: sudo systemctl start postgresql');
    } else if (error.message.includes('password authentication failed')) {
      console.log('1. Incorrect password');
      console.log('   → Check POSTGRES_PASSWORD in .env file');
      console.log('   → Verify password matches PostgreSQL user password');
    } else if (error.message.includes('database') && error.message.includes('does not exist')) {
      console.log('1. Database does not exist');
      console.log('   → Create database:');
      console.log(`     psql -U postgres -c "CREATE DATABASE ${process.env.POSTGRES_DB || 'deby_ecommerce'};"`);
    } else if (error.message.includes('role') && error.message.includes('does not exist')) {
      console.log('1. User does not exist');
      console.log('   → Create user:');
      console.log(`     psql -U postgres -c "CREATE USER ${process.env.POSTGRES_USER || 'postgres'} WITH PASSWORD '${process.env.POSTGRES_PASSWORD || 'postgres'}';"`);
    }
    
    console.log('\n2. General checks:');
    console.log('   → Ensure PostgreSQL is installed');
    console.log('   → Verify host and port are correct');
    console.log('   → Check firewall settings');
    console.log('   → Review .env file configuration');
    
    console.log('\n═'.repeat(60));
    process.exit(1);
  }
}

testConnection();
