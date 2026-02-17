const express = require('express');
const router = express.Router();
const orderTrackingService = require('../services/orderTrackingService');
const { Order } = require('../models');

/**
 * GET /api/tracking/:trackingId
 * Get tracking information by order number or ID
 */
router.get('/:trackingId', async (req, res) => {
  try {
    const { trackingId } = req.params;
    console.log('🔍 Looking for tracking:', trackingId);

    // Try to find order by orderNumber first, then by ID
    let order = await Order.findOne({ 
      where: { orderNumber: trackingId } 
    });

    if (!order) {
      order = await Order.findOne({ 
        where: { id: trackingId } 
      });
    }

    if (!order) {
      console.log('❌ Order not found:', trackingId);
      return res.status(404).json({
        success: false,
        message: 'Tracking not found. Please check your order number.'
      });
    }

    // Build tracking response
    const tracking = {
      orderNumber: order.orderNumber,
      orderId: order.id,
      status: order.status || 'pending',
      paymentStatus: order.paymentStatus || 'pending',
      trackingNumber: order.trackingNumber || `TRK-${order.orderNumber}`,
      estimatedDelivery: order.estimatedDelivery || calculateEstimatedDelivery(order.createdAt),
      currentLocation: getCurrentLocation(order.status),
      carrier: 'E-Gura Express',
      statusHistory: order.statusHistory || buildDefaultHistory(order),
      currentStep: getOrderStep(order.status),
      items: order.items,
      total: order.total,
      shippingAddress: order.shippingAddress,
      customerInfo: order.customerInfo,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt
    };

    console.log('✅ Tracking found:', order.orderNumber);

    res.json({
      success: true,
      tracking
    });
  } catch (error) {
    console.error('❌ Get tracking error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Helper functions
function calculateEstimatedDelivery(orderDate) {
  const date = new Date(orderDate);
  date.setDate(date.getDate() + 3); // Add 3 days
  return date.toISOString();
}

function getCurrentLocation(status) {
  const locations = {
    'pending': 'Order Processing - Warehouse',
    'confirmed': 'Preparing for Shipment - Warehouse',
    'processing': 'Packaging - Warehouse',
    'shipped': 'In Transit - Delivery Network',
    'delivered': 'Delivered',
    'cancelled': 'Order Cancelled'
  };
  return locations[status] || 'Warehouse - Kigali';
}

function getOrderStep(status) {
  const steps = {
    'pending': 0,
    'confirmed': 1,
    'processing': 2,
    'shipped': 3,
    'delivered': 4,
    'cancelled': -1
  };
  return steps[status] || 0;
}

function buildDefaultHistory(order) {
  const history = [{
    status: 'pending',
    timestamp: order.createdAt,
    location: 'Warehouse - Kigali',
    message: 'Order received and is being processed'
  }];

  if (order.status === 'confirmed') {
    history.push({
      status: 'confirmed',
      timestamp: order.updatedAt,
      location: 'Warehouse - Kigali',
      message: 'Order confirmed and ready for processing'
    });
  }

  if (order.status === 'shipped') {
    history.push({
      status: 'shipped',
      timestamp: order.updatedAt,
      location: 'In Transit',
      message: 'Package has been shipped and is on its way'
    });
  }

  if (order.status === 'delivered') {
    history.push({
      status: 'delivered',
      timestamp: order.updatedAt,
      location: 'Delivered',
      message: 'Package has been delivered successfully'
    });
  }

  return history;
}

/**
 * GET /api/tracking/order/:orderId
 * Get tracking by order ID
 */
router.get('/order/:orderId', (req, res) => {
  try {
    const { orderId } = req.params;
    const tracking = orderTrackingService.getTrackingByOrderId(orderId);

    if (!tracking) {
      return res.status(404).json({
        success: false,
        message: 'Tracking not found for this order'
      });
    }

    res.json({
      success: true,
      tracking
    });
  } catch (error) {
    console.error('❌ Get tracking error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * POST /api/tracking/create
 * Create tracking for new order
 */
router.post('/create', (req, res) => {
  try {
    const tracking = orderTrackingService.createTracking(req.body);

    res.json({
      success: true,
      tracking
    });
  } catch (error) {
    console.error('❌ Create tracking error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * PUT /api/tracking/:trackingId/status
 * Update tracking status
 */
router.put('/:trackingId/status', async (req, res) => {
  try {
    const { trackingId } = req.params;
    const { status, location, message } = req.body;

    const tracking = await orderTrackingService.updateStatus(
      trackingId,
      status,
      location,
      message
    );

    res.json({
      success: true,
      tracking
    });
  } catch (error) {
    console.error('❌ Update status error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * GET /api/tracking/stats
 * Get tracking statistics
 */
router.get('/admin/stats', (req, res) => {
  try {
    const stats = orderTrackingService.getStats();

    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('❌ Get stats error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * POST /api/tracking/:trackingId/simulate
 * Simulate shipment progress (for demo)
 */
router.post('/:trackingId/simulate', async (req, res) => {
  try {
    const { trackingId } = req.params;

    orderTrackingService.simulateShipment(trackingId);

    res.json({
      success: true,
      message: 'Shipment simulation started'
    });
  } catch (error) {
    console.error('❌ Simulate error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;
