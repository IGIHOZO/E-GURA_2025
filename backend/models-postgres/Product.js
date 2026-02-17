const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Product = sequelize.define('Product', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING(500),
    allowNull: false
  },
  slug: {
    type: DataTypes.STRING(600),
    unique: true
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  shortDescription: DataTypes.TEXT,
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  originalPrice: DataTypes.DECIMAL(10, 2),
  discountPercentage: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 0
  },
  mainImage: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  images: DataTypes.ARRAY(DataTypes.TEXT),
  video: DataTypes.TEXT,
  seoTitle: DataTypes.STRING(500),
  seoDescription: DataTypes.TEXT,
  seoKeywords: DataTypes.ARRAY(DataTypes.STRING),
  metaTags: DataTypes.JSONB,
  category: {
    type: DataTypes.STRING(300),
    allowNull: false
  },
  subcategory: DataTypes.STRING(300),
  brand: {
    type: DataTypes.STRING(300),
    defaultValue: 'E-Gura Store'
  },
  tags: DataTypes.ARRAY(DataTypes.TEXT),
  gender: {
    type: DataTypes.ENUM('male', 'female', 'unisex'),
    defaultValue: 'female'
  },
  ageGroup: {
    type: DataTypes.ENUM('kids', 'teen', 'adult'),
    defaultValue: 'adult'
  },
  material: DataTypes.ARRAY(DataTypes.TEXT),
  care: DataTypes.ARRAY(DataTypes.TEXT),
  sizes: DataTypes.ARRAY(DataTypes.TEXT),
  colors: DataTypes.ARRAY(DataTypes.TEXT),
  variants: DataTypes.JSONB,
  stockQuantity: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  lowStockThreshold: {
    type: DataTypes.INTEGER,
    defaultValue: 5
  },
  sku: {
    type: DataTypes.STRING(300),
    unique: true
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  isFeatured: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  isNew: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  isSale: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  isBestSeller: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  reviews: DataTypes.JSONB,
  averageRating: {
    type: DataTypes.DECIMAL(2, 1),
    defaultValue: 0
  },
  totalReviews: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  metaTitle: DataTypes.STRING(500),
  metaDescription: DataTypes.TEXT,
  keywords: DataTypes.ARRAY(DataTypes.TEXT),
  viewCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  salesCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  weight: DataTypes.DECIMAL(10, 2),
  dimensions: DataTypes.JSONB,
  shippingClass: {
    type: DataTypes.ENUM('standard', 'express', 'free'),
    defaultValue: 'standard'
  },
  careInstructions: DataTypes.ARRAY(DataTypes.TEXT),
  returnPolicy: DataTypes.TEXT,
  warranty: DataTypes.TEXT,
  bargainEnabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  minBargainPrice: DataTypes.DECIMAL(10, 2),
  maxBargainDiscount: {
    type: DataTypes.INTEGER,
    defaultValue: 25
  },
  bargainStrategy: {
    type: DataTypes.ENUM('aggressive', 'balanced', 'conservative'),
    defaultValue: 'balanced'
  }
}, {
  timestamps: true,
  indexes: [
    { fields: ['category', 'isActive'] },
    { fields: ['isFeatured', 'isActive'] },
    { fields: ['isNew', 'isActive'] },
    { fields: ['isSale', 'isActive'] }
  ]
});

// Hooks for slug generation
Product.beforeCreate(async (product) => {
  if (product.name && !product.slug) {
    product.slug = product.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
});

Product.beforeUpdate(async (product) => {
  if (product.name && !product.slug) {
    product.slug = product.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
});

module.exports = Product;
