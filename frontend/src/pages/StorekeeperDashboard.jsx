import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { PlusIcon, CubeIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

const StorekeeperDashboard = () => {
  const [summary, setSummary] = useState(null);
  const [products, setProducts] = useState([]);
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [quickAddLoading, setQuickAddLoading] = useState(false);
  const [stockInLoading, setStockInLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const [quickAddForm, setQuickAddForm] = useState({
    name: '',
    price: '',
    stockQuantity: '',
    mainImage: '',
    category: '',
    description: ''
  });

  const [stockInForm, setStockInForm] = useState({
    productId: '',
    quantity: '',
    note: ''
  });

  const authHeaders = () => {
    const token = localStorage.getItem('adminToken');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  useEffect(() => {
    fetchSummary();
    fetchProducts();
  }, []);

  const fetchSummary = async () => {
    try {
      setLoadingSummary(true);
      const response = await axios.get('/api/storekeeper/dashboard/summary', {
        headers: authHeaders()
      });
      if (response.data.success) {
        setSummary(response.data.data);
      }
    } catch (error) {
      console.error('Failed to load storekeeper summary:', error);
    } finally {
      setLoadingSummary(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await axios.get('/api/storekeeper/products/basic?limit=200', {
        headers: authHeaders()
      });
      if (response.data.success) {
        setProducts(response.data.data || []);
      }
    } catch (error) {
      console.error('Failed to load products list:', error);
    }
  };

  const handleQuickAddChange = (e) => {
    const { name, value } = e.target;
    setQuickAddForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleStockInChange = (e) => {
    const { name, value } = e.target;
    setStockInForm((prev) => ({ ...prev, [name]: value }));
  };

  const submitQuickAdd = async (e) => {
    e.preventDefault();
    setMessage(null);

    if (!quickAddForm.name || !quickAddForm.price || !quickAddForm.stockQuantity) {
      setMessage({ type: 'error', text: 'Name, price, and stock quantity are required.' });
      return;
    }

    setQuickAddLoading(true);
    try {
      const payload = {
        ...quickAddForm,
        price: parseFloat(quickAddForm.price),
        stockQuantity: parseInt(quickAddForm.stockQuantity, 10)
      };
      const response = await axios.post('/api/storekeeper/products/quick-add', payload, {
        headers: authHeaders()
      });

      if (response.data.success) {
        setMessage({ type: 'success', text: `Product "${response.data.data.name}" added successfully.` });
        setQuickAddForm({
          name: '',
          price: '',
          stockQuantity: '',
          mainImage: '',
          category: '',
          description: ''
        });
        fetchSummary();
        fetchProducts();
      }
    } catch (error) {
      console.error('Quick add failed:', error);
      const errorText = error.response?.data?.message || 'Failed to create product.';
      setMessage({ type: 'error', text: errorText });
    } finally {
      setQuickAddLoading(false);
    }
  };

  const submitStockIn = async (e) => {
    e.preventDefault();
    setMessage(null);

    if (!stockInForm.productId || !stockInForm.quantity) {
      setMessage({ type: 'error', text: 'Select a product and quantity.' });
      return;
    }

    setStockInLoading(true);
    try {
      const payload = {
        productId: stockInForm.productId,
        quantity: parseInt(stockInForm.quantity, 10),
        note: stockInForm.note
      };
      const response = await axios.post('/api/storekeeper/stock/stock-in', payload, {
        headers: authHeaders()
      });

      if (response.data.success) {
        setMessage({ type: 'success', text: 'Stock updated successfully.' });
        setStockInForm({ productId: '', quantity: '', note: '' });
        fetchSummary();
        fetchProducts();
      }
    } catch (error) {
      console.error('Stock-in failed:', error);
      const errorText = error.response?.data?.message || 'Failed to update stock.';
      setMessage({ type: 'error', text: errorText });
    } finally {
      setStockInLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <CubeIcon className="h-8 w-8 text-orange-500" />
            Storekeeper Workspace
          </h1>
          <p className="text-gray-600">
            Add products fast and keep inventory up to date. Only the essentials you need.
          </p>
        </div>

        {message && (
          <div
            className={`p-4 rounded-lg ${
              message.type === 'error'
                ? 'bg-red-50 text-red-700 border border-red-100'
                : 'bg-green-50 text-green-700 border border-green-100'
            }`}
          >
            {message.text}
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-3">
          <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
            <p className="text-sm text-gray-500">Total Products</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">
              {loadingSummary ? '...' : summary?.totals?.totalProducts || 0}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
            <p className="text-sm text-gray-500">Low Stock (&lt;= 5)</p>
            <p className="text-3xl font-bold text-yellow-600 mt-2">
              {loadingSummary ? '...' : summary?.totals?.lowStockCount || 0}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
            <p className="text-sm text-gray-500">Out of Stock</p>
            <p className="text-3xl font-bold text-red-600 mt-2">
              {loadingSummary ? '...' : summary?.totals?.outOfStockCount || 0}
            </p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-2 mb-4">
              <PlusIcon className="h-6 w-6 text-orange-500" />
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Quick Add Product</h2>
                <p className="text-sm text-gray-500">Summarized form – only the basics.</p>
              </div>
            </div>

            <form onSubmit={submitQuickAdd} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Product Name *</label>
                <input
                  type="text"
                  name="name"
                  value={quickAddForm.name}
                  onChange={handleQuickAddChange}
                  className="w-full mt-1 rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-orange-500"
                  placeholder="e.g., Ankara Maxi Dress"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Price (RWF) *</label>
                  <input
                    type="number"
                    name="price"
                    value={quickAddForm.price}
                    onChange={handleQuickAddChange}
                    className="w-full mt-1 rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-orange-500"
                    min="1"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Stock *</label>
                  <input
                    type="number"
                    name="stockQuantity"
                    value={quickAddForm.stockQuantity}
                    onChange={handleQuickAddChange}
                    className="w-full mt-1 rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-orange-500"
                    min="0"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Category (optional)</label>
                <input
                  type="text"
                  name="category"
                  value={quickAddForm.category}
                  onChange={handleQuickAddChange}
                  className="w-full mt-1 rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-orange-500"
                  placeholder="e.g., Fashion"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Image URL (optional)</label>
                <input
                  type="url"
                  name="mainImage"
                  value={quickAddForm.mainImage}
                  onChange={handleQuickAddChange}
                  className="w-full mt-1 rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-orange-500"
                  placeholder="https://..."
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Short Description</label>
                <textarea
                  name="description"
                  value={quickAddForm.description}
                  onChange={handleQuickAddChange}
                  rows="3"
                  className="w-full mt-1 rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-orange-500"
                  placeholder="Optional quick note about the product"
                />
              </div>

              <button
                type="submit"
                disabled={quickAddLoading}
                className={`w-full flex items-center justify-center gap-2 rounded-lg py-3 text-white font-semibold ${
                  quickAddLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-orange-600 hover:bg-orange-700'
                }`}
              >
                {quickAddLoading ? (
                  <>
                    <ArrowPathIcon className="h-5 w-5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <PlusIcon className="h-5 w-5" />
                    Add Product
                  </>
                )}
              </button>
            </form>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-2 mb-4">
              <ArrowPathIcon className="h-6 w-6 text-blue-500" />
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Stock In</h2>
                <p className="text-sm text-gray-500">Top up stock for existing products.</p>
              </div>
            </div>

            <form onSubmit={submitStockIn} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Select Product *</label>
                <select
                  name="productId"
                  value={stockInForm.productId}
                  onChange={handleStockInChange}
                  className="w-full mt-1 rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-orange-500"
                  required
                >
                  <option value="">Choose product</option>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name} — Stock: {product.stockQuantity}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Quantity *</label>
                <input
                  type="number"
                  name="quantity"
                  min="1"
                  value={stockInForm.quantity}
                  onChange={handleStockInChange}
                  className="w-full mt-1 rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-orange-500"
                  placeholder="e.g., 5"
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Note (optional)</label>
                <textarea
                  name="note"
                  rows="3"
                  value={stockInForm.note}
                  onChange={handleStockInChange}
                  className="w-full mt-1 rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-orange-500"
                  placeholder="Source, batch or any useful info"
                />
              </div>

              <button
                type="submit"
                disabled={stockInLoading}
                className={`w-full flex items-center justify-center gap-2 rounded-lg py-3 text-white font-semibold ${
                  stockInLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {stockInLoading ? (
                  <>
                    <ArrowPathIcon className="h-5 w-5 animate-spin" />
                    Updating...
                  </>
                ) : (
                  'Stock In'
                )}
              </button>
            </form>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Products</h3>
          <div className="space-y-3">
            {(summary?.recentProducts || []).length === 0 && (
              <p className="text-sm text-gray-500">No recent products yet.</p>
            )}
            {(summary?.recentProducts || []).map((product) => (
              <div key={product.id} className="flex items-center justify-between border border-gray-100 rounded-lg p-3">
                <div>
                  <p className="font-medium text-gray-900">{product.name}</p>
                  <p className="text-sm text-gray-500">
                    Stock: {product.stockQuantity} • {product.category || 'General'}
                  </p>
                </div>
                <p className="text-sm font-semibold text-gray-900">
                  {Number(product.price || 0).toLocaleString()} RWF
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StorekeeperDashboard;
