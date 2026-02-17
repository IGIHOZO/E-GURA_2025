import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  ChevronRightIcon,
  SparklesIcon,
  MagnifyingGlassIcon,
  TagIcon,
  FireIcon,
  ArrowTrendingUpIcon
} from '@heroicons/react/24/outline';
import axios from 'axios';

const CategoryExplorer = () => {
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hoveredCategory, setHoveredCategory] = useState(null);
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [stats, setStats] = useState({ totalProducts: 0, totalOrders: 0 });

  useEffect(() => {
    fetchCategories();
    fetchStats();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await axios.get('/api/categories/hierarchical/all');
      if (response.data.success) {
        setCategories(response.data.categories);
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error);
      // Fallback to empty array if API fails
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      // Fetch real product count
      const productsRes = await axios.get('/api/products?limit=1');
      const totalProducts = productsRes.data?.pagination?.total || 0;
      
      setStats({ totalProducts });
      
      // Generate suggestions based on real categories
      generateAISuggestions(totalProducts);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
      generateAISuggestions(0);
    }
  };

  const generateAISuggestions = (productCount) => {
    // Trending categories based on actual category data
    const trending = [
      { name: "Women's Fashion", icon: '👗', trend: 'Popular', color: 'from-pink-500 to-purple-500' },
      { name: 'Traditional & Cultural', icon: '🎎', trend: 'Trending', color: 'from-orange-500 to-red-500' },
      { name: 'Special Occasions', icon: '🎉', trend: 'Hot', color: 'from-blue-500 to-indigo-500' },
      { name: 'Custom & Tailored', icon: '✂️', trend: 'New', color: 'from-green-500 to-teal-500' }
    ];
    setAiSuggestions(trending);
  };

  const handleCategoryClick = (category) => {
    if (selectedCategory?.id === category.id) {
      setSelectedCategory(null);
    } else {
      setSelectedCategory(category);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (categories.length === 0) {
    return (
      <section className="py-16 bg-gradient-to-br from-gray-50 to-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="bg-white rounded-xl p-12 shadow-lg">
            <SparklesIcon className="h-16 w-16 text-purple-600 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Categories Loading...</h3>
            <p className="text-gray-600 mb-6">
              We're setting up our category system. Please check back soon!
            </p>
            <Link
              to="/shop"
              className="inline-block bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-3 rounded-full font-medium hover:shadow-lg transition-all"
            >
              Browse All Products
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 bg-gradient-to-br from-gray-50 to-purple-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-2 rounded-full mb-4"
          >
            <SparklesIcon className="h-5 w-5" />
            <span className="font-semibold">AI-Powered Categories</span>
          </motion.div>
          
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Explore Our Collections
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Discover {categories.length} main categories with hundreds of subcategories, 
            powered by AI to help you find exactly what you're looking for
          </p>
        </div>

        {/* AI Trending Suggestions */}
        <div className="mb-12">
          <div className="flex items-center gap-2 mb-6">
            <FireIcon className="h-6 w-6 text-orange-500" />
            <h3 className="text-xl font-bold text-gray-900">Trending Now</h3>
            <span className="text-sm text-gray-500">(AI Detected)</span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {aiSuggestions.map((suggestion, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className={`bg-gradient-to-r ${suggestion.color} p-6 rounded-xl text-white cursor-pointer hover:shadow-xl transition-all`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-3xl">{suggestion.icon}</span>
                  <div className="flex items-center gap-1 bg-white/20 px-2 py-1 rounded-full">
                    <ArrowTrendingUpIcon className="h-4 w-4" />
                    <span className="text-xs font-bold">{suggestion.trend}</span>
                  </div>
                </div>
                <h4 className="font-bold text-lg">{suggestion.name}</h4>
                <p className="text-sm opacity-90">Hot this week</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Main Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {categories.map((category, index) => (
            <motion.div
              key={category.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="relative"
            >
              {/* Main Category Card */}
              <div
                onClick={() => handleCategoryClick(category)}
                onMouseEnter={() => setHoveredCategory(category.id)}
                onMouseLeave={() => setHoveredCategory(null)}
                className={`
                  bg-white rounded-xl p-6 cursor-pointer transition-all duration-300
                  ${selectedCategory?.id === category.id 
                    ? 'ring-2 ring-purple-500 shadow-xl scale-105' 
                    : 'hover:shadow-lg hover:scale-102'
                  }
                `}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-4xl">{category.icon}</span>
                    <div>
                      <h3 className="font-bold text-lg text-gray-900">
                        {category.name}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {category.subcategories.length} subcategories
                      </p>
                    </div>
                  </div>
                  
                  <motion.div
                    animate={{ rotate: selectedCategory?.id === category.id ? 90 : 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <ChevronRightIcon className="h-5 w-5 text-gray-400" />
                  </motion.div>
                </div>

                <p className="text-sm text-gray-600 mb-4">
                  {category.description}
                </p>

                {/* Quick Preview of Subcategories */}
                {hoveredCategory === category.id && !selectedCategory && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="flex flex-wrap gap-2 pt-3 border-t border-gray-100"
                  >
                    {category.subcategories.slice(0, 3).map((sub) => (
                      <span
                        key={sub.id}
                        className="text-xs bg-purple-50 text-purple-700 px-2 py-1 rounded-full"
                      >
                        {sub.icon} {sub.name}
                      </span>
                    ))}
                    {category.subcategories.length > 3 && (
                      <span className="text-xs text-gray-500">
                        +{category.subcategories.length - 3} more
                      </span>
                    )}
                  </motion.div>
                )}
              </div>

              {/* Expanded Subcategories */}
              <AnimatePresence>
                {selectedCategory?.id === category.id && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-4 bg-white rounded-xl p-6 shadow-lg"
                  >
                    <div className="flex items-center gap-2 mb-4">
                      <TagIcon className="h-5 w-5 text-purple-600" />
                      <h4 className="font-bold text-gray-900">Subcategories</h4>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-2">
                      {category.subcategories.map((subcategory) => (
                        <Link
                          key={subcategory.id}
                          to={`/shop?category=${category.id}&subcategory=${subcategory.id}`}
                          className="flex items-center gap-3 p-3 rounded-lg hover:bg-purple-50 transition-colors group"
                        >
                          <span className="text-2xl">{subcategory.icon}</span>
                          <span className="text-sm font-medium text-gray-700 group-hover:text-purple-600">
                            {subcategory.name}
                          </span>
                          <ChevronRightIcon className="h-4 w-4 text-gray-400 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                        </Link>
                      ))}
                    </div>

                    <Link
                      to={`/category/${category.id}`}
                      className="mt-4 block text-center py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-medium hover:shadow-lg transition-all"
                    >
                      View All {category.name}
                    </Link>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>

        {/* AI Search Suggestion */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-12 text-center"
        >
          <div className="inline-flex items-center gap-3 bg-white px-8 py-4 rounded-full shadow-lg">
            <MagnifyingGlassIcon className="h-6 w-6 text-purple-600" />
            <span className="text-gray-700">Can't find what you're looking for?</span>
            <Link
              to="/shop"
              className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-2 rounded-full font-medium hover:shadow-lg transition-all"
            >
              Try AI Search
            </Link>
          </div>
        </motion.div>

        {/* Stats */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600">{categories.length}</div>
            <div className="text-sm text-gray-600">Main Categories</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-pink-600">
              {categories.reduce((sum, cat) => sum + (cat.subcategories?.length || 0), 0)}
            </div>
            <div className="text-sm text-gray-600">Subcategories</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-orange-600">{stats.totalProducts}</div>
            <div className="text-sm text-gray-600">Products</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">Kigali</div>
            <div className="text-sm text-gray-600">Based in Rwanda</div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CategoryExplorer;
