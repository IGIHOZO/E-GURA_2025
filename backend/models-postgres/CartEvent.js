const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

/**
 * CartEvent Model - Tracks cart add/remove events for co-purchase analysis
 */
const CartEvent = sequelize.define('CartEvent', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  sessionId: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'Anonymous session ID or user ID'
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  productId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Products',
      key: 'id'
    }
  },
  eventType: {
    type: DataTypes.ENUM('add', 'remove', 'view', 'purchase'),
    allowNull: false
  },
  quantity: {
    type: DataTypes.INTEGER,
    defaultValue: 1
  },
  cartSnapshot: {
    type: DataTypes.JSONB,
    allowNull: true,
    comment: 'Snapshot of other items in cart at event time'
  },
  metadata: {
    type: DataTypes.JSONB,
    allowNull: true,
    comment: 'Additional context (source page, device, etc.)'
  }
}, {
  timestamps: true,
  indexes: [
    { fields: ['sessionId'] },
    { fields: ['userId'] },
    { fields: ['productId'] },
    { fields: ['eventType'] },
    { fields: ['createdAt'] }
  ]
});

module.exports = CartEvent;
