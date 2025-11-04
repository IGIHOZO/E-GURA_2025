import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  TruckIcon,
  CheckCircleIcon,
  XMarkIcon,
  GlobeAltIcon,
  TagIcon,
  CurrencyDollarIcon,
  ShoppingBagIcon
} from '@heroicons/react/24/outline';
import axios from 'axios';

const AdminShippingSettings = () => {
  const [shippingSettings, setShippingSettings] = useState({
    freeShippingEnabled: false,
    freeShippingType: 'none', // 'all', 'selected', 'none'
    standardShippingFee: 2000,
    freeShippingThreshold: 0,
    selectedProducts: []
  });

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    loadShippingSettings();
    loadProducts();
  }, []);

  const loadShippingSettings = async () => {
    try {
      const response = await axios.get('/api/shipping/settings');
      if (response.data.success) {
        setShippingSettings(response.data.settings);
      }
    } catch (error) {
      console.error('Error loading shipping settings:', error);
    }
  };

  const loadProducts = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/products?limit=100');
      if (response.data.success) {
        setProducts(response.data.data || []);
      }
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    try {
      setSaving(true);
      const response = await axios.put('/api/shipping/settings', shippingSettings);
      
      if (response.data.success) {
        setMessage({ type: 'success', text: '✅ Shipping settings saved successfully!' });
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      setMessage({ type: 'error', text: '❌ Failed to save settings. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  const toggleProductFreeShipping = (productId) => {
    setShippingSettings(prev => ({
      ...prev,
      selectedProducts: prev.selectedProducts.includes(productId)
        ? prev.selectedProducts.filter(id => id !== productId)
        : [...prev.selectedProducts, productId]
    }));
  };

  const handleFreeShippingTypeChange = (type) => {
    setShippingSettings(prev => ({
      ...prev,
      freeShippingType: type,
      freeShippingEnabled: type !== 'none',
      selectedProducts: type === 'all' ? [] : prev.selectedProducts
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-4">
            <TruckIcon className="w-10 h-10 text-purple-600" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Shipping Settings
            </h1>
          </div>
          <p className="text-gray-600">Manage free shipping and delivery fees for your store</p>
        </motion.div>

        {/* Message */}
        {message.text && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mb-6 p-4 rounded-xl ${
              message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}
          >
            {message.text}
          </motion.div>
        )}

        {/* Main Settings Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-xl p-8 mb-6"
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <CurrencyDollarIcon className="w-6 h-6 text-purple-600" />
            Shipping Fees
          </h2>

          {/* Standard Shipping Fee */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Standard Shipping Fee (RWF)
            </label>
            <input
              type="number"
              value={shippingSettings.standardShippingFee}
              onChange={(e) => setShippingSettings(prev => ({
                ...prev,
                standardShippingFee: parseInt(e.target.value) || 0
              }))}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-purple-500/30 focus:border-purple-500"
              placeholder="2000"
            />
          </div>

          {/* Free Shipping Options */}
          <div className="mb-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <TagIcon className="w-5 h-5 text-green-600" />
              Free Shipping Options
            </h3>

            <div className="space-y-4">
              {/* No Free Shipping */}
              <label className="flex items-center gap-3 p-4 border-2 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
                <input
                  type="radio"
                  name="freeShippingType"
                  checked={shippingSettings.freeShippingType === 'none'}
                  onChange={() => handleFreeShippingTypeChange('none')}
                  className="w-5 h-5 text-purple-600"
                />
                <div className="flex-1">
                  <div className="font-semibold text-gray-900">No Free Shipping</div>
                  <div className="text-sm text-gray-600">Charge shipping fee on all orders</div>
                </div>
                <XMarkIcon className="w-6 h-6 text-red-500" />
              </label>

              {/* Free Shipping on All Products */}
              <label className="flex items-center gap-3 p-4 border-2 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
                <input
                  type="radio"
                  name="freeShippingType"
                  checked={shippingSettings.freeShippingType === 'all'}
                  onChange={() => handleFreeShippingTypeChange('all')}
                  className="w-5 h-5 text-purple-600"
                />
                <div className="flex-1">
                  <div className="font-semibold text-gray-900">Free Shipping on All Products</div>
                  <div className="text-sm text-gray-600">Apply free shipping to every order</div>
                </div>
                <GlobeAltIcon className="w-6 h-6 text-green-500" />
              </label>

              {/* Free Shipping on Selected Products */}
              <label className="flex items-center gap-3 p-4 border-2 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
                <input
                  type="radio"
                  name="freeShippingType"
                  checked={shippingSettings.freeShippingType === 'selected'}
                  onChange={() => handleFreeShippingTypeChange('selected')}
                  className="w-5 h-5 text-purple-600"
                />
                <div className="flex-1">
                  <div className="font-semibold text-gray-900">Free Shipping on Selected Products</div>
                  <div className="text-sm text-gray-600">Choose specific products with free shipping</div>
                </div>
                <ShoppingBagIcon className="w-6 h-6 text-blue-500" />
              </label>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex gap-4">
            <button
              onClick={saveSettings}
              disabled={saving}
              className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 px-6 rounded-xl font-semibold hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : '💾 Save Settings'}
            </button>
          </div>
        </motion.div>

        {/* Product Selection (Only shown when 'selected' is chosen) */}
        {shippingSettings.freeShippingType === 'selected' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-xl p-8"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <ShoppingBagIcon className="w-6 h-6 text-blue-600" />
              Select Products for Free Shipping
            </h2>

            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading products...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
                {products.map((product) => (
                  <label
                    key={product.id}
                    className={`flex items-center gap-3 p-4 border-2 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors ${
                      shippingSettings.selectedProducts.includes(product.id)
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={shippingSettings.selectedProducts.includes(product.id)}
                      onChange={() => toggleProductFreeShipping(product.id)}
                      className="w-5 h-5 text-green-600 rounded"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-gray-900 truncate">{product.name}</div>
                      <div className="text-sm text-gray-600">{product.price?.toLocaleString()} RWF</div>
                    </div>
                    {shippingSettings.selectedProducts.includes(product.id) && (
                      <CheckCircleIcon className="w-6 h-6 text-green-500 flex-shrink-0" />
                    )}
                  </label>
                ))}
              </div>
            )}

            <div className="mt-6 p-4 bg-blue-50 rounded-xl">
              <p className="text-sm text-blue-800">
                <strong>{shippingSettings.selectedProducts.length}</strong> product(s) selected for free shipping
              </p>
            </div>
          </motion.div>
        )}

        {/* Current Settings Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 bg-gradient-to-r from-purple-100 to-pink-100 rounded-2xl p-6"
        >
          <h3 className="text-lg font-bold text-gray-900 mb-4">📊 Current Settings Summary</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl p-4">
              <div className="text-sm text-gray-600">Standard Shipping Fee</div>
              <div className="text-2xl font-bold text-purple-600">{shippingSettings.standardShippingFee.toLocaleString()} RWF</div>
            </div>
            <div className="bg-white rounded-xl p-4">
              <div className="text-sm text-gray-600">Free Shipping Status</div>
              <div className="text-2xl font-bold text-green-600">
                {shippingSettings.freeShippingType === 'all' && '🌍 All Products'}
                {shippingSettings.freeShippingType === 'selected' && `📦 ${shippingSettings.selectedProducts.length} Products`}
                {shippingSettings.freeShippingType === 'none' && '❌ Disabled'}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AdminShippingSettings;
