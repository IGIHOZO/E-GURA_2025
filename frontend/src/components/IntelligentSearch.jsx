import React, { useState, useEffect, useCallback } from 'react';
import { MagnifyingGlassIcon, FunnelIcon, XMarkIcon, SparklesIcon } from '@heroicons/react/24/outline';
import axios from 'axios';
import debounce from '../utils/debounce';

const IntelligentSearch = ({ onSearchResults, onFilterChange, initialQuery = '' }) => {
  const [query, setQuery] = useState(initialQuery);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    category: '',
    brand: '',
    minPrice: '',
    maxPrice: '',
    minRating: '',
    inStock: false,
    sizes: [],
    colors: [],
    materials: [],
    gender: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState('relevance');
  const [filterOptions, setFilterOptions] = useState({
    categories: [],
    brands: [],
    colors: [],
    sizes: [],
    materials: [],
    priceRange: { min: 0, max: 100000 }
  });

  // Debounced autocomplete
  const fetchSuggestions = useCallback(
    debounce(async (searchQuery) => {
      if (!searchQuery || searchQuery.length < 2) {
        setSuggestions([]);
        return;
      }

      try {
        const response = await axios.get('/api/intelligent-search/autocomplete', {
          params: { q: searchQuery, limit: 8 }
        });

        if (response.data.success) {
          setSuggestions(response.data.suggestions || []);
        }
      } catch (error) {
        console.error('Autocomplete error:', error);
        setSuggestions([]);
      }
    }, 300),
    []
  );

  // Handle query change
  const handleQueryChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    setShowSuggestions(true);
    fetchSuggestions(value);
  };

  // Perform search
  const performSearch = async () => {
    try {
      setLoading(true);
      console.log('🔍 Performing intelligent search:', { query, filters, sortBy });

      const response = await axios.get('/api/intelligent-search', {
        params: {
          query,
          ...filters,
          sortBy,
          page: 1,
          limit: 50
        }
      });

      if (response.data.success) {
        console.log('✅ Search results:', response.data);
        
        // Update filter options from response
        if (response.data.filterOptions) {
          setFilterOptions(response.data.filterOptions);
        }

        // Pass results to parent component
        if (onSearchResults) {
          onSearchResults(response.data.data || []);
        }

        // Pass filter info to parent
        if (onFilterChange) {
          onFilterChange({ query, filters, sortBy });
        }
      }
    } catch (error) {
      console.error('❌ Search error:', error);
      if (onSearchResults) {
        onSearchResults([]);
      }
    } finally {
      setLoading(false);
    }
  };

  // Effect to trigger search when filters or sort changes
  useEffect(() => {
    performSearch();
  }, [sortBy, filters.category, filters.brand, filters.inStock, filters.gender, filters.minRating]);

  // Handle search submit
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setShowSuggestions(false);
    performSearch();
  };

  // Handle suggestion click
  const handleSuggestionClick = (suggestion) => {
    if (suggestion.type === 'product') {
      setQuery(suggestion.value);
    } else if (suggestion.type === 'category') {
      setFilters({ ...filters, category: suggestion.value });
      setQuery('');
    } else if (suggestion.type === 'brand') {
      setFilters({ ...filters, brand: suggestion.value });
      setQuery('');
    }
    setShowSuggestions(false);
    performSearch();
  };

  // Handle filter change
  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
  };

  // Clear filters
  const clearFilters = () => {
    setFilters({
      category: '',
      brand: '',
      minPrice: '',
      maxPrice: '',
      minRating: '',
      inStock: false,
      sizes: [],
      colors: [],
      materials: [],
      gender: ''
    });
  };

  // Count active filters
  const activeFiltersCount = Object.values(filters).filter(v => 
    v && (Array.isArray(v) ? v.length > 0 : v !== '' && v !== false)
  ).length;

  return (
    <div className="w-full">
      {/* Search Bar */}
      <form onSubmit={handleSearchSubmit} className="relative">
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={handleQueryChange}
            onFocus={() => setShowSuggestions(true)}
            placeholder="Search products with AI..."
            className="w-full px-6 py-4 pr-32 text-lg rounded-xl border-2 border-gray-300 focus:ring-4 focus:ring-purple-500 focus:border-purple-500 transition-all shadow-sm"
          />
          
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center space-x-2">
            <SparklesIcon className="h-5 w-5 text-purple-500" title="AI-Powered" />
            
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className="p-2 rounded-lg hover:bg-gray-100 relative"
            >
              <FunnelIcon className="h-5 w-5 text-gray-600" />
              {activeFiltersCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-purple-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                  {activeFiltersCount}
                </span>
              )}
            </button>
            
            <button
              type="submit"
              disabled={loading}
              className="p-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
            >
              <MagnifyingGlassIcon className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Autocomplete Suggestions */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute z-50 w-full mt-2 bg-white rounded-lg shadow-xl border border-gray-200 max-h-96 overflow-y-auto">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                type="button"
                onClick={() => handleSuggestionClick(suggestion)}
                className="w-full px-4 py-3 text-left hover:bg-purple-50 flex items-center space-x-3 border-b border-gray-100 last:border-0"
              >
                {suggestion.type === 'product' && (
                  <>
                    <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-900">{suggestion.value}</span>
                  </>
                )}
                {suggestion.type === 'category' && (
                  <>
                    <span className="text-2xl">🏷️</span>
                    <span className="text-gray-900">{suggestion.value}</span>
                    <span className="ml-auto text-xs text-purple-600">Category</span>
                  </>
                )}
                {suggestion.type === 'brand' && (
                  <>
                    <span className="text-2xl">🏢</span>
                    <span className="text-gray-900">{suggestion.value}</span>
                    <span className="ml-auto text-xs text-blue-600">Brand</span>
                  </>
                )}
              </button>
            ))}
          </div>
        )}
      </form>

      {/* Advanced Filters Panel */}
      {showFilters && (
        <div className="mt-4 p-6 bg-white rounded-xl shadow-lg border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <FunnelIcon className="h-5 w-5 mr-2 text-purple-600" />
              Advanced Filters
            </h3>
            <div className="flex items-center space-x-2">
              {activeFiltersCount > 0 && (
                <button
                  onClick={clearFilters}
                  className="text-sm text-purple-600 hover:text-purple-800 font-medium"
                >
                  Clear All
                </button>
              )}
              <button
                onClick={() => setShowFilters(false)}
                className="p-1 rounded-lg hover:bg-gray-100"
              >
                <XMarkIcon className="h-5 w-5 text-gray-600" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Category Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
              <select
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              >
                <option value="">All Categories</option>
                {filterOptions.categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Brand Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Brand</label>
              <select
                value={filters.brand}
                onChange={(e) => handleFilterChange('brand', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              >
                <option value="">All Brands</option>
                {filterOptions.brands.map((brand) => (
                  <option key={brand} value={brand}>{brand}</option>
                ))}
              </select>
            </div>

            {/* Price Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Min Price</label>
              <input
                type="number"
                value={filters.minPrice}
                onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                placeholder="Min"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Max Price</label>
              <input
                type="number"
                value={filters.maxPrice}
                onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                placeholder="Max"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
            </div>

            {/* Rating Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Min Rating</label>
              <select
                value={filters.minRating}
                onChange={(e) => handleFilterChange('minRating', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              >
                <option value="">Any Rating</option>
                <option value="4">4★ & above</option>
                <option value="3">3★ & above</option>
                <option value="2">2★ & above</option>
              </select>
            </div>

            {/* Gender Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Gender</label>
              <select
                value={filters.gender}
                onChange={(e) => handleFilterChange('gender', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              >
                <option value="">All</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="unisex">Unisex</option>
              </select>
            </div>

            {/* Sort By */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              >
                <option value="relevance">AI Relevance</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="newest">Newest First</option>
                <option value="popular">Most Popular</option>
                <option value="rating">Highest Rated</option>
              </select>
            </div>

            {/* Stock Filter */}
            <div>
              <label className="flex items-center space-x-2 cursor-pointer mt-7">
                <input
                  type="checkbox"
                  checked={filters.inStock}
                  onChange={(e) => handleFilterChange('inStock', e.target.checked)}
                  className="w-4 h-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                />
                <span className="text-sm font-medium text-gray-700">In Stock Only</span>
              </label>
            </div>
          </div>

          {/* Apply Filters Button */}
          <div className="mt-4 flex justify-end">
            <button
              onClick={performSearch}
              disabled={loading}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 font-medium"
            >
              {loading ? 'Searching...' : 'Apply Filters'}
            </button>
          </div>
        </div>
      )}

      {/* Loading Indicator */}
      {loading && (
        <div className="mt-4 text-center">
          <div className="inline-flex items-center space-x-2 text-purple-600">
            <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="font-medium">AI is searching...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default IntelligentSearch;
