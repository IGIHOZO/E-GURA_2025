const mongoose = require('mongoose');

/**
 * Synonym Model - Query expansion for better search recall
 */
const synonymSchema = new mongoose.Schema({
  term: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true
  },
  
  // Synonyms and related terms
  variants: [{
    type: String,
    lowercase: true,
    trim: true
  }],
  
  // Category-specific synonyms
  category: String,
  
  // Usage statistics
  usageCount: {
    type: Number,
    default: 0
  },
  lastUsed: Date,
  
  // Admin management
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: String,
    default: 'system'
  },
  
  // Metadata
  notes: String
}, {
  timestamps: true
});

// Indexes
synonymSchema.index({ term: 1, isActive: 1 });
synonymSchema.index({ variants: 1 });

// Static method to expand query
synonymSchema.statics.expandQuery = async function(query) {
  const terms = query.toLowerCase().split(/\s+/);
  const expandedTerms = new Set(terms);
  
  // Find synonyms for each term
  const synonyms = await this.find({
    $or: [
      { term: { $in: terms } },
      { variants: { $in: terms } }
    ],
    isActive: true
  }).lean();
  
  // Add all variants
  synonyms.forEach(syn => {
    expandedTerms.add(syn.term);
    syn.variants.forEach(v => expandedTerms.add(v));
  });
  
  return Array.from(expandedTerms);
};

// Static method to track usage
synonymSchema.statics.trackUsage = async function(term) {
  await this.findOneAndUpdate(
    { term: term.toLowerCase() },
    {
      $inc: { usageCount: 1 },
      lastUsed: new Date()
    }
  );
};

module.exports = mongoose.model('Synonym', synonymSchema);
