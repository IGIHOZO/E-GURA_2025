import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';

/**
 * ProductUploadForm Component
 * Creates products with file uploads (NO Base64)
 * Supports main image + additional images with drag-and-drop
 */
const ProductUploadForm = ({ onSuccess, onCancel, editProduct = null }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    shortDescription: '',
    price: '',
    originalPrice: '',
    stockQuantity: '',
    category: '',
    subcategory: '',
    brand: 'E-Gura Store',
    sizes: [],
    colors: [],
    tags: '',
    isActive: true,
    isFeatured: false,
    isNew: true,
    isSale: false
  });

  const [mainImage, setMainImage] = useState(null);
  const [mainImagePreview, setMainImagePreview] = useState('');
  const [additionalImages, setAdditionalImages] = useState([]);
  const [additionalPreviews, setAdditionalPreviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState('');

  const mainImageRef = useRef(null);
  const additionalImagesRef = useRef(null);

  // Available sizes and colors
  const availableSizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '36', '38', '40', '42', '44'];
  const availableColors = ['Black', 'White', 'Red', 'Blue', 'Green', 'Yellow', 'Pink', 'Purple', 'Orange', 'Brown', 'Gray', 'Navy', 'Beige'];

  useEffect(() => {
    fetchCategories();
    if (editProduct) {
      populateEditData(editProduct);
    }
  }, [editProduct]);

  const fetchCategories = async () => {
    try {
      const response = await axios.get('/api/categories/hierarchical/all');
      if (response.data.success) {
        setCategories(response.data.categories || []);
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error);
      // Default categories
      setCategories([
        { id: 'Fashion', name: 'Fashion' },
        { id: 'Electronics', name: 'Electronics' },
        { id: 'Home', name: 'Home & Living' },
        { id: 'Beauty', name: 'Beauty' }
      ]);
    }
  };

  const populateEditData = (product) => {
    setFormData({
      name: product.name || '',
      description: product.description || '',
      shortDescription: product.shortDescription || '',
      price: product.price?.toString() || '',
      originalPrice: product.originalPrice?.toString() || '',
      stockQuantity: product.stockQuantity?.toString() || '',
      category: product.category || '',
      subcategory: product.subcategory || '',
      brand: product.brand || 'E-Gura Store',
      sizes: product.sizes || [],
      colors: product.colors || [],
      tags: (product.tags || []).join(', '),
      isActive: product.isActive !== false,
      isFeatured: product.isFeatured === true,
      isNew: product.isNew !== false,
      isSale: product.isSale === true
    });

    if (product.mainImage && !product.mainImage.startsWith('data:')) {
      setMainImagePreview(product.mainImage);
    }

    if (product.images && product.images.length > 0) {
      setAdditionalPreviews(product.images.filter(img => !img.startsWith('data:')));
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSizeToggle = (size) => {
    setFormData(prev => ({
      ...prev,
      sizes: prev.sizes.includes(size)
        ? prev.sizes.filter(s => s !== size)
        : [...prev.sizes, size]
    }));
  };

  const handleColorToggle = (color) => {
    setFormData(prev => ({
      ...prev,
      colors: prev.colors.includes(color)
        ? prev.colors.filter(c => c !== color)
        : [...prev.colors, color]
    }));
  };

  const handleMainImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Main image must be less than 5MB');
        return;
      }
      setMainImage(file);
      setMainImagePreview(URL.createObjectURL(file));
      setError('');
    }
  };

  const handleAdditionalImagesChange = (e) => {
    const files = Array.from(e.target.files);
    const validFiles = files.filter(file => {
      if (file.size > 5 * 1024 * 1024) {
        setError(`${file.name} is too large (max 5MB)`);
        return false;
      }
      return true;
    });

    if (validFiles.length + additionalImages.length > 10) {
      setError('Maximum 10 additional images allowed');
      return;
    }

    setAdditionalImages(prev => [...prev, ...validFiles]);
    setAdditionalPreviews(prev => [
      ...prev,
      ...validFiles.map(file => URL.createObjectURL(file))
    ]);
    setError('');
  };

  const removeAdditionalImage = (index) => {
    setAdditionalImages(prev => prev.filter((_, i) => i !== index));
    setAdditionalPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleDrop = (e, isMain = false) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files).filter(
      file => file.type.startsWith('image/')
    );

    if (isMain && files[0]) {
      if (files[0].size > 5 * 1024 * 1024) {
        setError('Image must be less than 5MB');
        return;
      }
      setMainImage(files[0]);
      setMainImagePreview(URL.createObjectURL(files[0]));
    } else {
      handleAdditionalImagesChange({ target: { files } });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!formData.name?.trim()) {
      setError('Product name is required');
      return;
    }

    if (!formData.price || parseFloat(formData.price) <= 0) {
      setError('Valid price is required');
      return;
    }

    if (!mainImage && !mainImagePreview) {
      setError('Main image is required');
      return;
    }

    setLoading(true);
    setUploadProgress(0);

    try {
      // Build FormData
      const submitData = new FormData();

      // Add product data as JSON
      const productData = {
        ...formData,
        price: parseFloat(formData.price),
        originalPrice: formData.originalPrice ? parseFloat(formData.originalPrice) : null,
        stockQuantity: parseInt(formData.stockQuantity) || 0,
        tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean)
      };

      // If editing and no new main image, keep existing
      if (!mainImage && mainImagePreview) {
        productData.mainImage = mainImagePreview;
      }

      // Keep existing additional images if editing
      if (additionalPreviews.length > 0 && additionalImages.length === 0) {
        productData.images = additionalPreviews;
      }

      submitData.append('productData', JSON.stringify(productData));

      // Add main image file
      if (mainImage) {
        submitData.append('mainImage', mainImage);
      }

      // Add additional image files
      additionalImages.forEach(file => {
        submitData.append('images', file);
      });

      // Send request
      const url = editProduct
        ? `/api/products/upload/${editProduct.id}`
        : '/api/products/upload';

      const method = editProduct ? 'put' : 'post';

      const response = await axios({
        method,
        url,
        data: submitData,
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(progress);
        }
      });

      if (response.data.success) {
        alert(`✅ Product ${editProduct ? 'updated' : 'created'} successfully!`);
        if (onSuccess) {
          onSuccess(response.data.data);
        }
        // Reset form
        if (!editProduct) {
          setFormData({
            name: '', description: '', shortDescription: '', price: '',
            originalPrice: '', stockQuantity: '', category: '', subcategory: '',
            brand: 'E-Gura Store', sizes: [], colors: [], tags: '',
            isActive: true, isFeatured: false, isNew: true, isSale: false
          });
          setMainImage(null);
          setMainImagePreview('');
          setAdditionalImages([]);
          setAdditionalPreviews([]);
        }
      }
    } catch (error) {
      console.error('Error saving product:', error);
      setError(error.response?.data?.message || 'Failed to save product');
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-gray-900">
        {editProduct ? 'Edit Product' : 'Add New Product'}
      </h2>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Main Image Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Main Image <span className="text-red-500">*</span>
          </label>
          <div
            className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
              mainImagePreview ? 'border-green-400 bg-green-50' : 'border-gray-300 hover:border-blue-400'
            }`}
            onClick={() => mainImageRef.current?.click()}
            onDrop={(e) => handleDrop(e, true)}
            onDragOver={(e) => e.preventDefault()}
          >
            {mainImagePreview ? (
              <div className="relative inline-block">
                <img
                  src={mainImagePreview}
                  alt="Main preview"
                  className="max-h-48 mx-auto rounded-lg"
                />
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setMainImage(null);
                    setMainImagePreview('');
                  }}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center"
                >
                  ×
                </button>
              </div>
            ) : (
              <div>
                <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                  <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <p className="mt-2 text-sm text-gray-600">
                  Click or drag to upload main image
                </p>
                <p className="text-xs text-gray-500">PNG, JPG, WebP up to 5MB</p>
              </div>
            )}
          </div>
          <input
            ref={mainImageRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleMainImageChange}
            className="hidden"
          />
        </div>

        {/* Additional Images */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Additional Images (up to 10)
          </label>
          <div
            className="border-2 border-dashed border-gray-300 rounded-lg p-4 cursor-pointer hover:border-blue-400 transition-colors"
            onClick={() => additionalImagesRef.current?.click()}
            onDrop={(e) => handleDrop(e, false)}
            onDragOver={(e) => e.preventDefault()}
          >
            {additionalPreviews.length > 0 ? (
              <div className="grid grid-cols-5 gap-2">
                {additionalPreviews.map((preview, index) => (
                  <div key={index} className="relative">
                    <img
                      src={preview}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-20 object-cover rounded"
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeAdditionalImage(index);
                      }}
                      className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                    >
                      ×
                    </button>
                  </div>
                ))}
                {additionalPreviews.length < 10 && (
                  <div className="flex items-center justify-center h-20 border-2 border-dashed border-gray-300 rounded">
                    <span className="text-2xl text-gray-400">+</span>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-600 text-center">
                Click or drag to add more images
              </p>
            )}
          </div>
          <input
            ref={additionalImagesRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            onChange={handleAdditionalImagesChange}
            className="hidden"
          />
        </div>

        {/* Basic Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Product Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Summer Dress"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Category</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id || cat.name}>
                  {cat.icon || ''} {cat.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Pricing */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Original Price (for sale)
            </label>
            <input
              type="number"
              name="originalPrice"
              value={formData.originalPrice}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              placeholder="30000"
              min="0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Stock Quantity
            </label>
            <input
              type="number"
              name="stockQuantity"
              value={formData.stockQuantity}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              placeholder="10"
              min="0"
            />
          </div>
        </div>

        {/* Sizes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Available Sizes
          </label>
          <div className="flex flex-wrap gap-2">
            {availableSizes.map(size => (
              <button
                key={size}
                type="button"
                onClick={() => handleSizeToggle(size)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  formData.sizes.includes(size)
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {size}
              </button>
            ))}
          </div>
        </div>

        {/* Colors */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Available Colors
          </label>
          <div className="flex flex-wrap gap-2">
            {availableColors.map(color => (
              <button
                key={color}
                type="button"
                onClick={() => handleColorToggle(color)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  formData.colors.includes(color)
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {color}
              </button>
            ))}
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows="4"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            placeholder="Detailed product description..."
          />
        </div>

        {/* Tags */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tags (comma-separated)
          </label>
          <input
            type="text"
            name="tags"
            value={formData.tags}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            placeholder="fashion, summer, dress"
          />
        </div>

        {/* Flags */}
        <div className="flex flex-wrap gap-4">
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              name="isActive"
              checked={formData.isActive}
              onChange={handleChange}
              className="rounded"
            />
            <span className="text-sm">Active</span>
          </label>
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              name="isFeatured"
              checked={formData.isFeatured}
              onChange={handleChange}
              className="rounded"
            />
            <span className="text-sm">Featured</span>
          </label>
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              name="isNew"
              checked={formData.isNew}
              onChange={handleChange}
              className="rounded"
            />
            <span className="text-sm">New Arrival</span>
          </label>
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              name="isSale"
              checked={formData.isSale}
              onChange={handleChange}
              className="rounded"
            />
            <span className="text-sm">On Sale</span>
          </label>
        </div>

        {/* Upload Progress */}
        {loading && uploadProgress > 0 && (
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        )}

        {/* Submit Buttons */}
        <div className="flex gap-4 pt-4">
          <button
            type="submit"
            disabled={loading}
            className={`flex-1 py-3 px-4 rounded-md text-white font-medium ${
              loading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            } transition-colors`}
          >
            {loading ? `Uploading... ${uploadProgress}%` : (editProduct ? 'Update Product' : 'Create Product')}
          </button>
          
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="px-6 py-3 rounded-md border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default ProductUploadForm;
