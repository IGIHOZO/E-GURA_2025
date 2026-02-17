const express = require('express');
const router = express.Router();
const smsService = require('../services/smsService');

/**
 * @route   POST /api/sms/send
 * @desc    Send SMS to a phone number
 * @access  Private (Admin only)
 */
router.post('/send', async (req, res) => {
  try {
    const { phone, message } = req.body;

    if (!phone || !message) {
      return res.status(400).json({
        success: false,
        message: 'Phone number and message are required'
      });
    }

    const result = await smsService.sendSMS(phone, message);
    
    res.json({
      success: true,
      message: 'SMS sent successfully',
      data: result
    });
  } catch (error) {
    console.error('Error sending SMS:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send SMS',
      error: error.message || error
    });
  }
});

/**
 * @route   POST /api/sms/send-otp
 * @desc    Send OTP verification SMS
 * @access  Public
 */
router.post('/send-otp', async (req, res) => {
  try {
    const { phone } = req.body;

    console.log('📱 OTP Request received for phone:', phone);

    if (!phone) {
      return res.status(400).json({
        success: false,
        message: 'Phone number is required'
      });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    console.log('🔐 Generated OTP:', otp);
    
    try {
      const result = await smsService.sendOTP(phone, otp);
      console.log('✅ OTP sent successfully:', result);
      
      // Store OTP in session or database (for verification)
      // For now, we'll return it in response (in production, don't do this!)
      
      res.json({
        success: true,
        message: 'OTP sent successfully',
        data: {
          ...result,
          otp: otp // Remove this in production!
        }
      });
    } catch (smsError) {
      console.error('❌ SMS Service Error:', smsError);
      
      // Even if SMS fails, return success with OTP for testing
      res.json({
        success: true,
        message: 'OTP generated (SMS may have failed - check console)',
        data: {
          phone: phone,
          otp: otp,
          smsError: smsError.message || 'SMS delivery failed'
        }
      });
    }
  } catch (error) {
    console.error('❌ Error in OTP route:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send OTP',
      error: error.message || error
    });
  }
});

/**
 * @route   POST /api/sms/order-confirmation
 * @desc    Send order confirmation SMS
 * @access  Private
 */
router.post('/order-confirmation', async (req, res) => {
  try {
    const { phone, orderData } = req.body;

    if (!phone || !orderData) {
      return res.status(400).json({
        success: false,
        message: 'Phone number and order data are required'
      });
    }

    try {
      const result = await smsService.sendOrderConfirmation(phone, orderData);
      
      res.json({
        success: true,
        message: 'Order confirmation SMS sent successfully',
        data: result
      });
    } catch (smsError) {
      console.error('⚠️ SMS delivery failed (non-blocking):', smsError.message);
      // Return success anyway since SMS is non-critical
      res.json({
        success: true,
        message: 'Order confirmed (SMS delivery pending)',
        warning: 'SMS notification may be delayed',
        data: { phone, attempted: true, error: smsError.message }
      });
    }
  } catch (error) {
    console.error('Error in order confirmation endpoint:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process request',
      error: error.message || error
    });
  }
});

/**
 * @route   POST /api/sms/order-status
 * @desc    Send order status update SMS
 * @access  Private
 */
router.post('/order-status', async (req, res) => {
  try {
    const { phone, statusData } = req.body;

    if (!phone || !statusData) {
      return res.status(400).json({
        success: false,
        message: 'Phone number and status data are required'
      });
    }

    const result = await smsService.sendOrderStatusUpdate(phone, statusData);
    
    res.json({
      success: true,
      message: 'Order status SMS sent successfully',
      data: result
    });
  } catch (error) {
    console.error('Error sending order status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send order status',
      error: error.message || error
    });
  }
});

/**
 * @route   POST /api/sms/admin-alert
 * @desc    Send admin alert SMS
 * @access  Private (Admin only)
 */
router.post('/admin-alert', async (req, res) => {
  try {
    const { phone, alertMessage } = req.body;

    if (!phone || !alertMessage) {
      return res.status(400).json({
        success: false,
        message: 'Phone number and alert message are required'
      });
    }

    try {
      const result = await smsService.sendAdminAlert(phone, alertMessage);
      
      res.json({
        success: true,
        message: 'Admin alert SMS sent successfully',
        data: result
      });
    } catch (smsError) {
      console.error('⚠️ Admin alert SMS failed (non-blocking):', smsError.message);
      // Return success anyway since SMS is non-critical
      res.json({
        success: true,
        message: 'Alert logged (SMS delivery pending)',
        warning: 'SMS notification may be delayed',
        data: { phone, attempted: true, error: smsError.message }
      });
    }
  } catch (error) {
    console.error('Error in admin alert endpoint:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process request',
      error: error.message || error
    });
  }
});

/**
 * @route   POST /api/sms/payment-reminder
 * @desc    Send payment reminder SMS
 * @access  Private
 */
router.post('/payment-reminder', async (req, res) => {
  try {
    const { phone, paymentData } = req.body;

    if (!phone || !paymentData) {
      return res.status(400).json({
        success: false,
        message: 'Phone number and payment data are required'
      });
    }

    const result = await smsService.sendPaymentReminder(phone, paymentData);
    
    res.json({
      success: true,
      message: 'Payment reminder SMS sent successfully',
      data: result
    });
  } catch (error) {
    console.error('Error sending payment reminder:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send payment reminder',
      error: error.message || error
    });
  }
});

/**
 * @route   POST /api/sms/welcome
 * @desc    Send welcome SMS to new customer
 * @access  Private
 */
router.post('/welcome', async (req, res) => {
  try {
    const { phone, customerName } = req.body;

    if (!phone || !customerName) {
      return res.status(400).json({
        success: false,
        message: 'Phone number and customer name are required'
      });
    }

    try {
      const result = await smsService.sendWelcomeSMS(phone, customerName);
      
      res.json({
        success: true,
        message: 'Welcome SMS sent successfully',
        data: result
      });
    } catch (smsError) {
      console.error('⚠️ Welcome SMS failed (non-blocking):', smsError.message);
      // Return success anyway since SMS is non-critical
      res.json({
        success: true,
        message: 'Customer registered (SMS delivery pending)',
        warning: 'Welcome SMS may be delayed',
        data: { phone, customerName, attempted: true, error: smsError.message }
      });
    }
  } catch (error) {
    console.error('Error in welcome SMS endpoint:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process request',
      error: error.message || error
    });
  }
});

/**
 * @route   POST /api/sms/test
 * @desc    Send test SMS
 * @access  Public (for testing)
 */
router.post('/test', async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({
        success: false,
        message: 'Phone number is required'
      });
    }

    const result = await smsService.sendTestSMS(phone);
    
    res.json({
      success: true,
      message: 'Test SMS sent successfully',
      data: result
    });
  } catch (error) {
    console.error('Error sending test SMS:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send test SMS',
      error: error.message || error
    });
  }
});

module.exports = router;
