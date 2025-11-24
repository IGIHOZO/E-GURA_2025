import axios from 'axios';

const API_URL = '/api/sms';

/**
 * SMS API Service for Frontend
 * Integrates with INTOUCH SMS Gateway via backend
 */

export const smsAPI = {
  /**
   * Send custom SMS
   */
  sendSMS: async (phone, message) => {
    try {
      const response = await axios.post(`${API_URL}/send`, { phone, message });
      console.log('✅ SMS sent:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ SMS send failed:', error);
      throw error;
    }
  },

  /**
   * Send OTP verification SMS
   */
  sendOTP: async (phone) => {
    try {
      console.log('📱 Sending OTP request to:', `${API_URL}/send-otp`);
      console.log('📱 Phone number:', phone);
      
      const response = await axios.post(`${API_URL}/send-otp`, { phone });
      console.log('✅ OTP API Response:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ OTP send failed:', error);
      console.error('❌ Error details:', error.response?.data || error.message);
      
      // Return error details for better debugging
      if (error.response) {
        throw new Error(error.response.data?.message || 'Failed to send OTP');
      } else if (error.request) {
        throw new Error('Cannot connect to server. Please check if backend is running.');
      } else {
        throw new Error(error.message || 'Failed to send OTP');
      }
    }
  },

  /**
   * Send order confirmation SMS
   */
  sendOrderConfirmation: async (phone, orderData) => {
    try {
      const response = await axios.post(`${API_URL}/order-confirmation`, {
        phone,
        orderData
      });
      console.log('✅ Order confirmation SMS sent:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Order confirmation SMS failed:', error);
      // Don't throw - SMS failure shouldn't block order
      return null;
    }
  },

  /**
   * Send order status update SMS
   */
  sendOrderStatus: async (phone, statusData) => {
    try {
      const response = await axios.post(`${API_URL}/order-status`, {
        phone,
        statusData
      });
      console.log('✅ Order status SMS sent:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Order status SMS failed:', error);
      return null;
    }
  },

  /**
   * Send admin alert SMS
   */
  sendAdminAlert: async (phone, alertMessage) => {
    try {
      const response = await axios.post(`${API_URL}/admin-alert`, {
        phone,
        alertMessage
      });
      console.log('✅ Admin alert SMS sent:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Admin alert SMS failed:', error);
      return null;
    }
  },

  /**
   * Send payment reminder SMS
   */
  sendPaymentReminder: async (phone, paymentData) => {
    try {
      const response = await axios.post(`${API_URL}/payment-reminder`, {
        phone,
        paymentData
      });
      console.log('✅ Payment reminder SMS sent:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Payment reminder SMS failed:', error);
      return null;
    }
  },

  /**
   * Send welcome SMS to new customer
   */
  sendWelcomeSMS: async (phone, customerName) => {
    try {
      const response = await axios.post(`${API_URL}/welcome`, {
        phone,
        customerName
      });
      console.log('✅ Welcome SMS sent:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Welcome SMS failed:', error);
      return null;
    }
  },

  /**
   * Send test SMS
   */
  sendTestSMS: async (phone) => {
    try {
      const response = await axios.post(`${API_URL}/test`, { phone });
      console.log('✅ Test SMS sent:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Test SMS failed:', error);
      throw error;
    }
  }
};

export default smsAPI;
