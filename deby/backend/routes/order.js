const express = require('express');
const router = express.Router();
const { Order, User, Customer, Product } = require('../models');
const bcrypt = require('bcryptjs');

// Handle MongoDB-specific imports for legacy compatibility
let mongoose, CustomerActivity;
try {
  mongoose = require('mongoose');
  CustomerActivity = require('../models/CustomerActivity');
} catch (error) {
  console.log('ℹ️ MongoDB modules not available, using PostgreSQL only');
}

// Create order (public - no auth required for checkout)
router.post('/', async (req, res) => {
  try {
    console.log('📦 Received order request:', JSON.stringify(req.body, null, 2));
    const { user, items, totalAmount, status, paymentMethod, shippingAddress, customerInfo } = req.body;
    
    let userId = user;
    let customer = null;
    
    // Extract customer information
    const phone = shippingAddress?.phone || shippingAddress?.phoneNumber || customerInfo?.phone;
    const email = shippingAddress?.email || customerInfo?.email;
    const firstName = shippingAddress?.firstName || customerInfo?.firstName || 'Guest';
    const lastName = shippingAddress?.lastName || customerInfo?.lastName || 'Customer';
    
    // Get request metadata for activity tracking
    const metadata = {
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('user-agent'),
      device: req.get('user-agent')?.includes('Mobile') ? 'mobile' : 'desktop'
    };
    
    // PHONE NUMBER IS THE PRIMARY KEY - Find or create customer using User model (PostgreSQL)
    if (phone) {
      // Check if customer exists by phone number in Users table
      customer = await User.findOne({ phone: phone });
      
      if (customer) {
        // Existing customer - update their information
        console.log('✅ Found existing customer:', customer.phone);
        userId = customer.id; // Use id for PostgreSQL
        
        // Update email if provided and not set
        if (email && !customer.email) {
          await customer.update({ email: email.toLowerCase() });
        }
        
        // Handle addresses (JSONB field in PostgreSQL)
        const addresses = customer.addresses || [];
        const addressExists = addresses.some(addr => 
          addr.address === (shippingAddress.street || shippingAddress.address) &&
          addr.city === (shippingAddress.city || 'Kigali')
        );
        
        // Add new address if it doesn't exist
        if (!addressExists && shippingAddress) {
          const newAddress = {
            type: 'shipping',
            firstName: firstName,
            lastName: lastName,
            phone: phone,
            address: shippingAddress.street || shippingAddress.address || '',
            city: shippingAddress.city || 'Kigali',
            district: shippingAddress.district || 'Gasabo',
            country: shippingAddress.country || 'Rwanda',
            isDefault: addresses.length === 0
          };
          addresses.push(newAddress);
          await customer.update({ addresses: addresses });
        }
        
        console.log('✅ Customer updated');
        
      } else {
        // Create new customer from order information (PostgreSQL User model)
        console.log('🆕 Creating new customer with phone:', phone);
        
        customer = await User.create({
          phone: phone,
          firstName: firstName,
          lastName: lastName,
          email: email ? email.toLowerCase() : `${phone}@customer.com`,
          password: await bcrypt.hash(`temp_${Date.now()}`, 10),
          role: 'customer',
          addresses: [{
            type: 'shipping',
            firstName: firstName,
            lastName: lastName,
            phone: phone,
            address: shippingAddress?.street || shippingAddress?.address || '',
            city: shippingAddress?.city || 'Kigali',
            district: shippingAddress?.district || 'Gasabo',
            country: shippingAddress?.country || 'Rwanda',
            isDefault: true
          }],
          paymentMethods: paymentMethod && paymentMethod !== 'cash_on_delivery' ? [{
            type: paymentMethod === 'mobile_money' || paymentMethod === 'momo' ? 'mobile_money' : paymentMethod,
            provider: paymentMethod === 'momo' ? 'mtn' : undefined,
            isDefault: true
          }] : [],
          profile: {
            accountCreatedBy: 'order',
            phoneVerified: true
          }
        });
        
        userId = customer.id;
        console.log('✅ New customer created:', customer.phone, 'ID:', customer.id);
      }
    }
    
    // If still no userId and no customer, create a guest customer
    if (!userId && !customer) {
      console.log('🆕 Creating guest customer for order');
      
      const guestCustomer = await User.create({
        phone: phone || `guest_${Date.now()}@customer.com`,
        firstName: firstName,
        lastName: lastName,
        email: email || `guest_${Date.now()}@customer.com`,
        password: await bcrypt.hash(`temp_${Date.now()}`, 10),
        role: 'customer',
        profile: {
          accountCreatedBy: 'guest_order',
          phoneVerified: false
        }
      });
      
      userId = guestCustomer.id;
      customer = guestCustomer;
      console.log('✅ Guest customer created:', guestCustomer.id);
    }
    
    // Enrich items with full product data from database if missing images
    const enrichedItems = await Promise.all(items.map(async (item) => {
      // If item has no image, fetch from product database
      if (!item.image && !item.mainImage && (item.product || item.id || item._id)) {
        try {
          const productId = item.product || item.id || item._id;
          const product = await Product.findByPk(productId);
          
          if (product) {
            console.log(`📷 Fetched product images for: ${product.name}`);
            return {
              // Product identifiers
              product: productId,
              productId: productId,
              
              // Product basic info - use product data
              name: item.name || product.name || '',
              productName: item.name || product.name || '',
              description: product.description || item.description || '',
              
              // Product images - use product data
              image: product.mainImage || product.images?.[0] || null,
              mainImage: product.mainImage || product.images?.[0] || null,
              images: product.images || [],
              productImage: product.mainImage || product.images?.[0] || null,
              
              // Order-specific details
              quantity: item.quantity || 1,
              price: item.price || product.price || 0,
              size: item.size || null,
              color: item.color || null,
              
              // Product metadata
              category: product.category || item.category || 'Uncategorized',
              brand: product.brand || item.brand || 'E-Gura Store',
              sizes: product.sizes || item.sizes || [],
              colors: product.colors || item.colors || [],
              stock: product.stock || item.stock || 0,
              rating: product.rating || item.rating || 0
            };
          }
        } catch (err) {
          console.error('⚠️ Failed to fetch product data:', err.message);
        }
      }
      
      // Return item as-is with available data
      return {
        // Product identifiers
        product: item.product || item.id || item._id || null,
        productId: item.product || item.id || item._id || null,
        
        // Product basic info
        name: item.name || item.productName || '',
        productName: item.name || item.productName || '',
        description: item.description || '',
        
        // Product images - capture all variants
        image: item.image || item.mainImage || item.images?.[0] || null,
        mainImage: item.mainImage || item.image || item.images?.[0] || null,
        images: item.images || [],
        productImage: item.image || item.mainImage || item.images?.[0] || null,
        
        // Order-specific details
        quantity: item.quantity || 1,
        price: item.price || 0,
        size: item.size || null,
        color: item.color || null,
        
        // Product metadata
        category: item.category || 'Uncategorized',
        brand: item.brand || 'E-Gura Store',
        sizes: item.sizes || [],
        colors: item.colors || [],
        stock: item.stock || 0,
        rating: item.rating || 0
      };
    }));
    
    // Prepare order data with full product details (PostgreSQL-compatible)
    const orderData = {
      userId: userId || null, // Use userId for PostgreSQL FK
      orderNumber: `ORD-${Date.now()}`,
      items: enrichedItems,
      subtotal: totalAmount || 0,
      totalAmount: totalAmount || 0,
      total: totalAmount || 0,
      status: status || 'pending',
      paymentMethod: paymentMethod || 'cash_on_delivery',
      shippingAddress: {
        firstName: shippingAddress.firstName || '',
        lastName: shippingAddress.lastName || '',
        phone: shippingAddress.phone || shippingAddress.phoneNumber || '',
        email: shippingAddress.email || '',
        address: shippingAddress.street || shippingAddress.address || '',
        city: shippingAddress.city || 'Kigali',
        district: shippingAddress.district || 'Gasabo',
        country: shippingAddress.country || 'Rwanda',
        postalCode: shippingAddress.postalCode || '0000'
      },
      customerInfo: {
        firstName: shippingAddress.firstName || customerInfo?.firstName || '',
        lastName: shippingAddress.lastName || customerInfo?.lastName || '',
        email: shippingAddress.email || customerInfo?.email || '',
        phone: shippingAddress.phone || shippingAddress.phoneNumber || customerInfo?.phone || ''
      }
    };
    
    // Add mobile money details if payment method is mobile_money
    if (paymentMethod === 'mobile_money' || paymentMethod === 'momo') {
      orderData.mobileMoney = {
        provider: 'mtn', // Default to MTN
        phoneNumber: phone || shippingAddress.phone || shippingAddress.phoneNumber,
        status: 'pending'
      };
    }
    
    // Create order using Sequelize (PostgreSQL)
    const order = await Order.create(orderData);
    
    console.log('✅ Order created successfully:', order.id, 'Order Number:', order.orderNumber);
    
    // Update customer order statistics (PostgreSQL-compatible)
    if (customer && customer.update) {
      try {
        // Update order count for Sequelize model
        const currentStats = customer.orderStats || {};
        await customer.update({
          orderStats: {
            totalOrders: (currentStats.totalOrders || 0) + 1,
            totalSpent: (currentStats.totalSpent || 0) + totalAmount,
            lastOrderDate: new Date()
          }
        });
        console.log('✅ Customer order stats updated');
      } catch (statsError) {
        console.error('⚠️ Failed to update customer stats (non-blocking):', statsError.message);
      }
      
      // Log order placement activity (non-blocking, MongoDB only)
      if (CustomerActivity && mongoose) {
        try {
          await CustomerActivity.logActivity({
            customerPhone: customer.phone,
            customerId: customer.id,
            activityType: 'order_placed',
            details: {
              orderNumber: order.orderNumber,
              itemCount: items?.length || 0,
              paymentMethod: paymentMethod,
              shippingCity: shippingAddress?.city,
              shippingDistrict: shippingAddress?.district
            },
            relatedOrder: order.id,
            amount: totalAmount,
            ipAddress: metadata.ipAddress,
            userAgent: metadata.userAgent,
            device: metadata.device,
            priority: 'high'
          });
          console.log('✅ Order placement activity logged');
        } catch (activityError) {
          console.error('⚠️ Failed to log order activity (non-blocking):', activityError.message);
          // Don't block order response if activity logging fails
        }
      }
    }
    
    res.status(201).json({
      success: true,
      data: order,
      customer: customer ? {
        phone: customer.phone,
        email: customer.email,
        fullName: customer.fullName,
        totalOrders: customer.orderStats?.totalOrders || 1
      } : null,
      message: 'Order created successfully'
    });
  } catch (error) {
    console.error('❌ Error creating order:', error);
    console.error('❌ Error details:', error.message);
    console.error('❌ Stack trace:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Error creating order',
      error: error.message,
      details: error.errors ? Object.keys(error.errors).map(key => ({
        field: key,
        message: error.errors[key].message
      })) : []
    });
  }
});

// Get customer's orders by phone or email (for My Account page)
router.post('/customer-orders', async (req, res) => {
  try {
    const { phone, email } = req.body;
    console.log('📦 Fetching customer orders for:', { phone, email });

    if (!phone && !email) {
      return res.status(400).json({ 
        success: false, 
        message: 'Phone number or email is required' 
      });
    }

    // Find all orders from PostgreSQL
    const orders = await Order.findAll({
      order: [['createdAt', 'DESC']]
    });

    // Filter orders by phone or email in customerInfo or shippingAddress
    const customerOrders = orders.filter(order => {
      const customerPhone = order.customerInfo?.phoneNumber || order.shippingAddress?.phone;
      const customerEmail = order.customerInfo?.email || order.shippingAddress?.email;
      
      return (phone && customerPhone === phone) || (email && customerEmail === email);
    });

    console.log('✅ Found', customerOrders.length, 'orders for customer');

    res.json({
      success: true,
      orders: customerOrders,
      count: customerOrders.length
    });

  } catch (error) {
    console.error('❌ Error fetching customer orders:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch orders', error: error.message });
  }
});

// Get customer stats (overview data for My Account)
router.post('/customer-stats', async (req, res) => {
  try {
    const { phone, email } = req.body;
    console.log('📊 Fetching customer stats for:', { phone, email });

    if (!phone && !email) {
      return res.status(400).json({ 
        success: false, 
        message: 'Phone number or email is required' 
      });
    }

    // Find all orders for this customer
    const orders = await Order.findAll({
      order: [['createdAt', 'DESC']]
    });

    const customerOrders = orders.filter(order => {
      const customerPhone = order.customerInfo?.phoneNumber || order.shippingAddress?.phone;
      const customerEmail = order.customerInfo?.email || order.shippingAddress?.email;
      
      return (phone && customerPhone === phone) || (email && customerEmail === email);
    });

    // Calculate stats
    const totalOrders = customerOrders.length;
    const activeDeliveries = customerOrders.filter(o => 
      o.status === 'shipped' || o.status === 'confirmed'
    ).length;
    const completedOrders = customerOrders.filter(o => o.status === 'delivered').length;
    const pendingOrders = customerOrders.filter(o => o.status === 'pending').length;

    console.log('✅ Stats calculated:', { totalOrders, activeDeliveries, completedOrders, pendingOrders });

    res.json({
      success: true,
      stats: {
        totalOrders,
        activeDeliveries,
        completedOrders,
        pendingOrders,
        orders: customerOrders
      }
    });

  } catch (error) {
    console.error('❌ Error fetching customer stats:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch stats', error: error.message });
  }
});

// Get all orders for admin (PostgreSQL/Sequelize) - NEW ROUTE
router.get('/admin/all', async (req, res) => {
  try {
    console.log('📦 Admin fetching all orders...');
    const { status, page = 1, limit = 100 } = req.query;
    
    const where = {};
    if (status && status !== 'all') {
      where.status = status;
    }

    const offset = (page - 1) * limit;

    const { count, rows: orders } = await Order.findAndCountAll({
      where: where,
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: offset
    });

    console.log('✅ Found', orders.length, 'orders');

    // Format orders to ensure items have correct structure
    const formattedOrders = orders.map(order => {
      const orderJson = order.toJSON();
      
      // Ensure items are properly formatted with accessible fields
      if (orderJson.items && Array.isArray(orderJson.items)) {
        orderJson.items = orderJson.items.map(item => ({
          ...item,
          // Make sure these fields are at the top level for easy access
          productImage: item.image || item.mainImage || item.productImage || null,
          mainImage: item.mainImage || item.image || null,
          productName: item.name || item.productName || 'Product',
          name: item.name || item.productName || 'Product',
          image: item.image || item.mainImage || null
        }));
      }
      
      return orderJson;
    });

    res.json({
      success: true,
      orders: formattedOrders,
      data: formattedOrders,
      total: count,
      page: parseInt(page),
      totalPages: Math.ceil(count / limit)
    });

  } catch (error) {
    console.error('❌ Error fetching admin orders:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch orders', error: error.message });
  }
});

// Get all orders (for admin) - OLD MONGODB ROUTE
router.get('/', async (req, res) => {
  try {
    const orders = await Order.find()
      .sort({ createdAt: -1 })
      .limit(100);
    
    // Enhance each order with customer info
    const enhancedOrders = await Promise.all(orders.map(async (order) => {
      const customerPhone = order.shippingAddress?.phone || order.customerInfo?.phone;
      let customer = null;
      
      if (customerPhone) {
        customer = await Customer.findOne({ phone: customerPhone });
      }
      
      return {
        ...order,
        customer: customer ? {
          firstName: customer.firstName,
          lastName: customer.lastName,
          fullName: customer.fullName,
          phone: customer.phone,
          email: customer.email
        } : {
          firstName: order.shippingAddress?.firstName || 'N/A',
          lastName: order.shippingAddress?.lastName || 'N/A',
          fullName: `${order.shippingAddress?.firstName || ''} ${order.shippingAddress?.lastName || ''}`.trim(),
          phone: order.shippingAddress?.phone || 'N/A',
          email: order.shippingAddress?.email || 'N/A'
        },
        items: order.items.map(item => ({
          ...item,
          productName: item.product?.name || 'Product Not Found',
          productImage: item.product?.mainImage || item.product?.images?.[0] || null,
          size: item.size || 'N/A',
          color: item.color || 'N/A'
        }))
      };
    }));
    
    res.json({
      success: true,
      data: enhancedOrders,
      orders: enhancedOrders, // For compatibility
      pagination: {
        page: 1,
        limit: 100,
        total: enhancedOrders.length,
        pages: 1
      }
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching orders',
      error: error.message
    });
  }
});

// Get order by ID with full product details
router.get('/:id', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Get customer information
    let customer = null;
    const customerPhone = order.shippingAddress?.phone || order.customerInfo?.phone;
    
    if (customerPhone) {
      customer = await Customer.findOne({ phone: customerPhone });
    }

    // Enhance order data with product details and customer info
    const enhancedOrder = {
      ...order,
      // Customer Information
      customer: {
        firstName: customer?.firstName || order.shippingAddress?.firstName || 'N/A',
        lastName: customer?.lastName || order.shippingAddress?.lastName || 'N/A',
        fullName: customer?.fullName || `${order.shippingAddress?.firstName || ''} ${order.shippingAddress?.lastName || ''}`.trim(),
        phone: customer?.phone || order.shippingAddress?.phone || 'N/A',
        email: customer?.email || order.shippingAddress?.email || 'N/A'
      },
      // Shipping Address
      shippingAddress: {
        ...order.shippingAddress,
        fullName: `${order.shippingAddress?.firstName || ''} ${order.shippingAddress?.lastName || ''}`.trim()
      },
      // Enhanced Items
      items: order.items.map(item => ({
        _id: item._id,
        product: item.product,
        productId: item.product?._id,
        productName: item.product?.name || 'Product Not Found',
        productImage: item.product?.mainImage || item.product?.images?.[0] || null,
        productImages: item.product?.images || [],
        productCategory: item.product?.category || 'Uncategorized',
        brand: item.product?.brand || 'E-Gura Store',
        size: item.size || 'N/A',
        color: item.color || 'N/A',
        quantity: item.quantity || 0,
        price: item.price || 0,
        subtotal: (item.quantity || 0) * (item.price || 0),
        availableSizes: item.product?.sizes || [],
        availableColors: item.product?.colors || []
      }))
    };
    
    res.json({
      success: true,
      data: enhancedOrder
    });
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching order',
      error: error.message
    });
  }
});

// Get order details for admin (enhanced view)
router.get('/:id/details', async (req, res) => {
  try {
    console.log('🔍 Fetching order details for ID:', req.params.id);
    
    // Use Sequelize method for PostgreSQL
    const order = await Order.findByPk(req.params.id);
    
    if (!order) {
      console.log('❌ Order not found:', req.params.id);
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    console.log('✅ Order found:', order.orderNumber);
    console.log('📦 Order items:', order.items?.length || 0);

    // Get customer information from User model (PostgreSQL)
    let customer = null;
    const customerPhone = order.shippingAddress?.phone || order.customerInfo?.phoneNumber || order.customerInfo?.phone;
    
    if (customerPhone) {
      customer = await User.findOne({ where: { phone: customerPhone } });
    }

    // If no customer found by phone, try by user ID
    if (!customer && order.userId) {
      customer = await User.findByPk(order.userId);
    }

    // Build detailed response with all information
    const orderDetails = {
      // Order Information
      order: {
        id: order._id,
        orderNumber: order.orderNumber,
        referenceNumber: order.referenceNumber,
        status: order.status,
        paymentStatus: order.paymentStatus,
        paymentMethod: order.paymentMethod,
        orderDate: order.orderDate || order.createdAt,
        trackingNumber: order.trackingNumber,
        estimatedDelivery: order.estimatedDelivery,
        actualDelivery: order.actualDelivery
      },

      // Customer Information - ENHANCED
      customer: {
        // Basic Info
        id: customer?._id || order.user,
        firstName: customer?.firstName || order.shippingAddress?.firstName || order.customerInfo?.firstName || 'N/A',
        lastName: customer?.lastName || order.shippingAddress?.lastName || order.customerInfo?.lastName || 'N/A',
        fullName: customer?.fullName || `${order.shippingAddress?.firstName || ''} ${order.shippingAddress?.lastName || ''}`.trim() || 'Guest Customer',
        phone: customer?.phone || order.shippingAddress?.phone || order.customerInfo?.phone || 'N/A',
        email: customer?.email || order.shippingAddress?.email || order.customerInfo?.email || 'N/A',
        
        // Customer Stats
        totalOrders: customer?.orderStats?.totalOrders || 0,
        totalSpent: customer?.orderStats?.totalSpent || 0,
        averageOrderValue: customer?.orderStats?.averageOrderValue || 0,
        segment: customer?.segment || 'new',
        
        // Additional Info
        hasAccount: !!customer,
        registeredDate: customer?.createdAt || null,
        lastOrderDate: customer?.orderStats?.lastOrderDate || null
      },

      // Shipping Address - COMPLETE
      shippingAddress: {
        firstName: order.shippingAddress?.firstName || 'N/A',
        lastName: order.shippingAddress?.lastName || 'N/A',
        fullName: `${order.shippingAddress?.firstName || ''} ${order.shippingAddress?.lastName || ''}`.trim() || 'N/A',
        phone: order.shippingAddress?.phone || 'N/A',
        email: order.shippingAddress?.email || 'N/A',
        address: order.shippingAddress?.address || 'N/A',
        city: order.shippingAddress?.city || 'N/A',
        district: order.shippingAddress?.district || 'N/A',
        postalCode: order.shippingAddress?.postalCode || 'N/A',
        country: order.shippingAddress?.country || 'Rwanda',
        instructions: order.shippingAddress?.instructions || null
      },

      // Product Items with FULL Details
      items: order.items.map(item => {
        // Items in PostgreSQL are stored as JSONB - product data should already be in the item
        // Check both nested product object and direct fields
        console.log('📦 Processing item:', {
          name: item.name,
          productName: item.productName,
          hasProduct: !!item.product,
          image: item.image,
          mainImage: item.mainImage
        });
        
        return {
          // Product IDs
          _id: item._id || item.id,
          productId: item.productId || item.product || null,
          
          // Product Basic Info - Use direct fields first (from JSONB), then nested product
          productName: item.name || item.productName || 'Product Not Found',
          productDescription: item.description || 'No description available',
          shortDescription: item.shortDescription || null,
          
          // Product Images - Use direct image fields
          productImage: item.image || item.mainImage || null,
          productImages: item.images || [],
          mainImage: item.image || item.mainImage || null,
          
          // Product Details
          category: item.category || 'Uncategorized',
          brand: item.brand || 'E-Gura Store',
          material: item.material || [],
          care: item.care || [],
          
          // Order-Specific Details
          size: item.size || 'N/A',
          color: item.color || 'N/A',
          quantity: item.quantity || 0,
          unitPrice: item.price || 0,
          subtotal: (item.quantity || 0) * (item.price || 0),
          
          // Available Options
          availableSizes: item.sizes || [],
          availableColors: item.colors || [],
          
          // Stock Info
          stockQuantity: item.stock || item.stockQuantity || 0,
          inStock: (item.stock || item.stockQuantity || 0) > 0
        };
      }),

      // Order Summary
      summary: {
        itemsCount: order.items?.length || 0,
        totalQuantity: order.items?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0,
        subtotal: order.subtotal || 0,
        tax: order.tax || 0,
        shippingCost: order.shippingCost || 0,
        discount: order.discount || 0,
        total: order.total || 0,
        currency: 'RWF'
      },

      // Payment Details - COMPLETE
      payment: {
        method: order.paymentMethod || 'N/A',
        status: order.paymentStatus || 'pending',
        transactionId: order.paymentDetails?.transactionId || order.mobileMoney?.transactionId || null,
        paymentDate: order.paymentDetails?.paymentDate || null,
        provider: order.paymentDetails?.paymentProvider || order.mobileMoney?.provider || null,
        amount: order.paymentDetails?.amount || order.total || 0,
        currency: order.paymentDetails?.currency || 'RWF',
        
        // Mobile Money Details
        mobileMoney: order.mobileMoney ? {
          provider: order.mobileMoney.provider || 'N/A',
          phoneNumber: order.mobileMoney.phoneNumber || 'N/A',
          transactionId: order.mobileMoney.transactionId || null,
          mtnReferenceId: order.mobileMoney.mtnReferenceId || null,
          status: order.mobileMoney.status || 'pending',
          errorMessage: order.mobileMoney.errorMessage || null
        } : null,
        
        // Cash on Delivery
        cashOnDelivery: order.cashOnDelivery ? {
          amount: order.cashOnDelivery.amount || 0,
          changeRequired: order.cashOnDelivery.changeRequired || 0,
          collectedBy: order.cashOnDelivery.collectedBy || null,
          collectionDate: order.cashOnDelivery.collectionDate || null
        } : null
      },

      // Status History
      statusHistory: order.statusHistory || [],

      // Notes
      notes: {
        customer: order.notes?.customer || null,
        admin: order.notes?.admin || null
      },

      // Timestamps
      timestamps: {
        created: order.createdAt,
        updated: order.updatedAt,
        orderDate: order.orderDate
      }
    };
    
    res.json({
      success: true,
      data: orderDetails,
      message: 'Order details retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching order details:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching order details',
      error: error.message
    });
  }
});

// Admin: Update order status (PostgreSQL/Sequelize) - NEW ROUTE
router.put('/admin/:orderId/status', async (req, res) => {
  try {
    const { status, trackingNumber, notes, estimatedDelivery } = req.body;

    console.log('🔄 Admin updating order:', req.params.orderId, '→', status);

    const order = await Order.findOne({
      where: { id: req.params.orderId }
    });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const statusHistory = order.statusHistory || [];
    statusHistory.push({
      status: status,
      timestamp: new Date(),
      note: notes || `Status updated to ${status}`
    });

    const updateData = {
      status: status,
      statusHistory: statusHistory
    };

    if (trackingNumber) {
      updateData.trackingNumber = trackingNumber;
    }

    if (estimatedDelivery) {
      updateData.estimatedDelivery = estimatedDelivery;
    }

    if (status === 'delivered') {
      updateData.actualDelivery = new Date();
      updateData.paymentStatus = 'completed';
    }

    await order.update(updateData);

    console.log('✅ Order status updated successfully');

    res.json({
      success: true,
      message: 'Order status updated successfully',
      order: order
    });

  } catch (error) {
    console.error('❌ Error updating order status:', error);
    res.status(500).json({ success: false, message: 'Failed to update order status', error: error.message });
  }
});

// Update order status - OLD ROUTE
router.put('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }
    
    order.status = status;
    order.statusHistory.push({
      status,
      date: new Date(),
      note: `Status updated to ${status}`
    });
    
    await order.save();
    
    res.json({
      success: true,
      data: order,
      message: 'Order status updated successfully'
    });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating order status',
      error: error.message
    });
  }
});

module.exports = router; 