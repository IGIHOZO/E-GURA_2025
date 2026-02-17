import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import {
  UserIcon,
  ShoppingBagIcon,
  HeartIcon,
  MapPinIcon,
  TruckIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  SparklesIcon,
  ArrowRightOnRectangleIcon,
  Cog6ToothIcon,
  BellIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../context/AuthContext';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';

const MyAccount = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const { wishlist, removeFromWishlist, loadWishlist } = useWishlist();
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [orders, setOrders] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalOrders: 0,
    activeDeliveries: 0,
    completedOrders: 0,
    pendingOrders: 0
  });

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/checkout');
      return;
    }
    loadAccountData();
  }, [isAuthenticated]);

  // Reload wishlist when switching to wishlist tab
  useEffect(() => {
    if (activeTab === 'wishlist') {
      loadWishlist();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const loadAccountData = async () => {
    try {
      setLoading(true);
      
      // Fetch orders and stats from database
      await loadOrdersFromDatabase();
      await loadCustomerStats();

      // Reload wishlist from localStorage
      loadWishlist();

      // Load recommendations
      await loadRecommendations();
    } catch (error) {
      console.error('Error loading account data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCustomerStats = async () => {
    try {
      console.log('📊 Fetching customer stats from database');
      
      const response = await axios.post('/api/orders/customer-stats', {
        phone: user?.phone || user?.phoneNumber,
        email: user?.email
      });

      if (response.data.success) {
        console.log('✅ Stats loaded:', response.data.stats);
        setStats(response.data.stats);
      }
    } catch (error) {
      console.error('❌ Error loading customer stats:', error);
    }
  };

  const loadOrdersFromDatabase = async () => {
    try {
      console.log('📦 Fetching orders from database for user:', user);
      
      const response = await axios.post('/api/orders/customer-orders', {
        phone: user?.phone || user?.phoneNumber,
        email: user?.email
      });

      if (response.data.success) {
        console.log('✅ Orders loaded from database:', response.data.orders.length);
        setOrders(response.data.orders);
      } else {
        console.log('⚠️ No orders found in database');
        setOrders([]);
      }
    } catch (error) {
      console.error('❌ Error loading orders from database:', error);
      // Fallback to localStorage if database fetch fails
      const storedOrders = JSON.parse(localStorage.getItem('orders') || '[]');
      const userOrders = storedOrders.filter(order => 
        order.customerInfo?.phoneNumber === user?.phone || 
        order.shippingInfo?.phoneNumber === user?.phone
      );
      setOrders(userOrders);
    }
  };

  const loadRecommendations = async () => {
    try {
      const response = await axios.get('/api/products');
      if (response.data && Array.isArray(response.data)) {
        // Get random 6 products as recommendations
        const shuffled = response.data.sort(() => 0.5 - Math.random());
        setRecommendations(shuffled.slice(0, 6));
      }
    } catch (error) {
      console.error('Error loading recommendations:', error);
    }
  };

  const getOrderStatus = (status) => {
    const statusMap = {
      pending: { icon: ClockIcon, color: 'text-yellow-600', bg: 'bg-yellow-50', text: 'Processing' },
      confirmed: { icon: CheckCircleIcon, color: 'text-blue-600', bg: 'bg-blue-50', text: 'Confirmed' },
      shipped: { icon: TruckIcon, color: 'text-purple-600', bg: 'bg-purple-50', text: 'Shipped' },
      delivered: { icon: CheckCircleIcon, color: 'text-green-600', bg: 'bg-green-50', text: 'Delivered' },
      cancelled: { icon: XCircleIcon, color: 'text-red-600', bg: 'bg-red-50', text: 'Cancelled' }
    };
    return statusMap[status] || statusMap.pending;
  };

  const tabs = [
    { id: 'overview', name: 'Overview', icon: UserIcon },
    { id: 'orders', name: 'My Orders', icon: ShoppingBagIcon },
    { id: 'wishlist', name: 'Wishlist', icon: HeartIcon },
    { id: 'recommendations', name: 'For You', icon: SparklesIcon },
    { id: 'addresses', name: 'Addresses', icon: MapPinIcon },
    { id: 'settings', name: 'Settings', icon: Cog6ToothIcon }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your account...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center text-white text-3xl font-bold">
                {user?.firstName?.[0] || 'U'}
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Welcome back, {user?.firstName}!
                </h1>
                <p className="text-gray-600 mt-1">{user?.email || user?.phone}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  loadAccountData();
                  loadWishlist();
                }}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                title="Refresh account data"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
              </button>
              <button
                onClick={logout}
                className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <ArrowRightOnRectangleIcon className="w-5 h-5" />
                Logout
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-xl mb-8 overflow-hidden">
          <div className="flex overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-4 font-semibold transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                {tab.name}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-6"
            >
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-900">Total Orders</h3>
                  <ShoppingBagIcon className="w-8 h-8 text-purple-600" />
                </div>
                <p className="text-4xl font-bold text-purple-600">{stats.totalOrders}</p>
                <p className="text-sm text-gray-600 mt-2">All time purchases</p>
              </div>

              <div className="bg-white rounded-2xl shadow-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-900">Wishlist Items</h3>
                  <HeartIcon className="w-8 h-8 text-pink-600" />
                </div>
                <p className="text-4xl font-bold text-pink-600">{wishlist.length}</p>
                <p className="text-sm text-gray-600 mt-2">Saved for later</p>
              </div>

              <div className="bg-white rounded-2xl shadow-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-900">Active Deliveries</h3>
                  <TruckIcon className="w-8 h-8 text-green-600" />
                </div>
                <p className="text-4xl font-bold text-green-600">
                  {stats.activeDeliveries}
                </p>
                <p className="text-sm text-gray-600 mt-2">On the way</p>
              </div>
            </motion.div>
          )}

          {/* Orders Tab */}
          {activeTab === 'orders' && (
            <motion.div
              key="orders"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white rounded-2xl shadow-xl p-8"
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-6">My Orders</h2>
              {orders.length > 0 ? (
                <div className="space-y-4">
                  {orders.map((order, index) => {
                    const statusInfo = getOrderStatus(order.status);
                    return (
                      <div
                        key={index}
                        className="border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow"
                      >
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <p className="font-bold text-gray-900">Order #{order.orderNumber}</p>
                            <p className="text-sm text-gray-600">
                              {new Date(order.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${statusInfo.bg}`}>
                            <statusInfo.icon className={`w-5 h-5 ${statusInfo.color}`} />
                            <span className={`font-semibold ${statusInfo.color}`}>
                              {statusInfo.text}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-gray-600">{order.items?.length || 0} items</p>
                            <p className="text-xl font-bold text-purple-600">
                              {order.total?.toLocaleString()} RWF
                            </p>
                          </div>
                          <Link
                            to={`/track/${order.orderNumber || order.id}`}
                            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                          >
                            Track Order
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <ShoppingBagIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-4">No orders yet</p>
                  <Link
                    to="/shop"
                    className="inline-block px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    Start Shopping
                  </Link>
                </div>
              )}
            </motion.div>
          )}

          {/* Wishlist Tab */}
          {activeTab === 'wishlist' && (
            <motion.div
              key="wishlist"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white rounded-2xl shadow-xl p-8"
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-6">My Wishlist</h2>
              {wishlist.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {wishlist.map((item, index) => (
                    <div key={index} className="border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-shadow">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-48 object-cover"
                      />
                      <div className="p-4">
                        <h3 className="font-bold text-gray-900 mb-2 line-clamp-2">{item.name}</h3>
                        <p className="text-xl font-bold text-purple-600 mb-4">
                          {item.price?.toLocaleString()} RWF
                        </p>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => {
                              addToCart({...item, quantity: 1});
                              removeFromWishlist(item._id || item.id);
                            }}
                            className="flex-1 bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 transition-colors"
                          >
                            Add to Cart
                          </button>
                          <button
                            onClick={() => removeFromWishlist(item._id || item.id)}
                            className="px-3 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                            title="Remove from wishlist"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <HeartIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-4">Your wishlist is empty</p>
                  <p className="text-sm text-gray-500 mb-4">
                    Click the heart icon (❤️) on any product to add it to your wishlist
                  </p>
                  <div className="flex gap-3 justify-center">
                    <Link
                      to="/shop"
                      className="inline-block px-6 py-3 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors"
                    >
                      Browse Products
                    </Link>
                    <button
                      onClick={() => {
                        // Add a test item to help debug
                        const testItem = {
                          _id: 'test-' + Date.now(),
                          id: 'test-' + Date.now(),
                          name: 'Test Product',
                          price: 50000,
                          image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400',
                          category: 'Test',
                          brand: 'Test Brand'
                        };
                        const currentWishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
                        currentWishlist.push(testItem);
                        localStorage.setItem('wishlist', JSON.stringify(currentWishlist));
                        loadWishlist();
                        alert('Test item added! Refresh to see it.');
                      }}
                      className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                    >
                      Add Test Item
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* Recommendations Tab */}
          {activeTab === 'recommendations' && (
            <motion.div
              key="recommendations"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white rounded-2xl shadow-xl p-8"
            >
              <div className="flex items-center gap-3 mb-6">
                <SparklesIcon className="w-8 h-8 text-yellow-500" />
                <h2 className="text-2xl font-bold text-gray-900">Recommended For You</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {recommendations.map((product, index) => (
                  <Link
                    key={index}
                    to={`/product/${product.id}`}
                    className="border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-shadow"
                  >
                    <img
                      src={product.mainImage || product.image}
                      alt={product.name}
                      className="w-full h-48 object-cover"
                    />
                    <div className="p-4">
                      <h3 className="font-bold text-gray-900 mb-2">{product.name}</h3>
                      <p className="text-xl font-bold text-purple-600">
                        {product.price?.toLocaleString()} RWF
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </motion.div>
          )}

          {/* Addresses Tab */}
          {activeTab === 'addresses' && (
            <motion.div
              key="addresses"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white rounded-2xl shadow-xl p-8"
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Saved Addresses</h2>
              {user?.addresses && user.addresses.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {user.addresses.map((address, index) => (
                    <div
                      key={index}
                      className="border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <MapPinIcon className="w-6 h-6 text-purple-600" />
                        {address.isDefault && (
                          <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                            Default
                          </span>
                        )}
                      </div>
                      <h3 className="font-bold text-gray-900 mb-2">
                        {address.firstName} {address.lastName}
                      </h3>
                      <p className="text-gray-600 text-sm">
                        {address.address}<br />
                        {address.city}, {address.district}<br />
                        {address.country}<br />
                        {address.phone}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <MapPinIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No saved addresses</p>
                </div>
              )}
            </motion.div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <motion.div
              key="settings"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white rounded-2xl shadow-xl p-8"
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Account Settings</h2>
              <div className="space-y-4">
                <div className="border border-gray-200 rounded-xl p-6">
                  <h3 className="font-bold text-gray-900 mb-2">Profile Information</h3>
                  <div className="space-y-2 text-gray-600">
                    <p><span className="font-semibold">Name:</span> {user?.firstName} {user?.lastName}</p>
                    <p><span className="font-semibold">Email:</span> {user?.email}</p>
                    <p><span className="font-semibold">Phone:</span> {user?.phone}</p>
                  </div>
                </div>
                
                <div className="border border-gray-200 rounded-xl p-6">
                  <h3 className="font-bold text-gray-900 mb-2">Notifications</h3>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <BellIcon className="w-6 h-6 text-gray-600" />
                      <span className="text-gray-600">Order updates via SMS</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                    </label>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default MyAccount;
