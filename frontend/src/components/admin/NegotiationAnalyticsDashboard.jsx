import React, { useState, useEffect } from 'react';
import axios from 'axios';

const NegotiationAnalyticsDashboard = () => {
  const [analytics, setAnalytics] = useState(null);
  const [realTimeMetrics, setRealTimeMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [selectedSku, setSelectedSku] = useState('');

  const API_URL = import.meta.env.VITE_API_URL || '';

  useEffect(() => {
    loadAnalytics();
    loadRealTimeMetrics();
    
    // Refresh real-time metrics every 30 seconds
    const interval = setInterval(loadRealTimeMetrics, 30000);
    return () => clearInterval(interval);
  }, [dateRange, selectedSku]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate
      });
      if (selectedSku) params.append('sku', selectedSku);

      const response = await axios.get(`${API_URL}/api/negotiation/admin/analytics?${params}`);
      setAnalytics(response.data.data);
    } catch (err) {
      console.error('Load analytics error:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadRealTimeMetrics = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/negotiation/admin/analytics/realtime`);
      setRealTimeMetrics(response.data.data);
    } catch (err) {
      console.error('Load real-time metrics error:', err);
    }
  };

  const exportCSV = async () => {
    try {
      const params = new URLSearchParams({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate
      });
      if (selectedSku) params.append('sku', selectedSku);

      const response = await axios.get(
        `${API_URL}/api/negotiation/admin/analytics/export?${params}`,
        { responseType: 'blob' }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `negotiation-analytics-${dateRange.startDate}-to-${dateRange.endDate}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Export error:', err);
    }
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('en-RW').format(num || 0);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-RW', {
      style: 'currency',
      currency: 'RWF',
      minimumFractionDigits: 0
    }).format(amount || 0);
  };

  if (loading && !analytics) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Negotiation Analytics</h2>
          <button
            onClick={exportCSV}
            className="bg-green-500 text-white px-6 py-2 rounded-lg font-semibold hover:bg-green-600 transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export CSV
          </button>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Start Date
            </label>
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              End Date
            </label>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              SKU Filter
            </label>
            <input
              type="text"
              value={selectedSku}
              onChange={(e) => setSelectedSku(e.target.value)}
              placeholder="All SKUs"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
            />
          </div>
        </div>
      </div>

      {/* Real-Time Metrics */}
      {realTimeMetrics && (
        <div className="grid grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Active Negotiations</p>
                <p className="text-3xl font-bold mt-2">{realTimeMetrics.activeNegotiations}</p>
              </div>
              <svg className="w-12 h-12 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <p className="text-xs mt-4 opacity-75">Last 24 hours</p>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Recent Accepted</p>
                <p className="text-3xl font-bold mt-2">{realTimeMetrics.recentAccepted}</p>
              </div>
              <svg className="w-12 h-12 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-xs mt-4 opacity-75">Last 24 hours</p>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Avg Response Time</p>
                <p className="text-3xl font-bold mt-2">{Math.round(realTimeMetrics.avgResponseTimeMs)}ms</p>
              </div>
              <svg className="w-12 h-12 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <p className="text-xs mt-4 opacity-75">AI processing speed</p>
          </div>
        </div>
      )}

      {/* Key Metrics */}
      {analytics && (
        <>
          <div className="grid grid-cols-4 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-sm text-gray-600 mb-2">Total Negotiations</p>
              <p className="text-3xl font-bold text-gray-800">{formatNumber(analytics.totals.totalNegotiations)}</p>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-sm text-gray-600 mb-2">Conversion Rate</p>
              <p className="text-3xl font-bold text-green-600">{analytics.totals.avgConversionRate.toFixed(1)}%</p>
              {analytics.conversionLift !== 0 && (
                <p className="text-xs text-green-600 mt-2">
                  +{analytics.conversionLift.toFixed(1)}% lift
                </p>
              )}
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-sm text-gray-600 mb-2">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-800">{formatCurrency(analytics.totals.totalRevenue)}</p>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-sm text-gray-600 mb-2">Total Discount Given</p>
              <p className="text-2xl font-bold text-red-600">{formatCurrency(analytics.totals.totalDiscountGiven)}</p>
              <p className="text-xs text-gray-600 mt-2">
                {analytics.totals.avgDiscountPct.toFixed(1)}% avg
              </p>
            </div>
          </div>

          {/* Detailed Stats */}
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Negotiation Outcomes</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Accepted</span>
                  <div className="flex items-center gap-3">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-500 rounded-full h-2"
                        style={{
                          width: `${(analytics.totals.acceptedCount / analytics.totals.totalNegotiations) * 100}%`
                        }}
                      />
                    </div>
                    <span className="text-sm font-semibold w-16 text-right">
                      {formatNumber(analytics.totals.acceptedCount)}
                    </span>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Rejected</span>
                  <div className="flex items-center gap-3">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-red-500 rounded-full h-2"
                        style={{
                          width: `${(analytics.totals.rejectedCount / analytics.totals.totalNegotiations) * 100}%`
                        }}
                      />
                    </div>
                    <span className="text-sm font-semibold w-16 text-right">
                      {formatNumber(analytics.totals.rejectedCount)}
                    </span>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Abandoned</span>
                  <div className="flex items-center gap-3">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-yellow-500 rounded-full h-2"
                        style={{
                          width: `${(analytics.totals.abandonedCount / analytics.totals.totalNegotiations) * 100}%`
                        }}
                      />
                    </div>
                    <span className="text-sm font-semibold w-16 text-right">
                      {formatNumber(analytics.totals.abandonedCount)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Behavior Metrics</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm text-gray-600">Avg Rounds</span>
                    <span className="text-sm font-semibold">{analytics.totals.avgRounds.toFixed(1)}</span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm text-gray-600">Avg Time to Decision</span>
                    <span className="text-sm font-semibold">
                      {Math.round(analytics.totals.avgTimeToDecision)}s
                    </span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm text-gray-600">Margin Impact</span>
                    <span className="text-sm font-semibold text-red-600">
                      {analytics.totals.avgMarginImpact.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Daily Trend */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Daily Trend</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Date</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">SKU</th>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-gray-600">Total</th>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-gray-600">Accepted</th>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-gray-600">Conv %</th>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-gray-600">Avg Discount</th>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-gray-600">Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {analytics.dailyData.slice(0, 10).map((day) => (
                    <tr key={`${day.date}-${day.sku}`} className="hover:bg-gray-50">
                      <td className="px-4 py-2">{new Date(day.date).toLocaleDateString()}</td>
                      <td className="px-4 py-2 font-mono text-xs">{day.sku}</td>
                      <td className="px-4 py-2 text-right">{day.totalNegotiations}</td>
                      <td className="px-4 py-2 text-right">{day.acceptedCount}</td>
                      <td className="px-4 py-2 text-right">
                        <span className={`font-semibold ${
                          day.conversionRate >= 50 ? 'text-green-600' :
                          day.conversionRate >= 30 ? 'text-yellow-600' :
                          'text-red-600'
                        }`}>
                          {day.conversionRate.toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-4 py-2 text-right">{day.avgDiscountPct.toFixed(1)}%</td>
                      <td className="px-4 py-2 text-right">{formatCurrency(day.totalRevenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Segment Performance */}
          {analytics.dailyData.length > 0 && analytics.dailyData[0].segmentBreakdown && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Customer Segment Performance</h3>
              <div className="grid grid-cols-3 gap-6">
                {['new', 'returning', 'vip'].map((segment) => {
                  const segData = analytics.dailyData[0].segmentBreakdown[segment];
                  return (
                    <div key={segment} className="p-4 bg-gray-50 rounded-lg">
                      <h4 className="text-sm font-semibold text-gray-700 uppercase mb-3">{segment}</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-xs text-gray-600">Count</span>
                          <span className="text-sm font-semibold">{segData?.count || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-xs text-gray-600">Conversion</span>
                          <span className="text-sm font-semibold text-green-600">
                            {(segData?.conversionRate || 0).toFixed(1)}%
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-xs text-gray-600">Avg Discount</span>
                          <span className="text-sm font-semibold text-orange-600">
                            {(segData?.avgDiscount || 0).toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default NegotiationAnalyticsDashboard;
