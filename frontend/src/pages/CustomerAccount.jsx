import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  UserIcon,
  MapPinIcon,
  BellIcon,
  ShoppingBagIcon,
  HeartIcon,
  CogIcon,
  PlusIcon,
  TrashIcon,
  EyeIcon,
  TruckIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  PhoneIcon,
  EnvelopeIcon,
  HomeIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../context/AuthContext';
import { getCustomerShippingAddresses } from '../utils/customerUtils';
import LoginModal from '../components/LoginModal';
import SEOHead from '../components/SEOHead';
import * as customerAPI from '../services/customerAccountAPI';

const CustomerAccount = () => {
  const { user, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [shippingAddresses, setShippingAddresses] = useState([]);
  const [orders, setOrders] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showAddAddressModal, setShowAddAddressModal] = useState(false);
  const [newAddress, setNewAddress] = useState({
    receiverName: '',
    phoneNumber: '',
    location: ''
  });
  const [showNotificationPopup, setShowNotificationPopup] = useState(false);
  const [latestNotification, setLatestNotification] = useState(null);

  useEffect(() => {
    if (isAuthenticated) {
      loadCustomerData();
    }
  }, [isAuthenticated]);

  const loadCustomerData = async () => {
    console.log('Loading customer data for user:', user);
    
    try {
      const userId = user?.id || user?._id;
      const phone = user?.phoneNumber || user?.phone;

      // Load overview data
      const overviewData = await customerAPI.getCustomerOverview(userId, phone);
      console.log('Overview data:', overviewData);

      // Load addresses from backend
      const addressesData = await customerAPI.getCustomerAddresses(userId, phone);
      console.log('Addresses from backend:', addressesData);
      setShippingAddresses(addressesData.data.addresses || []);

      // Load orders from backend
      const ordersData = await customerAPI.getCustomerOrders(userId, phone, null, 1, 50);
      console.log('Orders from backend:', ordersData);
      setOrders(ordersData.data.orders || []);

      // Load real notifications from localStorage (can be moved to backend later)
      const allNotifications = JSON.parse(localStorage.getItem('customerNotifications') || '[]');
      const userNotifications = allNotifications.filter(notification => {
        const notificationPhone = notification.customerPhone;
        const userPhone = user?.phoneNumber;
        return notificationPhone === userPhone;
      });
      console.log('User notifications:', userNotifications);
      setNotifications(userNotifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));

      // Check for unread notifications and show popup
      const unreadNotifications = userNotifications.filter(n => !n.read);
      if (unreadNotifications.length > 0) {
        setLatestNotification(unreadNotifications[0]);
        setShowNotificationPopup(true);
      }

      // Load recommendations from backend
      const recsData = await customerAPI.getCustomerRecommendations(userId, phone, 6);
      console.log('Recommendations from backend:', recsData);
      setRecommendations(recsData.data.recommendations || []);

    } catch (error) {
      console.error('Error loading customer data:', error);
      // Fallback to localStorage if API fails
      loadCustomerDataFromLocalStorage();
    }
  };

  const loadCustomerDataFromLocalStorage = () => {
    console.log('Loading from localStorage (fallback)');
    
    let customerId = user?.id || user?._id;
    if (!customerId && user?.phoneNumber) {
      const customers = JSON.parse(localStorage.getItem('customers') || '[]');
      const customer = customers.find(c => c.phoneNumber === user.phoneNumber);
      if (customer) {
        customerId = customer.id || customer._id;
      }
    }
    
    const addresses = getCustomerShippingAddresses(customerId);
    setShippingAddresses(addresses);

    const savedOrders = JSON.parse(localStorage.getItem('orders') || '[]');
    const adminOrders = JSON.parse(localStorage.getItem('adminOrders') || '[]');
    const allOrders = [...savedOrders, ...adminOrders];
    
    const userOrders = allOrders.filter(order => {
      const orderPhone = order.shippingAddress?.phone || order.phone || order.shippingInfo?.phoneNumber;
      const userPhone = user?.phoneNumber;
      return orderPhone === userPhone;
    });
    setOrders(userOrders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));

    // Load recommendations (mock data)
    setRecommendations([
      {
        id: 1,
        name: 'Summer Dress Collection',
        price: 45000,
        image: 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=300&h=400&fit=crop',
        reason: 'Based on your recent purchases'
      },
      {
        id: 2,
        name: 'Casual Shirt',
        price: 25000,
        image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=300&h=400&fit=crop',
        reason: 'Popular in your area'
      }
    ]);
  };

  const markNotificationAsRead = (notificationId) => {
    const allNotifications = JSON.parse(localStorage.getItem('customerNotifications') || '[]');
    const updatedNotifications = allNotifications.map(notification => {
      if (notification.id === notificationId) {
        return { ...notification, read: true };
      }
      return notification;
    });
    localStorage.setItem('customerNotifications', JSON.stringify(updatedNotifications));
    
    // Update local state
    setNotifications(prev => prev.map(n => 
      n.id === notificationId ? { ...n, read: true } : n
    ));
  };

  const closeNotificationPopup = () => {
    setShowNotificationPopup(false);
    if (latestNotification) {
      markNotificationAsRead(latestNotification.id);
    }
  };

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
              Please login to access your account and manage your profile.
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

  const tabs = [
    { id: 'overview', name: 'Overview', icon: HomeIcon },
    { id: 'addresses', name: 'Shipping Addresses', icon: MapPinIcon },
    { id: 'orders', name: 'My Orders', icon: ShoppingBagIcon },
    { id: 'notifications', name: 'Notifications', icon: BellIcon },
    { id: 'recommendations', name: 'Recommendations', icon: HeartIcon },
    { id: 'settings', name: 'Settings', icon: CogIcon }
  ];

  return (
    <>
      <SEOHead 
        title="My Account - E-Gura Store"
        description="Manage your account, shipping addresses, orders, and preferences"
        keywords="account, profile, shipping addresses, orders, notifications, E-Gura Store"
        pageType="account"
      />
      
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">My Account</h1>
            <p className="text-gray-600">Welcome back, {user?.name?.split(' ')[0] || 'Customer'}!</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm p-6 sticky top-8">
                {/* User Info */}
                <div className="text-center mb-6">
                  <div className="w-20 h-20 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <UserIcon className="h-10 w-10 text-white" />
                  </div>
                  <h3 className="font-semibold text-gray-900">{user?.name || 'Customer'}</h3>
                  <p className="text-sm text-gray-600">{user?.phoneNumber}</p>
                  <p className="text-sm text-gray-600">{user?.email}</p>
                </div>

                {/* Navigation Tabs */}
                <nav className="space-y-2">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                        activeTab === tab.id
                          ? 'bg-purple-50 text-purple-700 border border-purple-200'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <tab.icon className="h-5 w-5" />
                      <span className="font-medium">{tab.name}</span>
                    </button>
                  ))}
                </nav>
              </div>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-3">
              {/* Overview Tab */}
              {activeTab === 'overview' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  {/* Stats Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white rounded-lg shadow-sm p-6">
                      <div className="flex items-center">
                        <div className="p-3 bg-blue-100 rounded-lg">
                          <ShoppingBagIcon className="h-6 w-6 text-blue-600" />
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-600">Total Orders</p>
                          <p className="text-2xl font-bold text-gray-900">{orders.length}</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm p-6">
                      <div className="flex items-center">
                        <div className="p-3 bg-green-100 rounded-lg">
                          <MapPinIcon className="h-6 w-6 text-green-600" />
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-600">Saved Addresses</p>
                          <p className="text-2xl font-bold text-gray-900">{shippingAddresses.length}</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm p-6">
                      <div className="flex items-center">
                        <div className="p-3 bg-purple-100 rounded-lg">
                          <BellIcon className="h-6 w-6 text-purple-600" />
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-600">Unread Notifications</p>
                          <p className="text-2xl font-bold text-gray-900">
                            {notifications.filter(n => !n.read).length}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Recent Orders */}
                  <div className="bg-white rounded-lg shadow-sm p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Orders</h3>
                    {orders.slice(0, 3).length > 0 ? (
                      <div className="space-y-4">
                        {orders.slice(0, 3).map((order) => (
                          <div key={order.id || order._id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                            <div>
                              <p className="font-medium text-gray-900">Order #{order.id || order._id}</p>
                              <p className="text-sm text-gray-600">{new Date(order.createdAt).toLocaleDateString()}</p>
                            </div>
                            <div className="flex items-center space-x-4">
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                order.status === 'paid' ? 'bg-green-100 text-green-800' :
                                order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {order.status || 'Pending'}
                              </span>
                              <span className="font-medium">RWF {(order.total || order.subtotal || 0).toLocaleString()}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-600 text-center py-8">No orders yet. Start shopping to see your orders here!</p>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Addresses Tab */}
              {activeTab === 'addresses' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-gray-900">Shipping Addresses</h3>
                    <button
                      onClick={() => setShowAddAddressModal(true)}
                      className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                    >
                      <PlusIcon className="h-4 w-4" />
                      <span>Add New Address</span>
                    </button>
                  </div>

                  {shippingAddresses.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {shippingAddresses.map((address) => (
                        <div key={address.id} className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <h4 className="font-semibold text-gray-900">{address.receiverName}</h4>
                              <p className="text-sm text-gray-600">{address.phoneNumber}</p>
                            </div>
                            <button
                              onClick={() => {
                                const addresses = shippingAddresses.filter(addr => addr.id !== address.id);
                                setShippingAddresses(addresses);
                                localStorage.setItem('shippingAddresses', JSON.stringify(addresses));
                              }}
                              className="text-red-500 hover:text-red-700"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          </div>
                          <p className="text-gray-700">{address.location}</p>
                          {address.isDefault && (
                            <span className="inline-block mt-2 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                              Default Address
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                      <MapPinIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">No saved addresses</h3>
                      <p className="text-gray-600 mb-4">Add your shipping addresses for faster checkout.</p>
                      <button
                        onClick={() => setShowAddAddressModal(true)}
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                      >
                        Add First Address
                      </button>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Orders Tab */}
              {activeTab === 'orders' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  <h3 className="text-lg font-semibold text-gray-900">My Orders</h3>
                  
                  {orders.length > 0 ? (
                    <div className="space-y-4">
                      {orders.map((order) => (
                        <div key={order.id || order._id} className="bg-white rounded-lg shadow-sm p-6">
                          <div className="flex items-center justify-between mb-4">
                            <div>
                              <h4 className="font-semibold text-gray-900">Order #{order.id || order._id}</h4>
                              <p className="text-sm text-gray-600">{new Date(order.createdAt).toLocaleDateString()}</p>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                order.status === 'paid' ? 'bg-green-100 text-green-800' :
                                order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {order.status || 'Pending'}
                              </span>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                            <div>
                              <p className="text-sm text-gray-600">Items</p>
                              <p className="font-medium">{order.items?.length || 0} items</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">Total</p>
                              <p className="font-medium">RWF {(order.total || order.subtotal || 0).toLocaleString()}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">Payment</p>
                              <p className="font-medium">{order.paymentMethod || 'MTN Mobile Money'}</p>
                            </div>
                          </div>

                          <div className="border-t pt-4">
                            <h5 className="font-medium text-gray-900 mb-2">Order Items</h5>
                            <div className="space-y-2">
                              {order.items?.map((item, index) => (
                                <div key={index} className="flex items-center space-x-3">
                                  <img
                                    src={item.mainImage || item.image}
                                    alt={item.name}
                                    className="w-10 h-10 object-cover rounded"
                                  />
                                  <div className="flex-1">
                                    <p className="text-sm font-medium">{item.name}</p>
                                    <p className="text-xs text-gray-600">
                                      Size: {item.size || 'M'} | Qty: {item.quantity}
                                    </p>
                                  </div>
                                  <span className="text-sm font-medium">RWF {(item.price * item.quantity).toLocaleString()}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                      <ShoppingBagIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">No orders yet</h3>
                      <p className="text-gray-600">Start shopping to see your orders here!</p>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Notifications Tab */}
              {activeTab === 'notifications' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
                  
                  <div className="space-y-4">
                    {notifications.map((notification) => (
                      <div key={notification.id} className={`bg-white rounded-lg shadow-sm p-6 border-l-4 ${
                        notification.read ? 'border-gray-200' : 'border-purple-500'
                      }`}>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900">{notification.title}</h4>
                            <p className="text-gray-600 mt-1">{notification.message}</p>
                            <p className="text-sm text-gray-500 mt-2">{new Date(notification.date).toLocaleDateString()}</p>
                          </div>
                          {!notification.read && (
                            <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Recommendations Tab */}
              {activeTab === 'recommendations' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  <h3 className="text-lg font-semibold text-gray-900">Recommended for You</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {recommendations.map((product) => (
                      <div key={product.id} className="bg-white rounded-lg shadow-sm overflow-hidden">
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-full h-48 object-cover"
                        />
                        <div className="p-4">
                          <h4 className="font-semibold text-gray-900 mb-2">{product.name}</h4>
                          <p className="text-sm text-gray-600 mb-2">{product.reason}</p>
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-gray-900">RWF {product.price.toLocaleString()}</span>
                            <button className="px-3 py-1 bg-purple-600 text-white rounded text-sm hover:bg-purple-700 transition-colors">
                              View Details
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Settings Tab */}
              {activeTab === 'settings' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  <h3 className="text-lg font-semibold text-gray-900">Account Settings</h3>
                  
                  <div className="bg-white rounded-lg shadow-sm p-6">
                    <div className="space-y-6">
                      <div>
                        <h4 className="font-medium text-gray-900 mb-4">Personal Information</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                            <input
                              type="text"
                              defaultValue={user?.name || ''}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                            <input
                              type="tel"
                              defaultValue={user?.phoneNumber || ''}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            />
                          </div>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-medium text-gray-900 mb-4">Notification Preferences</h4>
                        <div className="space-y-3">
                          <label className="flex items-center">
                            <input type="checkbox" defaultChecked className="rounded border-gray-300 text-purple-600 focus:ring-purple-500" />
                            <span className="ml-2 text-sm text-gray-700">New product notifications</span>
                          </label>
                          <label className="flex items-center">
                            <input type="checkbox" defaultChecked className="rounded border-gray-300 text-purple-600 focus:ring-purple-500" />
                            <span className="ml-2 text-sm text-gray-700">Order updates</span>
                          </label>
                          <label className="flex items-center">
                            <input type="checkbox" defaultChecked className="rounded border-gray-300 text-purple-600 focus:ring-purple-500" />
                            <span className="ml-2 text-sm text-gray-700">Promotional offers</span>
                          </label>
                        </div>
                      </div>

                      <div className="pt-4 border-t">
                        <button className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
                          Save Changes
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add Address Modal */}
      {showAddAddressModal && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-white/20"
          >
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Shipping Address</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Receiver Name</label>
                  <input
                    type="text"
                    value={newAddress.receiverName}
                    onChange={(e) => setNewAddress({...newAddress, receiverName: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Enter receiver name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                  <input
                    type="tel"
                    value={newAddress.phoneNumber}
                    onChange={(e) => setNewAddress({...newAddress, phoneNumber: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Enter phone number"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Location/Address</label>
                  <textarea
                    value={newAddress.location}
                    onChange={(e) => setNewAddress({...newAddress, location: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    rows={3}
                    placeholder="Enter full address"
                  />
                </div>
              </div>

              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => setShowAddAddressModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (!newAddress.receiverName || !newAddress.phoneNumber || !newAddress.location) {
                      alert('Please fill in all fields');
                      return;
                    }
                    
                    const addressData = {
                      id: Date.now(),
                      customerId: user?.id || user?._id,
                      receiverName: newAddress.receiverName,
                      phoneNumber: newAddress.phoneNumber,
                      location: newAddress.location,
                      isDefault: shippingAddresses.length === 0,
                      createdAt: new Date().toISOString()
                    };

                    // Store in localStorage
                    const existingAddresses = JSON.parse(localStorage.getItem('shippingAddresses') || '[]');
                    existingAddresses.push(addressData);
                    localStorage.setItem('shippingAddresses', JSON.stringify(existingAddresses));

                    setShippingAddresses([...shippingAddresses, addressData]);
                    setNewAddress({ receiverName: '', phoneNumber: '', location: '' });
                    setShowAddAddressModal(false);
                  }}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Add Address
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Notification Popup */}
      {showNotificationPopup && latestNotification && (
        <div className="fixed top-4 right-4 z-50">
          <motion.div
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 300 }}
            className="bg-white rounded-lg shadow-lg border border-gray-200 p-4 max-w-sm"
          >
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <BellIcon className="h-4 w-4 text-blue-600" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">
                  {latestNotification.message}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {new Date(latestNotification.createdAt).toLocaleString()}
                </p>
              </div>
              <button
                onClick={closeNotificationPopup}
                className="flex-shrink-0 text-gray-400 hover:text-gray-600"
              >
                <span className="sr-only">Close</span>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Login Modal */}
      <LoginModal 
        isOpen={showLoginModal} 
        onClose={() => setShowLoginModal(false)} 
      />
    </>
  );
};

export default CustomerAccount; 