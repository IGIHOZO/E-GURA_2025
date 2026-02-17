import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import ProductMedia from '../components/ProductMedia';
import { 
  ShoppingBagIcon,
  StarIcon,
  HeartIcon,
  ArrowRightIcon,
  FireIcon,
  ClockIcon,
  TruckIcon,
  ShieldCheckIcon,
  TagIcon,
  BoltIcon
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid';
import { productsAPI } from '../services/api';
import AIAssistant from '../components/AIAssistant';
import { PLACEHOLDER_IMAGES, handleImageError } from '../utils/placeholderImage';

// Memoized product card component
const ProductCard = React.memo(({ product, onAddToCart, isWishlisted, onToggleWishlist }) => (
  <motion.div
    whileHover={{ y: -5 }}
    transition={{ duration: 0.2, ease: "easeOut" }}
    className="bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden group"
  >
    <div className="relative aspect-square overflow-hidden">
      <img
        src={product.mainImage || PLACEHOLDER_IMAGES.product}
        alt={product.name}
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        loading="lazy"
        onError={handleImageError}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      <button
        onClick={() => onToggleWishlist(product._id)}
        className="absolute top-4 right-4 p-2 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white transition-all duration-200 transform hover:scale-110"
      >
        {isWishlisted ? (
          <HeartIconSolid className="h-5 w-5 text-red-500" />
        ) : (
          <HeartIcon className="h-5 w-5 text-gray-600" />
        )}
      </button>
      
      {product.originalPrice && product.originalPrice > product.price && (
        <div className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold">
          -{Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}%
        </div>
      )}
    </div>
    
    <div className="p-6">
      <Link to={`/product/${product._id}`} className="block">
        <h3 className="font-bold text-gray-900 hover:text-orange-600 transition-colors line-clamp-2 mb-2">
          {product.name}
        </h3>
      </Link>
      
      <div className="flex items-center mb-3">
        <div className="flex items-center">
          {[...Array(5)].map((_, i) => (
            <StarIcon
              key={i}
              className={`h-4 w-4 ${
                i < Math.floor(product.rating || 0) ? 'text-yellow-400 fill-current' : 'text-gray-300'
              }`}
            />
          ))}
        </div>
        <span className="text-sm text-gray-500 ml-2">({product.reviews || 0})</span>
      </div>
      
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xl font-bold text-gray-900">
            RWF {product.price?.toLocaleString()}
          </span>
          {product.originalPrice && product.originalPrice > product.price && (
            <span className="text-sm text-gray-500 line-through ml-2">
              RWF {product.originalPrice.toLocaleString()}
            </span>
          )}
        </div>
        
        <button
          onClick={() => onAddToCart(product)}
          className="bg-orange-500 hover:bg-orange-600 text-white p-3 rounded-xl transition-all duration-200 transform hover:scale-105"
        >
          <ShoppingBagIcon className="h-5 w-5" />
        </button>
      </div>
    </div>
  </motion.div>
));

// Memoized section component
const ProductSection = React.memo(({ title, products, onAddToCart, wishlist, onToggleWishlist, icon: Icon, gradient }) => (
  <section className="mb-16">
    <div className="flex items-center justify-between mb-8">
      <div className="flex items-center space-x-3">
        <div className={`p-3 rounded-xl bg-gradient-to-r ${gradient}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
      </div>
      <Link
        to="/shop"
        className="flex items-center space-x-2 text-orange-600 hover:text-orange-700 font-medium"
      >
        <span>View All</span>
        <ArrowRightIcon className="h-4 w-4" />
      </Link>
    </div>
    
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
      {products.slice(0, 10).map(product => (
        <ProductCard
          key={product._id}
          product={product}
          onAddToCart={onAddToCart}
          isWishlisted={wishlist.includes(product._id)}
          onToggleWishlist={onToggleWishlist}
        />
      ))}
    </div>
  </section>
));

// Memoized countdown timer
const CountdownTimer = React.memo(({ timeLeft }) => (
  <div className="flex items-center space-x-4">
    <div className="text-center">
      <div className="bg-white/20 backdrop-blur-sm rounded-lg px-3 py-2">
        <span className="text-2xl font-bold">{String(timeLeft.hours).padStart(2, '0')}</span>
      </div>
      <span className="text-sm text-orange-100">Hours</span>
    </div>
    <div className="text-center">
      <div className="bg-white/20 backdrop-blur-sm rounded-lg px-3 py-2">
        <span className="text-2xl font-bold">{String(timeLeft.minutes).padStart(2, '0')}</span>
      </div>
      <span className="text-sm text-orange-100">Minutes</span>
    </div>
    <div className="text-center">
      <div className="bg-white/20 backdrop-blur-sm rounded-lg px-3 py-2">
        <span className="text-2xl font-bold">{String(timeLeft.seconds).padStart(2, '0')}</span>
      </div>
      <span className="text-sm text-orange-100">Seconds</span>
    </div>
  </div>
));

const HomeModernOptimized = () => {
  const [products, setProducts] = useState([]);
  const [flashDeals, setFlashDeals] = useState([]);
  const [trendingProducts, setTrendingProducts] = useState([]);
  const [bestDeals, setBestDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentBanner, setCurrentBanner] = useState(0);
  const [wishlist, setWishlist] = useState([]);
  const [timeLeft, setTimeLeft] = useState({
    hours: 23,
    minutes: 59,
    seconds: 59
  });

  // Memoized banners to prevent recreation on every render
  const banners = useMemo(() => [
    {
      id: 1,
      title: "Summer Sale 2024",
      subtitle: "Up to 70% Off Fashion & Electronics",
      image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&h=600&fit=crop",
      cta: "Shop Now",
      link: "/shop?category=Fashion"
    },
    {
      id: 2,
      title: "New Arrivals",
      subtitle: "Latest Trends in African Fashion",
      image: "https://images.unsplash.com/photo-1445205170230-053b83016050?w=1200&h=600&fit=crop",
      cta: "Explore",
      link: "/shop?category=Fashion"
    },
    {
      id: 3,
      title: "Electronics Deal",
      subtitle: "Smart Gadgets at Best Prices",
      image: "https://images.unsplash.com/photo-1498049794561-7780e7231661?w=1200&h=600&fit=crop",
      cta: "Shop Electronics",
      link: "/shop?category=Electronics"
    }
  ], []);

  // Memoized API calls to prevent unnecessary re-fetching
  const fetchProducts = useCallback(async () => {
    try {
      console.log('📦 Fetching products from database...');
      const response = await fetch('/api/products?limit=20');
      const data = await response.json();
      
      if (data.success && data.data && data.data.length > 0) {
        const fetchedProducts = data.data;
        console.log('✅ Using REAL DATABASE products:', fetchedProducts.length);
        setProducts(fetchedProducts);
      } else {
        console.error('❌ No products found in database!');
        setProducts([]);
      }
    } catch (error) {
      console.error('❌ Error fetching products:', error);
      setProducts([]);
    }
  }, []);

  const fetchFlashDeals = useCallback(async () => {
    try {
      const response = await fetch('/api/products/flash-deals?limit=10');
      const data = await response.json();
      
      if (data.success && data.data) {
        setFlashDeals(data.data);
      } else {
        // Use subset of products as flash deals
        setFlashDeals(products.slice(0, 10));
      }
    } catch (error) {
      console.error('Error fetching flash deals:', error);
      setFlashDeals(products.slice(0, 10));
    }
  }, [products]);

  const fetchTrendingProducts = useCallback(async () => {
    try {
      const response = await fetch('/api/products/trending?limit=10');
      const data = await response.json();
      
      if (data.success && data.data) {
        setTrendingProducts(data.data);
      } else {
        setTrendingProducts(products.slice(5, 15));
      }
    } catch (error) {
      console.error('Error fetching trending products:', error);
      setTrendingProducts(products.slice(5, 15));
    }
  }, [products]);

  const fetchBestDeals = useCallback(async () => {
    try {
      const response = await fetch('/api/products/best-deals?limit=10');
      const data = await response.json();
      
      if (data.success && data.data) {
        setBestDeals(data.data);
      } else {
        setBestDeals(products.slice(10, 20));
      }
    } catch (error) {
      console.error('Error fetching best deals:', error);
      setBestDeals(products.slice(10, 20));
    } finally {
      setLoading(false);
    }
  }, [products]);

  // Optimized countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        } else if (prev.hours > 0) {
          return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        }
        return { hours: 23, minutes: 59, seconds: 59 };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Auto-rotate banners
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBanner((prev) => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [banners.length]);

  // Optimized data fetching sequence
  useEffect(() => {
    const loadData = async () => {
      await fetchProducts();
    };
    loadData();
  }, [fetchProducts]);

  // Fetch other data after products are loaded
  useEffect(() => {
    if (products.length > 0) {
      fetchFlashDeals();
      fetchTrendingProducts();
      fetchBestDeals();
    }
  }, [products, fetchFlashDeals, fetchTrendingProducts, fetchBestDeals]);

  // Memoized handlers
  const handleAddToCart = useCallback((product) => {
    console.log('Adding to cart:', product.name);
    // Add to cart logic here
  }, []);

  const toggleWishlist = useCallback((productId) => {
    setWishlist(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading amazing products...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Banner */}
      <section className="relative h-[500px] md:h-[600px] overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={banners[currentBanner].image}
            alt={banners[currentBanner].title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/40" />
        </div>
        
        <div className="relative z-10 h-full flex items-center">
          <div className="max-w-7xl mx-auto px-4 text-white">
            <motion.div
              key={currentBanner}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="max-w-2xl"
            >
              <h1 className="text-4xl md:text-6xl font-bold mb-4">
                {banners[currentBanner].title}
              </h1>
              <p className="text-xl md:text-2xl mb-8 text-gray-200">
                {banners[currentBanner].subtitle}
              </p>
              <Link
                to={banners[currentBanner].link}
                className="inline-flex items-center space-x-2 bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 rounded-xl font-bold text-lg transition-all duration-200 transform hover:scale-105"
              >
                <span>{banners[currentBanner].cta}</span>
                <ArrowRightIcon className="h-5 w-5" />
              </Link>
            </motion.div>
          </div>
        </div>
        
        {/* Banner Indicators */}
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex space-x-2">
          {banners.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentBanner(index)}
              className={`w-3 h-3 rounded-full transition-all duration-200 ${
                index === currentBanner ? 'bg-white' : 'bg-white/50'
              }`}
            />
          ))}
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-16">
        {/* Flash Deals Section */}
        {flashDeals.length > 0 && (
          <section className="mb-16">
            <div className="bg-gradient-to-r from-red-500 to-orange-500 rounded-2xl p-8 text-white mb-8">
              <div className="flex flex-col md:flex-row items-center justify-between">
                <div className="flex items-center space-x-4 mb-4 md:mb-0">
                  <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                    <FireIcon className="h-8 w-8" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold">Flash Deals</h2>
                    <p className="text-orange-100">Limited time offers!</p>
                  </div>
                </div>
                <CountdownTimer timeLeft={timeLeft} />
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {flashDeals.slice(0, 10).map(product => (
                <ProductCard
                  key={product._id}
                  product={product}
                  onAddToCart={handleAddToCart}
                  isWishlisted={wishlist.includes(product._id)}
                  onToggleWishlist={toggleWishlist}
                />
              ))}
            </div>
          </section>
        )}

        {/* Trending Products */}
        {trendingProducts.length > 0 && (
          <ProductSection
            title="Trending Now"
            products={trendingProducts}
            onAddToCart={handleAddToCart}
            wishlist={wishlist}
            onToggleWishlist={toggleWishlist}
            icon={BoltIcon}
            gradient="from-purple-500 to-pink-500"
          />
        )}

        {/* Best Deals */}
        {bestDeals.length > 0 && (
          <ProductSection
            title="Best Deals"
            products={bestDeals}
            onAddToCart={handleAddToCart}
            wishlist={wishlist}
            onToggleWishlist={toggleWishlist}
            icon={TagIcon}
            gradient="from-green-500 to-blue-500"
          />
        )}

        {/* Features Section */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
          <div className="text-center p-8 bg-white rounded-2xl shadow-sm">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <TruckIcon className="h-8 w-8 text-orange-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Free Delivery</h3>
            <p className="text-gray-600">Free delivery in Kigali for orders over RWF 50,000</p>
          </div>
          
          <div className="text-center p-8 bg-white rounded-2xl shadow-sm">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <ShieldCheckIcon className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Secure Payment</h3>
            <p className="text-gray-600">Safe and secure mobile money payments</p>
          </div>
          
          <div className="text-center p-8 bg-white rounded-2xl shadow-sm">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <ClockIcon className="h-8 w-8 text-blue-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">24/7 Support</h3>
            <p className="text-gray-600">Round the clock customer support</p>
          </div>
        </section>
      </div>

      {/* AI Assistant */}
      <AIAssistant />
    </div>
  );
};

export default HomeModernOptimized;
