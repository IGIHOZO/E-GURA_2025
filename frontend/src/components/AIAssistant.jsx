import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { useCart } from '../context/CartContext';
import { Link } from 'react-router-dom';
import {
  ChatBubbleLeftRightIcon,
  XMarkIcon,
  PaperAirplaneIcon,
  SparklesIcon,
  ShoppingBagIcon
} from '@heroicons/react/24/outline';

const AIAssistant = ({ currentProduct = null }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [suggestedProducts, setSuggestedProducts] = useState([]);
  const [makingOffer, setMakingOffer] = useState(null);
  const [offerPrice, setOfferPrice] = useState('');
  const [deviceId, setDeviceId] = useState('');
  const [lastCounterOffer, setLastCounterOffer] = useState(null); // Track counter offers
  const [hasInitialized, setHasInitialized] = useState(false); // Track if already initialized
  
  const messagesEndRef = useRef(null);
  const { addToCart } = useCart();

  // Generate or retrieve device ID
  useEffect(() => {
    let id = localStorage.getItem('deviceId');
    if (!id) {
      id = 'device-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('deviceId', id);
    }
    setDeviceId(id);
  }, []);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Initialize with greeting (context-aware if on product page)
  useEffect(() => {
    if (isOpen && !hasInitialized) {
      setHasInitialized(true);
      
      if (currentProduct) {
        // Product-specific greeting
        addMessage({
          type: 'ai',
          text: `Hi! 👋 I see you're looking at **${currentProduct.name}**!\n\nCurrently ${currentProduct.price?.toLocaleString() || 'N/A'} RWF.\n\n💬 I can help you:\n• Make an offer and negotiate a better price\n• Answer questions about this product\n• Find similar items\n\nWhat would you like to do?`,
          timestamp: new Date()
        });
        
        // Show product as suggestion
        setSuggestedProducts([{
          id: currentProduct.id || currentProduct._id,
          name: currentProduct.name,
          price: currentProduct.price,
          image: currentProduct.mainImage || currentProduct.image,
          category: currentProduct.category
        }]);
      } else {
        // Generic greeting
        addMessage({
          type: 'ai',
          text: "Hi! 👋 I'm your AI shopping assistant. I can help you find products and even negotiate prices! What are you looking for?",
          timestamp: new Date()
        });
      }
    }
  }, [isOpen, currentProduct, hasInitialized]);

  const addMessage = (message) => {
    setMessages((prev) => [...prev, message]);
  };

  const extractOfferAmount = (text) => {
    // Try to extract numbers from various formats
    const patterns = [
      /(\d+(?:,\d{3})*(?:\.\d+)?)\s*(?:rwf|francs?)?/i,
      /offer\s+(\d+(?:,\d{3})*(?:\.\d+)?)/i,
      /pay\s+(\d+(?:,\d{3})*(?:\.\d+)?)/i,
      /give\s+(\d+(?:,\d{3})*(?:\.\d+)?)/i,
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        return parseFloat(match[1].replace(/,/g, ''));
      }
    }
    return null;
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage = inputMessage;
    const lowerMessage = userMessage.toLowerCase().trim();
    
    // Add user message
    addMessage({
      type: 'user',
      text: userMessage,
      timestamp: new Date()
    });

    setInputMessage('');
    setIsTyping(true);

    // Expanded acceptance keywords (multilingual)
    const acceptanceKeywords = [
      'accept', 'accepted', 'yes', 'yeah', 'yep', 'yup', 'ok', 'okay', 'sure',
      'deal', 'agreed', 'fine', 'good', 'great', 'perfect', 'sounds good',
      'i accept', 'i agree', 'lets do it', 'go ahead', 'confirm', 'confirmed',
      // French
      'oui', 'dacord', 'd\'accord', 'bien', 'parfait',
      // Kinyarwanda
      'ego', 'yego', 'nibyo', 'sawa',
      // Swahili
      'ndio', 'sawa', 'nzuri'
    ];
    
    const isAccepting = acceptanceKeywords.some(keyword => 
      lowerMessage === keyword || lowerMessage.includes(keyword)
    );

    // Debug logging
    console.log('🔍 DEBUG - Message:', lowerMessage);
    console.log('🔍 DEBUG - Is accepting:', isAccepting);
    console.log('🔍 DEBUG - lastCounterOffer:', lastCounterOffer);
    console.log('🔍 DEBUG - makingOffer:', makingOffer);

    // Check if user is accepting a counter-offer
    if (lastCounterOffer && isAccepting) {
      console.log('✅ User accepted counter-offer:', lastCounterOffer);
      console.log('✅ Acceptance keyword detected:', lowerMessage);
      
      // Add to cart at counter-offer price
      try {
        addToCart({
          ...lastCounterOffer.product,
          price: lastCounterOffer.price
        }, 'Default', 'Default', 1);
        
        addMessage({
          type: 'system',
          text: `🎉 Deal accepted! Added ${lastCounterOffer.product.name} to cart at ${lastCounterOffer.price.toLocaleString()} RWF!`,
          timestamp: new Date()
        });
        
        addMessage({
          type: 'ai',
          text: "Awesome! 🎉 Your item is in the cart. Ready to checkout or want to keep shopping?",
          timestamp: new Date()
        });
        
        // Clear offer state
        setMakingOffer(null);
        setLastCounterOffer(null);
        setOfferPrice('');
        setSuggestedProducts([]); // Clear products too
        setIsTyping(false);
        return; // IMPORTANT: Return here to stop further processing
      } catch (error) {
        console.error('Error adding to cart:', error);
        addMessage({
          type: 'ai',
          text: "Oops! Had trouble adding to cart. Please try clicking 'Add to Cart' button instead! 😊",
          timestamp: new Date()
        });
        setIsTyping(false);
        return; // IMPORTANT: Return here too
      }
    }

    // Check if user is making an offer through natural language
    if (makingOffer) {
      const offerAmount = extractOfferAmount(userMessage);
      if (offerAmount && offerAmount > 0) {
        setOfferPrice(offerAmount.toString());
        await handleSubmitOfferDirect(offerAmount);
        setIsTyping(false);
        return;
      }
    }

    try {
      console.log('📤 Sending message to AI:', userMessage);
      
      const response = await axios.post('/api/offers/chat', {
        message: userMessage,
        userId: deviceId,
        context: {
          deviceId: deviceId,
          timestamp: new Date().toISOString()
        }
      });

      console.log('📥 AI Response:', response.data);

      if (response.data.success) {
        // Add AI response with personalization indicator
        const aiMessage = {
          type: 'ai',
          text: response.data.reply,
          timestamp: new Date()
        };
        
        if (response.data.personalized) {
          aiMessage.personalized = true;
        }
        
        addMessage(aiMessage);

        // Handle product suggestions
        if (response.data.suggestions && response.data.suggestions.length > 0) {
          setSuggestedProducts(response.data.suggestions);
        } else {
          setSuggestedProducts([]);
        }
      } else {
        // Handle error response
        addMessage({
          type: 'ai',
          text: response.data.reply || "I couldn't process that. Could you rephrase that or give me more details? 😊",
          timestamp: new Date()
        });
      }
    } catch (error) {
      console.error('❌ Chat error:', error);
      console.error('Error details:', error.response?.data || error.message);
      
      let errorMessage = "I'm having trouble connecting. Please check if the backend is running! 😅";
      
      if (error.response?.data?.reply) {
        errorMessage = error.response.data.reply;
      } else if (error.code === 'ERR_NETWORK') {
        errorMessage = "Cannot connect to the server. Is the backend running on port 5000? 🔌";
      }
      
      addMessage({
        type: 'ai',
        text: errorMessage,
        timestamp: new Date()
      });
    } finally {
      setIsTyping(false);
    }
  };

  const handleMakeOffer = (product) => {
    console.log('🎯 Make Offer clicked for product:', product);
    
    // Ensure product has valid ID
    if (!product.id && !product._id) {
      console.error('❌ Product missing ID:', product);
      addMessage({
        type: 'ai',
        text: "Sorry, there's an issue with this product. Please try another one! 😅",
        timestamp: new Date()
      });
      return;
    }
    
    // Normalize product data
    const normalizedProduct = {
      ...product,
      id: product.id || product._id,
      image: product.image || product.mainImage || '/placeholder.png'
    };
    
    setMakingOffer(normalizedProduct);
    setOfferPrice('');
    addMessage({
      type: 'ai',
      text: `Great choice! ${normalizedProduct.name} is currently ${normalizedProduct.price.toLocaleString()} RWF. What price would you like to offer? 💰`,
      timestamp: new Date()
    });
  };

  const handleSubmitOfferDirect = async (price) => {
    if (!makingOffer) return;
    
    return handleSubmitOfferWithPrice(price);
  };

  const handleSubmitOffer = async () => {
    if (!offerPrice || !makingOffer) {
      console.error('❌ Missing data:', { offerPrice, makingOffer });
      return;
    }

    const price = parseFloat(offerPrice);
    if (isNaN(price) || price <= 0) {
      addMessage({
        type: 'ai',
        text: "Please enter a valid price! 😊",
        timestamp: new Date()
      });
      return;
    }

    return handleSubmitOfferWithPrice(price);
  };

  const handleSubmitOfferWithPrice = async (price) => {
    if (!makingOffer) return;

    // Validate product ID
    if (!makingOffer.id) {
      console.error('❌ Product ID missing:', makingOffer);
      addMessage({
        type: 'ai',
        text: "Oops! Product ID is missing. Please try selecting the product again! 🔍",
        timestamp: new Date()
      });
      return;
    }

    addMessage({
      type: 'user',
      text: `I offer ${price.toLocaleString()} RWF for ${makingOffer.name}`,
      timestamp: new Date()
    });

    setIsTyping(true);

    try {
      console.log('📤 Submitting offer:', {
        productId: makingOffer.id,
        productName: makingOffer.name,
        offeredPrice: price,
        deviceId: deviceId || 'guest',
        fullProduct: makingOffer
      });

      const response = await axios.post('/api/offers/make', {
        productId: makingOffer.id,
        offeredPrice: price,
        customerInfo: { deviceId: deviceId || 'guest' }
      });

      console.log('📥 Offer response:', response.data);
      console.log('✅ Response success:', response.data.success);

      if (response.data.success) {
        const { offer } = response.data;

        addMessage({
          type: 'ai',
          text: offer.message,
          timestamp: new Date()
        });

        // If accepted, add to cart
        if (offer.decision === 'accept') {
          addToCart({
            ...makingOffer,
            price: offer.counterOffer
          }, 'Default', 'Default', 1);
          
          addMessage({
            type: 'system',
            text: `✅ Added to cart at ${offer.counterOffer.toLocaleString()} RWF!`,
            timestamp: new Date()
          });
          
          setMakingOffer(null);
          setLastCounterOffer(null);
          setOfferPrice('');
        } else if (offer.decision === 'counter') {
          // AI counter-offered, store for user to accept
          const counterOffer = {
            product: makingOffer,
            price: offer.counterOffer,
            timestamp: Date.now()
          };
          
          console.log('💰 STORING Counter-offer:', counterOffer);
          console.log('💰 Product details:', {
            id: makingOffer.id,
            name: makingOffer.name,
            price: offer.counterOffer
          });
          
          setLastCounterOffer(counterOffer);
          
          // Verify it was set (log after setState)
          setTimeout(() => {
            console.log('✅ Counter-offer state after set:', counterOffer);
          }, 100);
          
          setOfferPrice('');
          
          // Add helpful message
          addMessage({
            type: 'system',
            text: `💡 Type "accepted", "yes", "deal", or any acceptance word to take this deal!`,
            timestamp: new Date()
          });
        } else {
          // Rejected
          setMakingOffer(null);
          setLastCounterOffer(null);
          setOfferPrice('');
        }
      } else {
        // Handle unsuccessful response
        addMessage({
          type: 'ai',
          text: response.data.message || "I couldn't process that offer. Please try again! 😊",
          timestamp: new Date()
        });
      }
    } catch (error) {
      console.error('❌ Offer error:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error message:', error.message);
      
      let errorMessage = "Oops! Something went wrong. Let's try again! 😅";
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.code === 'ERR_NETWORK') {
        errorMessage = "Cannot connect to server. Is the backend running? 🔌";
      } else if (error.response?.status === 404) {
        errorMessage = "Product not found. Please try another product! 🔍";
      } else if (error.response?.status === 500) {
        errorMessage = "Server error. Our team is on it! Please try again in a moment. 🛠️";
      }
      
      addMessage({
        type: 'ai',
        text: errorMessage,
        timestamp: new Date()
      });
    } finally {
      setIsTyping(false);
    }
  };

  const handleAddToCart = (product) => {
    addToCart(product, 'Default', 'Default', 1);
    addMessage({
      type: 'system',
      text: `✅ ${product.name} added to cart at ${product.price.toLocaleString()} RWF!`,
      timestamp: new Date()
    });
    setSuggestedProducts([]);
  };

  return (
    <>
      {/* AI Assistant Toggle Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => {
              console.log('AI Assistant opened');
              setIsOpen(true);
            }}
            className="fixed bottom-6 right-6 z-[9999] bg-gradient-to-r from-orange-600 to-red-600 text-white p-4 rounded-full shadow-2xl hover:shadow-3xl transition-all"
            style={{ zIndex: 9999 }}
          >
            <div className="relative">
              <ChatBubbleLeftRightIcon className="h-7 w-7" />
              <SparklesIcon className="absolute -top-1 -right-1 h-4 w-4 text-yellow-300 animate-pulse" />
            </div>
          </motion.button>
        )}
      </AnimatePresence>

      {/* AI Assistant Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.8 }}
            className="fixed bottom-6 right-6 z-[9999] w-96 max-w-[calc(100vw-3rem)] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden"
            style={{ height: '600px', maxHeight: 'calc(100vh - 3rem)', zIndex: 9999 }}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-orange-600 to-red-600 text-white p-4 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="relative">
                  <SparklesIcon className="h-6 w-6 animate-pulse" />
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white animate-pulse"></div>
                </div>
                <div>
                  <h3 className="font-bold flex items-center space-x-2">
                    <span>AI Assistant</span>
                    <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">🧠 Learning</span>
                  </h3>
                  <p className="text-xs text-orange-100">Personalized shopping experience</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-white/20 rounded-full transition-colors"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                      message.type === 'user'
                        ? 'bg-orange-600 text-white'
                        : message.type === 'system'
                        ? 'bg-green-100 text-green-800 border border-green-300'
                        : 'bg-white text-gray-800 shadow-md'
                    }`}
                  >
                    {message.personalized && (
                      <div className="flex items-center space-x-1 mb-1">
                        <SparklesIcon className="h-3 w-3 text-purple-600" />
                        <span className="text-xs text-purple-600 font-semibold">Personalized for you</span>
                      </div>
                    )}
                    <p className="text-sm whitespace-pre-line">{message.text}</p>
                    <p className="text-xs opacity-70 mt-1">
                      {new Date(message.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
              ))}

              {/* Product Suggestions */}
              {suggestedProducts.length > 0 && (
                <div className="space-y-2">
                  {suggestedProducts.map((product) => (
                    <motion.div
                      key={product.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="bg-white rounded-lg p-3 shadow-md"
                    >
                      <div className="flex items-center space-x-3">
                        <img
                          src={product.image || '/placeholder.png'}
                          alt={product.name}
                          className="w-16 h-16 object-cover rounded-lg"
                        />
                        <div className="flex-1">
                          <h4 className="font-semibold text-sm text-gray-900">{product.name}</h4>
                          <p className="text-orange-600 font-bold">{product.price.toLocaleString()} RWF</p>
                          <div className="flex space-x-2 mt-2">
                            <button
                              onClick={() => handleMakeOffer(product)}
                              className="text-xs bg-purple-100 text-purple-700 px-3 py-1 rounded-full hover:bg-purple-200 transition-colors"
                            >
                              Make Offer
                            </button>
                            <button
                              onClick={() => handleAddToCart(product)}
                              className="text-xs bg-orange-100 text-orange-700 px-3 py-1 rounded-full hover:bg-orange-200 transition-colors"
                            >
                              Add to Cart
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}

              {/* Typing Indicator */}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-white rounded-2xl px-4 py-3 shadow-md">
                    <div className="flex space-x-2">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></div>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white border-t border-gray-200">
              {makingOffer && (
                <div className="mb-2 bg-purple-50 border border-purple-200 rounded-lg p-2">
                  <p className="text-xs text-purple-700 font-medium">💬 Making offer for: {makingOffer.name}</p>
                  <p className="text-xs text-gray-600">Type your offer or amount (e.g., "i can pay only 140000 on sneaker")</p>
                  <button
                    onClick={() => {
                      setMakingOffer(null);
                      setOfferPrice('');
                    }}
                    className="text-xs text-purple-600 hover:text-purple-800 mt-1"
                  >
                    Cancel offer
                  </button>
                </div>
              )}
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder={makingOffer ? "Type your offer amount..." : "Ask me anything..."}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-orange-500"
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim()}
                  className="bg-orange-600 text-white p-2 rounded-full hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <PaperAirplaneIcon className="h-5 w-5" />
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-2 text-center">
                💬 {makingOffer ? 'Chat naturally to make your offer' : 'Type naturally, I understand you! 😊'}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default AIAssistant;
