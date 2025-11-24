import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  MagnifyingGlassIcon, 
  FunnelIcon, 
  HeartIcon,
  ShoppingBagIcon,
  EyeIcon,
  StarIcon,
  XMarkIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  SparklesIcon,
  TruckIcon,
  ShieldCheckIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  BoltIcon,
  GiftIcon,
  TagIcon,
  ClockIcon,
  UserGroupIcon,
  GlobeAltIcon,
  CurrencyDollarIcon,
  AdjustmentsHorizontalIcon,
  ShoppingCartIcon,
  UserIcon,
  CogIcon,
  BellIcon,
  ArrowTrendingUpIcon,
  FireIcon
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid';
import SEOHead from '../components/SEOHead';
import { productsAPI } from '../services/api';
import { useCart } from '../context/CartContext';
import ProductCard from '../components/ProductCard';
import { detectDevice, getDeviceType, isTouchDevice } from '../utils/deviceDetect';
import useResponsive from '../hooks/useResponsive';
import axios from 'axios';

const Shop = () => {
  const { isMobile, isTablet } = useResponsive();
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [priceRange, setPriceRange] = useState([0, 100000]);
  const [sortBy, setSortBy] = useState('featured');
  // Default: show filters on desktop, hide on mobile
  const [showFilters, setShowFilters] = useState(false);
  const [wishlist, setWishlist] = useState([]);
  const [quickViewProduct, setQuickViewProduct] = useState(null);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState('');
  const [selectedRating, setSelectedRating] = useState('');
  const [selectedDiscount, setSelectedDiscount] = useState('');
  const [selectedShipping, setSelectedShipping] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // grid or list
  const [currentDealIndex, setCurrentDealIndex] = useState(0);
  const [showCategoryCarousel, setShowCategoryCarousel] = useState(false);
  const [selectedFlashDeal, setSelectedFlashDeal] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [recentSearches, setRecentSearches] = useState([]);
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);
  const [userBehavior, setUserBehavior] = useState({
    searches: [],
    visitedProducts: [],
    orders: []
  });
  const [deviceInfo, setDeviceInfo] = useState(detectDevice());
  const [isMobileView, setIsMobileView] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const { addToCart } = useCart();


  // AI Recommendation System
  const trackUserBehavior = (type, data) => {
    const userId = localStorage.getItem('userId') || 'anonymous';
    const behavior = JSON.parse(localStorage.getItem(`userBehavior_${userId}`) || '{}');
    
    if (!behavior[type]) behavior[type] = [];
    
    // Add new data and keep only last 50 items
    behavior[type] = [...behavior[type], { ...data, timestamp: Date.now() }].slice(-50);
    
    localStorage.setItem(`userBehavior_${userId}`, JSON.stringify(behavior));
    setUserBehavior(behavior);
  };

  // Enhanced Search Functions
  const handleSearch = async (term) => {
    if (term.trim()) {
      // Track search behavior
      trackUserBehavior('searches', { term: term.trim() });
      
      // Update recent searches
      const newRecentSearches = [term.trim(), ...recentSearches.filter(s => s !== term.trim())].slice(0, 5);
      setRecentSearches(newRecentSearches);
      localStorage.setItem('recentSearches', JSON.stringify(newRecentSearches));
      
      setSearchTerm(term);
      setShowSearchSuggestions(false);
      
      // Immediately trigger AI search
      console.log('🔍 Triggering AI search for:', term);
      await handleAISearch({
        query: term,
        filters: {
          category: selectedCategory !== 'All' ? selectedCategory : undefined,
          brand: selectedBrand || undefined,
          minPrice: priceRange[0],
          maxPrice: priceRange[1]
        },
        sortBy: sortBy
      });
    }
  };

  const loadRecentSearches = () => {
    const saved = localStorage.getItem('recentSearches');
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }
  };

  const getSearchSuggestions = () => {
    if (!searchTerm.trim()) return recentSearches;
    
    const allTerms = [...recentSearches, ...products.map(p => p.name), ...products.map(p => p.category)].filter(Boolean);
    const suggestions = allTerms.filter(term => 
      term.toLowerCase().includes(searchTerm.toLowerCase())
    );
    return [...new Set(suggestions)].slice(0, 5);
  };

  const generateRecommendations = () => {
    const userId = localStorage.getItem('userId') || 'anonymous';
    const behavior = JSON.parse(localStorage.getItem(`userBehavior_${userId}`) || '{}');
    
    if (!behavior.searches?.length && !behavior.visitedProducts?.length && recentSearches.length === 0) {
      // If no user data, show popular products
      return products.slice(0, 8);
    }

    // Enhanced AI recommendation algorithm
    const visitedCategories = new Set();
    const searchTerms = new Set();
    const recentSearchTerms = new Set(recentSearches.map(s => s.toLowerCase()));
    
    // Analyze visited products
    behavior.visitedProducts?.forEach(item => {
      if (item.category) visitedCategories.add(item.category);
    });
    
    // Analyze search terms from behavior and recent searches
    behavior.searches?.forEach(search => {
      searchTerms.add(search.term.toLowerCase());
    });
    
    // Combine all search terms
    const allSearchTerms = [...searchTerms, ...recentSearchTerms];
    
    // Score products based on user behavior
    const scoredProducts = products.map(product => {
      let score = 0;
      
      // Category preference (higher weight for recent activity)
      if (visitedCategories.has(product.category)) score += 4;
      
      // Search term matching (higher weight for recent searches)
      allSearchTerms.forEach(term => {
        if (product.name.toLowerCase().includes(term)) {
          score += recentSearchTerms.has(term) ? 4 : 2; // Recent searches get higher weight
        }
        if (product.shortDescription?.toLowerCase().includes(term)) {
          score += recentSearchTerms.has(term) ? 3 : 1;
        }
        if (product.category?.toLowerCase().includes(term)) {
          score += recentSearchTerms.has(term) ? 3 : 1;
        }
      });
      
      // Price range preference (based on visited products and recent searches)
      const avgVisitedPrice = behavior.visitedProducts?.reduce((sum, item) => sum + (item.price || 0), 0) / (behavior.visitedProducts?.length || 1);
      if (Math.abs(product.price - avgVisitedPrice) < avgVisitedPrice * 0.3) score += 2;
      
      // Recent search boost
      if (recentSearches.length > 0) {
        const hasRecentMatch = recentSearches.some(search => 
          product.name.toLowerCase().includes(search.toLowerCase()) ||
          product.category?.toLowerCase().includes(search.toLowerCase())
        );
        if (hasRecentMatch) score += 5; // High boost for recent search matches
      }
      
      // Popularity boost
      if (product.averageRating > 4) score += 1;
      if (product.totalSales > 100) score += 1;
      
      // New product boost
      if (product.isNew) score += 2;
      
      return { ...product, score };
    });
    
    // Sort by score and return top recommendations
    return scoredProducts
      .sort((a, b) => b.score - a.score)
      .slice(0, 8)
      .map(({ score, ...product }) => product);
  };

  // AliExpress-style categories with enhanced data
  const categories = [
    { name: 'All', count: 0, icon: '🌟', color: 'bg-gradient-to-r from-orange-400 to-red-500' },
    { name: 'Women\'s Fashion', count: 156, icon: '👗', color: 'bg-gradient-to-r from-pink-400 to-purple-500', hot: true },
    { name: 'Men\'s Fashion', count: 89, icon: '👔', color: 'bg-gradient-to-r from-blue-400 to-indigo-500' },
    { name: 'Kids & Baby', count: 67, icon: '👶', color: 'bg-gradient-to-r from-green-400 to-teal-500' },
    { name: 'Home & Garden', count: 234, icon: '🏠', color: 'bg-gradient-to-r from-brown-400 to-amber-500', hot: true },
    { name: 'Electronics', count: 445, icon: '📱', color: 'bg-gradient-to-r from-cyan-400 to-blue-500', hot: true },
    { name: 'Beauty & Health', count: 178, icon: '💄', color: 'bg-gradient-to-r from-pink-300 to-rose-500', hot: true },
    { name: 'Sports & Entertainment', count: 123, icon: '⚽', color: 'bg-gradient-to-r from-green-300 to-emerald-500' },
    { name: 'Automotive', count: 89, icon: '🚗', color: 'bg-gradient-to-r from-red-400 to-red-600' },
    { name: 'Toys & Hobbies', count: 156, icon: '🎮', color: 'bg-gradient-to-r from-purple-400 to-pink-500', hot: true },
    { name: 'Jewelry & Watches', count: 234, icon: '💍', color: 'bg-gradient-to-r from-amber-400 to-yellow-500', hot: true },
    { name: 'Tools & Hardware', count: 78, icon: '🔧', color: 'bg-gradient-to-r from-gray-400 to-gray-600' },
    { name: 'Luggage & Bags', count: 112, icon: '👜', color: 'bg-gradient-to-r from-yellow-400 to-orange-500' }
  ];

  // Flash deals data (AliExpress-style)
  const flashDeals = [
    {
      id: 1,
      title: "Flash Sale",
      subtitle: "Up to 90% OFF",
      timeLeft: "02:45:30",
      products: 156,
      color: "bg-gradient-to-r from-red-500 to-pink-500",
      image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=200&fit=crop"
    },
    {
      id: 2,
      title: "New User Deal",
      subtitle: "Extra 15% OFF",
      timeLeft: "23:59:59",
      products: 89,
      color: "bg-gradient-to-r from-blue-500 to-purple-500",
      image: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&h=200&fit=crop"
    },
    {
      id: 3,
      title: "Clearance Sale",
      subtitle: "Final Prices",
      timeLeft: "05:30:15",
      products: 234,
      color: "bg-gradient-to-r from-green-500 to-teal-500"
    }
  ];

  const sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
  const colors = ['Blue', 'Red', 'Green', 'Yellow', 'Black', 'White', 'Purple', 'Orange'];
  const brands = ['E-Gura Store', 'Nike', 'Adidas', 'Zara', 'H&M', 'Uniqlo', 'Gap', 'Forever 21'];
  const ratings = ['4.5+', '4.0+', '3.5+', '3.0+'];
  const discounts = ['10%+', '20%+', '30%+', '50%+', '70%+'];
  const shippingOptions = ['Free Shipping', 'Express Delivery', 'Local Pickup'];

  // Device Detection
  useEffect(() => {
    const updateDeviceInfo = () => {
      const device = detectDevice();
      setDeviceInfo(device);
      setIsMobileView(device.isMobile || window.innerWidth < 768);
      
      console.log('📱 Shop Page Device Info:', {
        type: getDeviceType(),
        isMobile: device.isMobile,
        isTablet: device.isTablet,
        isTouch: isTouchDevice(),
        screen: `${device.screenWidth}x${device.screenHeight}`
      });
    };

    updateDeviceInfo();
    window.addEventListener('resize', updateDeviceInfo);
    window.addEventListener('orientationchange', updateDeviceInfo);
    
    return () => {
      window.removeEventListener('resize', updateDeviceInfo);
      window.removeEventListener('orientationchange', updateDeviceInfo);
    };
  }, []);

  // Initial load - fetch products on mount
  useEffect(() => {
    fetchProducts();
    loadRecentSearches();
    
    // Clear any saved search params
    localStorage.removeItem('searchParams');
  }, []);

  useEffect(() => {
    filterAndSortProducts();
    
    // Generate AI recommendations
    if (products.length > 0) {
      const recommendations = generateRecommendations();
      setRecommendations(recommendations);
    }
  }, [products, searchTerm, selectedCategory, priceRange, sortBy]);

  // Close search suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.search-container')) {
        setShowSearchSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      console.log('🔄 Fetching products from API...');

      // Use optimized search endpoint with pagination
      const response = await axios.get('/api/search/products', {
        params: {
          page: 1,
          limit: 50, // Reduced from 100 for faster loading
          sortBy: 'featured'
        }
      });

      console.log('✅ API Response:', response.data);

      if (response.data && response.data.success) {
        const products = response.data.data || [];
        console.log(`📦 Loaded ${products.length} products from database`);

        setProducts(products);
        setFilteredProducts(products);
        setLastUpdated(new Date());

        // Cache products in localStorage for faster subsequent loads
        try {
          localStorage.setItem('cachedProducts', JSON.stringify(products));
          localStorage.setItem('cacheTimestamp', Date.now().toString());
        } catch (e) {
          console.warn('Failed to cache products:', e);
        }

        if (products.length > 0) {
          console.log('✅ Products loaded successfully from database');
        }
      } else {
        console.log('⚠️ No products found in response');
        setProducts([]);
        setFilteredProducts([]);
      }
    } catch (error) {
      console.error('❌ Error fetching products:', error);

      // Try to load from cache
      try {
        const cached = localStorage.getItem('cachedProducts');
        const cacheTime = localStorage.getItem('cacheTimestamp');
        
        if (cached && cacheTime) {
          const age = Date.now() - parseInt(cacheTime);
          // Use cache if less than 5 minutes old
          if (age < 5 * 60 * 1000) {
            const cachedProducts = JSON.parse(cached);
            setProducts(cachedProducts);
            setFilteredProducts(cachedProducts);
            console.log('📦 Loaded products from cache');
            return;
          }
        }
      } catch (e) {
        console.warn('Failed to load cache:', e);
      }

      setProducts([]);
      setFilteredProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortProducts = async () => {
    // If there's a search term, use AI search API
    if (searchTerm && searchTerm.trim()) {
      console.log('🔍 Using AI search for:', searchTerm);
      
      try {
        setLoading(true);
        const response = await axios.get('/api/search/products', {
          params: {
            query: searchTerm,
            filters: JSON.stringify({
              category: selectedCategory !== 'All' ? selectedCategory : undefined,
              brand: selectedBrand || undefined,
              minPrice: priceRange[0],
              maxPrice: priceRange[1]
            }),
            sortBy: sortBy,
            page: 1,
            limit: 50
          }
        });
        
        if (response.data && response.data.success) {
          setFilteredProducts(response.data.data || []);
          console.log(`✅ Found ${response.data.data.length} products`);
        }
      } catch (error) {
        console.error('❌ Search error:', error);
        // Fallback to local filtering
      } finally {
        setLoading(false);
      }
      return;
    }
    
    // Otherwise use local filtering
    let filtered = [...products];

    // No search term filtering needed here since we use AI search above

    if (selectedCategory && selectedCategory !== 'All') {
      filtered = filtered.filter(product => product.category === selectedCategory);
    }

    if (selectedBrand) {
      filtered = filtered.filter(product => product.brand === selectedBrand);
    }

    if (selectedRating) {
      const minRating = parseFloat(selectedRating);
      filtered = filtered.filter(product => (product.averageRating || 0) >= minRating);
    }

    if (selectedDiscount) {
      const minDiscount = parseInt(selectedDiscount);
      filtered = filtered.filter(product => {
        if (product.originalPrice && product.price) {
          const discount = ((product.originalPrice - product.price) / product.originalPrice) * 100;
          return discount >= minDiscount;
        }
        return false;
      });
    }

    if (selectedShipping === 'Free Shipping') {
      filtered = filtered.filter(product => product.freeShipping);
    }

    filtered = filtered.filter(product => 
      product.price >= priceRange[0] && product.price <= priceRange[1]
    );

    switch (sortBy) {
      case 'price_low':
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'price_high':
        filtered.sort((a, b) => b.price - a.price);
        break;
      case 'newest':
        filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        break;
      case 'rating':
        filtered.sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0));
        break;
      case 'sales':
        filtered.sort((a, b) => (b.totalSales || 0) - (a.totalSales || 0));
        break;
      case 'featured':
      default:
        filtered.sort((a, b) => b.isFeatured - a.isFeatured);
        break;
    }

    setFilteredProducts(filtered);
  };

  const toggleWishlist = (productId) => {
    setWishlist(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const handleAddToCart = (product) => {
    const cartItem = {
      ...product,
      quantity: 1,
      size: selectedSize || product.sizes?.[0] || 'M',
      color: selectedColor || product.colors?.[0] || 'Default'
    };
    
    addToCart(cartItem);
    setShowSuccessMessage(true);
    setTimeout(() => setShowSuccessMessage(false), 3000);
  };

  const handleQuickView = (product) => {
    setQuickViewProduct(product);
    setSelectedSize(product.sizes?.[0] || 'M');
    setSelectedColor(product.colors?.[0] || 'Default');
    
    // Track product view
    trackUserBehavior('visitedProducts', {
      id: product._id || product.id,
      name: product.name,
      category: product.category,
      price: product.price
    });
  };

  const trackProductView = (product) => {
    trackUserBehavior('visitedProducts', {
      id: product._id || product.id,
      name: product.name,
      category: product.category,
      price: product.price
    });
  };



  return (
    <>
      <SEOHead 
        title="Shop Fashion Online - E-Gura Store"
        description="Discover the latest fashion trends in Kigali, Rwanda. Shop premium clothing, accessories, and style inspiration with free shipping and best prices at E-Gura Store."
        keywords="fashion shop, online shopping, Kigali fashion, Rwandan clothing, African fashion, premium clothing, accessories, style, trends, free shipping"
        pageType="shop"
      />
    <div className="min-h-screen bg-gray-50">
      {/* Simple Header */}
      <div className="bg-white border-b sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">E-Gura Store</h1>
              <div className="hidden md:flex items-center space-x-6">
                <span className="text-sm text-gray-600 flex items-center gap-1">
                  <TruckIcon className="h-4 w-4" /> Free Shipping
                </span>
                <span className="text-sm text-gray-400">|</span>
                <span className="text-sm text-gray-600 flex items-center gap-1">
                  <ShieldCheckIcon className="h-4 w-4" /> 24/7 Support
                </span>
                <span className="text-sm text-gray-400">|</span>
                <span className="text-sm text-gray-600 flex items-center gap-1">
                  <SparklesIcon className="h-4 w-4" /> AI-Powered Search
                </span>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-purple-100 text-purple-600' : 'text-gray-400 hover:text-gray-600'}`}
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-purple-100 text-purple-600' : 'text-gray-400 hover:text-gray-600'}`}
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Simple Search Section */}
      <section className="py-8 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-6">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Search Products</h2>
            <p className="text-gray-600">Find exactly what you're looking for</p>
          </div>
          <div className="max-w-3xl mx-auto">
            <div className="relative">
              <input
                type="text"
                placeholder="Search for products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-6 py-4 text-lg rounded-xl border-2 border-gray-300 focus:ring-4 focus:ring-purple-500 focus:border-purple-500 transition-all shadow-sm"
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2">
                <MagnifyingGlassIcon className="h-6 w-6 text-gray-400" />
              </div>
            </div>
            {searchTerm && (
              <div className="mt-2 text-sm text-gray-600">
                Showing results for: <strong>{searchTerm}</strong>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Simple Products Section - Hidden on mobile (redundant with responsive filters above) */}
      <section className="hidden lg:block py-8 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <h2 className="text-2xl font-bold text-gray-900">All Products</h2>
                <span className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                  {filteredProducts.length} items
                </span>
                <button
                  onClick={fetchProducts}
                  disabled={loading}
                  className="flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors disabled:opacity-50"
                  title="Refresh products"
                >
                  <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  {loading ? 'Loading...' : 'Refresh'}
                </button>
                <span className="text-xs text-gray-500">
                  Updated: {lastUpdated.toLocaleTimeString()}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Sort by:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="text-sm border border-gray-300 rounded-lg px-3 py-1 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                >
                  <option value="featured">Featured</option>
                  <option value="newest">Newest</option>
                  <option value="price_low">Price: Low to High</option>
                  <option value="price_high">Price: High to Low</option>
                  <option value="rating">Highest Rated</option>
                  <option value="sales">Best Selling</option>
                </select>
              </div>
              </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* AI Recommendations Section */}
        {recommendations.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center space-x-2 mb-4">
              <SparklesIcon className="h-6 w-6 text-orange-500" />
              <h3 className="text-xl font-semibold text-gray-900">Recommended for You</h3>
              <span className="text-sm text-gray-600">(Based on your searches and visits)</span>
          </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {recommendations.map((product, index) => (
                <ProductCard
                  key={product.id || product._id || index}
                  product={product}
                  index={index}
                  viewMode="grid"
                  onAddToCart={handleAddToCart}
                  onToggleWishlist={toggleWishlist}
                  onQuickView={handleQuickView}
                  isWishlisted={wishlist.includes(product._id || product.id)}
                  onProductView={trackProductView}
                />
              ))}
            </div>
          </div>
        )}

        {/* Simple Filters - Hidden by default on mobile */}
        <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 mb-8">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
            <div className="flex items-center space-x-3 sm:space-x-4 flex-1">
            <div className="flex-1 sm:flex-none sm:w-48">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-3 py-2 sm:px-4 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              >
                <option value="featured">Featured</option>
                <option value="newest">Newest</option>
                <option value="price_low">Price: Low to High</option>
                <option value="price_high">Price: High to Low</option>
                <option value="rating">Highest Rated</option>
                  <option value="sales">Best Selling</option>
              </select>
              </div>
              
              {/* Hide view mode toggles on mobile */}
              <div className="hidden sm:flex items-center space-x-2">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center justify-center px-4 py-2 sm:py-3 border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-colors min-h-[44px] font-medium text-sm sm:text-base"
            >
              <FunnelIcon className="h-5 w-5 mr-2" />
              <span>{isMobile && !showFilters ? 'Show Filters' : 'Filters'}</span>
              {showFilters ? <ChevronUpIcon className="h-5 w-5 ml-2" /> : <ChevronDownIcon className="h-5 w-5 ml-2" />}
            </button>
          </div>

          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-gray-200"
            >
              {/* Mobile: Show info message */}
              {isMobile && (
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800 flex items-center">
                    <FunnelIcon className="h-4 w-4 mr-2" />
                    Use filters below to refine your search
                  </p>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                <div>
                  <h3 className="font-medium text-gray-900 mb-3 flex items-center">
                    <TagIcon className="h-5 w-5 mr-2 text-orange-500" />
                    Categories
                  </h3>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {categories.map((category) => (
                      <label key={category.name} className="flex items-center p-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                        <input
                          type="radio"
                          name="category"
                          value={category.name}
                          checked={selectedCategory === category.name}
                          onChange={(e) => setSelectedCategory(e.target.value)}
                          className="mr-3 text-orange-500 focus:ring-orange-500"
                        />
                        <div className="flex items-center flex-1">
                          <span className="text-lg mr-2">{category.icon}</span>
                          <span className="text-sm text-gray-700 flex-1">{category.name}</span>
                          <div className="flex items-center space-x-1">
                            {category.hot && (
                              <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">HOT</span>
                            )}
                            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                              {category.count}
                        </span>
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-medium text-gray-900 mb-3 flex items-center">
                    <GlobeAltIcon className="h-5 w-5 mr-2 text-blue-500" />
                    Brands
                  </h3>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {brands.map((brand) => (
                      <label key={brand} className="flex items-center p-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                        <input
                          type="checkbox"
                          checked={selectedBrand === brand}
                          onChange={(e) => setSelectedBrand(e.target.checked ? brand : '')}
                          className="mr-3 text-blue-500 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700 flex-1">{brand}</span>
                        {brand === 'E-Gura Store' && (
                          <span className="bg-orange-500 text-white text-xs px-1.5 py-0.5 rounded-full">FEATURED</span>
                        )}
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-medium text-gray-900 mb-3 flex items-center">
                    <StarIcon className="h-5 w-5 mr-2 text-yellow-500" />
                    Customer Rating
                  </h3>
                  <div className="space-y-2">
                    {ratings.map((rating) => (
                      <label key={rating} className="flex items-center p-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                        <input
                          type="radio"
                          name="rating"
                          value={rating}
                          checked={selectedRating === rating}
                          onChange={(e) => setSelectedRating(e.target.value)}
                          className="mr-3 text-yellow-500 focus:ring-yellow-500"
                        />
                        <div className="flex items-center flex-1">
                          <div className="flex items-center mr-2">
                            {[...Array(5)].map((_, i) => (
                              <StarIcon
                                key={i}
                                className={`h-4 w-4 ${
                                  i < Math.floor(parseFloat(rating))
                                    ? 'text-yellow-400 fill-current'
                                    : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-sm text-gray-700">{rating} & up</span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-medium text-gray-900 mb-3 flex items-center">
                    <FireIcon className="h-5 w-5 mr-2 text-red-500" />
                    Discount
                  </h3>
                  <div className="space-y-2">
                    {discounts.map((discount) => (
                      <label key={discount} className="flex items-center p-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                        <input
                          type="radio"
                          name="discount"
                          value={discount}
                          checked={selectedDiscount === discount}
                          onChange={(e) => setSelectedDiscount(e.target.value)}
                          className="mr-3 text-red-500 focus:ring-red-500"
                        />
                        <div className="flex items-center flex-1">
                          <FireIcon className="h-4 w-4 mr-2 text-red-500" />
                          <span className="text-sm text-gray-700">{discount} off</span>
                          {discount === '70%+' && (
                            <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full ml-2">BEST DEAL</span>
                          )}
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-medium text-gray-900 mb-3">Price Range</h3>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <input
                        type="number"
                        placeholder="Min"
                        value={priceRange[0]}
                        onChange={(e) => setPriceRange([parseInt(e.target.value) || 0, priceRange[1]])}
                        className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                      />
                      <span className="text-gray-500">-</span>
                      <input
                        type="number"
                        placeholder="Max"
                        value={priceRange[1]}
                        onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value) || 100000])}
                        className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                      />
                    </div>
                    <div className="text-xs text-gray-500">
                      Range: {priceRange[0].toLocaleString()} - {priceRange[1].toLocaleString()} RWF
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium text-gray-900 mb-3">Sizes</h3>
                  <div className="grid grid-cols-3 gap-2">
                    {sizes.map((size) => (
                      <button
                        key={size}
                        onClick={() => setSelectedSize(selectedSize === size ? '' : size)}
                        className={`px-3 py-2 text-sm border rounded-lg transition-colors ${
                          selectedSize === size
                            ? 'bg-purple-600 text-white border-purple-600'
                            : 'bg-white text-gray-700 border-gray-300 hover:border-purple-300'
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-medium text-gray-900 mb-3">Colors</h3>
                  <div className="grid grid-cols-4 gap-2">
                    {colors.map((color) => (
                      <button
                        key={color}
                        onClick={() => setSelectedColor(selectedColor === color ? '' : color)}
                        className={`px-3 py-2 text-xs border rounded-lg transition-colors ${
                          selectedColor === color
                            ? 'bg-purple-600 text-white border-purple-600'
                            : 'bg-white text-gray-700 border-gray-300 hover:border-purple-300'
                        }`}
                      >
                        {color}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-medium text-gray-900 mb-3">Shipping</h3>
                  <div className="space-y-2">
                    {shippingOptions.map((option) => (
                      <label key={option} className="flex items-center">
                        <input
                          type="radio"
                          name="shipping"
                          value={option}
                          checked={selectedShipping === option}
                          onChange={(e) => setSelectedShipping(e.target.value)}
                          className="mr-2"
                        />
                        <span className="text-sm text-gray-700">
                          {option === 'Free Shipping' ? '🚚' : option === 'Express Delivery' ? '⚡' : '🏪'} {option}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Clear Filters Button */}
        {(selectedCategory || selectedBrand || selectedRating || selectedDiscount || selectedShipping || selectedSize || selectedColor) && (
          <div className="mt-4 flex justify-center">
            <button
              onClick={() => {
                setSelectedCategory('');
                setSelectedBrand('');
                setSelectedRating('');
                setSelectedDiscount('');
                setSelectedShipping('');
                setSelectedSize('');
                setSelectedColor('');
                setPriceRange([0, 100000]);
              }}
              className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Clear All Filters
            </button>
          </div>
        )}

        {/* Results Count */}
        <div className="flex justify-between items-center mb-6">
          <p className="text-gray-600">
            Showing {filteredProducts.length} of {products.length} products
          </p>
        </div>

        {/* Success Message */}
        {showSuccessMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50"
          >
            <div className="flex items-center">
              <CheckCircleIcon className="h-5 w-5 mr-2" />
              Item added to cart successfully!
            </div>
          </motion.div>
        )}

        {/* AliExpress-style Products Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <h2 className="text-2xl font-bold text-gray-900">All Products</h2>
              <span className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                {filteredProducts.length} items
              </span>
              <button
                onClick={fetchProducts}
                disabled={loading}
                className="flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors disabled:opacity-50"
                title="Refresh products"
              >
                <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                {loading ? 'Loading...' : 'Refresh'}
              </button>
              <span className="text-xs text-gray-500">
                Updated: {lastUpdated.toLocaleTimeString()}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="text-sm border border-gray-300 rounded-lg px-3 py-1 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              >
                <option value="featured">Featured</option>
                <option value="newest">Newest</option>
                <option value="price_low">Price: Low to High</option>
                <option value="price_high">Price: High to Low</option>
                <option value="rating">Highest Rated</option>
                <option value="sales">Best Selling</option>
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow-sm p-3 animate-pulse">
                <div className="bg-gray-200 h-48 rounded-lg mb-3"></div>
                <div className="space-y-2">
                  <div className="bg-gray-200 h-3 rounded"></div>
                  <div className="bg-gray-200 h-3 rounded w-2/3"></div>
                  <div className="bg-gray-200 h-4 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div id="products" className={viewMode === 'grid' ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4" : "space-y-4"}>
            {filteredProducts.map((product, index) => (
              <ProductCard
                key={product.id || product._id || index}
                product={product}
                index={index}
                viewMode={viewMode}
                onAddToCart={handleAddToCart}
                onToggleWishlist={toggleWishlist}
                onQuickView={handleQuickView}
                isWishlisted={wishlist.includes(product.id || product._id)}
                onProductView={trackProductView}
                            />
                          ))}
                        </div>
        )}

        {/* No Results */}
        {!loading && filteredProducts.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">🔍</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No products found</h3>
            <p className="text-gray-600">Try adjusting your search or filter criteria</p>
          </div>
        )}


      </div>

      {/* Quick View Modal */}
      {quickViewProduct && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Quick View</h3>
              <button
                onClick={() => setQuickViewProduct(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <img
                  src={quickViewProduct.mainImage}
                  alt={quickViewProduct.name}
                  className="w-full h-96 object-cover rounded-lg"
                />
              </div>

              <div className="space-y-4">
                <h2 className="text-xl font-bold text-gray-900">{quickViewProduct.name}</h2>
                <p className="text-gray-600">{quickViewProduct.description}</p>
                
                <div className="flex items-center">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <StarIcon
                        key={i}
                        className={`h-5 w-5 ${
                          i < Math.floor(quickViewProduct.averageRating || 0)
                            ? 'text-yellow-400 fill-current'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm text-gray-600 ml-2">
                    ({quickViewProduct.totalReviews || 0} reviews)
                  </span>
                </div>

                <div className="text-2xl font-bold text-gray-900">
                  {quickViewProduct.price?.toLocaleString()} RWF
                  {quickViewProduct.originalPrice && quickViewProduct.originalPrice > quickViewProduct.price && (
                    <span className="text-lg text-gray-500 line-through ml-2">
                      {quickViewProduct.originalPrice?.toLocaleString()} RWF
                    </span>
                  )}
                </div>

                {quickViewProduct.sizes && quickViewProduct.sizes.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Size</h4>
                    <div className="flex space-x-2">
                      {quickViewProduct.sizes.map((size) => (
                        <button
                          key={size}
                          onClick={() => setSelectedSize(size)}
                          className={`px-3 py-2 border rounded-lg transition-colors ${
                            selectedSize === size
                              ? 'bg-purple-600 text-white border-purple-600'
                              : 'bg-white text-gray-700 border-gray-300 hover:border-purple-300'
                          }`}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {quickViewProduct.colors && quickViewProduct.colors.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Color</h4>
                    <div className="flex space-x-2">
                      {quickViewProduct.colors.map((color) => (
                        <button
                          key={color}
                          onClick={() => setSelectedColor(color)}
                          className={`px-3 py-2 border rounded-lg transition-colors ${
                            selectedColor === color
                              ? 'bg-purple-600 text-white border-purple-600'
                              : 'bg-white text-gray-700 border-gray-300 hover:border-purple-300'
                          }`}
                        >
                          {color}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="text-sm text-gray-600">
                  Stock: {quickViewProduct.stockQuantity} available
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={() => handleAddToCart(quickViewProduct)}
                    disabled={quickViewProduct.stockQuantity <= 0}
                    className="flex-1 bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ShoppingBagIcon className="h-5 w-5 inline mr-2" />
                    Add to Cart
                  </button>
                  <button
                    onClick={() => toggleWishlist(quickViewProduct._id)}
                    className="px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    {wishlist.includes(quickViewProduct._id) ? (
                      <HeartIconSolid className="h-5 w-5 text-red-500" />
                    ) : (
                      <HeartIcon className="h-5 w-5 text-gray-600" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating Action Buttons (Mobile) */}
      <div className="fixed bottom-6 right-6 z-50 lg:hidden">
        <div className="flex flex-col space-y-3">
          {/* Cart Button */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="bg-orange-500 text-white p-4 rounded-full shadow-lg hover:bg-orange-600 transition-colors"
          >
            <ShoppingCartIcon className="h-6 w-6" />
          </motion.button>
          
          {/* Back to Top */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="bg-gray-800 text-white p-4 rounded-full shadow-lg hover:bg-gray-900 transition-colors"
          >
            <ChevronUpIcon className="h-6 w-6" />
          </motion.button>
        </div>
      </div>

      {/* Flash Deal Modal */}
      {selectedFlashDeal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`relative max-w-md w-full rounded-2xl shadow-2xl overflow-hidden ${selectedFlashDeal.color}`}
          >
            <div className="absolute top-4 right-4">
              <button
                onClick={() => setSelectedFlashDeal(null)}
                className="bg-white/20 backdrop-blur-sm p-2 rounded-full text-white hover:bg-white/30 transition-colors"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-8 text-white">
              <div className="flex items-center space-x-2 mb-4">
                <FireIcon className="h-6 w-6" />
                <span className="text-lg font-semibold">{selectedFlashDeal.title}</span>
              </div>
              <h2 className="text-3xl font-bold mb-2">{selectedFlashDeal.subtitle}</h2>
              <p className="text-lg mb-6 opacity-90">{selectedFlashDeal.products} products available</p>
              
              <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4 mb-6">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Time Left:</span>
                  <span className="text-xl font-bold">{selectedFlashDeal.timeLeft}</span>
                </div>
              </div>
              
              <button className="w-full bg-white text-gray-900 py-4 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
                Shop Now - Limited Time!
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
    </>
  );
};

<<<<<<< HEAD
export default Shop; 
=======
export default Shop; 
>>>>>>> 1a15362f9dae7bb17aa91f0abab9fb8ce9627742
