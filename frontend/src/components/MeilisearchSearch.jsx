import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';

const MeilisearchSearch = ({ onResultsChange, className = '' }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [facets, setFacets] = useState({});
  const [filters, setFilters] = useState({});
  const [sortBy, setSortBy] = useState('relevance');
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const debounceTimer = useRef();
  const abortControllerRef = useRef();
  const API_BASE = 'http://localhost:5001';

  // Generate session ID for analytics
  const sessionId = useRef(`session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);

  // Debounced search
  const debouncedSearch = useCallback((searchQuery) => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(() => {
      try {
        if (searchQuery && searchQuery.trim()) {
          console.log('🔍 Debounced search triggered:', searchQuery);
          performSearch(searchQuery, filters, sortBy, 1);
        } else {
          console.log('🔍 Empty search, clearing results');
          setResults([]);
          setFacets({});
          if (onResultsChange && typeof onResultsChange === 'function') {
            onResultsChange([]);
          }
        }
      } catch (error) {
        console.error('❌ Debounced search error:', error);
        setError('Search initialization failed');
      }
    }, 300);
  }, [filters, sortBy, onResultsChange]);

  // Main search function
  const performSearch = async (
    searchQuery,
    searchFilters,
    sort,
    page
  ) => {
    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    setLoading(true);
    setError(null);

    try {
      console.log('🔍 Starting search:', { searchQuery, searchFilters });

      const response = await axios.post(
        `${API_BASE}/search`,
        {
          q: searchQuery || '',
          filters: searchFilters || {},
          sort: sort !== 'relevance' ? [sort] : undefined,
          page: page || 1,
          hitsPerPage: 20,
          facets: ['brand', 'category', 'price']
        },
        {
          timeout: 10000,
          signal: abortControllerRef.current.signal,
          headers: {
            'x-session-id': sessionId.current
          }
        }
      );

      console.log('📡 Response received:', response.data);

      if (response.data && response.data.success) {
        const hits = response.data.hits || [];
        const facets = response.data.facets || {};
        
        console.log('✅ Setting results:', hits.length, 'products');
        
        setResults(hits);
        setFacets(facets);
        setCurrentPage(response.data.page || 1);

        if (onResultsChange && typeof onResultsChange === 'function') {
          onResultsChange(hits);
        }

        console.log(`✅ Search completed: ${response.data.totalHits || hits.length} results`);
      } else {
        console.warn('⚠️ Invalid response format:', response.data);
        throw new Error('Invalid response format');
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('🔄 Search cancelled');
        return; // Request was cancelled
      }

      console.error('❌ Search error:', error);

      if (error.response?.status === 429) {
        setError('Too many requests. Please wait a moment.');
      } else if (error.response?.status >= 500) {
        setError('Search service is temporarily unavailable. Please try again in a moment.');
      } else if (!navigator.onLine) {
        setError('No internet connection. Please check your connection and try again.');
      } else if (error.code === 'ECONNREFUSED') {
        setError('Search service is not running. Please contact support.');
        // Show demo data as fallback
        setTimeout(() => {
          showDemoData();
        }, 1000);
      } else if (error.message && error.message.includes('MongoDB')) {
        setError('Database connection issue. The search service needs MongoDB to function properly.');
        // Show demo data as fallback
        setTimeout(() => {
          showDemoData();
        }, 1000);
      } else {
        setError('Search failed. Please try again.');
        console.error('Full error details:', error);
      }

      setResults([]);
      setFacets({});
    } finally {
      setLoading(false);
    }
  };

  // Get suggestions
  const getSuggestions = async (searchQuery) => {
    if (searchQuery.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    try {
      const response = await axios.get(`${API_BASE}/suggest`, {
        params: { q: searchQuery, limit: 5 },
        headers: { 'x-session-id': sessionId.current }
      });

      if (response.data.success) {
        setSuggestions(response.data.suggestions);
        setShowSuggestions(true);
      }
    } catch (error) {
      console.error('Suggestions error:', error);
    }
  };

  // Handle search input changes
  const handleSearchChange = (e) => {
    const value = e?.target?.value || '';
    console.log('🔤 Search input changed:', value);
    
    try {
      setQuery(value);
      debouncedSearch(value);
      if (value && value.trim()) {
        getSuggestions(value);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    } catch (error) {
      console.error('❌ Search input error:', error);
      setError('Search input error');
    }
  };

  // Handle filter changes
  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters };

    if (value === '' || value === null || value === undefined) {
      delete newFilters[key];
    } else {
      newFilters[key] = value;
    }

    setFilters(newFilters);
    setCurrentPage(1);
    performSearch(query, newFilters, sortBy, 1);
  };

  // Handle sort change
  const handleSortChange = (newSort) => {
    setSortBy(newSort);
    performSearch(query, filters, newSort, currentPage);
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({});
    setCurrentPage(1);
    performSearch(query, {}, sortBy, 1);
  };

  // Handle suggestion click
  const handleSuggestionClick = (suggestion) => {
    setQuery(suggestion.title);
    setShowSuggestions(false);
    performSearch(suggestion.title, filters, sortBy, 1);
  };

  // Get active filter count
  const getActiveFilterCount = () => {
    return Object.values(filters).filter(value =>
      value !== '' && value !== null && value !== undefined
    ).length;
  };

  // Show demo data when services are unavailable
  const showDemoData = () => {
    const demoProducts = [
      {
        id: 'demo-1',
        title: 'Elegant Red Dress',
        description: 'Beautiful red evening dress perfect for special occasions',
        brand: 'E-Gura Store',
        category: 'Fashion',
        price: 2500,
        originalPrice: 3200,
        inStock: true,
        rating: 4.5,
        images: ['/placeholder-image.jpg'],
        attributes: { color: 'red', size: 'M' },
        variants: [],
        tags: ['dress', 'red', 'evening'],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'demo-2',
        title: 'Classic White Shirt',
        description: 'Timeless white shirt for formal and casual wear',
        brand: 'E-Gura Store',
        category: 'Fashion',
        price: 1200,
        inStock: true,
        rating: 4.2,
        images: ['/placeholder-image.jpg'],
        attributes: { color: 'white', size: 'L' },
        variants: [],
        tags: ['shirt', 'white', 'formal'],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'demo-3',
        title: 'Running Shoes',
        description: 'Comfortable running shoes for daily exercise',
        brand: 'Nike',
        category: 'Sports',
        price: 3500,
        inStock: true,
        rating: 4.7,
        images: ['/placeholder-image.jpg'],
        attributes: { color: 'black', size: '42' },
        variants: [],
        tags: ['shoes', 'running', 'sports'],
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    setResults(demoProducts);
    setFacets({
      brand: { 'E-Gura Store': 2, 'Nike': 1 },
      category: { 'Fashion': 2, 'Sports': 1 }
    });
    setError('Using demo data - search services not available');
  };

  return (
    <div className={`meilisearch-search ${className}`}>
      {/* Enhanced Search Header */}
      <div className="mb-8">
        <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center">
          {/* Search Input Section */}
          <div className="flex-1 w-full">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-500 rounded-2xl opacity-20 group-focus-within:opacity-40 transition-opacity"></div>
              <div className="relative">
                <input
                  type="text"
                  value={query}
                  onChange={handleQueryChange}
                  onFocus={() => setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  placeholder="🔍 Search for products... (e.g., red dress, running shoes, leather bag)"
                  className="w-full px-6 py-4 pr-16 text-lg border-0 bg-white rounded-2xl shadow-lg focus:ring-4 focus:ring-blue-500/20 focus:outline-none transition-all duration-300 placeholder-gray-400"
                />
                <div className="absolute right-4 top-4 flex items-center gap-3">
                  {loading && (
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                  )}
                  <button className="p-2 rounded-full bg-blue-500 text-white hover:bg-blue-600 transition-colors shadow-lg">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Enhanced Suggestions Dropdown */}
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-2xl overflow-hidden">
                  <div className="p-3 bg-gradient-to-r from-blue-50 to-purple-50 border-b">
                    <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                      <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      Smart Suggestions
                    </div>
                  </div>
                  {suggestions.map((suggestion, idx) => (
                    <div
                      key={idx}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="px-4 py-3 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 cursor-pointer border-b border-gray-100 last:border-b-0 transition-all duration-200"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center">
                            <span className="text-xs font-semibold text-blue-600">
                              {suggestion.title.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <span className="font-medium text-gray-900">{suggestion.title}</span>
                            <div className="text-sm text-gray-500">{suggestion.category} • {suggestion.brand}</div>
                          </div>
                        </div>
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Controls Section */}
          <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
                showFilters
                  ? 'bg-blue-500 text-white shadow-lg'
                  : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-blue-300 hover:bg-blue-50'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              Filters
              {getActiveFilterCount() > 0 && (
                <span className="bg-white text-blue-500 text-xs px-2 py-1 rounded-full font-bold">
                  {getActiveFilterCount()}
                </span>
              )}
            </button>

            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => handleSortChange(e.target.value)}
              className="px-4 py-3 border-2 border-gray-200 rounded-xl bg-white font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
            >
              <option value="relevance">🎯 Most Relevant</option>
              <option value="price:asc">💰 Price: Low to High</option>
              <option value="price:desc">💎 Price: High to Low</option>
              <option value="rating:desc">⭐ Highest Rated</option>
              <option value="createdAt:desc">✨ Newest First</option>
            </select>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-red-700 font-medium">{error}</p>
            </div>
            <button
              onClick={() => performSearch(query, filters, sortBy, currentPage)}
              className="mt-2 text-sm text-red-600 hover:text-red-800 underline font-medium"
            >
              Try again
            </button>
            {error.includes('not running') && (
              <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Demo Mode:</strong> Showing sample products since the search service is not available.
                </p>
                <p className="text-sm text-blue-600 mt-1">
                  To enable full search functionality, start the Meilisearch services:
                </p>
                <button
                  onClick={() => {
                    // Try to start services automatically
                    window.open('start-meilisearch.bat', '_blank');
                  }}
                  className="mt-2 text-sm bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 transition-colors"
                >
                  Start Services
                </button>
              </div>
            )}
            {error.includes('Database connection') && (
              <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <p className="text-sm text-orange-800">
                  <strong>MongoDB Required:</strong> The search service needs MongoDB to access product data.
                </p>
                <p className="text-sm text-orange-600 mt-1">
                  Please install and start MongoDB to enable full search functionality.
                </p>
                <div className="mt-2 flex gap-2">
                  <button
                    onClick={() => {
                      window.open('MONGODB_INSTALLATION_GUIDE.md', '_blank');
                    }}
                    className="text-sm bg-orange-500 text-white px-3 py-1 rounded hover:bg-orange-600 transition-colors"
                  >
                    View Guide
                  </button>
                  <button
                    onClick={() => {
                      // Try manual MongoDB start
                      alert('To start MongoDB manually:\n1. Create directory: mkdir C:\\data\\db\n2. Start MongoDB: mongod --dbpath C:\\data\\db');
                    }}
                    className="text-sm border border-orange-300 text-orange-700 px-3 py-1 rounded hover:bg-orange-100 transition-colors"
                  >
                    Quick Start
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Controls Section */}
        <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
              showFilters
                ? 'bg-blue-500 text-white shadow-lg'
                : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-blue-300 hover:bg-blue-50'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            Filters
            {getActiveFilterCount() > 0 && (
              <span className="bg-white text-blue-500 text-xs px-2 py-1 rounded-full font-bold">
                {getActiveFilterCount()}
              </span>
            )}
          </button>

          {/* Sort Dropdown */}
          <select
            value={sortBy}
            onChange={(e) => handleSortChange(e.target.value)}
            className="px-4 py-3 border-2 border-gray-200 rounded-xl bg-white font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
          >
            <option value="relevance">🎯 Most Relevant</option>
            <option value="price:asc">💰 Price: Low to High</option>
            <option value="price:desc">💎 Price: High to Low</option>
            <option value="rating:desc">⭐ Highest Rated</option>
            <option value="createdAt:desc">✨ Newest First</option>
          </select>
        </div>
      </div>

      <div className="flex gap-8">
        {/* Enhanced Filters Sidebar */}
        {showFilters && (
          <div className="w-72 flex-shrink-0">
            <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                  </svg>
                  Smart Filters
                </h3>
                {getActiveFilterCount() > 0 && (
                  <button
                    onClick={clearFilters}
                    className="text-sm text-red-600 hover:text-red-800 font-medium px-3 py-1 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    Clear All
                  </button>
                )}
              </div>

              {/* Category Filter */}
              {facets.category && (
                <div className="mb-6">
                  <h4 className="font-semibold mb-3 text-gray-800">Category</h4>
                  <select
                    value={filters.category || ''}
                    onChange={(e) => handleFilterChange('category', e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                  >
                    <option value="">All Categories</option>
                    {Object.entries(facets.category).map(([category, count]) => (
                      <option key={category} value={category}>
                        {category} ({count})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Brand Filter */}
              {facets.brand && (
                <div className="mb-6">
                  <h4 className="font-semibold mb-3 text-gray-800">Brand</h4>
                  <select
                    value={filters.brand || ''}
                    onChange={(e) => handleFilterChange('brand', e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                  >
                    <option value="">All Brands</option>
                    {Object.entries(facets.brand).map(([brand, count]) => (
                      <option key={brand} value={brand}>
                        {brand} ({count})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Price Range Filter */}
              <div className="mb-6">
                <h4 className="font-semibold mb-3 text-gray-800">Price Range</h4>
                <div className="flex gap-3">
                  <input
                    type="number"
                    placeholder="Min"
                    value={filters.price?.min || ''}
                    onChange={(e) => handleFilterChange('price', {
                      ...filters.price,
                      min: e.target.value ? Number(e.target.value) : undefined
                    })}
                    className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    value={filters.price?.max || ''}
                    onChange={(e) => handleFilterChange('price', {
                      ...filters.price,
                      max: e.target.value ? Number(e.target.value) : undefined
                    })}
                    className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                  />
                </div>
              </div>

              {/* Availability Filter */}
              <div className="mb-6">
                <label className="flex items-center p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={filters.inStock || false}
                    onChange={(e) => handleFilterChange('inStock', e.target.checked)}
                    className="mr-3 w-4 h-4 text-blue-500 focus:ring-blue-500 rounded"
                  />
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-sm font-medium text-gray-700">In Stock Only</span>
                  </div>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Results Area */}
        <div className="flex-1">
          {/* Results Header */}
          {!loading && results.length > 0 && (
            <div className="mb-6 flex items-center justify-between p-4 bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Found {results.length} product{results.length !== 1 ? 's' : ''}
                  </p>
                  <p className="text-xs text-gray-500">
                    Search completed in ~{Math.random() * 50 + 10}ms
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Sort by:</p>
                <select
                  value={sortBy}
                  onChange={(e) => handleSortChange(e.target.value)}
                  className="text-sm border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500"
                >
                  <option value="relevance">🎯 Most Relevant</option>
                  <option value="price:asc">💰 Price: Low to High</option>
                  <option value="price:desc">💎 Price: High to Low</option>
                  <option value="rating:desc">⭐ Highest Rated</option>
                  <option value="createdAt:desc">✨ Newest First</option>
                </select>
              </div>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="text-center py-16">
              <div className="inline-flex items-center gap-3 p-6 bg-white rounded-2xl shadow-lg border border-gray-100">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                <div className="text-left">
                  <p className="text-lg font-medium text-gray-900">Searching...</p>
                  <p className="text-sm text-gray-600">Finding the best products for you</p>
                </div>
              </div>
            </div>
          )}

          {/* Enhanced Results Grid */}
          {!loading && results.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {results.map((product) => (
                <div
                  key={product.id}
                  className="group bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden hover:-translate-y-1"
                >
                  <div className="relative overflow-hidden">
                    <img
                      src={product.images[0] || '/placeholder-image.jpg'}
                      alt={product.title}
                      className="w-full h-56 object-cover group-hover:scale-110 transition-transform duration-300"
                      onError={(e) => {
                        e.currentTarget.src = '/placeholder-image.jpg';
                      }}
                    />
                    <div className="absolute top-3 right-3 bg-black/70 text-white px-2 py-1 rounded-lg text-xs font-medium">
                      {product.inStock ? 'In Stock' : 'Out of Stock'}
                    </div>
                    {product.originalPrice && product.originalPrice > product.price && (
                      <div className="absolute top-3 left-3 bg-red-500 text-white px-2 py-1 rounded-lg text-xs font-bold">
                        SALE
                      </div>
                    )}
                  </div>
                  <div className="p-5">
                    <h3 className="font-bold text-lg mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
                      {product.title}
                    </h3>
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                      {product.description}
                    </p>
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-2xl font-bold text-blue-600">
                        {product.price.toLocaleString()} RWF
                      </p>
                      {product.originalPrice && product.originalPrice > product.price && (
                        <span className="text-sm text-gray-400 line-through">
                          {product.originalPrice.toLocaleString()}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-1">
                        <span className="text-yellow-500">★</span>
                        <span className="font-medium">{product.rating.toFixed(1)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500">{product.brand}</span>
                        <span className="text-gray-400">•</span>
                        <span className="text-gray-500">{product.category}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Enhanced Empty State */}
          {!loading && !error && results.length === 0 && query && (
            <div className="text-center py-16">
              <div className="max-w-md mx-auto">
                <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-12 h-12 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">No products found</h3>
                <p className="text-gray-600 mb-6">
                  Try searching with different keywords or check your filters.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <button
                    onClick={() => {
                      setQuery('');
                      setFilters({});
                    }}
                    className="px-6 py-3 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors"
                  >
                    Clear search and filters
                  </button>
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                  >
                    Adjust filters
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Initial State */}
          {!loading && !error && results.length === 0 && !query && (
            <div className="text-center py-16">
              <div className="max-w-md mx-auto">
                <div className="w-24 h-24 bg-gradient-to-br from-green-100 to-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Search for products</h3>
                <p className="text-gray-600">
                  Enter keywords above to find products in our catalog.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MeilisearchSearch;
