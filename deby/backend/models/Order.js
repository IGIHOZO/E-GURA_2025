const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  orderNumber: {
    type: String,
    unique: true
  },
  // New fields from Java implementation
  referenceNumber: {
    type: String,
    unique: true,
    sparse: true  // Only enforce uniqueness when field has a value
  },
  externalId: {
    type: String,
    unique: true,
    sparse: true  // Only enforce uniqueness when field has a value
  },
  items: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    price: {
      type: Number,
      required: true
    },
    size: String,
    color: String,
    variant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product.variants'
    }
  }],
  
  // Order Summary
  subtotal: {
    type: Number,
    required: true
  },
  tax: {
    type: Number,
    default: 0
  },
  shippingCost: {
    type: Number,
    default: 0
  },
  discount: {
    type: Number,
    default: 0
  },
  total: {
    type: Number,
    required: true
  },
  
  // Payment Information
  paymentMethod: {
    type: String,
    enum: ['mobile_money', 'cash_on_delivery', 'momo_pay', 'card', 'momo', 'equity'],
    required: true
  },
  paymentMode: {
    type: String,
    enum: ['momo', 'equity', 'card', 'cash_on_delivery']
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  paymentDetails: {
    transactionId: String,
    paymentProvider: String,
    paymentDate: Date,
    amount: Number,
    currency: {
      type: String,
      default: 'RWF'
    }
  },
  
  // Shipping Information
  shippingAddress: {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String, required: true },
    address: { type: String, required: true },
    city: { type: String, required: true },
    district: { type: String, required: true },
    postalCode: String,
    country: { type: String, default: 'Rwanda' },
    instructions: String
  },
  
  // Customer Information (stored separately for easy access)
  customerInfo: {
    firstName: String,
    lastName: String,
    email: String,
    phone: String
  },
  
  // Address reference (from Java implementation)
  address: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Address'
  },
  
  // Order Status
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'returned'],
    default: 'pending'
  },
  // Tracking
  trackingNumber: String,
  estimatedDelivery: Date,
  actualDelivery: Date,
  
  // Mobile Money Details
  mobileMoney: {
    provider: {
      type: String,
      enum: ['momo', 'airtel_money', 'mpesa', 'mtn'],
      required: function() { return this.paymentMethod === 'mobile_money'; }
    },
    phoneNumber: {
      type: String,
      required: function() { return this.paymentMethod === 'mobile_money'; }
    },
    transactionId: String,
    externalId: String, // From Java implementation
    mtnReferenceId: String, // MTN MoMo reference ID
    status: {
      type: String,
      enum: ['pending', 'success', 'failed', 'PENDING', 'SUCCESSFUL', 'FAILED'],
      default: 'pending'
    },
    apiResponse: mongoose.Schema.Types.Mixed, // Store API response
    errorMessage: String
  },
  
  // MOMO Pay Details
  momoPay: {
    merchantId: String,
    status: {
      type: String,
      enum: ['pending', 'success', 'failed'],
      default: 'pending'
    },
    responseCode: String,
    responseMessage: String
  },
  
  // Cash on Delivery
  cashOnDelivery: {
    amount: Number,
    changeRequired: Number,
    collectedBy: String,
    collectionDate: Date
  },
  
  // Order Notes
  notes: {
    customer: String,
    admin: String
  },
  
  // Timestamps
  orderDate: {
    type: Date,
    default: Date.now
  },
  statusHistory: [{
    status: String,
    date: { type: Date, default: Date.now },
    note: String,
    updatedBy: String
  }]
}, {
  timestamps: true
});

// Generate order number
orderSchema.pre('save', function(next) {
  if (this.isNew) {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    this.orderNumber = `SEW${year}${month}${day}${random}`;
    
    // Generate reference number (from Java implementation)
    if (!this.referenceNumber) {
      this.referenceNumber = this.orderNumber;
    }
  }
  next();
});

// Calculate totals
orderSchema.pre('save', function(next) {
  if (this.items && this.items.length > 0) {
    this.subtotal = this.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    this.total = this.subtotal + this.tax + this.shippingCost - this.discount;
  }
  next();
});

// Add status to history
orderSchema.pre('save', function(next) {
  if (this.isModified('status')) {
    this.statusHistory.push({
      status: this.status,
      date: new Date(),
      note: `Order status changed to ${this.status}`,
      updatedBy: 'system'
    });
  }
  next();
});

module.exports = mongoose.model('Order', orderSchema); 