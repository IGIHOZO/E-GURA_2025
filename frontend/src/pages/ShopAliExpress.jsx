import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
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
import { usePersonalization } from '../hooks/usePersonalization';

const ShopAliExpress = () => {
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get('search') || '';
  const { trackSearch } = usePersonalization();
  const { isMobile, isTablet } = useResponsive();
  
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalProducts, setTotalProducts] = useState(0);
  const [pageCount, setPageCount] = useState(0);
  const [viewMode, setViewMode] = useState('grid');
  const [sortBy, setSortBy] = useState('featured');
  const [showFilters, setShowFilters] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [wishlist, setWishlist] = useState([]);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const PRODUCTS_PER_PAGE = 24;
  
  // Dynamic filter options from database
  const [availableCategories, setAvailableCategories] = useState([]);
  const [availableBrands, setAvailableBrands] = useState([]);
  const [availableColors, setAvailableColors] = useState([]);
  const [availableSizes, setAvailableSizes] = useState([]);
  
  const defaultFilters = useRef({
    categories: [],
    priceRange: [0, 1000000],
    rating: 0,
    colors: [],
    sizes: [],
    brands: []
  }).current;

  const [filters, setFilters] = useState(defaultFilters);

  const { addToCart } = useCart();
  
  const sortOptions = [
    { value: 'featured', label: 'Recommended' },
    { value: 'orders', label: 'Orders' },
    { value: 'price-asc', label: 'Price ↑' },
    { value: 'price-desc', label: 'Price ↓' },
    { value: 'newest', label: 'Newest' }
  ];

  // Determine which filters to show based on selected categories
  const getRelevantFilters = useCallback(() => {
    const selectedCategories = filters.categories;
    if (selectedCategories.length === 0) {
      return { showColors: true, showSizes: true, showBrands: true };
    }

    const showColors = selectedCategories.some((cat) => ['Fashion', 'Sports', 'Beauty', 'Toys'].includes(cat));
    const showSizes = selectedCategories.some((cat) => ['Fashion', 'Sports'].includes(cat));

    return { showColors, showSizes, showBrands: true };
  }, [filters.categories]);

  const filtersKey = useMemo(() => JSON.stringify(filters), [filters]);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page: currentPage,
        limit: PRODUCTS_PER_PAGE,
        sort: sortBy,
        search: searchQuery || undefined,
        categories: filters.categories.join(',') || undefined,
        brands: filters.brands.join(',') || undefined,
        colors: filters.colors.join(',') || undefined,
        sizes: filters.sizes.join(',') || undefined,
        minPrice: filters.priceRange[0] > 0 ? filters.priceRange[0] : undefined,
        maxPrice: filters.priceRange[1] < 1000000 ? filters.priceRange[1] : undefined,
        rating: filters.rating || undefined
      };

      const response = await axios.get('/api/products', { params });

      if (response.data?.success) {
        const fetchedProducts = response.data.data || [];
        const pagination = response.data.pagination || {};
        setProducts(fetchedProducts);
        setTotalProducts(pagination.total || fetchedProducts.length);
        setPageCount(pagination.pages || 1);
        extractFilterOptions(fetchedProducts);
        
        // Track search query
        if (searchQuery && searchQuery.trim()) {
          trackSearch(searchQuery);
        }
      } else {
        console.warn('⚠️ /api/products did not return data, falling back to empty list');
        setProducts([]);
        setTotalProducts(0);
        setPageCount(0);
        extractFilterOptions([]);
      }
    } catch (error) {
      console.error('❌ Error fetching products for AliExpress shop:', error);
      setProducts([]);
      setTotalProducts(0);
      setPageCount(0);
      extractFilterOptions([]);
    } finally {
      setLoading(false);
    }
  }, [currentPage, filters, PRODUCTS_PER_PAGE, searchQuery, sortBy]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Add category click handler for home page category links
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const categoryParam = urlParams.get('category');
    if (categoryParam && !filters.categories.includes(categoryParam)) {
      setFilters(prev => ({
        ...prev,
        categories: [categoryParam]
      }));
    }
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, sortBy, filtersKey]);

  // Extract unique filter options from products
  const extractFilterOptions = (productList) => {
    // Extract unique categories
    const categories = [...new Set(productList.map(p => p.category).filter(Boolean))];
    setAvailableCategories(categories);

    // Extract unique brands
    const brands = [...new Set(productList.map(p => p.brand).filter(Boolean))];
    setAvailableBrands(brands);

    // Extract unique colors
    const colors = [...new Set(productList.flatMap(p => p.colors || []))];
    setAvailableColors(colors);

    // Extract unique sizes
    const sizes = [...new Set(productList.flatMap(p => p.sizes || []))];
    setAvailableSizes(sizes);
  };

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
      mainImage: `https://images.unsplash.com/${item.img}?w=300&h=300&fit=crop`,
      category: item.cat,
      brand: item.brand,
      colors: item.colors || [],
      sizes: item.sizes || [],
      inStock: true
    }));
  };

  const paginatedProducts = useMemo(() => products, [products]);

  const handlePageChange = (page) => {
    if (page < 1 || (pageCount && page > pageCount)) {
      return;
    }
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleFilter = (filterType, value) => {
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
  };

  const toggleWishlist = (productId) => {
    setWishlist(prev => 
      prev.includes(productId) ? prev.filter(id => id !== productId) : [...prev, productId]
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 overflow-x-hidden">
      {/* Top Bar - Similar to AliExpress */}
      <div className="bg-white border-b sticky top-16 z-40 w-full overflow-hidden">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 py-3 w-full">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3 sm:space-x-6">
                <h1 className="text-base sm:text-lg font-bold text-gray-900">
                  {searchQuery ? `Search: "${searchQuery}"` : 'All Products'}
                </h1>
                <span className="text-xs sm:text-sm text-gray-500">
                  {totalProducts} {isMobile ? '' : 'results'}
                </span>
              </div>
              
              {/* Mobile Filter Button */}
              {isMobile && (
                <button
                  onClick={() => setShowMobileFilters(true)}
                  className="flex items-center gap-2 px-3 py-2 bg-orange-500 text-white rounded-lg min-h-[44px] font-medium text-sm"
                >
                  <AdjustmentsHorizontalIcon className="h-5 w-5" />
                  Filters
                </button>
              )}
            </div>

            <div className="flex items-center space-x-3 sm:space-x-4">
              {/* Sort Dropdown */}
              <div className="flex items-center space-x-2 text-xs sm:text-sm flex-1 sm:flex-none">
                <span className="text-gray-600 hidden sm:inline">Sort:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="flex-1 sm:flex-none border border-gray-300 rounded px-2 sm:px-3 py-2 text-xs sm:text-sm focus:outline-none focus:border-orange-500 min-h-[44px]"
                >
                  {sortOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              {/* View Toggle - Hide on mobile */}
              <div className="hidden sm:flex border border-gray-300 rounded overflow-hidden">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 transition-colors ${viewMode === 'grid' ? 'bg-orange-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                >
                  <Squares2X2Icon className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 border-l border-gray-300 transition-colors ${viewMode === 'list' ? 'bg-orange-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                >
                  <ListBulletIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-2 sm:px-4 py-2 sm:py-4 w-full">
        <div className="flex gap-0 sm:gap-4 w-full">
          {/* Sidebar Filters - Hidden on mobile */}
          {!isMobile && (
          <div className="w-56 flex-shrink-0">
            <div className="bg-white rounded-lg shadow-sm p-4 sticky top-36">
              <div className="space-y-6 max-h-[calc(100vh-250px)] overflow-y-auto pr-2">
                {/* Category Filter */}
                {availableCategories.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold text-gray-700 mb-2 uppercase">Category</h4>
                    <div className="space-y-1.5">
                      {availableCategories.map(category => (
                        <label key={category} className="flex items-center cursor-pointer hover:bg-gray-50 p-1 rounded">
                          <input
                            type="checkbox"
                            checked={filters.categories.includes(category)}
                            onChange={() => toggleFilter('categories', category)}
                            className="w-4 h-4 text-orange-500 border-gray-300 rounded focus:ring-orange-500"
                          />
                          <span className="ml-2 text-sm text-gray-700">{category}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* Price Range Filter */}
                <div>
                  <h4 className="text-xs font-semibold text-gray-700 mb-2 uppercase">Price Range</h4>
                  <input
                    type="range"
                    min="0"
                    max="1000000"
                    step="10000"
                    value={filters.priceRange[1]}
                    onChange={(e) => setFilters(prev => ({ ...prev, priceRange: [0, parseInt(e.target.value)] }))}
                    className="w-full accent-orange-500"
                  />
                  <div className="flex justify-between text-xs text-gray-600 mt-1">
                    <span>0</span>
                    <span>{(filters.priceRange[1] / 1000).toFixed(0)}K</span>
                  </div>
                </div>

            {/* Color Filter - Show for Fashion/Sports/Beauty */}
            {getRelevantFilters().showColors && availableColors.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-gray-700 mb-2 uppercase">Color</h4>
                <div className="flex flex-wrap gap-2">
                  {availableColors.map(color => (
                    <button
                      key={color}
                      onClick={() => toggleFilter('colors', color)}
                      className={`px-3 py-1.5 rounded-full text-xs border-2 transition-all ${
                        filters.colors.includes(color)
                          ? 'border-orange-500 bg-orange-50 text-orange-700'
                          : 'border-gray-300 text-gray-700 hover:border-gray-400'
                      }`}
                    >
                      {color}
                    </button>
                  ))}
                </div>
              </div>
            )}
              </div>
            </div>
          </div>
          )}
          
          {/* Mobile Filters - Drawer */}
          {isMobile && showMobileFilters && (
            <div className="fixed inset-0 bg-black bg-opacity-50 z-50" onClick={() => setShowMobileFilters(false)}>
              <div className="fixed inset-y-0 left-0 w-80 max-w-[85vw] bg-white overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                <div className="sticky top-0 bg-white border-b p-4 flex items-center justify-between z-10">
                  <h3 className="text-lg font-bold">Filters</h3>
                  <button
                    onClick={() => setShowMobileFilters(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg min-h-[44px] min-w-[44px]"
                  >
                    <XMarkIcon className="w-6 h-6" />
                  </button>
                </div>
                <div className="p-4 space-y-6">
                  {/* Copy all filter sections from desktop sidebar */}
                  {availableCategories.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 mb-3 uppercase">Categories</h4>
                      <div className="space-y-2">
                        {availableCategories.map(category => (
                          <label key={category} className="flex items-center cursor-pointer hover:bg-gray-50 p-2 rounded">
                            <input
                              type="checkbox"
                              checked={filters.categories.includes(category)}
                              onChange={() => toggleFilter('categories', category)}
                              className="w-5 h-5 text-orange-500 border-gray-300 rounded focus:ring-orange-500"
                            />
                            <span className="ml-3 text-sm text-gray-700">{category}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-3 uppercase">Price Range</h4>
                    <input
                      type="range"
                      min="0"
                      max="1000000"
                      step="10000"
                      value={filters.priceRange[1]}
                      onChange={(e) => setFilters(prev => ({ ...prev, priceRange: [0, parseInt(e.target.value)] }))}
                      className="w-full accent-orange-500"
                    />
                    <div className="flex justify-between text-sm text-gray-600 mt-2">
                      <span>0</span>
                      <span>{(filters.priceRange[1] / 1000).toFixed(0)}K RWF</span>
                    </div>
                  </div>
                  
                  {availableColors.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 mb-3 uppercase">Color</h4>
                      <div className="flex flex-wrap gap-2">
                        {availableColors.map(color => (
                          <button
                            key={color}
                            onClick={() => toggleFilter('colors', color)}
                            className={`px-4 py-2 rounded-full text-sm border-2 transition-all min-h-[44px] ${
                              filters.colors.includes(color)
                                ? 'border-orange-500 bg-orange-50 text-orange-700'
                                : 'border-gray-300 text-gray-700 hover:border-gray-400'
                            }`}
                          >
                            {color}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {availableSizes.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 mb-3 uppercase">Size</h4>
                      <div className="flex flex-wrap gap-2">
                        {availableSizes.map(size => (
                          <button
                            key={size}
                            onClick={() => toggleFilter('sizes', size)}
                            className={`px-4 py-2 rounded text-sm border-2 font-medium transition-all min-h-[44px] ${
                              filters.sizes.includes(size)
                                ? 'border-orange-500 bg-orange-50 text-orange-700'
                                : 'border-gray-300 text-gray-700 hover:border-gray-400'
                            }`}
                          >
                            {size}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {availableBrands.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 mb-3 uppercase">Brand</h4>
                      <div className="space-y-2">
                        {availableBrands.map(brand => (
                          <label key={brand} className="flex items-center cursor-pointer hover:bg-gray-50 p-2 rounded">
                            <input
                              type="checkbox"
                              checked={filters.brands.includes(brand)}
                              onChange={() => toggleFilter('brands', brand)}
                              className="w-5 h-5 text-orange-500 border-gray-300 rounded focus:ring-orange-500"
                            />
                            <span className="ml-3 text-sm text-gray-700">{brand}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="sticky bottom-0 bg-white border-t p-4">
                  <button
                    onClick={() => setShowMobileFilters(false)}
                    className="w-full py-3 bg-orange-500 text-white rounded-lg font-bold hover:bg-orange-600 transition-colors min-h-[48px]"
                  >
                    Apply Filters
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Products Grid */}
          <div className="flex-1 w-full overflow-hidden">
            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-3">
                {[...Array(10)].map((_, i) => (
                  <div key={i} className="bg-white rounded h-80 animate-pulse"></div>
                ))}
              </div>
            ) : (
              <div className={viewMode === 'grid' 
                ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-3'
                : 'space-y-3'
              }>
                {paginatedProducts.map((product, index) => (
                  <motion.div
                    key={product._id || product.id || `product-${index}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.02 }}
                  >
                    <Link
                      to={`/product/${product._id || product.id}`}
                      className="block bg-white rounded-lg border border-gray-200 hover:shadow-lg transition-all group"
                    >
                      <div className="relative overflow-hidden">
                        <ProductMedia
                          src={product.mainImage || product.image}
                          alt={product.name}
                          className="w-full h-48 object-cover group-hover:scale-105 transition-transform"
                          playOnHover={true}
                          generateThumbnail={true}
                          muted={true}
                          loop={true}
                        />
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            toggleWishlist(product._id);
                          }}
                          className="absolute top-2 right-2 bg-white rounded-full p-1.5 shadow hover:bg-red-50"
                        >
                          {wishlist.includes(product._id) ? (
                            <HeartIconSolid className="h-4 w-4 text-red-500" />
                          ) : (
                            <HeartIcon className="h-4 w-4 text-gray-600" />
                          )}
                        </button>
                      </div>

                      <div className="p-2">
                        <h3 className="text-xs text-gray-900 line-clamp-2 mb-2 h-8">
                          {product.name}
                        </h3>

                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <div className="flex items-baseline space-x-1">
                              <span className="text-lg font-bold text-red-600">
                                {(product.price || 0).toLocaleString()}
                              </span>
                              <span className="text-xs text-gray-500">RWF</span>
                            </div>
                            {product.originalPrice && (
                              <div className="text-xs text-gray-400 line-through">
                                {product.originalPrice.toLocaleString()}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <div className="flex items-center">
                            <StarIcon className="h-3 w-3 text-yellow-400 fill-current mr-0.5" />
                            <span>
                              {(() => {
                                const ratingValue = Number(product.averageRating);
                                return Number.isFinite(ratingValue)
                                  ? ratingValue.toFixed(1)
                                  : 'No rating';
                              })()}
                            </span>
                          </div>
                          {typeof product.salesCount === 'number' && (
                            <span>{product.salesCount} sold</span>
                          )}
                        </div>

                        <div className="mt-2 flex items-center text-xs text-green-600">
                          <span className="font-medium">Free shipping</span>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {!loading && pageCount > 1 && (
              <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-lg border border-gray-200">
                <div className="text-sm text-gray-600">
                  {totalProducts > 0
                    ? `Showing ${((currentPage - 1) * PRODUCTS_PER_PAGE) + 1} - ${Math.min(currentPage * PRODUCTS_PER_PAGE, totalProducts)} of ${totalProducts} products`
                    : 'No products found'}
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Previous
                  </button>
                  
                  <div className="flex items-center gap-1">
                    {[...Array(pageCount)].map((_, i) => {
                      const page = i + 1;
                      // Show first page, last page, current page, and 2 pages around current
                      if (
                        page === 1 ||
                        page === pageCount ||
                        (page >= currentPage - 1 && page <= currentPage + 1)
                      ) {
                        return (
                          <button
                            key={page}
                            onClick={() => handlePageChange(page)}
                            className={`w-10 h-10 rounded-lg transition-colors ${
                              page === currentPage
                                ? 'bg-orange-500 text-white font-semibold'
                                : 'border border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            {page}
                          </button>
                        );
                      } else if (
                        page === currentPage - 2 ||
                        page === currentPage + 2
                      ) {
                        return <span key={page} className="text-gray-400">...</span>;
                      }
                      return null;
                    })}
                  </div>
                  
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === pageCount}
                    className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShopAliExpress;
