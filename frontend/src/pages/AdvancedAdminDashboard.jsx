import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import {
  ChartBarIcon,
  ShoppingBagIcon,
  UserGroupIcon,
  CurrencyDollarIcon,
  TruckIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  SparklesIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  CubeIcon,
  BellAlertIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  PlusIcon,
  XMarkIcon,
  ArrowLeftOnRectangleIcon,
  Cog6ToothIcon,
  RocketLaunchIcon,
  PhoneIcon
} from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import ProductManager from '../components/ProductManager';
import CategoryManager from '../components/CategoryManager';
import EnhancedOrderDetails from '../components/EnhancedOrderDetails';
import SEOHead from '../components/SEOHead';
import AdminProductsEnhanced from '../components/AdminProductsEnhanced';
import AdminOrdersEnhanced from '../components/AdminOrdersEnhanced';
import AdminCustomersEnhanced from '../components/AdminCustomersEnhanced';
import MomoCodesManager from '../components/admin/MomoCodesManager';

const AdvancedAdminDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Data states
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [aiInsights, setAiInsights] = useState(null);
  const [stockAnalysis, setStockAnalysis] = useState(null);
  
  // Modal states
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showCustomerModal, setShowCustomerModal] = useState(false);

  useEffect(() => {
    // Check if admin is logged in
    const adminToken = localStorage.getItem('adminToken');
    if (!adminToken) {
      console.log('❌ No admin token found, redirecting to login');
      navigate('/admin/login');
      return;
    }
    
    loadDashboardData();
    // Auto-refresh disabled to prevent errors
    // Manual refresh available via button
  }, [navigate]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Load orders from both API and localStorage
      const ordersFromAPI = await loadOrders();
      const ordersFromLocal = JSON.parse(localStorage.getItem('adminOrders') || '[]');
      const allOrders = [...ordersFromAPI, ...ordersFromLocal];
      const uniqueOrders = allOrders.filter((order, index, self) =>
        index === self.findIndex(o => (o.id || o._id) === (order.id || order._id))
      );
      setOrders(uniqueOrders);
      console.log(`📦 Loaded ${uniqueOrders.length} orders`);

      // Load customers
      const customersData = await loadCustomers();
      setCustomers(Array.isArray(customersData) ? customersData : []);
      console.log(`👥 Loaded ${Array.isArray(customersData) ? customersData.length : 0} customers`);

      // Load products
      const productsData = await loadProducts();
      setProducts(productsData);
      console.log(`🛍️ Loaded ${productsData.length} products`);

      // Load AI insights
      await loadAIInsights(productsData);

      // Calculate analytics
      calculateAnalytics(uniqueOrders, customersData, productsData);

    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadOrders = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.get('/api/admin/orders/all', {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data.orders || [];
    } catch (error) {
      console.error('Failed to load orders from API:', error);
      return [];
    }
  };

  const loadCustomers = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.get('/api/admin/customers', {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data.customers || [];
    } catch (error) {
      console.error('Failed to load customers from API:', error);
      // Fallback to localStorage
      return JSON.parse(localStorage.getItem('customers') || '[]');
    }
  };

  const loadProducts = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.get('/api/admin/products', {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data.data || [];
    } catch (error) {
      console.error('Failed to load products from API:', error);
      return [];
    }
  };

  const loadAIInsights = async (productsData) => {
    try {
      const token = localStorage.getItem('adminToken');
      const config = {
        headers: { Authorization: `Bearer ${token}` }
      };
      
      // Get AI stock analysis
      const stockResponse = await axios.get('/api/admin/stock/report', config);
      setStockAnalysis(stockResponse.data);

      // Get reorder list
      const reorderResponse = await axios.get('/api/admin/stock/reorder-list', config);
      setAiInsights(reorderResponse.data);
    } catch (error) {
      console.error('Failed to load AI insights:', error);
    }
  };

  const calculateAnalytics = (ordersData, customersData, productsData) => {
    const totalRevenue = ordersData.reduce((sum, order) => sum + (order.total || order.subtotal || 0), 0);
    const pendingOrders = ordersData.filter(o => o.status === 'pending').length;
    const completedOrders = ordersData.filter(o => o.status === 'delivered' || o.status === 'completed').length;
    const lowStockProducts = productsData.filter(p => (p.stockQuantity || 0) < 10).length;

    setAnalytics({
      totalRevenue,
      totalOrders: ordersData.length,
      pendingOrders,
      completedOrders,
      totalCustomers: customersData.length,
      totalProducts: productsData.length,
      lowStockProducts,
      averageOrderValue: ordersData.length > 0 ? totalRevenue / ordersData.length : 0
    });
  };

  const viewOrderDetails = (order) => {
    setSelectedOrder(order);
    setShowOrderModal(true);
  };

  const viewCustomerDetails = (customer) => {
    setSelectedCustomer(customer);
    setShowCustomerModal(true);
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      await axios.put(`https://egura.rw/api/admin/orders/${orderId}/status`, {
        status: newStatus
      });
      
      // Update local state
      setOrders(orders.map(order => 
        (order._id || order.id) === orderId ? { ...order, status: newStatus } : order
      ));
      
      // Update localStorage
      const localOrders = JSON.parse(localStorage.getItem('adminOrders') || '[]');
      const updatedLocalOrders = localOrders.map(order =>
        (order._id || order.id) === orderId ? { ...order, status: newStatus } : order
      );
      localStorage.setItem('adminOrders', JSON.stringify(updatedLocalOrders));
      
      alert('✅ Order status updated successfully!');
    } catch (error) {
      console.error('Failed to update order status:', error);
      alert('❌ Failed to update order status');
    }
  };

  // Filter data based on search
  const filteredOrders = orders.filter(order =>
    order.orderNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.shippingAddress?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.shippingAddress?.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.customerInfo?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.customerInfo?.lastName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredCustomers = Array.isArray(customers) ? customers.filter(customer =>
    customer.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone?.toLowerCase().includes(searchTerm.toLowerCase())
  ) : [];

  const filteredProducts = products.filter(product =>
    product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading Advanced Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50">
      <SEOHead 
        title="Admin Dashboard - Manage Orders, Products & Customers | E-Gura Store"
        description="Comprehensive admin dashboard with AI-powered analytics. Manage products, track orders, view customers, and get intelligent business insights."
        keywords="admin dashboard, e-commerce management, product management, order tracking, customer analytics, AI insights, business intelligence, Rwanda e-commerce admin"
        pageType="admin"
        noIndex={true}
      />
      
      {/* Header */}
      <div className="bg-white shadow-lg border-b-4 border-purple-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                🚀 Advanced AI Admin Dashboard
              </h1>
              <p className="text-gray-600 mt-1">Powered by AI Analytics & Insights</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/admin/shipping')}
                className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-6 py-3 rounded-lg hover:shadow-lg transition-all flex items-center gap-2"
                title="Manage Free Shipping Settings"
              >
                <TruckIcon className="h-5 w-5" />
                Shipping Settings
              </button>
              <button
                onClick={() => navigate('/admin/seo-generator')}
                className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-lg hover:shadow-lg transition-all flex items-center gap-2"
                title="AI SEO Content Generator"
              >
                <RocketLaunchIcon className="h-5 w-5" />
                SEO Generator
              </button>
              <button
                onClick={loadDashboardData}
                className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-lg hover:shadow-lg transition-all flex items-center gap-2"
              >
                <SparklesIcon className="h-5 w-5" />
                Refresh Data
              </button>
              <button
                onClick={() => {
                  localStorage.removeItem('adminToken');
                  localStorage.removeItem('adminUser');
                  navigate('/admin/login');
                }}
                className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 hover:shadow-lg transition-all flex items-center gap-2"
              >
                <ArrowLeftOnRectangleIcon className="h-5 w-5" />
                Logout
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="mt-6">
            <div className="relative max-w-xl">
              <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search orders, customers, products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border-2 border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[
            {
              title: 'Total Revenue',
              value: `${Math.round(analytics?.totalRevenue || 0).toLocaleString()} RWF`,
              icon: CurrencyDollarIcon,
              color: 'from-green-500 to-emerald-500',
              trend: analytics?.totalRevenue > 0 ? 'Growing' : 'Start selling'
            },
            {
              title: 'Total Orders',
              value: analytics?.totalOrders || 0,
              icon: ShoppingBagIcon,
              color: 'from-blue-500 to-cyan-500',
              trend: `${analytics?.pendingOrders || 0} pending`
            },
            {
              title: 'Customers',
              value: analytics?.totalCustomers || 0,
              icon: UserGroupIcon,
              color: 'from-purple-500 to-pink-500',
              trend: 'Active users'
            },
            {
              title: 'Products',
              value: analytics?.totalProducts || 0,
              icon: CubeIcon,
              color: 'from-orange-500 to-red-500',
              trend: `${analytics?.lowStockProducts || 0} low stock`
            }
          ].map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-xl shadow-lg p-6 border-2 border-transparent hover:border-purple-300 transition-all"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg bg-gradient-to-r ${stat.color}`}>
                  <stat.icon className="h-6 w-6 text-white" />
                </div>
                <span className="text-sm text-green-600 font-medium">{stat.trend}</span>
              </div>
              <h3 className="text-gray-600 text-sm font-medium">{stat.title}</h3>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
            </motion.div>
          ))}
        </div>

        {/* AI Insights Section */}
        {stockAnalysis && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl shadow-lg p-6 mb-8 text-white"
          >
            <div className="flex items-center gap-3 mb-4">
              <SparklesIcon className="h-8 w-8" />
              <h2 className="text-2xl font-bold">AI-Powered Insights</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {stockAnalysis.recommendations?.slice(0, 3).map((rec, index) => (
                <div key={index} className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <BellAlertIcon className="h-5 w-5" />
                    <span className="font-semibold">{rec.type}</span>
                  </div>
                  <p className="text-sm opacity-90">{rec.message}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="border-b border-gray-200">
            <div className="flex overflow-x-auto">
              {[
                { id: 'overview', label: 'Overview', icon: ChartBarIcon },
                { id: 'orders', label: 'Orders', icon: ShoppingBagIcon, badge: orders.length },
                { id: 'customers', label: 'Customers', icon: UserGroupIcon, badge: customers.length },
                { id: 'products', label: 'Products', icon: CubeIcon, badge: products.length },
                { id: 'momo-codes', label: 'MOMO Codes', icon: PhoneIcon },
                { id: 'ai-insights', label: 'AI Insights', icon: SparklesIcon }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-6 py-4 font-medium transition-all relative ${
                    activeTab === tab.id
                      ? 'text-purple-600 border-b-2 border-purple-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <tab.icon className="h-5 w-5" />
                  {tab.label}
                  {tab.badge !== undefined && (
                    <span className="bg-purple-100 text-purple-600 text-xs font-bold px-2 py-1 rounded-full">
                      {tab.badge}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="p-6">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <h3 className="text-xl font-bold text-gray-900">Dashboard Overview</h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Recent Orders */}
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h4 className="font-semibold text-gray-900 mb-4">Recent Orders</h4>
                    <div className="space-y-3">
                      {orders.slice(0, 5).map((order) => (
                        <div key={order._id || order.id} className="bg-white p-4 rounded-lg shadow-sm">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium text-gray-900">{order.orderNumber || order.id}</p>
                              <p className="text-sm text-gray-600">
                                {order.shippingAddress?.firstName || order.customerInfo?.firstName} {order.shippingAddress?.lastName || order.customerInfo?.lastName}
                              </p>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                              order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                              order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-blue-100 text-blue-800'
                            }`}>
                              {order.status}
                            </span>
                          </div>
                          <p className="text-sm text-gray-500 mt-2">
                            {(order.total || order.subtotal || 0).toLocaleString()} RWF
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Low Stock Alert */}
                  <div className="bg-red-50 rounded-lg p-6">
                    <h4 className="font-semibold text-red-900 mb-4 flex items-center gap-2">
                      <ExclamationTriangleIcon className="h-5 w-5" />
                      Low Stock Alert
                    </h4>
                    <div className="space-y-3">
                      {products.filter(p => (p.stockQuantity || 0) < 10).slice(0, 5).map((product) => (
                        <div key={product._id} className="bg-white p-4 rounded-lg shadow-sm">
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="font-medium text-gray-900">{product.name}</p>
                              <p className="text-sm text-gray-600">{product.category}</p>
                            </div>
                            <span className="text-red-600 font-bold">{product.stockQuantity || 0} left</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Orders Tab - Enhanced with Search */}
            {activeTab === 'orders' && (
              <AdminOrdersEnhanced />
            )}

            {/* Customers Tab - Enhanced with Search */}
            {activeTab === 'customers' && (
              <AdminCustomersEnhanced />
            )}

            {/* Products Tab - Enhanced with Edit, Search, AI SEO & Stock */}
            {activeTab === 'products' && (
              <AdminProductsEnhanced />
            )}

            {/* MOMO Codes Tab */}
            {activeTab === 'momo-codes' && (
              <MomoCodesManager />
            )}

            {/* AI Insights Tab */}
            {activeTab === 'ai-insights' && (
              <div className="space-y-6">
                <h3 className="text-xl font-bold text-gray-900">AI-Powered Analytics</h3>
                
                {stockAnalysis && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Stock Summary */}
                    <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg p-6">
                      <h4 className="font-semibold text-gray-900 mb-4">Stock Summary</h4>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Total Products</span>
                          <span className="font-bold text-gray-900">{stockAnalysis.summary?.totalProducts || 0}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Out of Stock</span>
                          <span className="font-bold text-red-600">{stockAnalysis.summary?.outOfStock || 0}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Critical Stock</span>
                          <span className="font-bold text-orange-600">{stockAnalysis.summary?.critical || 0}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Low Stock</span>
                          <span className="font-bold text-yellow-600">{stockAnalysis.summary?.low || 0}</span>
                        </div>
                      </div>
                    </div>

                    {/* Reorder List */}
                    <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-6">
                      <h4 className="font-semibold text-gray-900 mb-4">Reorder Recommendations</h4>
                      <div className="space-y-3">
                        {stockAnalysis.reorderList?.slice(0, 5).map((item, index) => (
                          <div key={index} className="bg-white p-3 rounded-lg">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-medium text-gray-900">{item.product?.name}</p>
                                <p className="text-sm text-gray-600">Order: {item.orderQuantity} units</p>
                              </div>
                              <span className={`px-2 py-1 rounded text-xs font-medium ${
                                item.priority === 'CRITICAL' ? 'bg-red-100 text-red-800' :
                                item.priority === 'HIGH' ? 'bg-orange-100 text-orange-800' :
                                'bg-yellow-100 text-yellow-800'
                              }`}>
                                {item.priority}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Enhanced Order Details Modal */}
      <AnimatePresence>
        {showOrderModal && selectedOrder && (
          <EnhancedOrderDetails
            order={selectedOrder}
            onClose={() => setShowOrderModal(false)}
          />
        )}
      </AnimatePresence>

      {/* Customer Details Modal */}
      <AnimatePresence>
        {showCustomerModal && selectedCustomer && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowCustomerModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                <h3 className="text-2xl font-bold text-gray-900">Customer Details</h3>
                <button
                  onClick={() => setShowCustomerModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              <div className="p-6 space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-2xl">
                    {selectedCustomer.firstName?.[0]}{selectedCustomer.lastName?.[0]}
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-gray-900">
                      {selectedCustomer.firstName} {selectedCustomer.lastName}
                    </h4>
                    <p className="text-gray-600">{selectedCustomer.email}</p>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <h5 className="font-semibold text-gray-900 mb-2">Contact Information</h5>
                  <p><span className="font-medium">📱 Phone:</span> {selectedCustomer.phone}</p>
                  <p><span className="font-medium">📧 Email:</span> {selectedCustomer.email}</p>
                  <p><span className="font-medium">📅 Joined:</span> {new Date(selectedCustomer.createdAt).toLocaleDateString()}</p>
                  <p><span className="font-medium">✅ Status:</span> <span className={selectedCustomer.isActive ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>{selectedCustomer.isActive ? 'Active' : 'Inactive'}</span></p>
                  {selectedCustomer.emailVerified && (
                    <p><span className="font-medium">✉️ Email Verified:</span> <span className="text-green-600">Yes</span></p>
                  )}
                  {selectedCustomer.phoneVerified && (
                    <p><span className="font-medium">📲 Phone Verified:</span> <span className="text-green-600">Yes</span></p>
                  )}
                </div>

                {selectedCustomer.addresses && selectedCustomer.addresses.length > 0 && (
                  <div className="bg-blue-50 rounded-lg p-4 space-y-3">
                    <h5 className="font-semibold text-gray-900 mb-2">📍 Addresses ({selectedCustomer.addresses.length})</h5>
                    {selectedCustomer.addresses.map((address, index) => (
                      <div key={index} className="bg-white rounded-lg p-3 space-y-1">
                        <p className="font-medium text-gray-900">
                          {address.firstName} {address.lastName}
                          {address.isDefault && <span className="ml-2 text-xs bg-purple-100 text-purple-600 px-2 py-1 rounded">Default</span>}
                        </p>
                        <p className="text-sm text-gray-600">📱 {address.phone}</p>
                        <p className="text-sm text-gray-600">🏠 {address.address}</p>
                        <p className="text-sm text-gray-600">📍 {address.city}, {address.district}</p>
                        <p className="text-sm text-gray-600">🌍 {address.country || 'Rwanda'}</p>
                        {address.instructions && (
                          <p className="text-sm text-gray-500 italic">💬 {address.instructions}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                <div className="bg-green-50 rounded-lg p-4 space-y-2">
                  <h5 className="font-semibold text-gray-900 mb-2">📊 Order Statistics</h5>
                  <p><span className="font-medium">🛍️ Total Orders:</span> {selectedCustomer.totalOrders || 0}</p>
                  <p><span className="font-medium">💰 Total Spent:</span> {(selectedCustomer.totalSpent || 0).toLocaleString()} RWF</p>
                  <p><span className="font-medium">📈 Average Order:</span> {selectedCustomer.totalOrders > 0 ? ((selectedCustomer.totalSpent || 0) / selectedCustomer.totalOrders).toLocaleString() : 0} RWF</p>
                  {selectedCustomer.lastLogin && (
                    <p><span className="font-medium">🕐 Last Login:</span> {new Date(selectedCustomer.lastLogin).toLocaleString()}</p>
                  )}
                </div>

                {selectedCustomer.preferences && (
                  <div className="bg-purple-50 rounded-lg p-4 space-y-2">
                    <h5 className="font-semibold text-gray-900 mb-2">⚙️ Preferences</h5>
                    {selectedCustomer.preferences.favoriteCategories && selectedCustomer.preferences.favoriteCategories.length > 0 && (
                      <p><span className="font-medium">❤️ Favorite Categories:</span> {selectedCustomer.preferences.favoriteCategories.join(', ')}</p>
                    )}
                    {selectedCustomer.preferences.favoriteColors && selectedCustomer.preferences.favoriteColors.length > 0 && (
                      <p><span className="font-medium">🎨 Favorite Colors:</span> {selectedCustomer.preferences.favoriteColors.join(', ')}</p>
                    )}
                    {selectedCustomer.preferences.size && (
                      <p><span className="font-medium">👕 Size:</span> {selectedCustomer.preferences.size}</p>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdvancedAdminDashboard;
