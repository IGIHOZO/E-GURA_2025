import React, { useState, useEffect } from 'react';
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

const HomeModern = () => {
  const [products, setProducts] = useState([]);
  const [flashDeals, setFlashDeals] = useState([]);
  const [trendingProducts, setTrendingProducts] = useState([]);
  const [bestDeals, setBestDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentBanner, setCurrentBanner] = useState(0);
  const [timeLeft, setTimeLeft] = useState({
    hours: 23,
    minutes: 59,
    seconds: 59
  });

  useEffect(() => {
    // Fetch everything from database independently
    fetchProducts();
    fetchFlashDeals();
    fetchTrendingProducts();
    fetchBestDeals();
    
    // Countdown timer
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
  }, []);

  const fetchProducts = async () => {
    try {
      console.log('📦 Fetching products from database...');
      // Fetch all active products, not just featured
      const response = await fetch('/api/products?limit=50');
      const data = await response.json();
      console.log('📦 Products response:', data);
      
      if (data.success && data.data && data.data.length > 0) {
        const fetchedProducts = data.data;
        console.log('📦 Products count:', fetchedProducts.length);
        console.log('📦 First product from DATABASE:', fetchedProducts[0]);
        console.log('📦 First product image:', fetchedProducts[0]?.mainImage);
        setProducts(fetchedProducts);
        console.log('✅ Using REAL DATABASE products:', fetchedProducts.length);
      } else {
        console.error('❌ No products found in database!');
        console.error('❌ Database is empty - add products first');
        setProducts([]);
      }
    } catch (error) {
      console.error('❌ Error fetching products:', error);
      console.error('❌ Make sure backend is running on port 5000');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchFlashDeals = async () => {
    try {
      console.log('🔥 Fetching flash deals from database...');
      const response = await fetch('/api/products/flash-deals?limit=6');
      const data = await response.json();
      console.log('🔥 Flash deals response:', data);
      if (data.success && data.data && data.data.length > 0) {
        console.log('🔥 DATABASE flash deals images:', data.data.map(p => p.mainImage));
        setFlashDeals(data.data);
        console.log('✅ Flash deals: REAL DATABASE images:', data.data.length);
      } else {
        console.error('❌ No flash deals in database - showing empty');
        setFlashDeals([]);
      }
    } catch (error) {
      console.error('❌ Error fetching flash deals:', error);
      setFlashDeals([]);
    }
  };

  const fetchTrendingProducts = async () => {
    try {
      console.log('🔥 Fetching trending from database...');
      const response = await fetch('/api/products/trending?limit=12');
      const data = await response.json();
      console.log('🔥 Trending response:', data);
      if (data.success && data.data && data.data.length > 0) {
        console.log('🔥 DATABASE trending images:', data.data.map(p => p.mainImage));
        setTrendingProducts(data.data);
        console.log('✅ Trending: REAL DATABASE images:', data.data.length);
      } else {
        console.error('❌ No trending products in database - showing empty');
        setTrendingProducts([]);
      }
    } catch (error) {
      console.error('❌ Error fetching trending:', error);
      setTrendingProducts([]);
    }
  };

  const fetchBestDeals = async () => {
    try {
      console.log('💎 Fetching best deals from database...');
      const response = await fetch('/api/products/best-deals?limit=8');
      const data = await response.json();
      console.log('💎 Best deals response:', data);
      if (data.success && data.data && data.data.length > 0) {
        console.log('💎 DATABASE best deals images:', data.data.map(p => p.mainImage));
        setBestDeals(data.data);
        console.log('✅ Best deals: REAL DATABASE images:', data.data.length);
      } else {
        console.error('❌ No best deals in database - showing empty');
        setBestDeals([]);
      }
    } catch (error) {
      console.error('❌ Error fetching best deals:', error);
      setBestDeals([]);
    }
  };

  // Mock products for fallback
  const mockProducts = [
    {
      _id: '1',
      name: 'Wireless Bluetooth Headphones - Premium Sound',
      price: 25000,
      mainImage: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&h=500&fit=crop',
      category: 'Electronics'
    },
    {
      _id: '2',
      name: 'Smart Watch - Fitness Tracker',
      price: 45000,
      mainImage: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&h=500&fit=crop',
      category: 'Electronics'
    },
    {
      _id: '3',
      name: 'Designer Backpack - Laptop Compatible',
      price: 35000,
      mainImage: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500&h=500&fit=crop',
      category: 'Fashion'
    },
    {
      _id: '4',
      name: 'Running Shoes - Comfortable & Stylish',
      price: 55000,
      mainImage: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&h=500&fit=crop',
      category: 'Sports'
    },
    {
      _id: '5',
      name: 'Portable Bluetooth Speaker',
      price: 18000,
      mainImage: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=500&h=500&fit=crop',
      category: 'Electronics'
    },
    {
      _id: '6',
      name: 'Sunglasses - UV Protection',
      price: 12000,
      mainImage: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=500&h=500&fit=crop',
      category: 'Fashion'
    },
    {
      _id: '7',
      name: 'Yoga Mat - Premium Quality',
      price: 8000,
      mainImage: 'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=500&h=500&fit=crop',
      category: 'Sports'
    },
    {
      _id: '8',
      name: 'Coffee Maker - Automatic',
      price: 65000,
      mainImage: 'https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?w=500&h=500&fit=crop',
      category: 'Home'
    },
    {
      _id: '9',
      name: 'Gaming Mouse - RGB',
      price: 15000,
      mainImage: 'https://images.unsplash.com/photo-1527814050087-3793815479db?w=500&h=500&fit=crop',
      category: 'Electronics'
    },
    {
      _id: '10',
      name: 'Water Bottle - Insulated',
      price: 7000,
      mainImage: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=500&h=500&fit=crop',
      category: 'Sports'
    },
    {
      _id: '11',
      name: 'Phone Case - Shockproof',
      price: 5000,
      mainImage: 'https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=500&h=500&fit=crop',
      category: 'Electronics'
    },
    {
      _id: '12',
      name: 'Desk Lamp - LED',
      price: 22000,
      mainImage: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=500&h=500&fit=crop',
      category: 'Home'
    },
    {
      _id: '13',
      name: 'Laptop Stand - Adjustable',
      price: 28000,
      mainImage: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=500&h=500&fit=crop',
      category: 'Electronics'
    },
    {
      _id: '14',
      name: 'Wall Clock - Modern Design',
      price: 9000,
      mainImage: 'https://images.unsplash.com/photo-1563861826100-9cb868fdbe1c?w=500&h=500&fit=crop',
      category: 'Home'
    },
    {
      _id: '15',
      name: 'USB Cable - Fast Charging',
      price: 3000,
      mainImage: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=500&h=500&fit=crop',
      category: 'Electronics'
    },
    {
      _id: '16',
      name: 'Plant Pot - Ceramic',
      price: 6000,
      mainImage: 'https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=500&h=500&fit=crop',
      category: 'Home'
    }
  ];

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
    { name: 'Electronics', slug: 'electronics', icon: '💻', deals: '150+ Deals', color: 'bg-blue-600' },
    { name: "Women's Fashion", slug: 'womens-fashion', icon: '👗', deals: '100+ Deals', color: 'bg-pink-500' },
    { name: "Men's Fashion", slug: 'mens-fashion', icon: '👔', deals: '80+ Deals', color: 'bg-blue-500' },
    { name: 'Kids & Baby', slug: 'kids-baby', icon: '👶', deals: '45+ Deals', color: 'bg-yellow-400' },
    { name: 'Home & Living', slug: 'home-living', icon: '🏠', deals: '30+ Deals', color: 'bg-green-500' },
    { name: 'Beauty', slug: 'beauty-personal-care', icon: '💄', deals: '40+ Deals', color: 'bg-purple-500' },
    { name: 'Sports & Outdoor', slug: 'sports-outdoor', icon: '⚽', deals: '25+ Deals', color: 'bg-orange-500' },
    { name: 'Shoes & Footwear', slug: 'shoes-footwear', icon: '👟', deals: '60+ Deals', color: 'bg-indigo-500' },
    { name: 'Jewelry & Watches', slug: 'jewelry-watches', icon: '💍', deals: '35+ Deals', color: 'bg-yellow-600' },
    { name: 'Bags & Accessories', slug: 'bags-accessories', icon: '👜', deals: '20+ Deals', color: 'bg-teal-500' },
    { name: 'Books & Media', slug: 'books-media', icon: '📚', deals: '50+ Deals', color: 'bg-red-500' },
    { name: 'Toys & Games', slug: 'toys-games', icon: '🎮', deals: '40+ Deals', color: 'bg-cyan-500' },
    { name: 'Health & Wellness', slug: 'health-wellness', icon: '💊', deals: '35+ Deals', color: 'bg-emerald-500' },
    { name: 'Automotive', slug: 'automotive', icon: '🚗', deals: '25+ Deals', color: 'bg-gray-700' },
    { name: 'Pet Supplies', slug: 'pet-supplies', icon: '🐾', deals: '30+ Deals', color: 'bg-amber-500' },
    { name: 'Office & Stationery', slug: 'office-stationery', icon: '📝', deals: '20+ Deals', color: 'bg-slate-600' }
  ];

  const recommendedProducts = products.slice(0, 12);
  const justForYou = products.slice(12, 36); // 24 more products

  return (
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
                <p className="text-xs text-gray-500">{cat.deals}</p>
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
            {(() => {
              console.log('🖌️ Rendering Flash Deals section');
              console.log('🖌️ flashDeals array:', flashDeals);
              console.log('🖌️ flashDeals.length:', flashDeals.length);
              return null;
            })()}
            {flashDeals.length === 0 ? (
              <div className="col-span-full text-center py-12 text-white">
                <p className="text-xl mb-2">📦 No Flash Deals</p>
                <p className="text-sm opacity-75">Database has no products with isSale=true</p>
              </div>
            ) : (
              flashDeals.map((product, index) => (
                <Link
                  key={product._id || index}
                  to={`/product/${product._id || product.id}`}
                  className="bg-white rounded-xl p-3 hover:shadow-2xl transition-all transform hover:-translate-y-1"
                >
                  <div className="relative">
                    <ProductMedia
                      src={product.mainImage || product.image}
                      alt={product.name}
                      className="w-full h-32 object-cover rounded-lg mb-2"
                      playOnHover={true}
                      generateThumbnail={true}
                      muted={true}
                      loop={true}
                    />
                    <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                      -{Math.floor(Math.random() * 50 + 20)}%
                    </div>
                  </div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-1 line-clamp-2">
                    {product.name}
                  </h3>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-lg font-bold text-red-600">
                        {(product.price || 0).toLocaleString()} RWF
                      </div>
                      {product.originalPrice && (
                        <div className="text-xs text-gray-400 line-through">
                          {product.originalPrice.toLocaleString()}
                        </div>
                      )}
                    </div>
                    <div className="text-xs text-gray-500">
                      {Math.floor(Math.random() * 1000)} sold
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Trending Products */}
      <section className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-r from-pink-500 to-purple-500 rounded-full p-3">
              <FireIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-3xl font-black text-gray-900">Trending Now</h2>
              <p className="text-gray-600">Hot products everyone's buying</p>
            </div>
          </div>
          <Link to="/shop" className="text-orange-600 font-semibold hover:text-orange-700 flex items-center">
            View All
            <ArrowRightIcon className="ml-1 h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {(() => {
            console.log('🖌️ Rendering Trending section');
            console.log('🖌️ trendingProducts array:', trendingProducts);
            console.log('🖌️ trendingProducts.length:', trendingProducts.length);
            return null;
          })()}
          {trendingProducts.length === 0 ? (
            <div className="col-span-full text-center py-12 bg-gray-100 rounded-xl">
              <p className="text-xl text-gray-800 mb-2">📦 No Trending Products</p>
              <p className="text-sm text-gray-600">Database has no active products</p>
            </div>
          ) : (
            trendingProducts.map((product, index) => (
              <Link
                key={product._id || index}
                to={`/product/${product._id || product.id}`}
                className="bg-white rounded-xl overflow-hidden hover:shadow-2xl transition-all border border-gray-100 group"
              >
                <div className="relative overflow-hidden">
                  <ProductMedia
                    src={product.mainImage || product.image}
                    alt={product.name}
                    className="w-full h-40 object-cover group-hover:scale-110 transition-transform duration-300"
                    playOnHover={true}
                    generateThumbnail={true}
                    muted={true}
                    loop={true}
                  />
                  <div className="absolute top-2 right-2 bg-pink-500 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center space-x-1">
                    <FireIcon className="h-3 w-3" />
                    <span>Trending</span>
                  </div>
                  <button 
                    onClick={(e) => {
                      e.preventDefault();
                      alert('Added to wishlist!');
                    }}
                    className="absolute top-2 left-2 bg-white rounded-full p-1.5 shadow-md hover:bg-red-50 transition-colors"
                  >
                    <HeartIcon className="h-4 w-4 text-gray-600 hover:text-red-500" />
                  </button>
                </div>
                
                <div className="p-3">
                  <h3 className="text-sm font-semibold text-gray-900 mb-2 line-clamp-2 h-10">
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
                    <span className="text-xs text-gray-500 ml-1">
                      ({Math.floor(Math.random() * 500 + 100)})
                    </span>
                  </div>

                  <div className="flex items-baseline space-x-1 mb-2">
                    <span className="text-lg font-bold text-red-600">
                      {(product.price || 0).toLocaleString()}
                    </span>
                    <span className="text-xs text-gray-900">RWF</span>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">{Math.floor(Math.random() * 1000 + 500)} sold</span>
                    <span className="bg-pink-50 text-pink-600 px-2 py-0.5 rounded font-medium">
                      Hot
                    </span>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </section>

      {/* Best Deals */}
      <section className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-3xl p-8 shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="bg-white rounded-full p-3">
                <TagIcon className="h-8 w-8 text-green-500" />
              </div>
              <div>
                <h2 className="text-3xl font-black text-white">Best Deals</h2>
                <p className="text-white/90">Save big on these amazing products</p>
              </div>
            </div>
            <Link to="/shop" className="bg-white text-green-600 px-6 py-3 rounded-full font-bold hover:bg-gray-100 transition-all flex items-center">
              Shop All
              <ArrowRightIcon className="ml-2 h-4 w-4" />
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {(() => {
              console.log('🖌️ Rendering Best Deals section');
              console.log('🖌️ bestDeals array:', bestDeals);
              console.log('🖌️ bestDeals.length:', bestDeals.length);
              return null;
            })()}
            {bestDeals.length === 0 ? (
              <div className="col-span-full text-center py-12 text-white">
                <p className="text-xl mb-2">📦 No Best Deals</p>
                <p className="text-sm opacity-75">Database has no bestsellers or high-rated products</p>
              </div>
            ) : (
              bestDeals.map((product, index) => (
                <Link
                  key={product._id || index}
                  to={`/product/${product._id || product.id}`}
                  className="bg-white rounded-2xl overflow-hidden hover:shadow-2xl transition-all transform hover:-translate-y-2 group"
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
                    <div className="absolute top-3 left-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-sm font-bold px-3 py-1.5 rounded-full">
                      -{Math.floor(Math.random() * 40 + 30)}% OFF
                    </div>
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
                    
                    <div className="flex items-center mb-3">
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <StarIcon
                            key={i}
                            className={`h-4 w-4 ${
                              i < 4 ? 'text-yellow-400 fill-current' : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-xs text-gray-500 ml-2">
                        4.5
                      </span>
                    </div>

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

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500 font-medium">{Math.floor(Math.random() * 800 + 200)} sold</span>
                      <span className="bg-green-50 text-green-600 px-2 py-1 rounded-full font-bold">
                        Save {Math.floor(Math.random() * 15000 + 5000)} RWF
                      </span>
                    </div>
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
          {recommendedProducts.map((product, index) => (
            <Link
              key={product._id || index}
              to={`/product/${product._id || product.id}`}
              className="bg-white rounded-xl overflow-hidden hover:shadow-xl transition-all border border-gray-100"
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
                  <span className="text-xs text-gray-500 ml-1">
                    ({Math.floor(Math.random() * 500)})
                  </span>
                </div>

                <div className="flex items-baseline space-x-1 mb-2">
                  <span className="text-lg font-bold text-red-600">
                    {(product.price || 0).toLocaleString()}
                  </span>
                  <span className="text-xs text-gray-900">RWF</span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">{Math.floor(Math.random() * 500)} sold</span>
                  <span className="bg-red-50 text-red-600 px-2 py-0.5 rounded">
                    -{Math.floor(Math.random() * 30 + 10)}%
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

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
          {(justForYou.length > 0 ? justForYou : products).slice(0, 24).map((product, index) => (
            <Link
              key={product._id || index}
              to={`/product/${product._id || product.id}`}
              className="bg-white rounded-xl overflow-hidden hover:shadow-xl transition-all border border-gray-100"
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
                {Math.random() > 0.5 && (
                  <div className="absolute top-2 left-2 bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                    Hot
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
                          i < Math.floor(Math.random() * 2 + 3) ? 'text-yellow-400 fill-current' : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-xs text-gray-500 ml-1">
                    ({Math.floor(Math.random() * 1000)})
                  </span>
                </div>

                <div className="flex items-baseline space-x-1 mb-2">
                  <span className="text-lg font-bold text-red-600">
                    {(product.price || 0).toLocaleString()}
                  </span>
                  <span className="text-xs text-gray-900">RWF</span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">{Math.floor(Math.random() * 2000)} sold</span>
                  {Math.random() > 0.3 && (
                    <span className="text-green-600 font-medium">Free shipping</span>
                  )}
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
  );
};

export default HomeModern;
