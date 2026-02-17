const mongoose = require('mongoose');

/**
 * ProductVector Model - Stores vector embeddings for semantic search
 * Supports both local and API-based embedding models
 */
const productVectorSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
    unique: true,
    index: true
  },
  
  // Vector embedding (384 dimensions for all-MiniLM-L6-v2)
  embedding: {
    type: [Number],
    required: true,
    validate: {
      validator: function(v) {
        return v.length === 384; // Standard embedding size
      },
      message: 'Embedding must have exactly 384 dimensions'
    }
  },
  
  // Text used to generate embedding
  embeddingText: {
    type: String,
    required: true
  },
  
  // Metadata for debugging
  embeddingModel: {
    type: String,
    default: 'all-MiniLM-L6-v2'
  },
  embeddingVersion: {
    type: Number,
    default: 1
  },
  
  // Timestamps
  updatedAt: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: true
});

// Index for efficient lookups
productVectorSchema.index({ productId: 1 });
productVectorSchema.index({ updatedAt: -1 });

// Static method to upsert vector
productVectorSchema.statics.upsertVector = async function(productId, embedding, embeddingText) {
  return this.findOneAndUpdate(
    { productId },
    {
      productId,
      embedding,
      embeddingText,
      updatedAt: new Date()
    },
    { upsert: true, new: true }
  );
};

// Static method to find similar products using cosine similarity
productVectorSchema.statics.findSimilar = async function(embedding, limit = 10, excludeIds = []) {
  // Get all vectors (for small datasets)
  // For large datasets, use approximate nearest neighbor search (ANN)
  const allVectors = await this.find({
    productId: { $nin: excludeIds }
  }).lean();
  
  // Calculate cosine similarity
  const similarities = allVectors.map(vec => {
    const similarity = this.cosineSimilarity(embedding, vec.embedding);
    return {
      productId: vec.productId,
      similarity,
      score: similarity
    };
  });
  
  // Sort by similarity and return top N
  return similarities
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, limit);
};

// Helper: Cosine similarity calculation
productVectorSchema.statics.cosineSimilarity = function(vecA, vecB) {
  if (vecA.length !== vecB.length) {
    throw new Error('Vectors must have same length');
  }
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  
  normA = Math.sqrt(normA);
  normB = Math.sqrt(normB);
  
  if (normA === 0 || normB === 0) {
    return 0;
  }
  
  return dotProduct / (normA * normB);
};

module.exports = mongoose.model('ProductVector', productVectorSchema);
