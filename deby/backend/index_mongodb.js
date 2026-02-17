const express = require('express');
const mongoose = require('mongoose');
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
  res.send('SEWITHDEBBY API is running with MongoDB');
});

// Health check route
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString()
  });
});

// Import route files
const adminRoutes = require('./routes/admin');
const paymentRoutes = require('./routes/payment');
const smsRoutes = require('./routes/sms');
const productRoutes = require('./routes/product');
const orderRoutes = require('./routes/order');

// Routes
app.use('/api/admin', adminRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/sms', smsRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);

// MongoDB connection
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/sewithdebby';
const PORT = process.env.PORT || 5000;

// Connect to MongoDB first, then start server
mongoose.connect(MONGO_URI, {
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
})
.then(() => {
  console.log('✅ MongoDB connected successfully');
  console.log(`📊 Database: ${mongoose.connection.name}`);
  
  // Start server only after MongoDB connection
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`🔗 API: http://localhost:${PORT}`);
    console.log(`💾 MongoDB: Connected`);
  });
})
.catch((err) => {
  console.error('❌ MongoDB connection error:', err.message);
  console.error('');
  console.error('Please ensure MongoDB is installed and running:');
  console.error('  1. Install MongoDB: choco install mongodb -y (as Administrator)');
  console.error('  2. Start MongoDB service: net start MongoDB');
  console.error('  3. Or start manually: mongod --dbpath C:\\data\\db');
  console.error('');
  console.error('See MONGODB_INSTALLATION_GUIDE.md for detailed instructions');
  process.exit(1);
});

// Handle MongoDB connection events
mongoose.connection.on('disconnected', () => {
  console.log('⚠️  MongoDB disconnected');
});

mongoose.connection.on('reconnected', () => {
  console.log('✅ MongoDB reconnected');
});

// Graceful shutdown
process.on('SIGINT', async () => {
  try {
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
    process.exit(0);
  } catch (err) {
    console.error('Error during shutdown:', err);
    process.exit(1);
  }
});
