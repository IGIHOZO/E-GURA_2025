import React, { useState, useEffect } from 'react';
import { useNetworkStatus } from '../utils/pwaUtils';

const OfflinePage = () => {
  const { isOnline } = useNetworkStatus();
  const [cachedProducts, setCachedProducts] = useState([]);
  const [lastVisitedPages, setLastVisitedPages] = useState([]);

  useEffect(() => {
    // Load cached data when offline
    loadCachedData();
  }, []);

  const loadCachedData = async () => {
    try {
      // Try to get cached products from localStorage or IndexedDB
      const cached = localStorage.getItem('cached-products');
      if (cached) {
        setCachedProducts(JSON.parse(cached).slice(0, 6)); // Show first 6 products
      }

      // Get last visited pages
      const visitedPages = localStorage.getItem('visited-pages');
      if (visitedPages) {
        setLastVisitedPages(JSON.parse(visitedPages).slice(0, 5));
      }
    } catch (error) {
      console.error('Error loading cached data:', error);
    }
  };

  const retryConnection = () => {
    window.location.reload();
  };

  if (isOnline) {
    return null; // Don't show offline page when online
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Offline Header */}
      <div className="bg-red-600 text-white p-4 text-center">
        <div className="flex items-center justify-center space-x-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M12 2.25a9.75 9.75 0 110 19.5 9.75 9.75 0 010-19.5z" />
          </svg>
          <span className="font-semibold">You're currently offline</span>
        </div>
        <p className="text-sm mt-1 opacity-90">
          Some features may not be available until you reconnect
        </p>
      </div>

      <div className="flex-1 p-4 max-w-4xl mx-auto w-full">
        {/* Main Offline Message */}
        <div className="text-center py-8">
          <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M12 2.25a9.75 9.75 0 110 19.5 9.75 9.75 0 010-19.5z" />
            </svg>
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            No Internet Connection
          </h1>
          <p className="text-gray-600 mb-6">
            Don't worry! You can still browse some content that was previously loaded.
          </p>

          <button
            onClick={retryConnection}
            className="bg-orange-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-orange-700 transition-colors inline-flex items-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>Try Again</span>
          </button>
        </div>

        {/* Cached Products */}
        {cachedProducts.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <svg className="w-5 h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Recently Viewed Products
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {cachedProducts.map((product, index) => (
                <div key={index} className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
                  <div className="aspect-square bg-gray-100 rounded-lg mb-3 flex items-center justify-center">
                    {product.image ? (
                      <img 
                        src={product.image} 
                        alt={product.name}
                        className="w-full h-full object-cover rounded-lg"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    ) : (
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    )}
                  </div>
                  <h3 className="font-semibold text-sm text-gray-900 line-clamp-2 mb-1">
                    {product.name || 'Product Name'}
                  </h3>
                  <p className="text-orange-600 font-bold text-sm">
                    {product.price ? `${product.price.toLocaleString()} RWF` : 'Price unavailable'}
                  </p>
                  <div className="mt-2">
                    <span className="inline-block bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded">
                      Cached
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Last Visited Pages */}
        {lastVisitedPages.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Recently Visited Pages
            </h2>
            <div className="space-y-2">
              {lastVisitedPages.map((page, index) => (
                <div key={index} className="bg-white rounded-lg p-3 border border-gray-200 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{page.title}</p>
                      <p className="text-gray-500 text-xs">{page.url}</p>
                    </div>
                  </div>
                  <span className="text-xs text-gray-400">
                    {page.timestamp && new Date(page.timestamp).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Offline Tips */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2 flex items-center">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Offline Tips
          </h3>
          <ul className="text-blue-800 text-sm space-y-1">
            <li>• Previously viewed products are still available</li>
            <li>• Your cart items are saved locally</li>
            <li>• You can browse cached pages</li>
            <li>• New orders require an internet connection</li>
          </ul>
        </div>

        {/* App Features Available Offline */}
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-sm font-medium text-gray-900">Browse Cache</p>
            <p className="text-xs text-gray-500">View saved products</p>
          </div>

          <div className="text-center p-4">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <p className="text-sm font-medium text-gray-900">View Cart</p>
            <p className="text-xs text-gray-500">Saved locally</p>
          </div>

          <div className="text-center p-4">
            <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <p className="text-sm font-medium text-gray-900">Limited Search</p>
            <p className="text-xs text-gray-500">Cached results only</p>
          </div>

          <div className="text-center p-4">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <p className="text-sm font-medium text-gray-900">No Checkout</p>
            <p className="text-xs text-gray-500">Requires connection</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OfflinePage;
