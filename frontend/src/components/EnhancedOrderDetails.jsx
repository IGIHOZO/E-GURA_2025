import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PLACEHOLDER_IMAGES, handleImageError } from '../utils/placeholderImage';
import {
  XMarkIcon,
  MapPinIcon,
  PhoneIcon,
  EnvelopeIcon,
  UserIcon,
  CreditCardIcon,
  TruckIcon,
  CalendarIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ShieldCheckIcon,
  SparklesIcon,
  ChartBarIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

const EnhancedOrderDetails = ({ order, onClose }) => {
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    if (order) {
      performAIAnalysis();
    }
  }, [order]);

  const performAIAnalysis = () => {
    setAnalyzing(true);
    
    // Simulate AI analysis
    setTimeout(() => {
      const analysis = {
        fraudScore: calculateFraudScore(order),
        customerValue: calculateCustomerValue(order),
        deliveryPrediction: predictDeliveryTime(order),
        recommendations: generateRecommendations(order),
        riskLevel: calculateRiskLevel(order)
      };
      
      setAiAnalysis(analysis);
      setAnalyzing(false);
    }, 1500);
  };

  const calculateFraudScore = (order) => {
    let score = 100;
    
    // Check for suspicious patterns
    if (!order.shippingAddress?.email) score -= 15;
    if (order.total > 500000) score -= 10;
    if (!order.shippingAddress?.city) score -= 10;
    if (order.items?.length > 10) score -= 5;
    
    return Math.max(0, Math.min(100, score));
  };

  const calculateCustomerValue = (order) => {
    const total = order.total || order.subtotal || 0;
    
    if (total > 200000) return 'High Value';
    if (total > 100000) return 'Medium Value';
    return 'Standard';
  };

  const predictDeliveryTime = (order) => {
    const city = order.shippingAddress?.city?.toLowerCase() || '';
    
    if (city.includes('kigali')) return '1-2 days';
    if (city.includes('huye') || city.includes('musanze')) return '2-3 days';
    return '3-5 days';
  };

  const calculateRiskLevel = (order) => {
    const fraudScore = calculateFraudScore(order);
    
    if (fraudScore >= 80) return { level: 'Low', color: 'green' };
    if (fraudScore >= 60) return { level: 'Medium', color: 'yellow' };
    return { level: 'High', color: 'red' };
  };

  const generateRecommendations = (order) => {
    const recommendations = [];
    
    if (!order.shippingAddress?.email) {
      recommendations.push({
        type: 'warning',
        message: 'No email provided - Consider requesting email for order updates'
      });
    }
    
    if (order.total > 200000) {
      recommendations.push({
        type: 'info',
        message: 'High-value order - Consider priority shipping and insurance'
      });
    }
    
    if (order.items?.length > 5) {
      recommendations.push({
        type: 'info',
        message: 'Bulk order - Offer loyalty discount for next purchase'
      });
    }
    
    const city = order.shippingAddress?.city?.toLowerCase() || '';
    if (!city.includes('kigali')) {
      recommendations.push({
        type: 'info',
        message: 'Out of Kigali delivery - Confirm delivery address and timeline'
      });
    }
    
    return recommendations;
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      processing: 'bg-blue-100 text-blue-800 border-blue-300',
      paid: 'bg-green-100 text-green-800 border-green-300',
      shipped: 'bg-purple-100 text-purple-800 border-purple-300',
      delivered: 'bg-green-100 text-green-800 border-green-300',
      cancelled: 'bg-red-100 text-red-800 border-red-300'
    };
    return colors[status?.toLowerCase()] || colors.pending;
  };

  if (!order) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[95vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-6 rounded-t-2xl z-10">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-3xl font-bold mb-2">Order Details</h2>
              <p className="text-purple-100">#{order.orderNumber || order.id || order._id}</p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition-colors"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
          
          {/* Status Badge */}
          <div className="mt-4 flex items-center gap-4">
            <span className={`px-4 py-2 rounded-full text-sm font-semibold border-2 ${getStatusColor(order.status)}`}>
              {order.status?.toUpperCase() || 'PENDING'}
            </span>
            <span className="text-purple-100 text-sm">
              <CalendarIcon className="h-4 w-4 inline mr-1" />
              {new Date(order.createdAt).toLocaleString('en-US', {
                dateStyle: 'medium',
                timeStyle: 'short'
              })}
            </span>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* AI Analysis Section */}
          {aiAnalysis && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-6 border-2 border-purple-200"
            >
              <div className="flex items-center gap-2 mb-4">
                <SparklesIcon className="h-6 w-6 text-purple-600" />
                <h3 className="text-xl font-bold text-gray-900">AI Analysis</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                {/* Fraud Score */}
                <div className="bg-white rounded-lg p-4 border border-purple-200">
                  <div className="flex items-center gap-2 mb-2">
                    <ShieldCheckIcon className="h-5 w-5 text-purple-600" />
                    <p className="text-sm font-medium text-gray-600">Fraud Score</p>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{aiAnalysis.fraudScore}%</p>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div
                      className={`h-2 rounded-full ${
                        aiAnalysis.fraudScore >= 80 ? 'bg-green-500' :
                        aiAnalysis.fraudScore >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${aiAnalysis.fraudScore}%` }}
                    ></div>
                  </div>
                </div>

                {/* Customer Value */}
                <div className="bg-white rounded-lg p-4 border border-purple-200">
                  <div className="flex items-center gap-2 mb-2">
                    <ChartBarIcon className="h-5 w-5 text-indigo-600" />
                    <p className="text-sm font-medium text-gray-600">Customer Value</p>
                  </div>
                  <p className="text-lg font-bold text-gray-900">{aiAnalysis.customerValue}</p>
                </div>

                {/* Delivery Prediction */}
                <div className="bg-white rounded-lg p-4 border border-purple-200">
                  <div className="flex items-center gap-2 mb-2">
                    <TruckIcon className="h-5 w-5 text-blue-600" />
                    <p className="text-sm font-medium text-gray-600">Est. Delivery</p>
                  </div>
                  <p className="text-lg font-bold text-gray-900">{aiAnalysis.deliveryPrediction}</p>
                </div>

                {/* Risk Level */}
                <div className="bg-white rounded-lg p-4 border border-purple-200">
                  <div className="flex items-center gap-2 mb-2">
                    <ExclamationTriangleIcon className="h-5 w-5 text-orange-600" />
                    <p className="text-sm font-medium text-gray-600">Risk Level</p>
                  </div>
                  <p className={`text-lg font-bold text-${aiAnalysis.riskLevel.color}-600`}>
                    {aiAnalysis.riskLevel.level}
                  </p>
                </div>
              </div>

              {/* AI Recommendations */}
              {aiAnalysis.recommendations.length > 0 && (
                <div className="space-y-2">
                  <p className="font-semibold text-gray-900 mb-2">AI Recommendations:</p>
                  {aiAnalysis.recommendations.map((rec, index) => (
                    <div
                      key={index}
                      className={`flex items-start gap-2 p-3 rounded-lg ${
                        rec.type === 'warning' ? 'bg-yellow-50 border border-yellow-200' :
                        'bg-blue-50 border border-blue-200'
                      }`}
                    >
                      {rec.type === 'warning' ? (
                        <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                      ) : (
                        <CheckCircleIcon className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      )}
                      <p className="text-sm text-gray-700">{rec.message}</p>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Order Information */}
            <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <CreditCardIcon className="h-5 w-5 text-purple-600" />
                Order Information
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Order Number:</span>
                  <span className="font-semibold text-gray-900">{order.orderNumber || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Payment Method:</span>
                  <span className="font-semibold text-gray-900">{order.paymentMethod || 'Mobile Money'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Payment Status:</span>
                  <span className={`font-semibold ${order.status === 'paid' ? 'text-green-600' : 'text-yellow-600'}`}>
                    {order.status === 'paid' ? 'Paid' : 'Pending'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-semibold text-gray-900">
                    {(order.subtotal || 0).toLocaleString()} RWF
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Shipping:</span>
                  <span className="font-semibold text-gray-900">
                    {(order.shippingCost || 0).toLocaleString()} RWF
                  </span>
                </div>
                <div className="flex justify-between pt-3 border-t-2 border-gray-300">
                  <span className="text-gray-900 font-bold text-lg">Total:</span>
                  <span className="font-bold text-purple-600 text-xl">
                    {(order.total || order.subtotal || 0).toLocaleString()} RWF
                  </span>
                </div>
              </div>
            </div>

            {/* Shipping Address */}
            <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <MapPinIcon className="h-5 w-5 text-purple-600" />
                Shipping Address
              </h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <UserIcon className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600">Full Name</p>
                    <p className="font-semibold text-gray-900">
                      {order.shippingAddress?.firstName || order.customerInfo?.firstName} {order.shippingAddress?.lastName || order.customerInfo?.lastName}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <PhoneIcon className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600">Phone Number</p>
                    <p className="font-semibold text-gray-900">
                      {order.shippingAddress?.phone || order.shippingAddress?.phoneNumber || order.customerInfo?.phone}
                    </p>
                  </div>
                </div>
                {(order.shippingAddress?.email || order.customerInfo?.email) && (
                  <div className="flex items-start gap-3">
                    <EnvelopeIcon className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-600">Email</p>
                      <p className="font-semibold text-gray-900">
                        {order.shippingAddress?.email || order.customerInfo?.email}
                      </p>
                    </div>
                  </div>
                )}
                <div className="flex items-start gap-3">
                  <MapPinIcon className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600">Delivery Address</p>
                    <p className="font-semibold text-gray-900">
                      {order.shippingAddress?.address || order.shippingAddress?.street || order.customerInfo?.address}
                    </p>
                    <p className="text-gray-700">
                      {order.shippingAddress?.city || order.customerInfo?.city}, Rwanda
                    </p>
                    {order.shippingAddress?.postalCode && (
                      <p className="text-gray-600 text-sm">Postal Code: {order.shippingAddress.postalCode}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Order Items */}
          <div className="bg-white rounded-xl border-2 border-gray-200 overflow-hidden">
            <div className="bg-gray-50 p-4 border-b border-gray-200">
              <h3 className="text-lg font-bold text-gray-900">
                Order Items ({order.items?.length || 0})
              </h3>
            </div>
            <div className="divide-y divide-gray-200">
              {order.items?.map((item, index) => (
                <div key={index} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex gap-4">
                    {/* Product Image */}
                    <div className="flex-shrink-0">
                      <img
                        src={item.product?.mainImage || item.mainImage || item.image || item.productId?.mainImage || PLACEHOLDER_IMAGES.medium}
                        alt={item.product?.name || item.name || 'Product'}
                        className="w-24 h-24 object-cover rounded-lg border-2 border-gray-200 bg-gray-100"
                        onError={(e) => handleImageError(e, 'medium')}
                      />
                    </div>

                    {/* Product Details */}
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-900 text-lg mb-2">
                        {item.name || item.product?.name}
                      </h4>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                        {/* Size */}
                        {item.size && (
                          <div className="bg-purple-50 rounded-lg px-3 py-2 border border-purple-200">
                            <p className="text-xs text-purple-600 font-medium">Size</p>
                            <p className="font-bold text-purple-900">{item.size}</p>
                          </div>
                        )}
                        
                        {/* Color */}
                        {item.color && (
                          <div className="bg-blue-50 rounded-lg px-3 py-2 border border-blue-200">
                            <p className="text-xs text-blue-600 font-medium">Color</p>
                            <p className="font-bold text-blue-900">{item.color}</p>
                          </div>
                        )}
                        
                        {/* Quantity */}
                        <div className="bg-green-50 rounded-lg px-3 py-2 border border-green-200">
                          <p className="text-xs text-green-600 font-medium">Quantity</p>
                          <p className="font-bold text-green-900">×{item.quantity}</p>
                        </div>
                        
                        {/* Price */}
                        <div className="bg-gray-50 rounded-lg px-3 py-2 border border-gray-200">
                          <p className="text-xs text-gray-600 font-medium">Unit Price</p>
                          <p className="font-bold text-gray-900">{(item.price || 0).toLocaleString()} RWF</p>
                        </div>
                      </div>

                      {/* Subtotal */}
                      <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                        <span className="text-gray-600">Item Subtotal:</span>
                        <span className="font-bold text-lg text-purple-600">
                          {((item.price || 0) * (item.quantity || 1)).toLocaleString()} RWF
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Order Timeline (if available) */}
          {order.timeline && order.timeline.length > 0 && (
            <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <ClockIcon className="h-5 w-5 text-purple-600" />
                Order Timeline
              </h3>
              <div className="space-y-3">
                {order.timeline.map((event, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-2 h-2 bg-purple-600 rounded-full mt-2"></div>
                    <div>
                      <p className="font-semibold text-gray-900">{event.status}</p>
                      <p className="text-sm text-gray-600">{new Date(event.timestamp).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="sticky bottom-0 bg-gray-50 p-6 border-t border-gray-200 rounded-b-2xl">
          <div className="flex gap-3 justify-end">
            <button
              onClick={onClose}
              className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
            >
              Close
            </button>
            <button
              onClick={() => window.print()}
              className="px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors"
            >
              Print Order
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default EnhancedOrderDetails;
