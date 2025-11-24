const { Sequelize } = require('sequelize');
const path = require('path');
require('dotenv').config();

// SQLite connection (no installation required!)
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, '..', 'database.sqlite'),
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  define: {
    timestamps: true,
    underscored: false,
    freezeTableName: false
  }
});

// Test connection
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ SQLite database connected successfully');
    return true;
  } catch (error) {
    console.error('❌ Unable to connect to SQLite:', error.message);
    return false;
  }
};

module.exports = { sequelize, testConnection };
