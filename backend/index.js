const express = require('express');
const { sequelize, testConnection, startHeartbeat, stopHeartbeat, autoReconnect } = require('./config/database');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
const compression = require('compression');
const helmet = require('helmet');

dotenv.config();

const app = express();
app.disable('x-powered-by');
app.set('etag', 'strong');

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: false
}));
app.use(compression());
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
const adminAuthRoutes = require('./routes/adminAuth');
const adminRoutes = require('./routes/admin');
const paymentRoutes = require('./routes/payment');
const smsRoutes = require('./routes/sms');
const productRoutes = require('./routes/product');
const orderRoutes = require('./routes/order');
const categoryRoutes = require('./routes/categories');
const customerRoutes = require('./routes/customer');
const customerAccountRoutes = require('./routes/customerAccount');
const searchRoutes = require('./routes/search');
const searchV2Routes = require('./routes/searchV2');
const advancedSearchRoutes = require('./routes/advancedSearch');
const intelligentSearchRoutes = require('./routes/intelligentSearch');
const negotiationRoutes = require('./routes/negotiation');
const webhookRoutes = require('./routes/webhooks');
const productCreationRoutes = require('./routes/productCreation');
const offersRoutes = require('./routes/offers');
const checkoutRoutes = require('./routes/checkout');
const trackingRoutes = require('./routes/tracking');
const promotionsRoutes = require('./routes/promotions');
const returnsRoutes = require('./routes/returns');
const reviewsRoutes = require('./routes/reviews');
const wishlistRoutes = require('./routes/wishlist');
const addressesRoutes = require('./routes/addresses');
const aiAdminRoutes = require('./routes/aiAdmin');
const shippingRoutes = require('./routes/shipping');
const seoRoutes = require('./routes/seo');
const blogRoutes = require('./routes/blog');
const sitemapRoutes = require('./routes/sitemap');
const mediaUploadRoutes = require('./routes/mediaUpload');
const analyticsRoutes = require('./routes/analytics');
const momoCodesRoutes = require('./routes/momoCodes');

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin/auth', adminAuthRoutes);
app.use('/api/admin/ai', aiAdminRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/sms', smsRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/customer-account', customerAccountRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/v2/search', searchV2Routes);
app.use('/api/advanced-search', advancedSearchRoutes);
app.use('/api/intelligent-search', intelligentSearchRoutes);
app.use('/api/negotiation', negotiationRoutes);
app.use('/api/webhooks', webhookRoutes);
app.use('/api/product-creation', productCreationRoutes);
app.use('/api/offers', offersRoutes);
app.use('/api/checkout', checkoutRoutes);
app.use('/api/tracking', trackingRoutes);
app.use('/api/promotions', promotionsRoutes);
app.use('/api/returns', returnsRoutes);
app.use('/api/reviews', reviewsRoutes);
app.use('/api/shipping', shippingRoutes);
app.use('/api/seo', seoRoutes);
app.use('/api/blog', blogRoutes);
app.use('/api/sitemap', sitemapRoutes);
app.use('/api/media', mediaUploadRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/addresses', addressesRoutes);
app.use('/api/momo-codes', momoCodesRoutes);

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
    
    // Start database heartbeat monitoring
    startHeartbeat();
    console.log('💓 Database heartbeat monitoring started');
    
    // Start server
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`🔗 API: http://localhost:${PORT}`);
      console.log(`💾 Database: PostgreSQL (Auto-reconnect enabled)`);
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

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  try {
    stopHeartbeat();
    console.log('💓 Heartbeat monitoring stopped');
    await sequelize.close();
    console.log('✅ PostgreSQL connection closed');
    console.log('👋 Goodbye!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error during shutdown:', err);
    process.exit(1);
  }
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 SIGTERM received, shutting down...');
  try {
    stopHeartbeat();
    await sequelize.close();
    process.exit(0);
  } catch (err) {
    console.error('Error during shutdown:', err);
    process.exit(1);
  }
});

// Start the server
startServer();
