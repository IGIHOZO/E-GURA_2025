const mongoose = require('mongoose');

const negotiationAnalyticsSchema = new mongoose.Schema({
  date: { 
    type: Date, 
    required: true,
    index: true 
  },
  sku: { 
    type: String, 
    required: true,
    index: true 
  },
  
  // Aggregated metrics
  totalNegotiations: { type: Number, default: 0 },
  acceptedCount: { type: Number, default: 0 },
  rejectedCount: { type: Number, default: 0 },
  abandonedCount: { type: Number, default: 0 },
  
  conversionRate: { type: Number, default: 0 }, // accepted / total
  
  avgRounds: { type: Number, default: 0 },
  avgDiscountPct: { type: Number, default: 0 },
  avgMarginImpact: { type: Number, default: 0 },
  avgTimeToDecision: { type: Number, default: 0 }, // seconds
  
  totalRevenue: { type: Number, default: 0 },
  totalDiscountGiven: { type: Number, default: 0 },
  
  // Round distribution
  roundDistribution: {
    round1: { type: Number, default: 0 },
    round2: { type: Number, default: 0 },
    round3: { type: Number, default: 0 },
    round4Plus: { type: Number, default: 0 }
  },
  
  // Segment breakdown
  segmentBreakdown: {
    new: {
      count: { type: Number, default: 0 },
      conversionRate: { type: Number, default: 0 },
      avgDiscount: { type: Number, default: 0 }
    },
    returning: {
      count: { type: Number, default: 0 },
      conversionRate: { type: Number, default: 0 },
      avgDiscount: { type: Number, default: 0 }
    },
    vip: {
      count: { type: Number, default: 0 },
      conversionRate: { type: Number, default: 0 },
      avgDiscount: { type: Number, default: 0 }
    }
  },
  
  // Perks usage
  perksUsed: {
    freeShipping: { type: Number, default: 0 },
    freeGift: { type: Number, default: 0 },
    extendedWarranty: { type: Number, default: 0 },
    bundle: { type: Number, default: 0 }
  },
  
  // Fraud flags
  fraudFlagCount: { type: Number, default: 0 },
  
  metadata: {
    lastUpdated: Date
  }
}, {
  timestamps: true
});

// Compound index for date + sku queries
negotiationAnalyticsSchema.index({ date: -1, sku: 1 });
negotiationAnalyticsSchema.index({ date: -1 });

module.exports = mongoose.model('NegotiationAnalytics', negotiationAnalyticsSchema);
