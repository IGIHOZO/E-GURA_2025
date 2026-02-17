import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  ShoppingBagIcon,
  TruckIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  PhoneIcon,
  UserIcon
} from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoginModal from '../components/LoginModal';
import SEOHead from '../components/SEOHead';

const Orders = () => {
  const { user, isAuthenticated } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showLoginModal, setShowLoginModal] = useState(false);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = () => {
    try {
      if (!isAuthenticated) {
        setOrders([]);
        setLoading(false);
        return;
      }

      // Load from both storage locations to ensure we get all orders
      const savedOrders = JSON.parse(localStorage.getItem('orders') || '[]');
      const adminOrders = JSON.parse(localStorage.getItem('adminOrders') || '[]');
      
      // Combine and deduplicate orders
      const allOrders = [...savedOrders, ...adminOrders];
      const uniqueOrders = allOrders.filter((order, index, self) => 
        index === self.findIndex(o => o._id === order._id)
      );
      
      // Filter orders for the current user
      const userOrders = uniqueOrders.filter(order => {
        const orderPhone = order.shippingAddress?.phone || order.phone;
        return orderPhone === user?.phoneNumber;
      });
      
      const sortedOrders = userOrders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setOrders(sortedOrders);
      
      console.log('Loaded orders for customer:', sortedOrders);
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'paid':
      case 'completed':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'pending':
      case 'processing':
        return <ClockIcon className="h-5 w-5 text-yellow-500" />;
      case 'shipped':
        return <TruckIcon className="h-5 w-5 text-blue-500" />;
      case 'failed':
      case 'cancelled':
        return <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />;
      default:
        return <ClockIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'paid':
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
      case 'processing':
        return 'bg-yellow-100 text-yellow-800';
      case 'shipped':
        return 'bg-blue-100 text-blue-800';
      case 'failed':
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your orders...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <UserIcon className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Login Required</h2>
            <p className="text-gray-600 mb-6">
              Please login to view your orders. Use the phone number and password from when you added items to cart.
            </p>
            <button
              onClick={() => setShowLoginModal(true)}
              className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl"
            >
              Login Now
            </button>
          </div>
        </div>
        
        <LoginModal 
          isOpen={showLoginModal} 
          onClose={() => setShowLoginModal(false)} 
        />
      </div>
    );
  }

  return (
    <>
      <SEOHead 
        title="My Orders - E-Gura Store"
        description="View your order history and track your purchases with E-Gura Store"
        keywords="orders, purchase history, order tracking, E-Gura Store"
        pageType="orders"
      />
      
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">My Orders</h1>
            <p className="text-gray-600">Track your orders and view purchase history</p>
          </div>

          {/* Contact Information */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <PhoneIcon className="h-5 w-5 text-blue-600 mr-3" />
              <div>
                <p className="text-blue-800 font-medium">Need help with your order?</p>
                <p className="text-blue-700 text-sm">
                  Call <strong>0782540683</strong> for any inquiries
                </p>
              </div>
            </div>
          </div>

          {orders.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-lg shadow-sm p-8 text-center"
            >
              <ShoppingBagIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">No orders yet</h2>
              <p className="text-gray-600 mb-6">
                You haven't placed any orders yet. Start shopping to see your orders here.
              </p>
              <Link
                to="/shop"
                className="bg-orange-500 text-white py-2 px-6 rounded-lg hover:bg-orange-600 transition-colors"
              >
                Start Shopping
              </Link>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Orders List */}
              <div className="lg:col-span-2">
                <div className="space-y-4">
                                     {orders.map((order, index) => (
                     <motion.div
                       key={order.id || order._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => setSelectedOrder(order)}
                    >
                      <div className="flex items-center justify-between mb-4">
                                                 <div>
                           <h3 className="font-semibold text-gray-900">Order #{order.id || order._id}</h3>
                          <p className="text-sm text-gray-600">{formatDate(order.createdAt)}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(order.status)}
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                            {order.status || 'Pending'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="text-sm text-gray-600">
                            <span className="font-medium">{order.items?.length || 0} items</span>
                          </div>
                          <div className="text-sm text-gray-600">
                            Total: <span className="font-semibold">RWF {(order.total || order.subtotal || 0).toLocaleString()}</span>
                          </div>
                        </div>
                        <button className="flex items-center text-orange-600 hover:text-orange-700">
                          <EyeIcon className="h-4 w-4 mr-1" />
                          View Details
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Order Details Sidebar */}
              <div className="lg:col-span-1">
                {selectedOrder ? (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-white rounded-lg shadow-sm p-6 sticky top-8"
                  >
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Details</h3>
                    
                    <div className="space-y-4">
                                             <div>
                         <p className="text-sm text-gray-600">Order ID</p>
                         <p className="font-medium">#{selectedOrder.id || selectedOrder._id}</p>
                       </div>
                      
                      <div>
                        <p className="text-sm text-gray-600">Order Date</p>
                        <p className="font-medium">{formatDate(selectedOrder.createdAt)}</p>
                      </div>
                      
                      <div>
                        <p className="text-sm text-gray-600">Status</p>
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(selectedOrder.status)}
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedOrder.status)}`}>
                            {selectedOrder.status || 'Pending'}
                          </span>
                        </div>
                      </div>
                      
                      <div>
                        <p className="text-sm text-gray-600">Payment Method</p>
                        <p className="font-medium">MTN Mobile Money</p>
                      </div>
                      
                      <div>
                        <p className="text-sm text-gray-600">Total Amount</p>
                        <p className="font-bold text-lg">RWF {(selectedOrder.total || selectedOrder.subtotal || 0).toLocaleString()}</p>
                      </div>
                    </div>

                    <div className="mt-6 pt-6 border-t">
                      <h4 className="font-semibold text-gray-900 mb-3">Order Items</h4>
                      <div className="space-y-3">
                        {selectedOrder.items?.map((item, index) => (
                          <div key={index} className="flex items-center space-x-3">
                            <img
                              src={item.mainImage || item.image}
                              alt={item.name}
                              className="w-12 h-12 object-cover rounded-lg"
                            />
                            <div className="flex-1">
                              <p className="font-medium text-gray-900">{item.name}</p>
                              <p className="text-sm text-gray-600">
                                Size: {item.selectedSize || 'M'} | Qty: {item.quantity}
                              </p>
                            </div>
                            <span className="font-medium">RWF {(item.price * item.quantity).toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {selectedOrder.customerInfo && (
                      <div className="mt-6 pt-6 border-t">
                        <h4 className="font-semibold text-gray-900 mb-3">Shipping Address</h4>
                        <div className="text-sm text-gray-600">
                          <p>{selectedOrder.customerInfo.firstName} {selectedOrder.customerInfo.lastName}</p>
                          <p>{selectedOrder.customerInfo.email}</p>
                          <p>{selectedOrder.customerInfo.phone}</p>
                          {selectedOrder.shippingInfo && (
                            <>
                              <p>{selectedOrder.shippingInfo.address}</p>
                              <p>{selectedOrder.shippingInfo.city}, {selectedOrder.shippingInfo.country}</p>
                            </>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="mt-6 pt-6 border-t">
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <p className="text-blue-800 font-medium mb-2">📞 Need Help?</p>
                        <p className="text-blue-700 text-sm">
                          Call <strong>0782540683</strong> for any inquiries about this order
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <div className="bg-white rounded-lg shadow-sm p-6 text-center">
                    <ShoppingBagIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">Select an order to view details</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Login Modal */}
      <LoginModal 
        isOpen={showLoginModal} 
        onClose={() => setShowLoginModal(false)} 
      />
    </>
  );
};

export default Orders; 