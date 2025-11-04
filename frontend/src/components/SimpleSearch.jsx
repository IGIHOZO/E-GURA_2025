import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const SimpleSearch = ({ onResultsChange }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searched, setSearched] = useState(false);

  const abortControllerRef = useRef(null);
  const API_BASE = '/api/v2/search';

  // Cleanup function to cancel ongoing requests
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Simple search function without complex debouncing
  const performSearch = async (searchQuery) => {
    if (!searchQuery.trim()) {
      setResults([]);
      setSearched(false);
      return;
    }

    // Cancel any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController();

    setLoading(true);
    setError(null);

    try {
      console.log('🔍 Searching for:', searchQuery);

      const response = await axios.post(`${API_BASE}`, {
        query: searchQuery,
        filters: {},
        sortBy: 'relevance',
        page: 1,
        limit: 20
      }, {
        timeout: 10000,
        signal: abortControllerRef.current.signal
      });

      if (response.data && response.data.success) {
        console.log('✅ Search successful:', response.data.data?.length || 0, 'results');
        setResults(response.data.data || []);
        setSearched(true);
        if (onResultsChange) onResultsChange(response.data.data || []);
      } else {
        throw new Error('Search failed');
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('🔄 Search cancelled');
        return;
      }

      console.error('❌ Search error:', error.message);

      if (error.response) {
        setError(`Server error: ${error.response.status}`);
      } else if (error.code === 'ECONNABORTED') {
        setError('Search timeout - please try again');
      } else if (!navigator.onLine) {
        setError('No internet connection');
      } else {
        setError('Search failed - please try again');
      }

      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  // Handle search input
  const handleSearch = (e) => {
    e.preventDefault();
    performSearch(query);
  };

  // Handle input change
  const handleInputChange = (e) => {
    setQuery(e.target.value);
    setError(null);
  };

  return (
    <div className="simple-search max-w-4xl mx-auto px-4 py-8">
      {/* Search Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Product Search</h1>

        {/* Search Form */}
        <form onSubmit={handleSearch} className="mb-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <input
                type="text"
                value={query}
                onChange={handleInputChange}
                placeholder="Search for products... (e.g., dress, shoes, bag)"
                className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={loading}
              />
            </div>
            <button
              type="submit"
              disabled={loading || !query.trim()}
              className={`px-8 py-3 text-lg font-medium rounded-lg transition-colors ${
                loading || !query.trim()
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {loading ? 'Searching...' : 'Search'}
            </button>
          </div>
        </form>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700">{error}</p>
            <button
              onClick={() => performSearch(query)}
              className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
            >
              Try again
            </button>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">Searching for products...</p>
          </div>
        )}

        {/* Search Status */}
        {!loading && !error && searched && (
          <div className="mb-4 text-sm text-gray-600">
            {results.length > 0
              ? `Found ${results.length} product${results.length !== 1 ? 's' : ''}`
              : 'No products found'
            }
          </div>
        )}
      </div>

      {/* Search Results */}
      {!loading && results.length > 0 && (
        <div className="results-section">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {results.map((product, idx) => (
              <div
                key={product._id || idx}
                className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow border border-gray-200 overflow-hidden"
              >
                <div className="aspect-w-16 aspect-h-12">
                  <img
                    src={product.mainImage || '/placeholder-image.jpg'}
                    alt={product.name}
                    className="w-full h-48 object-cover"
                    onError={(e) => {
                      e.target.src = '/placeholder-image.jpg';
                    }}
                  />
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-lg mb-2 line-clamp-2">
                    {product.name}
                  </h3>
                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                    {product.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <p className="text-xl font-bold text-blue-600">
                      {product.price?.toLocaleString()} RWF
                    </p>
                    {product.stockQuantity !== undefined && (
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        product.stockQuantity > 0
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {product.stockQuantity > 0 ? 'In Stock' : 'Out of Stock'}
                      </span>
                    )}
                  </div>
                  {product.category && (
                    <p className="text-sm text-gray-500 mt-2">
                      Category: {product.category}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && searched && results.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
          <p className="text-gray-600 mb-4">
            Try searching with different keywords or check your spelling.
          </p>
          <button
            onClick={() => setQuery('')}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            Clear search
          </button>
        </div>
      )}

      {/* Initial State */}
      {!loading && !error && !searched && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Search for products</h3>
          <p className="text-gray-600">
            Enter keywords above to find products in our catalog.
          </p>
        </div>
      )}
    </div>
  );
};

export default SimpleSearch;
