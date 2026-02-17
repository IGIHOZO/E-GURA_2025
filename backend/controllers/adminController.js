const { Product, Order, User } = require('../models');
const seoGenerator = require('../services/seoGenerator');
const { invalidateProductData } = require('../services/cacheInvalidation');
const { updateSalesCountForOrder } = require('../services/salesCountService');

// Handle Payment model separately as it might not be in the adapter
let Payment;
try {
  Payment = require('../models/Payment');
} catch (error) {
  console.log('ℹ️ Payment model not available');
}

// Product Management
const getAllProducts = async (req, res) => {
  try {
    const { page = 1, limit = 1000, search, category, status } = req.query;
    const offset = (page - 1) * limit;

    // Check if using Sequelize (PostgreSQL) or Mongoose (MongoDB)
    const isSequelize = Product.findAll !== undefined;

    if (isSequelize) {
      // PostgreSQL/Sequelize implementation
      const { Op } = require('sequelize');
      let where = {};
      
      if (search) {
        where[Op.or] = [
          { name: { [Op.iLike]: `%${search}%` } },
          { description: { [Op.iLike]: `%${search}%` } },
          { category: { [Op.iLike]: `%${search}%` } }
        ];
      }

      if (category && category !== 'All') {
        where.category = category;
      }

      if (status) {
        where.isActive = status === 'active';
      }

      const products = await Product.findAll({
        where,
        offset: parseInt(offset),
        limit: parseInt(limit),
        order: [['createdAt', 'DESC']]
      });

      const total = await Product.count({ where });

      res.json({
        success: true,
        products: products.map(p => p.toJSON ? p.toJSON() : p),
        data: products.map(p => p.toJSON ? p.toJSON() : p),
        total,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } else {
      // MongoDB/Mongoose implementation
      let query = {};
      
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          { category: { $regex: search, $options: 'i' } }
        ];
      }

      if (category && category !== 'All') {
        query.category = category;
      }

      if (status) {
        query.isActive = status === 'active';
      }

      const products = await Product.find(query)
        .sort({ createdAt: -1 })
        .skip(offset)
        .limit(parseInt(limit));

      const total = await Product.countDocuments(query);

      res.json({
        success: true,
        products: products,
        data: products,
        total,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      });
    }
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch products', error: error.message });
  }
};

const createProduct = async (req, res) => {
  try {
    console.log('📦 Creating new product...');
    console.log('Product name:', req.body.name);
    console.log('Has variants:', !!req.body.variants);
    
    const productData = req.body;
    
    // Validate required fields
    if (!productData.name) {
      return res.status(400).json({ 
        success: false, 
        message: 'Product name is required' 
      });
    }
    
    if (!productData.price || productData.price <= 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Valid product price is required' 
      });
    }
    
    if (!productData.mainImage) {
      return res.status(400).json({ 
        success: false, 
        message: 'Product main image is required' 
      });
    }
    
    // Generate slug from name
    let baseSlug = productData.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    
    // Ensure slug is unique (with max attempts to prevent infinite loop)
    let slug = baseSlug;
    let counter = 1;
    const maxAttempts = 100;
    
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const existing = await Product.findOne({ slug: slug });
      if (!existing) break;
      slug = `${baseSlug}-${counter}`;
      counter++;
    }
    
    productData.slug = slug;
    console.log('✅ Generated unique slug:', slug);
    
    // Generate unique SKU if not provided (do this BEFORE processing variants)
    if (!productData.sku) {
      productData.sku = `SKU-${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
    }
    
    // Ensure required fields have defaults
    productData.isActive = productData.isActive !== undefined ? productData.isActive : true;
    productData.isFeatured = productData.isFeatured !== undefined ? productData.isFeatured : false;
    productData.stockQuantity = productData.stockQuantity || 0;

    // Process variants BEFORE SEO generation (in case SEO needs variant info)
    if (productData.variants && Array.isArray(productData.variants) && productData.variants.length > 0) {
      console.log('🔍 Processing variants. Count:', productData.variants.length);
      
      productData.variants = productData.variants.map((variant, index) => {
        // Remove any circular references or problematic fields
        const cleaned = {
          size: variant.size || '',
          color: variant.color || '',
          price: parseFloat(variant.price) || parseFloat(productData.price) || 0,
          stockQuantity: parseInt(variant.stockQuantity) || 0,
          sku: variant.sku || `${productData.sku}-V${index + 1}`
        };
        console.log(`✅ Variant ${index + 1}:`, cleaned);
        return cleaned;
      });
      console.log('✅ All variants processed successfully');
    } else {
      // Remove empty or invalid variants
      delete productData.variants;
      console.log('ℹ️ Variants removed (empty or invalid)');
    }

    // Auto-generate SEO content if not provided (non-blocking)
    if (!productData.seoTitle) {
      productData.seoTitle = `${productData.name} | SEWITHDEBBY - Kigali, Rwanda`;
    }
    if (!productData.shortDescription) {
      const priceFormatted = productData.price ? productData.price.toLocaleString() : '0';
      productData.shortDescription = `Quality ${productData.category || 'product'} in Kigali, Rwanda. From ${priceFormatted} RWF.`;
    }
    if (!productData.tags || productData.tags.length === 0) {
      const nameLC = productData.name ? productData.name.toLowerCase() : 'product';
      productData.tags = [
        nameLC,
        `${nameLC} kigali`,
        `${nameLC} rwanda`,
        `buy ${nameLC}`,
        productData.category || 'fashion',
        'kigali fashion',
        'rwanda shopping',
        'SEWITHDEBBY'
      ];
    }
    
    console.log('Creating product with data:', {
      name: productData.name,
      slug: productData.slug,
      price: productData.price,
      hasVariants: !!productData.variants
    });

    const product = await Product.create(productData);

    console.log('✅ Product created successfully:', product.id);

    await invalidateProductData(product.id || product._id);

    res.status(201).json({
      success: true,
      data: product,
      message: 'Product created successfully with auto-generated SEO'
    });
  } catch (error) {
    console.error('❌ Error creating product:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    
    // Handle Sequelize validation errors
    if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ 
        success: false, 
        message: error.errors ? error.errors.map(e => e.message).join(', ') : error.message,
        error: error.message,
        details: error.errors
      });
    }
    
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Failed to create product',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    if (updateData.name) {
      updateData.slug = updateData.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
    }

    // Ensure variant prices are numbers
    if (updateData.variants && Array.isArray(updateData.variants)) {
      updateData.variants = updateData.variants.map(variant => ({
        ...variant,
        price: parseFloat(variant.price) || parseFloat(updateData.price) || 0,
        stockQuantity: parseInt(variant.stockQuantity) || 0
      }));
      console.log('✅ Processed variants for update:', updateData.variants);
    }

    // Check if using Sequelize (PostgreSQL) or Mongoose (MongoDB)
    const isSequelize = Product.findAll !== undefined;

    if (isSequelize) {
      // PostgreSQL/Sequelize implementation
      const product = await Product.findByPk(id);

      if (!product) {
        return res.status(404).json({ success: false, message: 'Product not found' });
      }

      await product.update(updateData);
      await invalidateProductData(product.id || product._id);

      res.json({
        success: true,
        data: product.toJSON ? product.toJSON() : product,
        message: 'Product updated successfully'
      });
    } else {
      // MongoDB/Mongoose implementation
      const product = await Product.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });

      if (!product) {
        return res.status(404).json({ success: false, message: 'Product not found' });
      }

      await invalidateProductData(product.id || product._id);

      res.json({
        success: true,
        data: product,
        message: 'Product updated successfully'
      });
    }
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ success: false, message: 'Failed to update product', error: error.message });
  }
};

const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if using Sequelize (PostgreSQL) or Mongoose (MongoDB)
    const isSequelize = Product.findAll !== undefined;

    if (isSequelize) {
      // PostgreSQL/Sequelize implementation - FORCE DELETE
      const product = await Product.findByPk(id);

      if (!product) {
        // Try to force delete anyway using raw query
        const { sequelize } = require('../config/database');
        try {
          await sequelize.query(`DELETE FROM "Products" WHERE id = :id`, {
            replacements: { id },
            type: sequelize.QueryTypes.DELETE
          });
          return res.json({
            success: true,
            message: 'Product force deleted successfully'
          });
        } catch (rawErr) {
          return res.status(404).json({ success: false, message: 'Product not found' });
        }
      }

      try {
        // Try normal destroy first
        await product.destroy({ force: true });
      } catch (destroyError) {
        console.log('Normal destroy failed, trying raw delete:', destroyError.message);
        // Force delete with raw SQL if constraints fail
        const { sequelize } = require('../config/database');
        await sequelize.query(`DELETE FROM "Products" WHERE id = :id`, {
          replacements: { id },
          type: sequelize.QueryTypes.DELETE
        });
      }
      
      try {
        await invalidateProductData(product.id || product._id);
      } catch (cacheErr) {
        console.log('Cache invalidation skipped:', cacheErr.message);
      }

      res.json({
        success: true,
        message: 'Product deleted successfully'
      });
    } else {
      // MongoDB/Mongoose implementation
      const product = await Product.findByIdAndDelete(id);

      if (!product) {
        return res.status(404).json({ success: false, message: 'Product not found' });
      }

      try {
        await invalidateProductData(product.id || product._id);
      } catch (cacheErr) {
        console.log('Cache invalidation skipped:', cacheErr.message);
      }

      res.json({
        success: true,
        message: 'Product deleted successfully'
      });
    }
  } catch (error) {
    console.error('Error deleting product:', error);
    
    // Last resort - try raw SQL delete
    try {
      const { sequelize } = require('../config/database');
      await sequelize.query(`DELETE FROM "Products" WHERE id = :id`, {
        replacements: { id: req.params.id },
        type: sequelize.QueryTypes.DELETE
      });
      return res.json({
        success: true,
        message: 'Product force deleted successfully'
      });
    } catch (rawErr) {
      console.error('Force delete also failed:', rawErr);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to delete product: ' + error.message 
      });
    }
  }
};

// Order Management
const getAllOrders = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, paymentMethod, search } = req.query;
    const offset = (page - 1) * limit;

    // Check if using Sequelize (PostgreSQL) or Mongoose (MongoDB)
    const isSequelize = Order.findAll !== undefined;

    if (isSequelize) {
      // PostgreSQL/Sequelize implementation
      const { Op } = require('sequelize');
      let where = {};
      
      if (status && status !== 'All') {
        where.status = status;
      }

      if (paymentMethod && paymentMethod !== 'All') {
        where.paymentMethod = paymentMethod;
      }

      if (search) {
        where[Op.or] = [
          { orderNumber: { [Op.iLike]: `%${search}%` } },
          // For JSONB fields, use Sequelize.literal for searching
          require('sequelize').literal(`"shippingAddress"->>'firstName' ILIKE '%${search}%'`),
          require('sequelize').literal(`"shippingAddress"->>'lastName' ILIKE '%${search}%'`)
        ];
      }

      const orders = await Order.findAll({
        where,
        offset: parseInt(offset),
        limit: parseInt(limit),
        order: [['createdAt', 'DESC']]
      });

      const total = await Order.count({ where });

      // Transform orders to include user info from customerInfo/shippingAddress
      const transformedOrders = orders.map(order => {
        const orderData = order.toJSON ? order.toJSON() : order;
        return {
          ...orderData,
          user: {
            firstName: orderData.customerInfo?.firstName || orderData.shippingAddress?.firstName,
            lastName: orderData.customerInfo?.lastName || orderData.shippingAddress?.lastName,
            email: orderData.customerInfo?.email || orderData.shippingAddress?.email
          }
        };
      });

      res.json({
        success: true,
        data: transformedOrders,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } else {
      // MongoDB/Mongoose implementation
      let query = {};
      
      if (status && status !== 'All') {
        query.status = status;
      }

      if (paymentMethod && paymentMethod !== 'All') {
        query.paymentMethod = paymentMethod;
      }

      if (search) {
        query.$or = [
          { orderNumber: { $regex: search, $options: 'i' } },
          { 'shippingAddress.firstName': { $regex: search, $options: 'i' } },
          { 'shippingAddress.lastName': { $regex: search, $options: 'i' } }
        ];
      }

      const orders = await Order.find(query)
        .populate('user', 'firstName lastName email')
        .sort({ createdAt: -1 })
        .skip(offset)
        .limit(parseInt(limit));

      const total = await Order.countDocuments(query);

      res.json({
        success: true,
        data: orders,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      });
    }
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch orders', error: error.message });
  }
};

const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, trackingNumber, estimatedDelivery, adminNote } = req.body;

    // Check if using Sequelize (PostgreSQL) or Mongoose (MongoDB)
    const isSequelize = Order.findAll !== undefined;

    if (isSequelize) {
      // PostgreSQL/Sequelize implementation
      const order = await Order.findByPk(id);
      
      if (!order) {
        return res.status(404).json({ success: false, message: 'Order not found' });
      }

      // Update status history
      const statusHistory = order.statusHistory || [];
      statusHistory.push({
        status,
        timestamp: new Date(),
        date: new Date(),
        note: adminNote || `Status updated to ${status}`,
        updatedBy: 'admin'
      });

      const previousStatus = order.status;
      
      await order.update({
        status,
        trackingNumber,
        estimatedDelivery,
        statusHistory,
        notes: {
          ...order.notes,
          admin: adminNote
        }
      });

      // Update sales count when order is completed (delivered/shipped/confirmed)
      const completedStatuses = ['delivered', 'shipped', 'confirmed'];
      if (completedStatuses.includes(status) && !completedStatuses.includes(previousStatus)) {
        await updateSalesCountForOrder(order);
        console.log(`📈 Sales count updated for order ${order.orderNumber}`);
      }

      res.json({
        success: true,
        data: order.toJSON ? order.toJSON() : order,
        message: 'Order status updated successfully'
      });
    } else {
      // MongoDB/Mongoose implementation
      const existingOrder = await Order.findById(id);
      const previousStatus = existingOrder?.status;
      
      const order = await Order.findByIdAndUpdate(
        id,
        {
          status,
          trackingNumber,
          estimatedDelivery,
          adminNote,
          $push: {
            statusHistory: {
              status,
              timestamp: new Date(),
              note: adminNote
            }
          }
        },
        { new: true }
      );

      if (!order) {
        return res.status(404).json({ success: false, message: 'Order not found' });
      }

      // Update sales count when order is completed
      const completedStatuses = ['delivered', 'shipped', 'confirmed'];
      if (completedStatuses.includes(status) && !completedStatuses.includes(previousStatus)) {
        await updateSalesCountForOrder(order);
        console.log(`📈 Sales count updated for order ${order.orderNumber}`);
      }

      res.json({
        success: true,
        data: order,
        message: 'Order status updated successfully'
      });
    }
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ success: false, message: 'Failed to update order status', error: error.message });
  }
};

// User Management
const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, search, status } = req.query;
    const offset = (page - 1) * limit;

    // Check if using Sequelize (PostgreSQL) or Mongoose (MongoDB)
    const isSequelize = User.findAll !== undefined;

    if (isSequelize) {
      // PostgreSQL/Sequelize implementation
      const { Op } = require('sequelize');
      let where = {};
      
      if (search) {
        where[Op.or] = [
          { firstName: { [Op.iLike]: `%${search}%` } },
          { lastName: { [Op.iLike]: `%${search}%` } },
          { email: { [Op.iLike]: `%${search}%` } }
        ];
      }

      if (status) {
        where.isActive = status === 'active';
      }

      const users = await User.findAll({
        where,
        attributes: { exclude: ['password'] },
        offset: parseInt(offset),
        limit: parseInt(limit),
        order: [['createdAt', 'DESC']]
      });

      const total = await User.count({ where });

      res.json({
        success: true,
        data: users.map(u => u.toJSON ? u.toJSON() : u),
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } else {
      // MongoDB/Mongoose implementation
      let query = {};
      
      if (search) {
        query.$or = [
          { firstName: { $regex: search, $options: 'i' } },
          { lastName: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ];
      }

      if (status) {
        query.isActive = status === 'active';
      }

      const users = await User.find(query)
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(offset)
        .limit(parseInt(limit));

      const total = await User.countDocuments(query);

      res.json({
        success: true,
        data: users,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      });
    }
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch users', error: error.message });
  }
};

const updateUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive, isVerified } = req.body;

    // Check if using Sequelize (PostgreSQL) or Mongoose (MongoDB)
    const isSequelize = User.findAll !== undefined;

    if (isSequelize) {
      // PostgreSQL/Sequelize implementation
      const user = await User.findByPk(id);

      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      await user.update({ isActive, isVerified });

      const userData = user.toJSON ? user.toJSON() : user;
      delete userData.password;

      res.json({
        success: true,
        data: userData,
        message: 'User status updated successfully'
      });
    } else {
      // MongoDB/Mongoose implementation
      const user = await User.findByIdAndUpdate(
        id,
        { isActive, isVerified },
        { new: true }
      ).select('-password');

      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      res.json({
        success: true,
        data: user,
        message: 'User status updated successfully'
      });
    }
  } catch (error) {
    console.error('Error updating user status:', error);
    res.status(500).json({ success: false, message: 'Failed to update user status', error: error.message });
  }
};

// Analytics
const getDashboardAnalytics = async (req, res) => {
  try {
    const { period = 30 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));

    // Check if using Sequelize (PostgreSQL) or Mongoose (MongoDB)
    const isSequelize = Order.findAll !== undefined;

    if (isSequelize) {
      // PostgreSQL/Sequelize implementation
      const { Op } = require('sequelize');

      // Total orders and revenue
      const orders = await Order.findAll({
        where: {
          createdAt: { [Op.gte]: startDate }
        }
      });

      const totalRevenue = orders.reduce((sum, order) => {
        const orderData = order.toJSON ? order.toJSON() : order;
        return sum + parseFloat(orderData.total || 0);
      }, 0);
      const totalOrders = orders.length;

      // Products analytics
      const totalProducts = await Product.count();
      const activeProducts = await Product.count({ where: { isActive: true } });
      const lowStockProducts = await Product.count({
        where: require('sequelize').literal('"stockQuantity" <= "lowStockThreshold"')
      });

      // Users analytics
      const totalUsers = await User.count();
      const activeUsers = await User.count({ where: { isActive: true } });

      // Recent orders (simplified for Sequelize)
      const recentOrdersRaw = await Order.findAll({
        limit: 5,
        order: [['createdAt', 'DESC']]
      });

      const recentOrders = recentOrdersRaw.map(order => {
        const orderData = order.toJSON ? order.toJSON() : order;
        return {
          ...orderData,
          user: {
            firstName: orderData.customerInfo?.firstName || orderData.shippingAddress?.firstName,
            lastName: orderData.customerInfo?.lastName || orderData.shippingAddress?.lastName,
            email: orderData.customerInfo?.email || orderData.shippingAddress?.email
          }
        };
      });

      // Top products - simplified calculation
      const topProducts = [];

      res.json({
        success: true,
        data: {
          revenue: {
            total: totalRevenue,
            period: parseInt(period)
          },
          orders: {
            total: totalOrders,
            recent: recentOrders
          },
          products: {
            total: totalProducts,
            active: activeProducts,
            lowStock: lowStockProducts
          },
          users: {
            total: totalUsers,
            active: activeUsers
          },
          payments: {
            total: 0,
            methods: []
          },
          topProducts
        }
      });
    } else {
      // MongoDB/Mongoose implementation
      // Total orders and revenue
      const orders = await Order.find({
        createdAt: { $gte: startDate }
      });

      const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
      const totalOrders = orders.length;

      // Products analytics
      const totalProducts = await Product.countDocuments();
      const activeProducts = await Product.countDocuments({ isActive: true });
      const lowStockProducts = await Product.countDocuments({
        stockQuantity: { $lte: '$lowStockThreshold' }
      });

      // Users analytics
      const totalUsers = await User.countDocuments();
      const activeUsers = await User.countDocuments({ isActive: true });

      // Payment analytics
      let payments = [];
      let paymentMethods = [];
      
      if (Payment) {
        try {
          payments = await Payment.find({
            createdAt: { $gte: startDate }
          });

          paymentMethods = await Payment.aggregate([
            { $match: { createdAt: { $gte: startDate } } },
            { $group: { _id: '$paymentMethod', count: { $sum: 1 }, total: { $sum: '$amount' } } }
          ]);
        } catch (paymentError) {
          console.warn('⚠️ Payment analytics not available:', paymentError.message);
        }
      }

      // Recent orders
      const recentOrders = await Order.find()
        .populate('user', 'firstName lastName email')
        .sort({ createdAt: -1 })
        .limit(5);

      // Top selling products
      const topProducts = await Order.aggregate([
        { $unwind: '$items' },
        { $group: { _id: '$items.product', totalSold: { $sum: '$items.quantity' } } },
        { $sort: { totalSold: -1 } },
        { $limit: 5 },
        {
          $lookup: {
            from: 'products',
            localField: '_id',
            foreignField: '_id',
            as: 'product'
          }
        },
        { $unwind: '$product' }
      ]);

      res.json({
        success: true,
        data: {
          revenue: {
            total: totalRevenue,
            period: parseInt(period)
          },
          orders: {
            total: totalOrders,
            recent: recentOrders
          },
          products: {
            total: totalProducts,
            active: activeProducts,
            lowStock: lowStockProducts
          },
          users: {
            total: totalUsers,
            active: activeUsers
          },
          payments: {
            total: payments.length,
            methods: paymentMethods
          },
          topProducts
        }
      });
    }
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch analytics', error: error.message });
  }
};

// Inventory Management
const getInventoryStatus = async (req, res) => {
  try {
    // Check if using Sequelize (PostgreSQL) or Mongoose (MongoDB)
    const isSequelize = Product.findAll !== undefined;

    if (isSequelize) {
      // PostgreSQL/Sequelize implementation
      const lowStockProducts = await Product.findAll({
        where: require('sequelize').literal('"stockQuantity" <= "lowStockThreshold"')
      });

      const outOfStockProducts = await Product.findAll({
        where: { stockQuantity: 0 }
      });

      const totalProducts = await Product.count();

      res.json({
        success: true,
        data: {
          lowStock: lowStockProducts.map(p => p.toJSON ? p.toJSON() : p),
          outOfStock: outOfStockProducts.map(p => p.toJSON ? p.toJSON() : p),
          total: totalProducts
        }
      });
    } else {
      // MongoDB/Mongoose implementation
      const lowStockProducts = await Product.find({
        $expr: { $lte: ['$stockQuantity', '$lowStockThreshold'] }
      });

      const outOfStockProducts = await Product.find({
        stockQuantity: 0
      });

      const totalProducts = await Product.countDocuments();

      res.json({
        success: true,
        data: {
          lowStock: lowStockProducts,
          outOfStock: outOfStockProducts,
          total: totalProducts
        }
      });
    }
  } catch (error) {
    console.error('Error fetching inventory status:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch inventory status', error: error.message });
  }
};

const updateInventory = async (req, res) => {
  try {
    const { id } = req.params;
    const { stockQuantity, lowStockThreshold } = req.body;

    // Check if using Sequelize (PostgreSQL) or Mongoose (MongoDB)
    const isSequelize = Product.findAll !== undefined;

    if (isSequelize) {
      // PostgreSQL/Sequelize implementation
      const product = await Product.findByPk(id);

      if (!product) {
        return res.status(404).json({ success: false, message: 'Product not found' });
      }

      await product.update({ stockQuantity, lowStockThreshold });

      res.json({
        success: true,
        data: product.toJSON ? product.toJSON() : product,
        message: 'Inventory updated successfully'
      });
    } else {
      // MongoDB/Mongoose implementation
      const product = await Product.findByIdAndUpdate(
        id,
        { stockQuantity, lowStockThreshold },
        { new: true }
      );

      if (!product) {
        return res.status(404).json({ success: false, message: 'Product not found' });
      }

      res.json({
        success: true,
        data: product,
        message: 'Inventory updated successfully'
      });
    }
  } catch (error) {
    console.error('Error updating inventory:', error);
    res.status(500).json({ success: false, message: 'Failed to update inventory', error: error.message });
  }
};

module.exports = {
  // Product Management
  getAllProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  
  // Order Management
  getAllOrders,
  updateOrderStatus,
  
  // User Management
  getAllUsers,
  updateUserStatus,
  
  // Analytics
  getDashboardAnalytics,
  
  // Inventory Management
  getInventoryStatus,
  updateInventory
}; 