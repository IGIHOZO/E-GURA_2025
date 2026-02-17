const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Order = sequelize.define('Order', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: true, // Allow guest orders without userId
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  orderNumber: {
    type: DataTypes.STRING,
    unique: true
  },
  referenceNumber: DataTypes.STRING,
  externalId: DataTypes.STRING,
  items: DataTypes.JSONB,
  subtotal: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  tax: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  shippingCost: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  discount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  total: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  totalAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  paymentMethod: {
    type: DataTypes.STRING,
    allowNull: false
  },
  paymentMode: DataTypes.STRING,
  paymentStatus: {
    type: DataTypes.ENUM('pending', 'processing', 'completed', 'failed', 'refunded'),
    defaultValue: 'pending'
  },
  paymentDetails: DataTypes.JSONB,
  shippingAddress: DataTypes.JSONB,
  customerInfo: DataTypes.JSONB,
  status: {
    type: DataTypes.ENUM('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'returned'),
    defaultValue: 'pending'
  },
  trackingNumber: DataTypes.STRING,
  estimatedDelivery: DataTypes.DATE,
  actualDelivery: DataTypes.DATE,
  mobileMoney: DataTypes.JSONB,
  momoPay: DataTypes.JSONB,
  cashOnDelivery: DataTypes.JSONB,
  notes: DataTypes.JSONB,
  orderDate: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  statusHistory: DataTypes.JSONB
}, {
  timestamps: true
});

// Generate order number before create
Order.beforeCreate(async (order) => {
  if (!order.orderNumber) {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    order.orderNumber = `SEW${year}${month}${day}${random}`;
    
    if (!order.referenceNumber) {
      order.referenceNumber = order.orderNumber;
    }
  }
});

module.exports = Order;
