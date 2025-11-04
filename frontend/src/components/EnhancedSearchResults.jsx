import React from 'react';
import { motion } from 'framer-motion';
import { 
  MagnifyingGlassIcon, 
  FunnelIcon, 
  SparklesIcon,
  XMarkIcon,
  CheckCircleIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartIconSolid, StarIcon } from '@heroicons/react/24/solid';

const EnhancedSearchResults = ({ 
  results = [], 
  query = '', 
  loading = false, 
  totalResults = 0,
  onProductClick,
  onClearSearch,
  filters = {},
  activeFiltersCount = 0
}) => {
  
  // Empty state
  if (!loading && results.length === 0 && query) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-16"
      >
        <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 rounded-full mb-6">
          <MagnifyingGlassIcon className="w-10 h-10 text-gray-400" />
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-3">
          No Results Found
        </h3>
        <p className="text-gray-600 mb-6 max-w-md mx-auto">
          We couldn't find any products matching "<span className="font-semibold text-gray-900">{query}</span>"
        </p>
        <div className="space-y-3">
          <p className="text-sm text-gray-500">Try:</p>
          <ul className="text-sm text-gray-600 space-y-2">
            <li>✓ Using different keywords</li>
            <li>✓ Checking your spelling</li>
            <li>✓ Using more general terms</li>
            <li>✓ Removing filters</li>
          </ul>
        </div>
        {onClearSearch && (
          <button
            onClick={onClearSearch}
            className="mt-8 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg hover:shadow-xl"
          >
            Clear Search & Browse All
          </button>
        )}
      </motion.div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="bg-white rounded-2xl shadow-sm overflow-hidden animate-pulse">
            <div className="aspect-square bg-gray-200" />
            <div className="p-4 space-y-3">
              <div className="h-4 bg-gray-200 rounded w-3/4" />
              <div className="h-3 bg-gray-200 rounded w-1/2" />
              <div className="h-6 bg-gray-200 rounded w-1/3" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Results Header */}
      <div className="flex items-center justify-between bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-6 border border-purple-100">
        <div className="flex items-center gap-4">
          <div className="flex items-center justify-center w-12 h-12 bg-white rounded-xl shadow-sm">
            <SparklesIcon className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {totalResults} {totalResults === 1 ? 'Result' : 'Results'}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {query && (
                <>
                  for "<span className="font-semibold text-purple-700">{query}</span>"
                </>
              )}
              {activeFiltersCount > 0 && (
                <span className="ml-2 text-purple-600">
                  • {activeFiltersCount} {activeFiltersCount === 1 ? 'filter' : 'filters'} active
                </span>
              )}
            </p>
          </div>
        </div>
        
        {onClearSearch && (query || activeFiltersCount > 0) && (
          <button
            onClick={onClearSearch}
            className="flex items-center gap-2 px-4 py-2 bg-white text-gray-700 rounded-xl hover:bg-gray-50 transition-colors shadow-sm border border-gray-200"
          >
            <XMarkIcon className="w-4 h-4" />
            <span className="text-sm font-medium">Clear All</span>
          </button>
        )}
      </div>

      {/* Results Grid */}
      <motion.div 
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
        initial="hidden"
        animate="visible"
        variants={{
          visible: {
            transition: {
              staggerChildren: 0.05
            }
          }
        }}
      >
        {results.map((product, index) => (
          <motion.div
            key={product._id || product.id}
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0 }
            }}
            className="group bg-white rounded-2xl shadow-sm hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100 hover:border-purple-200 cursor-pointer"
            onClick={() => onProductClick && onProductClick(product)}
          >
            {/* Product Image */}
            <div className="relative aspect-square overflow-hidden bg-gray-50">
              <img
                src={product.mainImage || product.image || 'https://via.placeholder.com/400'}
                alt={product.name}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                onError={(e) => {
                  e.target.src = 'https://via.placeholder.com/400?text=No+Image';
                }}
              />
              
              {/* Badges */}
              <div className="absolute top-3 left-3 flex flex-col gap-2">
                {product.isNew && (
                  <span className="px-3 py-1 bg-green-500 text-white text-xs font-bold rounded-full shadow-lg">
                    NEW
                  </span>
                )}
                {product.isFeatured && (
                  <span className="px-3 py-1 bg-purple-500 text-white text-xs font-bold rounded-full shadow-lg flex items-center gap-1">
                    <SparklesIcon className="w-3 h-3" />
                    FEATURED
                  </span>
                )}
                {product.originalPrice && product.originalPrice > product.price && (
                  <span className="px-3 py-1 bg-red-500 text-white text-xs font-bold rounded-full shadow-lg">
                    SALE
                  </span>
                )}
              </div>

              {/* Stock Status */}
              {product.stockQuantity <= 0 && (
                <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center">
                  <span className="px-4 py-2 bg-red-500 text-white font-bold rounded-lg">
                    OUT OF STOCK
                  </span>
                </div>
              )}
              {product.stockQuantity > 0 && product.stockQuantity <= 5 && (
                <div className="absolute bottom-3 left-3">
                  <span className="px-3 py-1 bg-orange-500 text-white text-xs font-bold rounded-full shadow-lg">
                    Only {product.stockQuantity} left!
                  </span>
                </div>
              )}

              {/* Quick Actions */}
              <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <button className="p-2 bg-white rounded-full shadow-lg hover:bg-red-50 transition-colors">
                  <HeartIconSolid className="w-5 h-5 text-gray-400 hover:text-red-500" />
                </button>
              </div>
            </div>

            {/* Product Info */}
            <div className="p-4 space-y-3">
              {/* Category */}
              {product.category && (
                <span className="inline-block px-2 py-1 bg-purple-50 text-purple-700 text-xs font-semibold rounded-lg">
                  {product.category}
                </span>
              )}

              {/* Name */}
              <h3 className="font-bold text-gray-900 line-clamp-2 group-hover:text-purple-600 transition-colors min-h-[3rem]">
                {product.name}
              </h3>

              {/* Rating */}
              {product.rating > 0 && (
                <div className="flex items-center gap-2">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <StarIcon
                        key={i}
                        className={`w-4 h-4 ${
                          i < Math.floor(product.rating)
                            ? 'text-yellow-400'
                            : 'text-gray-200'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm text-gray-600">
                    ({product.rating.toFixed(1)})
                  </span>
                </div>
              )}

              {/* Price */}
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-gray-900">
                  {product.price?.toLocaleString()} RWF
                </span>
                {product.originalPrice && product.originalPrice > product.price && (
                  <span className="text-sm text-gray-400 line-through">
                    {product.originalPrice.toLocaleString()} RWF
                  </span>
                )}
              </div>

              {/* Discount Badge */}
              {product.originalPrice && product.originalPrice > product.price && (
                <div className="inline-block px-2 py-1 bg-red-100 text-red-700 text-xs font-bold rounded">
                  Save {Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}%
                </div>
              )}

              {/* Features */}
              <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
                {product.colors && product.colors.length > 0 && (
                  <span className="text-xs text-gray-500">
                    {product.colors.length} {product.colors.length === 1 ? 'color' : 'colors'}
                  </span>
                )}
                {product.sizes && product.sizes.length > 0 && (
                  <span className="text-xs text-gray-500">
                    • {product.sizes.length} {product.sizes.length === 1 ? 'size' : 'sizes'}
                  </span>
                )}
                {product.soldCount > 0 && (
                  <span className="text-xs text-gray-500">
                    • {product.soldCount} sold
                  </span>
                )}
              </div>

              {/* Action Button */}
              <button className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5">
                View Details
              </button>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Load More Indicator */}
      {results.length < totalResults && (
        <div className="text-center py-8">
          <p className="text-gray-600 mb-4">
            Showing {results.length} of {totalResults} products
          </p>
          <div className="w-full max-w-xs mx-auto bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-purple-600 to-pink-600 h-2 rounded-full transition-all"
              style={{ width: `${(results.length / totalResults) * 100}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedSearchResults;
