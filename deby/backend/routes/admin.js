const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { adminMiddleware } = require('../middleware/authMiddleware');
const seoGenerator = require('../services/seoGenerator');
const aiStockManager = require('../services/aiStockManager');
const { Product, Order, Customer, User } = require('../models');
const { Op } = require('sequelize');

// Admin authentication required for all routes - only users with admin role can access
router.use(adminMiddleware);

// Product Management Routes
router.get('/products', adminController.getAllProducts);

// Main product creation endpoint - handles both simple and advanced creation
router.post('/products', adminController.createProduct);

// Alternative endpoint for compatibility
router.post('/products/create', adminController.createProduct);

// Simple product creation - NO complex logic, NO recursion
router.post('/products/simple', async (req, res) => {
  try {
    console.log('🆕 SIMPLE CREATE - Received:', req.body.name);
    
    const { name, description, price, stockQuantity, mainImage, category, subcategory } = req.body;
    
    // Basic validation
    if (!name || !price || !mainImage) {
      return res.status(400).json({
        success: false,
        message: 'Name, price, and image are required'
      });
    }
    
    // Create minimal product data
    const productData = {
      name: name,
      slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now(),
      description: description || name,
      price: parseFloat(price),
      stockQuantity: parseInt(stockQuantity) || 0,
      mainImage: mainImage,
      category: category || 'Fashion',
      subcategory: subcategory || null,
      sku: 'SKU-' + Date.now(),
      seoTitle: name + ' | E-Gura Store',
      shortDescription: 'Quality product in Kigali, Rwanda',
      tags: [name.toLowerCase(), 'kigali', 'rwanda'],
      isActive: true,
      isFeatured: false,
      isNew: true,
      isSale: false
    };
    
    const product = await Product.create(productData);
    
    console.log('✅ Product created:', product.id);
    
    res.status(201).json({
      success: true,
      data: product,
      message: 'Product created successfully'
    });
  } catch (error) {
    console.error('❌ Simple create error:', error.message);
    res.status(500).json({
      success: false,
      message: error.message,
      error: error.message
    });
  }
});

router.put('/products/:id', adminController.updateProduct);
router.delete('/products/:id', adminController.deleteProduct);

// Order Management Routes
router.get('/orders', adminController.getAllOrders);
router.put('/orders/:id/status', adminController.updateOrderStatus);

// User Management Routes
router.get('/users', adminController.getAllUsers);
router.put('/users/:id/status', adminController.updateUserStatus);

// Analytics Routes
router.get('/analytics', adminController.getDashboardAnalytics);

// Inventory Management Routes
router.get('/inventory', adminController.getInventoryStatus);
router.put('/inventory/:id', adminController.updateInventory);

// SEO Generator Routes
router.post('/generate-seo', async (req, res) => {
  try {
    console.log('=== SEO Generation Request ===');
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    
    const { product } = req.body;
    
    if (!product) {
      console.error('No product data provided');
      return res.status(400).json({ 
        success: false,
        error: 'Product data is required' 
      });
    }
    
    console.log('Product data:', {
      name: product.name,
      category: product.category,
      price: product.price
    });
    
    // Test if seoGenerator is loaded
    if (!seoGenerator || typeof seoGenerator.generateSEOPackage !== 'function') {
      console.error('SEO Generator not loaded properly');
      return res.status(500).json({
        success: false,
        error: 'SEO Generator service not available'
      });
    }
    
    console.log('Calling seoGenerator.generateSEOPackage...');
    const seoPackage = seoGenerator.generateSEOPackage(product);
    
    console.log('SEO generated successfully');
    console.log('Title:', seoPackage.title);
    
    res.json({
      success: true,
      ...seoPackage
    });
    
  } catch (error) {
    console.error('=== SEO Generation Error ===');
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    res.status(500).json({ 
      success: false,
      error: error.message,
      details: error.stack
    });
  }
});

router.post('/analyze-seo', async (req, res) => {
  try {
    const { title, description, keywords } = req.body;
    const analysis = seoGenerator.analyzeSEOScore(title, description, keywords);
    res.json(analysis);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Bulk SEO Update for selected products
router.post('/products/bulk-seo-update', async (req, res) => {
  try {
    const { productIds } = req.body;
    
    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Product IDs array is required'
      });
    }

    console.log(`🔄 Bulk SEO update for ${productIds.length} products...`);

    const results = [];
    const errors = [];

    for (const productId of productIds) {
      try {
        const product = await Product.findByPk(productId);
        
        if (!product) {
          errors.push({ productId, error: 'Product not found' });
          continue;
        }

        // Generate SEO package
        const seoPackage = seoGenerator.generateSEOPackage({
          name: product.name,
          description: product.description,
          category: product.category,
          price: product.price
        });

        // Update product with new SEO data
        await product.update({
          seoTitle: seoPackage.title,
          seoDescription: seoPackage.description,
          seoKeywords: seoPackage.keywords,
          metaTags: seoPackage.metaTags
        });

        results.push({
          productId: product.id,
          name: product.name,
          seoTitle: seoPackage.title,
          success: true
        });

        console.log(`✅ Updated SEO for: ${product.name}`);
      } catch (error) {
        console.error(`❌ Error updating product ${productId}:`, error.message);
        errors.push({ productId, error: error.message });
      }
    }

    res.json({
      success: true,
      updated: results.length,
      failed: errors.length,
      results,
      errors
    });

  } catch (error) {
    console.error('❌ Bulk SEO update error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update SEO',
      error: error.message
    });
  }
});

// Generate and apply AI SEO to single product
router.post('/products/:id/generate-seo', async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    const seoPackage = seoGenerator.generateSEOPackage({
      name: product.name,
      description: product.description,
      category: product.category,
      price: product.price
    });

    // Update product
    await product.update({
      seoTitle: seoPackage.title,
      seoDescription: seoPackage.description,
      seoKeywords: seoPackage.keywords,
      metaTags: seoPackage.metaTags
    });

    res.json({
      success: true,
      data: {
        id: product.id,
        name: product.name,
        seo: seoPackage
      }
    });

  } catch (error) {
    console.error('❌ Generate SEO error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// AI Stock Management Routes
router.post('/analyze-stock', async (req, res) => {
  try {
    const { products } = req.body;
    if (!products || !Array.isArray(products)) {
      return res.status(400).json({ error: 'Products array is required' });
    }

    // Ensure products are plain objects
    const plainProducts = products.map(p => p.toJSON ? p.toJSON() : p);
    const analysis = await aiStockManager.analyzeStock(plainProducts);
    res.json(analysis);
  } catch (error) {
    console.error('Analyze stock error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/stock/reorder-list', async (req, res) => {
  try {
    const products = await Product.findAll();
    // Convert Sequelize instances to plain objects
    const plainProducts = products.map(p => p.toJSON ? p.toJSON() : p);
    const reorderList = aiStockManager.generateReorderList(plainProducts);
    res.json(reorderList);
  } catch (error) {
    console.error('Reorder list error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/stock/forecast/:productId', async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.productId);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const days = parseInt(req.query.days) || 30;
    const plainProduct = product.toJSON ? product.toJSON() : product;
    const forecast = aiStockManager.forecastDemand(plainProduct, days);
    res.json(forecast);
  } catch (error) {
    console.error('Forecast error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/stock/report', async (req, res) => {
  try {
    console.log('📊 Generating stock report...');
    const products = await Product.findAll();
    console.log(`📦 Found ${products.length} products`);
    
    // Convert Sequelize instances to plain objects
    const plainProducts = products.map(p => p.toJSON ? p.toJSON() : p);
    
    const report = await aiStockManager.generateStockReport(plainProducts);
    console.log('✅ Stock report generated successfully');
    res.json(report);
  } catch (error) {
    console.error('❌ Stock report error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Order Management Routes
router.get('/orders/all', async (req, res) => {
  try {
    const orders = await Order.findAll({
      limit: 100,
      order: [['createdAt', 'DESC']]
    });

    // Since we don't have populate in Sequelize yet, let's enhance orders with customer info
    const enhancedOrders = await Promise.all(orders.map(async (order) => {
      const orderData = order.toJSON ? order.toJSON() : order;
      const customerPhone = orderData.shippingAddress?.phone || orderData.customerInfo?.phone;
      let customer = null;

      if (customerPhone) {
        customer = await Customer.findOne({ where: { phone: customerPhone } });
      }

      // Build complete customer info
      const customerInfo = {
        firstName: customer?.firstName || orderData.shippingAddress?.firstName || orderData.customerInfo?.firstName || '',
        lastName: customer?.lastName || orderData.shippingAddress?.lastName || orderData.customerInfo?.lastName || '',
        fullName: customer?.fullName || `${orderData.shippingAddress?.firstName || ''} ${orderData.shippingAddress?.lastName || ''}`.trim() || 'Guest',
        phone: customer?.phone || orderData.shippingAddress?.phone || orderData.customerInfo?.phone || '',
        email: customer?.email || orderData.shippingAddress?.email || orderData.customerInfo?.email || ''
      };

      return {
        ...orderData,
        customerInfo: customerInfo,
        shippingAddress: {
          firstName: orderData.shippingAddress?.firstName || customerInfo.firstName,
          lastName: orderData.shippingAddress?.lastName || customerInfo.lastName,
          phone: orderData.shippingAddress?.phone || customerInfo.phone,
          email: orderData.shippingAddress?.email || customerInfo.email,
          address: orderData.shippingAddress?.address || '',
          city: orderData.shippingAddress?.city || '',
          district: orderData.shippingAddress?.district || '',
          postalCode: orderData.shippingAddress?.postalCode || '',
          country: orderData.shippingAddress?.country || 'Rwanda',
          instructions: orderData.shippingAddress?.instructions || ''
        },
        items: orderData.items?.map(item => ({
          ...item,
          name: item.name || 'Product Not Found',
          productName: item.productName || 'Product Not Found',
          mainImage: item.mainImage || null,
          productImage: item.productImage || null,
          image: item.image || null,
          size: item.size || 'N/A',
          color: item.color || 'N/A',
          category: item.category || 'Uncategorized'
        })) || []
      };
    }));

    res.json({
      success: true,
      orders: enhancedOrders,
      total: enhancedOrders.length
    });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.get('/orders/:id', async (req, res) => {
  try {
    const order = await Order.findByPk(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }

    const orderData = order.toJSON ? order.toJSON() : order;

    // Get customer information (simplified)
    const customerPhone = orderData.shippingAddress?.phone || orderData.customerInfo?.phone;
    let customer = null;

    if (customerPhone) {
      customer = await Customer.findOne({ where: { phone: customerPhone } });
    }

    // Build complete order details
    const customerInfo = {
      firstName: customer?.firstName || orderData.shippingAddress?.firstName || orderData.customerInfo?.firstName || '',
      lastName: customer?.lastName || orderData.shippingAddress?.lastName || orderData.customerInfo?.lastName || '',
      fullName: customer?.fullName || `${orderData.shippingAddress?.firstName || ''} ${orderData.shippingAddress?.lastName || ''}`.trim() || 'Guest',
      phone: customer?.phone || orderData.shippingAddress?.phone || orderData.customerInfo?.phone || '',
      email: customer?.email || orderData.shippingAddress?.email || orderData.customerInfo?.email || ''
    };

    const enhancedOrder = {
      ...orderData,
      customerInfo: customerInfo,
      shippingAddress: {
        firstName: orderData.shippingAddress?.firstName || customerInfo.firstName,
        lastName: orderData.shippingAddress?.lastName || customerInfo.lastName,
        phone: orderData.shippingAddress?.phone || customerInfo.phone,
        email: orderData.shippingAddress?.email || customerInfo.email,
        address: orderData.shippingAddress?.address || '',
        city: orderData.shippingAddress?.city || '',
        district: orderData.shippingAddress?.district || '',
        postalCode: orderData.shippingAddress?.postalCode || '',
        country: orderData.shippingAddress?.country || 'Rwanda',
        instructions: orderData.shippingAddress?.instructions || ''
      },
      items: orderData.items?.map(item => ({
        ...item,
        name: item.name || 'Product Not Found',
        productName: item.productName || 'Product Not Found',
        mainImage: item.mainImage || null,
        productImage: item.productImage || null,
        size: item.size || 'N/A',
        color: item.color || 'N/A'
      })) || []
    };

    res.json({
      success: true,
      order: enhancedOrder
    });
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.put('/orders/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findByPk(req.params.id);

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Add to status history (simplified)
    const statusHistory = order.statusHistory || [];
    statusHistory.push({
      status: status,
      date: new Date(),
      note: `Status updated to ${status}`,
      updatedBy: 'admin'
    });

    await order.update({ status, statusHistory });

    res.json({
      success: true,
      order: order.toJSON ? order.toJSON() : order
    });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ error: error.message });
  }
});


// Bulk Product Operations
router.post('/products/bulk-update', async (req, res) => {
  try {
    const { productIds, updates } = req.body;
                                                
    // Update multiple products (simplified for Sequelize)
    const result = { modifiedCount: 0 };

    for (const productId of productIds) {
      const product = await Product.findByPk(productId);
      if (product) {
        await product.update(updates);
        result.modifiedCount++;
      }
    }

    res.json({
      success: true,
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Customer Management Routes

router.get('/customers', async (req, res) => {
  try {
    const { page = 1, limit = 50, search } = req.query;
    const { Op } = require('sequelize');

    let where = { role: 'customer' }; // Only get customers, not admins
    if (search) {
      where[Op.or] = [
        { firstName: { [Op.iLike]: `%${search}%` } },
        { lastName: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
        { phone: { [Op.iLike]: `%${search}%` } }
      ];
    }

    // Use User model since customers are stored there
    const customers = await User.findAll({
      where,
      attributes: [
        'id', 'firstName', 'lastName', 'email', 'phone',
        'addresses', 'totalOrders', 'totalSpent', 
        'lastLogin', 'createdAt', 'isActive'
      ],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit),
      order: [['createdAt', 'DESC']]
    });

    const total = await User.count({ where });

    console.log(`📊 Found ${customers.length} customers in database`);

    res.json({
      success: true,
      customers: customers,
      total: total,
      page: parseInt(page),
      pages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Get customers error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching customers',
      error: error.message 
    });
  }
});

router.get('/customers/:id', async (req, res) => {
  try {
    const customer = await User.findByPk(req.params.id);

    if (!customer) {
      return res.status(404).json({ 
        success: false,
        error: 'Customer not found' 
      });
    }

    // Get customer's orders (simplified)
    const orders = await Order.findAll({ 
      where: { userId: req.params.id },
      limit: 10,
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      customer: customer,
      orders: orders
    });
  } catch (error) {
    console.error('Get customer error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Clear entire database (DANGEROUS - Admin only)
router.delete('/database/clear-all', async (req, res) => {
  try {
    console.log('⚠️  CLEARING ENTIRE DATABASE...');
    
    let totalDeleted = 0;
    const results = [];
    
    // Clear all tables using the models
    const models = [Product, Order, Customer, User];
    
    for (const model of models) {
      try {
        const modelName = model.name || 'Unknown';
        
        // For PostgreSQL (Sequelize) - always use this path now
        const count = await model.count();
        if (count > 0) {
          await model.destroy({ where: {}, truncate: true });
          totalDeleted += count;
          results.push({
            table: modelName,
            deleted: count
          });
          console.log(`   ✅ Cleared ${modelName}: ${count} records`);
        }
      } catch (modelError) {
        console.error(`⚠️ Error clearing ${model.name}:`, modelError.message);
      }
    }
    
    console.log(`✅ Database cleared! Total deleted: ${totalDeleted}`);
    
    res.json({
      success: true,
      message: 'Database cleared successfully',
      totalDeleted: totalDeleted,
      tables: results
    });
  } catch (error) {
    console.error('❌ Error clearing database:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

module.exports = router; 