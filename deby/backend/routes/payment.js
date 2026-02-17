const express = require('express');
const router = express.Router();
const {
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
} = require('../controllers/paymentController');
const { protect } = require('../middleware/authMiddleware');
const mtnPayment = require('../services/mtnPayment');

// Mobile Money Payment Routes
router.post('/mobile-money/initiate', protect, initiateMobileMoneyPayment);
router.get('/mobile-money/verify/:transactionId', protect, verifyMobileMoneyPayment);

// Order Payment Routes (based on Java implementation)
router.get('/orders/status/:orderId', protect, getPaymentStatus);
router.post('/orders/pay/:orderId', processPayment);

// MOMO Pay Payment Routes
router.post('/momo-pay/initiate', protect, initiateMomoPayPayment);
router.post('/momo-pay/callback', momoPayCallback); // No auth required for callback

// InTouch Pay Callback Route
router.post('/callback/:transactionId', intouchPayCallback); // No auth required for callback

// Cash on Delivery Routes
router.post('/cash-on-delivery', protect, processCashOnDelivery);

// Payment Management Routes
router.get('/status/:paymentId', protect, getPaymentStatus);
router.get('/user-payments', protect, getUserPayments);
router.post('/refund/:paymentId', protect, refundPayment);

// MTN Mobile Money Routes
router.post('/mtn/initiate', async (req, res) => {
  try {
    const { phoneNumber, amount, orderId, customerName } = req.body;
    
    const result = await mtnPayment.requestPayment(phoneNumber, amount, orderId, customerName);
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/mtn/status/:referenceId', async (req, res) => {
  try {
    const { referenceId } = req.params;
    
    const result = await mtnPayment.checkPaymentStatus(referenceId);
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/mtn/callback', async (req, res) => {
  try {
    console.log('📥 MTN Callback received:', req.body);
    
    // Process callback and update order status
    const { referenceId, status } = req.body;
    
    if (status === 'SUCCESSFUL') {
      // Update order status to paid
      // Send confirmation SMS
      console.log('✅ Payment successful:', referenceId);
    }
    
    res.status(200).send('OK');
  } catch (error) {
    console.error('❌ Callback error:', error);
    res.status(500).send('Error');
  }
});

module.exports = router; 