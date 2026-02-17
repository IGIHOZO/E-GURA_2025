const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Address Schema - Track all shipping addresses
const addressSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['home', 'work', 'other'],
    default: 'home'
  },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  phone: { type: String, required: true },
  address: { type: String, required: true },
  city: { type: String, required: true },
  district: { type: String, required: true },
  postalCode: String,
  country: { type: String, default: 'Rwanda' },
  isDefault: { type: Boolean, default: false },
  instructions: String,
  usageCount: { type: Number, default: 0 }, // Track how many times used
  lastUsed: Date,
  createdAt: { type: Date, default: Date.now }
});

// Pre-save hook to ensure only one default address per customer
addressSchema.pre('save', function(next) {
  if (this.isDefault && this.parent()) {
    const addresses = this.parent().addresses;
    addresses.forEach(addr => {
      if (addr._id && !addr._id.equals(this._id)) {
        addr.isDefault = false;
      }
    });
  }
  next();
});

// Payment Method Schema - Track all payment methods
const paymentMethodSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['mobile_money', 'card', 'cash_on_delivery'],
    required: true
  },
  provider: {
    type: String,
    enum: ['mtn', 'airtel', 'mpesa', 'visa', 'mastercard', 'cash']
  },
  accountNumber: String, // Phone number for mobile money
  accountName: String,
  isDefault: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  usageCount: { type: Number, default: 0 },
  lastUsed: Date,
  createdAt: { type: Date, default: Date.now }
});

// AI Recommendation Schema - Track AI interactions
const aiRecommendationSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['product', 'size', 'style', 'color', 'outfit'],
    required: true
  },
  query: String, // Customer's question/request
  recommendations: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    reason: String,
    confidence: Number
  }],
  accepted: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }], // Products customer clicked/bought
  rejected: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
  feedback: String,
  createdAt: { type: Date, default: Date.now }
});

// Shopping Behavior Schema - Track browsing and shopping patterns
const shoppingBehaviorSchema = new mongoose.Schema({
  viewedProducts: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    viewCount: { type: Number, default: 1 },
    lastViewed: { type: Date, default: Date.now },
    timeSpent: Number // seconds
  }],
  searchHistory: [{
    query: String,
    resultsCount: Number,
    clicked: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
    timestamp: { type: Date, default: Date.now }
  }],
  cartAbandonment: [{
    items: [{
      product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
      quantity: Number,
      price: Number
    }],
    totalValue: Number,
    reason: String,
    timestamp: { type: Date, default: Date.now }
  }],
  wishlist: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    addedAt: { type: Date, default: Date.now },
    purchased: { type: Boolean, default: false }
  }]
});

// Main Customer Schema
const customerSchema = new mongoose.Schema({
  // Primary Identifier - PHONE NUMBER
  phone: {
    type: String,
    required: true,
    unique: true,
    index: true,
    trim: true
  },
  
  // Basic Information
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    lowercase: true,
    trim: true,
    sparse: true, // Allow null but unique if provided
    index: true
  },
  
  // Authentication
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  passwordSetByCustomer: { type: Boolean, default: false }, // Track if customer set their own password
  
  // Profile Information
  profile: {
    avatar: String,
    dateOfBirth: Date,
    gender: {
      type: String,
      enum: ['male', 'female', 'other', 'prefer_not_to_say']
    },
    bio: String,
    preferences: {
      newsletter: { type: Boolean, default: true },
      marketing: { type: Boolean, default: false },
      notifications: { type: Boolean, default: true },
      smsNotifications: { type: Boolean, default: true }
    }
  },
  
  // All Addresses - Complete History
  addresses: [addressSchema],
  
  // All Payment Methods - Complete History
  paymentMethods: [paymentMethodSchema],
  
  // Account Status
  isActive: {
    type: Boolean,
    default: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  emailVerified: {
    type: Boolean,
    default: false
  },
  phoneVerified: {
    type: Boolean,
    default: true // Auto-verified on registration
  },
  accountCreatedBy: {
    type: String,
    enum: ['self', 'order', 'admin'],
    default: 'order'
  },
  
  // Verification Tokens
  verificationToken: String,
  verificationExpires: Date,
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  
  // Shopping Preferences & Style Profile
  preferences: {
    size: {
      top: String,
      bottom: String,
      shoes: String,
      dress: String
    },
    favoriteColors: [String],
    favoriteCategories: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Category' }],
    budget: {
      min: Number,
      max: Number
    },
    style: [String], // casual, formal, sporty, etc.
    bodyType: String,
    skinTone: String
  },
  
  // Order Statistics
  orderStats: {
    totalOrders: { type: Number, default: 0 },
    completedOrders: { type: Number, default: 0 },
    cancelledOrders: { type: Number, default: 0 },
    returnedOrders: { type: Number, default: 0 },
    totalSpent: { type: Number, default: 0 },
    averageOrderValue: { type: Number, default: 0 },
    lastOrderDate: Date,
    firstOrderDate: Date
  },
  
  // Customer Lifetime Value
  lifetimeValue: {
    totalRevenue: { type: Number, default: 0 },
    totalOrders: { type: Number, default: 0 },
    averageOrderValue: { type: Number, default: 0 },
    customerSince: Date,
    lastPurchase: Date,
    predictedValue: Number // AI-predicted future value
  },
  
  // AI Recommendations History
  aiRecommendations: [aiRecommendationSchema],
  
  // Shopping Behavior
  shoppingBehavior: shoppingBehaviorSchema,
  
  // Loyalty & Rewards
  loyalty: {
    points: { type: Number, default: 0 },
    tier: {
      type: String,
      enum: ['bronze', 'silver', 'gold', 'platinum'],
      default: 'bronze'
    },
    rewards: [{
      type: String,
      code: String,
      value: Number,
      expiresAt: Date,
      used: { type: Boolean, default: false }
    }]
  },
  
  // Communication History
  communications: [{
    type: {
      type: String,
      enum: ['email', 'sms', 'notification', 'call']
    },
    subject: String,
    message: String,
    status: {
      type: String,
      enum: ['sent', 'delivered', 'read', 'failed']
    },
    sentAt: { type: Date, default: Date.now },
    readAt: Date
  }],
  
  // Activity Tracking
  activityLog: [{
    action: {
      type: String,
      enum: ['account_created', 'login', 'logout', 'order_initiated', 'order_placed', 
             'order_cancelled', 'profile_updated', 'address_added', 'payment_added', 
             'product_viewed', 'search', 'ai_query', 'cart_updated', 'wishlist_updated', 
             'review_posted']
    },
    details: mongoose.Schema.Types.Mixed,
    ipAddress: String,
    userAgent: String,
    timestamp: { type: Date, default: Date.now }
  }],
  
  // Analytics
  analytics: {
    lastLogin: Date,
    loginCount: { type: Number, default: 0 },
    sessionCount: { type: Number, default: 0 },
    averageSessionDuration: Number, // in seconds
    deviceTypes: [String], // mobile, desktop, tablet
    browsers: [String],
    locations: [String], // cities/districts
    referralSource: String // how they found the site
  },
  
  // Customer Segmentation
  segment: {
    type: String,
    enum: ['new', 'active', 'vip', 'at_risk', 'churned', 'dormant'],
    default: 'new'
  },
  
  // Notes from Admin
  adminNotes: [{
    note: String,
    addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
    addedAt: { type: Date, default: Date.now },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'low'
    }
  }],
  
  // Social Login
  socialLogin: {
    google: {
      id: String,
      email: String
    },
    facebook: {
      id: String,
      email: String
    }
  },
  
  // Role
  role: {
    type: String,
    enum: ['customer', 'admin', 'moderator'],
    default: 'customer'
  }
}, {
  timestamps: true // Adds createdAt and updatedAt
});

// Indexes for Performance
customerSchema.index({ phone: 1 });
customerSchema.index({ email: 1 });
customerSchema.index({ createdAt: -1 });
customerSchema.index({ 'orderStats.totalOrders': -1 });
customerSchema.index({ 'orderStats.totalSpent': -1 });
customerSchema.index({ segment: 1 });

// Hash password before saving
customerSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
customerSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Virtual for full name
customerSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Virtual for default address
customerSchema.virtual('defaultAddress').get(function() {
  return this.addresses.find(addr => addr.isDefault) || this.addresses[0];
});

// Virtual for default payment method
customerSchema.virtual('defaultPaymentMethod').get(function() {
  return this.paymentMethods.find(pm => pm.isDefault) || this.paymentMethods[0];
});

// Method to update customer segment based on behavior
customerSchema.methods.updateSegment = function() {
  const daysSinceLastOrder = this.orderStats.lastOrderDate 
    ? (Date.now() - this.orderStats.lastOrderDate.getTime()) / (1000 * 60 * 60 * 24)
    : 999;
  
  if (this.orderStats.totalOrders === 0) {
    this.segment = 'new';
  } else if (this.orderStats.totalSpent > 500000) { // 500k RWF
    this.segment = 'vip';
  } else if (daysSinceLastOrder > 90) {
    this.segment = 'churned';
  } else if (daysSinceLastOrder > 60) {
    this.segment = 'at_risk';
  } else if (daysSinceLastOrder > 30) {
    this.segment = 'dormant';
  } else {
    this.segment = 'active';
  }
};

// Method to add activity log
customerSchema.methods.logActivity = function(action, details = {}, metadata = {}) {
  this.activityLog.push({
    action,
    details,
    ipAddress: metadata.ipAddress,
    userAgent: metadata.userAgent,
    timestamp: new Date()
  });
  
  // Keep only last 1000 activities
  if (this.activityLog.length > 1000) {
    this.activityLog = this.activityLog.slice(-1000);
  }
};

// Method to update order statistics
customerSchema.methods.updateOrderStats = function(order) {
  this.orderStats.totalOrders += 1;
  
  if (order.status === 'delivered') {
    this.orderStats.completedOrders += 1;
  } else if (order.status === 'cancelled') {
    this.orderStats.cancelledOrders += 1;
  } else if (order.status === 'returned') {
    this.orderStats.returnedOrders += 1;
  }
  
  if (order.status !== 'cancelled') {
    this.orderStats.totalSpent += order.total || 0;
    this.lifetimeValue.totalRevenue += order.total || 0;
  }
  
  this.orderStats.averageOrderValue = this.orderStats.totalSpent / this.orderStats.completedOrders || 0;
  this.orderStats.lastOrderDate = new Date();
  
  if (!this.orderStats.firstOrderDate) {
    this.orderStats.firstOrderDate = new Date();
    this.lifetimeValue.customerSince = new Date();
  }
  
  this.lifetimeValue.lastPurchase = new Date();
  this.lifetimeValue.totalOrders = this.orderStats.totalOrders;
  this.lifetimeValue.averageOrderValue = this.orderStats.averageOrderValue;
  
  // Update segment
  this.updateSegment();
};

// Ensure JSON includes virtuals
customerSchema.set('toJSON', { virtuals: true });
customerSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Customer', customerSchema);
