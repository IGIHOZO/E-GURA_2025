const mongoose = require('mongoose');

const roundSchema = new mongoose.Schema({
  roundNumber: { type: Number, required: true },
  userOffer: { type: Number, required: true },
  aiCounter: { type: Number },
  aiResponse: {
    status: { 
      type: String, 
      enum: ['counter', 'accept', 'reject', 'final'],
      required: true 
    },
    counterPrice: Number,
    justification: {
      en: String,
      rw: String
    },
    altPerks: [{
      type: { 
        type: String, 
        enum: ['freeShipping', 'freeGift', 'extendedWarranty', 'bundle']
      },
      description: {
        en: String,
        rw: String
      },
      value: mongoose.Schema.Types.Mixed
    }],
    bundleSuggestions: [{
      sku: String,
      name: {
        en: String,
        rw: String
      },
      price: Number,
      discount: Number
    }]
  },
  timestamp: { type: Date, default: Date.now },
  llmPrompt: String, // For debugging
  llmResponse: mongoose.Schema.Types.Mixed, // Raw LLM output
  processingTimeMs: Number
}, { _id: false });

const negotiationSchema = new mongoose.Schema({
  sessionId: { 
    type: String, 
    required: true,
    unique: true,
    index: true 
  },
  sku: { 
    type: String, 
    required: true,
    index: true 
  },
  userId: { 
    type: String, 
    required: true,
    index: true 
  },
  userSegment: {
    type: String,
    enum: ['new', 'returning', 'vip', 'default'],
    default: 'default'
  },
  quantity: { 
    type: Number, 
    required: true,
    min: 1,
    default: 1
  },
  basePrice: { type: Number, required: true },
  floorPrice: { type: Number, required: true },
  
  rounds: [roundSchema],
  
  currentRound: { 
    type: Number, 
    default: 0 
  },
  maxRounds: { 
    type: Number, 
    default: 3 
  },
  
  status: {
    type: String,
    enum: ['active', 'accepted', 'rejected', 'expired', 'abandoned'],
    default: 'active',
    index: true
  },
  
  finalPrice: Number,
  finalPerks: [{
    type: String
  }],
  
  acceptedAt: Date,
  expiresAt: { 
    type: Date,
    index: true 
  },
  
  discountToken: String, // Generated on acceptance
  discountApplied: { 
    type: Boolean, 
    default: false 
  },
  
  // Analytics fields
  analytics: {
    initialOffer: Number,
    finalOffer: Number,
    discountGiven: Number,
    discountPct: Number,
    marginImpact: Number,
    roundsUsed: Number,
    timeToDecision: Number, // seconds
    abandonedAtRound: Number,
    conversionSource: {
      type: String,
      enum: ['product_page', 'product_detail', 'cart_page', 'exit_intent', 'dwell_trigger']
    }
  },
  
  // Fraud detection
  fraudFlags: [{
    flag: String,
    severity: { type: String, enum: ['low', 'medium', 'high'] },
    timestamp: Date
  }],
  
  ipAddress: String,
  userAgent: String,
  
  metadata: {
    language: { type: String, enum: ['en', 'rw'], default: 'en' },
    deviceType: String,
    referrer: String
  }
}, {
  timestamps: true
});

// Indexes for analytics queries
negotiationSchema.index({ createdAt: -1 });
negotiationSchema.index({ status: 1, createdAt: -1 });
negotiationSchema.index({ sku: 1, status: 1 });
negotiationSchema.index({ userId: 1, createdAt: -1 });
negotiationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index

// Methods
negotiationSchema.methods.addRound = function(userOffer, aiResponse, llmData) {
  this.rounds.push({
    roundNumber: this.currentRound + 1,
    userOffer,
    aiCounter: aiResponse.counterPrice,
    aiResponse,
    llmPrompt: llmData?.prompt,
    llmResponse: llmData?.response,
    processingTimeMs: llmData?.processingTimeMs,
    timestamp: new Date()
  });
  this.currentRound += 1;
};

negotiationSchema.methods.isExpired = function() {
  return this.expiresAt && new Date() > this.expiresAt;
};

negotiationSchema.methods.canNegotiate = function() {
  return this.status === 'active' && 
         this.currentRound < this.maxRounds && 
         !this.isExpired();
};

module.exports = mongoose.model('Negotiation', negotiationSchema);
