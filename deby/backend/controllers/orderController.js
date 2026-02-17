const Order = require('../models/Order');
const User = require('../models/User');
const Product = require('../models/Product');
const Payment = require('../models/Payment');
const crypto = require('crypto');
const axios = require('axios');
const mtnPayment = require('../services/mtnPayment');
const smsService = require('../services/smsService');

// InTouch Pay API Configuration (from Java code)
const API_CONFIG = {
  username: 'egura.ltd',
  password: '45b4+Yv$w\\/3q{2ZYvW',
  apiUrl: 'https://www.intouchpay.co.rw/api/requestpayment/',
  merchantId: '250220000148'
};

// SHA-256 Hash function (from Java code)
const hashPassword = (password) => {
  return crypto.createHash('sha256').update(password).digest('hex');
};

// Generate unique transaction ID (from Java code)
const generateTransactionId = () => {
  const currentTime = new Date().getTime();
  const max = 9999999999999;
  const min = 1000000000000;
  const range = Math.abs((Math.random() * (max - min)) + min);
  const transactionId = Math.floor(currentTime + range);
  return transactionId.toString();
};

// Create MOMO Payment (based on InTouch Pay API documentation)
const createMomoPayment = async (order, phone) => {
  try {
    const timestamp = new Date().getTime();
    const username = API_CONFIG.username;
    const accountno = API_CONFIG.merchantId; // Account number from API config
    const pwd = username + accountno + API_CONFIG.password + timestamp;
    const hashedPassword = hashPassword(pwd);
    const requestTransactionId = generateTransactionId();

    // Update order with external ID and set status to pending
    order.externalId = requestTransactionId;
    order.paymentStatus = 'pending';
    order.status = 'pending';
    await order.save();

    // Prepare payment request according to InTouch Pay API documentation
    const paymentRequest = {
      username: username,
      timestamp: timestamp.toString(),
      amount: order.total.toString(),
      password: hashedPassword,
      mobilephoneno: phone, // Note: API expects 'mobilephoneno' not 'mobilephone'
      requesttransactionid: requestTransactionId,
      accountno: accountno,
      callbackurl: `${process.env.BASE_URL || 'http://localhost:5000'}/api/payments/callback/${requestTransactionId}`
    };

    console.log('InTouch Pay Request (API compliant):', paymentRequest);

    // Make API call to InTouch Pay
    const response = await axios.post(API_CONFIG.apiUrl, paymentRequest, {
      headers: {
        'Content-Type': 'application/json',
      }
    });

    console.log('InTouch Pay Response:', response.data);

    // Check if response indicates pending status (as per API documentation)
    if (response.data.success && response.data.status === 'Pending') {
      return {
        success: true,
        data: response.data,
        transactionId: requestTransactionId,
        status: 'pending',
        message: 'Payment request sent. Please check your phone for confirmation.'
      };
    } else {
      throw new Error(`Payment initialization failed: ${response.data.message || 'Unknown error'}`);
    }

  } catch (error) {
    console.error('InTouch Pay API Error:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Payment processing failed');
  }
};

// Get order list (based on Java getList method)
const getOrderList = async (req, res) => {
  try {
    const userId = req.user.id;
    const { status } = req.query;

    let query = { user: userId };
    if (status && status.trim() !== '') {
      query.status = status;
    }

    const orders = await Order.find(query)
      .populate('user', 'firstName lastName email')
      .populate('items.product', 'name price mainImage')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: orders
    });

  } catch (error) {
    console.error('Get order list error:', error);
    res.status(500).json({ message: 'Error retrieving orders', error: error.message });
  }
};

// Get order by ID (based on Java getOrder method)
const getOrderById = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user.id;

    const order = await Order.findById(orderId)
      .populate('user', 'firstName lastName email')
      .populate('items.product', 'name price mainImage description')
      .populate('address');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.user._id.toString() !== userId) {
      return res.status(403).json({ message: 'Not authorized to view this order' });
    }

    res.json({
      success: true,
      data: order
    });

  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ message: 'Error retrieving order', error: error.message });
  }
};

// Get payment status (based on Java pay method)
const getPaymentStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user.id;

    const order = await Order.findById(orderId)
      .populate('user', 'firstName lastName email');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.user._id.toString() !== userId) {
      return res.status(403).json({ message: 'Not authorized to view this order' });
    }

    res.json({
      success: true,
      data: order
    });

  } catch (error) {
    console.error('Get payment status error:', error);
    res.status(500).json({ message: 'Error retrieving payment status', error: error.message });
  }
};

// Process payment (based on Java pay method)
const processPayment = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { type, phone } = req.body;
    const userId = req.user.id;

    const order = await Order.findById(orderId).populate('user');
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.user._id.toString() !== userId) {
      return res.status(403).json({ message: 'Not authorized to pay for this order' });
    }

    // Handle different payment types
    if (type === 'equity') {
      return res.json({
        success: true,
        data: `https://e-gura.rw/zion/public/order/page/view/${orderId}`,
        message: 'Redirecting to Equity payment page'
      });
    }

    if (type === 'momo') {
      if (!phone) {
        return res.status(400).json({ message: 'Phone number is required for MOMO payment' });
      }

      try {
        // Initialize payment according to InTouch Pay API documentation
        const momoResponse = await createMomoPayment(order, phone);
        
        // Return the InTouch Pay API response to frontend
        // According to API docs, this should return "Pending" status
        res.json({
          success: true,
          data: momoResponse.data,
          transactionId: momoResponse.transactionId,
          message: momoResponse.message || 'Payment request sent. Please check your phone for confirmation.',
          status: 'pending', // InTouch Pay API returns "Pending" status
          responseCode: momoResponse.data.responsecode || '1000'
        });
      } catch (error) {
        res.status(500).json({ 
          message: 'MOMO payment initialization failed', 
          error: error.message 
        });
      }
    } else {
      // Handle other payment methods (credit card, etc.)
      const transactionId = generateTransactionId();
      
      order.externalId = transactionId;
      order.paymentMode = type;
      await order.save();

      // For credit card payments, you would integrate with a payment gateway
      // For now, we'll return a mock response
      res.json({
        success: true,
        data: `https://pay.esicia.rw/checkout/${transactionId}`,
        message: 'Redirecting to payment gateway'
      });
    }

  } catch (error) {
    console.error('Process payment error:', error);
    res.status(500).json({ message: 'Error processing payment', error: error.message });
  }
};

// Create order (based on Java createOrder method)
const createOrder = async (req, res) => {
  try {
    const userId = req.user.id;
    const { items, shippingAddress, paymentMethod, notes } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'No items in order' });
    }

    if (!shippingAddress) {
      return res.status(400).json({ message: 'Shipping address is required' });
    }

    // Calculate totals
    let subtotal = 0;
    const orderItems = [];

    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product) {
        return res.status(404).json({ message: `Product ${item.product} not found` });
      }

      if (product.stockQuantity < item.quantity) {
        return res.status(400).json({ message: `Insufficient stock for ${product.name}` });
      }

      const itemTotal = product.price * item.quantity;
      subtotal += itemTotal;

      orderItems.push({
        product: item.product,
        quantity: item.quantity,
        price: product.price,
        size: item.size,
        color: item.color
      });

      // Update product stock
      product.stockQuantity -= item.quantity;
      await product.save();
    }

    const tax = subtotal * 0.18; // 18% VAT
    const shippingCost = subtotal > 50000 ? 0 : 2000; // Free shipping over 50,000 RWF
    const total = subtotal + tax + shippingCost;

    // Create order
    const order = new Order({
      user: userId,
      items: orderItems,
      subtotal,
      tax,
      shippingCost,
      total,
      paymentMethod,
      shippingAddress,
      notes: {
        customer: notes?.customer || ''
      },
      status: 'pending',
      paymentStatus: 'pending'
    });

    await order.save();

    // Add status to history
    order.statusHistory.push({
      status: 'pending',
      date: new Date(),
      note: 'Order created',
      updatedBy: 'system'
    });

    await order.save();

    // Populate order with user and product details
    const populatedOrder = await Order.findById(order._id)
      .populate('user', 'firstName lastName email')
      .populate('items.product', 'name price mainImage');

    res.status(201).json({
      success: true,
      data: populatedOrder,
      message: 'Order created successfully'
    });

  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ message: 'Error creating order', error: error.message });
  }
};

// Update order status
const updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status, note } = req.body;
    const userId = req.user.id;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.user.toString() !== userId) {
      return res.status(403).json({ message: 'Not authorized to update this order' });
    }

    order.status = status;
    order.statusHistory.push({
      status,
      date: new Date(),
      note: note || `Order status updated to ${status}`,
      updatedBy: 'user'
    });

    await order.save();

    res.json({
      success: true,
      data: order,
      message: 'Order status updated successfully'
    });

  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ message: 'Error updating order status', error: error.message });
  }
};

// Cancel order
const cancelOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { reason } = req.body;
    const userId = req.user.id;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.user.toString() !== userId) {
      return res.status(403).json({ message: 'Not authorized to cancel this order' });
    }

    if (order.status === 'cancelled') {
      return res.status(400).json({ message: 'Order is already cancelled' });
    }

    if (['shipped', 'delivered'].includes(order.status)) {
      return res.status(400).json({ message: 'Cannot cancel order that has been shipped or delivered' });
    }

    // Restore product stock
    for (const item of order.items) {
      const product = await Product.findById(item.product);
      if (product) {
        product.stockQuantity += item.quantity;
        await product.save();
      }
    }

    order.status = 'cancelled';
    order.statusHistory.push({
      status: 'cancelled',
      date: new Date(),
      note: `Order cancelled: ${reason || 'No reason provided'}`,
      updatedBy: 'user'
    });

    await order.save();

    res.json({
      success: true,
      data: order,
      message: 'Order cancelled successfully'
    });

  } catch (error) {
    console.error('Cancel order error:', error);
    res.status(500).json({ message: 'Error cancelling order', error: error.message });
  }
};

// Create order with MTN payment
const createOrderWithMTNPayment = async (req, res) => {
  try {
    const { items, shippingAddress, customerInfo, paymentPhone } = req.body;
    
    // Create order
    const order = new Order({
      user: req.user._id,
      items: items,
      shippingAddress: shippingAddress,
      paymentMethod: 'mobile_money',
      mobileMoney: {
        provider: 'mtn',
        phoneNumber: paymentPhone,
        status: 'PENDING'
      }
    });
    
    await order.save();
    
    // Initiate MTN payment
    const paymentResult = await mtnPayment.requestPayment(
      paymentPhone,
      order.total,
      order.orderNumber,
      `${customerInfo.firstName} ${customerInfo.lastName}`
    );
    
    if (paymentResult.success) {
      // Update order with MTN reference
      order.mobileMoney.mtnReferenceId = paymentResult.referenceId;
      await order.save();
      
      // Send SMS to customer
      await smsService.sendOrderConfirmation(paymentPhone, order.orderNumber);
      
      res.status(201).json({
        success: true,
        order: order,
        payment: paymentResult,
        message: 'Order created. Please complete payment on your phone.'
      });
    } else {
      res.status(400).json({
        success: false,
        message: paymentResult.message
      });
    }
    
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ message: 'Error creating order', error: error.message });
  }
};

// Verify MTN payment and update order
const verifyMTNPayment = async (req, res) => {
  try {
    const { referenceId } = req.params;
    
    const order = await Order.findOne({ 'mobileMoney.mtnReferenceId': referenceId });
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    // Check payment status
    const paymentStatus = await mtnPayment.checkPaymentStatus(referenceId);
    
    if (paymentStatus.isPaid) {
      order.paymentStatus = 'completed';
      order.mobileMoney.status = 'SUCCESSFUL';
      order.status = 'confirmed';
      await order.save();
      
      // Send confirmation SMS
      await smsService.sendOrderConfirmation(
        order.shippingAddress.phone,
        order.orderNumber
      );
      
      // Notify admin
      await smsService.sendAdminNotification(
        `New order ${order.orderNumber} - ${order.total} RWF`
      );
    }
    
    res.json({
      success: true,
      order: order,
      paymentStatus: paymentStatus
    });
    
  } catch (error) {
    console.error('Verify payment error:', error);
    res.status(500).json({ message: 'Error verifying payment', error: error.message });
  }
};

// Get all orders for admin
const getAllOrders = async (req, res) => {
  try {
    const { status, paymentStatus, page = 1, limit = 20 } = req.query;
    
    const query = {};
    if (status) query.status = status;
    if (paymentStatus) query.paymentStatus = paymentStatus;
    
    const orders = await Order.find(query)
      .populate('user', 'name email phone')
      .populate('items.product', 'name mainImage price')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const count = await Order.countDocuments(query);
    
    res.json({
      success: true,
      orders: orders,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count
    });
    
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ message: 'Error fetching orders', error: error.message });
  }
};

module.exports = {
  getOrderList,
  getOrderById,
  getPaymentStatus,
  processPayment,
  createOrder,
  updateOrderStatus,
  cancelOrder,
  createOrderWithMTNPayment,
  verifyMTNPayment,
  getAllOrders
}; 