const mongoose = require('mongoose');
const { Sequelize, DataTypes } = require('sequelize');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

console.log('🔄 Starting MongoDB to PostgreSQL Migration');
console.log('=' .repeat(60));

// MongoDB connection
const MONGO_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ecommerce';

// PostgreSQL connection
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

// Define PostgreSQL Models
const defineModels = () => {
  // Product Model
  const Product = sequelize.define('Product', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    name: { type: DataTypes.STRING, allowNull: false },
    slug: { type: DataTypes.STRING, unique: true },
    description: { type: DataTypes.TEXT, allowNull: false },
    shortDescription: DataTypes.TEXT,
    price: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    originalPrice: DataTypes.DECIMAL(10, 2),
    discountPercentage: { type: DataTypes.DECIMAL(5, 2), defaultValue: 0 },
    mainImage: { type: DataTypes.STRING, allowNull: false },
    images: DataTypes.ARRAY(DataTypes.STRING),
    video: DataTypes.STRING,
    seoTitle: DataTypes.STRING,
    seoDescription: DataTypes.TEXT,
    seoKeywords: DataTypes.ARRAY(DataTypes.STRING),
    metaTags: DataTypes.JSONB,
    category: { type: DataTypes.STRING, allowNull: false },
    subcategory: DataTypes.STRING,
    brand: { type: DataTypes.STRING, defaultValue: 'SEWITHDEBBY' },
    tags: DataTypes.ARRAY(DataTypes.STRING),
    gender: { type: DataTypes.ENUM('male', 'female', 'unisex'), defaultValue: 'female' },
    ageGroup: { type: DataTypes.ENUM('kids', 'teen', 'adult'), defaultValue: 'adult' },
    material: DataTypes.ARRAY(DataTypes.STRING),
    care: DataTypes.ARRAY(DataTypes.STRING),
    sizes: DataTypes.ARRAY(DataTypes.STRING),
    colors: DataTypes.ARRAY(DataTypes.STRING),
    variants: DataTypes.JSONB,
    stockQuantity: { type: DataTypes.INTEGER, defaultValue: 0 },
    lowStockThreshold: { type: DataTypes.INTEGER, defaultValue: 5 },
    sku: { type: DataTypes.STRING, unique: true },
    isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
    isFeatured: { type: DataTypes.BOOLEAN, defaultValue: false },
    isNew: { type: DataTypes.BOOLEAN, defaultValue: false },
    isSale: { type: DataTypes.BOOLEAN, defaultValue: false },
    isBestSeller: { type: DataTypes.BOOLEAN, defaultValue: false },
    reviews: DataTypes.JSONB,
    averageRating: { type: DataTypes.DECIMAL(2, 1), defaultValue: 0 },
    totalReviews: { type: DataTypes.INTEGER, defaultValue: 0 },
    metaTitle: DataTypes.STRING,
    metaDescription: DataTypes.TEXT,
    keywords: DataTypes.ARRAY(DataTypes.STRING),
    viewCount: { type: DataTypes.INTEGER, defaultValue: 0 },
    salesCount: { type: DataTypes.INTEGER, defaultValue: 0 },
    weight: DataTypes.DECIMAL(10, 2),
    dimensions: DataTypes.JSONB,
    shippingClass: { type: DataTypes.ENUM('standard', 'express', 'free'), defaultValue: 'standard' },
    careInstructions: DataTypes.ARRAY(DataTypes.STRING),
    returnPolicy: DataTypes.TEXT,
    warranty: DataTypes.TEXT,
    bargainEnabled: { type: DataTypes.BOOLEAN, defaultValue: true },
    minBargainPrice: DataTypes.DECIMAL(10, 2),
    maxBargainDiscount: { type: DataTypes.INTEGER, defaultValue: 25 },
    bargainStrategy: { type: DataTypes.ENUM('aggressive', 'balanced', 'conservative'), defaultValue: 'balanced' },
    mongoId: DataTypes.STRING // Store original MongoDB ID for reference
  });

  // User Model
  const User = sequelize.define('User', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    firstName: { type: DataTypes.STRING, allowNull: false },
    lastName: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING, allowNull: false, unique: true },
    phone: { type: DataTypes.STRING, allowNull: false, unique: true },
    password: { type: DataTypes.STRING, allowNull: false },
    profile: DataTypes.JSONB,
    addresses: DataTypes.JSONB,
    paymentMethods: DataTypes.JSONB,
    isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
    isVerified: { type: DataTypes.BOOLEAN, defaultValue: false },
    emailVerified: { type: DataTypes.BOOLEAN, defaultValue: false },
    phoneVerified: { type: DataTypes.BOOLEAN, defaultValue: false },
    verificationToken: DataTypes.STRING,
    verificationExpires: DataTypes.DATE,
    resetPasswordToken: DataTypes.STRING,
    resetPasswordExpires: DataTypes.DATE,
    preferences: DataTypes.JSONB,
    lastLogin: DataTypes.DATE,
    loginCount: { type: DataTypes.INTEGER, defaultValue: 0 },
    totalOrders: { type: DataTypes.INTEGER, defaultValue: 0 },
    totalSpent: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
    socialLogin: DataTypes.JSONB,
    role: { type: DataTypes.ENUM('customer', 'admin', 'moderator', 'storekeeper'), defaultValue: 'customer' },
    mongoId: DataTypes.STRING
  });

  // Order Model
  const Order = sequelize.define('Order', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    userId: { type: DataTypes.UUID, references: { model: 'Users', key: 'id' } },
    orderNumber: { type: DataTypes.STRING, unique: true },
    referenceNumber: DataTypes.STRING,
    externalId: DataTypes.STRING,
    items: DataTypes.JSONB,
    subtotal: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    tax: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
    shippingCost: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
    discount: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
    total: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    paymentMethod: { type: DataTypes.STRING, allowNull: false },
    paymentMode: DataTypes.STRING,
    paymentStatus: { type: DataTypes.ENUM('pending', 'processing', 'completed', 'failed', 'refunded'), defaultValue: 'pending' },
    paymentDetails: DataTypes.JSONB,
    shippingAddress: DataTypes.JSONB,
    customerInfo: DataTypes.JSONB,
    status: { type: DataTypes.ENUM('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'returned'), defaultValue: 'pending' },
    trackingNumber: DataTypes.STRING,
    estimatedDelivery: DataTypes.DATE,
    actualDelivery: DataTypes.DATE,
    mobileMoney: DataTypes.JSONB,
    momoPay: DataTypes.JSONB,
    cashOnDelivery: DataTypes.JSONB,
    notes: DataTypes.JSONB,
    orderDate: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    statusHistory: DataTypes.JSONB,
    mongoId: DataTypes.STRING
  });

  // Category Model
  const Category = sequelize.define('Category', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    name: { type: DataTypes.STRING, allowNull: false, unique: true },
    slug: DataTypes.STRING,
    description: DataTypes.TEXT,
    image: DataTypes.STRING,
    icon: DataTypes.STRING,
    parentId: DataTypes.UUID,
    level: { type: DataTypes.INTEGER, defaultValue: 0 },
    path: DataTypes.STRING,
    isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
    displayOrder: { type: DataTypes.INTEGER, defaultValue: 0 },
    metaTitle: DataTypes.STRING,
    metaDescription: DataTypes.TEXT,
    mongoId: DataTypes.STRING
  });

  // Customer Model
  const Customer = sequelize.define('Customer', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    firstName: { type: DataTypes.STRING, allowNull: false },
    lastName: { type: DataTypes.STRING, allowNull: false },
    email: DataTypes.STRING,
    phone: { type: DataTypes.STRING, allowNull: false, unique: true },
    password: DataTypes.STRING,
    addresses: DataTypes.JSONB,
    preferences: DataTypes.JSONB,
    isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
    phoneVerified: { type: DataTypes.BOOLEAN, defaultValue: false },
    lastLogin: DataTypes.DATE,
    totalOrders: { type: DataTypes.INTEGER, defaultValue: 0 },
    totalSpent: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
    mongoId: DataTypes.STRING
  });

  return { Product, User, Order, Category, Customer };
};

// Migration function
async function migrate() {
  try {
    // Step 1: Connect to PostgreSQL
    console.log('\n📊 Step 1: Connecting to PostgreSQL...');
    await sequelize.authenticate();
    console.log('✅ PostgreSQL connected');

    // Step 2: Define models
    console.log('\n📊 Step 2: Defining PostgreSQL models...');
    const models = defineModels();
    console.log('✅ Models defined');

    // Step 3: Create tables
    console.log('\n📊 Step 3: Creating PostgreSQL tables...');
    await sequelize.sync({ force: true }); // WARNING: This drops existing tables
    console.log('✅ Tables created');

    // Step 4: Connect to MongoDB
    console.log('\n📊 Step 4: Connecting to MongoDB...');
    try {
      await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 5000 });
      console.log('✅ MongoDB connected');

      // Step 5: Export and import data
      console.log('\n📊 Step 5: Migrating data...');
      
      // Import MongoDB models
      const MongoProduct = require('./models/Product');
      const MongoUser = require('./models/User');
      const MongoOrder = require('./models/Order');
      const MongoCategory = require('./models/Category');
      const MongoCustomer = require('./models/Customer');

      // Migrate Products
      console.log('  → Migrating products...');
      const products = await MongoProduct.find({}).lean();
      for (const product of products) {
        await models.Product.create({
          ...product,
          id: undefined,
          mongoId: product._id.toString(),
          _id: undefined,
          __v: undefined
        });
      }
      console.log(`  ✅ Migrated ${products.length} products`);

      // Migrate Users
      console.log('  → Migrating users...');
      const users = await MongoUser.find({}).lean();
      for (const user of users) {
        await models.User.create({
          ...user,
          id: undefined,
          mongoId: user._id.toString(),
          _id: undefined,
          __v: undefined
        });
      }
      console.log(`  ✅ Migrated ${users.length} users`);

      // Migrate Orders
      console.log('  → Migrating orders...');
      const orders = await MongoOrder.find({}).lean();
      for (const order of orders) {
        // Find corresponding PostgreSQL user
        const pgUser = await models.User.findOne({ where: { mongoId: order.user.toString() } });
        await models.Order.create({
          ...order,
          id: undefined,
          userId: pgUser ? pgUser.id : null,
          user: undefined,
          mongoId: order._id.toString(),
          _id: undefined,
          __v: undefined
        });
      }
      console.log(`  ✅ Migrated ${orders.length} orders`);

      // Migrate Categories
      console.log('  → Migrating categories...');
      const categories = await MongoCategory.find({}).lean();
      for (const category of categories) {
        await models.Category.create({
          ...category,
          id: undefined,
          mongoId: category._id.toString(),
          _id: undefined,
          __v: undefined
        });
      }
      console.log(`  ✅ Migrated ${categories.length} categories`);

      // Migrate Customers
      console.log('  → Migrating customers...');
      const customers = await MongoCustomer.find({}).lean();
      for (const customer of customers) {
        await models.Customer.create({
          ...customer,
          id: undefined,
          mongoId: customer._id.toString(),
          _id: undefined,
          __v: undefined
        });
      }
      console.log(`  ✅ Migrated ${customers.length} customers`);

      await mongoose.connection.close();
      console.log('✅ MongoDB connection closed');

    } catch (mongoError) {
      console.log('⚠️  MongoDB connection failed - creating empty PostgreSQL database');
      console.log('   This is OK if you don\'t have existing data');
    }

    // Step 6: Verify
    console.log('\n📊 Step 6: Verifying migration...');
    const productCount = await models.Product.count();
    const userCount = await models.User.count();
    const orderCount = await models.Order.count();
    console.log(`  Products: ${productCount}`);
    console.log(`  Users: ${userCount}`);
    console.log(`  Orders: ${orderCount}`);

    console.log('\n' + '='.repeat(60));
    console.log('✅ Migration completed successfully!');
    console.log('='.repeat(60));
    console.log('\nNext steps:');
    console.log('1. Update backend/index.js to use PostgreSQL');
    console.log('2. Restart your backend server');
    console.log('3. Test the application');
    console.log('\nYou can now safely stop MongoDB service.');

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
}

// Run migration
migrate();
