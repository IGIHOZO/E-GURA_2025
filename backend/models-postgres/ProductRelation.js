const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

/**
 * ProductRelation Model - Stores computed product relationships for fast lookup
 */
const ProductRelation = sequelize.define('ProductRelation', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  productId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Products',
      key: 'id'
    }
  },
  relatedProductId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Products',
      key: 'id'
    }
  },
  relationType: {
    type: DataTypes.ENUM(
      'copurchase',      // Frequently bought together
      'essential',       // Essential accessory (e.g., phone -> case)
      'compatible',      // Brand/model compatible
      'category_match',  // Same category/subcategory
      'complement',      // Complementary product
      'upgrade',         // Premium version
      'bundle'           // Part of bundle
    ),
    allowNull: false
  },
  score: {
    type: DataTypes.DECIMAL(5, 4),
    defaultValue: 0,
    comment: 'Relationship strength score (0-1)'
  },
  copurchaseCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Number of times bought together'
  },
  confidenceLevel: {
    type: DataTypes.DECIMAL(5, 4),
    defaultValue: 0,
    comment: 'Statistical confidence in this relationship'
  },
  metadata: {
    type: DataTypes.JSONB,
    allowNull: true,
    comment: 'Additional relationship data'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  lastCalculated: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  timestamps: true,
  indexes: [
    { fields: ['productId', 'relatedProductId'], unique: true },
    { fields: ['productId', 'relationType'] },
    { fields: ['score'] },
    { fields: ['copurchaseCount'] }
  ]
});

module.exports = ProductRelation;
