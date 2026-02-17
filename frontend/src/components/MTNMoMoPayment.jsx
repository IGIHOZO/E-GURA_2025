import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  CreditCardIcon,
  PhoneIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ShieldCheckIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline';

const MTNMoMoPayment = ({ 
  orderTotal, 
  onPaymentSubmit, 
  isLoading = false,
  paymentStatus = null,
  orderId = null,
  cart = [],
  shippingInfo = {}
}) => {
  const [phone, setPhone] = useState('');
  const [isValidPhone, setIsValidPhone] = useState(true);
  const [paymentResponse, setPaymentResponse] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderCreated, setOrderCreated] = useState(false);
  const [currentOrderId, setCurrentOrderId] = useState(null);

  // Production API Configuration
  const API_CONFIG = {
    baseUrl: '/zion', // Express API base URL
    provider: 'mtn-momo', // MTN Mobile Money
    currency: 'EUR'
  };

  // Test API connection
  const testConnection = async () => {
    try {
      console.log('Testing API connection...');
      const response = await fetch(`${API_CONFIG.baseUrl}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('API connection successful:', result);
        return true;
      } else {
        console.error('API connection failed:', response.status);
        return false;
      }
    } catch (error) {
      console.error('API connection error:', error);
      return false;
    }
  };

  const validatePhone = (phoneNumber) => {
    // Accept any phone number format
    console.log('Accepting phone number:', phoneNumber);
    return phoneNumber && phoneNumber.trim().length > 0;
  };

  const handlePhoneChange = (e) => {
    const value = e.target.value;
    setPhone(value);
    setIsValidPhone(validatePhone(value));
  };

  // Generate unique transaction ID
  const generateTransactionId = () => {
    const currentTime = Date.now();
    const max = 9999999999999;
    const min = 1000000000000;
    const range = Math.abs(Math.random() * (max - min) + min);
    const value = currentTime + range;
    return String(Math.floor(value));
  };

  // Create order using the new Express API
  const createOrder = async () => {
    try {
      // Prepare order data for the new API
      const orderData = {
        cart: cart || [],
        total: orderTotal,
        shippingInfo: shippingInfo || {}
      };

      console.log('Sending order data:', orderData);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      const response = await fetch(`${API_CONFIG.baseUrl}/order/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(orderData),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Order creation failed:', response.status, errorText);
        throw new Error(`Order creation failed: ${response.status} - ${errorText}`);
      }

      const orderResult = await response.json();
      console.log('Order created:', orderResult);
      
      if (!orderResult.success) {
        throw new Error(orderResult.error || 'Order creation failed');
      }
      
      setCurrentOrderId(orderResult.order.id);
      setOrderCreated(true);
      return orderResult.order;
    } catch (error) {
      console.error('Order creation error:', error);
      if (error.name === 'AbortError') {
        throw new Error('Request timeout - please check your connection and try again');
      }
      if (error.message.includes('Failed to fetch')) {
        throw new Error('Network error - please check if the server is running and try again');
      }
      throw error;
    }
  };

  // Process payment using the new Express API
  const processPayment = async (orderId) => {
    try {
      console.log('Processing payment for order:', orderId, 'with phone:', phone);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      const response = await fetch(`${API_CONFIG.baseUrl}/order/pay/${orderId}?phone=${encodeURIComponent(phone)}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Payment failed:', response.status, errorText);
        throw new Error(`Payment failed: ${response.status} - ${errorText}`);
      }

      const paymentResult = await response.json();
      console.log('Payment result:', paymentResult);
      
      if (!paymentResult.success) {
        throw new Error(paymentResult.error || 'Payment processing failed');
      }
      
      return paymentResult;
    } catch (error) {
      console.error('Payment error:', error);
      if (error.name === 'AbortError') {
        throw new Error('Payment request timeout - please try again');
      }
      if (error.message.includes('Failed to fetch')) {
        throw new Error('Network error during payment - please check your connection');
      }
      throw error;
    }
  };

  // Check order status
  const checkOrderStatus = async (orderId) => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

      const response = await fetch(`${API_CONFIG.baseUrl}/order/status/${orderId}`, {
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`Status check failed: ${response.status}`);
      }

      const statusResult = await response.json();
      console.log('Order status:', statusResult);
      
      if (!statusResult.success) {
        throw new Error(statusResult.error || 'Status check failed');
      }
      
      return statusResult;
    } catch (error) {
      console.error('Status check error:', error);
      if (error.name === 'AbortError') {
        throw new Error('Status check timeout');
      }
      if (error.message.includes('Failed to fetch')) {
        throw new Error('Network error during status check');
      }
      throw error;
    }
  };

  // Main payment handler
  const handlePayment = async () => {
    if (!validatePhone(phone)) {
      alert('Please enter a valid phone number');
      return;
    }

    try {
      setIsProcessing(true);
      setPaymentResponse(null);

      // Step 0: Test API connection
      console.log('Testing API connection...');
      const connectionOk = await testConnection();
      if (!connectionOk) {
        throw new Error('Cannot connect to payment server. Please check your internet connection and try again.');
      }

      // Step 1: Create order
      console.log('Creating order...');
      const order = await createOrder();
      
      // Step 2: Process payment
      console.log('Processing payment...');
      const paymentResult = await processPayment(order.id);
      
      // Step 3: Handle payment response
      if (paymentResult.status === 'pending') {
        setPaymentResponse({
          success: true,
          status: 'pending',
          message: paymentResult.message || 'Payment request sent successfully. Please check your phone for confirmation.',
          transactionId: paymentResult.result?.requesttransactionid || generateTransactionId(),
          orderId: order.id
        });

        // Start polling for status updates
        startStatusPolling(order.id);
      } else {
        throw new Error(paymentResult.error || 'Payment processing failed');
      }

    } catch (error) {
      console.error('Payment processing error:', error);
      setPaymentResponse({
        success: false,
        status: 'failed',
        message: error.message || 'Payment processing failed. Please try again.',
        error: error.toString()
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Poll for order status updates
  const startStatusPolling = (orderId) => {
    const pollInterval = setInterval(async () => {
      try {
        const statusResult = await checkOrderStatus(orderId);
        
        if (statusResult.order.status === 'Paid' || statusResult.order.status === 'Completed') {
          clearInterval(pollInterval);
          
          setPaymentResponse({
            success: true,
            status: 'completed',
            message: 'Payment completed successfully!',
            transactionId: statusResult.order.requesttransactionid || generateTransactionId(),
            orderId: orderId
          });

          // Call the success callback
          if (onPaymentSubmit) {
            await onPaymentSubmit({
              paymentType: 'mtn-momo',
              phone: phone,
              amount: orderTotal,
              transactionId: statusResult.order.requesttransactionid || generateTransactionId(),
              externalId: statusResult.order.transactionid,
              orderId: orderId,
              status: 'completed',
              response: statusResult
            });
          }
        } else if (statusResult.order.status === 'Failed') {
          clearInterval(pollInterval);
          
          setPaymentResponse({
            success: false,
            status: 'failed',
            message: 'Payment failed. Please try again.',
            transactionId: statusResult.order.requesttransactionid || generateTransactionId(),
            orderId: orderId
          });
        } else if (statusResult.order.status === 'Pending') {
          // Continue polling
          setPaymentResponse({
            success: true,
            status: 'pending',
            message: 'Payment is still being processed. Please check your phone for confirmation.',
            transactionId: statusResult.order.requesttransactionid || generateTransactionId(),
            orderId: orderId
          });
        }
      } catch (error) {
        console.error('Status polling error:', error);
        // Continue polling on error
      }
    }, 5000); // Poll every 5 seconds

    // Stop polling after 5 minutes (300 seconds)
    setTimeout(() => {
      clearInterval(pollInterval);
      setPaymentResponse(prev => {
        if (prev && prev.status === 'pending') {
          return {
            ...prev,
            status: 'timeout',
            message: 'Payment timeout. Please check your phone or try again.'
          };
        }
        return prev;
      });
    }, 300000);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      {/* Payment Header */}
      <div className="text-center mb-6">
        <div className="flex justify-center mb-4">
          <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center">
            <img 
              src="/mtn-momo-logo.svg" 
              alt="MTN Mobile Money" 
              className="w-12 h-12 object-contain"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
            <div className="w-12 h-12 bg-yellow-500 rounded-full flex items-center justify-center text-white font-bold text-lg" style={{display: 'none'}}>
              M
            </div>
          </div>
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-2">MTN Mobile Money</h3>
        <p className="text-gray-600">Pay securely with our production payment gateway</p>
      </div>

      {/* Payment Status */}
      {paymentStatus && (
        <div className={`mb-6 p-4 rounded-lg ${
          paymentStatus === 'success' 
            ? 'bg-green-50 border border-green-200' 
            : paymentStatus === 'failed' 
            ? 'bg-red-50 border border-red-200' 
            : 'bg-yellow-50 border border-yellow-200'
        }`}>
          <div className="flex items-center">
            {paymentStatus === 'success' ? (
              <CheckCircleIcon className="h-6 w-6 text-green-500 mr-3" />
            ) : paymentStatus === 'failed' ? (
              <ExclamationTriangleIcon className="h-6 w-6 text-red-500 mr-3" />
            ) : (
              <div className="h-6 w-6 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin mr-3" />
            )}
            <div>
              <p className={`font-medium ${
                paymentStatus === 'success' 
                  ? 'text-green-800' 
                  : paymentStatus === 'failed' 
                  ? 'text-red-800' 
                  : 'text-yellow-800'
              }`}>
                {paymentStatus === 'success' 
                  ? 'Payment Successful!' 
                  : paymentStatus === 'failed' 
                  ? 'Payment Failed' 
                  : 'Processing Payment...'
                }
              </p>
              <p className={`text-sm ${
                paymentStatus === 'success' 
                  ? 'text-green-600' 
                  : paymentStatus === 'failed' 
                  ? 'text-red-600' 
                  : 'text-yellow-600'
              }`}>
                {paymentStatus === 'success' 
                  ? 'Your order has been confirmed and payment received.' 
                  : paymentStatus === 'failed' 
                  ? 'Please try again or contact support if the problem persists.' 
                  : 'Please wait while we process your payment...'
                }
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Payment Response */}
      {paymentResponse && (
        <div className={`mb-6 p-4 rounded-lg ${
          paymentResponse.success && paymentResponse.status === 'pending'
            ? 'bg-blue-50 border border-blue-200' 
            : paymentResponse.success && paymentResponse.status === 'completed'
            ? 'bg-green-50 border border-green-200'
            : 'bg-red-50 border border-red-200'
        }`}>
          <div className="flex items-center">
            {paymentResponse.success && paymentResponse.status === 'pending' ? (
              <div className="h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mr-3" />
            ) : paymentResponse.success && paymentResponse.status === 'completed' ? (
              <CheckCircleIcon className="h-6 w-6 text-green-500 mr-3" />
            ) : (
              <ExclamationTriangleIcon className="h-6 w-6 text-red-500 mr-3" />
            )}
            <div>
              <p className={`font-medium ${
                paymentResponse.success && paymentResponse.status === 'pending'
                  ? 'text-blue-800'
                  : paymentResponse.success && paymentResponse.status === 'completed'
                  ? 'text-green-800'
                  : 'text-red-800'
              }`}>
                {paymentResponse.success && paymentResponse.status === 'pending'
                  ? 'Payment Pending!'
                  : paymentResponse.success && paymentResponse.status === 'completed'
                  ? 'Payment Completed!'
                  : 'Payment Error'
                }
              </p>
              <p className={`text-sm ${
                paymentResponse.success && paymentResponse.status === 'pending'
                  ? 'text-blue-600'
                  : paymentResponse.success && paymentResponse.status === 'completed'
                  ? 'text-green-600'
                  : 'text-red-600'
              }`}>
                {paymentResponse.message}
              </p>
              {paymentResponse.transactionId && (
                <p className="text-xs text-gray-600 mt-1">
                  Transaction ID: {paymentResponse.transactionId}
                </p>
              )}
              {paymentResponse.orderId && (
                <p className="text-xs text-gray-600 mt-1">
                  Order ID: {paymentResponse.orderId}
                </p>
              )}
              {paymentResponse.success && paymentResponse.status === 'pending' && (
                <p className="text-xs text-blue-600 mt-1">
                  ⏳ Checking payment status automatically...
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Payment Form */}
      <div className="space-y-6">
        {/* Phone Number Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Mobile Money Phone Number
          </label>
          <div className="relative">
            <PhoneIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="tel"
              value={phone}
              onChange={handlePhoneChange}
              className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors ${
                !isValidPhone ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
              placeholder="Enter your phone number"
            />
          </div>
          <p className="mt-1 text-sm text-gray-500">
            Enter your MTN Mobile Money phone number
          </p>
        </div>

        {/* Order Summary */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-semibold text-gray-900 mb-3">Order Summary</h4>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Subtotal:</span>
              <span className="font-medium">RWF {orderTotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Shipping:</span>
              <span className="font-medium text-green-600">FREE</span>
            </div>
            <div className="border-t pt-2 flex justify-between">
              <span className="font-semibold text-gray-900">Total:</span>
              <span className="font-bold text-lg text-gray-900">RWF {orderTotal.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Payment Button */}
        <div className="space-y-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handlePayment}
            disabled={isLoading || isProcessing || !isValidPhone}
            className="w-full py-4 px-6 rounded-lg font-semibold text-white transition-colors bg-yellow-500 hover:bg-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading || isProcessing ? (
              <div className="flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Processing Payment...
              </div>
            ) : (
              <div className="flex items-center justify-center">
                <CurrencyDollarIcon className="h-5 w-5 mr-2" />
                Pay RWF {orderTotal.toLocaleString()} with MTN MoMo
              </div>
            )}
          </motion.button>
        </div>

        {/* Security Notice */}
        <div className="text-center">
          <div className="flex items-center justify-center space-x-2 text-xs text-gray-500">
            <ShieldCheckIcon className="h-4 w-4" />
            <span>Your payment is secured by production-grade encryption</span>
          </div>
        </div>

        {/* API Information */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-blue-900 mb-2">Payment Gateway Info</h4>
          <div className="text-xs text-blue-700 space-y-1">
            <p>• Production-ready Express API</p>
            <p>• SHA-256 encrypted authentication</p>
            <p>• Real-time transaction processing</p>
            <p>• Automatic status polling</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MTNMoMoPayment; 