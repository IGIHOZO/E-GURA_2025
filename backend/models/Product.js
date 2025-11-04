const mongoose = require('mongoose');

// Review schema
const reviewSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

// Product schema
const productSchema = new mongoose.Schema({
  // Basic Info
  name: { type: String, required: true },
  slug: { type: String, unique: true },
  description: { type: String, required: true },
  shortDescription: String,
  // Pricing
  price: { type: Number, required: true },
  originalPrice: Number,
  discountPercentage: { type: Number, default: 0 },
  
  // Images (Up to 3 images + 1 video)
  mainImage: { type: String, required: true },
  images: [String],
  video: String,
  
  // SEO Fields
  seoTitle: String,
  seoDescription: String,
  seoKeywords: [String],
  metaTags: {
    ogTitle: String,
    ogDescription: String,
    ogImage: String,
    twitterCard: String
  },
  
  // Categorization
  category: { type: String, required: true },
  subcategory: String,
  brand: { type: String, default: 'E-Gura Store' },
  tags: [String],
  
  // Product Details
  gender: { type: String, enum: ['male', 'female', 'unisex'], default: 'female' },
  ageGroup: { type: String, enum: ['kids', 'teen', 'adult'], default: 'adult' },
  material: [String],
  care: [String],
  
  // Variants
  sizes: [String],
  colors: [String],
  variants: [{
    size: String,
    color: String,
    price: Number,
    stockQuantity: Number,
    sku: String,
    image: String // Specific image for this variant
  }],
  
  // Inventory
  stockQuantity: { type: Number, default: 0 },
  lowStockThreshold: { type: Number, default: 5 },
  sku: { type: String, unique: true },
  
  // Product Status
  isActive: { type: Boolean, default: true },
  isFeatured: { type: Boolean, default: false },
  isNewProduct: { type: Boolean, default: false }, // renamed from isNew (reserved)
  isSale: { type: Boolean, default: false },
  isBestSeller: { type: Boolean, default: false },
  
  // Reviews and Ratings
  reviews: [reviewSchema],
  averageRating: { type: Number, default: 0 },
  totalReviews: { type: Number, default: 0 },
  
  // SEO and Marketing
  metaTitle: String,
  metaDescription: String,
  keywords: [String],
  
  // Analytics
  viewCount: { type: Number, default: 0 },
  salesCount: { type: Number, default: 0 },
  
  // Shipping
  weight: Number,
  dimensions: {
    length: Number,
    width: Number,
    height: Number
  },
  shippingClass: { type: String, enum: ['standard', 'express', 'free'], default: 'standard' },
  
  // Additional Info
  careInstructions: [String],
  returnPolicy: String,
  warranty: String,
  
  // AI Bargaining Settings
  bargainEnabled: { type: Boolean, default: true },
  minBargainPrice: { type: Number },
  maxBargainDiscount: { type: Number, default: 25, min: 5, max: 50 },
  bargainStrategy: { 
    type: String, 
    enum: ['aggressive', 'balanced', 'conservative'], 
    default: 'balanced' 
  },
  
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for discounted price
productSchema.virtual('discountedPrice').get(function() {
  if (this.discountPercentage > 0) {
    return this.price - (this.price * this.discountPercentage / 100);
  }
  return this.price;
});

// Virtual for stock status
productSchema.virtual('stockStatus').get(function() {
  if (this.stockQuantity === 0) return 'out_of_stock';
  if (this.stockQuantity <= this.lowStockThreshold) return 'low_stock';
  return 'in_stock';
});

// Virtual for calculated average rating
productSchema.virtual('calculatedRating').get(function() {
  if (this.reviews.length === 0) return 0;
  const total = this.reviews.reduce((sum, review) => sum + review.rating, 0);
  return (total / this.reviews.length).toFixed(1);
});

// Pre-save middleware to generate slug
productSchema.pre('save', function(next) {
  if (this.isModified('name')) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
  next();
});

// Pre-save middleware to update average rating
productSchema.pre('save', function(next) {
  if (this.reviews.length > 0) {
    const total = this.reviews.reduce((sum, review) => sum + review.rating, 0);
    this.averageRating = (total / this.reviews.length).toFixed(1);
    this.totalReviews = this.reviews.length;
  }
  next();
});

// Index for better search performance
productSchema.index({ name: 'text', description: 'text', tags: 'text' });
productSchema.index({ category: 1, isActive: 1 });
productSchema.index({ isFeatured: 1, isActive: 1 });
productSchema.index({ isNewProduct: 1, isActive: 1 });
productSchema.index({ isSale: 1, isActive: 1 });

module.exports = mongoose.model('Product', productSchema); 