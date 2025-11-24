import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
  GiftIcon,
  ClockIcon,
  UserGroupIcon,
  ArrowTrendingUpIcon
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid';

const ProductCard = ({ 
  product, 
  index, 
  viewMode = 'grid', 
  onAddToCart, 
  onToggleWishlist, 
  onQuickView, 
  isWishlisted = false,
  onProductView
}) => {
  const navigate = useNavigate();
  
  // Product click - no auth required, just navigate
  const handleProductClick = (e) => {
    // Allow free browsing, auth will be required at checkout
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

  if (viewMode === 'list') {
    return (
      <motion.div
        key={product._id || product.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1 }}
        className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-lg transition-all duration-300"
      >
        <div className="flex">
          {/* Product Image */}
          <div className="w-48 h-48 relative flex-shrink-0">
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
            
            {/* Badges */}
            <div className="absolute top-2 left-2 space-y-1">
              {product.isNew && (
                <span className="bg-blue-500 text-white px-2 py-1 rounded-full text-xs font-semibold flex items-center">
                  <BoltIcon className="h-3 w-3 mr-1" />
                  NEW
                </span>
              )}
              {discount > 0 && (
                <span className="bg-red-500 text-white px-2 py-1 rounded-full text-xs font-semibold flex items-center">
                  <FireIcon className="h-3 w-3 mr-1" />
                  -{discount}%
                </span>
              )}
              {product.freeShipping && (
                <span className="bg-green-500 text-white px-2 py-1 rounded-full text-xs font-semibold flex items-center">
                  <TruckIcon className="h-3 w-3 mr-1" />
                  FREE
                </span>
              )}
              {product.isSale && (
                <span className="bg-orange-500 text-white px-2 py-1 rounded-full text-xs font-semibold flex items-center">
                  <GiftIcon className="h-3 w-3 mr-1" />
                  SALE
                </span>
              )}
            </div>
          </div>

          {/* Product Info */}
          <div className="flex-1 p-6">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <Link 
                  to={`/product/${product.id || product._id}`}
                  onClick={handleProductClick}
                >
                  <h3 className="text-xl font-semibold text-gray-900 mb-2 hover:text-purple-600 transition-colors">
                    {product.name}
                  </h3>
                </Link>
                
                <p className="text-gray-600 mb-3 line-clamp-2">
                  {product.shortDescription}
                </p>

                {/* Rating and Reviews */}
                <div className="flex items-center mb-3">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <StarIcon
                        key={i}
                        className={`h-4 w-4 ${
                          i < Math.floor(product.averageRating || 0)
                            ? 'text-yellow-400 fill-current'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm text-gray-600 ml-2">
                    ({product.totalReviews || 0} reviews)
                  </span>
                  {product.totalSales && (
                    <span className="text-sm text-gray-500 ml-4">
                      {product.totalSales} sold
                    </span>
                  )}
                </div>

                {/* Price */}
                <div className="flex items-center space-x-3 mb-4">
                  <span className="text-2xl font-bold text-gray-900">
                    {product.price?.toLocaleString()} RWF
                  </span>
                  {product.originalPrice && product.originalPrice > product.price && (
                    <span className="text-lg text-gray-500 line-through">
                      {product.originalPrice?.toLocaleString()} RWF
                    </span>
                  )}
                  {product.freeShipping && (
                    <span className="text-green-600 text-sm flex items-center">
                      <TruckIcon className="h-4 w-4 mr-1" />
                      Free Shipping
                    </span>
                  )}
                </div>

                {/* Stock Status */}
                <div className="flex items-center space-x-4 mb-4">
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${stockStatus.bg} ${stockStatus.color}`}>
                    {stockStatus.text}
                  </span>
                  <span className="text-sm text-gray-600">
                    {product.stockQuantity} available
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col space-y-2 ml-4">
                <button
                  onClick={() => onToggleWishlist(product._id)}
                  className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  {isWishlisted ? (
                    <HeartIconSolid className="h-5 w-5 text-red-500" />
                  ) : (
                    <HeartIcon className="h-5 w-5 text-gray-600" />
                  )}
                </button>
                <button
                  onClick={() => onQuickView(product)}
                  className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <EyeIcon className="h-5 w-5 text-gray-600" />
                </button>
              </div>
            </div>

                         {/* Free Shipping Badge */}
             <div className="mb-4">
               <span className="inline-flex items-center px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
                 <TruckIcon className="h-4 w-4 mr-1" />
                 Free Shipping
               </span>
             </div>
             
             {/* View Details Button */}
             <div className="mt-4">
               <Link
                 to={`/product/${product.id || product._id}`}
                 className="block w-full bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 transition-colors text-center flex items-center justify-center"
                 onClick={handleProductClick}
               >
                 <EyeIcon className="h-5 w-5 mr-2" />
                 View Details
               </Link>
             </div>
             
             {/* Review Section */}
             <div className="mt-4 pt-4 border-t border-gray-200">
               <div className="flex items-center justify-between">
                 <div className="flex items-center">
                   {[...Array(5)].map((_, i) => (
                     <StarIcon
                       key={i}
                       className={`h-4 w-4 ${
                         i < Math.floor(product.averageRating || 0)
                           ? 'text-yellow-400 fill-current'
                           : 'text-gray-300'
                       }`}
                     />
                   ))}
                   <span className="text-sm text-gray-600 ml-2">
                     ({product.totalReviews || 0} reviews)
                   </span>
                 </div>
                 <button
                   onClick={(e) => {
                     e.preventDefault();
                     e.stopPropagation();
                     // TODO: Open review modal
                     console.log('Write review for:', product._id || product.id);
                   }}
                   className="text-sm text-orange-600 hover:text-orange-700 font-medium"
                 >
                   Write Review
                 </button>
               </div>
             </div>
          </div>
        </div>
      </motion.div>
    );
  }

  // Grid View (Improved)
  return (
    <motion.div
      key={product._id || product.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="group cursor-pointer"
    >
      <div className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 border border-gray-100">
        <div className="relative">
                     <Link 
             to={`/product/${product.id || product._id}`}
             className="block w-full"
             onClick={handleProductClick}
           >
            <ProductMedia
              src={product.mainImage || product.image}
              alt={product.name}
              className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
              playOnHover={true}
              generateThumbnail={true}
              muted={true}
              loop={true}
            />
          </Link>
          
          {/* Badges */}
          <div className="absolute top-4 left-4 space-y-2">
            {product.isNew && (
              <span className="bg-blue-500 text-white px-2 py-1 rounded-full text-xs font-semibold flex items-center">
                <BoltIcon className="h-3 w-3 mr-1" />
                NEW
              </span>
            )}
            {discount > 0 && (
              <span className="bg-red-500 text-white px-2 py-1 rounded-full text-xs font-semibold flex items-center">
                <FireIcon className="h-3 w-3 mr-1" />
                -{discount}%
              </span>
            )}
            {product.freeShipping && (
              <span className="bg-green-500 text-white px-2 py-1 rounded-full text-xs font-semibold flex items-center">
                <TruckIcon className="h-3 w-3 mr-1" />
                FREE
              </span>
            )}
            {product.isSale && (
              <span className="bg-orange-500 text-white px-2 py-1 rounded-full text-xs font-semibold flex items-center">
                <GiftIcon className="h-3 w-3 mr-1" />
                SALE
              </span>
            )}
            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${stockStatus.bg} ${stockStatus.color}`}>
              {stockStatus.text}
            </span>
          </div>

          {/* Hover Actions */}
          <div className="absolute top-4 right-4 space-y-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onToggleWishlist(product._id);
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
        
        <div className="p-3">
                                <Link
             to={`/product/${product.id || product._id}`}
             className="block"
             onClick={handleProductClick}
           >
             <h3 className="font-medium text-gray-900 mb-2 line-clamp-2 hover:text-orange-600 transition-colors text-sm">
               {product.name}
             </h3>
           </Link>
                     <p className="text-xs text-gray-600 mb-2 line-clamp-2">
             {product.shortDescription}
           </p>
           
           {/* Price Display */}
           <div className="mb-2">
             <div className="flex items-center">
               <span className="text-base font-bold text-gray-900">
                 {product.price?.toLocaleString()} RWF
               </span>
               {product.originalPrice && product.originalPrice > product.price && (
                 <span className="text-xs text-gray-500 line-through ml-2">
                   {product.originalPrice?.toLocaleString()} RWF
                 </span>
               )}
             </div>
           </div>
           
           <div className="flex items-center mb-2">
             <div className="flex items-center">
               {[...Array(5)].map((_, i) => (
                 <StarIcon
                   key={i}
                   className={`h-3 w-3 ${
                     i < Math.floor(product.averageRating || 0)
                       ? 'text-yellow-400 fill-current'
                       : 'text-gray-300'
                   }`}
                 />
               ))}
             </div>
             <span className="text-xs text-gray-600 ml-1">
               ({product.totalReviews || 0})
             </span>
           </div>
          
                     {/* Free Shipping Badge */}
           <div className="mb-3">
             <span className="inline-flex items-center px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
               <TruckIcon className="h-3 w-3 mr-1" />
               Free Shipping
             </span>
           </div>
           
           {/* View Details Button */}
           <div className="mt-2">
             <Link
               to={`/product/${product.id || product._id}`}
               className="block w-full bg-red-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-red-700 transition-colors text-center flex items-center justify-center"
               onClick={handleProductClick}
             >
               <EyeIcon className="h-4 w-4 mr-2" />
               View Details
             </Link>
           </div>
           
           {/* Review Section */}
           <div className="mt-3 pt-3 border-t border-gray-100">
             <div className="flex items-center justify-between mb-2">
               <div className="flex items-center">
                 {[...Array(5)].map((_, i) => (
                   <StarIcon
                     key={i}
                     className={`h-3 w-3 ${
                       i < Math.floor(product.averageRating || 0)
                         ? 'text-yellow-400 fill-current'
                         : 'text-gray-300'
                     }`}
                   />
                 ))}
                 <span className="text-xs text-gray-600 ml-1">
                   ({product.totalReviews || 0})
                 </span>
               </div>
               <button
                 onClick={(e) => {
                   e.preventDefault();
                   e.stopPropagation();
                   // TODO: Open review modal
                   console.log('Write review for:', product._id || product.id);
                 }}
                 className="text-xs text-orange-600 hover:text-orange-700 font-medium"
               >
                 Write Review
               </button>
             </div>
           </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ProductCard; 