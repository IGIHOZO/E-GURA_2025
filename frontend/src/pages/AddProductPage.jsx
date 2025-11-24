import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AddProductPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    stockQuantity: '',
    mainImage: '',
    category: '',
    subcategory: ''
  });
  
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Load categories on mount
  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const response = await axios.get('/api/categories/hierarchical/all');
      if (response.data.success) {
        setCategories(response.data.categories);
      }
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  const handleCategoryChange = async (categoryId) => {
    setFormData({ ...formData, category: categoryId, subcategory: '' });
    
    if (categoryId) {
      try {
        const response = await axios.get(
          `https://egura.rw/api/categories/hierarchical/${categoryId}/subcategories`
        );
        if (response.data.success) {
          setSubcategories(response.data.subcategories);
        }
      } catch (error) {
        console.error('Failed to load subcategories:', error);
        setSubcategories([]);
      }
    } else {
      setSubcategories([]);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });
    
    // Validation
    if (!formData.name || formData.name.length < 3) {
      setMessage({ type: 'error', text: 'Product name must be at least 3 characters' });
      return;
    }
    
    if (!formData.price || parseFloat(formData.price) <= 0) {
      setMessage({ type: 'error', text: 'Please enter a valid price' });
      return;
    }
    
    if (!formData.stockQuantity || parseInt(formData.stockQuantity) < 0) {
      setMessage({ type: 'error', text: 'Please enter a valid stock quantity' });
      return;
    }
    
    setLoading(true);
    
    try {
      console.log('Submitting product:', formData);
      
      const response = await axios.post(
        '/api/product-creation/create-product',
        {
          name: formData.name,
          description: formData.description,
          price: parseFloat(formData.price),
          stockQuantity: parseInt(formData.stockQuantity),
          mainImage: formData.mainImage,
          category: formData.category,
          subcategory: formData.subcategory
        }
      );
      
      if (response.data.success) {
        setMessage({ 
          type: 'success', 
          text: `✅ Product "${response.data.product.name}" created successfully!` 
        });
        
        console.log('Product created:', response.data.product);
        
        // Reset form
        setFormData({
          name: '',
          description: '',
          price: '',
          stockQuantity: '',
          mainImage: '',
          category: '',
          subcategory: ''
        });
        setSubcategories([]);
        
        // Scroll to top to see success message
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (error) {
      console.error('Error creating product:', error);
      const errorMsg = error.response?.data?.message || error.message || 'Failed to create product';
      setMessage({ type: 'error', text: '❌ ' + errorMsg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Add New Product</h1>
          <p className="text-gray-600 mt-2">Create a new product for your store</p>
        </div>

        {/* Message */}
        {message.text && (
          <div className={`rounded-lg p-4 mb-6 ${
            message.type === 'success' 
              ? 'bg-green-50 border border-green-200 text-green-800' 
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}>
            <p className="font-medium">{message.text}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 space-y-6">
          {/* Product Name */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Product Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., Elegant Summer Dress"
              required
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Category
            </label>
            <select
              value={formData.category}
              onChange={(e) => handleCategoryChange(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select a category</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>
                  {cat.icon} {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Subcategory */}
          {subcategories.length > 0 && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Subcategory
              </label>
              <select
                name="subcategory"
                value={formData.subcategory}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a subcategory (optional)</option>
                {subcategories.map(sub => (
                  <option key={sub.id} value={sub.id}>
                    {sub.icon} {sub.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Price and Stock */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Price (RWF) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="25000"
                min="1"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Stock Quantity <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="stockQuantity"
                value={formData.stockQuantity}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="10"
                min="0"
                required
              />
            </div>
          </div>

          {/* Image URL */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Image URL (Optional)
            </label>
            <input
              type="url"
              name="mainImage"
              value={formData.mainImage}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="https://example.com/image.jpg"
            />
            <p className="text-sm text-gray-500 mt-1">
              Leave empty to use a placeholder image
            </p>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Description (Optional)
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="4"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Describe your product..."
            />
          </div>

          {/* Submit Button */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={loading}
              className={`flex-1 py-4 px-6 rounded-lg text-white font-bold text-lg ${
                loading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'
              } transition-colors`}
            >
              {loading ? '⏳ Creating...' : '✅ Create Product'}
            </button>
            
            <button
              type="button"
              onClick={() => window.history.back()}
              className="px-6 py-4 border-2 border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </form>

        {/* Info Box */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">📝 Quick Tips:</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Product name must be at least 3 characters</li>
            <li>• Price must be greater than 0</li>
            <li>• Stock can be 0 (out of stock) or any positive number</li>
            <li>• Category and image are optional but recommended</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AddProductPage;
