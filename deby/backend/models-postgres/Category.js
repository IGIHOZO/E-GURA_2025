const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Category = sequelize.define('Category', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  slug: DataTypes.STRING,
  description: DataTypes.TEXT,
  image: DataTypes.STRING,
  icon: DataTypes.STRING,
  parentId: DataTypes.UUID,
  level: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  path: DataTypes.STRING,
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  displayOrder: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  metaTitle: DataTypes.STRING,
  metaDescription: DataTypes.TEXT
}, {
  timestamps: true
});

module.exports = Category;
