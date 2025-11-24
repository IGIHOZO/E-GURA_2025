import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  MagnifyingGlassIcon, 
  EyeIcon, 
  XMarkIcon,
  SparklesIcon,
  ChartBarIcon,
  UserGroupIcon,
  CurrencyDollarIcon,
  TruckIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { PLACEHOLDER_IMAGES, handleImageError } from '../utils/placeholderImage';

const AdminOrdersEnhanced = () => {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [aiInsights, setAiInsights] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all');
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [customerAnalytics, setCustomerAnalytics] = useState(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    let filtered = orders;

    // Apply status filter
    if (activeFilter !== 'all') {
      filtered = filtered.filter(order => order.status === activeFilter);
    }

    // Apply search query
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (order) =>
          order.orderNumber?.toLowerCase().includes(query) ||
          order.customerInfo?.firstName?.toLowerCase().includes(query) ||
          order.customerInfo?.lastName?.toLowerCase().includes(query) ||
          order.customerInfo?.phone?.includes(query) ||
          order.status?.toLowerCase().includes(query)
      );
    }

    setFilteredOrders(filtered);
  }, [searchQuery, orders, activeFilter]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      console.log('📦 Fetching orders from admin panel...');
      
      const token = localStorage.getItem('adminToken');
      const headers = { Authorization: `Bearer ${token}` };
      
      const res = await axios.get('/api/admin/orders/all', { headers });
      console.log('📦 Orders response:', res.data);
      
      const ordersData = res.data.orders || res.data || [];
      console.log('📦 Orders count:', ordersData.length);
      
      setOrders(ordersData);
      setFilteredOrders(ordersData);
      generateAIInsights(ordersData);
    } catch (error) {
      console.error('❌ Error fetching orders:', error);
      console.error('❌ Error details:', error.response?.data);
    } finally {
      setLoading(false);
    }
  };

  const generateAIInsights = (ordersData) => {
    if (!ordersData || ordersData.length === 0) return;

    const totalRevenue = ordersData.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
    const avgOrderValue = totalRevenue / ordersData.length;
    
    const statusCounts = ordersData.reduce((acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1;
      return acc;
    }, {});

    const pendingOrders = statusCounts.pending || 0;
    const processingOrders = statusCounts.processing || 0;
    
    // AI predictions
    const deliveryRate = ((statusCounts.delivered || 0) / ordersData.length * 100).toFixed(1);
    const cancellationRate = ((statusCounts.cancelled || 0) / ordersData.length * 100).toFixed(1);
    
    // Customer Analytics
    const customerMap = new Map();
    ordersData.forEach(order => {
      const phone = order.customerInfo?.phone;
      if (phone) {
        if (!customerMap.has(phone)) {
          customerMap.set(phone, { count: 0, revenue: 0, name: `${order.customerInfo?.firstName} ${order.customerInfo?.lastName}` });
        }
        const customer = customerMap.get(phone);
        customer.count += 1;
        customer.revenue += order.totalAmount || 0;
      }
    });

    const repeatCustomers = Array.from(customerMap.values()).filter(c => c.count > 1).length;
    const topCustomers = Array.from(customerMap.entries())
      .map(([phone, data]) => ({ phone, ...data }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // Revenue forecasting (simple 30-day projection)
    const last30DaysRevenue = totalRevenue;
    const projectedMonthlyRevenue = last30DaysRevenue * 1.15; // 15% growth assumption

    setAiInsights({
      totalOrders: ordersData.length,
      totalRevenue,
      avgOrderValue,
      pendingOrders,
      processingOrders,
      deliveryRate,
      cancellationRate,
      repeatCustomers,
      repeatRate: ((repeatCustomers / customerMap.size) * 100).toFixed(1),
      projectedRevenue: projectedMonthlyRevenue,
      recommendation: pendingOrders > 5 ? 'High pending orders! Consider processing them soon.' : 'Orders are being processed efficiently.',
      trend: ordersData.length > 10 ? 'Growing' : 'Stable'
    });

    setCustomerAnalytics({
      totalCustomers: customerMap.size,
      repeatCustomers,
      topCustomers,
      avgCustomerValue: totalRevenue / customerMap.size
    });
  };

  const viewOrderDetails = (order) => {
    console.log('🔍 Opening order details:', order);
    console.log('📦 Order items:', order.items);
    if (order.items && order.items[0]) {
      console.log('🖼️ First item image fields:', {
        image: order.items[0].image,
        mainImage: order.items[0].mainImage,
        productImage: order.items[0].productImage,
        name: order.items[0].name,
        productName: order.items[0].productName
      });
    }
    setSelectedOrder(order);
    setShowOrderModal(true);
  };

  const closeModal = () => {
    setShowOrderModal(false);
    setSelectedOrder(null);
  };

  const toggleOrderSelection = (orderId) => {
    setSelectedOrders(prev => 
      prev.includes(orderId) 
        ? prev.filter(id => id !== orderId)
        : [...prev, orderId]
    );
  };

  const handleBulkStatusUpdate = async (newStatus) => {
    if (selectedOrders.length === 0) {
      alert('Please select orders first');
      return;
    }

    try {
      const token = localStorage.getItem('adminToken');
      const headers = { Authorization: `Bearer ${token}` };

      await Promise.all(
        selectedOrders.map(orderId =>
          axios.put(
            `https://egura.rw/api/admin/orders/${orderId}/status`,
            { status: newStatus },
            { headers }
          )
        )
      );

      alert(`${selectedOrders.length} orders updated to ${newStatus}`);
      setSelectedOrders([]);
      await fetchOrders();
    } catch (error) {
      console.error('❌ Error in bulk update:', error);
      alert('Failed to update some orders');
    }
  };

  const exportToCSV = () => {
    const headers = ['Order Number', 'Customer', 'Phone', 'Total', 'Status', 'Date'];
    const rows = filteredOrders.map(order => [
      order.orderNumber,
      `${order.customerInfo?.firstName} ${order.customerInfo?.lastName}`,
      order.customerInfo?.phone,
      order.totalAmount,
      order.status,
      new Date(order.createdAt).toLocaleDateString()
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `orders_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      console.log('🔄 Updating order status:', orderId, '→', newStatus);
      
      const token = localStorage.getItem('adminToken');
      const headers = { Authorization: `Bearer ${token}` };
      
      await axios.put(
        `https://egura.rw/api/admin/orders/${orderId}/status`,
        { status: newStatus },
        { headers }
      );
      
      console.log('✅ Order status updated successfully');
      await fetchOrders();
      alert('Order status updated!');
    } catch (error) {
      console.error('❌ Error updating order:', error);
      console.error('❌ Error details:', error.response?.data);
      alert('Failed to update order');
    }
  };

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    processing: 'bg-blue-100 text-blue-800',
    shipped: 'bg-purple-100 text-purple-800',
    delivered: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800'
  };

  return (
    <div className="p-6 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 min-h-screen">
      {/* Header with AI Theme */}
      <div className="mb-8 relative">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 to-blue-600/10 rounded-3xl blur-3xl"></div>
        <div className="relative bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl blur-md opacity-50 animate-pulse"></div>
              <SparklesIcon className="relative h-10 w-10 text-purple-600" />
            </div>
            <h2 className="text-4xl font-black bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent drop-shadow-lg animate-gradient">
              AI-Powered Orders CRM
            </h2>
          </div>
          <p className="text-gray-600 font-medium">✨ Intelligent order management with real-time AI insights</p>
        </div>
      </div>

      {/* AI Insights Dashboard */}
      {aiInsights && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="group relative bg-gradient-to-br from-purple-500 via-purple-600 to-indigo-600 rounded-2xl shadow-2xl p-6 text-white transform hover:scale-105 hover:shadow-purple-500/50 transition-all duration-300 overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                  <ChartBarIcon className="h-8 w-8" />
                </div>
                <SparklesIcon className="h-6 w-6 animate-pulse" />
              </div>
              <p className="text-sm opacity-90 font-medium mb-1">Total Orders</p>
              <p className="text-4xl font-black mb-2">{aiInsights.totalOrders}</p>
              <div className="flex items-center gap-2">
                <span className="px-2 py-1 bg-white/20 rounded-full text-xs font-semibold">Trend: {aiInsights.trend}</span>
              </div>
            </div>
          </div>

          <div className="group relative bg-gradient-to-br from-emerald-500 via-green-600 to-teal-600 rounded-2xl shadow-2xl p-6 text-white transform hover:scale-105 hover:shadow-green-500/50 transition-all duration-300 overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                  <CurrencyDollarIcon className="h-8 w-8" />
                </div>
                <SparklesIcon className="h-6 w-6 animate-pulse" />
              </div>
              <p className="text-sm opacity-90 font-medium mb-1">Total Revenue</p>
              <p className="text-4xl font-black mb-2">{aiInsights.totalRevenue ? (aiInsights.totalRevenue / 1000).toFixed(1) + 'K' : '0'}</p>
              <div className="flex items-center gap-2">
                <span className="px-2 py-1 bg-white/20 rounded-full text-xs font-semibold">RWF</span>
              </div>
            </div>
          </div>

          <div className="group relative bg-gradient-to-br from-blue-500 via-cyan-600 to-sky-600 rounded-2xl shadow-2xl p-6 text-white transform hover:scale-105 hover:shadow-blue-500/50 transition-all duration-300 overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                  <TruckIcon className="h-8 w-8" />
                </div>
                <SparklesIcon className="h-6 w-6 animate-pulse" />
              </div>
              <p className="text-sm opacity-90 font-medium mb-1">Avg Order Value</p>
              <p className="text-4xl font-black mb-2">{aiInsights.avgOrderValue ? (aiInsights.avgOrderValue / 1000).toFixed(1) + 'K' : '0'}</p>
              <div className="flex items-center gap-2">
                <span className="px-2 py-1 bg-white/20 rounded-full text-xs font-semibold">RWF</span>
              </div>
            </div>
          </div>

          <div className="group relative bg-gradient-to-br from-orange-500 via-amber-600 to-yellow-600 rounded-2xl shadow-2xl p-6 text-white transform hover:scale-105 hover:shadow-orange-500/50 transition-all duration-300 overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                  <CheckCircleIcon className="h-8 w-8" />
                </div>
                <SparklesIcon className="h-6 w-6 animate-pulse" />
              </div>
              <p className="text-sm opacity-90 font-medium mb-1">Delivery Rate</p>
              <p className="text-4xl font-black mb-2">{aiInsights.deliveryRate}%</p>
              <div className="flex items-center gap-2">
                <span className="px-2 py-1 bg-white/20 rounded-full text-xs font-semibold">Success Rate</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Customer Analytics Card */}
      {customerAnalytics && (
        <div className="relative bg-white/70 backdrop-blur-xl rounded-2xl shadow-2xl border border-purple-100 p-6 mb-8 overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-purple-200 to-blue-200 rounded-full blur-3xl opacity-30 -mr-32 -mt-32"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl">
                  <UserGroupIcon className="h-6 w-6 text-white" />
                </div>
                <span className="bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">Customer Insights</span>
              </h3>
              <button
                onClick={() => setShowAnalytics(!showAnalytics)}
                className="px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white rounded-xl text-sm font-semibold transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                {showAnalytics ? '👁️ Hide' : '✨ Show'} Details
              </button>
            </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-gray-600">Total Customers</p>
              <p className="text-2xl font-bold text-gray-900">{customerAnalytics.totalCustomers}</p>
            </div>
            <div>
              <p className="text-xs text-gray-600">Repeat Customers</p>
              <p className="text-2xl font-bold text-purple-600">{customerAnalytics.repeatCustomers}</p>
            </div>
            <div>
              <p className="text-xs text-gray-600">Repeat Rate</p>
              <p className="text-2xl font-bold text-blue-600">{aiInsights.repeatRate}%</p>
            </div>
            <div>
              <p className="text-xs text-gray-600">Avg Customer Value</p>
              <p className="text-2xl font-bold text-green-600">{(customerAnalytics.avgCustomerValue / 1000).toFixed(1)}K</p>
            </div>
          </div>

          {showAnalytics && (
            <div className="mt-4 pt-4 border-t border-purple-200">
              <h4 className="font-semibold text-gray-900 mb-3">Top 5 Customers</h4>
              <div className="space-y-2">
                {customerAnalytics.topCustomers.map((customer, idx) => (
                  <div key={idx} className="flex justify-between items-center bg-white rounded-lg p-3 shadow-sm">
                    <div>
                      <p className="font-medium text-gray-900">{customer.name}</p>
                      <p className="text-xs text-gray-500">{customer.phone}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-purple-600">{(customer.revenue / 1000).toFixed(1)}K RWF</p>
                      <p className="text-xs text-gray-500">{customer.count} orders</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          </div>
        </div>
      )}

      {/* AI Recommendation Card */}
      {aiInsights && aiInsights.pendingOrders > 0 && (
        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-l-4 border-orange-500 rounded-lg shadow-md p-4 mb-6">
          <div className="flex items-start gap-3">
            <SparklesIcon className="h-6 w-6 text-orange-600 flex-shrink-0 mt-1" />
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 mb-1">AI Recommendation</h3>
              <p className="text-sm text-gray-700">{aiInsights.recommendation}</p>
              <div className="flex gap-4 mt-2 text-xs text-gray-600">
                <span>⏳ {aiInsights.pendingOrders} Pending</span>
                <span>🔄 {aiInsights.processingOrders} Processing</span>
                <span>❌ {aiInsights.cancellationRate}% Cancellation Rate</span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-600">Projected Revenue (30d)</p>
              <p className="text-lg font-bold text-orange-600">{(aiInsights.projectedRevenue / 1000).toFixed(0)}K</p>
            </div>
          </div>
        </div>
      )}

      {/* Smart Filters & Actions Bar */}
      <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-6 mb-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all transform hover:scale-105 ${activeFilter === 'all' ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-500/50' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              ✨ All Orders
            </button>
            <button
              onClick={() => setActiveFilter('pending')}
              className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all transform hover:scale-105 ${activeFilter === 'pending' ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-lg shadow-yellow-500/50' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              ⏳ Pending ({orders.filter(o => o.status === 'pending').length})
            </button>
            <button
              onClick={() => setActiveFilter('processing')}
              className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all transform hover:scale-105 ${activeFilter === 'processing' ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-500/50' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              🔄 Processing ({orders.filter(o => o.status === 'processing').length})
            </button>
            <button
              onClick={() => setActiveFilter('delivered')}
              className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all transform hover:scale-105 ${activeFilter === 'delivered' ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg shadow-green-500/50' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              ✅ Delivered ({orders.filter(o => o.status === 'delivered').length})
            </button>
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={exportToCSV}
              className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-sm font-bold transition-all shadow-lg hover:shadow-xl hover:shadow-emerald-500/50 transform hover:scale-105"
            >
              📊 Export CSV
            </button>
            {selectedOrders.length > 0 && (
              <div className="flex gap-2 items-center">
                <span className="text-sm text-gray-600">{selectedOrders.length} selected</span>
                <select
                  onChange={(e) => {
                    if (e.target.value) {
                      handleBulkStatusUpdate(e.target.value);
                      e.target.value = '';
                    }
                  }}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white hover:border-purple-400 focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">Bulk Action</option>
                  <option value="processing">Mark Processing</option>
                  <option value="shipped">Mark Shipped</option>
                  <option value="delivered">Mark Delivered</option>
                  <option value="cancelled">Cancel Orders</option>
                </select>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-6 mb-6">
        <div className="relative max-w-2xl">
          <div className="absolute left-4 top-1/2 transform -translate-y-1/2 p-2 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-lg">
            <MagnifyingGlassIcon className="h-5 w-5 text-white" />
          </div>
          <input
            type="text"
            placeholder="🔍 Search by order number, customer name, phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-16 pr-6 py-4 border-2 border-purple-200 rounded-2xl focus:ring-4 focus:ring-purple-500/30 focus:border-purple-500 transition-all text-gray-800 placeholder-gray-400 font-medium shadow-inner"
          />
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 overflow-hidden">
        {loading ? (
          <div className="text-center py-16">
            <div className="relative mx-auto w-16 h-16">
              <div className="absolute inset-0 animate-spin rounded-full border-4 border-purple-200 border-t-purple-600"></div>
              <div className="absolute inset-2 animate-pulse rounded-full border-4 border-blue-200 border-t-blue-600"></div>
            </div>
            <p className="mt-4 text-purple-600 font-semibold">✨ Loading orders...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gradient-to-r from-purple-50 to-blue-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    <input
                      type="checkbox"
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedOrders(filteredOrders.map(o => o.id));
                        } else {
                          setSelectedOrders([]);
                        }
                      }}
                      checked={selectedOrders.length === filteredOrders.length && filteredOrders.length > 0}
                      className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order #</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredOrders.map((order) => (
                  <tr key={order.id} className={`hover:bg-purple-50 transition-colors ${selectedOrders.includes(order.id) ? 'bg-purple-50' : ''}`}>
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedOrders.includes(order.id)}
                        onChange={() => toggleOrderSelection(order.id)}
                        className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                      />
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{order.orderNumber}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {order.customerInfo?.firstName} {order.customerInfo?.lastName}
                      <div className="text-xs text-gray-500">{order.customerInfo?.phone}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {order.totalAmount?.toLocaleString()} RWF
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs rounded-full ${statusColors[order.status] || 'bg-gray-100 text-gray-800'}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => viewOrderDetails(order)}
                          className="group relative bg-gradient-to-r from-purple-500 via-indigo-600 to-blue-500 hover:from-purple-600 hover:via-indigo-700 hover:to-blue-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 text-xs font-bold transition-all shadow-lg hover:shadow-2xl hover:shadow-purple-500/50 transform hover:scale-110"
                        >
                          <EyeIcon className="h-4 w-4 group-hover:rotate-12 transition-transform" />
                          View
                          <SparklesIcon className="h-3 w-3 opacity-75" />
                        </button>
                        <select
                          value={order.status}
                          onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                          className="border border-gray-300 rounded-lg px-2 py-1.5 text-xs hover:border-purple-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                        >
                          <option value="pending">Pending</option>
                          <option value="processing">Processing</option>
                          <option value="shipped">Shipped</option>
                          <option value="delivered">Delivered</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredOrders.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500">No orders found</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Order Details Modal */}
      {showOrderModal && selectedOrder && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto transform animate-slideUp">
            {/* Modal Header */}
            <div className="sticky top-0 bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 text-white p-8 rounded-t-3xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full blur-3xl -ml-24 -mb-24"></div>
              <div className="relative z-10 flex items-center justify-between">
                <div>
                  <h3 className="text-3xl font-black flex items-center gap-3">
                    <SparklesIcon className="h-8 w-8 animate-pulse" />
                    Order Details
                  </h3>
                  <p className="text-sm opacity-90 mt-2 font-medium">Order #{selectedOrder.orderNumber}</p>
                </div>
                <button
                  onClick={closeModal}
                  className="hover:bg-white/20 backdrop-blur-sm rounded-2xl p-3 transition-all transform hover:scale-110 hover:rotate-90"
                >
                  <XMarkIcon className="h-7 w-7" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Customer Info */}
              <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <UserGroupIcon className="h-5 w-5 text-purple-600" />
                  Customer Information
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Name</p>
                    <p className="font-semibold text-gray-900">
                      {selectedOrder.customerInfo?.firstName} {selectedOrder.customerInfo?.lastName}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Phone</p>
                    <p className="font-semibold text-gray-900">{selectedOrder.customerInfo?.phone}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Email</p>
                    <p className="font-semibold text-gray-900">{selectedOrder.customerInfo?.email || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Order Date</p>
                    <p className="font-semibold text-gray-900">
                      {new Date(selectedOrder.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
              </div>

              {/* Shipping Address */}
              <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-xl p-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <TruckIcon className="h-5 w-5 text-green-600" />
                  Shipping Address
                </h4>
                <div className="text-sm space-y-1">
                  <p className="text-gray-700">{selectedOrder.shippingAddress?.street || selectedOrder.shippingAddress?.address}</p>
                  <p className="text-gray-700">
                    {selectedOrder.shippingAddress?.city}, {selectedOrder.shippingAddress?.district}
                  </p>
                  <p className="text-gray-700">{selectedOrder.shippingAddress?.province}</p>
                  {selectedOrder.shippingAddress?.postalCode && (
                    <p className="text-gray-700">Postal Code: {selectedOrder.shippingAddress.postalCode}</p>
                  )}
                </div>
              </div>

              {/* Order Items */}
              <div className="bg-gradient-to-br from-orange-50 to-yellow-50 rounded-xl p-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <ChartBarIcon className="h-5 w-5 text-orange-600" />
                  Order Items
                </h4>
                <div className="space-y-3">
                  {selectedOrder.items?.map((item, index) => (
                    <div key={index} className="flex gap-4 items-start bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                      {/* Product Image */}
                      <div className="flex-shrink-0">
                        <img
                          src={item.productImage || item.mainImage || item.product?.mainImage || item.product?.image || item.image || PLACEHOLDER_IMAGES.small}
                          alt={item.productName || item.product?.name || item.name || 'Product'}
                          className="w-20 h-20 object-cover rounded-lg border-2 border-gray-200"
                          onError={(e) => handleImageError(e, 'small')}
                        />
                      </div>
                      
                      {/* Product Details */}
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">{item.productName || item.product?.name || item.name || 'Product'}</p>
                        <div className="mt-2 space-y-1">
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Quantity:</span> {item.quantity}
                          </p>
                          {(item.variant?.size || item.size) && (
                            <p className="text-sm text-gray-600">
                              <span className="font-medium">Size:</span> <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium">{item.variant?.size || item.size}</span>
                            </p>
                          )}
                          {(item.variant?.color || item.color) && (
                            <p className="text-sm text-gray-600">
                              <span className="font-medium">Color:</span> <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs font-medium">{item.variant?.color || item.color}</span>
                            </p>
                          )}
                          {(item.variant?.material || item.material) && (
                            <p className="text-sm text-gray-600">
                              <span className="font-medium">Material:</span> <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs font-medium">{item.variant?.material || item.material}</span>
                            </p>
                          )}
                        </div>
                      </div>
                      
                      {/* Price */}
                      <div className="text-right flex-shrink-0">
                        <p className="font-bold text-lg text-gray-900">{((item.price || 0) * (item.quantity || 1)).toLocaleString()} RWF</p>
                        <p className="text-xs text-gray-500">{(item.price || 0).toLocaleString()} RWF each</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Order Summary */}
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <CurrencyDollarIcon className="h-5 w-5 text-purple-600" />
                  Order Summary
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-semibold text-gray-900">{selectedOrder.subtotal?.toLocaleString() || '0'} RWF</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Shipping</span>
                    <span className="font-semibold text-gray-900">{selectedOrder.shippingCost?.toLocaleString() || '0'} RWF</span>
                  </div>
                  {selectedOrder.discount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount</span>
                      <span className="font-semibold">-{selectedOrder.discount.toLocaleString()} RWF</span>
                    </div>
                  )}
                  <div className="border-t border-gray-300 pt-2 mt-2">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-bold text-gray-900">Total</span>
                      <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                        {selectedOrder.totalAmount?.toLocaleString()} RWF
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* AI-Generated Customer Insights */}
              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border-l-4 border-purple-500 rounded-lg p-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <SparklesIcon className="h-5 w-5 text-purple-600" />
                  AI Customer Insights
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <CheckCircleIcon className="h-5 w-5 text-green-600" />
                    <span className="text-gray-700">
                      Customer order value: {selectedOrder.totalAmount > 50000 ? 'High-value' : 'Standard'} ({selectedOrder.totalAmount?.toLocaleString()} RWF)
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ChartBarIcon className="h-5 w-5 text-blue-600" />
                    <span className="text-gray-700">
                      Recommended action: {selectedOrder.status === 'pending' ? 'Process immediately to improve delivery time' : 'Continue monitoring'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <UserGroupIcon className="h-5 w-5 text-purple-600" />
                    <span className="text-gray-700">
                      Customer segment: {selectedOrder.totalAmount > 100000 ? 'VIP' : selectedOrder.totalAmount > 50000 ? 'Premium' : 'Regular'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={closeModal}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 rounded-lg transition-all"
                >
                  Close
                </button>
                <button
                  className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-3 rounded-lg transition-all shadow-lg hover:shadow-xl"
                  onClick={() => {
                    alert('Print/Export functionality can be added here');
                  }}
                >
                  Print Order
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOrdersEnhanced;
