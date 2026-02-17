const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

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
  instructions: String
});

const paymentMethodSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['mobile_money', 'card'],
    required: true
  },
  provider: String,
  accountNumber: String,
  isDefault: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true }
});

const userSchema = new mongoose.Schema({
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
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  phone: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  
  // Profile Information
  profile: {
    avatar: String,
    dateOfBirth: Date,
    gender: {
      type: String,
      enum: ['male', 'female', 'other']
    },
    bio: String,
    preferences: {
      newsletter: { type: Boolean, default: true },
      marketing: { type: Boolean, default: false },
      notifications: { type: Boolean, default: true }
    }
  },
  
  // Addresses
  addresses: [addressSchema],
  
  // Payment Methods
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
    default: false
  },
  
  // Verification
  verificationToken: String,
  verificationExpires: Date,
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  
  // Shopping Preferences
  preferences: {
    size: String,
    favoriteColors: [String],
    favoriteCategories: [String],
    budget: {
      min: Number,
      max: Number
    },
    style: [String]
  },
  
  // Analytics
  lastLogin: Date,
  loginCount: { type: Number, default: 0 },
  totalOrders: { type: Number, default: 0 },
  totalSpent: { type: Number, default: 0 },
  
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
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
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
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Virtual for default address
userSchema.virtual('defaultAddress').get(function() {
  return this.addresses.find(addr => addr.isDefault) || this.addresses[0];
});

// Virtual for default payment method
userSchema.virtual('defaultPaymentMethod').get(function() {
  return this.paymentMethods.find(pm => pm.isDefault) || this.paymentMethods[0];
});

// Ensure JSON includes virtuals
userSchema.set('toJSON', { virtuals: true });
userSchema.set('toObject', { virtuals: true });

// Indexes
userSchema.index({ email: 1 });
userSchema.index({ phone: 1 });
userSchema.index({ 'socialLogin.google.id': 1 });
userSchema.index({ 'socialLogin.facebook.id': 1 });

module.exports = mongoose.model('User', userSchema); 