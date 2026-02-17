import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, useParams, useNavigate } from 'react-router-dom';
import SEO from '../components/SEO';
import { 
  AdjustmentsHorizontalIcon,
  Squares2X2Icon,
  ListBulletIcon,
  StarIcon,
  HeartIcon,
  ShoppingCartIcon,
  ChevronRightIcon,
  HomeIcon
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid';
import { useCart } from '../context/CartContext';
import useResponsive from '../hooks/useResponsive';
import axios from 'axios';

const CATEGORY_PAGE_SIZE = 24;

const CategoryPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { isMobile, isTablet } = useResponsive();
  
  const [category, setCategory] = useState(null);
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid');
  const [sortBy, setSortBy] = useState('featured');
  const [wishlist, setWishlist] = useState([]);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  
  // Dynamic filter options from products
  const [availableBrands, setAvailableBrands] = useState([]);
  const [availableColors, setAvailableColors] = useState([]);
  const [availableSizes, setAvailableSizes] = useState([]);
  
  const [filters, setFilters] = useState({
    priceRange: [0, 1000000],
    rating: 0,
    colors: [],
    sizes: [],
    brands: []
  });

  const sortOptions = [
    { value: 'featured', label: 'Recommended' },
    { value: 'orders', label: 'Orders' },
    { value: 'price-asc', label: 'Price ↑' },
    { value: 'price-desc', label: 'Price ↓' },
    { value: 'newest', label: 'Newest' }
  ];

  useEffect(() => {
    fetchCategoryAndProducts();
  }, [slug]);

  useEffect(() => {
    applyFiltersAndSort();
  }, [products, filters, sortBy]);

useEffect(() => {
  setCurrentPage(1);
}, [filters, sortBy, products]);

  const fetchCategoryAndProducts = async () => {
    setLoading(true);
    try {
      // Fetch category details
      const categoryResponse = await axios.get(`/api/categories/${slug}`);
      
      if (categoryResponse.data.success && categoryResponse.data.category) {
        const categoryData = categoryResponse.data.category;
        setCategory(categoryData);
        
        console.log('📂 Category loaded:', categoryData);
        console.log('📂 Category name:', categoryData.name);
        console.log('📂 Category ID:', categoryData.id);
        
        // Fetch all products and filter by category
        const productsResponse = await axios.get('/api/products');
        
        if (productsResponse.data.success || productsResponse.data.data) {
          const allProducts = productsResponse.data.data || productsResponse.data;
          
          console.log('📦 Total products:', allProducts.length);
          console.log('📦 Sample product categories:', allProducts.slice(0, 5).map(p => p.category));
          
          // More flexible category matching
          const categoryProducts = allProducts.filter(p => {
            if (!p.category) return false;
            
            const productCategory = p.category.toLowerCase().trim();
            const categoryName = categoryData.name.toLowerCase().trim();
            const categoryId = (categoryData.id || slug).toLowerCase().trim();
            
            // Match by exact name, ID, slug, or partial match
            return (
              productCategory === categoryName ||                    // Exact name: "Kids & Baby"
              productCategory === categoryId ||                      // Category ID: "kids-baby"
              productCategory === slug ||                            // URL slug: "kids-baby"
              productCategory.replace(/[^a-z0-9]/g, '') === categoryName.replace(/[^a-z0-9]/g, '') || // Remove special chars
              productCategory.includes(categoryName.split('&')[0].trim()) || // First part: "Kids"
              categoryName.includes(productCategory)                 // Partial match
            );
          });
          
          console.log('✅ Filtered products:', categoryProducts.length);
          console.log('✅ Matched products:', categoryProducts.map(p => ({ name: p.name, category: p.category })));
          
          setProducts(categoryProducts);
          extractFilterOptions(categoryProducts);
        }
      } else {
        // Category not found
        console.error('Category not found');
        navigate('/shop');
      }
    } catch (error) {
      console.error('Error fetching category:', error);
      navigate('/shop');
    } finally {
      setLoading(false);
    }
  };

  const extractFilterOptions = (productList) => {
    const brands = [...new Set(productList.map(p => p.brand).filter(Boolean))];
    setAvailableBrands(brands);

    const colors = [...new Set(productList.flatMap(p => p.colors || []))];
    setAvailableColors(colors);

    const sizes = [...new Set(productList.flatMap(p => p.sizes || []))];
    setAvailableSizes(sizes);
  };

  const applyFiltersAndSort = () => {
    let filtered = [...products];

    // Price range filter
    filtered = filtered.filter(p => p.price >= filters.priceRange[0] && p.price <= filters.priceRange[1]);

    // Rating filter
    if (filters.rating > 0) {
      filtered = filtered.filter(p => parseFloat(p.rating || 0) >= filters.rating);
    }

    // Color filter
    if (filters.colors.length > 0) {
      filtered = filtered.filter(p => 
        p.colors && p.colors.some(c => filters.colors.includes(c))
      );
    }

    // Size filter
    if (filters.sizes.length > 0) {
      filtered = filtered.filter(p => 
        p.sizes && p.sizes.some(s => filters.sizes.includes(s))
      );
    }

    // Brand filter
    if (filters.brands.length > 0) {
      filtered = filtered.filter(p => filters.brands.includes(p.brand));
    }

    // Sorting
    switch (sortBy) {
      case 'price-asc':
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        filtered.sort((a, b) => b.price - a.price);
        break;
      case 'orders':
        filtered.sort((a, b) => (b.sold || 0) - (a.sold || 0));
        break;
      case 'newest':
        filtered.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
        break;
      default:
        break;
    }

    setFilteredProducts(filtered);
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

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / CATEGORY_PAGE_SIZE));
  const startIndex = (currentPage - 1) * CATEGORY_PAGE_SIZE;
  const paginatedProducts = filteredProducts.slice(startIndex, startIndex + CATEGORY_PAGE_SIZE);
  const showingStart = filteredProducts.length === 0 ? 0 : startIndex + 1;
  const showingEnd = Math.min(filteredProducts.length, startIndex + CATEGORY_PAGE_SIZE);

  const handlePageChange = (pageNumber) => {
    const nextPage = Math.min(Math.max(pageNumber, 1), totalPages);
    if (nextPage === currentPage) return;

    setCurrentPage(nextPage);

    const productsAnchor = document.getElementById('category-products');
    if (productsAnchor) {
      window.scrollTo({
        top: productsAnchor.offsetTop - 120,
        behavior: 'smooth'
      });
    }
  };

  const renderPaginationButtons = () => {
    const buttons = [];
    const maxVisible = 5;
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);

    if (endPage - startPage < maxVisible - 1) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }

    for (let page = startPage; page <= endPage; page++) {
      buttons.push(
        <button
          key={page}
          onClick={() => handlePageChange(page)}
          className={`px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
            currentPage === page
              ? 'bg-orange-500 text-white border-orange-500'
              : 'bg-white text-gray-700 border-gray-300 hover:border-orange-500'
          }`}
        >
          {page}
        </button>
      );
    }

    return buttons;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (!category) {
    return null;
  }

  return (
    <>
      <SEO
        title={`${category.name} - Shop Online | E-Gura Store | Kigali, Rwanda`}
        description={category.description || `Shop ${category.name} products online in Kigali, Rwanda. Best prices, free delivery, and secure mobile money payments at E-Gura Store.`}
        keywords={`${category.name}, ${category.name} Rwanda, buy ${category.name.toLowerCase()} online, Kigali shopping, E-Gura Store, free delivery, mobile money, ${category.name.toLowerCase()} prices`}
        canonicalUrl={`https://egura.rw/category/${slug}`}
        ogImage={category.image || 'https://egura.rw/og-image.jpg'}
        category={{
          name: category.name,
          description: category.description,
          itemCount: products.length,
          items: products.slice(0, 10).map(p => ({ url: `https://egura.rw/product/${p._id}` }))
        }}
      />
      <div className="min-h-screen bg-gray-50">

      {/* Breadcrumb */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <nav className="flex items-center space-x-2 text-sm text-gray-600">
            <Link to="/" className="hover:text-orange-500 flex items-center">
              <HomeIcon className="h-4 w-4" />
            </Link>
            <ChevronRightIcon className="h-4 w-4" />
            <Link to="/shop" className="hover:text-orange-500">Shop</Link>
            <ChevronRightIcon className="h-4 w-4" />
            <span className="text-gray-900 font-medium">{category.name}</span>
          </nav>
        </div>
      </div>

      {/* Category Header */}
      <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center space-x-6">
            {category.icon && (
              <div className="text-6xl">{category.icon}</div>
            )}
            <div>
              <h1 className="text-4xl font-bold mb-2">{category.name}</h1>
              {category.description && (
                <p className="text-lg opacity-90">{category.description}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Top Bar */}
      <div className="bg-white border-b sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3 sm:space-x-6">
                <h2 className="text-base sm:text-lg font-bold text-gray-900">
                  {category.name}
                </h2>
                <span className="text-xs sm:text-sm text-gray-500">
                  {filteredProducts.length} {isMobile ? '' : 'products'}
                </span>
              </div>
              
              {/* Mobile Filter Button */}
              {isMobile && (
                <button
                  onClick={() => setShowMobileFilters(!showMobileFilters)}
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
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex gap-4">
          {/* Sidebar Filters - Hidden on mobile, shown via toggle */}
          {!isMobile && (
          <div className="w-56 flex-shrink-0">
            <div className="bg-white rounded-lg shadow-sm p-4 sticky top-36">
              <div className="space-y-6 max-h-[calc(100vh-250px)] overflow-y-auto pr-2">
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
                    <span>{(filters.priceRange[1] / 1000).toFixed(0)}K RWF</span>
                  </div>
                </div>

                {/* Brand Filter */}
                {availableBrands.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold text-gray-700 mb-2 uppercase">Brand</h4>
                    <div className="space-y-1.5 max-h-40 overflow-y-auto">
                      {availableBrands.map(brand => (
                        <label key={brand} className="flex items-center cursor-pointer hover:bg-gray-50 p-1 rounded">
                          <input
                            type="checkbox"
                            checked={filters.brands.includes(brand)}
                            onChange={() => toggleFilter('brands', brand)}
                            className="w-4 h-4 text-orange-500 border-gray-300 rounded focus:ring-orange-500"
                          />
                          <span className="ml-2 text-sm text-gray-700">{brand}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* Color Filter */}
                {availableColors.length > 0 && (
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

                {/* Size Filter */}
                {availableSizes.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold text-gray-700 mb-2 uppercase">Size</h4>
                    <div className="flex flex-wrap gap-2">
                      {availableSizes.map(size => (
                        <button
                          key={size}
                          onClick={() => toggleFilter('sizes', size)}
                          className={`px-3 py-1.5 rounded text-xs border-2 font-medium transition-all ${
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

                {/* Rating Filter */}
                <div>
                  <h4 className="text-xs font-semibold text-gray-700 mb-2 uppercase">Rating</h4>
                  <div className="space-y-1.5">
                    {[4, 3, 2, 1].map(rating => (
                      <label key={rating} className="flex items-center cursor-pointer hover:bg-gray-50 p-1 rounded">
                        <input
                          type="radio"
                          name="rating"
                          checked={filters.rating === rating}
                          onChange={() => setFilters(prev => ({ ...prev, rating }))}
                          className="w-4 h-4 text-orange-500 border-gray-300 focus:ring-orange-500"
                        />
                        <div className="ml-2 flex items-center">
                          {[...Array(rating)].map((_, i) => (
                            <StarIcon key={i} className="h-3 w-3 text-yellow-400 fill-current" />
                          ))}
                          <span className="ml-1 text-xs text-gray-600">& up</span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
          )}
          
          {/* Mobile Filters - Collapsible */}
          {isMobile && showMobileFilters && (
            <div className="fixed inset-0 bg-black bg-opacity-50 z-50" onClick={() => setShowMobileFilters(false)}>
              <div className="fixed inset-y-0 left-0 w-80 max-w-[85vw] bg-white overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                <div className="sticky top-0 bg-white border-b p-4 flex items-center justify-between z-10">
                  <h3 className="text-lg font-bold">Filters</h3>
                  <button
                    onClick={() => setShowMobileFilters(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg min-h-[44px] min-w-[44px]"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="p-4">
                  <div className="space-y-6">
                    {/* Price Range Filter */}
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

                    {/* Brand Filter */}
                    {availableBrands.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-3 uppercase">Brand</h4>
                        <div className="space-y-2 max-h-48 overflow-y-auto">
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

                    {/* Color Filter */}
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

                    {/* Size Filter */}
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

                    {/* Rating Filter */}
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 mb-3 uppercase">Rating</h4>
                      <div className="space-y-2">
                        {[4, 3, 2, 1].map(rating => (
                          <label key={rating} className="flex items-center cursor-pointer hover:bg-gray-50 p-2 rounded">
                            <input
                              type="radio"
                              name="rating"
                              checked={filters.rating === rating}
                              onChange={() => setFilters(prev => ({ ...prev, rating }))}
                              className="w-5 h-5 text-orange-500 border-gray-300 focus:ring-orange-500"
                            />
                            <div className="ml-3 flex items-center">
                              {[...Array(rating)].map((_, i) => (
                                <StarIcon key={i} className="h-4 w-4 text-yellow-400 fill-current" />
                              ))}
                              <span className="ml-2 text-sm text-gray-600">& up</span>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  {/* Apply Filters Button */}
                  <div className="sticky bottom-0 bg-white border-t pt-4 mt-6">
                    <button
                      onClick={() => setShowMobileFilters(false)}
                      className="w-full py-3 bg-orange-500 text-white rounded-lg font-bold hover:bg-orange-600 transition-colors min-h-[48px]"
                    >
                      Apply Filters
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Products Grid */}
          <div className="flex-1">
            {filteredProducts.length > 0 && (
              <div className="flex flex-wrap items-center justify-between text-sm text-gray-600 mb-4">
                <span>
                  Showing {showingStart}-{showingEnd} of {filteredProducts.length} products
                </span>
                {totalPages > 1 && (
                  <span className="text-xs text-gray-500">Page {currentPage} of {totalPages}</span>
                )}
              </div>
            )}
            {filteredProducts.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                <p className="text-gray-500 text-lg">No products found matching your filters.</p>
                <button
                  onClick={() => setFilters({
                    priceRange: [0, 1000000],
                    rating: 0,
                    colors: [],
                    sizes: [],
                    brands: []
                  })}
                  className="mt-4 text-orange-500 hover:text-orange-600 font-medium"
                >
                  Clear all filters
                </button>
              </div>
            ) : (
              <div
                id="category-products"
                className={viewMode === 'grid' 
                  ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4'
                  : 'space-y-3'
                }
              >
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
                        <img
                          src={product.mainImage || product.image || 'https://via.placeholder.com/200'}
                          alt={product.name}
                          className="w-full h-48 object-cover group-hover:scale-105 transition-transform"
                        />
                        {product.originalPrice && product.originalPrice > product.price && (
                          <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded">
                            -{Math.round((1 - product.price / product.originalPrice) * 100)}%
                          </div>
                        )}
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            toggleWishlist(product._id || product.id);
                          }}
                          className="absolute top-2 right-2 bg-white rounded-full p-1.5 shadow hover:bg-red-50 transition-colors"
                        >
                          {wishlist.includes(product._id || product.id) ? (
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
                            {product.originalPrice && product.originalPrice > product.price && (
                              <div className="text-xs text-gray-400 line-through">
                                {product.originalPrice.toLocaleString()}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <div className="flex items-center">
                            <StarIcon className="h-3 w-3 text-yellow-400 fill-current mr-0.5" />
                            <span>{product.rating || '4.5'}</span>
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

            {filteredProducts.length > 0 && totalPages > 1 && (
              <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-4 py-2 border rounded-lg text-sm font-medium bg-white text-gray-700 border-gray-300 hover:border-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <div className="flex items-center gap-2 flex-wrap justify-center">
                  {renderPaginationButtons()}
                </div>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 border rounded-lg text-sm font-medium bg-white text-gray-700 border-gray-300 hover:border-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
    </>
  );
};

export default CategoryPage;
