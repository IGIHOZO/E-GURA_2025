import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TagIcon, 
  CheckCircleIcon,
  XCircleIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import axios from 'axios';

const CouponInput = ({ orderTotal, onCouponApplied }) => {
  const [couponCode, setCouponCode] = useState('');
  const [applying, setApplying] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [error, setError] = useState(null);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Popular coupons (can be fetched from API)
  const popularCoupons = [
    { code: 'WELCOME10', discount: '10%', description: 'Welcome discount for new customers' },
    { code: 'SAVE20', discount: '20%', description: 'Save on orders above 100,000 RWF' },
    { code: 'FREESHIP', discount: 'Free Shipping', description: 'On orders above 30,000 RWF' }
  ];

  const applyCoupon = async (code) => {
    setApplying(true);
    setError(null);

    try {
      const response = await axios.post('/api/checkout/apply-coupon', {
        code: code || couponCode,
        orderTotal
      });

      if (response.data.success) {
        const couponData = {
          code: response.data.code,
          discount: response.data.discount,
          type: response.data.type,
          description: response.data.description,
          freeShipping: response.data.freeShipping
        };

        setAppliedCoupon(couponData);
        setCouponCode('');
        setShowSuggestions(false);

        // Notify parent component
        if (onCouponApplied) {
          onCouponApplied(couponData);
        }
      } else {
        setError(response.data.error || 'Invalid coupon code');
      }
    } catch (err) {
      console.error('Coupon error:', err);
      setError(err.response?.data?.error || 'Failed to apply coupon. Please try again.');
    } finally {
      setApplying(false);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    setError(null);
    
    if (onCouponApplied) {
      onCouponApplied(null);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (couponCode.trim()) {
      applyCoupon(couponCode.trim());
    }
  };

  return (
    <div className="w-full">
      {/* Applied Coupon Display */}
      <AnimatePresence>
        {appliedCoupon && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-4 bg-green-50 border border-green-300 rounded-lg p-4"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3">
                <CheckCircleIcon className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-green-900">
                    Coupon Applied: {appliedCoupon.code}
                  </p>
                  <p className="text-sm text-green-700 mt-1">
                    {appliedCoupon.description}
                  </p>
                  <div className="mt-2 flex items-center space-x-4">
                    <span className="text-lg font-bold text-green-900">
                      {appliedCoupon.freeShipping ? (
                        'Free Shipping'
                      ) : (
                        `-${appliedCoupon.discount.toLocaleString()} RWF`
                      )}
                    </span>
                    {appliedCoupon.freeShipping && (
                      <span className="text-sm text-green-700">
                        Shipping cost waived
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <button
                onClick={removeCoupon}
                className="text-green-700 hover:text-green-900 font-medium text-sm"
              >
                Remove
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Coupon Input Form */}
      {!appliedCoupon && (
        <div>
          <form onSubmit={handleSubmit} className="mb-4">
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <TagIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={couponCode}
                  onChange={(e) => {
                    setCouponCode(e.target.value.toUpperCase());
                    setError(null);
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  placeholder="Enter coupon code"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent uppercase"
                  disabled={applying}
                />
              </div>
              <button
                type="submit"
                disabled={applying || !couponCode.trim()}
                className="px-6 py-3 bg-orange-600 text-white rounded-lg font-semibold hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
              >
                {applying ? 'Applying...' : 'Apply'}
              </button>
            </div>
          </form>

          {/* Error Message */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3 flex items-start"
              >
                <XCircleIcon className="h-5 w-5 text-red-600 mr-2 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{error}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Popular Coupons Suggestions */}
          <AnimatePresence>
            {showSuggestions && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-2"
              >
                <div className="flex items-center space-x-2 mb-3">
                  <SparklesIcon className="h-4 w-4 text-orange-600" />
                  <p className="text-sm font-medium text-gray-700">Available Coupons</p>
                </div>
                
                {popularCoupons.map((coupon) => (
                  <motion.button
                    key={coupon.code}
                    onClick={() => applyCoupon(coupon.code)}
                    className="w-full text-left bg-gradient-to-r from-orange-50 to-red-50 hover:from-orange-100 hover:to-red-100 border border-orange-200 rounded-lg p-3 transition-all group"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-orange-900 text-sm group-hover:text-orange-700">
                          {coupon.code}
                        </p>
                        <p className="text-xs text-gray-600 mt-0.5">
                          {coupon.description}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-orange-600">
                          {coupon.discount}
                        </p>
                        <p className="text-xs text-gray-500">OFF</p>
                      </div>
                    </div>
                  </motion.button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

export default CouponInput;
