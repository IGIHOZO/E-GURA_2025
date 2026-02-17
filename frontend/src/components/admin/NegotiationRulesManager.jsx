import React, { useState, useEffect } from 'react';
import axios from 'axios';

const NegotiationRulesManager = () => {
  const [rules, setRules] = useState([]);
  const [products, setProducts] = useState([]);
  const [editingRule, setEditingRule] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const API_URL = import.meta.env.VITE_API_URL || '';

  const emptyRule = {
    sku: '',
    productName: { en: '', rw: '' },
    basePrice: 0,
    minPrice: 0,
    maxDiscountPct: 15,
    maxRounds: 3,
    clearanceFlag: false,
    stockLevel: 0,
    bundlePairs: [],
    segmentRules: [
      { segment: 'new', maxDiscountPct: 10, minPurchaseCount: 0, maxPurchaseCount: 0 },
      { segment: 'returning', maxDiscountPct: 15, minPurchaseCount: 1, maxPurchaseCount: 4 },
      { segment: 'vip', maxDiscountPct: 20, minPurchaseCount: 5, maxPurchaseCount: null }
    ],
    fallbackPerks: {
      freeShipping: { enabled: true, threshold: null },
      freeGift: { enabled: false, giftDescription: { en: '', rw: '' } },
      extendedWarranty: { enabled: false, months: 12 }
    },
    enabled: true,
    priority: 0,
    metadata: {
      category: '',
      margin: 0,
      costPrice: 0
    }
  };

  useEffect(() => {
    loadRules();
    loadProducts();
  }, []);

  const loadRules = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/negotiation/rules`);
      setRules(response.data.data);
    } catch (err) {
      console.error('Load rules error:', err);
      setError('Failed to load rules');
    }
  };

  const loadProducts = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/products`);
      setProducts(response.data);
    } catch (err) {
      console.error('Load products error:', err);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await axios.post(`${API_URL}/api/negotiation/admin/rules`, editingRule);
      setSuccess('Rule saved successfully!');
      setShowForm(false);
      setEditingRule(null);
      loadRules();
    } catch (err) {
      console.error('Save error:', err);
      setError(err.response?.data?.error || 'Failed to save rule');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (sku) => {
    if (!confirm(`Delete rule for ${sku}?`)) return;

    try {
      await axios.delete(`${API_URL}/api/negotiation/admin/rules/${sku}`);
      setSuccess('Rule deleted successfully!');
      loadRules();
    } catch (err) {
      console.error('Delete error:', err);
      setError('Failed to delete rule');
    }
  };

  const handleEdit = (rule) => {
    setEditingRule({ ...rule });
    setShowForm(true);
  };

  const handleNew = () => {
    setEditingRule({ ...emptyRule });
    setShowForm(true);
  };

  const handleProductSelect = (e) => {
    const product = products.find(p => p.sku === e.target.value);
    if (product) {
      setEditingRule({
        ...editingRule,
        sku: product.sku,
        productName: {
          en: product.name,
          rw: product.nameRw || product.name
        },
        basePrice: product.price,
        minPrice: product.price * 0.85,
        stockLevel: product.stock || 0,
        metadata: {
          ...editingRule.metadata,
          category: product.category,
          costPrice: product.costPrice || product.price * 0.6
        }
      });
    }
  };

  const addBundlePair = () => {
    setEditingRule({
      ...editingRule,
      bundlePairs: [
        ...editingRule.bundlePairs,
        { mainSku: editingRule.sku, bundleSku: '', bundlePrice: 0, bundleDescription: { en: '', rw: '' } }
      ]
    });
  };

  const removeBundlePair = (index) => {
    setEditingRule({
      ...editingRule,
      bundlePairs: editingRule.bundlePairs.filter((_, i) => i !== index)
    });
  };

  const updateBundlePair = (index, field, value) => {
    const updated = [...editingRule.bundlePairs];
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      updated[index][parent][child] = value;
    } else {
      updated[index][field] = value;
    }
    setEditingRule({ ...editingRule, bundlePairs: updated });
  };

  const updateSegmentRule = (segment, field, value) => {
    const updated = editingRule.segmentRules.map(sr =>
      sr.segment === segment ? { ...sr, [field]: parseFloat(value) || 0 } : sr
    );
    setEditingRule({ ...editingRule, segmentRules: updated });
  };

  if (showForm && editingRule) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">
              {editingRule._id ? 'Edit Rule' : 'New Rule'}
            </h2>
            <button
              onClick={() => {
                setShowForm(false);
                setEditingRule(null);
              }}
              className="text-gray-600 hover:text-gray-800"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 text-red-600 rounded-lg">
              {error}
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-6">
            {/* Product Selection */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Select Product
              </label>
              <select
                value={editingRule.sku}
                onChange={handleProductSelect}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                required
              >
                <option value="">-- Select Product --</option>
                {products.map(p => (
                  <option key={p.sku} value={p.sku}>
                    {p.name} ({p.sku}) - {p.price} RWF
                  </option>
                ))}
              </select>
            </div>

            {/* Product Names */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Product Name (English)
                </label>
                <input
                  type="text"
                  value={editingRule.productName.en}
                  onChange={(e) => setEditingRule({
                    ...editingRule,
                    productName: { ...editingRule.productName, en: e.target.value }
                  })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Product Name (Kinyarwanda)
                </label>
                <input
                  type="text"
                  value={editingRule.productName.rw || ''}
                  onChange={(e) => setEditingRule({
                    ...editingRule,
                    productName: { ...editingRule.productName, rw: e.target.value }
                  })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>

            {/* Pricing */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Base Price (RWF)
                </label>
                <input
                  type="number"
                  value={editingRule.basePrice}
                  onChange={(e) => setEditingRule({ ...editingRule, basePrice: parseFloat(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  required
                  min="0"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Min Price (Floor)
                </label>
                <input
                  type="number"
                  value={editingRule.minPrice}
                  onChange={(e) => setEditingRule({ ...editingRule, minPrice: parseFloat(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  required
                  min="0"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Max Discount %
                </label>
                <input
                  type="number"
                  value={editingRule.maxDiscountPct}
                  onChange={(e) => setEditingRule({ ...editingRule, maxDiscountPct: parseFloat(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  required
                  min="0"
                  max="100"
                />
              </div>
            </div>

            {/* Settings */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Max Rounds
                </label>
                <input
                  type="number"
                  value={editingRule.maxRounds}
                  onChange={(e) => setEditingRule({ ...editingRule, maxRounds: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  required
                  min="1"
                  max="5"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Stock Level
                </label>
                <input
                  type="number"
                  value={editingRule.stockLevel}
                  onChange={(e) => setEditingRule({ ...editingRule, stockLevel: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Priority
                </label>
                <input
                  type="number"
                  value={editingRule.priority}
                  onChange={(e) => setEditingRule({ ...editingRule, priority: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>

            {/* Flags */}
            <div className="flex gap-6">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={editingRule.clearanceFlag}
                  onChange={(e) => setEditingRule({ ...editingRule, clearanceFlag: e.target.checked })}
                  className="w-4 h-4 text-orange-500 rounded focus:ring-orange-500"
                />
                <span className="text-sm font-semibold text-gray-700">Clearance Sale</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={editingRule.enabled}
                  onChange={(e) => setEditingRule({ ...editingRule, enabled: e.target.checked })}
                  className="w-4 h-4 text-orange-500 rounded focus:ring-orange-500"
                />
                <span className="text-sm font-semibold text-gray-700">Enabled</span>
              </label>
            </div>

            {/* Segment Rules */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Segment Rules</h3>
              <div className="space-y-3">
                {editingRule.segmentRules.map((sr) => (
                  <div key={sr.segment} className="grid grid-cols-4 gap-3 p-3 bg-gray-50 rounded-lg">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">
                        {sr.segment.toUpperCase()}
                      </label>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Max Discount %</label>
                      <input
                        type="number"
                        value={sr.maxDiscountPct}
                        onChange={(e) => updateSegmentRule(sr.segment, 'maxDiscountPct', e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                        min="0"
                        max="100"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Min Purchases</label>
                      <input
                        type="number"
                        value={sr.minPurchaseCount}
                        onChange={(e) => updateSegmentRule(sr.segment, 'minPurchaseCount', e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                        min="0"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Max Purchases</label>
                      <input
                        type="number"
                        value={sr.maxPurchaseCount || ''}
                        onChange={(e) => updateSegmentRule(sr.segment, 'maxPurchaseCount', e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                        min="0"
                        placeholder="Unlimited"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Fallback Perks */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Fallback Perks</h3>
              <div className="space-y-3">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={editingRule.fallbackPerks.freeShipping.enabled}
                    onChange={(e) => setEditingRule({
                      ...editingRule,
                      fallbackPerks: {
                        ...editingRule.fallbackPerks,
                        freeShipping: { ...editingRule.fallbackPerks.freeShipping, enabled: e.target.checked }
                      }
                    })}
                    className="w-4 h-4 text-orange-500 rounded"
                  />
                  <span className="text-sm font-semibold text-gray-700">Free Shipping</span>
                </label>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={editingRule.fallbackPerks.freeGift.enabled}
                    onChange={(e) => setEditingRule({
                      ...editingRule,
                      fallbackPerks: {
                        ...editingRule.fallbackPerks,
                        freeGift: { ...editingRule.fallbackPerks.freeGift, enabled: e.target.checked }
                      }
                    })}
                    className="w-4 h-4 text-orange-500 rounded"
                  />
                  <span className="text-sm font-semibold text-gray-700">Free Gift</span>
                  {editingRule.fallbackPerks.freeGift.enabled && (
                    <input
                      type="text"
                      value={editingRule.fallbackPerks.freeGift.giftDescription.en}
                      onChange={(e) => setEditingRule({
                        ...editingRule,
                        fallbackPerks: {
                          ...editingRule.fallbackPerks,
                          freeGift: {
                            ...editingRule.fallbackPerks.freeGift,
                            giftDescription: { ...editingRule.fallbackPerks.freeGift.giftDescription, en: e.target.value }
                          }
                        }
                      })}
                      placeholder="Gift description"
                      className="flex-1 px-3 py-1 border border-gray-300 rounded text-sm"
                    />
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={editingRule.fallbackPerks.extendedWarranty.enabled}
                    onChange={(e) => setEditingRule({
                      ...editingRule,
                      fallbackPerks: {
                        ...editingRule.fallbackPerks,
                        extendedWarranty: { ...editingRule.fallbackPerks.extendedWarranty, enabled: e.target.checked }
                      }
                    })}
                    className="w-4 h-4 text-orange-500 rounded"
                  />
                  <span className="text-sm font-semibold text-gray-700">Extended Warranty</span>
                  {editingRule.fallbackPerks.extendedWarranty.enabled && (
                    <input
                      type="number"
                      value={editingRule.fallbackPerks.extendedWarranty.months}
                      onChange={(e) => setEditingRule({
                        ...editingRule,
                        fallbackPerks: {
                          ...editingRule.fallbackPerks,
                          extendedWarranty: { ...editingRule.fallbackPerks.extendedWarranty, months: parseInt(e.target.value) }
                        }
                      })}
                      className="w-20 px-3 py-1 border border-gray-300 rounded text-sm"
                      min="1"
                    />
                  )}
                  <span className="text-sm text-gray-600">months</span>
                </div>
              </div>
            </div>

            {/* Bundle Pairs */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-lg font-semibold text-gray-800">Bundle Pairs</h3>
                <button
                  type="button"
                  onClick={addBundlePair}
                  className="text-sm text-orange-500 hover:text-orange-600 font-semibold"
                >
                  + Add Bundle
                </button>
              </div>
              <div className="space-y-3">
                {editingRule.bundlePairs.map((bundle, index) => (
                  <div key={index} className="grid grid-cols-4 gap-3 p-3 bg-gray-50 rounded-lg">
                    <input
                      type="text"
                      value={bundle.bundleSku}
                      onChange={(e) => updateBundlePair(index, 'bundleSku', e.target.value)}
                      placeholder="Bundle SKU"
                      className="px-3 py-2 border border-gray-300 rounded text-sm"
                    />
                    <input
                      type="number"
                      value={bundle.bundlePrice}
                      onChange={(e) => updateBundlePair(index, 'bundlePrice', parseFloat(e.target.value))}
                      placeholder="Price"
                      className="px-3 py-2 border border-gray-300 rounded text-sm"
                    />
                    <input
                      type="text"
                      value={bundle.bundleDescription.en}
                      onChange={(e) => updateBundlePair(index, 'bundleDescription.en', e.target.value)}
                      placeholder="Description (EN)"
                      className="px-3 py-2 border border-gray-300 rounded text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => removeBundlePair(index)}
                      className="text-red-500 hover:text-red-600"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-6 border-t">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-orange-500 text-white py-3 rounded-lg font-semibold hover:bg-orange-600 disabled:opacity-50 transition-colors"
              >
                {loading ? 'Saving...' : 'Save Rule'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingRule(null);
                }}
                className="px-6 py-3 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Negotiation Rules</h2>
          <button
            onClick={handleNew}
            className="bg-orange-500 text-white px-6 py-2 rounded-lg font-semibold hover:bg-orange-600 transition-colors"
          >
            + New Rule
          </button>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 text-red-600 rounded-lg">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-4 bg-green-50 text-green-600 rounded-lg">
            {success}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">SKU</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Product</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Base Price</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Floor</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Max Discount</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Rounds</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {rules.map((rule) => (
                <tr key={rule.sku} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-mono">{rule.sku}</td>
                  <td className="px-4 py-3 text-sm">
                    {rule.productName.en}
                    {rule.clearanceFlag && (
                      <span className="ml-2 px-2 py-1 bg-red-100 text-red-600 text-xs rounded">
                        CLEARANCE
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm">{rule.basePrice.toLocaleString()} RWF</td>
                  <td className="px-4 py-3 text-sm">{rule.minPrice.toLocaleString()} RWF</td>
                  <td className="px-4 py-3 text-sm">{rule.maxDiscountPct}%</td>
                  <td className="px-4 py-3 text-sm">{rule.maxRounds}</td>
                  <td className="px-4 py-3 text-sm">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      rule.enabled ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {rule.enabled ? 'Active' : 'Disabled'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(rule)}
                        className="text-blue-500 hover:text-blue-600"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(rule.sku)}
                        className="text-red-500 hover:text-red-600"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {rules.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              No rules configured. Click "New Rule" to get started.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NegotiationRulesManager;
