import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { 
  AdjustmentsHorizontalIcon,
  Squares2X2Icon,
  ListBulletIcon,
  StarIcon,
  HeartIcon,
  ShoppingCartIcon,
  ChevronRightIcon,
  HomeIcon,
  ChevronLeftIcon
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid';
import { useCart } from '../context/CartContext';
import useResponsive from '../hooks/useResponsive';
import axios from 'axios';

// Memoized product card component to prevent unnecessary re-renders
const ProductCard = React.memo(({ product, wishlist, onToggleWishlist, onAddToCart, viewMode }) => {
  const isWishlisted = wishlist.includes(product._id);
  
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={`bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200 group ${
        viewMode === 'list' ? 'flex items-center space-x-4 p-4' : 'p-4'
      }`}
    >
      <div className={`relative ${viewMode === 'list' ? 'w-24 h-24 flex-shrink-0' : 'aspect-square mb-3'}`}>
        <img
          src={product.mainImage || '/placeholder-product.jpg'}
          alt={product.name}
          className="w-full h-full object-cover rounded-lg"
          loading="lazy"
        />
        <button
          onClick={() => onToggleWishlist(product._id)}
          className="absolute top-2 right-2 p-1.5 bg-white/80 backdrop-blur-sm rounded-full hover:bg-white transition-colors"
        >
          {isWishlisted ? (
            <HeartIconSolid className="h-4 w-4 text-red-500" />
          ) : (
            <HeartIcon className="h-4 w-4 text-gray-600" />
          )}
        </button>
      </div>
      
      <div className={`${viewMode === 'list' ? 'flex-1' : ''}`}>
        <Link to={`/product/${product._id}`} className="block">
          <h3 className="font-medium text-gray-900 hover:text-orange-600 transition-colors line-clamp-2">
            {product.name}
          </h3>
        </Link>
        
        <div className="flex items-center mt-1">
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
          <span className="text-sm text-gray-500 ml-1">({product.reviews || 0})</span>
        </div>
        
        <div className="flex items-center justify-between mt-2">
          <div>
            <span className="text-lg font-bold text-gray-900">
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
            className="bg-orange-500 hover:bg-orange-600 text-white p-2 rounded-lg transition-colors"
          >
            <ShoppingCartIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
});

const CategoryPageOptimized = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { isMobile, isTablet } = useResponsive();
  
  const [category, setCategory] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid');
  const [sortBy, setSortBy] = useState('featured');
  const [wishlist, setWishlist] = useState([]);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const itemsPerPage = isMobile ? 12 : 24;
  
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

  // Fetch category and products with pagination
  const fetchCategoryAndProducts = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      // Fetch category details
      const categoryResponse = await axios.get(`/api/categories/${slug}`);
      
      if (categoryResponse.data.success && categoryResponse.data.category) {
        const categoryData = categoryResponse.data.category;
        setCategory(categoryData);
        
        // Build query parameters for server-side filtering and pagination
        const queryParams = new URLSearchParams({
          category: categoryData.name,
          page: page.toString(),
          limit: itemsPerPage.toString(),
          sortBy: sortBy,
          ...Object.fromEntries(
            Object.entries(filters).map(([key, value]) => [
              key,
              Array.isArray(value) ? value.join(',') : value.toString()
            ])
          )
        });
        
        // Fetch paginated products from server
        const productsResponse = await axios.get(`/api/products/paginated?${queryParams}`);
        
        if (productsResponse.data.success) {
          const { data: productList, pagination } = productsResponse.data;
          setProducts(productList);
          setTotalPages(pagination.totalPages);
          setTotalProducts(pagination.totalItems);
          setCurrentPage(pagination.currentPage);
          
          // Extract filter options from all available products (not just current page)
          if (page === 1) {
            extractFilterOptions(productList);
          }
        }
      } else {
        navigate('/shop');
      }
    } catch (error) {
      console.error('Error fetching category:', error);
      // Fallback to client-side filtering if server-side pagination not available
      await fetchCategoryAndProductsClientSide();
    } finally {
      setLoading(false);
    }
  }, [slug, itemsPerPage, sortBy, filters, navigate]);

  // Fallback client-side method (for backward compatibility)
  const fetchCategoryAndProductsClientSide = async () => {
    try {
      const categoryResponse = await axios.get(`/api/categories/${slug}`);
      
      if (categoryResponse.data.success && categoryResponse.data.category) {
        const categoryData = categoryResponse.data.category;
        setCategory(categoryData);
        
        const productsResponse = await axios.get('/api/products');
        
        if (productsResponse.data.success || productsResponse.data.data) {
          const allProducts = productsResponse.data.data || productsResponse.data;
          
          // Filter products by category
          const categoryProducts = allProducts.filter(p => {
            if (!p.category) return false;
            const productCategory = p.category.toLowerCase().trim();
            const categoryName = categoryData.name.toLowerCase().trim();
            return productCategory === categoryName || 
                   productCategory.includes(categoryName) ||
                   categoryName.includes(productCategory);
          });
          
          // Apply client-side pagination
          const startIndex = (currentPage - 1) * itemsPerPage;
          const endIndex = startIndex + itemsPerPage;
          const paginatedProducts = categoryProducts.slice(startIndex, endIndex);
          
          setProducts(paginatedProducts);
          setTotalProducts(categoryProducts.length);
          setTotalPages(Math.ceil(categoryProducts.length / itemsPerPage));
          extractFilterOptions(categoryProducts);
        }
      }
    } catch (error) {
      console.error('Error in fallback method:', error);
      navigate('/shop');
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
    setCurrentPage(1); // Reset to first page when filters change
  }, []);

  const toggleWishlist = useCallback((productId) => {
    setWishlist(prev => 
      prev.includes(productId) ? prev.filter(id => id !== productId) : [...prev, productId]
    );
  }, []);

  const handleAddToCart = useCallback((product) => {
    addToCart(product);
  }, [addToCart]);

  const handlePageChange = useCallback((page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Memoized pagination component
  const PaginationComponent = useMemo(() => {
    if (totalPages <= 1) return null;

    const pages = [];
    const showPages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(showPages / 2));
    let endPage = Math.min(totalPages, startPage + showPages - 1);

    if (endPage - startPage + 1 < showPages) {
      startPage = Math.max(1, endPage - showPages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return (
      <div className="flex items-center justify-center space-x-2 mt-8">
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
        >
          <ChevronLeftIcon className="h-5 w-5" />
        </button>
        
        {pages.map(page => (
          <button
            key={page}
            onClick={() => handlePageChange(page)}
            className={`px-4 py-2 rounded-lg border ${
              page === currentPage
                ? 'bg-orange-500 text-white border-orange-500'
                : 'border-gray-300 hover:bg-gray-50'
            }`}
          >
            {page}
          </button>
        ))}
        
        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
        >
          <ChevronRightIcon className="h-5 w-5" />
        </button>
      </div>
    );
  }, [currentPage, totalPages, handlePageChange]);

  useEffect(() => {
    fetchCategoryAndProducts(1);
  }, [slug]);

  useEffect(() => {
    fetchCategoryAndProducts(currentPage);
  }, [currentPage, sortBy, filters]);

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
    <div className="min-h-screen bg-gray-50">
      <Helmet>
        <title>{`${category.name} - Shop Now`}</title>
        <meta name="description" content={category.description || `Shop ${category.name} products`} />
      </Helmet>

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
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              {category.icon && (
                <div className="text-6xl">{category.icon}</div>
              )}
              <div>
                <h1 className="text-3xl font-bold">{category.name}</h1>
                <p className="text-orange-100 mt-2">{totalProducts} products available</p>
              </div>
            </div>
            
            {/* View Mode Toggle */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-white/20' : 'hover:bg-white/10'}`}
              >
                <Squares2X2Icon className="h-5 w-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg ${viewMode === 'list' ? 'bg-white/20' : 'hover:bg-white/10'}`}
              >
                <ListBulletIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <p className="text-gray-600">
            Showing {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, totalProducts)} of {totalProducts} products
          </p>
          
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
        </div>

        <div className={`grid gap-6 ${
          viewMode === 'grid' 
            ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4' 
            : 'grid-cols-1'
        }`}>
          {products.map(product => (
            <ProductCard
              key={product._id}
              product={product}
              wishlist={wishlist}
              onToggleWishlist={toggleWishlist}
              onAddToCart={handleAddToCart}
              viewMode={viewMode}
            />
          ))}
        </div>

        {/* Pagination */}
        {PaginationComponent}
      </div>
    </div>
  );
};

export default CategoryPageOptimized;
