import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChartBarIcon,
  CubeIcon,
  SparklesIcon,
  ShoppingCartIcon,
  PlusIcon,
  TrashIcon,
  PencilIcon,
  XMarkIcon,
  EyeIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import axios from 'axios';

const API_URL = '/api';

const AdminDashboardComplete = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [loading, setLoading] = useState(false);
  const [seoData, setSeoData] = useState(null);
  
  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    price: '',
    category: 'Dresses',
    stockQuantity: '',
    mainImage: '',
    image1: '',
    image2: '',
    image3: '',
    colors: '',
    sizes: '',
    material: '',
    gender: 'female',
    // SEO Fields
    seoTitle: '',
    seoDescription: '',
    seoKeywords: '',
    shortDescription: ''
  });
  
  const [generatingAI, setGeneratingAI] = useState(false);

  // Load data on mount
  useEffect(() => {
    loadProducts();
    loadOrders();
  }, []);

  // Load products
  const loadProducts = async () => {
    try {
      const response = await axios.get(`${API_URL}/products`);
      setProducts(response.data.data || response.data || []);
    } catch (error) {
      console.error('Error loading products:', error);
    }
  };

  // Load orders
  const loadOrders = async () => {
    try {
      const response = await axios.get(`${API_URL}/admin/orders/all`);
      setOrders(response.data.orders || []);
    } catch (error) {
      console.error('Error loading orders:', error);
    }
  };

  // Create/Update Product
  const saveProduct = async () => {
    setLoading(true);
    try {
      // Validate required fields
      if (!productForm.name || !productForm.name.trim()) {
        alert('❌ Product name is required');
        setLoading(false);
        return;
      }
      
      if (!productForm.description || !productForm.description.trim()) {
        alert('❌ Product description is required');
        setLoading(false);
        return;
      }
      
      if (!productForm.price || parseFloat(productForm.price) <= 0) {
        alert('❌ Valid product price is required');
        setLoading(false);
        return;
      }
      
      if (!productForm.mainImage || !productForm.mainImage.trim()) {
        alert('❌ Product main image URL is required');
        setLoading(false);
        return;
      }
      
      // Parse images from textarea (one URL per line)
      const imageUrls = productForm.images 
        ? productForm.images.split('\n').map(url => url.trim()).filter(url => url).slice(0, 3)
        : [];
      
      const productData = {
        ...productForm,
        price: parseFloat(productForm.price),
        stockQuantity: parseInt(productForm.stockQuantity) || 0,
        colors: productForm.colors ? productForm.colors.split(',').map(c => c.trim()).filter(c => c) : [],
        sizes: productForm.sizes ? productForm.sizes.split(',').map(s => s.trim()).filter(s => s) : [],
        material: productForm.material ? productForm.material.split(',').map(m => m.trim()).filter(m => m) : [],
        images: imageUrls,
        // SEO Fields - convert keywords to array
        seoKeywords: productForm.seoKeywords ? productForm.seoKeywords.split(',').map(k => k.trim()).filter(k => k) : [],
        seoTitle: productForm.seoTitle || undefined,
        seoDescription: productForm.seoDescription || undefined,
        shortDescription: productForm.shortDescription || undefined
      };
      
      console.log('📦 Sending product data:', productData);

      let response;
      if (editingProduct) {
        response = await axios.put(`${API_URL}/products/${editingProduct._id}`, productData);
      } else {
        response = await axios.post(`${API_URL}/admin/products/create`, productData);
      }

      // Check if response indicates success
      if (response.data.success === false) {
        throw new Error(response.data.error || 'Failed to save product');
      }

      alert(editingProduct ? '✅ Product updated successfully!' : '✅ Product created successfully!');
      setShowProductModal(false);
      setEditingProduct(null);
      resetForm();
      loadProducts();
    } catch (error) {
      console.error('Error saving product:', error);
      console.error('Error response:', error.response?.data);
      
      // Get the most specific error message
      const errorMessage = error.response?.data?.error 
        || error.response?.data?.message 
        || error.message 
        || 'Failed to save product';
      
      alert('❌ Failed to create product: ' + errorMessage);
    }
    setLoading(false);
  };

  // Delete Product
  const deleteProduct = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    
    try {
      await axios.delete(`${API_URL}/products/${id}`);
      alert('✅ Product deleted successfully!');
      loadProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('❌ Error deleting product');
    }
  };

  // Generate SEO
  const generateSEO = async (product) => {
    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/admin/generate-seo`, { product });
      
      if (response.data.success === false) {
        throw new Error(response.data.error);
      }

      setSeoData(response.data);

      // Update product with SEO
      await axios.put(`${API_URL}/products/${product._id}`, {
        seoTitle: response.data.title,
        seoDescription: response.data.description,
        seoKeywords: response.data.keywords
      });

      alert('✅ SEO generated and saved!');
      loadProducts();
    } catch (error) {
      console.error('Error generating SEO:', error);
      alert('❌ Error: ' + (error.response?.data?.error || error.message));
    }
    setLoading(false);
  };

  // Update Order Status
  const updateOrderStatus = async (orderId, status) => {
    try {
      await axios.put(`${API_URL}/admin/orders/${orderId}/status`, { status });
      alert('✅ Order status updated!');
      loadOrders();
      if (selectedOrder?._id === orderId) {
        setSelectedOrder({ ...selectedOrder, status });
      }
    } catch (error) {
      console.error('Error updating order:', error);
      alert('❌ Error updating order');
    }
  };

  // Reset form
  const resetForm = () => {
    setProductForm({
      name: '',
      description: '',
      price: '',
      category: 'Dresses',
      stockQuantity: '',
      mainImage: '',
      colors: '',
      sizes: '',
      material: '',
      gender: 'female'
    });
  };

  // Edit product
  const editProduct = (product) => {
    setEditingProduct(product);
    setProductForm({
      name: product.name || '',
      description: product.description || '',
      price: product.price || '',
      category: product.category || 'Dresses',
      stockQuantity: product.stockQuantity || '',
      mainImage: product.mainImage || '',
      colors: product.colors?.join(', ') || '',
      sizes: product.sizes?.join(', ') || '',
      material: product.material?.join(', ') || '',
      gender: product.gender || 'female'
    });
    setShowProductModal(true);
  };

  const tabs = [
    { id: 'overview', name: 'Overview', icon: ChartBarIcon },
    { id: 'products', name: 'Products', icon: CubeIcon },
    { id: 'orders', name: 'Orders', icon: ShoppingCartIcon },
    { id: 'seo', name: 'SEO Generator', icon: SparklesIcon }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-600 to-orange-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold">Advanced Admin Dashboard</h1>
          <p className="text-red-100 mt-2">Complete Product & Order Management</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm
                    ${activeTab === tab.id
                      ? 'border-red-500 text-red-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                    }
                  `}
                >
                  <Icon className="h-5 w-5" />
                  {tab.name}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Dashboard Overview</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-lg shadow p-6"
              >
                <p className="text-sm text-gray-600">Total Products</p>
                <p className="text-3xl font-bold text-gray-900">{products.length}</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-lg shadow p-6"
              >
                <p className="text-sm text-gray-600">Total Orders</p>
                <p className="text-3xl font-bold text-blue-600">{orders.length}</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-lg shadow p-6"
              >
                <p className="text-sm text-gray-600">Low Stock</p>
                <p className="text-3xl font-bold text-orange-600">
                  {products.filter(p => p.stockQuantity <= 10).length}
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white rounded-lg shadow p-6"
              >
                <p className="text-sm text-gray-600">Revenue</p>
                <p className="text-3xl font-bold text-green-600">
                  {orders.reduce((sum, o) => sum + (o.total || 0), 0).toLocaleString()} RWF
                </p>
              </motion.div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={() => setActiveTab('products')}
                className="flex items-center gap-3 p-4 bg-white border-2 border-gray-200 rounded-lg hover:border-red-500 hover:bg-red-50 transition-colors"
              >
                <CubeIcon className="h-8 w-8 text-red-600" />
                <div className="text-left">
                  <p className="font-semibold text-gray-900">Manage Products</p>
                  <p className="text-sm text-gray-600">Add, edit, delete products</p>
                </div>
              </button>

              <button
                onClick={() => setActiveTab('orders')}
                className="flex items-center gap-3 p-4 bg-white border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
              >
                <ShoppingCartIcon className="h-8 w-8 text-blue-600" />
                <div className="text-left">
                  <p className="font-semibold text-gray-900">View Orders</p>
                  <p className="text-sm text-gray-600">Manage customer orders</p>
                </div>
              </button>

              <button
                onClick={() => setActiveTab('seo')}
                className="flex items-center gap-3 p-4 bg-white border-2 border-gray-200 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors"
              >
                <SparklesIcon className="h-8 w-8 text-purple-600" />
                <div className="text-left">
                  <p className="font-semibold text-gray-900">Generate SEO</p>
                  <p className="text-sm text-gray-600">Rwanda/Kigali optimized</p>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Products Tab */}
        {activeTab === 'products' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Products Management</h2>
              <button
                onClick={() => {
                  resetForm();
                  setEditingProduct(null);
                  setShowProductModal(true);
                }}
                className="flex items-center gap-2 bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors"
              >
                <PlusIcon className="h-5 w-5" />
                Add Product
              </button>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {products.map((product) => (
                    <tr key={product._id}>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <img
                            src={product.mainImage}
                            alt={product.name}
                            className="h-10 w-10 rounded object-cover"
                          />
                          <div className="ml-4">
                            <p className="text-sm font-medium text-gray-900">{product.name}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">{product.category}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{product.price?.toLocaleString()} RWF</td>
                      <td className="px-6 py-4">
                        <span className={`
                          inline-flex px-2 py-1 text-xs font-semibold rounded-full
                          ${product.stockQuantity === 0 ? 'bg-red-100 text-red-800' :
                            product.stockQuantity <= 10 ? 'bg-orange-100 text-orange-800' :
                            'bg-green-100 text-green-800'}
                        `}>
                          {product.stockQuantity}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm space-x-2">
                        <button
                          onClick={() => editProduct(product)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <PencilIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => deleteProduct(product._id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Orders Management</h2>

            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order #</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {orders.map((order) => (
                    <tr key={order._id}>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{order.orderNumber}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {order.shippingAddress?.firstName} {order.shippingAddress?.lastName}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">{order.total?.toLocaleString()} RWF</td>
                      <td className="px-6 py-4">
                        <select
                          value={order.status}
                          onChange={(e) => updateOrderStatus(order._id, e.target.value)}
                          className="text-sm border rounded px-2 py-1"
                        >
                          <option value="pending">Pending</option>
                          <option value="confirmed">Confirmed</option>
                          <option value="processing">Processing</option>
                          <option value="shipped">Shipped</option>
                          <option value="delivered">Delivered</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <EyeIcon className="h-5 w-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* SEO Tab */}
        {activeTab === 'seo' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Rwanda/Kigali SEO Generator</h2>

            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">SEO Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {products.map((product) => (
                    <tr key={product._id}>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <img src={product.mainImage} alt={product.name} className="h-10 w-10 rounded object-cover" />
                          <div className="ml-4">
                            <p className="text-sm font-medium text-gray-900">{product.name}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {product.seoTitle ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <CheckCircleIcon className="h-4 w-4 mr-1" />
                            Optimized
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            Not Optimized
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => generateSEO(product)}
                          disabled={loading}
                          className="text-red-600 hover:text-red-900 font-medium text-sm disabled:opacity-50"
                        >
                          {loading ? 'Generating...' : 'Generate SEO'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {seoData && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-lg shadow p-6"
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Generated SEO Preview</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">SEO Title</label>
                    <div className="p-3 bg-gray-50 rounded border border-gray-200">
                      <p className="text-blue-600 font-medium">{seoData.title}</p>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">SEO Description</label>
                    <div className="p-3 bg-gray-50 rounded border border-gray-200">
                      <p className="text-gray-700">{seoData.description}</p>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Keywords</label>
                    <div className="flex flex-wrap gap-2">
                      {seoData.keywords?.map((keyword, idx) => (
                        <span key={idx} className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm">
                          {keyword}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        )}
      </div>

      {/* Product Modal */}
      <AnimatePresence>
        {showProductModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowProductModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold text-gray-900">
                    {editingProduct ? 'Edit Product' : 'Add New Product'}
                  </h3>
                  <button
                    onClick={() => setShowProductModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Product Name *</label>
                    <input
                      type="text"
                      value={productForm.name}
                      onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      placeholder="e.g., African Print Maxi Dress"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
                    <textarea
                      value={productForm.description}
                      onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      placeholder="Product description..."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Price (RWF) *</label>
                      <input
                        type="number"
                        value={productForm.price}
                        onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                        placeholder="45000"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Stock Quantity *</label>
                      <input
                        type="number"
                        value={productForm.stockQuantity}
                        onChange={(e) => setProductForm({ ...productForm, stockQuantity: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                        placeholder="10"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Category *</label>
                      <select
                        value={productForm.category}
                        onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      >
                        <option value="Dresses">Dresses</option>
                        <option value="Jackets">Jackets</option>
                        <option value="Shirts">Shirts</option>
                        <option value="Pants">Pants</option>
                        <option value="Skirts">Skirts</option>
                        <option value="Shoes">Shoes</option>
                        <option value="Bags">Bags</option>
                        <option value="Accessories">Accessories</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Gender</label>
                      <select
                        value={productForm.gender}
                        onChange={(e) => setProductForm({ ...productForm, gender: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      >
                        <option value="female">Female</option>
                        <option value="male">Male</option>
                        <option value="unisex">Unisex</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Main Image URL *</label>
                    <input
                      type="text"
                      value={productForm.mainImage}
                      onChange={(e) => setProductForm({ ...productForm, mainImage: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      placeholder="https://example.com/image.jpg"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Additional Images (one URL per line, up to 3)</label>
                    <textarea
                      value={productForm.images || ''}
                      onChange={(e) => setProductForm({ ...productForm, images: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      placeholder="https://example.com/image1.jpg&#10;https://example.com/image2.jpg&#10;https://example.com/image3.jpg"
                      rows="3"
                    />
                    <p className="text-xs text-gray-500 mt-1">Paste one image URL per line (maximum 3 images)</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Colors (comma-separated)</label>
                    <input
                      type="text"
                      value={productForm.colors}
                      onChange={(e) => setProductForm({ ...productForm, colors: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      placeholder="blue, red, green"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Sizes (comma-separated)</label>
                    <input
                      type="text"
                      value={productForm.sizes}
                      onChange={(e) => setProductForm({ ...productForm, sizes: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      placeholder="S, M, L, XL"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Materials (comma-separated)</label>
                    <input
                      type="text"
                      value={productForm.material}
                      onChange={(e) => setProductForm({ ...productForm, material: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      placeholder="cotton, silk, polyester"
                    />
                  </div>

                  {/* SEO Fields Section */}
                  <div className="border-t pt-4 mt-4">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">SEO Settings (Optional)</h4>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">SEO Title</label>
                      <input
                        type="text"
                        value={productForm.seoTitle || ''}
                        onChange={(e) => setProductForm({ ...productForm, seoTitle: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                        placeholder="e.g., Buy African Print Maxi Dress | E-Gura Store"
                      />
                      <p className="text-xs text-gray-500 mt-1">Recommended: 50-60 characters</p>
                    </div>

                    <div className="mt-3">
                      <label className="block text-sm font-medium text-gray-700 mb-2">SEO Description</label>
                      <textarea
                        value={productForm.seoDescription || ''}
                        onChange={(e) => setProductForm({ ...productForm, seoDescription: e.target.value })}
                        rows={2}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                        placeholder="e.g., Shop beautiful African Print Maxi Dress in Kigali, Rwanda. Premium quality, free shipping..."
                      />
                      <p className="text-xs text-gray-500 mt-1">Recommended: 150-160 characters</p>
                    </div>

                    <div className="mt-3">
                      <label className="block text-sm font-medium text-gray-700 mb-2">SEO Keywords (comma-separated)</label>
                      <input
                        type="text"
                        value={productForm.seoKeywords || ''}
                        onChange={(e) => setProductForm({ ...productForm, seoKeywords: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                        placeholder="e.g., african dress, maxi dress, kigali fashion, rwanda clothing"
                      />
                    </div>

                    <div className="mt-3">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Short Description</label>
                      <textarea
                        value={productForm.shortDescription || ''}
                        onChange={(e) => setProductForm({ ...productForm, shortDescription: e.target.value })}
                        rows={2}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                        placeholder="Brief product summary for listings..."
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 mt-6">
                  <button
                    onClick={saveProduct}
                    disabled={loading}
                    className="flex-1 bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 transition-colors disabled:opacity-50"
                  >
                    {loading ? 'Saving...' : editingProduct ? 'Update Product' : 'Create Product'}
                  </button>
                  <button
                    onClick={() => setShowProductModal(false)}
                    className="px-6 py-3 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Order Details Modal */}
      <AnimatePresence>
        {selectedOrder && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedOrder(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold text-gray-900">Order Details</h3>
                  <button
                    onClick={() => setSelectedOrder(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Order Number</p>
                      <p className="font-semibold">{selectedOrder.orderNumber}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Status</p>
                      <p className="font-semibold capitalize">{selectedOrder.status}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Total Amount</p>
                      <p className="font-semibold">{selectedOrder.total?.toLocaleString()} RWF</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Payment Method</p>
                      <p className="font-semibold capitalize">{selectedOrder.paymentMethod}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600 mb-2">Customer Information</p>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="font-semibold">
                        {selectedOrder.shippingAddress?.firstName} {selectedOrder.shippingAddress?.lastName}
                      </p>
                      <p className="text-sm text-gray-600">{selectedOrder.shippingAddress?.email}</p>
                      <p className="text-sm text-gray-600">{selectedOrder.shippingAddress?.phone}</p>
                      <p className="text-sm text-gray-600 mt-2">{selectedOrder.shippingAddress?.address}</p>
                      <p className="text-sm text-gray-600">
                        {selectedOrder.shippingAddress?.city}, {selectedOrder.shippingAddress?.district}
                      </p>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600 mb-2">Order Items</p>
                    <div className="space-y-2">
                      {selectedOrder.items?.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-4 bg-gray-50 p-3 rounded-lg">
                          <img
                            src={item.product?.mainImage}
                            alt={item.product?.name}
                            className="h-16 w-16 rounded object-cover"
                          />
                          <div className="flex-1">
                            <p className="font-semibold">{item.product?.name}</p>
                            <p className="text-sm text-gray-600">
                              Quantity: {item.quantity} × {item.price?.toLocaleString()} RWF
                            </p>
                          </div>
                          <p className="font-semibold">
                            {(item.quantity * item.price).toLocaleString()} RWF
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminDashboardComplete;
