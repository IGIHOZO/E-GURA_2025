// PostgreSQL Models Index
// This file exports all Sequelize models with Mongoose-like API

const { wrapModel } = require('../utils/db-adapter');

const Product = require('./Product');
const User = require('./User');
const Order = require('./Order');
const Category = require('./Category');
const Customer = require('./Customer');
const Review = require('./Review');
const Wishlist = require('./Wishlist');
const Address = require('./Address');

// Define relationships
Order.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasMany(Order, { foreignKey: 'userId', as: 'orders' });

Review.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Review.belongsTo(Product, { foreignKey: 'productId', as: 'product' });
User.hasMany(Review, { foreignKey: 'userId', as: 'userReviews' });
Product.hasMany(Review, { foreignKey: 'productId', as: 'productReviews' });

Wishlist.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Wishlist.belongsTo(Product, { foreignKey: 'productId', as: 'product' });
User.hasMany(Wishlist, { foreignKey: 'userId', as: 'wishlist' });

Address.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasMany(Address, { foreignKey: 'userId', as: 'userAddresses' });

// Wrap models to add Mongoose-like methods
const wrappedProduct = wrapModel(Product);
const wrappedUser = wrapModel(User);
const wrappedOrder = wrapModel(Order);
const wrappedCategory = wrapModel(Category);
const wrappedCustomer = wrapModel(Customer);
const wrappedReview = wrapModel(Review);
const wrappedWishlist = wrapModel(Wishlist);
const wrappedAddress = wrapModel(Address);

module.exports = {
  Product: wrappedProduct,
  User: wrappedUser,
  Order: wrappedOrder,
  Category: wrappedCategory,
  Customer: wrappedCustomer,
  Review: wrappedReview,
  Wishlist: wrappedWishlist,
  Address: wrappedAddress
};
