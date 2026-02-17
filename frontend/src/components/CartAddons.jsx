/**
 * CartAddons Component
 * Intelligent add-on suggestions for cart/checkout
 * Features: Animated cards, 1-click add, collapsible drawer
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  SparklesIcon, 
  PlusIcon, 
  CheckIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  XMarkIcon,
  ShoppingBagIcon,
  StarIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import axios from 'axios';

const CartAddons = ({ 
  cartItems = [], 
  onAddToCart, 
  isExpanded: controlledExpanded,
  onExpandChange,
  className = '',
  singleMode = true // Default to single product mode
}) => {
  const [recommendations, setRecommendations] = useState([]);
  const [headline, setHeadline] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isExpanded, setIsExpanded] = useState(controlledExpanded ?? true);
  const [addedItems, setAddedItems] = useState(new Set());
  const [showConfetti, setShowConfetti] = useState(null);

  // Fetch recommendations when cart changes
  useEffect(() => {
    if (cartItems.length > 0) {
      fetchRecommendations();
    } else {
      setRecommendations([]);
      setHeadline('');
    }
  }, [cartItems]);

  // Sync with controlled expanded state
  useEffect(() => {
    if (controlledExpanded !== undefined) {
      setIsExpanded(controlledExpanded);
    }
  }, [controlledExpanded]);

  const fetchRecommendations = useCallback(async () => {
    if (cartItems.length === 0) return;

    setLoading(true);
    setError(null);

    try {
      const cartData = cartItems.map(item => ({
        productId: item.id || item.productId || item._id,
        name: item.name,
        category: item.category,
        price: item.price,
        quantity: item.quantity || 1
      }));

      const response = await axios.post('/api/cart/addons', {
        cartItems: cartData,
        limit: 6,
        sessionId: localStorage.getItem('sessionId') || 'anonymous'
      });

      if (response.data.success && response.data.data) {
        setRecommendations(response.data.data.recommendations || []);
        setHeadline(response.data.data.headline || 'Complete Your Order');
      }
    } catch (err) {
      console.error('Failed to fetch recommendations:', err);
      setError('Unable to load suggestions');
      // Don't break checkout - just hide section
    } finally {
      setLoading(false);
    }
  }, [cartItems]);

  const handleAddToCart = async (product) => {
    if (addedItems.has(product.id)) return;

    // Trigger confetti animation
    setShowConfetti(product.id);
    setTimeout(() => setShowConfetti(null), 1000);

    // Mark as added
    setAddedItems(prev => new Set([...prev, product.id]));

    // Call parent handler
    if (onAddToCart) {
      await onAddToCart({
        ...product,
        quantity: 1,
        addedFrom: 'addon-suggestions'
      });
    }

    // Track event
    try {
      await axios.post('/api/cart/events', {
        productId: product.id,
        eventType: 'add',
        quantity: 1,
        metadata: { source: 'addon-suggestions' }
      });
    } catch (e) {
      // Silent fail for tracking
    }
  };

  const toggleExpanded = () => {
    const newExpanded = !isExpanded;
    setIsExpanded(newExpanded);
    if (onExpandChange) {
      onExpandChange(newExpanded);
    }
  };

  // Don't render if no recommendations or error
  if (error || (recommendations.length === 0 && !loading)) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={`bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 rounded-2xl border border-purple-100 overflow-hidden ${className}`}
    >
      {/* Header - Simplified for single product */}
      <div className="px-4 py-3 flex items-center gap-2">
        <SparklesIcon className="h-5 w-5 text-purple-600" />
        <h3 className="font-semibold text-gray-900 text-sm">
          {recommendations.length === 1 ? 'You may also need' : headline || 'Complete Your Order'}
        </h3>
      </div>

      {/* Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {loading ? (
              <div className="px-6 pb-6">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="bg-gray-200 rounded-xl h-32 mb-2" />
                      <div className="bg-gray-200 h-4 rounded w-3/4 mb-1" />
                      <div className="bg-gray-200 h-3 rounded w-1/2" />
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="px-4 pb-4">
                {/* Single product display or grid for multiple */}
                {recommendations.length === 1 ? (
                  // Single product - compact horizontal layout
                  <SingleAddonCard
                    product={recommendations[0]}
                    isAdded={addedItems.has(recommendations[0].id)}
                    showConfetti={showConfetti === recommendations[0].id}
                    onAdd={() => handleAddToCart(recommendations[0])}
                  />
                ) : (
                  // Multiple products grid
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {recommendations.map((product, index) => (
                      <AddonCard
                        key={product.id}
                        product={product}
                        index={index}
                        isAdded={addedItems.has(product.id)}
                        showConfetti={showConfetti === product.id}
                        onAdd={() => handleAddToCart(product)}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

/**
 * Single Add-on Card - Compact horizontal layout for single recommendation
 */
const SingleAddonCard = ({ product, isAdded, showConfetti, onAdd }) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="relative bg-white rounded-xl p-3 flex items-center gap-3 shadow-sm border border-gray-100"
    >
      {/* Confetti Animation */}
      <AnimatePresence>
        {showConfetti && <ConfettiEffect />}
      </AnimatePresence>

      {/* Product Image */}
      <div className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden bg-gray-100">
        <img
          src={product.mainImage || '/placeholder-product.png'}
          alt={product.name}
          className="w-full h-full object-cover"
          onError={(e) => { e.target.src = '/placeholder-product.png'; }}
        />
      </div>

      {/* Product Info */}
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-medium text-gray-900 line-clamp-1">
          {product.name}
        </h4>
        <p className="text-xs text-purple-600 font-medium">
          {product.reasonShort || 'Completes your order'}
        </p>
        <p className="text-sm font-bold text-gray-900 mt-1">
          {parseFloat(product.price).toLocaleString()} <span className="text-xs font-normal text-gray-500">RWF</span>
        </p>
      </div>

      {/* Add Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onAdd}
        disabled={isAdded}
        className={`flex-shrink-0 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
          isAdded
            ? 'bg-green-500 text-white'
            : 'bg-purple-600 text-white hover:bg-purple-700'
        }`}
      >
        {isAdded ? (
          <span className="flex items-center gap-1">
            <CheckIcon className="h-4 w-4" /> Added
          </span>
        ) : (
          <span className="flex items-center gap-1">
            <PlusIcon className="h-4 w-4" /> Add
          </span>
        )}
      </motion.button>
    </motion.div>
  );
};

/**
 * Individual Add-on Card Component
 */
const AddonCard = ({ product, index, isAdded, showConfetti, onAdd }) => {
  const [isHovered, setIsHovered] = useState(false);

  const cardVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        delay: index * 0.1,
        duration: 0.3,
        ease: 'easeOut'
      }
    }
  };

  const buttonVariants = {
    idle: { scale: 1 },
    hover: { scale: 1.05 },
    tap: { scale: 0.95 },
    added: { scale: 1 }
  };

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="relative bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow border border-gray-100"
    >
      {/* Confetti Animation */}
      <AnimatePresence>
        {showConfetti && (
          <ConfettiEffect />
        )}
      </AnimatePresence>

      {/* Product Image */}
      <div className="relative aspect-square overflow-hidden bg-gray-100">
        <motion.img
          src={product.mainImage || '/placeholder-product.png'}
          alt={product.name}
          className="w-full h-full object-cover"
          animate={{ scale: isHovered ? 1.05 : 1 }}
          transition={{ duration: 0.3 }}
          onError={(e) => {
            e.target.src = '/placeholder-product.png';
          }}
        />
        
        {/* Discount Badge */}
        {product.discountPercentage > 0 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full"
          >
            -{Math.round(product.discountPercentage)}%
          </motion.div>
        )}
      </div>

      {/* Product Info */}
      <div className="p-3">
        <h4 className="text-sm font-medium text-gray-900 line-clamp-2 mb-1 min-h-[2.5rem]">
          {product.name}
        </h4>

        {/* Reason Tag */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-xs text-purple-600 font-medium mb-2 line-clamp-1"
        >
          {product.reasonShort || 'Recommended'}
        </motion.p>

        {/* Rating */}
        {product.averageRating > 0 && (
          <div className="flex items-center gap-1 mb-2">
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                i < Math.floor(product.averageRating) ? (
                  <StarIconSolid key={i} className="h-3 w-3 text-yellow-400" />
                ) : (
                  <StarIcon key={i} className="h-3 w-3 text-gray-300" />
                )
              ))}
            </div>
            <span className="text-xs text-gray-500">
              ({product.totalReviews || 0})
            </span>
          </div>
        )}

        {/* Price */}
        <div className="flex items-baseline gap-2 mb-3">
          <span className="text-lg font-bold text-gray-900">
            {parseFloat(product.price).toLocaleString()}
          </span>
          <span className="text-xs text-gray-500">RWF</span>
          {product.originalPrice && product.originalPrice > product.price && (
            <span className="text-xs text-gray-400 line-through">
              {parseFloat(product.originalPrice).toLocaleString()}
            </span>
          )}
        </div>

        {/* Add Button */}
        <motion.button
          variants={buttonVariants}
          initial="idle"
          whileHover={!isAdded ? "hover" : "idle"}
          whileTap={!isAdded ? "tap" : "idle"}
          animate={isAdded ? "added" : "idle"}
          onClick={onAdd}
          disabled={isAdded}
          className={`w-full py-2 px-4 rounded-lg font-medium text-sm flex items-center justify-center gap-2 transition-all ${
            isAdded
              ? 'bg-green-500 text-white cursor-default'
              : 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700'
          }`}
        >
          <AnimatePresence mode="wait">
            {isAdded ? (
              <motion.div
                key="added"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="flex items-center gap-1"
              >
                <CheckIcon className="h-4 w-4" />
                <span>Added</span>
              </motion.div>
            ) : (
              <motion.div
                key="add"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="flex items-center gap-1"
              >
                <PlusIcon className="h-4 w-4" />
                <span>Add</span>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>
      </div>
    </motion.div>
  );
};

/**
 * Lightweight Confetti Effect
 */
const ConfettiEffect = () => {
  const particles = Array.from({ length: 12 }, (_, i) => ({
    id: i,
    x: Math.random() * 100 - 50,
    y: Math.random() * -100 - 20,
    rotation: Math.random() * 360,
    color: ['#8B5CF6', '#EC4899', '#F97316', '#10B981', '#3B82F6'][Math.floor(Math.random() * 5)]
  }));

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-10">
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          initial={{
            x: '50%',
            y: '50%',
            scale: 0,
            rotate: 0,
            opacity: 1
          }}
          animate={{
            x: `calc(50% + ${particle.x}px)`,
            y: `calc(50% + ${particle.y}px)`,
            scale: [0, 1, 0],
            rotate: particle.rotation,
            opacity: [1, 1, 0]
          }}
          transition={{
            duration: 0.8,
            ease: 'easeOut'
          }}
          className="absolute w-2 h-2 rounded-full"
          style={{ backgroundColor: particle.color }}
        />
      ))}
    </div>
  );
};

/**
 * Compact version for checkout page
 */
export const CartAddonsCompact = ({ cartItems, onAddToCart }) => {
  return (
    <CartAddons
      cartItems={cartItems}
      onAddToCart={onAddToCart}
      className="mb-6"
    />
  );
};

/**
 * Drawer version for mobile
 */
export const CartAddonsDrawer = ({ 
  cartItems, 
  onAddToCart, 
  isOpen, 
  onClose 
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-40"
          />
          
          {/* Drawer */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl z-50 max-h-[80vh] overflow-auto"
          >
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
              <h3 className="font-bold text-lg">Complete Your Order</h3>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            
            <CartAddons
              cartItems={cartItems}
              onAddToCart={onAddToCart}
              isExpanded={true}
              className="rounded-none border-0"
            />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CartAddons;
