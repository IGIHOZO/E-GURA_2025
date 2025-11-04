const mongoose = require('mongoose');

const featureFlagSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true,
    unique: true,
    index: true 
  },
  enabled: { 
    type: Boolean, 
    default: false 
  },
  rolloutPercentage: { 
    type: Number, 
    min: 0,
    max: 100,
    default: 0
  },
  targetSegments: [{
    type: String,
    enum: ['new', 'returning', 'vip', 'all']
  }],
  targetSkus: [String], // Empty = all SKUs
  
  description: String,
  
  metadata: {
    createdBy: String,
    lastModifiedBy: String,
    notes: String
  }
}, {
  timestamps: true
});

// Method to check if feature is enabled for a user
featureFlagSchema.methods.isEnabledForUser = function(userId, userSegment = 'all') {
  if (!this.enabled) return false;
  
  // Check segment targeting
  if (this.targetSegments.length > 0 && 
      !this.targetSegments.includes(userSegment) && 
      !this.targetSegments.includes('all')) {
    return false;
  }
  
  // Rollout percentage check (deterministic based on userId)
  if (this.rolloutPercentage < 100) {
    const hash = userId.split('').reduce((acc, char) => {
      return acc + char.charCodeAt(0);
    }, 0);
    const bucket = hash % 100;
    return bucket < this.rolloutPercentage;
  }
  
  return true;
};

module.exports = mongoose.model('FeatureFlag', featureFlagSchema);
