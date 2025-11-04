import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  MagnifyingGlassIcon,
  SparklesIcon,
  XMarkIcon,
  ClockIcon,
  ArrowTrendingUpIcon
} from '@heroicons/react/24/outline';
import axios from 'axios';

const Enhanced3DSearch = ({ onClose }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [recentSearches, setRecentSearches] = useState([]);
  const [popularSearches] = useState(['Dress', 'Ankara', 'African Print', 'Skirt', 'Blazer']);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  // Auto-typing animation for placeholder
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [placeholderText, setPlaceholderText] = useState('');
  const placeholders = [
    'Search for dresses...',
    'Find African prints...',
    'Discover new styles...',
    'Search by color or size...'
  ];

  // Auto-typing effect
  useEffect(() => {
    const currentPlaceholder = placeholders[placeholderIndex];
    let charIndex = 0;
    const typingInterval = setInterval(() => {
      if (charIndex <= currentPlaceholder.length) {
        setPlaceholderText(currentPlaceholder.slice(0, charIndex));
        charIndex++;
      } else {
        clearInterval(typingInterval);
        setTimeout(() => {
          setPlaceholderIndex((placeholderIndex + 1) % placeholders.length);
        }, 2000);
      }
    }, 100);

    return () => clearInterval(typingInterval);
  }, [placeholderIndex]);

  // Load recent searches
  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('recentSearches') || '[]');
    setRecentSearches(saved.slice(0, 5));
  }, []);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Search function with debounce
  useEffect(() => {
    const debounce = setTimeout(() => {
      if (query.length > 1) {
        performSearch(query);
      } else {
        setResults([]);
        setSuggestions([]);
      }
    }, 300);

    return () => clearTimeout(debounce);
  }, [query]);

  const performSearch = async (searchQuery) => {
    setLoading(true);
    try {
      const response = await axios.get('/api/products', {
        params: { search: searchQuery }
      });
      
      const products = response.data.data || response.data || [];
      setResults(products.slice(0, 6)); // Show top 6 results

      // Generate suggestions
      const uniqueNames = [...new Set(products.map(p => p.name))].slice(0, 5);
      setSuggestions(uniqueNames);
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (searchTerm) => {
    if (searchTerm.trim()) {
      // Save to recent searches
      const recent = JSON.parse(localStorage.getItem('recentSearches') || '[]');
      const updated = [searchTerm, ...recent.filter(s => s !== searchTerm)].slice(0, 10);
      localStorage.setItem('recentSearches', JSON.stringify(updated));

      // Navigate to shop with search
      navigate(`/shop?search=${encodeURIComponent(searchTerm)}`);
      if (onClose) onClose();
    }
  };

  const handleProductClick = (product) => {
    navigate(`/product/${product._id || product.id}`);
    if (onClose) onClose();
  };

  const clearSearch = () => {
    setQuery('');
    setResults([]);
    setSuggestions([]);
    inputRef.current?.focus();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm z-50 flex items-start justify-center p-4 sm:p-6 md:p-8 overflow-y-auto"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: -50 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: -50 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="w-full max-w-4xl mt-8 sm:mt-16"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 3D Search Box */}
        <div className="relative">
          {/* Glowing background effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 rounded-3xl blur-2xl opacity-30 animate-pulse"></div>
          
          {/* Main search container */}
          <div className="relative bg-white rounded-3xl shadow-2xl overflow-hidden"
               style={{ transform: 'perspective(1000px) rotateX(2deg)' }}>
            
            {/* Search Input */}
            <div className={`relative border-b-2 transition-colors ${focused ? 'border-purple-500' : 'border-gray-200'}`}>
              <div className="flex items-center p-4 sm:p-6">
                <motion.div
                  animate={{ rotate: loading ? 360 : 0 }}
                  transition={{ duration: 1, repeat: loading ? Infinity : 0, ease: "linear" }}
                >
                  <MagnifyingGlassIcon className="h-6 w-6 sm:h-8 sm:w-8 text-purple-600 mr-3 sm:mr-4" />
                </motion.div>
                
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onFocus={() => setFocused(true)}
                  onBlur={() => setFocused(false)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch(query)}
                  placeholder={placeholderText}
                  className="flex-1 text-lg sm:text-xl font-medium text-gray-900 placeholder-gray-400 outline-none bg-transparent"
                />

                {query && (
                  <motion.button
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    onClick={clearSearch}
                    className="ml-2 p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <XMarkIcon className="h-5 w-5 text-gray-500" />
                  </motion.button>
                )}

                <button
                  onClick={onClose}
                  className="ml-2 sm:ml-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <XMarkIcon className="h-6 w-6 text-gray-600" />
                </button>
              </div>

              {/* Animated progress bar */}
              {loading && (
                <motion.div
                  className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-purple-600 to-pink-600"
                  initial={{ width: '0%' }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 1, repeat: Infinity }}
                />
              )}
            </div>

            {/* Results/Suggestions Container */}
            <div className="max-h-[60vh] overflow-y-auto p-4 sm:p-6">
              <AnimatePresence mode="wait">
                {/* Search Results */}
                {results.length > 0 && (
                  <motion.div
                    key="results"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="space-y-3"
                  >
                    <div className="flex items-center gap-2 mb-4">
                      <SparklesIcon className="h-5 w-5 text-purple-600" />
                      <h3 className="text-sm font-bold text-gray-900">Found {results.length} products</h3>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      {results.map((product, index) => (
                        <motion.div
                          key={product._id || product.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          onClick={() => handleProductClick(product)}
                          className="group cursor-pointer bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-3 hover:shadow-lg transition-all duration-300 transform hover:scale-105"
                          whileHover={{ y: -5 }}
                        >
                          <div className="relative aspect-square rounded-xl overflow-hidden mb-2">
                            <img
                              src={product.mainImage || product.image}
                              alt={product.name}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                          </div>
                          <h4 className="font-bold text-sm text-gray-900 line-clamp-1">{product.name}</h4>
                          <p className="text-purple-600 font-bold text-sm">{product.price?.toLocaleString()} RWF</p>
                        </motion.div>
                      ))}
                    </div>

                    <button
                      onClick={() => handleSearch(query)}
                      className="w-full mt-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-xl font-semibold hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg hover:shadow-xl"
                    >
                      View All Results →
                    </button>
                  </motion.div>
                )}

                {/* No Results */}
                {query.length > 1 && !loading && results.length === 0 && (
                  <motion.div
                    key="noresults"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-8"
                  >
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <MagnifyingGlassIcon className="h-8 w-8 text-gray-400" />
                    </div>
                    <p className="text-gray-600 font-medium">No products found for "{query}"</p>
                    <p className="text-sm text-gray-500 mt-2">Try different keywords</p>
                  </motion.div>
                )}

                {/* Popular/Recent Searches */}
                {!query && (
                  <motion.div
                    key="suggestions"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="space-y-6"
                  >
                    {/* Recent Searches */}
                    {recentSearches.length > 0 && (
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <ClockIcon className="h-5 w-5 text-gray-500" />
                          <h3 className="text-sm font-bold text-gray-900">Recent Searches</h3>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {recentSearches.map((search, index) => (
                            <motion.button
                              key={index}
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: index * 0.05 }}
                              onClick={() => {
                                setQuery(search);
                                handleSearch(search);
                              }}
                              className="px-4 py-2 bg-gray-100 hover:bg-purple-100 rounded-full text-sm font-medium text-gray-700 hover:text-purple-700 transition-colors"
                            >
                              {search}
                            </motion.button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Popular Searches */}
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <ArrowTrendingUpIcon className="h-5 w-5 text-orange-500" />
                        <h3 className="text-sm font-bold text-gray-900">Popular Searches</h3>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {popularSearches.map((search, index) => (
                          <motion.button
                            key={index}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: index * 0.05 }}
                            onClick={() => {
                              setQuery(search);
                              handleSearch(search);
                            }}
                            className="px-4 py-2 bg-gradient-to-r from-purple-100 to-pink-100 hover:from-purple-200 hover:to-pink-200 rounded-full text-sm font-medium text-purple-700 transition-all transform hover:scale-105"
                            whileHover={{ y: -2 }}
                          >
                            🔥 {search}
                          </motion.button>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Floating particles */}
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-purple-400 rounded-full opacity-50"
            style={{
              left: `${20 + i * 15}%`,
              top: `${10 + (i % 3) * 10}%`
            }}
            animate={{
              y: [0, -20, 0],
              opacity: [0.3, 0.7, 0.3],
              scale: [1, 1.5, 1]
            }}
            transition={{
              duration: 3 + i,
              repeat: Infinity,
              delay: i * 0.2
            }}
          />
        ))}
      </motion.div>
    </motion.div>
  );
};

export default Enhanced3DSearch;
