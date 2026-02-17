import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MagnifyingGlassIcon, 
  SparklesIcon,
  XMarkIcon,
  ClockIcon,
  ArrowTrendingUpIcon,
  TagIcon,
  BuildingStorefrontIcon,
  Squares2X2Icon,
  AdjustmentsHorizontalIcon,
  FunnelIcon,
  StarIcon,
  BoltIcon,
  BeakerIcon,
  CpuChipIcon,
  LightBulbIcon
} from '@heroicons/react/24/outline';
import axios from 'axios';

const AISearchComponent = ({ onResultsChange, className = '' }) => {
  // State management
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [facets, setFacets] = useState({});
  const [filters, setFilters] = useState({});
  const [sortBy, setSortBy] = useState('relevance');
  const [showFilters, setShowFilters] = useState(false);
  const [aiInsights, setAiInsights] = useState(null);
  const [searchHistory, setSearchHistory] = useState([]);
  const [isAIMode, setIsAIMode] = useState(true);

  // Refs
  const searchInputRef = useRef(null);
  const debounceTimer = useRef(null);
  const abortController = useRef(null);
  const sessionId = useRef(`ai_session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);

  // API Configuration
  const API_BASE = '/api/search';

  // Load search history
  useEffect(() => {
    const saved = localStorage.getItem('ai_search_history');
    if (saved) {
      setSearchHistory(JSON.parse(saved));
    }
  }, []);

  // Save to search history
  const saveToHistory = (searchQuery) => {
    if (!searchQuery.trim()) return;
    
    const newHistory = [
      searchQuery.trim(),
      ...searchHistory.filter(item => item !== searchQuery.trim())
    ].slice(0, 10);
    
    setSearchHistory(newHistory);
    localStorage.setItem('ai_search_history', JSON.stringify(newHistory));
  };

  // AI-Powered Search Function
  const performAISearch = async (searchQuery, searchFilters = {}, sort = 'relevance') => {
    if (abortController.current) {
      abortController.current.abort();
    }
    abortController.current = new AbortController();

    setLoading(true);
    setError(null);

    try {
      console.log('🤖 AI Search initiated:', { searchQuery, searchFilters, sort });

      const response = await axios.post(
        `${API_BASE}/products`,
        {
          query: searchQuery || '',
          filters: searchFilters,
          sortBy: sort,
          page: 1,
          limit: 24
        },
        {
          timeout: 15000,
          signal: abortController.current.signal,
          headers: {
            'x-session-id': sessionId.current,
            'x-ai-mode': isAIMode ? 'enabled' : 'disabled'
          }
        }
      );

      console.log('🧠 AI Response received:', response.data);

      if (response.data && response.data.success) {
        const hits = response.data.data || [];
        const facetsData = response.data.filterOptions || {};
        const pagination = response.data.pagination || {};
        
        console.log('✅ AI Search results:', {
          totalHits: pagination.total || hits.length,
          resultsCount: hits.length,
          performance: response.data.performance
        });
        
        setResults(hits);
        setFacets(facetsData);
        setAiInsights(response.data.performance);

        if (onResultsChange && typeof onResultsChange === 'function') {
          onResultsChange(hits);
        }

        // Save successful search to history
        if (searchQuery && searchQuery.trim()) {
          saveToHistory(searchQuery);
        }

      } else {
        console.warn('⚠️ Invalid AI response format:', response.data);
        throw new Error('Invalid response format');
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('🔄 AI Search cancelled');
        return;
      }

      console.error('❌ AI Search error:', error);
      setError('AI search temporarily unavailable. Please try again.');
      setResults([]);
      setFacets({});
      setAiInsights(null);

      if (onResultsChange) {
        onResultsChange([]);
      }
    } finally {
      setLoading(false);
    }
  };

  // Get AI Suggestions
  const getAISuggestions = async (searchQuery) => {
    if (!searchQuery || !searchQuery.trim()) {
      setSuggestions([]);
      return;
    }

    try {
      const response = await axios.get(`${API_BASE}/suggestions`, {
        params: { q: searchQuery },
        timeout: 5000
      });

      if (response.data.success) {
        setSuggestions(response.data.suggestions || []);
        setShowSuggestions(true);
      }
    } catch (error) {
      console.error('AI Suggestions error:', error);
      setSuggestions([]);
    }
  };

  // Debounced search
  const debouncedSearch = useCallback((searchQuery) => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(() => {
      if (searchQuery && searchQuery.trim()) {
        performAISearch(searchQuery, filters, sortBy);
        getAISuggestions(searchQuery);
      } else {
        setResults([]);
        setFacets({});
        setAiInsights(null);
        setSuggestions([]);
        if (onResultsChange) onResultsChange([]);
      }
    }, 300);
  }, [filters, sortBy, onResultsChange, isAIMode]);

  // Handle search input changes
  const handleSearchChange = (e) => {
    const value = e?.target?.value || '';
    setQuery(value);
    debouncedSearch(value);
    
    if (value.trim()) {
      getAISuggestions(value);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  // Handle suggestion selection
  const handleSuggestionSelect = (suggestion) => {
    const searchTerm = suggestion.title;
    setQuery(searchTerm);
    setShowSuggestions(false);
    performAISearch(searchTerm, filters, sortBy);
    searchInputRef.current?.focus();
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
    performAISearch(query, newFilters, sortBy);
  };

  // Handle sort change
  const handleSortChange = (newSort) => {
    setSortBy(newSort);
    performAISearch(query, filters, newSort);
  };

  // Clear search
  const clearSearch = () => {
    setQuery('');
    setResults([]);
    setFacets({});
    setAiInsights(null);
    setSuggestions([]);
    setShowSuggestions(false);
    setError(null);
    if (onResultsChange) onResultsChange([]);
    searchInputRef.current?.focus();
  };

  // Get suggestion icon
  const getSuggestionIcon = (type) => {
    switch (type) {
      case 'product': return <Squares2X2Icon className="h-4 w-4" />;
      case 'category': return <TagIcon className="h-4 w-4" />;
      case 'brand': return <BuildingStorefrontIcon className="h-4 w-4" />;
      case 'tag': return <SparklesIcon className="h-4 w-4" />;
      default: return <MagnifyingGlassIcon className="h-4 w-4" />;
    }
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.ai-search-container')) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`ai-search-container ${className}`}>
      {/* AI Search Header */}
      <div className="mb-6 text-center">
        <div className="flex items-center justify-center space-x-2 mb-2">
          <CpuChipIcon className="h-6 w-6 text-blue-600" />
          <h3 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            AI-Powered Search
          </h3>
          <BeakerIcon className="h-6 w-6 text-purple-600" />
        </div>
        <p className="text-sm text-gray-600">
          Advanced semantic search with intelligent suggestions and personalization
        </p>
      </div>

      {/* AI Mode Toggle */}
      <div className="flex items-center justify-center mb-4">
        <div className="flex items-center space-x-3 bg-gray-100 rounded-full p-1">
          <button
            onClick={() => setIsAIMode(false)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              !isAIMode 
                ? 'bg-white text-gray-900 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <MagnifyingGlassIcon className="h-4 w-4 inline mr-1" />
            Standard
          </button>
          <button
            onClick={() => setIsAIMode(true)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              isAIMode 
                ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <SparklesIcon className="h-4 w-4 inline mr-1" />
            AI Enhanced
          </button>
        </div>
      </div>

      {/* Main Search Bar */}
      <div className="relative mb-6">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            {loading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-500 border-t-transparent"></div>
            ) : (
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            )}
          </div>
          
          <input
            ref={searchInputRef}
            type="text"
            value={query}
            onChange={handleSearchChange}
            placeholder={isAIMode ? "Ask AI to find products..." : "Search products..."}
            className="w-full pl-12 pr-12 py-4 text-lg border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all bg-white shadow-sm"
          />
          
          {query && (
            <button
              onClick={clearSearch}
              className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* AI Suggestions Dropdown */}
        <AnimatePresence>
          {showSuggestions && suggestions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-200 z-50 max-h-96 overflow-y-auto"
            >
              <div className="p-2">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionSelect(suggestion)}
                    className="w-full text-left p-3 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-3"
                  >
                    <div className="text-gray-400">
                      {getSuggestionIcon(suggestion.type)}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{suggestion.title}</div>
                      <div className="text-sm text-gray-500 flex items-center space-x-2">
                        <span className="capitalize">{suggestion.type}</span>
                        {suggestion.count && (
                          <>
                            <span>•</span>
                            <span>{suggestion.count} items</span>
                          </>
                        )}
                        {suggestion.category && (
                          <>
                            <span>•</span>
                            <span>{suggestion.category}</span>
                          </>
                        )}
                      </div>
                    </div>
                    {suggestion.type === 'product' && suggestion.price && (
                      <div className="text-sm font-medium text-blue-600">
                        {suggestion.price.toLocaleString()} RWF
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Search History */}
      {!query && searchHistory.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center space-x-2 mb-3">
            <ClockIcon className="h-4 w-4 text-gray-400" />
            <span className="text-sm font-medium text-gray-600">Recent Searches</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {searchHistory.slice(0, 5).map((item, index) => (
              <button
                key={index}
                onClick={() => {
                  setQuery(item);
                  performAISearch(item, filters, sortBy);
                }}
                className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors"
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* AI Insights Panel */}
      {aiInsights && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mb-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 border border-blue-100"
        >
          <div className="flex items-center space-x-2 mb-2">
            <LightBulbIcon className="h-5 w-5 text-blue-600" />
            <span className="font-medium text-blue-900">AI Insights</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Search Type:</span>
              <div className="font-medium capitalize text-blue-700">{aiInsights.search_type}</div>
            </div>
            <div>
              <span className="text-gray-600">Analyzed:</span>
              <div className="font-medium text-blue-700">{aiInsights.total_analyzed} products</div>
            </div>
            <div>
              <span className="text-gray-600">Relevant:</span>
              <div className="font-medium text-blue-700">{aiInsights.relevant_found} found</div>
            </div>
            <div>
              <span className="text-gray-600">Top Match:</span>
              <div className="font-medium text-blue-700">{aiInsights.top_match_score}% relevance</div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Filters and Sort */}
      <div className="flex flex-col lg:flex-row gap-4 mb-6">
        <div className="flex-1 flex flex-wrap gap-3">
          {/* Sort Dropdown */}
          <select
            value={sortBy}
            onChange={(e) => handleSortChange(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="relevance">🎯 AI Relevance</option>
            <option value="popularity">🔥 Most Popular</option>
            <option value="newest">✨ Newest First</option>
            <option value="price_low">💰 Price: Low to High</option>
            <option value="price_high">💎 Price: High to Low</option>
            <option value="rating">⭐ Highest Rated</option>
          </select>

          {/* Quick Filters */}
          {facets.category && Object.keys(facets.category).length > 0 && (
            <select
              value={filters.category || ''}
              onChange={(e) => handleFilterChange('category', e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Categories</option>
              {Object.entries(facets.category).map(([category, count]) => (
                <option key={category} value={category}>
                  {category} ({count})
                </option>
              ))}
            </select>
          )}

          {facets.brand && Object.keys(facets.brand).length > 0 && (
            <select
              value={filters.brand || ''}
              onChange={(e) => handleFilterChange('brand', e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Brands</option>
              {Object.entries(facets.brand).map(([brand, count]) => (
                <option key={brand} value={brand}>
                  {brand} ({count})
                </option>
              ))}
            </select>
          )}
        </div>

        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <AdjustmentsHorizontalIcon className="h-5 w-5 mr-2" />
          Advanced Filters
        </button>
      </div>

      {/* Advanced Filters Panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6 bg-white rounded-xl border border-gray-200 p-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price Range
                </label>
                <div className="space-y-2">
                  <input
                    type="number"
                    placeholder="Min price"
                    value={filters.minPrice || ''}
                    onChange={(e) => handleFilterChange('minPrice', Number(e.target.value) || undefined)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="number"
                    placeholder="Max price"
                    value={filters.maxPrice || ''}
                    onChange={(e) => handleFilterChange('maxPrice', Number(e.target.value) || undefined)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Minimum Rating
                </label>
                <select
                  value={filters.rating || ''}
                  onChange={(e) => handleFilterChange('rating', Number(e.target.value) || undefined)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Any Rating</option>
                  <option value="4">4+ Stars</option>
                  <option value="3.5">3.5+ Stars</option>
                  <option value="3">3+ Stars</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Availability
                </label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.inStock || false}
                      onChange={(e) => handleFilterChange('inStock', e.target.checked || undefined)}
                      className="mr-2 text-blue-600 focus:ring-blue-500"
                    />
                    In Stock Only
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.freeShipping || false}
                      onChange={(e) => handleFilterChange('freeShipping', e.target.checked || undefined)}
                      className="mr-2 text-blue-600 focus:ring-blue-500"
                    />
                    Free Shipping
                  </label>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error Message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4"
        >
          <div className="flex items-center space-x-2 text-red-700">
            <XMarkIcon className="h-5 w-5" />
            <span>{error}</span>
          </div>
        </motion.div>
      )}

      {/* Results Summary */}
      {results.length > 0 && (
        <div className="mb-4 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Found <span className="font-medium">{results.length}</span> products
            {query && <span> for "<span className="font-medium">{query}</span>"</span>}
          </div>
          {isAIMode && (
            <div className="flex items-center space-x-1 text-xs text-blue-600">
              <SparklesIcon className="h-4 w-4" />
              <span>AI Enhanced</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AISearchComponent;
