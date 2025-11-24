// Model Adapter - Automatically uses PostgreSQL or MongoDB models
require('dotenv').config();

const dbType = process.env.DATABASE_TYPE || 'postgres';

let models;

if (dbType === 'postgres') {
  // Use PostgreSQL models
  console.log('📊 Loading PostgreSQL models...');
  models = require('../models-postgres');
} else {
  // Use MongoDB models (original)
  console.log('📊 Loading MongoDB models...');
  const Product = require('./Product');
  const User = require('./User');
  const Order = require('./Order');
  const Category = require('./Category');
  const Customer = require('./Customer');
  
  models = {
    Product,
    User,
    Order,
    Category,
    Customer
  };
}

module.exports = models;
