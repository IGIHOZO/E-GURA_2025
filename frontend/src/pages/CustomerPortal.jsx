import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  UserIcon, 
  MapPinIcon, 
  ShoppingBagIcon,
  HeartIcon,
  ClockIcon,
  CheckCircleIcon,
  TruckIcon,
  XCircleIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import { CustomerAccountManager } from '../utils/customerAccountManager';
import { Link } from 'react-router-dom';

const CustomerPortal = () => {
  const [activeTab, setActiveTab] = useState('orders');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customer, setCustomer] = useState(null);
  const [orders, setOrders] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [showEmailInput, setShowEmailInput] = useState(true);

  useEffect(() => {
    // Check if customer is already logged in
    const savedEmail = localStorage.getItem('currentCustomerEmail');
    if (savedEmail) {
      loadCustomerData(savedEmail);
      setShowEmailInput(false);
    }
  }, []);

  const loadCustomerData = (email) => {
    const customerData = CustomerAccountManager.getCustomerByEmail(email);
    if (customerData) {
      setCustomer(customerData);
      setCustomerEmail(email);
      setOrders(customerData.orders || []);
      setAddresses(customerData.shippingAddresses || []);
      console.log('✅ Customer data loaded:', customerData);
    } else {
      alert('No account found with this email. Please place an order first to create an account.');
    }
  };

  const handleEmailSubmit = (e) => {
    e.preventDefault();
    if (customerEmail && customerEmail.includes('@')) {
      loadCustomerData(customerEmail);
      setShowEmailInput(false);
    }
  };

  const handleSetDefaultAddress = (index) => {
    CustomerAccountManager.setDefaultAddress(customerEmail, index);
    loadCustomerData(customerEmail);
  };

  const handleLogout = () => {
    localStorage.removeItem('currentCustomerEmail');
    setCustomer(null);
    setCustomerEmail('');
    setOrders([]);
    setAddresses([]);
    setShowEmailInput(true);
  };

  if (showEmailInput) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8"
        >
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <UserIcon className="h-10 w-10 text-red-600" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back!</h2>
            <p className="text-gray-600">Enter your email to access your account</p>
          </div>

          <form onSubmit={handleEmailSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                required
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent"
                placeholder="your@email.com"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 transition-colors font-semibold"
            >
              Access My Account
            </button>
          </form>

          <p className="text-center text-sm text-gray-600 mt-6">
            Don't have an account? Place an order and we'll create one for you automatically!
          </p>
        </motion.div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your account...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm p-8 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                {customer.firstName?.[0]}{customer.lastName?.[0]}
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {customer.firstName} {customer.lastName}
                </h1>
                <p className="text-gray-600">{customer.email}</p>
                <p className="text-sm text-gray-500">
                  Member since {new Date(customer.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-sm mb-8">
          <div className="flex border-b">
            {[
              { id: 'orders', label: 'My Orders', icon: ShoppingBagIcon },
              { id: 'addresses', label: 'Shipping Addresses', icon: MapPinIcon },
              { id: 'preferences', label: 'Preferences', icon: HeartIcon }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'text-red-600 border-b-2 border-red-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <tab.icon className="h-5 w-5" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-2xl shadow-sm p-8">
          {/* Orders Tab */}
          {activeTab === 'orders' && (
            <div>
              <h2 className="text-2xl font-bold mb-6">Order History</h2>
              {orders.length === 0 ? (
                <div className="text-center py-12">
                  <ShoppingBagIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-4">No orders yet</p>
                  <Link
                    to="/shop"
                    className="inline-block bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Start Shopping
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.map((order, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="font-semibold text-lg">{order.orderNumber}</h3>
                          <p className="text-sm text-gray-600">
                            {new Date(order.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-red-600">
                            {order.total?.toLocaleString()} RWF
                          </p>
                          <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                            order.status === 'completed' ? 'bg-green-100 text-green-700' :
                            order.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-blue-100 text-blue-700'
                          }`}>
                            {order.status}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {order.items?.map((item, idx) => (
                          <div key={idx} className="flex items-center gap-3 bg-gray-50 rounded-lg p-3">
                            <img
                              src={item.mainImage || item.image}
                              alt={item.name}
                              className="w-16 h-16 object-cover rounded-lg"
                            />
                            <div className="flex-1">
                              <p className="font-medium text-sm">{item.name}</p>
                              <p className="text-xs text-gray-600">Qty: {item.quantity}</p>
                              <p className="text-sm font-semibold text-red-600">
                                {item.price?.toLocaleString()} RWF
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Addresses Tab */}
          {activeTab === 'addresses' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">Shipping Addresses</h2>
                <button className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors">
                  <PlusIcon className="h-5 w-5" />
                  Add New Address
                </button>
              </div>

              {addresses.length === 0 ? (
                <div className="text-center py-12">
                  <MapPinIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No saved addresses</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {addresses.map((address, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.1 }}
                      className={`border-2 rounded-xl p-6 ${
                        address.isDefault ? 'border-red-600 bg-red-50' : 'border-gray-200'
                      }`}
                    >
                      {address.isDefault && (
                        <span className="inline-block bg-red-600 text-white text-xs px-3 py-1 rounded-full mb-3">
                          Default
                        </span>
                      )}
                      <h3 className="font-semibold text-lg mb-2">{address.receiverName}</h3>
                      <p className="text-gray-600 mb-1">{address.address}</p>
                      <p className="text-gray-600 mb-3">{address.city}, {address.country || 'Rwanda'}</p>
                      <p className="text-gray-600 mb-4">📞 {address.phoneNumber}</p>

                      <div className="flex gap-2">
                        {!address.isDefault && (
                          <button
                            onClick={() => handleSetDefaultAddress(index)}
                            className="flex-1 px-4 py-2 border border-red-600 text-red-600 rounded-lg hover:bg-red-50 transition-colors text-sm"
                          >
                            Set as Default
                          </button>
                        )}
                        <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm">
                          <PencilIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Preferences Tab */}
          {activeTab === 'preferences' && (
            <div>
              <h2 className="text-2xl font-bold mb-6">Shopping Preferences</h2>
              
              <div className="space-y-6">
                <div className="bg-gray-50 rounded-xl p-6">
                  <h3 className="font-semibold text-lg mb-4">Favorite Categories</h3>
                  <div className="flex flex-wrap gap-2">
                    {customer.preferences?.categories?.length > 0 ? (
                      customer.preferences.categories.map((cat, index) => (
                        <span
                          key={index}
                          className="bg-red-100 text-red-700 px-4 py-2 rounded-full text-sm font-medium"
                        >
                          {cat}
                        </span>
                      ))
                    ) : (
                      <p className="text-gray-600">No preferences yet. Shop more to build your profile!</p>
                    )}
                  </div>
                </div>

                <div className="bg-gray-50 rounded-xl p-6">
                  <h3 className="font-semibold text-lg mb-4">Price Range</h3>
                  <p className="text-gray-600">
                    Your typical spending range: {' '}
                    <span className="font-semibold text-red-600">
                      {customer.preferences?.priceRange?.min?.toLocaleString()} - {customer.preferences?.priceRange?.max?.toLocaleString()} RWF
                    </span>
                  </p>
                </div>

                <div className="bg-gray-50 rounded-xl p-6">
                  <h3 className="font-semibold text-lg mb-4">Account Stats</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <p className="text-3xl font-bold text-red-600">{orders.length}</p>
                      <p className="text-sm text-gray-600">Total Orders</p>
                    </div>
                    <div className="text-center">
                      <p className="text-3xl font-bold text-red-600">{addresses.length}</p>
                      <p className="text-sm text-gray-600">Saved Addresses</p>
                    </div>
                    <div className="text-center">
                      <p className="text-3xl font-bold text-red-600">{customer.loginCount || 1}</p>
                      <p className="text-sm text-gray-600">Visits</p>
                    </div>
                    <div className="text-center">
                      <p className="text-3xl font-bold text-red-600">
                        {orders.reduce((sum, order) => sum + (order.total || 0), 0).toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-600">Total Spent (RWF)</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomerPortal;
