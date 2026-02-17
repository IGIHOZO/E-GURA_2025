import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MagnifyingGlassIcon,
  XMarkIcon,
  AdjustmentsHorizontalIcon,
  SparklesIcon,
  ClockIcon,
  FireIcon,
  FunnelIcon,
  ChevronDownIcon,
  TagIcon
} from '@heroicons/react/24/outline';
import axios from 'axios';

const AdvancedSearchBar = ({ onSearch, onFilterChange, initialFilters = {} }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [trendingSearches, setTrendingSearches] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const searchRef = useRef(null);
  
  // Filters state
  const [filters, setFilters] = useState({
    category: initialFilters.category || '',
    minPrice: initialFilters.minPrice || '',
    maxPrice: initialFilters.maxPrice || '',
    colors: initialFilters.colors || [],
    sizes: initialFilters.sizes || [],
    sortBy: initialFilters.sortBy || 'relevance',
    inStock: initialFilters.inStock || false,
    isNew: initialFilters.isNew || false,
    isSale: initialFilters.isSale || false,
    isFeatured: initialFilters.isFeatured || false
  });

  // Categories
  const categories = [
    'All', 'Dresses', 'Tops', 'Bottoms', 'Outerwear', 'Accessories', 
    'Shoes', 'Bags', 'Jewelry', 'Beauty', 'Kids', 'Men'
  ];

  const colors = [
    { name: 'Red', hex: '#EF4444' },
    { name: 'Blue', hex: '#3B82F6' },
    { name: 'Green', hex: '#10B981' },
    { name: 'Black', hex: '#000000' },
    { name: 'White', hex: '#FFFFFF' },
    { name: 'Pink', hex: '#EC4899' },
    { name: 'Purple', hex: '#8B5CF6' },
    { name: 'Yellow', hex: '#F59E0B' },
    { name: 'Orange', hex: '#F97316' }
  ];

  const sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'];

  const sortOptions = [
    { value: 'relevance', label: 'Most Relevant' },
    { value: 'price_asc', label: 'Price: Low to High' },
    { value: 'price_desc', label: 'Price: High to Low' },
    { value: 'newest', label: 'Newest First' },
    { value: 'rating', label: 'Highest Rated' },
    { value: 'popular', label: 'Most Popular' }
  ];

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch trending searches on mount
  useEffect(() => {
    fetchTrendingSearches();
  }, []);

  // Fetch autocomplete suggestions
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (searchQuery.length < 2) {
        setSuggestions([]);
        return;
      }

      try {
        const response = await axios.get('/api/advanced-search/autocomplete', {
          params: { q: searchQuery, limit: 8 }
        });
        if (response.data.success) {
          setSuggestions(response.data.suggestions);
        }
      } catch (error) {
        console.error('Autocomplete error:', error);
      }
    };

    const debounceTimer = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  const fetchTrendingSearches = async () => {
    try {
      const response = await axios.get('/api/advanced-search/trending', {
        params: { limit: 5 }
      });
      if (response.data.success) {
        setTrendingSearches(response.data.trending);
      }
    } catch (error) {
      console.error('Trending searches error:', error);
    }
  };

  const handleSearch = (query = searchQuery) => {
    if (!query.trim() && Object.values(filters).every(v => !v || (Array.isArray(v) && v.length === 0))) {
      return;
    }

    setIsSearching(true);
    setShowSuggestions(false);

    // Combine query and filters
    const searchParams = {
      query: query.trim(),
      ...filters,
      colors: filters.colors.join(','),
      sizes: filters.sizes.join(',')
    };

    onSearch(searchParams);
    
    setTimeout(() => setIsSearching(false), 500);
  };

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange?.(newFilters);
  };

  const toggleArrayFilter = (key, value) => {
    const current = filters[key];
    const updated = current.includes(value)
      ? current.filter(item => item !== value)
      : [...current, value];
    handleFilterChange(key, updated);
  };

  const clearFilters = () => {
    const clearedFilters = {
      category: '',
      minPrice: '',
      maxPrice: '',
      colors: [],
      sizes: [],
      sortBy: 'relevance',
      inStock: false,
      isNew: false,
      isSale: false,
      isFeatured: false
    };
    setFilters(clearedFilters);
    onFilterChange?.(clearedFilters);
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.category) count++;
    if (filters.minPrice || filters.maxPrice) count++;
    if (filters.colors.length > 0) count++;
    if (filters.sizes.length > 0) count++;
    if (filters.inStock || filters.isNew || filters.isSale || filters.isFeatured) count++;
    return count;
  };

  return (
    <div className="w-full" ref={searchRef}>
      {/* Main Search Bar */}
      <div className="relative">
        <div className="flex gap-2">
          {/* Search Input Container */}
          <div className="flex-1 relative">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                {isSearching ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-red-600"></div>
                ) : (
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                )}
              </div>
              
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setShowSuggestions(true)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Search for dresses, bags, shoes... (AI-powered)"
                className="w-full pl-12 pr-12 py-4 text-gray-900 placeholder-gray-500 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent shadow-sm transition-all"
              />

              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSuggestions([]);
                  }}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              )}
            </div>

            {/* AI Badge */}
            <div className="absolute top-1 right-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs px-2 py-1 rounded-lg flex items-center gap-1">
              <SparklesIcon className="h-3 w-3" />
              <span className="font-medium">AI</span>
            </div>
          </div>

          {/* Filter Button */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-6 py-4 rounded-xl font-medium transition-all flex items-center gap-2 ${
              showFilters || getActiveFiltersCount() > 0
                ? 'bg-red-600 text-white shadow-lg'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            <AdjustmentsHorizontalIcon className="h-5 w-5" />
            <span>Filters</span>
            {getActiveFiltersCount() > 0 && (
              <span className="bg-white text-red-600 text-xs font-bold px-2 py-0.5 rounded-full">
                {getActiveFiltersCount()}
              </span>
            )}
          </button>

          {/* Search Button */}
          <button
            onClick={() => handleSearch()}
            disabled={isSearching}
            className="px-8 py-4 bg-gradient-to-r from-red-600 to-orange-600 text-white font-semibold rounded-xl hover:from-red-700 hover:to-orange-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50"
          >
            Search
          </button>
        </div>

        {/* Autocomplete Suggestions */}
        <AnimatePresence>
          {showSuggestions && (suggestions.length > 0 || trendingSearches.length > 0) && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute z-50 w-full mt-2 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden"
            >
              {/* Autocomplete Results */}
              {suggestions.length > 0 && (
                <div className="p-2">
                  <div className="text-xs font-semibold text-gray-500 px-3 py-2 flex items-center gap-2">
                    <SparklesIcon className="h-4 w-4" />
                    AI Suggestions
                  </div>
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setSearchQuery(suggestion.text);
                        handleSearch(suggestion.text);
                      }}
                      className="w-full px-3 py-3 hover:bg-gray-50 rounded-lg text-left transition-colors flex items-center gap-3"
                    >
                      {suggestion.type === 'product' && suggestion.image && (
                        <img
                          src={suggestion.image}
                          alt={suggestion.text}
                          className="w-10 h-10 object-cover rounded"
                        />
                      )}
                      {suggestion.type === 'popular' && (
                        <FireIcon className="h-5 w-5 text-orange-500" />
                      )}
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900">
                          {suggestion.text}
                        </div>
                        {suggestion.category && (
                          <div className="text-xs text-gray-500">
                            in {suggestion.category}
                          </div>
                        )}
                      </div>
                      {suggestion.price && (
                        <div className="text-sm font-semibold text-red-600">
                          {suggestion.price.toLocaleString()} RWF
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}

              {/* Trending Searches */}
              {trendingSearches.length > 0 && suggestions.length === 0 && (
                <div className="p-2">
                  <div className="text-xs font-semibold text-gray-500 px-3 py-2 flex items-center gap-2">
                    <FireIcon className="h-4 w-4 text-orange-500" />
                    Trending Now
                  </div>
                  {trendingSearches.map((trend, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setSearchQuery(trend.query);
                        handleSearch(trend.query);
                      }}
                      className="w-full px-3 py-2 hover:bg-gray-50 rounded-lg text-left transition-colors flex items-center justify-between"
                    >
                      <span className="text-sm text-gray-700">{trend.query}</span>
                      <span className="text-xs text-gray-400">{trend.count} searches</span>
                    </button>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Advanced Filters Panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <FunnelIcon className="h-5 w-5 text-red-600" />
                  Advanced Filters
                </h3>
                <button
                  onClick={clearFilters}
                  className="text-sm text-red-600 hover:text-red-700 font-medium"
                >
                  Clear All
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Category Filter */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Category
                  </label>
                  <select
                    value={filters.category}
                    onChange={(e) => handleFilterChange('category', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat === 'All' ? '' : cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Price Range */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Price Range (RWF)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={filters.minPrice}
                      onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                      placeholder="Min"
                      className="w-1/2 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    />
                    <input
                      type="number"
                      value={filters.maxPrice}
                      onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                      placeholder="Max"
                      className="w-1/2 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Sort By */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Sort By
                  </label>
                  <select
                    value={filters.sortBy}
                    onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  >
                    {sortOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Colors */}
              <div className="mt-6">
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Colors
                </label>
                <div className="flex flex-wrap gap-2">
                  {colors.map((color) => (
                    <button
                      key={color.name}
                      onClick={() => toggleArrayFilter('colors', color.name)}
                      className={`px-4 py-2 rounded-lg border-2 transition-all flex items-center gap-2 ${
                        filters.colors.includes(color.name)
                          ? 'border-red-600 bg-red-50 text-red-700'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <div
                        className="w-4 h-4 rounded-full border border-gray-300"
                        style={{ backgroundColor: color.hex }}
                      />
                      <span className="text-sm font-medium">{color.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Sizes */}
              <div className="mt-6">
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Sizes
                </label>
                <div className="flex flex-wrap gap-2">
                  {sizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => toggleArrayFilter('sizes', size)}
                      className={`px-4 py-2 rounded-lg border-2 transition-all ${
                        filters.sizes.includes(size)
                          ? 'border-red-600 bg-red-50 text-red-700 font-semibold'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quick Filters */}
              <div className="mt-6">
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Quick Filters
                </label>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => handleFilterChange('inStock', !filters.inStock)}
                    className={`px-4 py-2 rounded-lg border-2 transition-all ${
                      filters.inStock
                        ? 'border-green-600 bg-green-50 text-green-700 font-semibold'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    In Stock Only
                  </button>
                  <button
                    onClick={() => handleFilterChange('isNew', !filters.isNew)}
                    className={`px-4 py-2 rounded-lg border-2 transition-all ${
                      filters.isNew
                        ? 'border-blue-600 bg-blue-50 text-blue-700 font-semibold'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    New Arrivals
                  </button>
                  <button
                    onClick={() => handleFilterChange('isSale', !filters.isSale)}
                    className={`px-4 py-2 rounded-lg border-2 transition-all ${
                      filters.isSale
                        ? 'border-orange-600 bg-orange-50 text-orange-700 font-semibold'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    On Sale
                  </button>
                  <button
                    onClick={() => handleFilterChange('isFeatured', !filters.isFeatured)}
                    className={`px-4 py-2 rounded-lg border-2 transition-all ${
                      filters.isFeatured
                        ? 'border-purple-600 bg-purple-50 text-purple-700 font-semibold'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    Featured
                  </button>
                </div>
              </div>

              {/* Apply Filters Button */}
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => {
                    handleSearch();
                    setShowFilters(false);
                  }}
                  className="px-8 py-3 bg-gradient-to-r from-red-600 to-orange-600 text-white font-semibold rounded-lg hover:from-red-700 hover:to-orange-700 transition-all shadow-lg"
                >
                  Apply Filters & Search
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Active Filters Display */}
      {getActiveFiltersCount() > 0 && !showFilters && (
        <div className="mt-3 flex flex-wrap gap-2">
          {filters.category && (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm">
              <TagIcon className="h-3 w-3" />
              {filters.category}
              <button
                onClick={() => handleFilterChange('category', '')}
                className="hover:text-red-900"
              >
                <XMarkIcon className="h-3 w-3" />
              </button>
            </span>
          )}
          {filters.colors.map((color) => (
            <span
              key={color}
              className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm"
            >
              {color}
              <button
                onClick={() => toggleArrayFilter('colors', color)}
                className="hover:text-red-900"
              >
                <XMarkIcon className="h-3 w-3" />
              </button>
            </span>
          ))}
          {filters.sizes.map((size) => (
            <span
              key={size}
              className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm"
            >
              Size: {size}
              <button
                onClick={() => toggleArrayFilter('sizes', size)}
                className="hover:text-red-900"
              >
                <XMarkIcon className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdvancedSearchBar;
