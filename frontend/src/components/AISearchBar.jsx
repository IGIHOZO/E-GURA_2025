import React, { useState, useEffect, useRef } from 'react';
import { MagnifyingGlassIcon, FunnelIcon, XMarkIcon, SparklesIcon, AdjustmentsHorizontalIcon } from '@heroicons/react/24/outline';
import axios from 'axios';

const AISearchBar = ({ onSearch, onFilterChange, showFilters = true }) => {
  const [query, setQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [filters, setFilters] = useState({
    category: 'all',
    minPrice: '',
    maxPrice: '',
    sizes: [],
    colors: [],
    materials: [],
    inStock: false,
    gender: 'all'
  });
  const [filterOptions, setFilterOptions] = useState(null);
  const [sortBy, setSortBy] = useState('relevance');
  const searchRef = useRef(null);

  // Fetch filter options on mount
  useEffect(() => {
    fetchFilterOptions();
  }, []);

  // Handle click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchFilterOptions = async () => {
    try {
      const response = await axios.get('/api/search/filter-options');
      setFilterOptions(response.data.filterOptions);
    } catch (error) {
      console.error('Failed to fetch filter options:', error);
    }
  };

  const fetchSuggestions = async (searchQuery) => {
    if (searchQuery.length < 2) {
      setSuggestions([]);
      return;
    }

    try {
      const response = await axios.get(`http://localhost:5000/api/search/suggestions?q=${searchQuery}`);
      setSuggestions(response.data.suggestions || []);
    } catch (error) {
      console.error('Failed to fetch suggestions:', error);
    }
  };

  const handleQueryChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    setShowSuggestions(true);
    fetchSuggestions(value);
  };

  const handleSearch = () => {
    setShowSuggestions(false);
    onSearch({ query, filters, sortBy });
  };

  const handleSuggestionClick = (suggestion) => {
    setQuery(suggestion);
    setShowSuggestions(false);
    onSearch({ query: suggestion, filters, sortBy });
  };

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange && onFilterChange(newFilters);
  };

  const handleArrayFilterToggle = (key, value) => {
    const currentArray = filters[key] || [];
    const newArray = currentArray.includes(value)
      ? currentArray.filter(item => item !== value)
      : [...currentArray, value];
    
    handleFilterChange(key, newArray);
  };

  const handleSortChange = (newSortBy) => {
    setSortBy(newSortBy);
    onSearch({ query, filters, sortBy: newSortBy });
  };

  const clearFilters = () => {
    const clearedFilters = {
      category: 'all',
      minPrice: '',
      maxPrice: '',
      sizes: [],
      colors: [],
      materials: [],
      inStock: false,
      gender: 'all'
    };
    setFilters(clearedFilters);
    onFilterChange && onFilterChange(clearedFilters);
  };

  const activeFiltersCount = Object.values(filters).filter(v => 
    (Array.isArray(v) && v.length > 0) || 
    (typeof v === 'string' && v !== '' && v !== 'all') ||
    (typeof v === 'boolean' && v === true)
  ).length;

  return (
    <div className="w-full" ref={searchRef}>
      {/* Main Search Bar */}
      <div className="flex gap-3 items-center">
        {/* Search Input */}
        <div className="flex-1 relative">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={handleQueryChange}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="🤖 AI-powered search... (e.g., 'red dress', 'cotton shirt')"
              className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            )}
          </div>

          {/* Suggestions Dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="w-full px-4 py-3 text-left hover:bg-purple-50 transition-colors flex items-center gap-2"
                >
                  <SparklesIcon className="h-4 w-4 text-purple-500" />
                  <span>{suggestion}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Search Button */}
        <button
          onClick={handleSearch}
          className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:shadow-lg transition-all flex items-center gap-2"
        >
          <SparklesIcon className="h-5 w-5" />
          Search
        </button>

        {/* Advanced Filters Button */}
        {showFilters && (
          <button
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className="px-4 py-3 border-2 border-gray-200 rounded-xl hover:border-purple-500 transition-all flex items-center gap-2 relative"
          >
            <AdjustmentsHorizontalIcon className="h-5 w-5" />
            Filters
            {activeFiltersCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-purple-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {activeFiltersCount}
              </span>
            )}
          </button>
        )}
      </div>

      {/* Sort Options */}
      <div className="mt-4 flex items-center gap-3 flex-wrap">
        <span className="text-sm text-gray-600 font-medium">Sort by:</span>
        {[
          { value: 'relevance', label: '🎯 Relevance', icon: '🎯' },
          { value: 'price-low', label: '💰 Price: Low to High' },
          { value: 'price-high', label: '💎 Price: High to Low' },
          { value: 'newest', label: '🆕 Newest' },
          { value: 'popular', label: '🔥 Popular' },
          { value: 'ai-recommended', label: '🤖 AI Recommended' }
        ].map(option => (
          <button
            key={option.value}
            onClick={() => handleSortChange(option.value)}
            className={`px-4 py-2 rounded-lg text-sm transition-all ${
              sortBy === option.value
                ? 'bg-purple-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {/* Advanced Filters Panel */}
      {showAdvancedFilters && filterOptions && (
        <div className="mt-4 p-6 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border-2 border-purple-200">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <FunnelIcon className="h-5 w-5 text-purple-600" />
              Advanced Filters
            </h3>
            <button
              onClick={clearFilters}
              className="text-sm text-purple-600 hover:text-purple-700 font-medium"
            >
              Clear All
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Category Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
              <select
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              >
                <option value="all">All Categories</option>
                {filterOptions.categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Gender Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Gender</label>
              <select
                value={filters.gender}
                onChange={(e) => handleFilterChange('gender', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              >
                <option value="all">All</option>
                {filterOptions.genders.map(gender => (
                  <option key={gender} value={gender}>{gender}</option>
                ))}
              </select>
            </div>

            {/* Price Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Price Range (RWF)</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={filters.minPrice}
                  onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                  className="w-1/2 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
                <input
                  type="number"
                  placeholder="Max"
                  value={filters.maxPrice}
                  onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                  className="w-1/2 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>

            {/* Sizes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Sizes</label>
              <div className="flex flex-wrap gap-2">
                {filterOptions.sizes.map(size => (
                  <button
                    key={size}
                    onClick={() => handleArrayFilterToggle('sizes', size)}
                    className={`px-3 py-1 rounded-lg text-sm transition-all ${
                      filters.sizes.includes(size)
                        ? 'bg-purple-600 text-white'
                        : 'bg-white border border-gray-300 text-gray-700 hover:border-purple-500'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            {/* Colors */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Colors</label>
              <div className="flex flex-wrap gap-2">
                {filterOptions.colors.map(color => (
                  <button
                    key={color}
                    onClick={() => handleArrayFilterToggle('colors', color)}
                    className={`px-3 py-1 rounded-lg text-sm transition-all ${
                      filters.colors.includes(color)
                        ? 'bg-purple-600 text-white'
                        : 'bg-white border border-gray-300 text-gray-700 hover:border-purple-500'
                    }`}
                  >
                    {color}
                  </button>
                ))}
              </div>
            </div>

            {/* Materials */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Materials</label>
              <div className="flex flex-wrap gap-2">
                {filterOptions.materials.map(material => (
                  <button
                    key={material}
                    onClick={() => handleArrayFilterToggle('materials', material)}
                    className={`px-3 py-1 rounded-lg text-sm transition-all ${
                      filters.materials.includes(material)
                        ? 'bg-purple-600 text-white'
                        : 'bg-white border border-gray-300 text-gray-700 hover:border-purple-500'
                    }`}
                  >
                    {material}
                  </button>
                ))}
              </div>
            </div>

            {/* In Stock */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="inStock"
                checked={filters.inStock}
                onChange={(e) => handleFilterChange('inStock', e.target.checked)}
                className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
              />
              <label htmlFor="inStock" className="ml-2 text-sm text-gray-700">
                In Stock Only
              </label>
            </div>
          </div>

          {/* Apply Filters Button */}
          <div className="mt-6 flex justify-end">
            <button
              onClick={handleSearch}
              className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:shadow-lg transition-all"
            >
              Apply Filters
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AISearchBar;
