import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import SEO from '../components/SEO';
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
import { usePersonalization } from '../hooks/usePersonalization';
import { ProductGridSkeleton } from '../components/ProductCardSkeleton';

const HomeModern = () => {
  const [products, setProducts] = useState([]);
  const [flashDeals, setFlashDeals] = useState([]);
  const [trendingProducts, setTrendingProducts] = useState([]);
  const [bestDeals, setBestDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { getRecommendations, personalizedProducts } = usePersonalization();
  const [currentBanner, setCurrentBanner] = useState(0);
  // Calculate time left until midnight (real countdown)
  const getTimeUntilMidnight = () => {
    const now = new Date();
    const midnight = new Date();
    midnight.setHours(24, 0, 0, 0);
    const diff = midnight - now;
    return {
      hours: Math.floor(diff / (1000 * 60 * 60)),
      minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
      seconds: Math.floor((diff % (1000 * 60)) / 1000)
    };
  };
  
  const [timeLeft, setTimeLeft] = useState(getTimeUntilMidnight());

  const loadAllData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await Promise.all([
        fetchHomeFeed(),
        getRecommendations(8)
      ]);
    } catch (err) {
      console.error('Error loading homepage data:', err);
      setError('Unable to load products. Please try again.');
    }
  }, []);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // Countdown timer - updates every second with real time until midnight
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(getTimeUntilMidnight());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Auto-rotate banners
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBanner((prev) => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchHomeFeed = async () => {
    try {
      const response = await fetch('/api/products/home-feed?featuredLimit=8&flashLimit=6&trendingLimit=8&bestDealsLimit=6&latestLimit=20');
      const data = await response.json();
      
      if (data.success && data.data) {
        setProducts(data.data.latest || []);
        setFlashDeals(data.data.flashDeals || []);
        setTrendingProducts(data.data.trending || []);
        setBestDeals(data.data.bestDeals || []);
      } else {
        setProducts([]);
        setFlashDeals([]);
        setTrendingProducts([]);
        setBestDeals([]);
      }
    } catch (error) {
      console.error('Error fetching home feed:', error);
      setProducts([]);
      setFlashDeals([]);
      setTrendingProducts([]);
      setBestDeals([]);
    } finally {
      setLoading(false);
    }
  };


  const banners = [
    {
      id: 1,
      title: "Super Deals of the Day",
      subtitle: "Up to 70% OFF on Electronics",
      image: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1200&h=400&fit=crop",
      color: "from-purple-600 to-pink-600"
    },
    {
      id: 2,
      title: "New Arrivals",
      subtitle: "Latest Fashion Trends 2025",
      image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&h=400&fit=crop",
      color: "from-blue-600 to-cyan-600"
    },
    {
      id: 3,
      title: "Flash Sale",
      subtitle: "Limited Time Offers",
      image: "https://images.unsplash.com/photo-1607082349566-187342175e2f?w=1200&h=400&fit=crop",
      color: "from-orange-600 to-red-600"
    }
  ];

  const categories = [
    { name: 'Electronics', slug: 'electronics', icon: '💻', color: 'bg-blue-600' },
    { name: "Women's Fashion", slug: 'womens-fashion', icon: '👗', color: 'bg-pink-500' },
    { name: "Men's Fashion", slug: 'mens-fashion', icon: '👔', color: 'bg-blue-500' },
    { name: 'Kids & Baby', slug: 'kids-baby', icon: '👶', color: 'bg-yellow-400' },
    { name: 'Home & Living', slug: 'home-living', icon: '🏠', color: 'bg-green-500' },
    { name: 'Beauty', slug: 'beauty-personal-care', icon: '💄', color: 'bg-purple-500' },
    { name: 'Sports & Outdoor', slug: 'sports-outdoor', icon: '⚽', color: 'bg-orange-500' },
    { name: 'Shoes & Footwear', slug: 'shoes-footwear', icon: '👟', color: 'bg-indigo-500' },
    { name: 'Jewelry & Watches', slug: 'jewelry-watches', icon: '💍', color: 'bg-yellow-600' },
    { name: 'Bags & Accessories', slug: 'bags-accessories', icon: '👜', color: 'bg-teal-500' },
    { name: 'Books & Media', slug: 'books-media', icon: '📚', color: 'bg-red-500' },
    { name: 'Toys & Games', slug: 'toys-games', icon: '🎮', color: 'bg-cyan-500' },
    { name: 'Health & Wellness', slug: 'health-wellness', icon: '💊', color: 'bg-emerald-500' },
    { name: 'Automotive', slug: 'automotive', icon: '🚗', color: 'bg-gray-700' },
    { name: 'Pet Supplies', slug: 'pet-supplies', icon: '🐾', color: 'bg-amber-500' },
    { name: 'Office & Stationery', slug: 'office-stationery', icon: '📝', color: 'bg-slate-600' }
  ];

  const recommendedProducts = products.slice(0, 12);
  const justForYou = products.slice(12, 36); // 24 more products

  return (
    <>
      <SEO
        title="E-Gura Store - Rwanda's #1 Online Shopping Platform | Kigali"
        description="Rwanda's #1 online shopping platform. Buy electronics, fashion, home appliances in Kigali. Free delivery in Kimironko, Remera, Nyarutarama, Kicukiro, Gasabo. MTN MoMo & Airtel Money. Order now!"
        keywords="online shopping Rwanda, buy online Kigali, E-Gura store, Kigali online shop, Rwanda e-commerce, mobile money shopping, electronics Kigali, fashion Rwanda, home appliances Kigali, Kimironko shopping, Remera online store, Nyarutarama delivery, Gikondo shopping, Kicukiro online, Gasabo e-commerce, free delivery Kigali, MTN MoMo Rwanda, Airtel Money shopping, Kacyiru online, Nyamirambo shopping"
        canonicalUrl="https://egura.rw/"
        ogImage="https://egura.rw/og-image.jpg"
      />
      <div className="min-h-screen bg-gray-50">
      {/* Hero Banner Carousel */}
      <section className="relative h-[400px] bg-gradient-to-r from-purple-600 to-pink-600 overflow-hidden">
        {banners.map((banner, index) => (
          <motion.div
            key={banner.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: currentBanner === index ? 1 : 0 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0"
            style={{
              backgroundImage: `url(${banner.image})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }}
          >
            <div className={`absolute inset-0 bg-gradient-to-r ${banner.color} opacity-80`}></div>
            <div className="relative h-full max-w-7xl mx-auto px-4 flex items-center">
              <div className="text-white max-w-2xl">
                <motion.h1
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="text-5xl md:text-6xl font-black mb-4"
                >
                  {banner.title}
                </motion.h1>
                <motion.p
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="text-xl md:text-2xl mb-8"
                >
                  {banner.subtitle}
                </motion.p>
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  <Link
                    to="/shop"
                    className="inline-flex items-center px-8 py-4 bg-white text-gray-900 font-bold rounded-lg hover:bg-gray-100 transition-all transform hover:scale-105 shadow-xl"
                  >
                    Shop Now
                    <ArrowRightIcon className="ml-2 h-5 w-5" />
                  </Link>
                </motion.div>
              </div>
            </div>
          </motion.div>
        ))}
        
        {/* Banner Indicators */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2 z-10">
          {banners.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentBanner(index)}
              className={`w-2 h-2 rounded-full transition-all ${
                currentBanner === index ? 'bg-white w-8' : 'bg-white/50'
              }`}
            />
          ))}
        </div>
      </section>

      {/* Quick Categories */}
      <section className="bg-white py-8 shadow-sm">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-4 md:grid-cols-8 gap-4">
            {categories.map((cat, index) => (
              <Link
                key={index}
                to={cat.slug ? `/category/${cat.slug}` : '/shop'}
                className="group text-center"
              >
                <div className={`${cat.color} w-16 h-16 mx-auto rounded-2xl flex items-center justify-center text-3xl mb-2 transform group-hover:scale-110 transition-transform shadow-lg`}>
                  {cat.icon}
                </div>
                <p className="text-xs font-semibold text-gray-900">{cat.name}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Flash Deals */}
      <section className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-gradient-to-r from-red-500 to-orange-500 rounded-3xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="bg-white rounded-full p-3">
                <FireIcon className="h-8 w-8 text-red-500" />
              </div>
              <div>
                <h2 className="text-3xl font-black text-white">Flash Deals</h2>
                <p className="text-white/90">Limited time offers</p>
              </div>
            </div>
            
            {/* Countdown Timer */}
            <div className="flex items-center space-x-2 bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2">
              <ClockIcon className="h-5 w-5 text-white" />
              <div className="flex space-x-1 text-white font-bold text-xl">
                <div className="bg-white/30 rounded px-2">{String(timeLeft.hours).padStart(2, '0')}</div>
                <span>:</span>
                <div className="bg-white/30 rounded px-2">{String(timeLeft.minutes).padStart(2, '0')}</div>
                <span>:</span>
                <div className="bg-white/30 rounded px-2">{String(timeLeft.seconds).padStart(2, '0')}</div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {loading ? (
              <ProductGridSkeleton count={6} columns="" variant="flash" />
            ) : flashDeals.length === 0 ? (
              <div className="col-span-full text-center py-12 text-white">
                <p className="text-xl mb-2">📦 No Flash Deals</p>
                <p className="text-sm opacity-75">Check back soon for amazing deals!</p>
              </div>
            ) : (
              flashDeals.map((product, index) => (
                <Link
                  key={product._id || index}
                  to={`/product/${product._id || product.id}`}
                  className="bg-white rounded-2xl overflow-hidden hover:shadow-2xl transition-all transform hover:-translate-y-2 group opacity-0 animate-fade-in-up"
                  style={{ animationDelay: `${index * 80}ms`, animationFillMode: 'forwards' }}
                >
                  <div className="relative overflow-hidden">
                    <ProductMedia
                      src={product.mainImage || product.image}
                      alt={product.name}
                      className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-300"
                      playOnHover={true}
                      generateThumbnail={true}
                      muted={true}
                      loop={true}
                    />
                    {product.discountPercentage > 0 && (
                      <div className="absolute top-3 left-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-sm font-bold px-3 py-1.5 rounded-full">
                        -{product.discountPercentage}% OFF
                      </div>
                    )}
                    <button 
                      onClick={(e) => {
                        e.preventDefault();
                        alert('Added to wishlist!');
                      }}
                      className="absolute top-3 right-3 bg-white rounded-full p-2 shadow-lg hover:bg-red-50 transition-colors"
                    >
                      <HeartIcon className="h-5 w-5 text-gray-600 hover:text-red-500" />
                    </button>
                  </div>
                  
                  <div className="p-4">
                    <h3 className="text-sm font-bold text-gray-900 mb-2 line-clamp-2 h-10">
                      {product.name}
                    </h3>
                    
                    {(product.averageRating || product.totalReviews) && (
                      <div className="flex items-center mb-3">
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <StarIcon
                              key={i}
                              className={`h-4 w-4 ${
                                i < Math.floor(product.averageRating || 0) ? 'text-yellow-400 fill-current' : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-xs text-gray-500 ml-2">
                          {parseFloat(product.averageRating || 0).toFixed(1)} ({product.totalReviews || 0})
                        </span>
                      </div>
                    )}

                    <div className="mb-3">
                      <div className="flex items-baseline space-x-2">
                        <span className="text-2xl font-black text-green-600">
                          {Math.floor((product.price || 0) * 0.7).toLocaleString()}
                        </span>
                        <span className="text-sm text-gray-900">RWF</span>
                      </div>
                      <div className="text-sm text-gray-400 line-through">
                        {(product.price || 0).toLocaleString()} RWF
                      </div>
                    </div>

                    {product.originalPrice && product.price && (
                      <div className="flex items-center justify-between text-xs">
                        <span className="bg-green-50 text-green-600 px-2 py-1 rounded-full font-bold">
                          Save {(product.originalPrice - product.price).toLocaleString()} RWF
                        </span>
                      </div>
                    )}
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Promotional Banners */}
      <section className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl p-6 text-white relative overflow-hidden">
            <div className="relative z-10">
              <TruckIcon className="h-12 w-12 mb-3" />
              <h3 className="text-2xl font-bold mb-2">Free Shipping</h3>
              <p className="text-white/90">On orders over 50,000 RWF</p>
            </div>
            <div className="absolute -right-8 -bottom-8 text-white/10 text-9xl">🚚</div>
          </div>

          <div className="bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl p-6 text-white relative overflow-hidden">
            <div className="relative z-10">
              <ShieldCheckIcon className="h-12 w-12 mb-3" />
              <h3 className="text-2xl font-bold mb-2">Buyer Protection</h3>
              <p className="text-white/90">100% secure payments</p>
            </div>
            <div className="absolute -right-8 -bottom-8 text-white/10 text-9xl">🛡️</div>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl p-6 text-white relative overflow-hidden">
            <div className="relative z-10">
              <BoltIcon className="h-12 w-12 mb-3" />
              <h3 className="text-2xl font-bold mb-2">AI Negotiation</h3>
              <p className="text-white/90">Get the best deals</p>
            </div>
            <div className="absolute -right-8 -bottom-8 text-white/10 text-9xl">⚡</div>
          </div>
        </div>
      </section>

      {/* Recommended Products */}
      <section className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-3xl font-black text-gray-900">Recommended For You</h2>
          <Link to="/shop" className="text-orange-600 font-semibold hover:text-orange-700 flex items-center">
            View All
            <ArrowRightIcon className="ml-1 h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {loading ? (
            <ProductGridSkeleton count={12} columns="" />
          ) : error ? (
            <div className="col-span-full text-center py-16">
              <div className="text-gray-400 text-5xl mb-4">😞</div>
              <p className="text-gray-600 mb-4">{error}</p>
              <button
                onClick={loadAllData}
                className="px-6 py-3 bg-orange-500 text-white font-semibold rounded-lg hover:bg-orange-600 transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : recommendedProducts.map((product, index) => (
            <Link
              key={product._id || index}
              to={`/product/${product._id || product.id}`}
              className="bg-white rounded-xl overflow-hidden hover:shadow-xl transition-all border border-gray-100 opacity-0 animate-fade-in-up"
              style={{ animationDelay: `${index * 60}ms`, animationFillMode: 'forwards' }}
            >
              <div className="relative">
                <ProductMedia
                  src={product.mainImage || product.image}
                  alt={product.name}
                  className="w-full h-40 object-cover"
                  playOnHover={true}
                  generateThumbnail={true}
                  muted={true}
                  loop={true}
                />
                <button className="absolute top-2 right-2 bg-white rounded-full p-1.5 shadow-md hover:bg-gray-100">
                  <HeartIcon className="h-4 w-4 text-gray-600" />
                </button>
              </div>
              
              <div className="p-3">
                <h3 className="text-sm text-gray-900 mb-2 line-clamp-2 h-10">
                  {product.name}
                </h3>
                
                <div className="flex items-center mb-2">
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <StarIcon
                        key={i}
                        className={`h-3 w-3 ${
                          i < 4 ? 'text-yellow-400 fill-current' : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex items-baseline space-x-1 mb-2">
                  <span className="text-lg font-bold text-red-600">
                    {(product.price || 0).toLocaleString()}
                  </span>
                  <span className="text-xs text-gray-900">RWF</span>
                </div>

                {product.discountPercentage > 0 && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="bg-red-50 text-red-600 px-2 py-0.5 rounded">
                      -{product.discountPercentage}%
                    </span>
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Error banner if load failed */}
      {error && !loading && (
        <section className="max-w-7xl mx-auto px-4 py-4">
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
            <p className="text-red-600 font-medium mb-3">{error}</p>
            <button
              onClick={loadAllData}
              className="px-5 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm font-semibold"
            >
              Retry Loading
            </button>
          </div>
        </section>
      )}

      {/* Mega Sale Banner */}
      <section className="max-w-7xl mx-auto px-4 py-8">
        <div className="relative bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 rounded-3xl overflow-hidden h-64">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yIDEuNS0zLjUgMy41LTMuNXMzLjUgMS41IDMuNSAzLjUtMS41IDMuNS0zLjUgMy41UzM2IDM2IDM2IDM0em0wLTMwYzAtMiAxLjUtMy41IDMuNS0zLjVTNDMgMiA0MyA0cy0xLjUgMy41LTMuNSAzLjVTMzYgNiAzNiA0eiIvPjwvZz48L2c+PC9zdmc+')] opacity-20"></div>
          
          <div className="relative h-full flex items-center justify-center text-center">
            <div>
              <div className="text-6xl font-black text-white mb-4">
                MEGA SALE
              </div>
              <div className="text-2xl text-white mb-6">
                Up to 70% OFF Everything
              </div>
              <Link
                to="/shop"
                className="inline-flex items-center px-8 py-4 bg-white text-gray-900 font-bold rounded-full hover:bg-gray-100 transition-all transform hover:scale-105 shadow-xl"
              >
                <TagIcon className="h-5 w-5 mr-2" />
                Shop Deals
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Just For You - More Products */}
      <section className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-3xl font-black text-gray-900">Just For You</h2>
          <Link to="/shop" className="text-orange-600 font-semibold hover:text-orange-700 flex items-center">
            View All
            <ArrowRightIcon className="ml-1 h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {loading ? (
            <ProductGridSkeleton count={12} columns="" />
          ) : (justForYou.length > 0 ? justForYou : products).slice(0, 24).map((product, index) => (
            <Link
              key={product._id || index}
              to={`/product/${product._id || product.id}`}
              className="bg-white rounded-xl overflow-hidden hover:shadow-xl transition-all border border-gray-100 opacity-0 animate-fade-in-up"
              style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'forwards' }}
            >
              <div className="relative">
                <ProductMedia
                  src={product.mainImage || product.image}
                  alt={product.name}
                  className="w-full h-40 object-cover"
                  playOnHover={true}
                  generateThumbnail={true}
                  muted={true}
                  loop={true}
                />
                <button className="absolute top-2 right-2 bg-white rounded-full p-1.5 shadow-md hover:bg-gray-100">
                  <HeartIcon className="h-4 w-4 text-gray-600" />
                </button>
                {product.isFeatured && (
                  <div className="absolute top-2 left-2 bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                    Featured
                  </div>
                )}
              </div>
              
              <div className="p-3">
                <h3 className="text-sm text-gray-900 mb-2 line-clamp-2 h-10">
                  {product.name}
                </h3>
                
                <div className="flex items-center mb-2">
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <StarIcon
                        key={i}
                        className={`h-3 w-3 ${
                          i < Math.floor(parseFloat(product.averageRating) || 0) ? 'text-yellow-400 fill-current' : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  {product.reviewCount > 0 && (
                    <span className="text-xs text-gray-500 ml-1">
                      ({product.reviewCount})
                    </span>
                  )}
                </div>

                <div className="flex items-baseline space-x-1 mb-2">
                  <span className="text-lg font-bold text-red-600">
                    {(product.price || 0).toLocaleString()}
                  </span>
                  <span className="text-xs text-gray-900">RWF</span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-green-600 font-medium">Free shipping</span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Load More Button */}
        <div className="text-center mt-8">
          <Link
            to="/shop"
            className="inline-flex items-center px-8 py-4 bg-gray-100 text-gray-900 font-bold rounded-lg hover:bg-gray-200 transition-all"
          >
            Load More Products
            <ArrowRightIcon className="ml-2 h-5 w-5" />
          </Link>
        </div>
      </section>

      {/* AI Assistant */}
      <AIAssistant />
    </div>
    </>
  );
};

export default HomeModern;
