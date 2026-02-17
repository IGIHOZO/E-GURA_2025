import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useSearchParams } from 'react-router-dom';
import ProductMedia from '../components/ProductMedia';
import { 
  AdjustmentsHorizontalIcon,
  XMarkIcon,
  Squares2X2Icon,
  ListBulletIcon,
  StarIcon,
  HeartIcon,
  ShoppingCartIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid';
import { useCart } from '../context/CartContext';
import useResponsive from '../hooks/useResponsive';
import axios from 'axios';

// Memoized product card with optimized animations
const ProductCard = React.memo(({ product, wishlist, onToggleWishlist, onAddToCart, index }) => {
  const isWishlisted = wishlist.includes(product._id);
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: 0.3, 
        delay: index * 0.05,
        ease: [0.25, 0.46, 0.45, 0.94] // Optimized easing
      }}
      className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 group overflow-hidden"
    >
      <div className="relative aspect-square overflow-hidden">
        <img
          src={product.mainImage || '/placeholder-product.jpg'}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
        
        <button
          onClick={() => onToggleWishlist(product._id)}
          className="absolute top-3 right-3 p-2 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white transition-all duration-200 transform hover:scale-110"
        >
          {isWishlisted ? (
            <HeartIconSolid className="h-4 w-4 text-red-500" />
          ) : (
            <HeartIcon className="h-4 w-4 text-gray-600" />
          )}
        </button>
        
        {product.originalPrice && product.originalPrice > product.price && (
          <div className="absolute top-3 left-3 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-medium">
            -{Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}%
          </div>
        )}
      </div>
      
      <div className="p-4">
        <Link to={`/product/${product._id}`} className="block">
          <h3 className="font-semibold text-gray-900 hover:text-orange-600 transition-colors line-clamp-2 mb-2">
            {product.name}
          </h3>
        </Link>
        
        <div className="flex items-center mb-2">
          <div className="flex items-center">
            {[...Array(5)].map((_, i) => (
              <StarIcon
                key={i}
                className={`h-3 w-3 ${
                  i < Math.floor(product.rating || 0) ? 'text-yellow-400 fill-current' : 'text-gray-300'
                }`}
              />
            ))}
          </div>
          <span className="text-xs text-gray-500 ml-1">({product.reviews || 0})</span>
        </div>
        
        <div className="flex items-center justify-between">
          <div>
            <span className="text-lg font-bold text-gray-900">
              RWF {product.price?.toLocaleString()}
            </span>
            {product.originalPrice && product.originalPrice > product.price && (
              <span className="text-sm text-gray-500 line-through ml-1">
                RWF {product.originalPrice.toLocaleString()}
              </span>
            )}
          </div>
          
          <button
            onClick={() => onAddToCart(product)}
            className="bg-orange-500 hover:bg-orange-600 text-white p-2 rounded-lg transition-all duration-200 transform hover:scale-105"
          >
            <ShoppingCartIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
});

// Intersection Observer hook for infinite scroll
const useIntersectionObserver = (callback, options = {}) => {
  const targetRef = useRef(null);

  useEffect(() => {
    const target = targetRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        callback();
      }
    }, {
      threshold: 0.1,
      rootMargin: '100px',
      ...options
    });

    observer.observe(target);

    return () => {
      if (target) observer.unobserve(target);
    };
  }, [callback, options]);

  return targetRef;
};

const ShopOptimized = () => {
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get('search') || '';
  const { isMobile, isTablet } = useResponsive();
  
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState('grid');
  const [sortBy, setSortBy] = useState('featured');
  const [showFilters, setShowFilters] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [wishlist, setWishlist] = useState([]);
  
  // Dynamic filter options from database
  const [availableCategories, setAvailableCategories] = useState([]);
  const [availableBrands, setAvailableBrands] = useState([]);
  const [availableColors, setAvailableColors] = useState([]);
  const [availableSizes, setAvailableSizes] = useState([]);
  
  const [filters, setFilters] = useState({
    categories: [],
    priceRange: [0, 1000000],
    rating: 0,
    colors: [],
    sizes: [],
    brands: []
  });

  const { addToCart } = useCart();
  const itemsPerPage = isMobile ? 12 : 20;
  
  const sortOptions = [
    { value: 'featured', label: 'Recommended' },
    { value: 'orders', label: 'Orders' },
    { value: 'price-asc', label: 'Price ↑' },
    { value: 'price-desc', label: 'Price ↓' },
    { value: 'newest', label: 'Newest' }
  ];

  // Optimized product fetching with server-side pagination
  const fetchProducts = useCallback(async (pageNum = 1, reset = false) => {
    if (pageNum === 1) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }

    try {
      const queryParams = new URLSearchParams({
        query: searchQuery,
        page: pageNum.toString(),
        limit: itemsPerPage.toString(),
        sortBy: sortBy,
        ...Object.fromEntries(
          Object.entries(filters).map(([key, value]) => [
            key,
            Array.isArray(value) ? value.join(',') : value.toString()
          ])
        )
      });

      const response = await axios.get(`/api/products/search?${queryParams}`);
      
      if (response.data.success && response.data.data) {
        const newProducts = response.data.data;
        const pagination = response.data.pagination;
        
        if (reset || pageNum === 1) {
          setProducts(newProducts);
        } else {
          setProducts(prev => [...prev, ...newProducts]);
        }
        
        setHasMore(pagination?.hasMore ?? newProducts.length === itemsPerPage);
        setPage(pageNum);
        
        if (pageNum === 1) {
          extractFilterOptions(newProducts);
        }
      } else {
        // Fallback to mock data if API fails
        const mockProducts = getMockProducts();
        setProducts(mockProducts);
        extractFilterOptions(mockProducts);
        setHasMore(false);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      if (pageNum === 1) {
        const mockProducts = getMockProducts();
        setProducts(mockProducts);
        extractFilterOptions(mockProducts);
      }
      setHasMore(false);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [searchQuery, itemsPerPage, sortBy, filters]);

  // Load more products for infinite scroll
  const loadMore = useCallback(() => {
    if (!loadingMore && hasMore) {
      fetchProducts(page + 1, false);
    }
  }, [fetchProducts, page, loadingMore, hasMore]);

  // Intersection observer for infinite scroll
  const loadMoreRef = useIntersectionObserver(loadMore);

  // Extract unique filter options from products
  const extractFilterOptions = useCallback((productList) => {
    const categories = [...new Set(productList.map(p => p.category).filter(Boolean))];
    setAvailableCategories(categories);

    const brands = [...new Set(productList.map(p => p.brand).filter(Boolean))];
    setAvailableBrands(brands);

    const colors = [...new Set(productList.flatMap(p => p.colors || []))];
    setAvailableColors(colors);

    const sizes = [...new Set(productList.flatMap(p => p.sizes || []))];
    setAvailableSizes(sizes);
  }, []);

  const getMockProducts = () => {
    const mockData = [
      { name: 'Wireless Bluetooth Headphones', img: 'photo-1505740420928-5e560c06d30e', cat: 'Electronics', price: 25000, brand: 'Sony', colors: ['Black', 'White'] },
      { name: 'Smart Watch Fitness Tracker', img: 'photo-1523275335684-37898b6baf30', cat: 'Electronics', price: 45000, brand: 'Apple', colors: ['Black', 'Blue'] },
      { name: 'Designer Backpack Premium', img: 'photo-1553062407-98eeb64c6a62', cat: 'Fashion', price: 35000, brand: 'Nike', colors: ['Black', 'Blue'], sizes: ['M', 'L'] },
      { name: 'Running Shoes Comfortable', img: 'photo-1542291026-7eec264c27ff', cat: 'Sports', price: 55000, brand: 'Adidas', colors: ['Red', 'White'], sizes: ['S', 'M', 'L', 'XL'] },
      { name: 'Portable Bluetooth Speaker', img: 'photo-1608043152269-423dbba4e7e1', cat: 'Electronics', price: 18000, brand: 'Sony', colors: ['Black', 'Red'] },
      { name: 'UV Protection Sunglasses', img: 'photo-1572635196237-14b3f281503f', cat: 'Fashion', price: 12000, brand: 'Zara', colors: ['Black'] },
      { name: 'Yoga Mat Premium', img: 'photo-1601925260368-ae2f83cf8b7f', cat: 'Sports', price: 8000, brand: 'Nike', colors: ['Purple', 'Pink'], sizes: ['M'] },
      { name: 'Automatic Coffee Maker', img: 'photo-1517668808822-9ebb02f2a0e6', cat: 'Home', price: 65000, brand: 'LG', colors: ['Black'] }
    ];
    
    return mockData.map((item, i) => ({
      _id: `mock-${i + 1}`,
      id: `mock-${i + 1}`,
      name: item.name,
      price: item.price,
      originalPrice: Math.floor(item.price * 1.3),
      mainImage: `https://images.unsplash.com/${item.img}?w=400&h=400&fit=crop`,
      category: item.cat,
      brand: item.brand,
      colors: item.colors || [],
      sizes: item.sizes || [],
      rating: (Math.random() * 1.5 + 3.5).toFixed(1),
      reviews: Math.floor(Math.random() * 1000 + 100),
      sold: 0,
      inStock: true
    }));
  };

  const toggleFilter = useCallback((filterType, value) => {
    setFilters(prev => {
      const current = prev[filterType];
      if (Array.isArray(current)) {
        return {
          ...prev,
          [filterType]: current.includes(value)
            ? current.filter(item => item !== value)
            : [...current, value]
        };
      }
      return prev;
    });
  }, []);

  const toggleWishlist = useCallback((productId) => {
    setWishlist(prev => 
      prev.includes(productId) ? prev.filter(id => id !== productId) : [...prev, productId]
    );
  }, []);

  const handleAddToCart = useCallback((product) => {
    addToCart(product);
  }, [addToCart]);

  // Reset and fetch when filters or sort change
  useEffect(() => {
    fetchProducts(1, true);
  }, [searchQuery, sortBy, filters]);

  // Initial load
  useEffect(() => {
    fetchProducts(1, true);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading products...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Shop</h1>
              <p className="text-gray-600">{products.length} products found</p>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* View Mode Toggle */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-orange-100 text-orange-600' : 'text-gray-600 hover:bg-gray-100'}`}
                >
                  <Squares2X2Icon className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg ${viewMode === 'list' ? 'bg-orange-100 text-orange-600' : 'text-gray-600 hover:bg-gray-100'}`}
                >
                  <ListBulletIcon className="h-5 w-5" />
                </button>
              </div>
              
              {/* Sort Dropdown */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                {sortOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              
              {/* Filters Toggle */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center space-x-2 bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors"
              >
                <AdjustmentsHorizontalIcon className="h-5 w-5" />
                <span>Filters</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className={`grid gap-6 ${
          viewMode === 'grid' 
            ? `grid-cols-2 ${isMobile ? '' : 'md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'}` 
            : 'grid-cols-1 md:grid-cols-2'
        }`}>
          <AnimatePresence>
            {products.map((product, index) => (
              <ProductCard
                key={product._id}
                product={product}
                wishlist={wishlist}
                onToggleWishlist={toggleWishlist}
                onAddToCart={handleAddToCart}
                index={index % itemsPerPage} // Reset animation delay for new pages
              />
            ))}
          </AnimatePresence>
        </div>

        {/* Infinite Scroll Trigger */}
        {hasMore && (
          <div ref={loadMoreRef} className="flex justify-center py-8">
            {loadingMore ? (
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-2"></div>
                <p className="text-gray-600">Loading more products...</p>
              </div>
            ) : (
              <div className="text-gray-500">Scroll to load more</div>
            )}
          </div>
        )}

        {/* End of Results */}
        {!hasMore && products.length > 0 && (
          <div className="text-center py-8">
            <p className="text-gray-600">You've seen all products!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ShopOptimized;
