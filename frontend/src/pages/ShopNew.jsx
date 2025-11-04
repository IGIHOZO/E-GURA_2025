import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  SparklesIcon,
  TruckIcon,
  ShieldCheckIcon,
  HeartIcon,
  ShoppingCartIcon
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid';
import SEOHead from '../components/SEOHead';
import { useCart } from '../context/CartContext';
import ProductCard from '../components/ProductCardResponsive';
import IntelligentSearch from '../components/IntelligentSearch';
import cacheService from '../services/cacheService';
import axios from 'axios';

const ShopNew = () => {
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [wishlist, setWishlist] = useState([]);
  const [quickViewProduct, setQuickViewProduct] = useState(null);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [viewMode, setViewMode] = useState('grid');
  const [recommendations, setRecommendations] = useState([]);
  const [trending, setTrending] = useState([]);
  const [flashDeals, setFlashDeals] = useState([]);
  const [bestDeals, setBestDeals] = useState([]);
  const [searchInfo, setSearchInfo] = useState({ query: '', filters: {}, sortBy: 'relevance' });

  const { addToCart } = useCart();

  // Generate unique device ID
  const getDeviceId = () => {
    let deviceId = localStorage.getItem('deviceId');
    if (!deviceId) {
      deviceId = `device-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('deviceId', deviceId);
      console.log('🔑 New device ID created:', deviceId);
    }
    return deviceId;
  };

  // Load initial products and recommendations
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      // Check cache first for instant loading
      const cachedProducts = cacheService.get('shop_products');
      if (cachedProducts) {
        console.log('⚡ Loading from cache - INSTANT!');
        setFilteredProducts(cachedProducts);
        setLoading(false);
        
        // Refresh in background
        fetchAndCacheProducts();
        return;
      }
      
      // No cache, fetch normally
      await fetchAndCacheProducts();
    } catch (error) {
      console.error('Error loading data:', error);
      setLoading(false);
    }
  };

  const fetchAndCacheProducts = async () => {
    try {
      setLoading(true);
      
      // Load all products using intelligent search
      const response = await axios.get('/api/intelligent-search', {
        params: { page: 1, limit: 50, sortBy: 'featured' }
      });

      if (response.data.success) {
        const products = response.data.data || [];
        setFilteredProducts(products);
        
        // Cache products for instant loading next time
        cacheService.set('shop_products', products, 3 * 60 * 1000); // 3 minutes
        
        // Batch cache individual products
        cacheService.batchSet(products, (p) => `product_${p.id}`, 10 * 60 * 1000);
        
        console.log('💾 Cached', products.length, 'products');
      }

      // Load flash deals
      console.log('🔥 Fetching flash deals from database...');
      const flashResponse = await axios.get('/api/products/flash-deals', {
        params: { limit: 6 }
      });

      if (flashResponse.data.success && flashResponse.data.data?.length > 0) {
        const flashData = flashResponse.data.data;
        console.log('🔥 Flash deals images from DATABASE:', flashData.map(p => p.mainImage));
        setFlashDeals(flashData);
        cacheService.set('flash_deals', flashData, 2 * 60 * 1000);
        console.log('✅ Flash deals: REAL DATABASE images:', flashData.length);
      } else {
        console.error('❌ No flash deals in database');
        setFlashDeals([]);
      }

      // Load trending products based on REAL activity
      console.log('🔥 Fetching trending from database...');
      const trendingResponse = await axios.get('/api/products/trending', {
        params: { limit: 8 }
      });

      if (trendingResponse.data.success && trendingResponse.data.data?.length > 0) {
        const trendingData = trendingResponse.data.data;
        console.log('🔥 Trending images from DATABASE:', trendingData.map(p => p.mainImage));
        setTrending(trendingData);
        cacheService.set('trending_products', trendingData, 2 * 60 * 1000);
        console.log('✅ Trending: REAL DATABASE images:', trendingData.length);
      } else {
        console.error('❌ No trending in database');
        setTrending([]);
      }

      // Load best deals
      console.log('💎 Fetching best deals from database...');
      const bestDealsResponse = await axios.get('/api/products/best-deals', {
        params: { limit: 8 }
      });

      if (bestDealsResponse.data.success && bestDealsResponse.data.data?.length > 0) {
        const bestDealsData = bestDealsResponse.data.data;
        console.log('💎 Best deals images from DATABASE:', bestDealsData.map(p => p.mainImage));
        setBestDeals(bestDealsData);
        cacheService.set('best_deals', bestDealsData, 2 * 60 * 1000);
        console.log('✅ Best deals: REAL DATABASE images:', bestDealsData.length);
      } else {
        console.error('❌ No best deals in database');
        setBestDeals([]);
      }

      // Load personalized recommendations for THIS device
      const deviceId = getDeviceId();
      const recoResponse = await axios.get(`http://localhost:5000/api/intelligent-search/recommendations/${deviceId}`, {
        params: { limit: 8 }
      });

      if (recoResponse.data.success) {
        const recoData = recoResponse.data.data || [];
        setRecommendations(recoData);
        cacheService.set(`recommendations_${deviceId}`, recoData, 5 * 60 * 1000); // 5 minutes
        console.log('🎯 Personalized recommendations loaded for device:', deviceId, recoData.length);
      }

    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle search results from IntelligentSearch component
  const handleSearchResults = (results) => {
    setFilteredProducts(results);
  };

  // Handle filter change from IntelligentSearch component
  const handleFilterChange = (info) => {
    setSearchInfo(info);
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
    trackProductView(product);
  };

  const trackProductView = (product) => {
    const deviceId = getDeviceId();
    axios.post('/api/intelligent-search/track', {
      userId: deviceId,
      eventType: 'view',
      productId: product.id || product._id,
      product: {
        name: product.name,
        category: product.category,
        brand: product.brand,
        price: product.price
      }
    }).then(() => {
      console.log('✅ Product view tracked for device:', deviceId, product.name);
    }).catch(err => console.error('❌ Track error:', err));
  };

  return (
    <>
      <SEOHead 
        title="Shop Fashion Online - AI-Powered Search | E-Gura Store"
        description="Discover products with our advanced AI search. Get personalized recommendations and find exactly what you're looking for with intelligent filtering and sorting."
        keywords="AI shopping, intelligent search, fashion Rwanda, online shopping, product recommendations, smart filters"
        pageType="shop"
      />
      
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b sticky top-0 z-40 shadow-sm">
          <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-3 sm:py-4">
            <div className="flex items-center justify-between gap-2 sm:gap-4">
              <div className="flex items-center space-x-2 sm:space-x-4 md:space-x-6 flex-1 min-w-0">
                <h1 className="text-lg sm:text-xl md:text-2xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent truncate">
                  E-Gura Store
                </h1>
                <div className="hidden lg:flex items-center space-x-4 xl:space-x-6 flex-shrink-0">
                  <span className="text-xs xl:text-sm text-gray-600 flex items-center gap-1">
                    <TruckIcon className="h-3 xl:h-4 w-3 xl:w-4" /> Free Shipping
                  </span>
                  <span className="text-sm text-gray-400">|</span>
                  <span className="text-xs xl:text-sm text-gray-600 flex items-center gap-1">
                    <ShieldCheckIcon className="h-3 xl:h-4 w-3 xl:w-4" /> Secure Payment
                  </span>
                  <span className="text-sm text-gray-400">|</span>
                  <span className="text-xs xl:text-sm text-gray-600 flex items-center gap-1">
                    <SparklesIcon className="h-3 xl:h-4 w-3 xl:w-4" /> AI-Powered
                  </span>
                </div>
              </div>
              
              <div className="flex items-center space-x-2 sm:space-x-3 flex-shrink-0">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg transition-all ${
                    viewMode === 'grid' ? 'bg-purple-100 text-purple-600' : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg transition-all ${
                    viewMode === 'list' ? 'bg-purple-100 text-purple-600' : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Search Section */}
        <section className="py-8 bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-6">
              <h2 className="text-4xl font-bold text-gray-900 mb-2 flex items-center justify-center gap-2">
                <SparklesIcon className="h-8 w-8 text-purple-600" />
                AI-Powered Product Search
              </h2>
              <p className="text-gray-600 text-lg">
                Find products with intelligent recommendations and advanced filters
              </p>
            </div>
            
            <div className="max-w-4xl mx-auto">
              <IntelligentSearch
                onSearchResults={handleSearchResults}
                onFilterChange={handleFilterChange}
              />
            </div>
          </div>
        </section>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Trending Products - Only show when NOT searching */}
          {!searchInfo.query && trending.length > 0 && (
            <section className="mb-12">
              <div className="flex items-center space-x-2 mb-6">
                <span className="text-3xl">🔥</span>
                <h3 className="text-2xl font-bold text-gray-900">Trending Now</h3>
                <span className="text-sm text-gray-500">(Most viewed & ordered)</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 sm:gap-4 md:gap-5 lg:gap-6">
                {trending.map((product, index) => (
                  <ProductCard
                    key={product._id || product.id || index}
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
            </section>
          )}

          {/* Personalized Recommendations - Only show when NOT searching */}
          {!searchInfo.query && recommendations.length > 0 && (
            <section className="mb-12">
              <div className="flex items-center space-x-2 mb-6">
                <SparklesIcon className="h-6 w-6 text-purple-500" />
                <h3 className="text-2xl font-bold text-gray-900">Recommended for You</h3>
                <span className="text-sm text-gray-500">(Based on your activity)</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 sm:gap-4 md:gap-5 lg:gap-6">
                {recommendations.map((product, index) => (
                  <ProductCard
                    key={product._id || product.id || index}
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
            </section>
          )}

          {/* Search Results */}
          <section>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-2xl font-bold text-gray-900">
                  {searchInfo.query ? `Results for "${searchInfo.query}"` : 'All Products'}
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Showing {filteredProducts.length} products
                  {searchInfo.sortBy && searchInfo.sortBy !== 'relevance' && (
                    <span className="ml-2">• Sorted by {searchInfo.sortBy}</span>
                  )}
                </p>
              </div>
            </div>

            {loading ? (
              <div className="text-center py-20">
                <div className="inline-flex flex-col items-center">
                  <svg className="animate-spin h-12 w-12 text-purple-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <p className="mt-4 text-lg text-gray-600 font-medium">Loading products...</p>
                </div>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-20">
                <SparklesIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No products found</h3>
                <p className="text-gray-600">Try adjusting your search or filters</p>
              </div>
            ) : (
              <div className={`grid ${
                viewMode === 'grid'
                  ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 sm:gap-4 md:gap-5 lg:gap-6'
                  : 'grid-cols-1 gap-3 sm:gap-4 md:gap-5 lg:gap-6'
              }`}>
                {filteredProducts.map((product, index) => (
                  <ProductCard
                    key={product._id || product.id || index}
                    product={product}
                    index={index}
                    viewMode={viewMode}
                    onAddToCart={handleAddToCart}
                    onToggleWishlist={toggleWishlist}
                    onQuickView={handleQuickView}
                    isWishlisted={wishlist.includes(product._id || product.id)}
                    onProductView={trackProductView}
                  />
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Success Message */}
        {showSuccessMessage && (
          <div className="fixed bottom-4 right-4 z-50 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center space-x-2">
            <ShoppingCartIcon className="h-5 w-5" />
            <span className="font-medium">Added to cart!</span>
          </div>
        )}
      </div>
    </>
  );
};

export default ShopNew;
