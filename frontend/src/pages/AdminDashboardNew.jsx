import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChartBarIcon,
  ShoppingBagIcon,
  UserGroupIcon,
  CurrencyDollarIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  TruckIcon
} from '@heroicons/react/24/outline';
import { productsAPI, ordersAPI, userAPI, adminAPI } from '../services/api';
import axios from 'axios';

const AdminDashboardNew = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Data states
  const [analytics, setAnalytics] = useState(null);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  
  // Product management states
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    shortDescription: '',
    price: '',
    originalPrice: '',
    category: '',
    subcategory: '',
    brand: 'E-Gura Store',
    mainImage: '',
    images: [],
    gender: 'female',
    ageGroup: 'adult',
    material: [],
    sizes: [],
    colors: [],
    stockQuantity: 0,
    sku: '',
    isActive: true,
    isFeatured: false,
    isNew: false,
    isSale: false,
    tags: [],
    // Bargain settings
    bargainEnabled: true,
    minBargainPrice: '',
    maxBargainDiscount: 25,
    bargainStrategy: 'balanced' // 'aggressive', 'balanced', 'conservative'
  });
  
  // Search and filter
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  // Load data on mount
  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Load analytics
      const analyticsRes = await axios.get('/api/admin/analytics');
      setAnalytics(analyticsRes.data.data);
      
      // Load products
      const productsRes = await axios.get('/api/admin/products');
      setProducts(productsRes.data.data || []);
      
      // Load orders from backend AND localStorage
      const ordersRes = await axios.get('/api/admin/orders');
      const backendOrders = ordersRes.data.data || [];
      
      // Also load from localStorage (for orders placed through checkout)
      const localOrders = JSON.parse(localStorage.getItem('adminOrders') || '[]');
      
      // Merge and deduplicate by order ID
      const allOrders = [...backendOrders, ...localOrders];
      const uniqueOrders = allOrders.filter((order, index, self) =>
        index === self.findIndex(o => (o.id || o._id) === (order.id || order._id))
      );
      
      setOrders(uniqueOrders);
      console.log(`📦 Loaded ${uniqueOrders.length} orders (${backendOrders.length} from backend, ${localOrders.length} from localStorage)`);
      
      // Load users
      const usersRes = await axios.get('/api/admin/users');
      setUsers(usersRes.data.data || []);
      
      console.log('✅ Dashboard data loaded successfully');
    } catch (err) {
      console.error('Error loading dashboard data:', err);
      setError('Failed to load dashboard data. Please check if the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  // Auto-generate SEO content when product name changes
  const generateSEOContent = async (productName, category, price) => {
    if (!productName || productName.length < 3) return;
    
    try {
      console.log('🤖 Generating SEO content for:', productName);
      const response = await axios.post('/api/admin/generate-seo', {
        product: {
          name: productName,
          category: category || 'Fashion',
          price: price || 0
        }
      });
      
      if (response.data.success) {
        console.log('✅ SEO generated:', response.data);
        setProductForm(prev => ({
          ...prev,
          seoTitle: response.data.title || prev.seoTitle,
          description: response.data.description || prev.description,
          shortDescription: response.data.metaDescription || prev.shortDescription,
          tags: response.data.keywords ? response.data.keywords.split(',').map(k => k.trim()) : prev.tags
        }));
      }
    } catch (error) {
      console.error('SEO generation failed (non-blocking):', error);
      // Don't block product creation if SEO fails
    }
  };

  // Product CRUD operations
  const handleCreateProduct = async (e) => {
    e.preventDefault();
    
    try {
      // Generate SEO if not already set
      if (!productForm.description || productForm.description.length < 10) {
        await generateSEOContent(productForm.name, productForm.category, productForm.price);
      }
      
      const productData = {
        ...productForm,
        price: parseFloat(productForm.price),
        originalPrice: parseFloat(productForm.originalPrice) || parseFloat(productForm.price),
        stockQuantity: parseInt(productForm.stockQuantity),
        discountPercentage: productForm.originalPrice ? 
          Math.round(((parseFloat(productForm.originalPrice) - parseFloat(productForm.price)) / parseFloat(productForm.originalPrice)) * 100) : 0
      };
      
      const response = await axios.post('/api/admin/products', productData);
      
      if (response.data.success) {
        alert('✅ Product created successfully!');
        setProducts([...products, response.data.data]);
        setShowProductModal(false);
        resetProductForm();
        loadDashboardData(); // Reload to get fresh data
      }
    } catch (err) {
      console.error('Error creating product:', err);
      alert('❌ Failed to create product: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleUpdateProduct = async (e) => {
    e.preventDefault();
    
    try {
      const productData = {
        ...productForm,
        price: parseFloat(productForm.price),
        originalPrice: parseFloat(productForm.originalPrice) || parseFloat(productForm.price),
        stockQuantity: parseInt(productForm.stockQuantity),
        discountPercentage: productForm.originalPrice ? 
          Math.round(((parseFloat(productForm.originalPrice) - parseFloat(productForm.price)) / parseFloat(productForm.originalPrice)) * 100) : 0
      };
      
      const response = await axios.put(`https://egura.rw/api/admin/products/${editingProduct._id}`, productData);
      
      if (response.data.success) {
        alert('✅ Product updated successfully!');
        setProducts(products.map(p => p._id === editingProduct._id ? response.data.data : p));
        setShowProductModal(false);
        setEditingProduct(null);
        resetProductForm();
        loadDashboardData();
      }
    } catch (err) {
      console.error('Error updating product:', err);
      alert('❌ Failed to update product: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    
    try {
      const response = await axios.delete(`https://egura.rw/api/admin/products/${productId}`);
      
      if (response.data.success) {
        alert('✅ Product deleted successfully!');
        setProducts(products.filter(p => p._id !== productId));
        loadDashboardData();
      }
    } catch (err) {
      console.error('Error deleting product:', err);
      alert('❌ Failed to delete product: ' + (err.response?.data?.message || err.message));
    }
  };

  const openEditModal = (product) => {
    setEditingProduct(product);
    setProductForm({
      name: product.name || '',
      description: product.description || '',
      shortDescription: product.shortDescription || '',
      price: product.price || '',
      originalPrice: product.originalPrice || product.price || '',
      category: product.category || 'Dresses',
      subcategory: product.subcategory || '',
      brand: product.brand || 'E-Gura Store',
      mainImage: product.mainImage || '',
      images: product.images || [],
      gender: product.gender || 'female',
      ageGroup: product.ageGroup || 'adult',
      material: product.material || [],
      sizes: product.sizes || [],
      colors: product.colors || [],
      stockQuantity: product.stockQuantity || 0,
      sku: product.sku || '',
      isActive: product.isActive !== undefined ? product.isActive : true,
      isFeatured: product.isFeatured || false,
      isNew: product.isNew || false,
      isSale: product.isSale || false,
      tags: product.tags || [],
      // Bargain settings
      bargainEnabled: product.bargainEnabled !== undefined ? product.bargainEnabled : true,
      minBargainPrice: product.minBargainPrice || '',
      maxBargainDiscount: product.maxBargainDiscount || 25,
      bargainStrategy: product.bargainStrategy || 'balanced'
    });
    setShowProductModal(true);
  };

  const resetProductForm = () => {
    setProductForm({
      name: '',
      description: '',
      shortDescription: '',
      price: '',
      originalPrice: '',
      category: 'Dresses',
      subcategory: '',
      brand: 'E-Gura Store',
      mainImage: '',
      images: [],
      gender: 'female',
      ageGroup: 'adult',
      material: [],
      sizes: [],
      colors: [],
      stockQuantity: 0,
      sku: '',
      isActive: true,
      isFeatured: false,
      isNew: false,
      isSale: false,
      tags: [],
      // Bargain settings
      bargainEnabled: true,
      minBargainPrice: '',
      maxBargainDiscount: 25,
      bargainStrategy: 'balanced'
    });
  };

  // Filter products
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || product.category === filterCategory;
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'active' && product.isActive) ||
                         (filterStatus === 'inactive' && !product.isActive);
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md">
          <XCircleIcon className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Dashboard</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={loadDashboardData}
            className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-gray-600 mt-1">Manage your E-Gura Store</p>
            </div>
            <button
              onClick={loadDashboardData}
              className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-8">
            {[
              { id: 'overview', label: 'Overview', icon: ChartBarIcon },
              { id: 'products', label: 'Products', icon: ShoppingBagIcon },
              { id: 'orders', label: 'Orders', icon: TruckIcon },
              { id: 'users', label: 'Users', icon: UserGroupIcon }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-4 border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-purple-600 text-purple-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                <tab.icon className="h-5 w-5" />
                <span className="font-medium">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {[
                  {
                    title: 'Total Revenue',
                    value: `${analytics?.revenue?.total?.toLocaleString() || 0} RWF`,
                    change: '+12.5%',
                    icon: CurrencyDollarIcon,
                    color: 'purple'
                  },
                  {
                    title: 'Total Orders',
                    value: analytics?.orders?.total || 0,
                    change: '+8.2%',
                    icon: ShoppingBagIcon,
                    color: 'blue'
                  },
                  {
                    title: 'Total Products',
                    value: analytics?.products?.total || 0,
                    change: `${analytics?.products?.lowStock || 0} low stock`,
                    icon: ChartBarIcon,
                    color: 'green'
                  },
                  {
                    title: 'Total Users',
                    value: analytics?.users?.total || 0,
                    change: `${analytics?.users?.active || 0} active`,
                    icon: UserGroupIcon,
                    color: 'orange'
                  }
                ].map((stat, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-white rounded-xl shadow-sm p-6 border border-gray-100"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className={`w-12 h-12 bg-${stat.color}-100 rounded-lg flex items-center justify-center`}>
                        <stat.icon className={`h-6 w-6 text-${stat.color}-600`} />
                      </div>
                      <span className="text-sm text-green-600 font-medium flex items-center gap-1">
                        <ArrowUpIcon className="h-4 w-4" />
                        {stat.change}
                      </span>
                    </div>
                    <h3 className="text-gray-600 text-sm font-medium mb-1">{stat.title}</h3>
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  </motion.div>
                ))}
              </div>

              {/* Recent Activity */}
              <div className="grid md:grid-cols-2 gap-6">
                {/* Recent Orders */}
                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                  <h3 className="text-lg font-bold mb-4">Recent Orders</h3>
                  <div className="space-y-4">
                    {orders.slice(0, 5).map((order, index) => (
                      <div key={index} className="flex items-center justify-between py-3 border-b last:border-0">
                        <div>
                          <p className="font-medium">{order.orderNumber}</p>
                          <p className="text-sm text-gray-600">{order.shippingAddress?.firstName} {order.shippingAddress?.lastName}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">{order.total?.toLocaleString()} RWF</p>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            order.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                            order.status === 'processing' ? 'bg-blue-100 text-blue-700' :
                            order.status === 'shipped' ? 'bg-purple-100 text-purple-700' :
                            'bg-green-100 text-green-700'
                          }`}>
                            {order.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Low Stock Products */}
                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                  <h3 className="text-lg font-bold mb-4">Low Stock Alert</h3>
                  <div className="space-y-4">
                    {products.filter(p => p.stockQuantity < 10).slice(0, 5).map((product, index) => (
                      <div key={index} className="flex items-center justify-between py-3 border-b last:border-0">
                        <div className="flex items-center gap-3">
                          <img
                            src={product.mainImage}
                            alt={product.name}
                            className="w-12 h-12 rounded-lg object-cover"
                          />
                          <div>
                            <p className="font-medium">{product.name}</p>
                            <p className="text-sm text-gray-600">{product.category}</p>
                          </div>
                        </div>
                        <span className="text-red-600 font-semibold">{product.stockQuantity} left</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Products Tab */}
          {activeTab === 'products' && (
            <motion.div
              key="products"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              {/* Toolbar */}
              <div className="bg-white rounded-xl shadow-sm p-6 mb-6 border border-gray-100">
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                  <div className="flex-1 w-full md:w-auto">
                    <div className="relative">
                      <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search products..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                      />
                    </div>
                  </div>
                  
                  <div className="flex gap-3 w-full md:w-auto">
                    <select
                      value={filterCategory}
                      onChange={(e) => setFilterCategory(e.target.value)}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent"
                    >
                      <option value="all">All Categories</option>
                      <option value="Electronics">📱 Electronics</option>
                      <option value="Fashion">👗 Fashion & Clothing</option>
                      <option value="Home & Garden">🏠 Home & Garden</option>
                      <option value="Beauty & Health">💄 Beauty & Health</option>
                      <option value="Sports & Outdoors">⚽ Sports & Outdoors</option>
                      <option value="Toys & Games">🎮 Toys & Games</option>
                      <option value="Books & Media">📚 Books & Media</option>
                      <option value="Automotive">🚗 Automotive</option>
                      <option value="Jewelry & Watches">💍 Jewelry & Watches</option>
                      <option value="Food & Beverages">🍔 Food & Beverages</option>
                      <option value="Pet Supplies">🐾 Pet Supplies</option>
                      <option value="Office Supplies">📎 Office Supplies</option>
                      <option value="Baby & Kids">👶 Baby & Kids</option>
                      <option value="Tools & Hardware">🔧 Tools & Hardware</option>
                      <option value="Furniture">🛋️ Furniture</option>
                    </select>
                    
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                    >
                      <option value="all">All Status</option>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                    
                    <button
                      onClick={() => {
                        setEditingProduct(null);
                        resetProductForm();
                        setShowProductModal(true);
                      }}
                      className="flex items-center gap-2 bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors whitespace-nowrap"
                    >
                      <PlusIcon className="h-5 w-5" />
                      Add Product
                    </button>
                  </div>
                </div>
              </div>

              {/* Products Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProducts.map((product) => (
                  <motion.div
                    key={product._id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100 hover:shadow-lg transition-shadow"
                  >
                    <div className="relative aspect-square">
                      <img
                        src={product.mainImage}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-3 right-3 flex gap-2">
                        {product.isFeatured && (
                          <span className="bg-purple-500 text-white text-xs px-2 py-1 rounded-full">Featured</span>
                        )}
                        {product.isNew && (
                          <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full">New</span>
                        )}
                        {product.isSale && (
                          <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">Sale</span>
                        )}
                      </div>
                      <div className="absolute top-3 left-3">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          product.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                        }`}>
                          {product.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="p-4">
                      <h3 className="font-semibold text-lg mb-2 line-clamp-1">{product.name}</h3>
                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">{product.shortDescription}</p>
                      
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="text-xl font-bold text-purple-600">{product.price?.toLocaleString()} RWF</p>
                          {product.originalPrice && product.originalPrice > product.price && (
                            <p className="text-sm text-gray-500 line-through">{product.originalPrice.toLocaleString()} RWF</p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-600">Stock</p>
                          <p className={`font-semibold ${product.stockQuantity < 10 ? 'text-red-600' : 'text-green-600'}`}>
                            {product.stockQuantity}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <button
                          onClick={() => openEditModal(product)}
                          className="flex-1 flex items-center justify-center gap-2 bg-blue-50 text-blue-600 px-4 py-2 rounded-lg hover:bg-blue-100 transition-colors"
                        >
                          <PencilIcon className="h-4 w-4" />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(product._id)}
                          className="flex-1 flex items-center justify-center gap-2 bg-red-50 text-red-600 px-4 py-2 rounded-lg hover:bg-red-100 transition-colors"
                        >
                          <TrashIcon className="h-4 w-4" />
                          Delete
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {filteredProducts.length === 0 && (
                <div className="text-center py-12">
                  <ShoppingBagIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No products found</p>
                </div>
              )}
            </motion.div>
          )}

          {/* Orders Tab */}
          {activeTab === 'orders' && (
            <motion.div
              key="orders"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                <div className="p-6">
                  <h3 className="text-lg font-bold mb-4">All Orders</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-4">Order #</th>
                          <th className="text-left py-3 px-4">Customer</th>
                          <th className="text-left py-3 px-4">Items</th>
                          <th className="text-left py-3 px-4">Total</th>
                          <th className="text-left py-3 px-4">Status</th>
                          <th className="text-left py-3 px-4">Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orders.map((order, index) => (
                          <tr key={index} className="border-b hover:bg-gray-50">
                            <td className="py-3 px-4 font-medium">{order.orderNumber}</td>
                            <td className="py-3 px-4">
                              {order.shippingAddress?.firstName} {order.shippingAddress?.lastName}
                            </td>
                            <td className="py-3 px-4">{order.items?.length || 0} items</td>
                            <td className="py-3 px-4 font-semibold">{order.total?.toLocaleString()} RWF</td>
                            <td className="py-3 px-4">
                              <span className={`text-xs px-3 py-1 rounded-full ${
                                order.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                order.status === 'processing' ? 'bg-blue-100 text-blue-700' :
                                order.status === 'shipped' ? 'bg-purple-100 text-purple-700' :
                                'bg-green-100 text-green-700'
                              }`}>
                                {order.status}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-sm text-gray-600">
                              {new Date(order.createdAt).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Users Tab */}
          {activeTab === 'users' && (
            <motion.div
              key="users"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                <div className="p-6">
                  <h3 className="text-lg font-bold mb-4">All Users</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-4">Name</th>
                          <th className="text-left py-3 px-4">Email</th>
                          <th className="text-left py-3 px-4">Phone</th>
                          <th className="text-left py-3 px-4">Status</th>
                          <th className="text-left py-3 px-4">Joined</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.map((user, index) => (
                          <tr key={index} className="border-b hover:bg-gray-50">
                            <td className="py-3 px-4 font-medium">
                              {user.firstName} {user.lastName}
                            </td>
                            <td className="py-3 px-4">{user.email}</td>
                            <td className="py-3 px-4">{user.phone}</td>
                            <td className="py-3 px-4">
                              <span className={`text-xs px-3 py-1 rounded-full ${
                                user.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                              }`}>
                                {user.isActive ? 'Active' : 'Inactive'}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-sm text-gray-600">
                              {new Date(user.createdAt).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Product Modal */}
      <AnimatePresence>
        {showProductModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => {
              setShowProductModal(false);
              setEditingProduct(null);
              resetProductForm();
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">
                  {editingProduct ? 'Edit Product' : 'Add New Product'}
                </h2>
                <button
                  onClick={() => {
                    setShowProductModal(false);
                    setEditingProduct(null);
                    resetProductForm();
                  }}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>

              <form onSubmit={editingProduct ? handleUpdateProduct : handleCreateProduct} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Product Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Product Name *</label>
                    <input
                      type="text"
                      required
                      value={productForm.name}
                      onChange={(e) => setProductForm({...productForm, name: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                      placeholder="African Print Maxi Dress"
                    />
                  </div>

                  {/* SKU */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">SKU *</label>
                    <input
                      type="text"
                      required
                      value={productForm.sku}
                      onChange={(e) => setProductForm({...productForm, sku: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                      placeholder="AFR-DRESS-001"
                    />
                  </div>

                  {/* Price */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Price (RWF) *</label>
                    <input
                      type="number"
                      required
                      value={productForm.price}
                      onChange={(e) => setProductForm({...productForm, price: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                      placeholder="45000"
                    />
                  </div>

                  {/* Original Price */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Original Price (RWF)</label>
                    <input
                      type="number"
                      value={productForm.originalPrice}
                      onChange={(e) => setProductForm({...productForm, originalPrice: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                      placeholder="55000"
                    />
                  </div>

                  {/* Category */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Category *</label>
                    <select
                      required
                      value={productForm.category}
                      onChange={(e) => setProductForm({...productForm, category: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent"
                    >
                      <option value="">Select Category</option>
                      <option value="Electronics">📱 Electronics</option>
                      <option value="Fashion">👗 Fashion & Clothing</option>
                      <option value="Home & Garden">🏠 Home & Garden</option>
                      <option value="Beauty & Health">💄 Beauty & Health</option>
                      <option value="Sports & Outdoors">⚽ Sports & Outdoors</option>
                      <option value="Toys & Games">🎮 Toys & Games</option>
                      <option value="Books & Media">📚 Books & Media</option>
                      <option value="Automotive">🚗 Automotive</option>
                      <option value="Jewelry & Watches">💍 Jewelry & Watches</option>
                      <option value="Food & Beverages">🍔 Food & Beverages</option>
                      <option value="Pet Supplies">🐾 Pet Supplies</option>
                      <option value="Office Supplies">📎 Office Supplies</option>
                      <option value="Baby & Kids">👶 Baby & Kids</option>
                      <option value="Tools & Hardware">🔧 Tools & Hardware</option>
                      <option value="Furniture">🛋️ Furniture</option>
                    </select>
                  </div>

                  {/* Stock Quantity */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Stock Quantity *</label>
                    <input
                      type="number"
                      required
                      value={productForm.stockQuantity}
                      onChange={(e) => setProductForm({...productForm, stockQuantity: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                      placeholder="50"
                    />
                  </div>
                </div>

                {/* Short Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Short Description *</label>
                  <input
                    type="text"
                    required
                    value={productForm.shortDescription}
                    onChange={(e) => setProductForm({...productForm, shortDescription: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                    placeholder="Beautiful traditional African print maxi dress"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Full Description *</label>
                  <textarea
                    required
                    value={productForm.description}
                    onChange={(e) => setProductForm({...productForm, description: e.target.value})}
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                    placeholder="Detailed product description..."
                  />
                </div>

                {/* Main Image URL */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Main Media URL (Image or Video) *
                  </label>
                  <input
                    type="url"
                    required
                    value={productForm.mainImage}
                    onChange={(e) => setProductForm({...productForm, mainImage: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                    placeholder="https://images.unsplash.com/... or https://example.com/video.mp4"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    💡 Supports images (JPG, PNG, WebP) and videos (MP4, WebM, MOV)
                  </p>
                </div>

                {/* Bargain Settings Section */}
                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <span className="text-orange-600">💰</span>
                    AI Bargaining Settings
                  </h3>
                  
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
                    <p className="text-sm text-orange-800">
                      <strong>💡 Tip:</strong> Set minimum price and discount limits. Our AI will negotiate intelligently based on customer conversation while protecting your profit margins.
                    </p>
                  </div>

                  <div className="space-y-4">
                    {/* Enable Bargaining */}
                    <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <input
                        type="checkbox"
                        checked={productForm.bargainEnabled}
                        onChange={(e) => setProductForm({...productForm, bargainEnabled: e.target.checked})}
                        className="w-5 h-5 text-orange-600 rounded focus:ring-orange-600"
                      />
                      <div>
                        <span className="text-sm font-semibold text-gray-900">Enable AI Bargaining</span>
                        <p className="text-xs text-gray-600">Allow customers to negotiate price with AI assistant</p>
                      </div>
                    </label>

                    {productForm.bargainEnabled && (
                      <>
                        <div className="grid md:grid-cols-2 gap-4">
                          {/* Minimum Bargain Price */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Minimum Bargain Price (RWF) *
                            </label>
                            <input
                              type="number"
                              required={productForm.bargainEnabled}
                              value={productForm.minBargainPrice}
                              onChange={(e) => setProductForm({...productForm, minBargainPrice: e.target.value})}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-600 focus:border-transparent"
                              placeholder={productForm.price ? Math.floor(productForm.price * 0.75) : "30000"}
                            />
                            <p className="text-xs text-gray-500 mt-1">
                              Lowest price AI can accept (recommended: 75-80% of base price)
                            </p>
                          </div>

                          {/* Maximum Discount Percentage */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Max Discount % *
                            </label>
                            <input
                              type="number"
                              required={productForm.bargainEnabled}
                              min="5"
                              max="50"
                              value={productForm.maxBargainDiscount}
                              onChange={(e) => setProductForm({...productForm, maxBargainDiscount: e.target.value})}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-600 focus:border-transparent"
                              placeholder="25"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                              Maximum discount AI can offer (5-50%)
                            </p>
                          </div>
                        </div>

                        {/* Bargaining Strategy */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Bargaining Strategy *
                          </label>
                          <select
                            value={productForm.bargainStrategy}
                            onChange={(e) => setProductForm({...productForm, bargainStrategy: e.target.value})}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-600 focus:border-transparent"
                          >
                            <option value="aggressive">🔥 Aggressive - Quick deals, higher discounts (good for clearance)</option>
                            <option value="balanced">⚖️ Balanced - Smart negotiation, moderate discounts (recommended)</option>
                            <option value="conservative">🛡️ Conservative - Protect margins, minimal discounts (premium products)</option>
                          </select>
                          <div className="mt-2 p-3 bg-blue-50 rounded-lg">
                            <p className="text-xs text-blue-800">
                              {productForm.bargainStrategy === 'aggressive' && '🔥 AI will accept offers faster and give better discounts to close deals quickly.'}
                              {productForm.bargainStrategy === 'balanced' && '⚖️ AI will negotiate smartly, balancing customer satisfaction with profit margins.'}
                              {productForm.bargainStrategy === 'conservative' && '🛡️ AI will hold firm on pricing, offering minimal discounts to protect profit margins.'}
                            </p>
                          </div>
                        </div>

                        {/* Price Preview */}
                        {productForm.price && productForm.minBargainPrice && (
                          <div className="p-4 bg-gradient-to-r from-orange-50 to-red-50 rounded-lg border border-orange-200">
                            <h4 className="text-sm font-semibold text-gray-900 mb-2">💰 Bargaining Range Preview</h4>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span className="text-gray-700">Base Price:</span>
                                <span className="font-bold text-gray-900">{parseInt(productForm.price).toLocaleString()} RWF</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-700">Minimum Price:</span>
                                <span className="font-bold text-orange-600">{parseInt(productForm.minBargainPrice).toLocaleString()} RWF</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-700">Max Discount:</span>
                                <span className="font-bold text-red-600">{productForm.maxBargainDiscount}% ({Math.floor(productForm.price * productForm.maxBargainDiscount / 100).toLocaleString()} RWF)</span>
                              </div>
                              <div className="flex justify-between pt-2 border-t border-orange-300">
                                <span className="text-gray-700">Bargaining Range:</span>
                                <span className="font-bold text-green-600">
                                  {parseInt(productForm.minBargainPrice).toLocaleString()} - {parseInt(productForm.price).toLocaleString()} RWF
                                </span>
                              </div>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* Checkboxes */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 border-t">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={productForm.isActive}
                      onChange={(e) => setProductForm({...productForm, isActive: e.target.checked})}
                      className="w-5 h-5 text-purple-600 rounded focus:ring-purple-600"
                    />
                    <span className="text-sm font-medium">Active</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={productForm.isFeatured}
                      onChange={(e) => setProductForm({...productForm, isFeatured: e.target.checked})}
                      className="w-5 h-5 text-purple-600 rounded focus:ring-purple-600"
                    />
                    <span className="text-sm font-medium">Featured</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={productForm.isNew}
                      onChange={(e) => setProductForm({...productForm, isNew: e.target.checked})}
                      className="w-5 h-5 text-purple-600 rounded focus:ring-purple-600"
                    />
                    <span className="text-sm font-medium">New</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={productForm.isSale}
                      onChange={(e) => setProductForm({...productForm, isSale: e.target.checked})}
                      className="w-5 h-5 text-purple-600 rounded focus:ring-purple-600"
                    />
                    <span className="text-sm font-medium">On Sale</span>
                  </label>
                </div>

                {/* Buttons */}
                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowProductModal(false);
                      setEditingProduct(null);
                      resetProductForm();
                    }}
                    className="flex-1 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    {editingProduct ? 'Update Product' : 'Create Product'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminDashboardNew;
