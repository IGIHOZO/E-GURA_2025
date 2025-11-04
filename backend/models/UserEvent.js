const mongoose = require('mongoose');

/**
 * UserEvent Model - Tracks all user interactions for personalization
 * Supports both logged-in users and anonymous devices
 */
const userEventSchema = new mongoose.Schema({
  // Identity (at least one required)
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    index: true
  },
  deviceId: {
    type: String,
    index: true,
    required: true // Always track device for anonymous users
  },
  sessionId: {
    type: String,
    index: true
  },
  
  // Event type
  eventType: {
    type: String,
    required: true,
    enum: [
      'search',
      'view',
      'click',
      'add_to_cart',
      'remove_from_cart',
      'purchase',
      'wishlist_add',
      'wishlist_remove',
      'category_visit',
      'filter_apply',
      'sort_change'
    ],
    index: true
  },
  
  // Event data
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    index: true
  },
  query: {
    type: String,
    index: 'text'
  },
  category: String,
  filters: mongoose.Schema.Types.Mixed,
  sortBy: String,
  
  // Purchase data
  priceAtTime: Number,
  quantity: {
    type: Number,
    default: 1
  },
  
  // Engagement metrics
  dwellTime: Number, // seconds spent on product page
  scrollDepth: Number, // percentage of page scrolled
  clickPosition: Number, // position in search results
  
  // Context
  referrer: String,
  pageUrl: String,
  metadata: {
    device: String,
    browser: String,
    os: String,
    viewport: String,
    userAgent: String
  },
  
  // Timestamp
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  
  // TTL for privacy compliance (90 days for anonymous)
  expiresAt: {
    type: Date,
    index: true
  }
}, {
  timestamps: true
});

// Compound indexes for efficient queries
userEventSchema.index({ deviceId: 1, timestamp: -1 });
userEventSchema.index({ userId: 1, timestamp: -1 });
userEventSchema.index({ deviceId: 1, eventType: 1, timestamp: -1 });
userEventSchema.index({ productId: 1, eventType: 1 });
userEventSchema.index({ eventType: 1, timestamp: -1 });

// TTL index for automatic cleanup
userEventSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Pre-save middleware to set expiration for anonymous users
userEventSchema.pre('save', function(next) {
  if (!this.userId && !this.expiresAt) {
    // Anonymous events expire after 90 days
    this.expiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
  }
  next();
});

// Static method to track event
userEventSchema.statics.track = async function(eventData) {
  try {
    const event = new this(eventData);
    await event.save();
    return event;
  } catch (error) {
    console.error('Error tracking event:', error);
    // Don't throw - tracking failures shouldn't break app
    return null;
  }
};

// Static method to get user history
userEventSchema.statics.getUserHistory = async function(identifier, limit = 100) {
  const query = identifier.userId 
    ? { userId: identifier.userId }
    : { deviceId: identifier.deviceId };
  
  return this.find(query)
    .sort({ timestamp: -1 })
    .limit(limit)
    .populate('productId', 'name category price mainImage')
    .lean();
};

// Static method to get trending products
userEventSchema.statics.getTrending = async function(category = null, hours = 24) {
  const since = new Date(Date.now() - hours * 60 * 60 * 1000);
  const match = {
    eventType: { $in: ['view', 'click', 'add_to_cart', 'purchase'] },
    timestamp: { $gte: since },
    productId: { $exists: true }
  };
  
  if (category) {
    match.category = category;
  }
  
  return this.aggregate([
    { $match: match },
    {
      $group: {
        _id: '$productId',
        score: {
          $sum: {
            $switch: {
              branches: [
                { case: { $eq: ['$eventType', 'purchase'] }, then: 10 },
                { case: { $eq: ['$eventType', 'add_to_cart'] }, then: 5 },
                { case: { $eq: ['$eventType', 'click'] }, then: 2 },
                { case: { $eq: ['$eventType', 'view'] }, then: 1 }
              ],
              default: 0
            }
          }
        },
        events: { $sum: 1 }
      }
    },
    { $sort: { score: -1 } },
    { $limit: 50 }
  ]);
};

module.exports = mongoose.model('UserEvent', userEventSchema);
