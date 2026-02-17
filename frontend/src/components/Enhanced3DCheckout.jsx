import React from 'react';
import { motion } from 'framer-motion';
import { 
  ShoppingBagIcon, 
  SparklesIcon,
  TruckIcon,
  ShieldCheckIcon,
  HeartIcon,
  StarIcon
} from '@heroicons/react/24/solid';

const Enhanced3DCheckout = ({ cart, cartTotal, shippingCost = 2000 }) => {
  const grandTotal = cartTotal + shippingCost;
  return (
    <div className="relative">
      {/* Floating 3D Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Animated Shopping Bag */}
        <motion.div
          className="absolute top-10 right-10"
          animate={{
            y: [0, -20, 0],
            rotate: [0, 5, -5, 0]
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <div className="relative w-32 h-32">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-400 to-pink-400 rounded-3xl transform rotate-6 opacity-20 blur-xl"></div>
            <ShoppingBagIcon className="w-32 h-32 text-purple-600 drop-shadow-2xl" />
            <motion.div
              className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <SparklesIcon className="w-5 h-5 text-white" />
            </motion.div>
          </div>
        </motion.div>

        {/* Floating Hearts */}
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute"
            style={{
              left: `${20 + i * 15}%`,
              top: `${30 + (i % 3) * 20}%`
            }}
            animate={{
              y: [0, -30, 0],
              opacity: [0.3, 0.7, 0.3],
              scale: [1, 1.2, 1]
            }}
            transition={{
              duration: 3 + i,
              repeat: Infinity,
              delay: i * 0.5
            }}
          >
            <HeartIcon className="w-8 h-8 text-pink-400" />
          </motion.div>
        ))}

        {/* Delivery Truck Animation */}
        <motion.div
          className="absolute bottom-20 left-0"
          animate={{
            x: ['0%', '100%'],
            rotate: [0, 2, 0, -2, 0]
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear"
          }}
        >
          <div className="relative">
            <TruckIcon className="w-24 h-24 text-green-600 drop-shadow-lg" />
            <motion.div
              className="absolute -top-3 -right-3"
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            >
              <SparklesIcon className="w-6 h-6 text-yellow-400" />
            </motion.div>
          </div>
        </motion.div>

        {/* Floating Stars */}
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={`star-${i}`}
            className="absolute"
            style={{
              left: `${10 + i * 10}%`,
              top: `${10 + (i % 4) * 20}%`
            }}
            animate={{
              rotate: [0, 360],
              scale: [0.5, 1, 0.5]
            }}
            transition={{
              duration: 4 + i * 0.5,
              repeat: Infinity,
              delay: i * 0.3
            }}
          >
            <StarIcon className="w-4 h-4 text-yellow-400 opacity-50" />
          </motion.div>
        ))}
      </div>

      {/* Checkout Summary Card with 3D Effect */}
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 bg-white rounded-3xl shadow-2xl p-8 border-4 border-purple-100"
        style={{
          transform: 'perspective(1000px) rotateX(2deg)',
          transformStyle: 'preserve-3d'
        }}
      >
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 rounded-3xl opacity-50"></div>
        
        <div className="relative z-10">
          {/* Header */}
          <div className="text-center mb-6">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="inline-block"
            >
              <ShieldCheckIcon className="w-16 h-16 mx-auto text-green-500 mb-3" />
            </motion.div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Secure Checkout
            </h2>
            <p className="text-gray-600 mt-2">Your order is protected</p>
          </div>

          {/* Order Summary */}
          <div className="bg-white bg-opacity-80 backdrop-blur rounded-2xl p-6 mb-6 shadow-lg">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
              <ShoppingBagIcon className="w-6 h-6 mr-2 text-purple-600" />
              Order Summary
            </h3>
            
            {cart && cart.length > 0 ? (
              <div className="space-y-3">
                {cart.map((item, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center justify-between p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <img 
                        src={item.mainImage || item.image} 
                        alt={item.name}
                        className="w-16 h-16 object-cover rounded-lg shadow-md"
                      />
                      <div>
                        <p className="font-semibold text-gray-900">{item.name}</p>
                        <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                      </div>
                    </div>
                    <p className="font-bold text-purple-600">
                      {(item.price * item.quantity).toLocaleString()} RWF
                    </p>
                  </motion.div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No items in cart</p>
            )}

            {/* Order Summary */}
            <div className="mt-6 pt-6 border-t-2 border-purple-200 space-y-3">
              {/* Subtotal */}
              <div className="flex justify-between items-center text-gray-700">
                <span className="text-lg">Subtotal:</span>
                <span className="text-lg font-semibold">{cartTotal.toLocaleString()} RWF</span>
              </div>
              
              {/* Shipping */}
              <div className="flex justify-between items-center text-gray-700">
                <span className="text-lg flex items-center gap-2">
                  <TruckIcon className="w-5 h-5 text-blue-500" />
                  Shipping:
                </span>
                <span className="text-lg font-semibold">{shippingCost.toLocaleString()} RWF</span>
              </div>
              
              {/* Total */}
              <div className="flex justify-between items-center pt-3 border-t border-purple-200">
                <span className="text-2xl font-bold text-gray-900">Total:</span>
                <motion.span
                  className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent"
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  {grandTotal.toLocaleString()} RWF
                </motion.span>
              </div>
            </div>
          </div>

          {/* Trust Badges */}
          <div className="grid grid-cols-3 gap-4 mt-6">
            {[
              { icon: ShieldCheckIcon, text: '100% Secure', color: 'text-green-500' },
              { icon: TruckIcon, text: 'Fast Delivery', color: 'text-blue-500' },
              { icon: HeartIcon, text: 'Satisfaction', color: 'text-pink-500' }
            ].map((badge, index) => (
              <motion.div
                key={index}
                whileHover={{ scale: 1.1 }}
                className="flex flex-col items-center p-4 bg-white rounded-xl shadow-md"
              >
                <badge.icon className={`w-8 h-8 ${badge.color} mb-2`} />
                <span className="text-xs font-semibold text-gray-700 text-center">{badge.text}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Enhanced3DCheckout;
