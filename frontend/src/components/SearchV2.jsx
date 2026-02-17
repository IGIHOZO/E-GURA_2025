import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';

const SearchV2 = ({ onResultsChange }) => {
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState({});
  const [sortBy, setSortBy] = useState('relevance');
  const [results, setResults] = useState([]);
  const [facets, setFacets] = useState({});
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});
  const [showFilters, setShowFilters] = useState(true);
  const [deviceId, setDeviceId] = useState('');
  const [activeFilters, setActiveFilters] = useState([]);
  const [searchMode, setSearchMode] = useState('hybrid'); // hybrid, keyword, semantic
  const [performance, setPerformance] = useState(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);
  
  const debounceTimer = useRef(null);
  const searchInputRef = useRef(null);
  const cancelTokenRef = useRef(null);
  const API_BASE = '/api/v2/search';

  // Initialize device ID and recent searches
  useEffect(() => {
    let id = localStorage.getItem('deviceId');
    if (!id) {
      id = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('deviceId', id);
    }
    setDeviceId(id);

    // Load recent searches
    const recent = JSON.parse(localStorage.getItem('recentSearches') || '[]');
    setRecentSearches(recent);
  }, []);

  // Save recent searches
  const saveRecentSearch = (searchQuery) => {
    if (!searchQuery.trim()) return;
    const recent = JSON.parse(localStorage.getItem('recentSearches') || '[]');
    const updated = [searchQuery, ...recent.filter(s => s !== searchQuery)].slice(0, 10);
    localStorage.setItem('recentSearches', JSON.stringify(updated));
    setRecentSearches(updated);
  };

  // Debounced search
  const debouncedSearch = useCallback((searchQuery) => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    
    // Only search if there's a query
    if (!searchQuery || searchQuery.trim() === '') {
      setResults([]);
      setLoading(false);
      return;
    }
    
    debounceTimer.current = setTimeout(() => {
      performSearch(searchQuery, filters, sortBy, 1);
    }, 300);
  }, [filters, sortBy]);

  // Perform search with advanced features
  const performSearch = async (searchQuery, searchFilters, searchSort, searchPage) => {
    console.log('🔍 Starting search with:', {
      query: searchQuery,
      filters: searchFilters,
      sortBy: searchSort,
      page: searchPage,
      searchMode
    });

    // Cancel previous request if exists
    if (cancelTokenRef.current) {
      cancelTokenRef.current.cancel('New search initiated');
    }
    
    // Create new cancel token
    cancelTokenRef.current = axios.CancelToken.source();
    
    setLoading(true);
    const startTime = performance.now();
    
    try {
      const response = await axios.post(API_BASE, {
        query: searchQuery,
        filters: searchFilters,
        sortBy: searchSort,
        page: searchPage,
        limit: 20,
        deviceId,
        searchMode // Pass search mode to backend
      }, {
        timeout: 15000, // 15 second timeout
        cancelToken: cancelTokenRef.current.token
      });

      const endTime = performance.now();
      const clientLatency = endTime - startTime;

      if (response.data.success) {
        console.log('✅ Search successful:', {
          resultsCount: response.data.data?.length || 0,
          totalProducts: response.data.pagination?.total || 0,
          latency: response.data.performance?.latency
        });

        setResults(response.data.data || []);
        setFacets(response.data.facets || {});
        setPagination(response.data.pagination || {});
        setPerformance({
          ...response.data.performance,
          clientLatency: Math.round(clientLatency),
          cached: response.data.cached || false
        });
        
        // Update active filters display
        updateActiveFilters(searchFilters);
        
        // Save to recent searches
        if (searchQuery) {
          saveRecentSearch(searchQuery);
        }
        
        if (onResultsChange) onResultsChange(response.data.data || []);
      } else {
        // Handle unsuccessful response
        console.error('Search unsuccessful:', response.data);
        setResults([]);
        setFacets({});
        setPagination({});
      }
    } catch (error) {
      // Ignore cancelled requests
      if (axios.isCancel(error)) {
        console.log('Search cancelled:', error.message);
        return;
      }

      console.error('Search error:', error);
      console.error('Error details:', error.response?.data || error.message);

      // Show user-friendly error message
      if (error.code === 'ECONNABORTED') {
        console.error('Search timeout - request took too long');
      } else if (error.response?.status === 503) {
        console.error('Search service unavailable');
      } else if (!error.response) {
        console.error('Cannot connect to search server');
      }

      // Set empty results on error
      setResults([]);
      setFacets({});
      setPagination({});
    } finally {
      console.log('Search request completed, setting loading to false');
      setLoading(false);
    }
  };

  // Update active filters for display
  const updateActiveFilters = (searchFilters) => {
    const active = [];
    Object.entries(searchFilters).forEach(([key, value]) => {
      if (value && value !== '') {
        if (Array.isArray(value) && value.length > 0) {
          value.forEach(v => active.push({ key, value: v, label: `${key}: ${v}` }));
        } else {
          active.push({ key, value, label: `${key}: ${value}` });
        }
      }
    });
    setActiveFilters(active);
  };

  // Get suggestions with debouncing
  const getSuggestions = async (q) => {
    if (q.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    try {
      const response = await axios.get(`${API_BASE}/suggestions?q=${encodeURIComponent(q)}`);
      if (response.data.success) {
        setSuggestions(response.data.suggestions);
        setShowSuggestions(true);
      }
    } catch (error) {
      console.error('Suggestions error:', error);
    }
  };

  // Remove a filter
  const removeFilter = (filterKey, filterValue) => {
    const newFilters = { ...filters };
    if (Array.isArray(newFilters[filterKey])) {
      newFilters[filterKey] = newFilters[filterKey].filter(v => v !== filterValue);
      if (newFilters[filterKey].length === 0) {
        delete newFilters[filterKey];
      }
    } else {
      delete newFilters[filterKey];
    }
    setFilters(newFilters);
    performSearch(query, newFilters, sortBy, 1);
  };

  // Clear all filters
  const clearAllFilters = () => {
    setFilters({});
    performSearch(query, {}, sortBy, 1);
  };

  // Handle query change
  const handleQueryChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    getSuggestions(value);
    debouncedSearch(value);
  };

  // Handle filter change
  const handleFilterChange = (filterKey, value) => {
    const newFilters = { ...filters, [filterKey]: value };
    setFilters(newFilters);
    performSearch(query, newFilters, sortBy, 1);
  };

  // Handle sort change
  const handleSortChange = (newSort) => {
    setSortBy(newSort);
    performSearch(query, filters, newSort, 1);
  };

  // Handle page change
  const handlePageChange = (newPage) => {
    setPage(newPage);
    performSearch(query, filters, sortBy, newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Track product click
  const trackClick = async (productId, position) => {
    try {
      await axios.post(`${API_BASE}/track`, {
        eventType: 'click',
        productId,
        query,
        clickPosition: position,
        deviceId
      });
    } catch (error) {
      console.error('Tracking error:', error);
    }
  };

  return (
    <div className="search-v2 max-w-7xl mx-auto px-4 py-6">
      {/* Header with Search Mode Toggle */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-bold text-gray-900">Search V2</h1>
          <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setSearchMode('hybrid')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                searchMode === 'hybrid'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              🔥 Hybrid
            </button>
            <button
              onClick={() => setSearchMode('keyword')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                searchMode === 'keyword'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              📝 Keyword
            </button>
            <button
              onClick={() => setSearchMode('semantic')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                searchMode === 'semantic'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              🧠 Semantic
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <div className="relative">
            <input
              ref={searchInputRef}
              type="text"
              value={query}
              onChange={handleQueryChange}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              placeholder="Search for products... (Try: 'red dress', 'running shoes', 'leather bag')"
              className="w-full px-6 py-4 pr-14 text-lg border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm"
            />
            <div className="absolute right-4 top-4 flex items-center gap-2">
              {loading && (
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
              )}
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          {/* Suggestions Dropdown */}
          <AnimatePresence>
            {showSuggestions && (suggestions.length > 0 || recentSearches.length > 0) && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-2xl overflow-hidden"
              >
                {/* Recent Searches */}
                {query.length === 0 && recentSearches.length > 0 && (
                  <div className="p-2">
                    <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase">Recent Searches</div>
                    {recentSearches.map((recent, idx) => (
                      <div
                        key={idx}
                        onClick={() => {
                          setQuery(recent);
                          performSearch(recent, filters, sortBy, 1);
                        }}
                        className="px-4 py-2 hover:bg-blue-50 cursor-pointer rounded-lg flex items-center gap-2"
                      >
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-gray-700">{recent}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Suggestions */}
                {suggestions.length > 0 && (
                  <div className="p-2 border-t border-gray-100">
                    <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase">Suggestions</div>
                    {suggestions.map((suggestion, idx) => (
                      <div
                        key={idx}
                        onClick={() => {
                          setQuery(suggestion);
                          setSuggestions([]);
                          performSearch(suggestion, filters, sortBy, 1);
                        }}
                        className="px-4 py-2 hover:bg-blue-50 cursor-pointer rounded-lg flex items-center gap-2"
                      >
                        <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <span className="text-gray-700 font-medium">{suggestion}</span>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Performance Metrics */}
        {performance && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-3 flex items-center gap-4 text-sm text-gray-600"
          >
            <span className="flex items-center gap-1">
              ⚡ {performance.latency}ms
            </span>
            <span className="flex items-center gap-1">
              📦 {performance.totalProducts} products scanned
            </span>
            <span className="flex items-center gap-1">
              ✅ {performance.filteredProducts} matched
            </span>
            {performance.cached && (
              <span className="flex items-center gap-1 text-green-600">
                💾 Cached
              </span>
            )}
          </motion.div>
        )}
      </div>

      {/* Active Filters & Controls */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            {showFilters ? 'Hide' : 'Show'} Filters
            {activeFilters.length > 0 && (
              <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                {activeFilters.length}
              </span>
            )}
          </button>

          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-gray-700">Sort by:</label>
            <select
              value={sortBy}
              onChange={(e) => handleSortChange(e.target.value)}
              className="px-4 py-2 border-2 border-gray-300 rounded-lg bg-white font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="relevance">🎯 Most Relevant</option>
              <option value="price_asc">💰 Price: Low to High</option>
              <option value="price_desc">💎 Price: High to Low</option>
              <option value="newest">✨ Newest First</option>
              <option value="rating">⭐ Highest Rated</option>
              <option value="popular">🔥 Most Popular</option>
            </select>
          </div>
        </div>

        {/* Active Filters Chips */}
        {activeFilters.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-wrap items-center gap-2 mb-4"
          >
            <span className="text-sm font-medium text-gray-700">Active Filters:</span>
            {activeFilters.map((filter, idx) => (
              <motion.div
                key={idx}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                className="flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium"
              >
                <span>{filter.label}</span>
                <button
                  onClick={() => removeFilter(filter.key, filter.value)}
                  className="hover:bg-blue-200 rounded-full p-0.5 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </motion.div>
            ))}
            <button
              onClick={clearAllFilters}
              className="text-sm text-red-600 hover:text-red-700 font-medium underline"
            >
              Clear All
            </button>
          </motion.div>
        )}
      </div>

      <div className="flex gap-6">
        {/* Filters Sidebar */}
        {showFilters && facets && (
          <div className="w-64 flex-shrink-0">
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="font-bold mb-4">Filters</h3>

              {/* Categories */}
              {facets.categories && facets.categories.length > 0 && (
                <div className="mb-4">
                  <h4 className="font-semibold mb-2">Category</h4>
                  {facets.categories.slice(0, 8).map((cat) => (
                    <label key={cat.name} className="flex items-center mb-2">
                      <input
                        type="radio"
                        name="category"
                        checked={filters.category === cat.name}
                        onChange={() => handleFilterChange('category', cat.name)}
                        className="mr-2"
                      />
                      <span className="text-sm">{cat.name} ({cat.count})</span>
                    </label>
                  ))}
                </div>
              )}

              {/* Price Range */}
              <div className="mb-4">
                <h4 className="font-semibold mb-2">Price Range</h4>
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={filters.minPrice || ''}
                    onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                    className="w-full px-2 py-1 border rounded text-sm"
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    value={filters.maxPrice || ''}
                    onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                    className="w-full px-2 py-1 border rounded text-sm"
                  />
                </div>
              </div>

              {/* Colors */}
              {facets.colors && facets.colors.length > 0 && (
                <div className="mb-4">
                  <h4 className="font-semibold mb-2">Colors</h4>
                  <div className="flex flex-wrap gap-2">
                    {facets.colors.slice(0, 10).map((color) => (
                      <button
                        key={color.name}
                        onClick={() => {
                          const colors = filters.colors || [];
                          const newColors = colors.includes(color.name)
                            ? colors.filter(c => c !== color.name)
                            : [...colors, color.name];
                          handleFilterChange('colors', newColors);
                        }}
                        className={`px-3 py-1 text-xs rounded-full ${
                          filters.colors?.includes(color.name)
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-200'
                        }`}
                      >
                        {color.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Clear Filters */}
              {Object.keys(filters).length > 0 && (
                <button
                  onClick={() => {
                    setFilters({});
                    performSearch(query, {}, sortBy, 1);
                  }}
                  className="w-full px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                >
                  Clear All Filters
                </button>
              )}
            </div>
          </div>
        )}

        {/* Results */}
        <div className="flex-1">
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
              <p className="mt-4 text-gray-600">Searching...</p>
            </div>
          ) : results.length > 0 ? (
            <>
              <div className="mb-4 text-sm text-gray-600">
                Showing {pagination.page * pagination.limit - pagination.limit + 1}-
                {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} results
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {results.map((product, idx) => (
                  <motion.div
                    key={product._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    onClick={() => trackClick(product._id, idx)}
                    className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all cursor-pointer group overflow-hidden border border-gray-100"
                  >
                    <div className="relative overflow-hidden">
                      <img
                        src={product.mainImage}
                        alt={product.name}
                        className="w-full h-56 object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                      {product._scores && (
                        <div className="absolute top-2 right-2 bg-black/70 text-white px-2 py-1 rounded-lg text-xs font-medium">
                          Score: {(product._scores.final * 100).toFixed(0)}%
                        </div>
                      )}
                      {product.isNew && (
                        <div className="absolute top-2 left-2 bg-green-500 text-white px-2 py-1 rounded-lg text-xs font-bold">
                          NEW
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-base mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
                        {product.name}
                      </h3>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xl font-bold text-blue-600">
                          {product.price?.toLocaleString()} RWF
                        </p>
                        {product.originalPrice && product.originalPrice > product.price && (
                          <span className="text-sm text-gray-400 line-through">
                            {product.originalPrice?.toLocaleString()}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        {product.averageRating > 0 && (
                          <div className="flex items-center gap-1">
                            <span className="text-yellow-500">★</span>
                            <span className="font-medium">{product.averageRating.toFixed(1)}</span>
                            <span className="text-gray-400">({product.rating?.count || 0})</span>
                          </div>
                        )}
                        {product.stockQuantity !== undefined && (
                          <span className={`text-xs font-medium ${
                            product.stockQuantity > 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {product.stockQuantity > 0 ? `${product.stockQuantity} in stock` : 'Out of stock'}
                          </span>
                        )}
                      </div>
                      {/* Score Breakdown (Debug Mode) */}
                      {product._scores && searchMode === 'hybrid' && (
                        <div className="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-600 space-y-1">
                          <div className="flex justify-between">
                            <span>BM25:</span>
                            <span className="font-medium">{(product._scores.bm25 * 100).toFixed(0)}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Vector:</span>
                            <span className="font-medium">{(product._scores.vector * 100).toFixed(0)}%</span>
                          </div>
                          {product._scores.personalized > 0 && (
                            <div className="flex justify-between text-purple-600">
                              <span>Personalized:</span>
                              <span className="font-medium">+{(product._scores.personalized * 100).toFixed(0)}%</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-8">
                  <button
                    onClick={() => handlePageChange(page - 1)}
                    disabled={page === 1}
                    className="px-4 py-2 border rounded-lg disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <span className="px-4 py-2">
                    Page {page} of {pagination.totalPages}
                  </span>
                  <button
                    onClick={() => handlePageChange(page + 1)}
                    disabled={!pagination.hasMore}
                    className="px-4 py-2 border rounded-lg disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-600">No products found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchV2;
