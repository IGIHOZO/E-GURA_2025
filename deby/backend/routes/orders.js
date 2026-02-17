const express = require('express');
const router = express.Router();
const { Order, Product, User } = require('../models');
const { authMiddleware, optionalAuthMiddleware } = require('../middleware/authMiddleware');

// Create new order
router.post('/', optionalAuthMiddleware, async (req, res) => {
  try {
    const { items, shippingAddress, paymentMethod, customerInfo, paymentDetails } = req.body;

    // Validate required fields
    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Order items are required' });
    }

    if (!shippingAddress) {
      return res.status(400).json({ success: false, message: 'Shipping address is required' });
    }

    // Calculate totals
    let subtotal = 0;
    const orderItems = [];

    for (const item of items) {
      const product = await Product.findOne({ where: { id: item.productId } });
      if (!product) {
        return res.status(404).json({ success: false, message: `Product ${item.productId} not found` });
      }

      const itemTotal = parseFloat(product.price) * parseInt(item.quantity);
      subtotal += itemTotal;

      orderItems.push({
        productId: product.id,
        name: product.name,
        price: product.price,
        quantity: item.quantity,
        variant: item.variant || 'Default',
        size: item.size || 'Default',
        image: product.mainImage,
        total: itemTotal
      });
    }

    const shippingCost = 5000; // Fixed shipping cost for Rwanda
    const tax = 0; // No tax for now
    const total = subtotal + shippingCost + tax;

    // Create order
    const order = await Order.create({
      userId: req.user?.id || null,
      items: orderItems,
      subtotal: subtotal,
      tax: tax,
      shippingCost: shippingCost,
      discount: 0,
      total: total,
      totalAmount: total,
      paymentMethod: paymentMethod,
      paymentStatus: paymentMethod === 'cash_on_delivery' ? 'pending' : 'pending',
      paymentDetails: paymentDetails || {},
      shippingAddress: shippingAddress,
      customerInfo: customerInfo,
      status: 'pending',
      orderDate: new Date(),
      statusHistory: [{
        status: 'pending',
        timestamp: new Date(),
        note: 'Order placed successfully'
      }]
    });

    console.log('✅ Order created:', order.orderNumber);

    res.status(201).json({
      success: true,
      message: 'Order placed successfully',
      orderId: order.id,
      orderNumber: order.orderNumber,
      order: order
    });

  } catch (error) {
    console.error('❌ Error creating order:', error);
    res.status(500).json({ success: false, message: 'Failed to create order', error: error.message });
  }
});

// Get customer's orders by phone or email (for quick auth users)
router.post('/customer-orders', async (req, res) => {
  try {
    const { phone, email } = req.body;

    if (!phone && !email) {
      return res.status(400).json({ 
        success: false, 
        message: 'Phone number or email is required' 
      });
    }

    // Find orders by customer info
    const orders = await Order.findAll({
      order: [['createdAt', 'DESC']]
    });

    // Filter orders by phone or email in customerInfo or shippingAddress
    const customerOrders = orders.filter(order => {
      const customerPhone = order.customerInfo?.phoneNumber || order.shippingAddress?.phone;
      const customerEmail = order.customerInfo?.email || order.shippingAddress?.email;
      
      return (phone && customerPhone === phone) || (email && customerEmail === email);
    });

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

// Get customer stats (overview data)
router.post('/customer-stats', async (req, res) => {
  try {
    const { phone, email } = req.body;

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

// Get customer's orders (authenticated route)
router.get('/my-orders', authMiddleware, async (req, res) => {
  try {
    const orders = await Order.findAll({
      where: { userId: req.user.id },
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      orders: orders
    });

  } catch (error) {
    console.error('❌ Error fetching orders:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch orders', error: error.message });
  }
});

// Get order details
router.get('/:orderId', async (req, res) => {
  try {
    const order = await Order.findOne({
      where: { id: req.params.orderId }
    });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    res.json({
      success: true,
      order: order
    });

  } catch (error) {
    console.error('❌ Error fetching order:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch order', error: error.message });
  }
});

// Track order
router.get('/:orderId/tracking', async (req, res) => {
  try {
    const order = await Order.findOne({
      where: { id: req.params.orderId }
    });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const tracking = {
      orderNumber: order.orderNumber,
      status: order.status,
      paymentStatus: order.paymentStatus,
      trackingNumber: order.trackingNumber,
      estimatedDelivery: order.estimatedDelivery,
      statusHistory: order.statusHistory || [],
      currentStep: getOrderStep(order.status)
    };

    res.json({
      success: true,
      tracking: tracking
    });

  } catch (error) {
    console.error('❌ Error tracking order:', error);
    res.status(500).json({ success: false, message: 'Failed to track order', error: error.message });
  }
});

// Cancel order
router.put('/:orderId/cancel', authMiddleware, async (req, res) => {
  try {
    const order = await Order.findOne({
      where: { id: req.params.orderId, userId: req.user.id }
    });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (order.status === 'shipped' || order.status === 'delivered') {
      return res.status(400).json({ success: false, message: 'Cannot cancel shipped or delivered orders' });
    }

    const statusHistory = order.statusHistory || [];
    statusHistory.push({
      status: 'cancelled',
      timestamp: new Date(),
      note: req.body.reason || 'Cancelled by customer'
    });

    await order.update({
      status: 'cancelled',
      statusHistory: statusHistory
    });

    res.json({
      success: true,
      message: 'Order cancelled successfully',
      order: order
    });

  } catch (error) {
    console.error('❌ Error cancelling order:', error);
    res.status(500).json({ success: false, message: 'Failed to cancel order', error: error.message });
  }
});

// Admin: Get all orders
router.get('/admin/all', authMiddleware, async (req, res) => {
  try {
    // Check if user is admin (you'll need to add role checking)
    const { status, page = 1, limit = 20 } = req.query;
    
    const where = {};
    if (status) {
      where.status = status;
    }

    const offset = (page - 1) * limit;

    const { count, rows: orders } = await Order.findAndCountAll({
      where: where,
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: offset
    });

    res.json({
      success: true,
      orders: orders,
      total: count,
      page: parseInt(page),
      totalPages: Math.ceil(count / limit)
    });

  } catch (error) {
    console.error('❌ Error fetching all orders:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch orders', error: error.message });
  }
});

// Admin: Update order status
router.put('/admin/:orderId/status', authMiddleware, async (req, res) => {
  try {
    const { status, trackingNumber, notes, estimatedDelivery } = req.body;

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
      note: notes || `Status updated to ${status}`,
      updatedBy: req.user.email
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

    console.log('✅ Order status updated:', order.orderNumber, '→', status);

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

// Helper function to get order step
function getOrderStep(status) {
  const steps = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];
  return steps.indexOf(status) + 1;
}

module.exports = router;
