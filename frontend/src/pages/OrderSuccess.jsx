import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  CheckCircleIcon,
  ShoppingBagIcon,
  HomeIcon,
  UserIcon,
  TruckIcon
} from '@heroicons/react/24/outline';
import axios from 'axios';

const OrderSuccess = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [trackingId, setTrackingId] = useState(null);

  // Get device ID for tracking
  const getDeviceId = () => {
    let deviceId = localStorage.getItem('deviceId');
    if (!deviceId) {
      deviceId = `device-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('deviceId', deviceId);
    }
    return deviceId;
  };

  // Track purchase events for ordered products
  const trackPurchases = (orderData) => {
    if (!orderData || !orderData.items) return;
    
    const deviceId = getDeviceId();
    orderData.items.forEach(item => {
      axios.post('/api/intelligent-search/track', {
        userId: deviceId,
        eventType: 'purchase',
        productId: item.product?.id || item.product?._id || item.id || item._id,
        product: {
          name: item.product?.name || item.name,
          category: item.product?.category || item.category,
          brand: item.product?.brand || item.brand,
          price: item.price
        }
      }).then(() => {
        console.log(`✅ Purchase tracked for device:`, deviceId, item.product?.name || item.name);
      }).catch(err => console.error('❌ Track purchase error:', err));
    });
  };

  // Create tracking for the order (only if not already created)
  const createTracking = async (orderData) => {
    if (!orderData) return;

    // Check if tracking ID already exists
    if (orderData.trackingId) {
      console.log('✅ Using existing tracking ID:', orderData.trackingId);
      setTrackingId(orderData.trackingId);
      return;
    }

    try {
      console.log('📦 Creating new tracking for order:', orderData.id);
      const response = await axios.post('/api/tracking/create', {
        orderId: orderData.id || orderData._id || `ORDER_${Date.now()}`,
        userId: getDeviceId(),
        email: orderData.shippingAddress?.email || orderData.customerInfo?.email || 'customer@egura.com',
        phone: orderData.shippingAddress?.phone || orderData.customerInfo?.phone || '',
        shippingAddress: {
          city: orderData.shippingAddress?.city || orderData.customerInfo?.city || 'Kigali',
          address: orderData.shippingAddress?.address || orderData.customerInfo?.address || ''
        }
      });

      if (response.data.success) {
        setTrackingId(response.data.tracking.trackingId);
        console.log('✅ Tracking created:', response.data.tracking.trackingId);
      }
    } catch (error) {
      console.error('❌ Failed to create tracking:', error);
    }
  };

  useEffect(() => {
    try {
      console.log('OrderSuccess component mounted');
      console.log('Location state:', location.state);
      
      // Check if tracking ID is directly provided in location state
      if (location.state?.trackingId) {
        console.log('✅ Tracking ID from state:', location.state.trackingId);
        setTrackingId(location.state.trackingId);
      }
      
      // Try to get order from state first
      if (location.state?.orderData) {
        console.log('Order from state:', location.state.orderData);
        setOrder(location.state.orderData);
        trackPurchases(location.state.orderData); // Track purchases
        createTracking(location.state.orderData); // Create order tracking if not exists
        setLoading(false);
        return;
      }
      
      // Try to get order from localStorage
      const orders = JSON.parse(localStorage.getItem('orders') || '[]');
      const adminOrders = JSON.parse(localStorage.getItem('adminOrders') || '[]');
      const allOrders = [...orders, ...adminOrders];
      
      if (location.state?.orderId) {
        const foundOrder = allOrders.find(o => 
          (o.id || o._id) === location.state.orderId
        );
        if (foundOrder) {
          console.log('Found order from localStorage:', foundOrder);
          setOrder(foundOrder);
          trackPurchases(foundOrder); // Track purchases
          createTracking(foundOrder); // Create order tracking
          setLoading(false);
          return;
        }
      }
      
      // If no specific order found, get the latest order
      if (allOrders.length > 0) {
        const latestOrder = allOrders.sort((a, b) => 
          new Date(b.createdAt) - new Date(a.createdAt)
        )[0];
        console.log('Using latest order:', latestOrder);
        setOrder(latestOrder);
        trackPurchases(latestOrder); // Track purchases
        createTracking(latestOrder); // Create order tracking
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error in OrderSuccess useEffect:', error);
      setLoading(false);
    }
  }, [location.state]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ShoppingBagIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Order Confirmed!</h2>
          <p className="text-gray-600 mb-6">Your order has been successfully placed.</p>
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-800 text-sm">
              Order details are being processed. You will receive a confirmation shortly.
            </p>
          </div>
          <button
            onClick={() => navigate('/shop')}
            className="bg-orange-500 text-white px-6 py-3 rounded-lg hover:bg-orange-600 transition-colors"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  // Calculate total amount
  const totalAmount = order.total || order.subtotal || 
    (order.items && order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0)) || 0;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Success Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircleIcon className="h-12 w-12 text-green-600" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Order Confirmed!</h1>
          <p className="text-lg text-gray-600">Thank you for your purchase. Your order has been successfully placed.</p>
          
          {location.state?.customerName && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center">
                <UserIcon className="h-5 w-5 text-blue-600 mr-2" />
                <div>
                  <p className="text-blue-800 font-medium">Welcome, {location.state.customerName}!</p>
                  <p className="text-blue-700 text-sm">Your customer account has been created automatically.</p>
                </div>
              </div>
            </div>
          )}
        </motion.div>

        {/* Order Details */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-lg shadow-sm p-6 mb-8"
        >
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Order Details</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Order Information</h3>
              <div className="space-y-2">
                <div>
                  <span className="text-sm text-gray-500">Order ID:</span>
                  <span className="ml-2 text-sm font-medium text-gray-900">
                    #{order.id || order._id || 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Order Number:</span>
                  <span className="ml-2 text-sm font-medium text-gray-900">
                    {order.orderNumber || 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Date:</span>
                  <span className="ml-2 text-sm font-medium text-gray-900">
                    {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Status:</span>
                  <span className="ml-2 text-sm font-medium text-green-600">
                    {order.status || 'Pending'}
                  </span>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Customer Information</h3>
              <div className="space-y-2">
                <div>
                  <span className="text-sm text-gray-500">Name:</span>
                  <span className="ml-2 text-sm font-medium text-gray-900">
                    {order.shippingAddress?.firstName} {order.shippingAddress?.lastName} {order.customerInfo?.firstName} {order.customerInfo?.lastName}
                  </span>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Phone:</span>
                  <span className="ml-2 text-sm font-medium text-gray-900">
                    {order.shippingAddress?.phone || order.customerInfo?.phone || 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Address:</span>
                  <span className="ml-2 text-sm font-medium text-gray-900">
                    {order.shippingAddress?.address || order.customerInfo?.address || 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Order Items */}
        {order.items && order.items.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-lg shadow-sm p-6 mb-8"
          >
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Order Items</h2>
            <div className="space-y-4">
              {order.items.map((item, index) => (
                <div key={index} className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg">
                  <img
                    src={item.image || item.mainImage || '/placeholder-product.jpg'}
                    alt={item.name}
                    className="w-16 h-16 object-cover rounded-lg"
                    onError={(e) => {
                      e.target.src = '/placeholder-product.jpg';
                    }}
                  />
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{item.name || 'Product'}</h3>
                    <p className="text-sm text-gray-600">
                      Size: {item.size || 'N/A'} | Color: {item.color || 'N/A'}
                    </p>
                    <p className="text-sm text-gray-600">Quantity: {item.quantity || 1}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">
                      RWF {((item.price || 0) * (item.quantity || 1)).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Total Amount */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-lg shadow-sm p-6 mb-8"
        >
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">Total Amount</h2>
            <span className="text-2xl font-bold text-gray-900">
              RWF {totalAmount.toLocaleString()}
            </span>
          </div>
        </motion.div>

        {/* Tracking Info */}
        {trackingId && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            className="bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-lg p-6 mb-8"
          >
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <TruckIcon className="h-8 w-8 text-orange-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-2">Order Tracking Available!</h3>
                <p className="text-sm text-gray-600 mb-3">
                  Your order tracking has been created. Track your package in real-time.
                </p>
                <div className="bg-white rounded-lg p-3 mb-3">
                  <p className="text-xs text-gray-500 mb-1">Tracking Number</p>
                  <p className="font-mono font-bold text-orange-600">{trackingId}</p>
                </div>
                <button
                  onClick={() => navigate(`/track/${trackingId}`)}
                  className="w-full sm:w-auto bg-orange-600 text-white px-6 py-2 rounded-lg hover:bg-orange-700 transition-colors text-sm font-semibold"
                >
                  Track Your Order →
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <button
            onClick={() => navigate('/shop')}
            className="flex items-center justify-center px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
          >
            <HomeIcon className="h-5 w-5 mr-2" />
            Continue Shopping
          </button>
          
          <button
            onClick={() => navigate('/orders')}
            className="flex items-center justify-center px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            <ShoppingBagIcon className="h-5 w-5 mr-2" />
            View Orders
          </button>
        </motion.div>
      </div>
    </div>
  );
};

export default OrderSuccess; 