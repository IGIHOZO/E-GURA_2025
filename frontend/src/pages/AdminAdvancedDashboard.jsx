import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChartBarIcon,
  CubeIcon,
  DocumentTextIcon,
  PhotoIcon,
  SparklesIcon,
  ExclamationTriangleIcon,
  ArrowTrendingUpIcon,
  ShoppingCartIcon,
  ClockIcon,
  CheckCircleIcon,
  PlusIcon,
  TrashIcon,
  PencilIcon,
  XMarkIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import axios from 'axios';

const AdminAdvancedDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [products, setProducts] = useState([]);
  const [stockAnalysis, setStockAnalysis] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [seoData, setSeoData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showProductForm, setShowProductForm] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: '',
    description: '',
    price: '',
    category: 'Dresses',
    stockQuantity: '',
    mainImage: '',
    colors: [],
    sizes: [],
    material: []
  });

  // Load products
  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const response = await axios.get('/api/products');
      setProducts(response.data.data || response.data || []);
    } catch (error) {
      console.error('Error loading products:', error);
    }
  };

  // Generate SEO for product
  const generateSEO = async (product) => {
    setLoading(true);
    try {
      console.log('Generating SEO for product:', product);
      
      const response = await axios.post('/api/admin/generate-seo', {
        product: product
      });
      
      console.log('SEO Response:', response.data);
      
      if (response.data.success === false) {
        throw new Error(response.data.error || 'SEO generation failed');
      }
      
      setSeoData(response.data);
      
      // Update product with SEO
      await axios.put(`https://egura.rw/api/admin/products/${product._id}`, {
        seoTitle: response.data.title,
        seoDescription: response.data.description,
        seoKeywords: response.data.keywords,
        metaTags: response.data.metaTags
      });
      
      alert('✅ SEO generated and saved successfully!');
      loadProducts();
    } catch (error) {
      console.error('Error generating SEO:', error);
      console.error('Error response:', error.response?.data);
      
      const errorMessage = error.response?.data?.error || error.message || 'Unknown error';
      alert(`❌ Error generating SEO: ${errorMessage}`);
    }
    setLoading(false);
  };

  // Analyze stock
  const analyzeStock = async () => {
    setLoading(true);
    try {
      const response = await axios.post('/api/admin/analyze-stock', {
        products: products
      });
      setStockAnalysis(response.data);
    } catch (error) {
      console.error('Error analyzing stock:', error);
    }
    setLoading(false);
  };

  // Load orders
  const loadOrders = async () => {
    try {
      const response = await axios.get('/api/admin/orders/all');
      setOrders(response.data.orders || []);
    } catch (error) {
      console.error('Error loading orders:', error);
    }
  };

  // Create product
  const createProduct = async () => {
    setLoading(true);
    try {
      const response = await axios.post('/api/admin/products/create', newProduct);
      alert('Product created successfully!');
      setShowProductForm(false);
      loadProducts();
      // Reset form
      setNewProduct({
        name: '',
        description: '',
        price: '',
        category: 'Dresses',
        stockQuantity: '',
        mainImage: '',
        colors: [],
        sizes: [],
        material: []
      });
    } catch (error) {
      console.error('Error creating product:', error);
      alert('Error creating product: ' + (error.response?.data?.error || error.message));
    }
    setLoading(false);
  };

  // Tabs
  const tabs = [
    { id: 'overview', name: 'Overview', icon: ChartBarIcon },
    { id: 'products', name: 'Add Product', icon: CubeIcon },
    { id: 'orders', name: 'Orders', icon: ShoppingCartIcon },
    { id: 'seo', name: 'SEO Generator', icon: SparklesIcon },
    { id: 'stock', name: 'AI Stock Manager', icon: CubeIcon },
    { id: 'media', name: 'Media Upload', icon: PhotoIcon },
    { id: 'analytics', name: 'Analytics', icon: ArrowTrendingUpIcon }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-600 to-orange-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold">Advanced AI Admin Dashboard</h1>
          <p className="text-red-100 mt-2">Powered by AI - Rwanda/Kigali Optimized</p>
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
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
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
            
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-lg shadow p-6"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Products</p>
                    <p className="text-3xl font-bold text-gray-900">{products.length}</p>
                  </div>
                  <CubeIcon className="h-12 w-12 text-blue-500" />
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-lg shadow p-6"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Low Stock</p>
                    <p className="text-3xl font-bold text-orange-600">
                      {products.filter(p => p.stockQuantity <= 10).length}
                    </p>
                  </div>
                  <ExclamationTriangleIcon className="h-12 w-12 text-orange-500" />
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-lg shadow p-6"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Out of Stock</p>
                    <p className="text-3xl font-bold text-red-600">
                      {products.filter(p => p.stockQuantity === 0).length}
                    </p>
                  </div>
                  <ClockIcon className="h-12 w-12 text-red-500" />
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white rounded-lg shadow p-6"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Value</p>
                    <p className="text-3xl font-bold text-green-600">
                      {(products.reduce((sum, p) => sum + (p.price * p.stockQuantity), 0)).toLocaleString()} RWF
                    </p>
                  </div>
                  <ShoppingCartIcon className="h-12 w-12 text-green-500" />
                </div>
              </motion.div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  onClick={() => setActiveTab('seo')}
                  className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-lg hover:border-red-500 hover:bg-red-50 transition-colors"
                >
                  <SparklesIcon className="h-8 w-8 text-red-600" />
                  <div className="text-left">
                    <p className="font-semibold text-gray-900">Generate SEO</p>
                    <p className="text-sm text-gray-600">Optimize for Kigali/Rwanda</p>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setActiveTab('stock');
                    analyzeStock();
                  }}
                  className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition-colors"
                >
                  <CubeIcon className="h-8 w-8 text-orange-600" />
                  <div className="text-left">
                    <p className="font-semibold text-gray-900">Analyze Stock</p>
                    <p className="text-sm text-gray-600">AI-powered insights</p>
                  </div>
                </button>

                <button
                  onClick={() => setActiveTab('media')}
                  className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
                >
                  <PhotoIcon className="h-8 w-8 text-blue-600" />
                  <div className="text-left">
                    <p className="font-semibold text-gray-900">Upload Media</p>
                    <p className="text-sm text-gray-600">3 images + video</p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* SEO Generator Tab */}
        {activeTab === 'seo' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Rwanda/Kigali SEO Generator</h2>
              <button
                onClick={() => {
                  products.forEach(product => generateSEO(product));
                }}
                className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors"
              >
                Generate SEO for All Products
              </button>
            </div>

            {/* Product List */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">SEO Status</th>
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
                            <p className="text-sm text-gray-500">{product.price?.toLocaleString()} RWF</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">{product.category}</td>
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
                          onClick={() => {
                            setSelectedProduct(product);
                            generateSEO(product);
                          }}
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

            {/* SEO Preview */}
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
                        <span
                          key={idx}
                          className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm"
                        >
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

        {/* Stock Manager Tab */}
        {activeTab === 'stock' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">AI Stock Management</h2>
              <button
                onClick={analyzeStock}
                disabled={loading}
                className="bg-orange-600 text-white px-6 py-2 rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50"
              >
                {loading ? 'Analyzing...' : 'Analyze Stock'}
              </button>
            </div>

            {stockAnalysis && (
              <>
                {/* Alerts */}
                {stockAnalysis.recommendations?.map((rec, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className={`
                      p-4 rounded-lg border-l-4
                      ${rec.priority === 'CRITICAL' ? 'bg-red-50 border-red-500' : ''}
                      ${rec.priority === 'HIGH' ? 'bg-orange-50 border-orange-500' : ''}
                      ${rec.priority === 'MEDIUM' ? 'bg-yellow-50 border-yellow-500' : ''}
                      ${rec.priority === 'LOW' ? 'bg-blue-50 border-blue-500' : ''}
                    `}
                  >
                    <div className="flex items-start">
                      <ExclamationTriangleIcon className={`
                        h-6 w-6 mr-3
                        ${rec.priority === 'CRITICAL' ? 'text-red-600' : ''}
                        ${rec.priority === 'HIGH' ? 'text-orange-600' : ''}
                        ${rec.priority === 'MEDIUM' ? 'text-yellow-600' : ''}
                        ${rec.priority === 'LOW' ? 'text-blue-600' : ''}
                      `} />
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">{rec.message}</p>
                        <p className="text-sm text-gray-600 mt-1">Action: {rec.action}</p>
                        {rec.products && rec.products.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {rec.products.slice(0, 3).map((name, i) => (
                              <span key={i} className="text-xs bg-white px-2 py-1 rounded border">
                                {name}
                              </span>
                            ))}
                            {rec.products.length > 3 && (
                              <span className="text-xs text-gray-500">
                                +{rec.products.length - 3} more
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}

                {/* Stock Categories */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                    <p className="text-sm text-red-600 font-medium">Out of Stock</p>
                    <p className="text-3xl font-bold text-red-700 mt-2">
                      {stockAnalysis.outOfStock?.length || 0}
                    </p>
                  </div>
                  <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                    <p className="text-sm text-orange-600 font-medium">Critical</p>
                    <p className="text-3xl font-bold text-orange-700 mt-2">
                      {stockAnalysis.critical?.length || 0}
                    </p>
                  </div>
                  <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                    <p className="text-sm text-yellow-600 font-medium">Low Stock</p>
                    <p className="text-3xl font-bold text-yellow-700 mt-2">
                      {stockAnalysis.low?.length || 0}
                    </p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                    <p className="text-sm text-green-600 font-medium">Optimal</p>
                    <p className="text-3xl font-bold text-green-700 mt-2">
                      {stockAnalysis.optimal?.length || 0}
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Media Upload Tab */}
        {activeTab === 'media' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Media Upload (3 Images + Video)</h2>
            
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-gray-600 mb-4">Upload up to 3 images and 1 video per product</p>
              
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <PhotoIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Drag and drop images here, or click to browse</p>
                <p className="text-sm text-gray-500 mt-2">Supports: JPG, PNG, WebP (Max 3 images)</p>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  className="hidden"
                  id="image-upload"
                />
                <label
                  htmlFor="image-upload"
                  className="mt-4 inline-block bg-red-600 text-white px-6 py-2 rounded-lg cursor-pointer hover:bg-red-700"
                >
                  Choose Images
                </label>
              </div>

              <div className="mt-6 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Upload product video</p>
                <p className="text-sm text-gray-500 mt-2">Supports: MP4, WebM (Max 50MB)</p>
                <input
                  type="file"
                  accept="video/*"
                  className="hidden"
                  id="video-upload"
                />
                <label
                  htmlFor="video-upload"
                  className="mt-4 inline-block bg-blue-600 text-white px-6 py-2 rounded-lg cursor-pointer hover:bg-blue-700"
                >
                  Choose Video
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">AI-Powered Analytics</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Sales Velocity</h3>
                <div className="h-64 flex items-center justify-center text-gray-400">
                  Chart coming soon...
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Demand Forecast</h3>
                <div className="h-64 flex items-center justify-center text-gray-400">
                  Chart coming soon...
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminAdvancedDashboard;
