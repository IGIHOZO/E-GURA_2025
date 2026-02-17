import React, { useState, useEffect } from 'react';
import axios from 'axios';

const SimpleProductForm = ({ onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    stockQuantity: '',
    mainImage: '',
    category: '',
    subcategory: ''
  });
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await axios.get('/api/categories/hierarchical/all');
      if (response.data.success) {
        setCategories(response.data.categories);
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const handleCategoryChange = async (categoryId) => {
    setFormData(prev => ({ ...prev, category: categoryId, subcategory: '' }));
    
    if (categoryId) {
      try {
        const response = await axios.get(
          `https://egura.rw/api/categories/hierarchical/${categoryId}/subcategories`
        );
        if (response.data.success) {
          setSubcategories(response.data.subcategories);
        }
      } catch (error) {
        console.error('Failed to fetch subcategories:', error);
        setSubcategories([]);
      }
    } else {
      setSubcategories([]);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.name || !formData.price || !formData.stockQuantity) {
      alert('⚠️ Please fill in all required fields');
      return;
    }

    if (parseFloat(formData.price) <= 0) {
      alert('⚠️ Price must be greater than 0');
      return;
    }

    setLoading(true);
    
    try {
      console.log('📤 Sending product data:', formData);
      
      const response = await axios.post(
        '/api/admin/products/simple',
        {
          name: formData.name,
          description: formData.description,
          price: parseFloat(formData.price),
          stockQuantity: parseInt(formData.stockQuantity),
          mainImage: formData.mainImage || 'https://via.placeholder.com/400',
          category: formData.category,
          subcategory: formData.subcategory
        }
      );

      if (response.data.success) {
        alert('✅ Product created successfully!');
        console.log('✅ Product created:', response.data.data);
        
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
        
        if (onSuccess) {
          onSuccess(response.data.data);
        }
      }
    } catch (error) {
      console.error('❌ Error creating product:', error);
      const errorMsg = error.response?.data?.message || error.message || 'Failed to create product';
      alert('❌ Error: ' + errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-gray-900">Add New Product (Simple)</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Product Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Product Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="e.g., Summer Dress"
            required
          />
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Category
          </label>
          <select
            name="category"
            value={formData.category}
            onChange={(e) => handleCategoryChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select Category</option>
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
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Subcategory
            </label>
            <select
              name="subcategory"
              value={formData.subcategory}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Subcategory (Optional)</option>
              {subcategories.map(sub => (
                <option key={sub.id} value={sub.id}>
                  {sub.icon} {sub.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Price */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Price (RWF) <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            name="price"
            value={formData.price}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            placeholder="25000"
            min="1"
            required
          />
        </div>

        {/* Stock Quantity */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Stock Quantity <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            name="stockQuantity"
            value={formData.stockQuantity}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            placeholder="10"
            min="0"
            required
          />
        </div>

        {/* Image URL */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Image URL (Optional)
          </label>
          <input
            type="url"
            name="mainImage"
            value={formData.mainImage}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            placeholder="https://example.com/image.jpg"
          />
          <p className="text-xs text-gray-500 mt-1">
            Leave empty to use placeholder image
          </p>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description (Optional)
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows="3"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            placeholder="Product description..."
          />
        </div>

        {/* Submit Button */}
        <div className="pt-4">
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 px-4 rounded-md text-white font-medium ${
              loading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            } transition-colors`}
          >
            {loading ? '⏳ Creating Product...' : '✅ Create Product'}
          </button>
        </div>
      </form>

      {/* Debug Info */}
      <div className="mt-6 p-4 bg-gray-50 rounded text-xs">
        <p className="font-semibold mb-2">Debug Info:</p>
        <p>Name: {formData.name || '(empty)'}</p>
        <p>Category: {formData.category || '(none)'}</p>
        <p>Price: {formData.price || '(empty)'}</p>
        <p>Stock: {formData.stockQuantity || '(empty)'}</p>
      </div>
    </div>
  );
};

export default SimpleProductForm;
