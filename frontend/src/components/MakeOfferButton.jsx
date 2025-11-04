import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { SparklesIcon, XMarkIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline';

const MakeOfferButton = ({ product, onSuccess, buttonClass = '' }) => {
  const [showModal, setShowModal] = useState(false);
  const [offerPrice, setOfferPrice] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [response, setResponse] = useState(null);
  const [offerHistory, setOfferHistory] = useState([]);

  const getDeviceId = () => {
    let deviceId = localStorage.getItem('deviceId');
    if (!deviceId) {
      deviceId = `device-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('deviceId', deviceId);
    }
    return deviceId;
  };

  const handleSubmitOffer = async () => {
    if (!offerPrice || isNaN(offerPrice) || parseFloat(offerPrice) <= 0) {
      setResponse({
        type: 'error',
        message: 'Please enter a valid price! 🔢'
      });
      return;
    }

    setIsProcessing(true);
    setResponse(null);

    try {
      const deviceId = getDeviceId();
      const res = await axios.post('/api/offers/make', {
        productId: product.id,
        offeredPrice: parseFloat(offerPrice),
        customerInfo: { deviceId }
      });

      if (res.data.success) {
        const { offer } = res.data;
        
        // Add to history
        setOfferHistory([...offerHistory, {
          customerOffer: parseFloat(offerPrice),
          aiDecision: offer.decision,
          aiCounter: offer.counterOffer,
          message: offer.message
        }]);

        setResponse({
          type: offer.decision,
          ...offer
        });

        // If accepted, call success callback
        if (offer.decision === 'accept' && onSuccess) {
          setTimeout(() => {
            onSuccess(product, offer.counterOffer);
            setShowModal(false);
          }, 2000);
        } else if (offer.decision === 'counter') {
          // Reset price for next offer
          setOfferPrice('');
        }
      } else {
        setResponse({
          type: 'error',
          message: res.data.message || 'Failed to process offer'
        });
      }
    } catch (error) {
      console.error('Offer error:', error);
      setResponse({
        type: 'error',
        message: error.response?.data?.message || 'Something went wrong. Please try again!'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const resetModal = () => {
    setShowModal(false);
    setOfferPrice('');
    setResponse(null);
    setOfferHistory([]);
  };

  return (
    <>
      {/* Make Offer Button */}
      <button
        onClick={() => setShowModal(true)}
        className={buttonClass || "flex-1 bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center space-x-2"}
      >
        <SparklesIcon className="h-5 w-5" />
        <span>Make Offer</span>
      </button>

      {/* Offer Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={resetModal}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold flex items-center space-x-2">
                  <SparklesIcon className="h-6 w-6 text-purple-600" />
                  <span>Make an Offer</span>
                </h3>
                <button
                  onClick={resetModal}
                  className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <XMarkIcon className="h-6 w-6 text-gray-600" />
                </button>
              </div>

              {/* Product Info */}
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <div className="flex items-center space-x-4">
                  <img
                    src={product.mainImage || product.image || '/placeholder.png'}
                    alt={product.name}
                    className="w-16 h-16 object-cover rounded-lg"
                  />
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">{product.name}</h4>
                    <p className="text-sm text-gray-600">
                      Original Price: <span className="font-bold text-orange-600">{product.price.toLocaleString()} RWF</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Offer History */}
              {offerHistory.length > 0 && (
                <div className="mb-4 space-y-2">
                  {offerHistory.map((history, index) => (
                    <div key={index} className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <p className="text-sm">
                        <span className="font-semibold">You:</span> {history.customerOffer.toLocaleString()} RWF
                      </p>
                      <p className="text-sm text-blue-800 mt-1">
                        <span className="font-semibold">AI:</span> {history.message}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {/* Response */}
              {response && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-4 rounded-lg mb-4 ${
                    response.type === 'accept'
                      ? 'bg-green-50 border border-green-300'
                      : response.type === 'counter'
                      ? 'bg-yellow-50 border border-yellow-300'
                      : response.type === 'reject'
                      ? 'bg-red-50 border border-red-300'
                      : 'bg-gray-50 border border-gray-300'
                  }`}
                >
                  <p className={`text-sm font-semibold mb-2 ${
                    response.type === 'accept' ? 'text-green-800' :
                    response.type === 'counter' ? 'text-yellow-800' :
                    response.type === 'reject' ? 'text-red-800' : 'text-gray-800'
                  }`}>
                    {response.type === 'accept' && '🎉 Offer Accepted!'}
                    {response.type === 'counter' && '💰 Counter Offer'}
                    {response.type === 'reject' && '❌ Offer Declined'}
                    {response.type === 'error' && '⚠️ Error'}
                  </p>
                  <p className="text-sm text-gray-700">{response.message}</p>
                  {response.savings > 0 && (
                    <p className="text-sm text-green-600 mt-2">
                      You save: {response.savings.toLocaleString()} RWF ({response.discount}% off)
                    </p>
                  )}
                </motion.div>
              )}

              {/* Input */}
              {response?.type !== 'accept' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Your Offer (RWF)
                    </label>
                    <input
                      type="number"
                      value={offerPrice}
                      onChange={(e) => setOfferPrice(e.target.value)}
                      placeholder="Enter your price"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      onKeyPress={(e) => e.key === 'Enter' && handleSubmitOffer()}
                      disabled={isProcessing}
                    />
                  </div>

                  {response?.canNegotiate === false && (
                    <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                      ℹ️ This is the final offer. Take it or leave it!
                    </p>
                  )}

                  <div className="flex space-x-3">
                    <button
                      onClick={resetModal}
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                      disabled={isProcessing}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSubmitOffer}
                      disabled={isProcessing || !offerPrice}
                      className="flex-1 bg-purple-600 text-white px-4 py-3 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                    >
                      {isProcessing ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                          <span>Processing...</span>
                        </>
                      ) : (
                        <>
                          <PaperAirplaneIcon className="h-5 w-5" />
                          <span>Submit Offer</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default MakeOfferButton;
