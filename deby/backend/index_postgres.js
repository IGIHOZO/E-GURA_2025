const express = require('express');
const { sequelize, testConnection } = require('./config/database');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(morgan('dev'));

// Basic route
app.get('/', (req, res) => {
  res.send('SEWITHDEBBY API is running with PostgreSQL');
});

// Health check route
app.get('/api/health', async (req, res) => {
  const dbConnected = await testConnection();
  res.json({
    status: 'ok',
    database: dbConnected ? 'connected' : 'disconnected',
    dbType: 'PostgreSQL',
    timestamp: new Date().toISOString()
  });
});

// Import route files
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const paymentRoutes = require('./routes/payment');
const smsRoutes = require('./routes/sms');
const productRoutes = require('./routes/product');
const orderRoutes = require('./routes/order');
const categoryRoutes = require('./routes/category');
const customerRoutes = require('./routes/customer');
const searchRoutes = require('./routes/search');
const searchV2Routes = require('./routes/searchV2');
const negotiationRoutes = require('./routes/negotiation');
const webhookRoutes = require('./routes/webhooks');

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/sms', smsRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/v2/search', searchV2Routes);
app.use('/api/negotiation', negotiationRoutes);
app.use('/api/webhooks', webhookRoutes);

const PORT = process.env.PORT || 5000;

// Connect to PostgreSQL and start server
const startServer = async () => {
  try {
    // Test PostgreSQL connection
    console.log('🔌 Connecting to PostgreSQL...');
    await sequelize.authenticate();
    console.log('✅ PostgreSQL connected successfully');
    console.log(`📊 Database: ${process.env.POSTGRES_DB}`);
    
    // Sync models (create tables if they don't exist)
    // Use { alter: true } in development, { force: false } in production
    await sequelize.sync({ alter: false });
    console.log('✅ Database synchronized');
    
    // Start server
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`🔗 API: http://localhost:${PORT}`);
      console.log(`💾 Database: PostgreSQL`);
      console.log('');
      console.log('✨ All systems operational!');
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    console.error('');
    console.error('Troubleshooting:');
    console.error('  1. Ensure PostgreSQL is installed and running');
    console.error('  2. Check your .env file for correct credentials');
    console.error('  3. Verify the database exists: ' + process.env.POSTGRES_DB);
    console.error('');
    console.error('To create the database, run:');
    console.error('  psql -U postgres -c "CREATE DATABASE deby_ecommerce;"');
    process.exit(1);
  }
};

// Handle PostgreSQL connection events
sequelize.connectionManager.pool.on('acquire', () => {
  console.log('🔗 PostgreSQL connection acquired');
});

sequelize.connectionManager.pool.on('release', () => {
  console.log('🔓 PostgreSQL connection released');
});

// Graceful shutdown
process.on('SIGINT', async () => {
  try {
    await sequelize.close();
    console.log('PostgreSQL connection closed');
    process.exit(0);
  } catch (err) {
    console.error('Error during shutdown:', err);
    process.exit(1);
  }
});

// Start the server
startServer();
