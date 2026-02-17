import React from 'react';
import { motion } from 'framer-motion';
import { DELIVERY_OPTIONS } from '../utils/enhancedShippingUtils';

const DeliveryOptions = ({ 
  selectedOption, 
  onOptionSelect, 
  subtotal = 0,
  className = '' 
}) => {
  const getDeliveryCost = (optionKey) => {
    const option = DELIVERY_OPTIONS[optionKey];
    if (!option) return 0;
    
    // Free delivery for orders over 50,000 RWF with standard delivery
    if (optionKey === 'standard' && subtotal >= 50000) {
      return 0;
    }
    
    return option.price;
  };

  const getTotalPrice = (optionKey) => {
    return subtotal + getDeliveryCost(optionKey);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="text-center mb-6">
        <h3 className="text-xl font-semibold text-gray-900">Choose Delivery Option</h3>
        <p className="text-gray-600 mt-1">Select your preferred delivery method</p>
      </div>

      <div className="grid gap-4">
        {Object.entries(DELIVERY_OPTIONS).map(([key, option]) => {
          const isSelected = selectedOption === key;
          const deliveryCost = getDeliveryCost(key);
          const totalPrice = getTotalPrice(key);
          const isFreeDelivery = deliveryCost === 0;
          
          return (
            <motion.div
              key={key}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`relative p-6 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                isSelected
                  ? 'border-purple-500 bg-purple-50 shadow-lg'
                  : 'border-gray-200 hover:border-purple-300 hover:bg-purple-25'
              }`}
              onClick={() => onOptionSelect(key)}
            >
              {/* Selection Indicator */}
              {isSelected && (
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center">
                  <svg className="h-4 w-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}

              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-2xl ${
                      isSelected ? 'bg-purple-100' : 'bg-gray-100'
                    }`}>
                      {option.icon}
                    </div>
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h4 className="font-semibold text-gray-900">{option.name}</h4>
                      {isFreeDelivery && (
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full font-medium">
                          FREE
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{option.description}</p>
                    
                    <div className="flex items-center space-x-4 text-sm">
                      <span className="text-gray-500">
                        📅 {option.time}
                      </span>
                      {subtotal > 0 && (
                        <span className="text-gray-500">
                          💰 {deliveryCost > 0 ? `${deliveryCost.toLocaleString()} RWF` : 'Free'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  {subtotal > 0 ? (
                    <div>
                      <p className="text-sm text-gray-600">Total</p>
                      <p className={`font-bold text-lg ${
                        isSelected ? 'text-purple-600' : 'text-gray-900'
                      }`}>
                        {totalPrice.toLocaleString()} RWF
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-sm text-gray-600">Cost</p>
                      <p className={`font-bold ${
                        isSelected ? 'text-purple-600' : 'text-gray-900'
                      }`}>
                        {deliveryCost > 0 ? `${deliveryCost.toLocaleString()} RWF` : 'Free'}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Free delivery notice for standard option */}
              {key === 'standard' && subtotal >= 50000 && (
                <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <span className="text-green-600">🎉</span>
                    <p className="text-sm text-green-800 font-medium">
                      Free delivery on orders over 50,000 RWF!
                    </p>
                  </div>
                </div>
              )}

              {/* Express delivery notice */}
              {key === 'express' && (
                <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <span className="text-blue-600">⚡</span>
                    <p className="text-sm text-blue-800">
                      Perfect for urgent orders - delivered next business day
                    </p>
                  </div>
                </div>
              )}

              {/* Same day delivery notice */}
              {key === 'sameDay' && (
                <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <span className="text-orange-600">🚀</span>
                    <p className="text-sm text-orange-800">
                      Ultra-fast delivery within 4-6 hours (subject to availability)
                    </p>
                  </div>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Delivery Information */}
      <div className="mt-6 p-4 bg-gray-50 rounded-xl">
        <h4 className="font-semibold text-gray-900 mb-2">Delivery Information</h4>
        <div className="space-y-2 text-sm text-gray-600">
          <div className="flex items-center space-x-2">
            <span>📦</span>
            <span>Orders are processed within 24 hours</span>
          </div>
          <div className="flex items-center space-x-2">
            <span>🕒</span>
            <span>Delivery times are estimates and may vary</span>
          </div>
          <div className="flex items-center space-x-2">
            <span>📞</span>
            <span>You'll receive SMS updates on your delivery status</span>
          </div>
          <div className="flex items-center space-x-2">
            <span>🔒</span>
            <span>Secure delivery with signature confirmation</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeliveryOptions; 