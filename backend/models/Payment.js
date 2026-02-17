const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Payment Details
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'RWF'
  },
  paymentMethod: {
    type: String,
    enum: ['mobile_money', 'cash_on_delivery', 'momo_pay', 'card', 'momo', 'equity'],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded'],
    default: 'pending'
  },
  
  // Mobile Money Payment
  mobileMoney: {
    provider: {
      type: String,
      enum: ['momo', 'airtel_money', 'mpesa'],
      required: function() { return this.paymentMethod === 'mobile_money'; }
    },
    phoneNumber: {
      type: String,
      required: function() { return this.paymentMethod === 'mobile_money'; }
    },
    transactionId: String,
    externalId: String, // From Java implementation
    referenceNumber: String,
    status: {
      type: String,
      enum: ['pending', 'success', 'failed', 'timeout'],
      default: 'pending'
    },
    responseCode: String,
    responseMessage: String,
    initiatedAt: Date,
    completedAt: Date,
    apiResponse: mongoose.Schema.Types.Mixed, // Store InTouch Pay API response
    errorMessage: String
  },
  
  // MOMO Pay Payment
  momoPay: {
    merchantId: String,
    merchantName: String,
    transactionId: String,
    referenceId: String,
    status: {
      type: String,
      enum: ['pending', 'success', 'failed', 'cancelled'],
      default: 'pending'
    },
    responseCode: String,
    responseMessage: String,
    initiatedAt: Date,
    completedAt: Date,
    callbackUrl: String
  },
  
  // Cash on Delivery
  cashOnDelivery: {
    amount: Number,
    changeRequired: Number,
    collectedBy: String,
    collectionDate: Date,
    collectionLocation: String,
    deliveryInstructions: String
  },
  
  // Card Payment
  card: {
    cardType: String,
    last4Digits: String,
    transactionId: String,
    authorizationCode: String,
    status: {
      type: String,
      enum: ['pending', 'authorized', 'captured', 'failed', 'declined'],
      default: 'pending'
    }
  },
  
  // General Payment Info
  transactionId: String,
  externalId: String, // From Java implementation
  referenceNumber: String,
  description: String,
  metadata: mongoose.Schema.Types.Mixed,
  
  // Timestamps
  initiatedAt: {
    type: Date,
    default: Date.now
  },
  completedAt: Date,
  failedAt: Date,
  
  // Error Handling
  error: {
    code: String,
    message: String,
    details: mongoose.Schema.Types.Mixed
  },
  
  // Audit Trail
  statusHistory: [{
    status: String,
    date: { type: Date, default: Date.now },
    note: String,
    updatedBy: String
  }]
}, {
  timestamps: true
});

// Generate reference number
paymentSchema.pre('save', function(next) {
  if (this.isNew && !this.referenceNumber) {
    const timestamp = Date.now().toString();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    this.referenceNumber = `PAY${timestamp.slice(-8)}${random}`;
  }
  next();
});

// Update status history
paymentSchema.pre('save', function(next) {
  if (this.isModified('status')) {
    this.statusHistory.push({
      status: this.status,
      date: new Date(),
      note: `Payment status changed to ${this.status}`,
      updatedBy: 'system'
    });
  }
  next();
});

// Indexes for better performance
paymentSchema.index({ order: 1 });
paymentSchema.index({ user: 1 });
paymentSchema.index({ status: 1 });
paymentSchema.index({ 'mobileMoney.transactionId': 1 });
paymentSchema.index({ 'mobileMoney.externalId': 1 }); // New index for external ID
paymentSchema.index({ 'momoPay.transactionId': 1 });
paymentSchema.index({ referenceNumber: 1 });
paymentSchema.index({ externalId: 1 }); // New index for external ID

module.exports = mongoose.model('Payment', paymentSchema); 