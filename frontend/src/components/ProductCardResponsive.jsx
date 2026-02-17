import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import ProductMedia from './ProductMedia';
import {
  ShoppingBagIcon,
  HeartIcon,
  StarIcon,
  EyeIcon,
  TruckIcon,
  FireIcon,
  BoltIcon,
  GiftIcon
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid';

const ProductCardResponsive = ({ 
  product, 
  index, 
  viewMode = 'grid', 
  onAddToCart, 
  onToggleWishlist, 
  onQuickView, 
  isWishlisted = false,
  onProductView
}) => {
  const handleProductClick = (e) => {
    // Allow free browsing
    if (onProductView) {
      onProductView(product);
    }
  };
  
  const getStockStatus = (stockQuantity) => {
    if (stockQuantity > 20) return { text: 'In Stock', color: 'text-green-600', bg: 'bg-green-100' };
    if (stockQuantity > 5) return { text: 'Low Stock', color: 'text-yellow-600', bg: 'bg-yellow-100' };
    return { text: 'Out of Stock', color: 'text-red-600', bg: 'bg-red-100' };
  };

  const stockStatus = getStockStatus(product.stockQuantity);
  const discount = product.originalPrice && product.price 
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  // List View - Full Responsive
  if (viewMode === 'list') {
    return (
      <motion.div
        key={product._id || product.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05 }}
        className="bg-white rounded-lg sm:rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-all duration-300"
      >
        <div className="flex flex-col sm:flex-row">
          {/* Product Image - Responsive sizing */}
          <div className="w-full sm:w-32 md:w-40 lg:w-48 xl:w-56 h-48 sm:h-32 md:h-40 lg:h-48 relative flex-shrink-0">
            <Link 
              to={`/product/${product.id || product._id}`} 
              className="block w-full h-full"
              onClick={handleProductClick}
            >
              <ProductMedia
                src={product.mainImage || product.image}
                alt={product.name}
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                playOnHover={true}
                generateThumbnail={true}
                muted={true}
                loop={true}
              />
            </Link>
            
            {/* Badges - Responsive */}
            <div className="absolute top-2 left-2 flex flex-wrap gap-1">
              {product.isNew && (
                <span className="bg-blue-500 text-white px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-xs font-semibold flex items-center">
                  <BoltIcon className="h-2.5 sm:h-3 w-2.5 sm:w-3 mr-0.5 sm:mr-1" />
                  <span className="hidden sm:inline">NEW</span>
                </span>
              )}
              {discount > 0 && (
                <span className="bg-red-500 text-white px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-xs font-semibold flex items-center">
                  <FireIcon className="h-2.5 sm:h-3 w-2.5 sm:w-3 mr-0.5 sm:mr-1" />
                  -{discount}%
                </span>
              )}
              {product.freeShipping && (
                <span className="bg-green-500 text-white px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-xs font-semibold flex items-center">
                  <TruckIcon className="h-2.5 sm:h-3 w-2.5 sm:w-3 mr-0.5 sm:mr-1" />
                  <span className="hidden sm:inline">FREE</span>
                </span>
              )}
            </div>
          </div>

          {/* Product Info - Responsive padding and text sizes */}
          <div className="flex-1 p-3 sm:p-4 md:p-5 lg:p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start gap-2 sm:gap-4">
              <div className="flex-1 w-full">
                <Link 
                  to={`/product/${product.id || product._id}`}
                  onClick={handleProductClick}
                >
                  <h3 className="text-base sm:text-lg md:text-xl font-semibold text-gray-900 mb-1 sm:mb-2 hover:text-purple-600 transition-colors line-clamp-2">
                    {product.name}
                  </h3>
                </Link>
                
                <p className="text-xs sm:text-sm text-gray-600 mb-2 sm:mb-3 line-clamp-2">
                  {product.shortDescription || 'High quality product with excellent features'}
                </p>

                {/* Rating and Reviews - Responsive */}
                <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <StarIcon
                        key={i}
                        className={`h-3 sm:h-4 w-3 sm:w-4 ${
                          i < Math.floor(product.averageRating || 0)
                            ? 'text-yellow-400 fill-current'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-xs sm:text-sm text-gray-600">
                    ({product.totalReviews || 0})
                  </span>
                  {product.totalSales && (
                    <span className="text-xs sm:text-sm text-gray-500">
                      {product.totalSales} sold
                    </span>
                  )}
                </div>

                {/* Price - Responsive */}
                <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                  <span className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">
                    {(product.price || 0).toLocaleString()} <span className="text-sm sm:text-base">RWF</span>
                  </span>
                  {product.originalPrice && product.originalPrice > product.price && (
                    <span className="text-sm sm:text-base md:text-lg text-gray-500 line-through">
                      {product.originalPrice.toLocaleString()} RWF
                    </span>
                  )}
                </div>

                {/* Stock Status - Responsive */}
                <div className="flex flex-wrap items-center gap-2 mb-3 sm:mb-4">
                  <span className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-semibold ${stockStatus.bg} ${stockStatus.color}`}>
                    {stockStatus.text}
                  </span>
                  {product.freeShipping && (
                    <span className="text-green-600 text-xs sm:text-sm flex items-center">
                      <TruckIcon className="h-3 sm:h-4 w-3 sm:w-4 mr-1" />
                      Free Shipping
                    </span>
                  )}
                </div>

                {/* Action Button - Mobile full width */}
                <div className="mt-3 sm:mt-4">
                  <Link
                    to={`/product/${product.id || product._id}`}
                    className="block w-full sm:w-auto sm:inline-flex items-center justify-center bg-red-600 text-white py-2 sm:py-2.5 px-4 sm:px-6 rounded-lg font-medium hover:bg-red-700 transition-colors text-center text-sm sm:text-base"
                    onClick={handleProductClick}
                  >
                    <EyeIcon className="h-4 sm:h-5 w-4 sm:w-5 mr-2" />
                    View Details
                  </Link>
                </div>
              </div>

              {/* Action Buttons - Responsive positioning */}
              <div className="flex sm:flex-col gap-2 sm:ml-2 md:ml-4">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    onToggleWishlist(product._id || product.id);
                  }}
                  className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  {isWishlisted ? (
                    <HeartIconSolid className="h-4 sm:h-5 w-4 sm:w-5 text-red-500" />
                  ) : (
                    <HeartIcon className="h-4 sm:h-5 w-4 sm:w-5 text-gray-600" />
                  )}
                </button>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    onQuickView(product);
                  }}
                  className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <EyeIcon className="h-4 sm:h-5 w-4 sm:w-5 text-gray-600" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  // Grid View - Full Responsive
  return (
    <motion.div
      key={product._id || product.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="group cursor-pointer h-full"
    >
      <div className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 border border-gray-100 h-full flex flex-col">
        <div className="relative">
          <Link 
            to={`/product/${product.id || product._id}`}
            className="block w-full"
            onClick={handleProductClick}
          >
            <ProductMedia
              src={product.mainImage || product.image}
              alt={product.name}
              className="w-full h-40 sm:h-48 md:h-56 lg:h-64 object-cover group-hover:scale-105 transition-transform duration-300"
              playOnHover={true}
              generateThumbnail={true}
              muted={true}
              loop={true}
            />
          </Link>
          
          {/* Badges - Mobile friendly */}
          <div className="absolute top-2 sm:top-3 left-2 sm:left-3 space-y-1 sm:space-y-2">
            {product.isNew && (
              <span className="bg-blue-500 text-white px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-xs font-semibold flex items-center">
                <BoltIcon className="h-2.5 sm:h-3 w-2.5 sm:w-3 mr-0.5 sm:mr-1" />
                <span className="hidden sm:inline">NEW</span>
              </span>
            )}
            {discount > 0 && (
              <span className="bg-red-500 text-white px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-xs font-semibold flex items-center">
                <FireIcon className="h-2.5 sm:h-3 w-2.5 sm:w-3 mr-0.5 sm:mr-1" />
                -{discount}%
              </span>
            )}
            {product.freeShipping && (
              <span className="bg-green-500 text-white px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-xs font-semibold flex items-center">
                <TruckIcon className="h-2.5 sm:h-3 w-2.5 sm:w-3 mr-0.5 sm:mr-1" />
                <span className="hidden sm:inline">FREE</span>
              </span>
            )}
            <span className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-xs font-semibold ${stockStatus.bg} ${stockStatus.color}`}>
              {stockStatus.text}
            </span>
          </div>

          {/* Hover Actions - Hidden on mobile, visible on tablet+ */}
          <div className="hidden sm:block absolute top-3 right-3 space-y-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onToggleWishlist(product._id || product.id);
              }}
              className="bg-white/80 backdrop-blur-sm p-2 rounded-full hover:bg-white transition-colors"
            >
              {isWishlisted ? (
                <HeartIconSolid className="h-5 w-5 text-red-500" />
              ) : (
                <HeartIcon className="h-5 w-5 text-gray-600" />
              )}
            </button>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onQuickView(product);
              }}
              className="bg-white/80 backdrop-blur-sm p-2 rounded-full hover:bg-white transition-colors"
            >
              <EyeIcon className="h-5 w-5 text-gray-600" />
            </button>
          </div>
        </div>
        
        <div className="p-2 sm:p-3 md:p-4 flex flex-col flex-1">
          <Link
            to={`/product/${product.id || product._id}`}
            className="block"
            onClick={handleProductClick}
          >
            <h3 className="font-medium text-gray-900 mb-1 sm:mb-2 line-clamp-2 hover:text-orange-600 transition-colors text-sm sm:text-base">
              {product.name}
            </h3>
          </Link>
          
          <p className="text-xs text-gray-600 mb-2 line-clamp-2 hidden sm:block">
            {product.shortDescription || 'High quality product'}
          </p>
          
          {/* Price Display - Responsive */}
          <div className="mb-2">
            <div className="flex items-center flex-wrap gap-1 sm:gap-2">
              <span className="text-base sm:text-lg md:text-xl font-bold text-gray-900">
                {(product.price || 0).toLocaleString()} <span className="text-xs sm:text-sm">RWF</span>
              </span>
              {product.originalPrice && product.originalPrice > product.price && (
                <span className="text-xs sm:text-sm text-gray-500 line-through">
                  {product.originalPrice.toLocaleString()} RWF
                </span>
              )}
            </div>
          </div>
          
          <div className="flex items-center mb-2">
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <StarIcon
                  key={i}
                  className={`h-3 sm:h-4 w-3 sm:w-4 ${
                    i < Math.floor(product.averageRating || 0)
                      ? 'text-yellow-400 fill-current'
                      : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
            <span className="text-xs sm:text-sm text-gray-600 ml-1">
              ({product.totalReviews || 0})
            </span>
          </div>
          
          {/* Free Shipping Badge */}
          {product.freeShipping && (
            <div className="mb-2 sm:mb-3">
              <span className="inline-flex items-center px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                <TruckIcon className="h-3 w-3 mr-1" />
                Free Shipping
              </span>
            </div>
          )}
          
          {/* View Details Button */}
          <div className="mt-auto pt-2">
            <Link
              to={`/product/${product.id || product._id}`}
              className="block w-full bg-red-600 text-white py-1.5 sm:py-2 px-2 sm:px-4 rounded-lg font-medium hover:bg-red-700 transition-colors text-center flex items-center justify-center text-sm sm:text-base"
              onClick={handleProductClick}
            >
              <EyeIcon className="h-4 w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">View Details</span>
              <span className="sm:hidden">View</span>
            </Link>
          </div>
          
          {/* Mobile action buttons */}
          <div className="flex sm:hidden gap-2 mt-2 pt-2 border-t border-gray-100">
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onToggleWishlist(product._id || product.id);
              }}
              className="flex-1 p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center"
            >
              {isWishlisted ? (
                <HeartIconSolid className="h-4 w-4 text-red-500" />
              ) : (
                <HeartIcon className="h-4 w-4 text-gray-600" />
              )}
              <span className="ml-1 text-xs">Wishlist</span>
            </button>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onQuickView(product);
              }}
              className="flex-1 p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center"
            >
              <EyeIcon className="h-4 w-4 text-gray-600" />
              <span className="ml-1 text-xs">Quick View</span>
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ProductCardResponsive;
