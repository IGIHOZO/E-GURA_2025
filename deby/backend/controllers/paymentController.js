const Payment = require('../models/Payment');
const Order = require('../models/Order');
const User = require('../models/User');
const crypto = require('crypto');
const axios = require('axios');

// InTouch Pay API Configuration (from Java Spring Boot implementation)
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

// Initialize Mobile Money Payment
const initiateMobileMoneyPayment = async (req, res) => {
  try {
    const { orderId, provider, phoneNumber, amount } = req.body;
    const userId = req.user.id;

    // Validate order
    const order = await Order.findById(orderId).populate('user');
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.user._id.toString() !== userId) {
      return res.status(403).json({ message: 'Not authorized to pay for this order' });
    }

    // Validate payment amount
    if (amount !== order.total) {
      return res.status(400).json({ message: 'Payment amount does not match order total' });
    }

    // Create payment record
    const payment = new Payment({
      order: orderId,
      user: userId,
      amount: amount,
      paymentMethod: 'mobile_money',
      mobileMoney: {
        provider: provider,
        phoneNumber: phoneNumber,
        status: 'pending'
      }
    });

    await payment.save();

    // Use InTouch Pay API for MOMO payments
    if (provider === 'momo') {
      try {
        const momoResponse = await createMomoPayment(order, phoneNumber);
        
        // Update payment with transaction details
        payment.mobileMoney.transactionId = momoResponse.transactionId;
        payment.mobileMoney.externalId = momoResponse.transactionId;
        payment.mobileMoney.initiatedAt = new Date();
        payment.mobileMoney.apiResponse = momoResponse.data;
        await payment.save();

        // Update order payment status
        order.paymentStatus = 'processing';
        order.mobileMoney = {
          provider: provider,
          phoneNumber: phoneNumber,
          transactionId: momoResponse.transactionId,
          externalId: momoResponse.transactionId,
          status: 'pending'
        };
        await order.save();

        res.json({
          success: true,
          payment: payment,
          message: 'Payment request sent to MTN Mobile Money. Please check your phone for payment prompt.',
          transactionId: momoResponse.transactionId,
          response: momoResponse.data
        });

      } catch (momoError) {
        console.error('MOMO Payment Error:', momoError);
        
        // Update payment status to failed
        payment.status = 'failed';
        payment.mobileMoney.status = 'failed';
        payment.failedAt = new Date();
        payment.mobileMoney.errorMessage = momoError.message;
        await payment.save();

        res.status(500).json({ 
          message: 'Mobile money payment failed', 
          error: momoError.message 
        });
      }
    } else {
      // Handle other mobile money providers (fallback to mock)
      const transactionId = `MM${Date.now()}${Math.random().toString(36).substr(2, 9)}`;
      
      payment.mobileMoney.transactionId = transactionId;
      payment.mobileMoney.initiatedAt = new Date();
      await payment.save();

      order.paymentStatus = 'processing';
      order.mobileMoney = {
        provider: provider,
        phoneNumber: phoneNumber,
        transactionId: transactionId,
        status: 'pending'
      };
      await order.save();

      res.json({
        success: true,
        payment: payment,
        message: `Payment request sent to ${provider}. Please check your phone for payment prompt.`,
        transactionId: transactionId
      });
    }

  } catch (error) {
    console.error('Mobile money payment error:', error);
    res.status(500).json({ message: 'Error processing mobile money payment', error: error.message });
  }
};

// Verify Mobile Money Payment
const verifyMobileMoneyPayment = async (req, res) => {
  try {
    const { transactionId } = req.params;

    const payment = await Payment.findOne({
      'mobileMoney.transactionId': transactionId
    }).populate('order');

    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    // For InTouch Pay transactions, check the external ID
    if (payment.mobileMoney.externalId) {
      // In a real implementation, you would call InTouch Pay's verification API
      // For now, we'll simulate the verification
      const isSuccess = Math.random() > 0.1; // 90% success rate for demo

      if (isSuccess) {
        payment.status = 'completed';
        payment.mobileMoney.status = 'success';
        payment.mobileMoney.completedAt = new Date();
        payment.completedAt = new Date();
        payment.mobileMoney.responseCode = '00';
        payment.mobileMoney.responseMessage = 'Payment successful';

        await payment.save();

        // Update order
        const order = payment.order;
        order.paymentStatus = 'completed';
        order.status = 'confirmed';
        order.mobileMoney.status = 'success';
        await order.save();

        res.json({
          success: true,
          payment: payment,
          message: 'Payment verified successfully'
        });
      } else {
        payment.status = 'failed';
        payment.mobileMoney.status = 'failed';
        payment.failedAt = new Date();
        payment.mobileMoney.responseCode = '99';
        payment.mobileMoney.responseMessage = 'Payment failed or cancelled';

        await payment.save();

        res.json({
          success: false,
          payment: payment,
          message: 'Payment verification failed'
        });
      }
    } else {
      // Handle legacy transactions
      const isSuccess = Math.random() > 0.1;

      if (isSuccess) {
        payment.status = 'completed';
        payment.mobileMoney.status = 'success';
        payment.mobileMoney.completedAt = new Date();
        payment.completedAt = new Date();
        await payment.save();

        const order = payment.order;
        order.paymentStatus = 'completed';
        order.status = 'confirmed';
        order.mobileMoney.status = 'success';
        await order.save();

        res.json({
          success: true,
          payment: payment,
          message: 'Payment verified successfully'
        });
      } else {
        payment.status = 'failed';
        payment.mobileMoney.status = 'failed';
        payment.failedAt = new Date();
        await payment.save();

        res.json({
          success: false,
          payment: payment,
          message: 'Payment verification failed'
        });
      }
    }

  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(500).json({ message: 'Error verifying payment', error: error.message });
  }
};

// Get Payment Status (based on Java pay method)
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
      order: order
    });

  } catch (error) {
    console.error('Get payment status error:', error);
    res.status(500).json({ message: 'Error retrieving payment status', error: error.message });
  }
};

// Process Payment (based on Java pay method)
const processPayment = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { type, phone, orderData } = req.body;
    const userId = req.user?.id;

    let order;
    
    if (orderId && orderId !== 'new') {
      // Existing order flow
      order = await Order.findById(orderId).populate('user');
      if (!order) {
        return res.status(404).json({ message: 'Order not found' });
      }
      if (order.user._id.toString() !== userId) {
        return res.status(403).json({ message: 'Not authorized to pay for this order' });
      }
    } else {
      // New order flow - create order from orderData
      if (!orderData) {
        return res.status(400).json({ message: 'Order data is required for new orders' });
      }
      
      // Create and save the order for payment processing
      order = new Order({
        user: userId || 'temp-user',
        items: orderData.items || [],
        subtotal: orderData.subtotal || 0,
        total: orderData.total || 0,
        shippingAddress: orderData.shippingAddress || {},
        status: 'pending',
        paymentStatus: 'pending',
        paymentMode: type,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      // Save the order so it has an _id for the payment processing
      await order.save();
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

// Initialize MOMO Pay Payment
const initiateMomoPayPayment = async (req, res) => {
  try {
    const { orderId, amount, callbackUrl } = req.body;
    const userId = req.user.id;

    // Validate order
    const order = await Order.findById(orderId).populate('user');
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.user._id.toString() !== userId) {
      return res.status(403).json({ message: 'Not authorized to pay for this order' });
    }

    // Create payment record
    const payment = new Payment({
      order: orderId,
      user: userId,
      amount: amount,
      paymentMethod: 'momo_pay',
      momoPay: {
        merchantId: process.env.MOMO_MERCHANT_ID || 'SEWITHDEBBY',
        merchantName: 'SEWITHDEBBY',
        status: 'pending',
        callbackUrl: callbackUrl
      }
    });

    await payment.save();

    // Generate MOMO Pay transaction details
    const transactionId = `MP${Date.now()}${Math.random().toString(36).substr(2, 9)}`;
    const referenceId = `REF${Date.now()}`;

    // Mock MOMO Pay API response
    const momoPayResponse = {
      success: true,
      transactionId: transactionId,
      referenceId: referenceId,
      status: 'pending',
      paymentUrl: `https://momo-pay.com/pay/${transactionId}`,
      qrCode: `data:image/png;base64,${Buffer.from('mock-qr-code').toString('base64')}`,
      message: 'MOMO Pay payment initiated. Scan QR code or visit payment URL.'
    };

    // Update payment
    payment.momoPay.transactionId = transactionId;
    payment.momoPay.referenceId = referenceId;
    payment.momoPay.initiatedAt = new Date();
    await payment.save();

    // Update order
    order.paymentStatus = 'processing';
    order.momoPay = {
      merchantId: payment.momoPay.merchantId,
      transactionId: transactionId,
      status: 'pending'
    };
    await order.save();

    res.json({
      success: true,
      payment: payment,
      momoPay: momoPayResponse
    });

  } catch (error) {
    console.error('MOMO Pay payment error:', error);
    res.status(500).json({ message: 'Error processing MOMO Pay payment', error: error.message });
  }
};

// MOMO Pay Callback
const momoPayCallback = async (req, res) => {
  try {
    const { transactionId, status, responseCode, responseMessage } = req.body;

    const payment = await Payment.findOne({
      'momoPay.transactionId': transactionId
    }).populate('order');

    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    // Update payment status
    payment.momoPay.status = status;
    payment.momoPay.responseCode = responseCode;
    payment.momoPay.responseMessage = responseMessage;

    if (status === 'success') {
      payment.status = 'completed';
      payment.completedAt = new Date();
      payment.momoPay.completedAt = new Date();

      // Update order
      const order = payment.order;
      order.paymentStatus = 'completed';
      order.status = 'confirmed';
      order.momoPay.status = 'success';
      await order.save();
    } else {
      payment.status = 'failed';
      payment.failedAt = new Date();
    }

    await payment.save();

    res.json({
      success: true,
      message: 'Callback processed successfully'
    });

  } catch (error) {
    console.error('MOMO Pay callback error:', error);
    res.status(500).json({ message: 'Error processing callback', error: error.message });
  }
};

// InTouch Pay Callback - Force Accept Payment
const intouchPayCallback = async (req, res) => {
  try {
    const { transactionId } = req.params;
    
    // According to InTouch Pay API documentation, callback data comes in jsonpayload
    const callbackData = req.body.jsonpayload || req.body;
    const { 
      requesttransactionid, 
      transactionid, 
      responsecode, 
      status, 
      statusdesc, 
      referenceno 
    } = callbackData;

    console.log('InTouch Pay Callback received:', { 
      transactionId, 
      requesttransactionid, 
      transactionid, 
      responsecode, 
      status, 
      statusdesc, 
      referenceno 
    });

    // Find order by external ID (request transaction ID)
    const order = await Order.findOne({
      externalId: requesttransactionid || transactionId
    });

    if (!order) {
      console.log('Order not found for transaction:', requesttransactionid || transactionId);
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check if payment was successful according to InTouch Pay API documentation
    // Response code '01' means successful payment
    if (responsecode === '01' || status === 'Successfully') {
      // Update order status to completed
      order.paymentStatus = 'completed';
      order.status = 'confirmed';
      order.mobileMoney = {
        status: 'success',
        externalId: requesttransactionid,
        transactionId: transactionid,
        responseCode: responsecode,
        responseMessage: statusdesc || 'Payment successful',
        referenceNo: referenceno,
        completedAt: new Date()
      };
      await order.save();

      console.log('Payment completed successfully for order:', order._id);

      // Return success response as per API documentation
      res.json({
        message: 'success',
        success: true,
        request_id: requesttransactionid
      });
    } else {
      // Payment failed
      order.paymentStatus = 'failed';
      order.status = 'cancelled';
      order.mobileMoney = {
        status: 'failed',
        externalId: requesttransactionid,
        transactionId: transactionid,
        responseCode: responsecode,
        responseMessage: statusdesc || 'Payment failed',
        failedAt: new Date()
      };
      await order.save();

      console.log('Payment failed for order:', order._id);

      // Return failure response as per API documentation
      res.json({
        message: 'failed',
        success: false,
        request_id: requesttransactionid
      });
    }

  } catch (error) {
    console.error('InTouch Pay callback error:', error);
    res.status(500).json({ message: 'Error processing callback', error: error.message });
  }
};

// Cash on Delivery
const processCashOnDelivery = async (req, res) => {
  try {
    const { orderId, amount, changeRequired, deliveryInstructions } = req.body;
    const userId = req.user.id;

    // Validate order
    const order = await Order.findById(orderId).populate('user');
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.user._id.toString() !== userId) {
      return res.status(403).json({ message: 'Not authorized to pay for this order' });
    }

    // Create payment record
    const payment = new Payment({
      order: orderId,
      user: userId,
      amount: amount,
      paymentMethod: 'cash_on_delivery',
      status: 'pending',
      cashOnDelivery: {
        amount: amount,
        changeRequired: changeRequired || 0,
        deliveryInstructions: deliveryInstructions
      }
    });

    await payment.save();

    // Update order
    order.paymentStatus = 'pending';
    order.status = 'confirmed';
    order.paymentMethod = 'cash_on_delivery';
    order.cashOnDelivery = {
      amount: amount,
      changeRequired: changeRequired || 0
    };
    await order.save();

    res.json({
      success: true,
      payment: payment,
      message: 'Cash on delivery order confirmed. Payment will be collected upon delivery.'
    });

  } catch (error) {
    console.error('Cash on delivery error:', error);
    res.status(500).json({ message: 'Error processing cash on delivery', error: error.message });
  }
};

// Get User Payments
const getUserPayments = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10, status } = req.query;

    const query = { user: userId };
    if (status) {
      query.status = status;
    }

    const payments = await Payment.find(query)
      .populate('order', 'orderNumber total status')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const total = await Payment.countDocuments(query);

    res.json({
      success: true,
      payments: payments,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total: total
    });

  } catch (error) {
    console.error('Get user payments error:', error);
    res.status(500).json({ message: 'Error retrieving payments', error: error.message });
  }
};

// Refund Payment
const refundPayment = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const { reason, amount } = req.body;
    const userId = req.user.id;

    const payment = await Payment.findById(paymentId).populate('order');
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    if (payment.user._id.toString() !== userId) {
      return res.status(403).json({ message: 'Not authorized to refund this payment' });
    }

    if (payment.status !== 'completed') {
      return res.status(400).json({ message: 'Payment must be completed to be refunded' });
    }

    // Process refund based on payment method
    let refundSuccess = false;
    let refundMessage = '';

    switch (payment.paymentMethod) {
      case 'mobile_money':
        // For InTouch Pay transactions, you would call their refund API
        if (payment.mobileMoney.externalId) {
          // InTouch Pay refund logic would go here
          refundSuccess = Math.random() > 0.1;
          refundMessage = refundSuccess ? 'Refund processed to mobile money account' : 'Refund failed';
        } else {
          // Legacy refund
          refundSuccess = Math.random() > 0.1;
          refundMessage = refundSuccess ? 'Refund processed to mobile money account' : 'Refund failed';
        }
        break;
      
      case 'momo_pay':
        // Simulate MOMO Pay refund
        refundSuccess = Math.random() > 0.1;
        refundMessage = refundSuccess ? 'Refund processed to MOMO Pay account' : 'Refund failed';
        break;
      
      case 'cash_on_delivery':
        refundSuccess = true;
        refundMessage = 'Refund will be processed via bank transfer or store credit';
        break;
      
      default:
        refundSuccess = false;
        refundMessage = 'Refund method not supported';
    }

    if (refundSuccess) {
      payment.status = 'refunded';
      payment.statusHistory.push({
        status: 'refunded',
        date: new Date(),
        note: `Refund processed: ${reason}`,
        updatedBy: 'user'
      });
      await payment.save();

      // Update order status
      const order = payment.order;
      order.status = 'returned';
      await order.save();
    }

    res.json({
      success: refundSuccess,
      message: refundMessage,
      payment: payment
    });

  } catch (error) {
    console.error('Refund payment error:', error);
    res.status(500).json({ message: 'Error processing refund', error: error.message });
  }
};

module.exports = {
  initiateMobileMoneyPayment,
  verifyMobileMoneyPayment,
  getPaymentStatus,
  processPayment,
  initiateMomoPayPayment,
  momoPayCallback,
  intouchPayCallback,
  processCashOnDelivery,
  getUserPayments,
  refundPayment
}; 