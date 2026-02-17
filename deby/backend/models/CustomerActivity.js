const mongoose = require('mongoose');

/**
 * CustomerActivity Model
 * Tracks every single customer interaction and activity
 * This provides a complete audit trail for admin monitoring
 */
const customerActivitySchema = new mongoose.Schema({
  // Link to Customer by Phone Number (Primary Key)
  customerPhone: {
    type: String,
    required: true,
    index: true
  },
  
  // Link to Customer Document
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true,
    index: true
  },
  
  // Activity Type
  activityType: {
    type: String,
    required: true,
    enum: [
      // Account Activities
      'account_created',
      'account_verified',
      'login',
      'logout',
      'password_changed',
      'profile_updated',
      
      // Shopping Activities
      'product_viewed',
      'product_searched',
      'category_browsed',
      'cart_item_added',
      'cart_item_removed',
      'cart_updated',
      'wishlist_added',
      'wishlist_removed',
      
      // Order Activities
      'order_initiated',
      'order_placed',
      'order_confirmed',
      'order_paid',
      'order_shipped',
      'order_delivered',
      'order_cancelled',
      'order_returned',
      
      // Payment Activities
      'payment_initiated',
      'payment_completed',
      'payment_failed',
      'payment_method_added',
      'payment_method_removed',
      
      // Address Activities
      'address_added',
      'address_updated',
      'address_removed',
      'address_set_default',
      
      // AI Activities
      'ai_recommendation_requested',
      'ai_recommendation_accepted',
      'ai_recommendation_rejected',
      'ai_size_recommendation',
      'ai_style_recommendation',
      'virtual_tryon_used',
      
      // Communication Activities
      'email_sent',
      'sms_sent',
      'notification_sent',
      'notification_read',
      
      // Review Activities
      'review_posted',
      'review_updated',
      'review_deleted',
      
      // Support Activities
      'support_ticket_created',
      'support_ticket_updated',
      'support_ticket_closed'
    ]
  },
  
  // Activity Details (Flexible JSON)
  details: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  
  // Related Documents
  relatedOrder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order'
  },
  relatedProduct: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  },
  relatedPayment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Payment'
  },
  
  // Metadata
  metadata: {
    ipAddress: String,
    userAgent: String,
    device: {
      type: String,
      enum: ['mobile', 'tablet', 'desktop', 'unknown']
    },
    browser: String,
    os: String,
    location: {
      city: String,
      district: String,
      country: String
    },
    sessionId: String
  },
  
  // Status
  status: {
    type: String,
    enum: ['success', 'failed', 'pending', 'cancelled'],
    default: 'success'
  },
  
  // Error Information (if failed)
  error: {
    message: String,
    code: String,
    stack: String
  },
  
  // Value/Amount (for financial activities)
  amount: {
    type: Number,
    default: 0
  },
  currency: {
    type: String,
    default: 'RWF'
  },
  
  // Timestamp
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  
  // Admin Visibility
  visibleToAdmin: {
    type: Boolean,
    default: true
  },
  
  // Priority for Admin Review
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'low'
  },
  
  // Admin Review Status
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  },
  reviewedAt: Date,
  adminNotes: String
  
}, {
  timestamps: true
});

// Indexes for Performance
customerActivitySchema.index({ customerPhone: 1, timestamp: -1 });
customerActivitySchema.index({ customer: 1, timestamp: -1 });
customerActivitySchema.index({ activityType: 1, timestamp: -1 });
customerActivitySchema.index({ relatedOrder: 1 });
customerActivitySchema.index({ timestamp: -1 });
customerActivitySchema.index({ status: 1 });
customerActivitySchema.index({ priority: 1, reviewedBy: 1 });

// Static method to log activity
customerActivitySchema.statics.logActivity = async function(data) {
  try {
    const activity = new this({
      customerPhone: data.customerPhone,
      customer: data.customerId,
      activityType: data.activityType,
      details: data.details || {},
      relatedOrder: data.orderId,
      relatedProduct: data.productId,
      relatedPayment: data.paymentId,
      metadata: {
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        device: data.device || 'unknown',
        browser: data.browser,
        os: data.os,
        location: data.location,
        sessionId: data.sessionId
      },
      status: data.status || 'success',
      error: data.error,
      amount: data.amount || 0,
      currency: data.currency || 'RWF',
      priority: data.priority || 'low'
    });
    
    await activity.save();
    return activity;
  } catch (error) {
    console.error('Error logging customer activity:', error);
    throw error;
  }
};

// Static method to get customer timeline
customerActivitySchema.statics.getCustomerTimeline = async function(customerPhone, options = {}) {
  const query = { customerPhone };
  
  if (options.activityTypes) {
    query.activityType = { $in: options.activityTypes };
  }
  
  if (options.startDate) {
    query.timestamp = { $gte: new Date(options.startDate) };
  }
  
  if (options.endDate) {
    query.timestamp = { ...query.timestamp, $lte: new Date(options.endDate) };
  }
  
  return this.find(query)
    .sort({ timestamp: -1 })
    .limit(options.limit || 100)
    .populate('relatedOrder')
    .populate('relatedProduct')
    .populate('relatedPayment')
    .lean();
};

// Static method to get activity summary
customerActivitySchema.statics.getActivitySummary = async function(customerPhone) {
  const activities = await this.find({ customerPhone });
  
  const summary = {
    totalActivities: activities.length,
    byType: {},
    byStatus: {},
    totalAmount: 0,
    lastActivity: null,
    firstActivity: null
  };
  
  activities.forEach(activity => {
    // Count by type
    summary.byType[activity.activityType] = (summary.byType[activity.activityType] || 0) + 1;
    
    // Count by status
    summary.byStatus[activity.status] = (summary.byStatus[activity.status] || 0) + 1;
    
    // Sum amounts
    if (activity.amount) {
      summary.totalAmount += activity.amount;
    }
    
    // Track first and last activity
    if (!summary.firstActivity || activity.timestamp < summary.firstActivity) {
      summary.firstActivity = activity.timestamp;
    }
    if (!summary.lastActivity || activity.timestamp > summary.lastActivity) {
      summary.lastActivity = activity.timestamp;
    }
  });
  
  return summary;
};

// Method to mark as reviewed by admin
customerActivitySchema.methods.markReviewed = async function(adminId, notes) {
  this.reviewedBy = adminId;
  this.reviewedAt = new Date();
  this.adminNotes = notes;
  await this.save();
};

module.exports = mongoose.model('CustomerActivity', customerActivitySchema);
