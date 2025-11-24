/**
 * MTN Mobile Money Payment Service
 * Integration with MTN MoMo API for Rwanda
 */

const axios = require('axios');
const crypto = require('crypto');

class MTNPaymentService {
  constructor() {
    this.apiUrl = process.env.MTN_API_URL || 'https://sandbox.momodeveloper.mtn.com';
    this.subscriptionKey = process.env.MTN_SUBSCRIPTION_KEY;
    this.apiUser = process.env.MTN_API_USER;
    this.apiKey = process.env.MTN_API_KEY;
    this.callbackUrl = process.env.MTN_CALLBACK_URL || 'http://localhost:5000/api/payments/callback';
    this.environment = process.env.MTN_ENVIRONMENT || 'sandbox';
  }

  /**
   * Generate access token
   */
  async getAccessToken() {
    try {
      const auth = Buffer.from(`${this.apiUser}:${this.apiKey}`).toString('base64');
      
      const response = await axios.post(
        `${this.apiUrl}/collection/token/`,
        {},
        {
          headers: {
            'Authorization': `Basic ${auth}`,
            'Ocp-Apim-Subscription-Key': this.subscriptionKey
          }
        }
      );

      console.log('✅ MTN Access token generated');
      return response.data.access_token;
    } catch (error) {
      console.error('❌ MTN token error:', error.response?.data || error.message);
      throw new Error('Failed to get MTN access token');
    }
  }

  /**
   * Initiate payment request
   */
  async requestPayment(phoneNumber, amount, orderId, customerName) {
    try {
      const accessToken = await this.getAccessToken();
      const referenceId = this.generateReferenceId();

      // Format phone number for Rwanda (250...)
      const formattedPhone = this.formatPhoneNumber(phoneNumber);

      const payload = {
        amount: amount.toString(),
        currency: 'RWF',
        externalId: orderId,
        payer: {
          partyIdType: 'MSISDN',
          partyId: formattedPhone
        },
        payerMessage: `Payment for order ${orderId}`,
        payeeNote: `E-Gura Store - Order ${orderId}`
      };

      console.log('📱 Initiating MTN payment:', {
        phone: formattedPhone,
        amount: amount,
        orderId: orderId
      });

      const response = await axios.post(
        `${this.apiUrl}/collection/v1_0/requesttopay`,
        payload,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'X-Reference-Id': referenceId,
            'X-Target-Environment': this.environment,
            'Ocp-Apim-Subscription-Key': this.subscriptionKey,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('✅ MTN payment initiated:', referenceId);

      return {
        success: true,
        referenceId: referenceId,
        message: 'Payment request sent. Please check your phone to complete payment.',
        status: 'PENDING'
      };
    } catch (error) {
      console.error('❌ MTN payment error:', error.response?.data || error.message);
      
      return {
        success: false,
        message: error.response?.data?.message || 'Payment initiation failed',
        error: error.message
      };
    }
  }

  /**
   * Check payment status
   */
  async checkPaymentStatus(referenceId) {
    try {
      const accessToken = await this.getAccessToken();

      const response = await axios.get(
        `${this.apiUrl}/collection/v1_0/requesttopay/${referenceId}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'X-Target-Environment': this.environment,
            'Ocp-Apim-Subscription-Key': this.subscriptionKey
          }
        }
      );

      const status = response.data.status;
      console.log('📊 Payment status:', referenceId, '->', status);

      return {
        success: true,
        status: status,
        data: response.data,
        isPaid: status === 'SUCCESSFUL'
      };
    } catch (error) {
      console.error('❌ Status check error:', error.response?.data || error.message);
      
      return {
        success: false,
        status: 'UNKNOWN',
        error: error.message
      };
    }
  }

  /**
   * Get account balance
   */
  async getBalance() {
    try {
      const accessToken = await this.getAccessToken();

      const response = await axios.get(
        `${this.apiUrl}/collection/v1_0/account/balance`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'X-Target-Environment': this.environment,
            'Ocp-Apim-Subscription-Key': this.subscriptionKey
          }
        }
      );

      return {
        success: true,
        balance: response.data.availableBalance,
        currency: response.data.currency
      };
    } catch (error) {
      console.error('❌ Balance check error:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Format phone number for Rwanda
   */
  formatPhoneNumber(phone) {
    // Remove spaces, dashes, and special characters
    let cleaned = phone.replace(/[\s\-\(\)]/g, '');
    
    // Remove leading zeros
    cleaned = cleaned.replace(/^0+/, '');
    
    // Add country code if not present
    if (!cleaned.startsWith('250')) {
      cleaned = '250' + cleaned;
    }

    return cleaned;
  }

  /**
   * Generate unique reference ID
   */
  generateReferenceId() {
    return crypto.randomUUID();
  }

  /**
   * Verify webhook signature (for production)
   */
  verifyWebhookSignature(payload, signature) {
    const hash = crypto
      .createHmac('sha256', this.apiKey)
      .update(JSON.stringify(payload))
      .digest('hex');
    
    return hash === signature;
  }
}

// Create singleton instance
const mtnPayment = new MTNPaymentService();

module.exports = mtnPayment;
