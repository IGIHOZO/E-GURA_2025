import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import {
  PencilIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  SparklesIcon,
  CheckIcon,
  XMarkIcon,
  ArrowPathIcon,
  ChartBarIcon,
  PlusIcon
} from '@heroicons/react/24/outline';
import ProductManager from './ProductManager';

const AdminProductsEnhanced = () => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [editingProduct, setEditingProduct] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showSEOModal, setShowSEOModal] = useState(false);
  const [seoGenerating, setSeoGenerating] = useState(false);
  const [showStockModal, setShowStockModal] = useState(false);
  const [stockAnalysis, setStockAnalysis] = useState(null);
  const [showProductManager, setShowProductManager] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const [pageSize] = useState(20); // Show 20 products per page

  // Fetch products on mount and when search changes
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProducts(1); // Reset to page 1 when search changes
    }, 300); // Debounce search
    
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  // Products are already filtered on server, just use them directly
  useEffect(() => {
    setFilteredProducts(products);
  }, [products]);

  const fetchProducts = async (page = 1) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      const res = await axios.get('/api/admin/products', {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          page,
          limit: pageSize,
          search: searchQuery || undefined
        }
      });
      const productsData = res.data.products || res.data.data || [];
      const total = res.data.total || res.data.pagination?.total || productsData.length;
      
      // Sort by stock quantity (low stock first)
      const sortedProducts = [...productsData].sort((a, b) => {
        const stockA = a.stockQuantity || 0;
        const stockB = b.stockQuantity || 0;
        return stockA - stockB; // Ascending order (low stock first)
      });
      
      setProducts(sortedProducts);
      setFilteredProducts(sortedProducts);
      setTotalProducts(total);
      setCurrentPage(page);
      console.log('✅ Loaded products:', productsData.length, 'of', total);
    } catch (error) {
      console.error('❌ Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  // Toggle product selection
  const toggleProductSelection = (productId) => {
    setSelectedProducts((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    );
  };

  // Select all products
  const toggleSelectAll = () => {
    if (selectedProducts.length === filteredProducts.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(filteredProducts.map((p) => p.id));
    }
  };

  // Edit product
  const handleEditProduct = (product) => {
    setEditingProduct({ ...product });
    setShowEditModal(true);
  };

  // Save edited product
  const handleSaveProduct = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const productId = editingProduct.id || editingProduct._id;
      
      console.log('Updating product:', productId, editingProduct);
      
      const res = await axios.put(
        `/api/admin/products/${productId}`,
        editingProduct,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log('Update response:', res.data);

      if (res.data.success) {
        await fetchProducts(currentPage);
        setShowEditModal(false);
        setEditingProduct(null);
        alert('✅ Product updated successfully!');
      } else {
        throw new Error(res.data.message || 'Update failed');
      }
    } catch (error) {
      console.error('❌ Error updating product:', error);
      console.error('Error details:', error.response?.data);
      alert('❌ Failed to update product: ' + (error.response?.data?.message || error.message));
    }
  };

  // Handle products update from ProductManager
  const handleProductsUpdate = async () => {
    await fetchProducts();
    setShowProductManager(false);
  };

  // Delete product
  const handleDeleteProduct = async (productId) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;

    try {
      const token = localStorage.getItem('adminToken');
      await axios.delete(`/api/admin/products/${productId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await fetchProducts(currentPage);
      alert('✅ Product deleted successfully!');
    } catch (error) {
      console.error('❌ Error deleting product:', error);
      alert('❌ Failed to delete product: ' + (error.response?.data?.message || error.message));
    }
  };

  // Generate AI SEO for selected products
  const handleBulkSEOGeneration = async () => {
    if (selectedProducts.length === 0) {
      alert('Please select at least one product');
      return;
    }

    setSeoGenerating(true);
    try {
      const token = localStorage.getItem('adminToken');
      const res = await axios.post(
        '/api/admin/products/bulk-seo-update',
        { productIds: selectedProducts },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.success) {
        alert(`SEO updated for ${res.data.updated} products!`);
        await fetchProducts();
        setSelectedProducts([]);
        setShowSEOModal(false);
      }
    } catch (error) {
      console.error('❌ SEO generation error:', error);
      alert('Failed to generate SEO');
    } finally {
      setSeoGenerating(false);
    }
  };

  // AI Stock Analysis
  const handleStockAnalysis = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const res = await axios.post('/api/admin/analyze-stock', {
        products: filteredProducts
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStockAnalysis(res.data);
      setShowStockModal(true);
    } catch (error) {
      console.error('❌ Stock analysis error:', error);
      alert('Failed to analyze stock');
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Product Management</h2>
        <p className="text-gray-600">Manage your products with search, edit, and AI features</p>
      </div>

      {/* Search and Actions Bar */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setShowProductManager(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg hover:from-orange-600 hover:to-red-600 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <PlusIcon className="h-5 w-5" />
              <span>Add Product</span>
            </button>
            
            <button
              onClick={handleStockAnalysis}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <ChartBarIcon className="h-5 w-5" />
              <span>AI Stock Analysis</span>
            </button>

            <button
              onClick={() => setShowSEOModal(true)}
              disabled={selectedProducts.length === 0}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                selectedProducts.length > 0
                  ? 'bg-purple-600 text-white hover:bg-purple-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              <SparklesIcon className="h-5 w-5" />
              <span>Generate AI SEO ({selectedProducts.length})</span>
            </button>
          </div>
        </div>

        {/* Selected count */}
        {selectedProducts.length > 0 && (
          <div className="mt-4 text-sm text-gray-600">
            {selectedProducts.length} product(s) selected
          </div>
        )}
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
            <p className="text-gray-600 mt-4">Loading products...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedProducts.length === filteredProducts.length && filteredProducts.length > 0}
                      onChange={toggleSelectAll}
                      className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stock
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    SEO Title
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedProducts.includes(product.id)}
                        onChange={() => toggleProductSelection(product.id)}
                        className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <img
                          src={product.mainImage || '/placeholder.png'}
                          alt={product.name}
                          className="h-10 w-10 rounded object-cover mr-3"
                        />
                        <div>
                          <div className="text-sm font-medium text-gray-900">{product.name}</div>
                          <div className="text-xs text-gray-500">{product.sku}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">{product.category}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {product.price?.toLocaleString()} RWF
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          product.stockQuantity > 10
                            ? 'bg-green-100 text-green-800'
                            : product.stockQuantity > 0
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {product.stockQuantity}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                      {product.seoTitle || 'No SEO title'}
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-medium">
                      <button
                        onClick={() => handleEditProduct(product)}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        <PencilIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(product.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredProducts.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500">No products found</p>
              </div>
            )}
          </div>
        )}
        
        {/* Pagination */}
        {!loading && totalProducts > pageSize && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing <span className="font-medium">{(currentPage - 1) * pageSize + 1}</span> to{' '}
              <span className="font-medium">{Math.min(currentPage * pageSize, totalProducts)}</span> of{' '}
              <span className="font-medium">{totalProducts}</span> products
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => fetchProducts(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              {[...Array(Math.ceil(totalProducts / pageSize))].map((_, i) => {
                const page = i + 1;
                if (
                  page === 1 ||
                  page === Math.ceil(totalProducts / pageSize) ||
                  (page >= currentPage - 2 && page <= currentPage + 2)
                ) {
                  return (
                    <button
                      key={page}
                      onClick={() => fetchProducts(page)}
                      className={`px-3 py-1 rounded ${
                        page === currentPage
                          ? 'bg-orange-600 text-white'
                          : 'border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  );
                } else if (page === currentPage - 3 || page === currentPage + 3) {
                  return <span key={page} className="px-2">...</span>;
                }
                return null;
              })}
              <button
                onClick={() => fetchProducts(currentPage + 1)}
                disabled={currentPage === Math.ceil(totalProducts / pageSize)}
                className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Edit Product Modal */}
      <AnimatePresence>
        {showEditModal && editingProduct && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              <h3 className="text-xl font-bold mb-4">Edit Product</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    type="text"
                    value={editingProduct.name || ''}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, name: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={editingProduct.description || ''}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, description: e.target.value })
                    }
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Price (RWF)</label>
                    <input
                      type="number"
                      value={editingProduct.price || ''}
                      onChange={(e) =>
                        setEditingProduct({ ...editingProduct, price: parseFloat(e.target.value) })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Stock</label>
                    <input
                      type="number"
                      value={editingProduct.stockQuantity || ''}
                      onChange={(e) =>
                        setEditingProduct({
                          ...editingProduct,
                          stockQuantity: parseInt(e.target.value)
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Main Image URL</label>
                  <input
                    type="url"
                    value={editingProduct.mainImage || ''}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, mainImage: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                    placeholder="https://example.com/image.jpg"
                  />
                  {editingProduct.mainImage && (
                    <img src={editingProduct.mainImage} alt="Preview" className="mt-2 h-20 w-20 object-cover rounded" />
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <input
                    type="text"
                    value={editingProduct.category || ''}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, category: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">SEO Title</label>
                  <input
                    type="text"
                    value={editingProduct.seoTitle || ''}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, seoTitle: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    SEO Description
                  </label>
                  <textarea
                    value={editingProduct.seoDescription || ''}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, seoDescription: e.target.value })
                    }
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveProduct}
                  className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
                >
                  Save Changes
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Product Manager Modal */}
      {showProductManager && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg w-full max-w-6xl my-8">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-2xl font-bold">Add New Product</h2>
              <button
                onClick={() => setShowProductManager(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            <div className="p-6">
              <ProductManager 
                products={products} 
                onProductsUpdate={handleProductsUpdate}
              />
            </div>
          </div>
        </div>
      )}

      {/* SEO Generation Modal */}
      <AnimatePresence>
        {showSEOModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-white rounded-lg p-6 max-w-md w-full"
            >
              <h3 className="text-xl font-bold mb-4 flex items-center">
                <SparklesIcon className="h-6 w-6 text-purple-600 mr-2" />
                AI SEO Generator
              </h3>

              <p className="text-gray-600 mb-6">
                Generate AI-powered SEO titles, descriptions, and keywords for{' '}
                <strong>{selectedProducts.length}</strong> selected product(s)?
              </p>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-blue-800">
                  <strong>What will be updated:</strong>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>SEO Title (optimized for search engines)</li>
                    <li>SEO Description (compelling meta description)</li>
                    <li>SEO Keywords (relevant keywords)</li>
                    <li>Meta Tags (Open Graph, Twitter Cards)</li>
                  </ul>
                </p>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowSEOModal(false)}
                  disabled={seoGenerating}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBulkSEOGeneration}
                  disabled={seoGenerating}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center space-x-2"
                >
                  {seoGenerating ? (
                    <>
                      <ArrowPathIcon className="h-5 w-5 animate-spin" />
                      <span>Generating...</span>
                    </>
                  ) : (
                    <>
                      <SparklesIcon className="h-5 w-5" />
                      <span>Generate SEO</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stock Analysis Modal */}
      <AnimatePresence>
        {showStockModal && stockAnalysis && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              <h3 className="text-xl font-bold mb-4 flex items-center">
                <ChartBarIcon className="h-6 w-6 text-blue-600 mr-2" />
                AI Stock Analysis
              </h3>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-red-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Out of Stock</p>
                  <p className="text-2xl font-bold text-red-600">
                    {stockAnalysis.lowStock?.filter((p) => p.stockQuantity === 0).length || 0}
                  </p>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Low Stock</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {stockAnalysis.lowStock?.filter((p) => p.stockQuantity > 0 && p.stockQuantity < 10).length || 0}
                  </p>
                </div>
              </div>

              {stockAnalysis.recommendations && stockAnalysis.recommendations.length > 0 && (
                <div className="mb-6">
                  <h4 className="font-semibold mb-3">AI Recommendations:</h4>
                  <div className="space-y-2">
                    {stockAnalysis.recommendations.map((rec, idx) => (
                      <div key={idx} className="bg-blue-50 p-3 rounded-lg text-sm">
                        {rec}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end">
                <button
                  onClick={() => setShowStockModal(false)}
                  className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminProductsEnhanced;
