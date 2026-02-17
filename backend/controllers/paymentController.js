const { Order, User } = require('../models');
const crypto = require('crypto');
const axios = require('axios');

// InTouch Pay API Configuration
const API_CONFIG = {
  username: process.env.INTOUCH_PAY_USERNAME || 'egura.ltd',
  password: 'G(,p0KHp3Ej!+$T_]Z3G0UMlhzdjoSS1kfakZ/sc',
  apiUrl: process.env.INTOUCH_PAY_API_URL || 'https://www.intouchpay.co.rw/api/requestpayment/',
  merchantId: process.env.INTOUCH_PAY_MERCHANT_ID || '250220000148'
};

console.log('🔐 InTouch Pay Config:', {
  username: API_CONFIG.username,
  merchantId: API_CONFIG.merchantId,
  apiUrl: API_CONFIG.apiUrl,
  hasPassword: !!API_CONFIG.password
});

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

// Format timestamp as yyyymmddhhmmss (UTC)
const formatTimestamp = () => {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');
  const day = String(now.getUTCDate()).padStart(2, '0');
  const hours = String(now.getUTCHours()).padStart(2, '0');
  const minutes = String(now.getUTCMinutes()).padStart(2, '0');
  const seconds = String(now.getUTCSeconds()).padStart(2, '0');
  return `${year}${month}${day}${hours}${minutes}${seconds}`;
};

// Create MOMO Payment (based on InTouch Pay API documentation)
const createMomoPayment = async (order, phone) => {
  try {
    // Validate phone number format
    const cleanPhone = phone.replace(/\D/g, ''); // Remove non-digits
    
    // Must be 12 digits and start with 25078 (MTN Rwanda)
    if (cleanPhone.length !== 12) {
      throw new Error('Phone number must be 12 digits (e.g., 250788123456)');
    }
    
    if (!cleanPhone.startsWith('25078')) {
      throw new Error('Please enter a correct MTN number starting with 25078');
    }
    
    const timestamp = formatTimestamp();
    const username = API_CONFIG.username;
    const accountno = API_CONFIG.merchantId;
    const partnerpassword = API_CONFIG.password;
    
    // Generate password: username + accountno + partnerpassword + timestamp
    const pwd = username + accountno + partnerpassword + timestamp;
    const hashedPassword = hashPassword(pwd);
    const requestTransactionId = generateTransactionId();
    
    console.log('🔐 Password Generation:', {
      formula: 'username + accountno + partnerpassword + timestamp',
      username,
      accountno,
      timestamp,
      phone: cleanPhone,
      passwordHash: hashedPassword.substring(0, 20) + '...'
    });

    // Update order with external ID and set status to pending
    order.externalId = requestTransactionId;
    order.paymentStatus = 'pending';
    order.status = 'pending';
    await order.save();

    // Prepare payment request according to InTouch Pay API documentation
    const paymentRequest = {
      username: username,
      timestamp: timestamp,
      amount: order.total.toString(),
      password: hashedPassword,
      mobilephone: cleanPhone,
      requesttransactionid: requestTransactionId,
      accountno: accountno,
      callbackurl: `${process.env.BASE_URL || 'https://egura.rw'}/api/payments/callback/${requestTransactionId}`
    };

    console.log('📤 InTouch Pay Request:', {
      username: paymentRequest.username,
      timestamp: paymentRequest.timestamp,
      amount: paymentRequest.amount,
      mobilephoneno: paymentRequest.mobilephoneno,
      requesttransactionid: paymentRequest.requesttransactionid,
      accountno: paymentRequest.accountno,
      callbackurl: paymentRequest.callbackurl,
      passwordHash: paymentRequest.password.substring(0, 10) + '...'
    });

    // Make API call to InTouch Pay
    const response = await axios.post(API_CONFIG.apiUrl, paymentRequest, {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 30000
    });
    
    console.log('✅ InTouch Pay Response:', response.data);

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
      console.error('❌ InTouch Pay unexpected response:', response.data);
      throw new Error(`Payment initialization failed: ${response.data.message || 'Unknown error'}`);
    }

  } catch (error) {
    console.error('❌ InTouch Pay API Error:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    });
    throw new Error(error.response?.data?.message || error.message || 'Payment processing failed');
  }
};

// Process Payment (based on Java pay method)
const processPayment = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { type, phone, orderData } = req.body;
    const userId = req.user?.id;

    console.log('💳 Processing payment:', { orderId, type, phone: phone?.substring(0, 6) + '***' });

    let order;
    
    if (orderId && orderId !== 'new') {
      // Existing order flow (PostgreSQL/Sequelize)
      order = await Order.findByPk(orderId);
      if (!order) {
        return res.status(404).json({ message: 'Order not found' });
      }
      if (userId && order.userId && order.userId !== userId) {
        return res.status(403).json({ message: 'Not authorized to pay for this order' });
      }
    } else {
      return res.status(400).json({ message: 'Order ID is required' });
    }

    // Handle different payment types
    if (type === 'momo') {
      if (!phone) {
        return res.status(400).json({ message: 'Phone number is required for Mobile Money payment' });
      }

      try {
        console.log('🚀 Initiating InTouch Pay for order:', orderId);
        const momoResponse = await createMomoPayment(order, phone);
        
        console.log('✅ Payment initiated successfully');
        
        res.json({
          success: true,
          data: momoResponse.data,
          transactionId: momoResponse.transactionId,
          message: momoResponse.message || 'Payment request sent. Please check your phone for confirmation.',
          status: 'pending',
          responseCode: momoResponse.data.responsecode || '1000'
        });
      } catch (error) {
        console.error('❌ Payment initiation error:', error.message);
        res.status(500).json({ 
          success: false,
          message: 'Mobile Money payment initiation failed', 
          error: error.message 
        });
      }
    } else {
      res.status(400).json({ 
        success: false,
        message: 'Invalid payment type. Use "momo" for Mobile Money.' 
      });
    }

  } catch (error) {
    console.error('❌ Process payment error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error processing payment', 
      error: error.message 
    });
  }
};

// InTouch Pay Callback
const intouchPayCallback = async (req, res) => {
  try {
    const { transactionId } = req.params;
    const callbackData = req.body.jsonpayload || req.body;
    
    console.log('📥 InTouch Pay Callback received:', { 
      transactionId, 
      callbackData 
    });

    const { 
      requesttransactionid, 
      transactionid, 
      responsecode, 
      status, 
      statusdesc, 
      referenceno 
    } = callbackData;

    // Find order by external ID
    const order = await Order.findOne({
      where: { externalId: requesttransactionid || transactionId }
    });

    if (!order) {
      console.log('❌ Order not found for transaction:', requesttransactionid || transactionId);
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check if payment was successful (response code '01' = success)
    if (responsecode === '01' || status === 'Successfully' || status === 'Successful') {
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

      console.log('✅ Payment completed for order:', order.id);

      res.json({
        message: 'success',
        success: true,
        request_id: requesttransactionid
      });
    } else {
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

      console.log('❌ Payment failed for order:', order.id);

      res.json({
        message: 'failed',
        success: false,
        request_id: requesttransactionid
      });
    }

  } catch (error) {
    console.error('❌ InTouch Pay callback error:', error);
    res.status(500).json({ 
      message: 'Error processing callback', 
      error: error.message 
    });
  }
};

// Stub functions for routes compatibility
const initiateMobileMoneyPayment = async (req, res) => {
  return processPayment(req, res);
};

const verifyMobileMoneyPayment = async (req, res) => {
  res.json({ success: false, message: 'Use InTouch Pay callback instead' });
};

const getPaymentStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await Order.findByPk(orderId);
    
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    
    res.json({ success: true, order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const initiateMomoPayPayment = async (req, res) => {
  return processPayment(req, res);
};

const momoPayCallback = async (req, res) => {
  return intouchPayCallback(req, res);
};

const processCashOnDelivery = async (req, res) => {
  res.json({ success: true, message: 'Cash on delivery - payment on arrival' });
};

const getUserPayments = async (req, res) => {
  res.json({ success: true, payments: [] });
};

const refundPayment = async (req, res) => {
  res.json({ success: false, message: 'Refunds not implemented' });
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
