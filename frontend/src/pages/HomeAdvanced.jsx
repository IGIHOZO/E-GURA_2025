import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useInView, useScroll, useTransform } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  ShoppingBagIcon, 
  StarIcon, 
  HeartIcon,
  ArrowRightIcon,
  SparklesIcon,
  TruckIcon,
  ShieldCheckIcon,
  CreditCardIcon,
  UserGroupIcon,
  ChatBubbleLeftRightIcon,
  BellIcon,
  GiftIcon,
  CubeIcon,
  MagnifyingGlassIcon,
  AdjustmentsHorizontalIcon,
  ChartBarIcon,
  DevicePhoneMobileIcon,
  ComputerDesktopIcon
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolid, StarIcon as StarSolid } from '@heroicons/react/24/solid';
import { productsAPI } from '../services/api';
import { useCart } from '../context/CartContext';
import { detectDevice, getDeviceType, isTouchDevice } from '../utils/deviceDetect';

const HomeAdvanced = () => {
  // State Management
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quizStarted, setQuizStarted] = useState(false);
  const [quizStep, setQuizStep] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilters, setSelectedFilters] = useState([]);
  const [showMicroCart, setShowMicroCart] = useState(false);
  const [liveViewers, setLiveViewers] = useState(47);
  const [recentPurchases, setRecentPurchases] = useState([]);
  const [consentGiven, setConsentGiven] = useState(false);
  const [showConsentBanner, setShowConsentBanner] = useState(true);
  const [personalizedRecs, setPersonalizedRecs] = useState([]);
  const [bundleItems, setBundleItems] = useState([]);
  const [showStickyCTA, setShowStickyCTA] = useState(false);
  const [deviceInfo, setDeviceInfo] = useState(detectDevice());
  const [isMobileView, setIsMobileView] = useState(false);
  
  const { addToCart, getCartCount } = useCart();
  const heroRef = useRef(null);
  const isHeroInView = useInView(heroRef, { once: true });
  
  // Analytics Event Tracking
  const trackEvent = (eventName, params = {}) => {
    if (window.gtag) {
      window.gtag('event', eventName, {
        ...params,
        consent_mode: consentGiven ? 'granted' : 'denied',
        timestamp: new Date().toISOString()
      });
    }
    console.log(`📊 Analytics Event: ${eventName}`, params);
  };

  // Device Detection and Responsive Setup
  useEffect(() => {
    const updateDeviceInfo = () => {
      const device = detectDevice();
      setDeviceInfo(device);
      setIsMobileView(device.isMobile || window.innerWidth < 768);
      
      console.log('📱 Device Info:', {
        type: getDeviceType(),
        isMobile: device.isMobile,
        isTablet: device.isTablet,
        isTouch: isTouchDevice(),
        screen: `${device.screenWidth}x${device.screenHeight}`,
        orientation: device.orientation
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

  // Fetch Data with Error Handling
  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1) Try to load featured products
        const featuredRes = await productsAPI.getFeaturedProducts();
        let products = featuredRes.data?.data || featuredRes.data || [];

        // 2) If we don't have enough to fill 5 columns, top up from all products
        if (!Array.isArray(products) || products.length < 10) {
          try {
            const allRes = (productsAPI.getAllAdmin ? await productsAPI.getAllAdmin({ limit: 50 }) : await productsAPI.getAll({ limit: 50 }));
            const all = allRes.data?.data || allRes.data || [];
            // Merge unique by _id
            const ids = new Set(products.map(p => p._id));
            for (const p of all) {
              if (!ids.has(p._id)) {
                products.push(p);
                ids.add(p._id);
              }
              if (products.length >= 15) break;
            }
          } catch (e) {
            console.warn('Fallback to all products failed:', e);
          }
        }

        setFeaturedProducts(products);
        trackEvent('view_item_list', { item_list_name: 'featured_products', items: products.slice(0, 5) });
      } catch (error) {
        console.error('Error fetching products:', error);
        // Fallback to mock data for demo purposes when backend is unavailable
        const mockProducts = [
          {
            _id: '1',
            name: 'African Print Dress',
            price: 45000,
            mainImage: 'https://images.unsplash.com/photo-1583391733981-5babdc0fc37d?w=400&h=500&fit=crop',
            averageRating: 4.8,
            totalReviews: 25,
            isNew: true,
            stockQuantity: 5
          },
          {
            _id: '2',
            name: 'Ankara Top',
            price: 25000,
            mainImage: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=400&h=500&fit=crop',
            averageRating: 4.6,
            totalReviews: 18,
            discountPercentage: 15,
            stockQuantity: 12
          },
          {
            _id: '3',
            name: 'Traditional Kente Skirt',
            price: 35000,
            mainImage: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=500&fit=crop',
            averageRating: 4.9,
            totalReviews: 32,
            stockQuantity: 8
          },
          {
            _id: '4',
            name: 'Beaded Necklace Set',
            price: 15000,
            mainImage: 'https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=400&h=500&fit=crop',
            averageRating: 4.7,
            totalReviews: 15,
            isNew: true,
            stockQuantity: 20
          },
          {
            _id: '5',
            name: 'African Print Blazer',
            price: 55000,
            mainImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=500&fit=crop',
            averageRating: 4.5,
            totalReviews: 22,
            discountPercentage: 10,
            stockQuantity: 3
          }
        ];
        setFeaturedProducts(mockProducts);
        console.log('Using mock data for demo - backend unavailable');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    
    // Simulate live viewers
    const viewerInterval = setInterval(() => {
      setLiveViewers(prev => prev + Math.floor(Math.random() * 5) - 2);
    }, 5000);
    
    // Simulate recent purchases
    const purchaseInterval = setInterval(() => {
      const names = ['Sarah', 'John', 'Emma', 'Michael', 'Olivia'];
      const items = ['African Print Dress', 'Ankara Top', 'Beaded Necklace', 'Kente Skirt'];
      setRecentPurchases(prev => [
        { name: names[Math.floor(Math.random() * names.length)], item: items[Math.floor(Math.random() * items.length)], time: 'Just now' },
        ...prev.slice(0, 2)
      ]);
    }, 8000);
    
    // Sticky CTA on scroll
    const handleScroll = () => {
      setShowStickyCTA(window.scrollY > 800);
    };
    window.addEventListener('scroll', handleScroll);
    
    return () => {
      clearInterval(viewerInterval);
      clearInterval(purchaseInterval);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Quiz Logic
  const quizQuestions = [
    {
      question: "What's your style preference?",
      options: ['Traditional', 'Modern', 'Fusion', 'Bold & Colorful']
    },
    {
      question: "What occasion are you shopping for?",
      options: ['Casual', 'Work', 'Special Event', 'Party']
    },
    {
      question: "What's your budget range?",
      options: ['Under 30,000 RWF', '30,000-60,000 RWF', '60,000-100,000 RWF', '100,000+ RWF']
    }
  ];

  const startQuiz = () => {
    setQuizStarted(true);
    setQuizStep(0);
    trackEvent('quiz_start', { quiz_name: 'style_finder' });
  };

  const answerQuiz = (answer) => {
    trackEvent(`quiz_answer_${quizStep}`, { question: quizQuestions[quizStep].question, answer });
    if (quizStep < quizQuestions.length - 1) {
      setQuizStep(quizStep + 1);
    } else {
      setQuizStarted(false);
      trackEvent('quiz_complete', { quiz_name: 'style_finder' });
      alert('✨ Perfect! We found your style. Check out our personalized recommendations!');
    }
  };

  // Handle Add to Cart
  const handleAddToCart = (product) => {
    addToCart({
      id: product._id,
      name: product.name,
      price: product.price,
      image: product.mainImage,
      quantity: 1
    });
    setShowMicroCart(true);
    setTimeout(() => setShowMicroCart(false), 3000);
    trackEvent('add_to_cart', {
      currency: 'RWF',
      value: product.price,
      items: [{ item_id: product._id, item_name: product.name, price: product.price }]
    });
  };

  // Consent Management
  const handleConsent = (granted) => {
    setConsentGiven(granted);
    setShowConsentBanner(false);
    trackEvent('consent_update', { consent_status: granted ? 'granted' : 'denied' });
    localStorage.setItem('consent_given', granted);
  };

  // AI-Powered Search
  const handleSearch = (query) => {
    setSearchQuery(query);
    trackEvent('search', { search_term: query });
    // Implement semantic search logic here
  };

  return (
    <div className="min-h-screen bg-white">
      
      {/* GDPR/CCPA Consent Banner */}
      <AnimatePresence>
        {showConsentBanner && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-0 left-0 right-0 bg-white shadow-2xl z-50 border-t-4 border-red-600"
          >
            <div className="max-w-7xl mx-auto px-4 py-6">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex-1">
                  <h3 className="font-bold text-lg mb-2">🍪 We value your privacy</h3>
                  <p className="text-gray-600 text-sm">
                    We use cookies and similar technologies to personalize your experience, analyze traffic, and show relevant ads. 
                    <Link to="/privacy" className="text-red-600 hover:underline ml-1">Learn more</Link>
                  </p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => handleConsent(false)}
                    className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Decline
                  </button>
                  <button
                    onClick={() => handleConsent(true)}
                    className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Accept All
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* USP Bar - Trust Signals */}
      <div className="bg-red-600 text-white py-3 overflow-hidden">
        <motion.div
          animate={{ x: [0, -1000] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="flex items-center gap-12 whitespace-nowrap"
        >
          {[
            { icon: TruckIcon, text: 'Free Shipping in Kigali' },
            { icon: ShieldCheckIcon, text: '100% Authentic Products' },
            { icon: CreditCardIcon, text: 'Secure Mobile Money Payment' },
            { icon: GiftIcon, text: 'Loyalty Rewards Program' },
            { icon: TruckIcon, text: 'Free Shipping in Kigali' },
            { icon: ShieldCheckIcon, text: '100% Authentic Products' },
          ].map((item, index) => (
            <div key={index} className="flex items-center gap-2">
              <item.icon className="h-5 w-5" />
              <span className="font-medium">{item.text}</span>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Smart Hero Section with AI Quiz, 3D Viewer, Live Proof */}
      <section ref={heroRef} className="relative overflow-hidden py-12 md:py-20">
        <div className="absolute inset-0 bg-gradient-to-r from-red-600/5 to-red-600/10"></div>
        
        {/* Live Proof - Real-time Activity - Hidden on mobile */}
        {!isMobileView && (
          <div className="absolute top-8 right-8 z-10">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="bg-white rounded-full px-4 py-2 shadow-lg flex items-center gap-2"
            >
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium">{liveViewers} people viewing now</span>
            </motion.div>
          </div>
        )}

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center">
            
            {/* Left: Hero Content + AI Quiz */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={isHeroInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.8 }}
            >
              <div className="flex items-center gap-2 mb-4">
                <SparklesIcon className="h-6 w-6 text-red-600" />
                <span className="text-red-600 font-semibold">AI-Powered Shopping</span>
              </div>
              
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 md:mb-6 bg-gradient-to-r from-red-600 via-red-500 to-red-700 bg-clip-text text-transparent leading-tight">
                E-Gura Store - Your Premium Shopping Destination
              </h1>
              
              <p className="text-base sm:text-lg md:text-xl text-gray-700 mb-6 md:mb-8">
                Quality products, unbeatable prices. Shop the latest trends with our AI-powered shopping assistant.
              </p>

              {/* Device Info Badge - Mobile Friendly */}
              <div className="mb-6 inline-flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm border border-gray-200">
                {deviceInfo.isMobile ? (
                  <DevicePhoneMobileIcon className="h-5 w-5 text-red-600" />
                ) : (
                  <ComputerDesktopIcon className="h-5 w-5 text-red-600" />
                )}
                <span className="text-sm font-medium text-gray-700">
                  {deviceInfo.isMobile ? 'Mobile' : deviceInfo.isTablet ? 'Tablet' : 'Desktop'} View
                </span>
                <span className="text-xs text-gray-500">
                  {deviceInfo.screenWidth}x{deviceInfo.screenHeight}
                </span>
              </div>

              {/* Dual CTAs */}
              <div className="flex flex-col sm:flex-row gap-3 md:gap-4 mb-6 md:mb-8">
                <Link
                  to="/shop"
                  onClick={() => trackEvent('cta_click', { cta_name: 'shop_now', location: 'hero' })}
                  className="inline-flex items-center justify-center px-8 py-4 bg-red-600 text-white font-semibold rounded-full hover:bg-red-700 transition-all transform hover:scale-105 shadow-lg"
                >
                  Shop Now
                  <ArrowRightIcon className="ml-2 h-5 w-5" />
                </Link>
                <button
                  onClick={startQuiz}
                  className="inline-flex items-center justify-center px-8 py-4 border-2 border-red-600 text-red-600 font-semibold rounded-full hover:bg-red-600 hover:text-white transition-all transform hover:scale-105"
                >
                  <SparklesIcon className="mr-2 h-5 w-5" />
                  Find My Style (AI Quiz)
                </button>
              </div>

              {/* Trust Cluster - Social Proof */}
              <div className="flex items-center gap-6 flex-wrap">
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-2">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-400 to-pink-400 border-2 border-white"></div>
                    ))}
                  </div>
                  <span className="text-sm font-medium text-gray-700">2,500+ Happy Customers</span>
                </div>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <StarSolid key={i} className="h-5 w-5 text-yellow-400" />
                  ))}
                  <span className="ml-2 text-sm font-medium text-gray-700">4.9/5 Rating</span>
                </div>
              </div>
            </motion.div>

            {/* Right: 3D Product Viewer / Interactive Display */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={isHeroInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative"
            >
              <div className="relative aspect-square rounded-3xl overflow-hidden shadow-2xl">
                <img
                  src="https://images.unsplash.com/photo-1583391733981-5babdc0fc37d?w=600&h=600&fit=crop"
                  alt="Featured African Fashion"
                  className="w-full h-full object-cover"
                  loading="eager"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                
                {/* 3D Viewer Badge */}
                <div className="absolute top-4 left-4">
                  <div className="bg-white/90 backdrop-blur-sm rounded-full px-4 py-2 flex items-center gap-2">
                    <CubeIcon className="h-5 w-5 text-purple-600" />
                    <span className="text-sm font-semibold">360° View Available</span>
                  </div>
                </div>

                {/* Quick Action Buttons */}
                <div className="absolute bottom-4 right-4 flex gap-2">
                  <button className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform">
                    <HeartIcon className="h-6 w-6 text-gray-700" />
                  </button>
                  <button className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform">
                    <ShoppingBagIcon className="h-6 w-6 text-gray-700" />
                  </button>
                </div>
              </div>

              {/* Floating Price Tag */}
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute -bottom-6 -left-6 bg-white rounded-2xl shadow-xl p-4"
              >
                <div className="text-sm text-gray-600">Starting from</div>
                <div className="text-2xl font-bold text-purple-600">25,000 RWF</div>
                <div className="text-xs text-green-600 font-medium">🔥 Limited Time Offer</div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* AI Quiz Modal */}
      <AnimatePresence>
        {quizStarted && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setQuizStarted(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl p-8 max-w-2xl w-full shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-3xl font-bold">Find Your Perfect Style</h2>
                <button
                  onClick={() => setQuizStarted(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>

              {/* Progress Bar */}
              <div className="mb-8">
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">Question {quizStep + 1} of {quizQuestions.length}</span>
                  <span className="text-sm text-gray-600">{Math.round(((quizStep + 1) / quizQuestions.length) * 100)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-purple-600 to-pink-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${((quizStep + 1) / quizQuestions.length) * 100}%` }}
                  ></div>
                </div>
              </div>

              <h3 className="text-2xl font-semibold mb-6">{quizQuestions[quizStep].question}</h3>

              <div className="grid grid-cols-2 gap-4">
                {quizQuestions[quizStep].options.map((option, index) => (
                  <motion.button
                    key={index}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => answerQuiz(option)}
                    className="p-6 border-2 border-gray-200 rounded-xl hover:border-purple-600 hover:bg-purple-50 transition-all text-left font-medium"
                  >
                    {option}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Categories Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Shop by Category</h2>
            <p className="text-xl text-gray-600">Explore our wide range of products</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {[
              { name: 'Electronics', icon: '📱', color: 'bg-blue-50', hoverColor: 'hover:bg-blue-100' },
              { name: 'Fashion', icon: '👗', color: 'bg-pink-50', hoverColor: 'hover:bg-pink-100' },
              { name: 'Home & Garden', icon: '🏠', color: 'bg-green-50', hoverColor: 'hover:bg-green-100' },
              { name: 'Beauty & Health', icon: '💄', color: 'bg-purple-50', hoverColor: 'hover:bg-purple-100' },
              { name: 'Sports & Outdoors', icon: '⚽', color: 'bg-orange-50', hoverColor: 'hover:bg-orange-100' },
              { name: 'Toys & Games', icon: '🎮', color: 'bg-yellow-50', hoverColor: 'hover:bg-yellow-100' },
              { name: 'Books & Media', icon: '📚', color: 'bg-indigo-50', hoverColor: 'hover:bg-indigo-100' },
              { name: 'Automotive', icon: '🚗', color: 'bg-red-50', hoverColor: 'hover:bg-red-100' },
              { name: 'Jewelry & Watches', icon: '💍', color: 'bg-amber-50', hoverColor: 'hover:bg-amber-100' },
              { name: 'Food & Beverages', icon: '🍔', color: 'bg-lime-50', hoverColor: 'hover:bg-lime-100' },
              { name: 'Pet Supplies', icon: '🐾', color: 'bg-teal-50', hoverColor: 'hover:bg-teal-100' },
              { name: 'Office Supplies', icon: '📎', color: 'bg-cyan-50', hoverColor: 'hover:bg-cyan-100' },
              { name: 'Baby & Kids', icon: '👶', color: 'bg-rose-50', hoverColor: 'hover:bg-rose-100' },
              { name: 'Tools & Hardware', icon: '🔧', color: 'bg-gray-50', hoverColor: 'hover:bg-gray-100' },
              { name: 'Furniture', icon: '🛋️', color: 'bg-stone-50', hoverColor: 'hover:bg-stone-100' }
            ].map((cat, index) => (
              <motion.div
                key={cat.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ scale: 1.05 }}
              >
                <Link
                  to={`/shop?category=${cat.name}`}
                  className={`${cat.color} ${cat.hoverColor} p-6 rounded-xl text-center block transition-all shadow-sm hover:shadow-md`}
                >
                  <div className="text-5xl mb-3">{cat.icon}</div>
                  <h3 className="font-semibold text-gray-900">{cat.name}</h3>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Hybrid Semantic Search + NL Filters */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-6 w-6 text-gray-400" />
              <input
                type="text"
                placeholder="Search for products..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full pl-14 pr-4 py-4 border-2 border-gray-200 rounded-full focus:border-red-600 focus:outline-none text-lg"
              />
              <button className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-red-600 text-white px-6 py-2 rounded-full hover:bg-red-700 transition-colors">
                Search
              </button>
            </div>

            {/* AI Facets - Smart Filters */}
            <div className="mt-6 flex flex-wrap gap-3">
              <button className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-full hover:bg-red-200 transition-colors">
                <AdjustmentsHorizontalIcon className="h-5 w-5" />
                Smart Filters
              </button>
              {['Trending Now', 'New Arrivals', 'Best Sellers', 'On Sale', 'Top Rated'].map((filter) => (
                <button
                  key={filter}
                  className="px-4 py-2 border border-gray-300 rounded-full hover:border-red-600 hover:bg-red-50 transition-colors"
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products with Conversion Stack */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Featured Collection</h2>
            <p className="text-xl text-gray-600">Handpicked styles just for you</p>
            {/* Debug Info */}
            <p className="text-sm text-gray-500 mt-2">
              Screen: {deviceInfo.screenWidth}px | 
              {deviceInfo.screenWidth >= 1024 ? ' Desktop (5 cols)' : 
               deviceInfo.screenWidth >= 768 ? ' Tablet (3 cols)' : 
               deviceInfo.screenWidth >= 640 ? ' Small (2 cols)' : ' Mobile (1 col)'}
            </p>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600"></div>
            </div>
          ) : (
            <div
              className="grid gap-4 md:gap-6"
              style={{ gridTemplateColumns: deviceInfo.screenWidth >= 768 ? 'repeat(5, minmax(0, 1fr))' : 'repeat(1, minmax(0, 1fr))' }}
            >
              {featuredProducts.slice(0, 15).map((product, index) => (
                <motion.div
                  key={product._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="group relative bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300"
                >
                  {/* Product Image */}
                  <div className="relative aspect-[3/4] overflow-hidden">
                    <img
                      src={product.mainImage}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      loading="lazy"
                    />
                    
                    {/* Badges */}
                    <div className="absolute top-3 left-3 flex flex-col gap-2">
                      {product.isNew && (
                        <span className="bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full">NEW</span>
                      )}
                      {product.discountPercentage > 0 && (
                        <span className="bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                          -{product.discountPercentage}%
                        </span>
                      )}
                    </div>

                    {/* Quick Actions */}
                    <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg hover:bg-red-50 transition-colors">
                        <HeartIcon className="h-5 w-5 text-gray-700" />
                      </button>
                      <button className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg hover:bg-purple-50 transition-colors">
                        <CubeIcon className="h-5 w-5 text-gray-700" />
                      </button>
                    </div>

                    {/* Quick Add to Cart */}
                    <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleAddToCart(product)}
                        className="w-full bg-white text-gray-900 py-2 rounded-lg font-semibold hover:bg-red-600 hover:text-white transition-colors"
                      >
                        Quick Add
                      </button>
                    </div>
                  </div>

                  {/* Product Info */}
                  <div className="p-4">
                    <h3 className="font-semibold text-lg mb-2 line-clamp-2">{product.name}</h3>
                    
                    {/* AI Review Summary */}
                    <div className="flex items-center gap-2 mb-3">
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <StarSolid
                            key={i}
                            className={`h-4 w-4 ${i < Math.floor(product.averageRating || 4.5) ? 'text-yellow-400' : 'text-gray-300'}`}
                          />
                        ))}
                      </div>
                      <span className="text-sm text-gray-600">({product.totalReviews || 0})</span>
                    </div>

                    {/* Price */}
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-2xl font-bold text-red-600">
                          {product.price?.toLocaleString()} RWF
                        </div>
                        {product.originalPrice && product.originalPrice > product.price && (
                          <div className="text-sm text-gray-500 line-through">
                            {product.originalPrice.toLocaleString()} RWF
                          </div>
                        )}
                      </div>
                      <Link
                        to={`/product/${product._id}`}
                        onClick={() => trackEvent('view_item', { 
                          currency: 'RWF', 
                          value: product.price, 
                          items: [{ item_id: product._id, item_name: product.name }] 
                        })}
                        className="text-red-600 hover:text-red-700 font-medium"
                      >
                        View →
                      </Link>
                    </div>

                    {/* Stock Status */}
                    {product.stockQuantity < 10 && (
                      <div className="mt-2 text-xs text-red-600 font-medium">
                        ⚡ Only {product.stockQuantity} left in stock!
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Bundle Builder Section */}
      <section className="py-16 bg-gradient-to-r from-purple-100 to-pink-100">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">🎁 Build Your Perfect Bundle</h2>
            <p className="text-xl text-gray-600">Mix & match and save up to 20%</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { title: 'Complete Outfit', discount: '20%', items: 'Dress + Accessories + Shoes' },
              { title: 'Casual Combo', discount: '15%', items: 'Top + Bottom + Bag' },
              { title: 'Party Pack', discount: '25%', items: 'Dress + Jewelry + Clutch' }
            ].map((bundle, index) => (
              <motion.div
                key={index}
                whileHover={{ scale: 1.05 }}
                className="bg-white rounded-2xl p-6 shadow-lg cursor-pointer"
                onClick={() => trackEvent('bundle_add', { bundle_name: bundle.title })}
              >
                <div className="text-center">
                  <div className="text-4xl mb-4">🎁</div>
                  <h3 className="text-2xl font-bold mb-2">{bundle.title}</h3>
                  <div className="text-3xl font-bold text-purple-600 mb-2">Save {bundle.discount}</div>
                  <p className="text-gray-600 mb-4">{bundle.items}</p>
                  <button className="w-full bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors">
                    Build Bundle
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Shop the Look - Shoppable UGC */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">📸 Shop The Look</h2>
            <p className="text-xl text-gray-600">Featured products from our collection</p>
          </div>

          <div
            className="grid gap-4"
            style={{ gridTemplateColumns: deviceInfo.screenWidth >= 768 ? 'repeat(5, minmax(0, 1fr))' : 'repeat(1, minmax(0, 1fr))' }}
          >
            {featuredProducts.slice(8, 18).map((product, i) => (
              <motion.div
                key={product._id || i}
                whileHover={{ scale: 1.05 }}
                className="relative aspect-square rounded-2xl overflow-hidden cursor-pointer group"
              >
                <img
                  src={product.mainImage || 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=400&h=400&fit=crop'}
                  alt={product.name}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Link
                    to={`/product/${product._id}`}
                    className="bg-white text-gray-900 px-6 py-3 rounded-full font-semibold hover:bg-gray-100"
                  >
                    Shop This Look
                  </Link>
                </div>
                <div className="absolute top-3 left-3">
                  <div className="flex items-center gap-1 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1">
                    <HeartSolid className="h-4 w-4 text-red-500" />
                    <span className="text-sm font-medium">{product.totalReviews || 0}</span>
                  </div>
                </div>
                <div className="absolute bottom-3 left-3 right-3 bg-white/90 backdrop-blur-sm rounded-lg p-2">
                  <p className="text-sm font-semibold truncate">{product.name}</p>
                  <p className="text-xs text-red-600 font-bold">{product.price?.toLocaleString()} RWF</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Service Features - Proactive Chat, ETA, Alerts */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            {[
              { icon: ChatBubbleLeftRightIcon, title: '24/7 Live Chat', desc: 'Get instant help from our style experts' },
              { icon: TruckIcon, title: 'Fast Delivery', desc: 'Track your order in real-time with ETA' },
              { icon: BellIcon, title: 'Smart Alerts', desc: 'Back-in-stock & price drop notifications' },
              { icon: GiftIcon, title: 'Loyalty Rewards', desc: 'Earn points with every purchase' }
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <feature.icon className="h-8 w-8 text-purple-600" />
                </div>
                <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Recent Purchases - Social Proof */}
      <AnimatePresence>
        {recentPurchases.map((purchase, index) => (
          <motion.div
            key={index}
            initial={{ x: -300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -300, opacity: 0 }}
            className="fixed bottom-24 left-4 bg-white rounded-lg shadow-xl p-4 max-w-xs z-40"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white font-bold">
                {purchase.name[0]}
              </div>
              <div className="flex-1">
                <div className="font-semibold">{purchase.name}</div>
                <div className="text-sm text-gray-600">just purchased {purchase.item}</div>
                <div className="text-xs text-gray-500">{purchase.time}</div>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Micro Cart */}
      <AnimatePresence>
        {showMicroCart && (
          <motion.div
            initial={{ x: 300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 300, opacity: 0 }}
            className="fixed top-24 right-4 bg-white rounded-2xl shadow-2xl p-6 max-w-sm z-50"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">Added to Cart! 🎉</h3>
              <button onClick={() => setShowMicroCart(false)} className="text-gray-400 hover:text-gray-600">×</button>
            </div>
            <div className="flex gap-4 mb-4">
              <div className="w-20 h-20 bg-gray-200 rounded-lg"></div>
              <div className="flex-1">
                <div className="font-semibold">Product added</div>
                <div className="text-sm text-gray-600">Cart total: {getCartCount()} items</div>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowMicroCart(false)}
                className="flex-1 border border-gray-300 py-2 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Continue Shopping
              </button>
              <Link
                to="/cart"
                onClick={() => trackEvent('begin_checkout', { cart_items: getCartCount() })}
                className="flex-1 bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 transition-colors text-center"
              >
                View Cart
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sticky CTA */}
      <AnimatePresence>
        {showStickyCTA && (
          <motion.div
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-2xl z-40 py-4"
          >
            <div className="max-w-7xl mx-auto px-4 flex items-center justify-between">
              <div>
                <div className="font-bold text-lg">Don't miss out!</div>
                <div className="text-sm text-gray-600">Limited time offers on featured items</div>
              </div>
              <Link
                to="/shop"
                className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-3 rounded-full font-semibold hover:from-purple-700 hover:to-pink-700 transition-all"
              >
                Shop Now
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Performance Optimization: Lazy Load Images, AVIF Support */}
      <noscript>
        <style>{`
          img[loading="lazy"] {
            display: block;
          }
        `}</style>
      </noscript>
    </div>
  );
};

export default HomeAdvanced;
