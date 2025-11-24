const axios = require('axios');
require('dotenv').config();

/**
 * INTOUCH SMS Gateway Service
 * Sends SMS messages via INTOUCH API without third-party libraries
 */

class SMSService {
  constructor() {
    this.username = process.env.INTOUCH_USERNAME;
    this.password = process.env.INTOUCH_PASSWORD;
    this.sender = process.env.INTOUCH_SENDER;
    this.apiUrl = process.env.INTOUCH_API_URL || 'https://www.intouchsms.co.rw/api/sendsms/.json';
    
    // Debug logs
    console.log('🔧 SMS Service Initialized');
    console.log(`DEBUG: INTOUCH_USERNAME: ${this.username}`);
    console.log(`DEBUG: INTOUCH_PASSWORD: ${this.password}`);
    console.log(`DEBUG: INTOUCH_SENDER: ${this.sender}`);
    console.log(`DEBUG: INTOUCH_API_URL: ${this.apiUrl}`);
  }

  /**
   * Format phone number to international format
   * @param {string} phone - Phone number
   * @returns {string} Formatted phone number
   */
  formatPhoneNumber(phone) {
    // Remove all non-numeric characters
    let cleaned = phone.replace(/\D/g, '');
    
    // If starts with 0, replace with 250
    if (cleaned.startsWith('0')) {
      cleaned = '250' + cleaned.substring(1);
    }
    
    // If doesn't start with 250, add it
    if (!cleaned.startsWith('250')) {
      cleaned = '250' + cleaned;
    }
    
    console.log(`DEBUG: Phone formatted from ${phone} to ${cleaned}`);
    return cleaned;
  }

  /**
   * Send SMS with retry logic (INTOUCH API with Basic Auth)
   * @param {string} phone - Recipient phone number
   * @param {string} message - SMS message content
   * @param {number} retries - Number of retry attempts (default: 3)
   * @returns {Promise<Object>} Response object
   */
  async sendSMS(phone, message, retries = 3) {
    const formattedPhone = this.formatPhoneNumber(phone);
    
    console.log('\n📱 ========== SMS SEND REQUEST ==========');
    console.log(`DEBUG: Recipient: ${formattedPhone}`);
    console.log(`DEBUG: Message: ${message}`);
    console.log(`DEBUG: Retry attempts remaining: ${retries}`);
    console.log('========================================\n');

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        console.log(`🔄 Attempt ${attempt} of ${retries}...`);
        
        // Prepare request payload according to INTOUCH API docs
        const payload = {
          sender: this.sender,
          recipients: formattedPhone,
          message: message
        };

        console.log('DEBUG: Request Payload:', JSON.stringify(payload, null, 2));
        console.log('DEBUG: Using Basic Auth with username:', this.username);

        // Send SMS via INTOUCH API with Basic Authentication
        const response = await axios.post(this.apiUrl, payload, {
          auth: {
            username: this.username,
            password: this.password
          },
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          timeout: 30000 // 30 seconds timeout
        });

        console.log('DEBUG: API Response Status:', response.status);
        console.log('DEBUG: API Response Data:', JSON.stringify(response.data, null, 2));

        // Check if SMS was sent successfully (status code 200)
        if (response.status === 200 && response.data.success) {
          console.log(`✅ DEBUG: SMS sent successfully to ${formattedPhone}`);
          console.log(`✅ SUCCESS: Message delivered on attempt ${attempt}`);
          console.log(`📊 Balance: ${response.data.summary?.balance} RWF`);
          console.log(`💰 Cost: ${response.data.summary?.cost} RWF`);
          
          return {
            success: true,
            phone: formattedPhone,
            message: message,
            response: response.data,
            messageId: response.data.details?.[0]?.messageid,
            cost: response.data.summary?.cost,
            balance: response.data.summary?.balance,
            attempt: attempt,
            timestamp: new Date().toISOString()
          };
        } else {
          throw new Error(`API returned success: false or unexpected status`);
        }

      } catch (error) {
        console.error(`❌ Attempt ${attempt} failed:`, error.message);
        
        if (error.response) {
          console.error('DEBUG: Error Response Status:', error.response.status);
          console.error('DEBUG: Error Response Data:', JSON.stringify(error.response.data, null, 2));
          
          // Log specific error details
          if (error.response.status === 400) {
            console.error('❌ Bad Request: Check credentials and payload format');
          } else if (error.response.status === 401) {
            console.error('❌ Unauthorized: Check username and password');
          }
        }

        // If this was the last attempt, throw error
        if (attempt === retries) {
          console.error(`❌ FAILED: All ${retries} attempts exhausted`);
          throw {
            success: false,
            phone: formattedPhone,
            message: message,
            error: error.message,
            errorDetails: error.response?.data,
            attempts: retries,
            timestamp: new Date().toISOString()
          };
        }

        // Wait before retry (exponential backoff)
        const waitTime = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
        console.log(`⏳ Waiting ${waitTime / 1000}s before retry...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }

  /**
   * Send OTP verification SMS
   * @param {string} phone - Recipient phone number
   * @param {string} otp - OTP code
   * @returns {Promise<Object>}
   */
  async sendOTP(phone, otp) {
    const message = `Your E-Gura Store verification code is: ${otp}. Valid for 10 minutes. Do not share this code with anyone.`;
    console.log('📧 Sending OTP SMS...');
    return await this.sendSMS(phone, message);
  }

  /**
   * Send order confirmation SMS
   * @param {string} phone - Recipient phone number
   * @param {Object} orderData - Order details
   * @returns {Promise<Object>}
   */
  async sendOrderConfirmation(phone, orderData) {
    const message = `Thank you for your order at E-Gura Store! Order #${orderData.orderNumber} for ${orderData.total.toLocaleString()} RWF has been received. We'll notify you when it ships. Track: egura.rw/order/${orderData.orderNumber}`;
    console.log('📦 Sending Order Confirmation SMS...');
    return await this.sendSMS(phone, message);
  }

  /**
   * Send order status update SMS
   * @param {string} phone - Recipient phone number
   * @param {Object} statusData - Status update details
   * @returns {Promise<Object>}
   */
  async sendOrderStatusUpdate(phone, statusData) {
    const message = `E-Gura Store: Your order #${statusData.orderNumber} status: ${statusData.status}. ${statusData.message || 'Thank you for shopping with us!'}`;
    console.log('📬 Sending Order Status Update SMS...');
    return await this.sendSMS(phone, message);
  }

  /**
   * Send admin alert SMS
   * @param {string} phone - Admin phone number
   * @param {string} alertMessage - Alert message
   * @returns {Promise<Object>}
   */
  async sendAdminAlert(phone, alertMessage) {
    const message = `🔔 E-Gura Store Admin Alert: ${alertMessage}`;
    console.log('🚨 Sending Admin Alert SMS...');
    return await this.sendSMS(phone, message);
  }

  /**
   * Send payment reminder SMS
   * @param {string} phone - Recipient phone number
   * @param {Object} paymentData - Payment details
   * @returns {Promise<Object>}
   */
  async sendPaymentReminder(phone, paymentData) {
    const message = `E-Gura Store: Payment pending for order #${paymentData.orderNumber}. Amount: ${paymentData.amount.toLocaleString()} RWF. Pay to: 0782540683 (Uwase). Ref: ${paymentData.orderNumber}`;
    console.log('💰 Sending Payment Reminder SMS...');
    return await this.sendSMS(phone, message);
  }

  /**
   * Send welcome SMS to new customer
   * @param {string} phone - Customer phone number
   * @param {string} customerName - Customer name
   * @returns {Promise<Object>}
   */
  async sendWelcomeSMS(phone, customerName) {
    const message = `Welcome to E-Gura Store, ${customerName}! 🎉 Enjoy quality products at great prices. Visit egura.rw to start shopping. Use code WELCOME10 for 10% off your first order!`;
    console.log('👋 Sending Welcome SMS...');
    return await this.sendSMS(phone, message);
  }

  /**
   * Send test SMS
   * @param {string} phone - Test phone number
   * @returns {Promise<Object>}
   */
  async sendTestSMS(phone) {
    const message = 'Test message from BLUEHOUSE eCommerce';
    console.log('🧪 Sending Test SMS...');
    return await this.sendSMS(phone, message);
  }
}

// Create singleton instance
const smsService = new SMSService();

module.exports = smsService;
