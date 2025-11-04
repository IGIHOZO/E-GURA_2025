const mongoose = require('mongoose');

const bundlePairSchema = new mongoose.Schema({
  mainSku: { type: String, required: true },
  bundleSku: { type: String, required: true },
  bundlePrice: { type: Number, required: true },
  bundleDescription: {
    en: String,
    rw: String
  }
}, { _id: false });

const segmentRuleSchema = new mongoose.Schema({
  segment: { 
    type: String, 
    enum: ['new', 'returning', 'vip', 'default'],
    required: true 
  },
  maxDiscountPct: { type: Number, required: true, min: 0, max: 100 },
  minPurchaseCount: { type: Number, default: 0 },
  maxPurchaseCount: { type: Number, default: null }
}, { _id: false });

const negotiationRuleSchema = new mongoose.Schema({
  sku: { 
    type: String, 
    required: true, 
    unique: true,
    index: true 
  },
  productName: {
    en: { type: String, required: true },
    rw: String
  },
  basePrice: { 
    type: Number, 
    required: true,
    min: 0 
  },
  minPrice: { 
    type: Number, 
    required: true,
    min: 0 
  },
  maxDiscountPct: { 
    type: Number, 
    required: true,
    min: 0,
    max: 100,
    default: 15
  },
  maxRounds: { 
    type: Number, 
    required: true,
    min: 1,
    max: 5,
    default: 3
  },
  clearanceFlag: { 
    type: Boolean, 
    default: false 
  },
  stockLevel: {
    type: Number,
    default: 0,
    min: 0
  },
  bundlePairs: [bundlePairSchema],
  segmentRules: [segmentRuleSchema],
  fallbackPerks: {
    freeShipping: { 
      enabled: { type: Boolean, default: true },
      threshold: { type: Number, default: null } // null = always available
    },
    freeGift: {
      enabled: { type: Boolean, default: false },
      giftDescription: {
        en: String,
        rw: String
      }
    },
    extendedWarranty: {
      enabled: { type: Boolean, default: false },
      months: { type: Number, default: 12 }
    }
  },
  enabled: { 
    type: Boolean, 
    default: true 
  },
  priority: {
    type: Number,
    default: 0 // Higher priority = more aggressive negotiation
  },
  metadata: {
    category: String,
    margin: Number, // Profit margin percentage
    costPrice: Number,
    lastUpdated: Date,
    updatedBy: String
  }
}, {
  timestamps: true
});

// Validation: minPrice must be <= basePrice
negotiationRuleSchema.pre('save', function(next) {
  if (this.minPrice > this.basePrice) {
    next(new Error('minPrice cannot exceed basePrice'));
  }
  
  // Calculate minPrice from maxDiscountPct if not explicitly set
  if (!this.minPrice && this.maxDiscountPct) {
    this.minPrice = this.basePrice * (1 - this.maxDiscountPct / 100);
  }
  
  next();
});

// Index for fast lookups
negotiationRuleSchema.index({ sku: 1, enabled: 1 });
negotiationRuleSchema.index({ clearanceFlag: 1 });

module.exports = mongoose.model('NegotiationRule', negotiationRuleSchema);
