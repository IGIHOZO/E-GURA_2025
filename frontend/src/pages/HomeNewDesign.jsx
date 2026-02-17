import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import ProductMedia from '../components/ProductMedia';
import {
  ShoppingBagIcon,
  StarIcon,
  TruckIcon,
  ShieldCheckIcon,
  CreditCardIcon,
  HeartIcon,
  SparklesIcon,
  ArrowRightIcon,
  TagIcon,
  FireIcon,
  PhoneIcon
} from '@heroicons/react/24/outline';
import { 
  FaInstagram, 
  FaFacebook, 
  FaThreads 
} from 'react-icons/fa6';
import { productsAPI } from '../services/api';
import { useCart } from '../context/CartContext';
import Logo from '../components/Logo';
import AIAssistant from '../components/AIAssistant';
import CategoryBanners3D from '../components/CategoryBanners3D';
import axios from 'axios';

const HomeNewDesign = () => {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [flashDeals, setFlashDeals] = useState([]);
  const [trendingProducts, setTrendingProducts] = useState([]);
  const [bestDeals, setBestDeals] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();

  // Get device ID for personalization
  const getDeviceId = () => {
    let deviceId = localStorage.getItem('deviceId');
    if (!deviceId) {
      deviceId = `device-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      localStorage.getItem('deviceId', deviceId);
    }
    return deviceId;
  };

  // Fetch products from database
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch all products (same as shop page)
        console.log('📦 Fetching products from database (same as shop)...');
        const allRes = await axios.get('/api/products?limit=50');
        const products = allRes.data?.data || [];
        
        console.log('📦 Products from DATABASE:', products.length);
        if (products.length > 0) {
          console.log('📦 First product image:', products[0]?.mainImage);
        }
        setFeaturedProducts(products.slice(0, 8));

        // Fetch flash deals
        console.log('🔥 Fetching flash deals from database...');
        const flashRes = await axios.get('/api/products/flash-deals?limit=6');
        if (flashRes.data?.success && flashRes.data.data?.length > 0) {
          console.log('🔥 Flash deals images:', flashRes.data.data.map(p => p.mainImage));
          setFlashDeals(flashRes.data.data);
          console.log('✅ Flash deals: REAL DATABASE images:', flashRes.data.data.length);
        } else {
          console.error('❌ No flash deals in database');
          setFlashDeals([]);
        }

        // Fetch trending products
        console.log('🔥 Fetching trending from database...');
        const trendingRes = await axios.get('/api/products/trending?limit=12');
        if (trendingRes.data?.success && trendingRes.data.data?.length > 0) {
          console.log('🔥 Trending images:', trendingRes.data.data.map(p => p.mainImage));
          setTrendingProducts(trendingRes.data.data);
          console.log('✅ Trending: REAL DATABASE images:', trendingRes.data.data.length);
        } else {
          console.error('❌ No trending in database');
          setTrendingProducts([]);
        }

        // Fetch best deals
        console.log('💎 Fetching best deals from database...');
        const bestDealsRes = await axios.get('/api/products/best-deals?limit=8');
        if (bestDealsRes.data?.success && bestDealsRes.data.data?.length > 0) {
          console.log('💎 Best deals images:', bestDealsRes.data.data.map(p => p.mainImage));
          setBestDeals(bestDealsRes.data.data);
          console.log('✅ Best deals: REAL DATABASE images:', bestDealsRes.data.data.length);
        } else {
          console.error('❌ No best deals in database');
          setBestDeals([]);
        }

        // Extract categories from products
        const uniqueCategories = [...new Set(products.map(p => p.category).filter(Boolean))];
        setCategories(uniqueCategories.slice(0, 6));

        console.log('✅ HomeNewDesign loaded with REAL DATABASE images');
        console.log('📊 Stats:', {
          featured: products.length,
          flashDeals: flashRes.data?.data?.length || 0,
          trending: trendingRes.data?.data?.length || 0,
          bestDeals: bestDealsRes.data?.data?.length || 0,
          categories: uniqueCategories.length
        });

      } catch (error) {
        console.error('❌ Error loading home data:', error);
        setFeaturedProducts([]);
        setFlashDeals([]);
        setTrendingProducts([]);
        setBestDeals([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleAddToCart = (product) => {
    addToCart(product, 'Default', 'Default', 1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-r from-orange-600 via-red-600 to-pink-600 text-white">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <div className="flex items-center space-x-3 mb-6">
                <Logo size="xl" className="filter drop-shadow-lg" />
                <h1 className="text-4xl md:text-6xl font-bold">
                  E-Gura Store
                </h1>
              </div>
              <p className="text-xl md:text-2xl mb-8 text-orange-100">
                Your One-Stop Shop for Quality Products
              </p>
              <p className="text-lg mb-6 text-white/90">
                Discover amazing deals on electronics, fashion, accessories, and more. Fast delivery across Rwanda!
              </p>
              
              {/* Contact & Social Media */}
              <div className="flex flex-wrap items-center gap-6 mb-8">
                <a 
                  href="tel:+250782013955" 
                  className="flex items-center space-x-2 text-white/90 hover:text-white transition-colors"
                >
                  <PhoneIcon className="h-5 w-5" />
                  <span className="font-medium">+250 782 013 955</span>
                </a>
                <div className="flex items-center space-x-3">
                  <span className="text-white/70 text-sm">Follow us:</span>
                  <a 
                    href="https://www.instagram.com/egurastore/?hl=en" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-white/80 hover:text-pink-300 transition-colors"
                    aria-label="Instagram"
                  >
                    <FaInstagram className="h-6 w-6" />
                  </a>
                  <a 
                    href="https://www.facebook.com/egurastore/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-white/80 hover:text-blue-300 transition-colors"
                    aria-label="Facebook"
                  >
                    <FaFacebook className="h-6 w-6" />
                  </a>
                  <a 
                    href="https://www.threads.com/@egurastore" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-white/80 hover:text-white transition-colors"
                    aria-label="Threads"
                  >
                    <FaThreads className="h-6 w-6" />
                  </a>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-4">
                <Link to="/shop">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="bg-white text-orange-600 px-8 py-4 rounded-full font-bold text-lg shadow-lg hover:shadow-xl transition-all flex items-center space-x-2"
                  >
                    <ShoppingBagIcon className="h-6 w-6" />
                    <span>Shop Now</span>
                    <ArrowRightIcon className="h-5 w-5" />
                  </motion.button>
                </Link>
                <Link to="/shop?category=deals">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="bg-orange-500 bg-opacity-20 backdrop-blur-sm border-2 border-white text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-opacity-30 transition-all flex items-center space-x-2"
                  >
                    <TagIcon className="h-6 w-6" />
                    <span>View Deals</span>
                  </motion.button>
                </Link>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="hidden md:block"
            >
              <div className="relative">
                <div className="absolute -inset-4 bg-white/20 rounded-3xl blur-3xl"></div>
                <div className="relative grid grid-cols-2 gap-4">
                  {featuredProducts.slice(0, 4).map((product, index) => (
                    <motion.div
                      key={product.id || index}
                      whileHover={{ scale: 1.05 }}
                      className="bg-white rounded-2xl p-4 shadow-2xl"
                    >
                      <ProductMedia
                        src={product.mainImage || product.imageUrl}
                        alt={product.name}
                        className="w-full h-32 object-cover rounded-lg mb-2"
                        playOnHover={true}
                        generateThumbnail={true}
                        muted={true}
                        loop={true}
                      />
                      <p className="text-gray-800 font-semibold text-sm truncate">
                        {product.name}
                      </p>
                      <p className="text-orange-600 font-bold">
                        {product.price?.toLocaleString()} RWF
                      </p>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Wave Divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 120L60 105C120 90 240 60 360 45C480 30 600 30 720 37.5C840 45 960 60 1080 67.5C1200 75 1320 75 1380 75L1440 75V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="white"/>
          </svg>
        </div>
      </section>

      {/* Features Bar */}
      <section className="bg-white py-8 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { icon: TruckIcon, title: 'Free Delivery', desc: 'On orders over 50,000 RWF' },
              { icon: ShieldCheckIcon, title: 'Secure Payment', desc: 'MTN Mobile Money' },
              { icon: CreditCardIcon, title: 'Best Prices', desc: 'Guaranteed lowest prices' },
              { icon: SparklesIcon, title: 'Quality Products', desc: '100% authentic items' }
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <feature.icon className="h-10 w-10 text-orange-600 mx-auto mb-3" />
                <h3 className="font-bold text-gray-900 mb-1">{feature.title}</h3>
                <p className="text-sm text-gray-600">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 3D Category Banners */}
      <CategoryBanners3D />

      {/* Trending Products */}
      {trendingProducts.length > 0 && (
        <section className="py-16 bg-gradient-to-br from-orange-50 to-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-10">
              <div className="flex items-center space-x-3">
                <FireIcon className="h-8 w-8 text-orange-600" />
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
                  Trending Now
                </h2>
              </div>
              <Link to="/shop" className="text-orange-600 font-semibold hover:text-orange-700 flex items-center">
                View All
                <ArrowRightIcon className="h-5 w-5 ml-1" />
              </Link>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
              {trendingProducts.map((product, index) => (
                <motion.div
                  key={product.id || index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all group overflow-hidden"
                >
                  <div className="relative">
                    <ProductMedia
                      src={product.mainImage || product.imageUrl}
                      alt={product.name}
                      className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-300"
                      playOnHover={true}
                      generateThumbnail={true}
                      muted={true}
                      loop={true}
                    />
                    <div className="absolute top-2 right-2 bg-orange-600 text-white px-2 py-1 rounded-full text-xs font-bold">
                      🔥 HOT
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 h-12">
                      {product.name}
                    </h3>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xl font-bold text-orange-600">
                        {product.price?.toLocaleString()} RWF
                      </span>
                      {product.averageRating > 0 && (
                        <div className="flex items-center">
                          <StarIcon className="h-4 w-4 text-yellow-400 fill-current" />
                          <span className="text-sm text-gray-600 ml-1">{product.averageRating}</span>
                        </div>
                      )}
                    </div>
                    <Link to={`/product/${product.id}`}>
                      <button className="w-full bg-orange-600 text-white py-2 rounded-lg font-semibold hover:bg-orange-700 transition-colors">
                        View Details
                      </button>
                    </Link>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Featured Products */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Featured Products
            </h2>
            <p className="text-gray-600 text-lg">
              Handpicked items just for you
            </p>
          </div>

          {loading ? (
            <div className="text-center py-20">
              <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-orange-600 mx-auto"></div>
              <p className="text-gray-600 mt-4">Loading products...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {featuredProducts.slice(0, 8).map((product, index) => (
                <motion.div
                  key={product.id || index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all group border border-gray-100 overflow-hidden"
                >
                  <div className="relative overflow-hidden">
                    <ProductMedia
                      src={product.mainImage || product.imageUrl}
                      alt={product.name}
                      className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-500"
                      playOnHover={true}
                      generateThumbnail={true}
                      muted={true}
                      loop={true}
                    />
                    {product.isSale && (
                      <div className="absolute top-3 left-3 bg-red-600 text-white px-3 py-1 rounded-full text-sm font-bold">
                        SALE
                      </div>
                    )}
                    <button className="absolute top-3 right-3 bg-white p-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity">
                      <HeartIcon className="h-5 w-5 text-red-600" />
                    </button>
                  </div>
                  <div className="p-5">
                    <p className="text-sm text-orange-600 font-semibold mb-2">{product.category}</p>
                    <h3 className="font-bold text-gray-900 mb-3 line-clamp-2 h-12">
                      {product.name}
                    </h3>
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <span className="text-2xl font-bold text-orange-600">
                          {product.price?.toLocaleString()}
                        </span>
                        <span className="text-sm text-gray-600 ml-1">RWF</span>
                      </div>
                      {product.averageRating > 0 && (
                        <div className="flex items-center bg-yellow-50 px-2 py-1 rounded-full">
                          <StarIcon className="h-4 w-4 text-yellow-400 fill-current" />
                          <span className="text-sm font-semibold text-gray-700 ml-1">
                            {product.averageRating}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex space-x-2">
                      <Link to={`/product/${product.id}`} className="flex-1">
                        <button className="w-full bg-gray-100 text-gray-900 py-2.5 rounded-lg font-semibold hover:bg-gray-200 transition-colors">
                          View
                        </button>
                      </Link>
                      <button
                        onClick={() => handleAddToCart(product)}
                        className="flex-1 bg-orange-600 text-white py-2.5 rounded-lg font-semibold hover:bg-orange-700 transition-colors flex items-center justify-center space-x-1"
                      >
                        <ShoppingBagIcon className="h-5 w-5" />
                        <span>Add</span>
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          <div className="text-center mt-12">
            <Link to="/shop">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-orange-600 text-white px-10 py-4 rounded-full font-bold text-lg shadow-lg hover:bg-orange-700 transition-all inline-flex items-center space-x-2"
              >
                <span>View All Products</span>
                <ArrowRightIcon className="h-5 w-5" />
              </motion.button>
            </Link>
          </div>
        </div>
      </section>

      {/* Categories */}
      {categories.length > 0 && (
        <section className="py-16 bg-gradient-to-br from-gray-50 to-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-10 text-center">
              Shop by Category
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
              {categories.map((category, index) => (
                <Link key={index} to={`/shop?category=${category}`}>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all p-6 text-center group"
                  >
                    <div className="bg-orange-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-orange-200 transition-colors">
                      <span className="text-2xl">📦</span>
                    </div>
                    <h3 className="font-bold text-gray-900 capitalize">{category}</h3>
                  </motion.div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-orange-600 to-red-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            Ready to Start Shopping?
          </h2>
          <p className="text-xl md:text-2xl mb-10 text-orange-100">
            Join thousands of happy customers across Rwanda
          </p>
          <Link to="/shop">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-white text-orange-600 px-12 py-5 rounded-full font-bold text-xl shadow-2xl hover:shadow-3xl transition-all inline-flex items-center space-x-3"
            >
              <ShoppingBagIcon className="h-7 w-7" />
              <span>Shop Now</span>
              <ArrowRightIcon className="h-6 w-6" />
            </motion.button>
          </Link>
        </div>
      </section>

      {/* AI Assistant Chat */}
      <AIAssistant />
    </div>
  );
};

export default HomeNewDesign;
