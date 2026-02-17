import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { useCart } from '../context/CartContext';
import { Link, useNavigate } from 'react-router-dom';
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
  const [smartSuggestions, setSmartSuggestions] = useState([]);
  
  const messagesEndRef = useRef(null);
  const { addToCart } = useCart();
  const navigate = useNavigate();

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
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [messages]);

  // Initialize with greeting (context-aware if on product page)
  useEffect(() => {
    if (isOpen && !hasInitialized) {
      setHasInitialized(true);
      
      if (currentProduct) {
        // Product-specific greeting
        addMessage({
          type: 'ai',
          text: `Hi! 👋 I see you're looking at **${currentProduct.name}**!\n\nCurrently ${currentProduct.price?.toLocaleString() || 'N/A'} RWF.\n\n💬 I can help you:\n• Make an offer (up to 10% off) and negotiate the best price\n• Answer questions about this product\n• Find similar items\n\nWhat would you like to do?`,
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

  const extractOfferAmount = (message) => {
    const lowerMessage = message.toLowerCase();
    
    // Try to extract number from various formats
    const patterns = [
      /(\d+(?:,\d{3})*(?:\.\d+)?)\s*(?:rwf|francs?|frw)?/i,
      /(?:pay|offer|give)\s*(?:you)?\s*(\d+(?:,\d{3})*(?:\.\d+)?)/i,
      /only\s*(\d+(?:,\d{3})*(?:\.\d+)?)/i
    ];
    
    for (const pattern of patterns) {
      const match = lowerMessage.match(pattern);
      if (match) {
        return parseFloat(match[1].replace(/,/g, ''));
      }
    }
    return null;
  };

  // Generate smart suggestions based on context
  const generateSmartSuggestions = (input) => {
    if (!input || input.length < 2) {
      setSmartSuggestions([]);
      return;
    }

    const lower = input.toLowerCase();
    const suggestions = [];

    // If negotiating
    if (makingOffer) {
      // Detect partial acceptance
      if ('yes'.startsWith(lower) || 'accept'.startsWith(lower)) {
        suggestions.push('yes', 'yes, I accept');
      }
      if ('ok'.startsWith(lower) || 'okay'.startsWith(lower)) {
        suggestions.push('okay', 'ok, deal');
      }
      if ('proceed'.startsWith(lower)) {
        suggestions.push('proceed');
      }
      
      // Offer-related suggestions
      if (lower.includes('can') || lower.includes('pay')) {
        const discountPrice = Math.round(makingOffer.price * 0.9);
        suggestions.push(
          `I can pay ${discountPrice.toLocaleString()} RWF`,
          `Can you do ${discountPrice.toLocaleString()}?`
        );
      }
      if (lower.includes('how') || lower.includes('what')) {
        suggestions.push(
          'What is your best price?',
          'How much discount can you give?'
        );
      }
    } else if (lastCounterOffer) {
      // Counter-offer acceptance suggestions
      if ('yes'.startsWith(lower) || 'accept'.startsWith(lower)) {
        suggestions.push('yes, I accept', 'yes, add to cart');
      }
      if ('ok'.startsWith(lower)) {
        suggestions.push('okay, deal', 'ok, proceed');
      }
    } else {
      // General chat suggestions
      if (lower.includes('show') || lower.includes('find')) {
        suggestions.push(
          'Show me laptops',
          'Find phones under 200000',
          'Show me trending products'
        );
      }
      if (lower.includes('help') || lower.includes('what')) {
        suggestions.push(
          'What can you help me with?',
          'Help me find a product'
        );
      }
      if (lower.includes('price') || lower.includes('cheap')) {
        suggestions.push(
          'Show me cheap deals',
          'What are the best prices?'
        );
      }
    }

    setSmartSuggestions(suggestions.slice(0, 3)); // Max 3 suggestions
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage = inputMessage.trim();
    setInputMessage('');
    setSmartSuggestions([]); // Clear suggestions after sending

    addMessage({
      type: 'user',
      text: userMessage,
      timestamp: new Date()
    });

    setIsTyping(true);

    // Safety timeout - ensure typing indicator doesn't get stuck
    let typingTimeout = null;
    typingTimeout = setTimeout(() => {
      console.warn('⚠️ Typing indicator timeout - forcing clear');
      setIsTyping(false);
    }, 10000); // 10 second timeout

    // Expanded acceptance keywords (multilingual)
    const lowerMessage = userMessage.toLowerCase();
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
          text: `🎉 Deal closed! Added ${lastCounterOffer.product.name} to cart at ${lastCounterOffer.price.toLocaleString()} RWF!`,
          timestamp: new Date()
        });
        
        addMessage({
          type: 'ai',
          text: "Awesome! 🎉 Redirecting you to checkout in 2 seconds...",
          timestamp: new Date()
        });
        
        // Clear offer state
        setMakingOffer(null);
        setLastCounterOffer(null);
        setOfferPrice('');
        setSuggestedProducts([]); // Clear products too
        setIsTyping(false);
        
        // Auto-redirect to checkout after 2 seconds
        setTimeout(() => {
          navigate('/checkout');
        }, 2000);
        
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
      console.log('🔗 API URL:', '/api/offers/chat');
      console.log('👤 Device ID:', deviceId);
      
      const response = await axios.post('/api/offers/chat', {
        message: userMessage,
        userId: deviceId,
        context: {
          deviceId: deviceId,
          timestamp: new Date().toISOString()
        }
      }, {
        timeout: 8000 // 8 second timeout
      });

      console.log('📥 AI Response:', response.data);
      console.log('📦 Suggestions count:', response.data.suggestions?.length || 0);
      console.log('📝 Reply text:', response.data.reply);
      
      // FORCE clear typing immediately
      clearTimeout(typingTimeout);
      setIsTyping(false);

      if (response.data.success) {
        // Add AI response with personalization indicator
        const aiMessage = {
          type: 'ai',
          text: response.data.reply || "Here's what I found!",
          timestamp: new Date()
        };
        
        if (response.data.personalized) {
          aiMessage.personalized = true;
        }
        
        console.log('➕ Adding AI message:', aiMessage);
        addMessage(aiMessage);
        console.log('✅ Message added, current messages count:', messages.length + 1);

        // Handle product suggestions
        if (response.data.suggestions && response.data.suggestions.length > 0) {
          console.log('✅ Setting suggested products:', response.data.suggestions);
          setSuggestedProducts(response.data.suggestions);
          console.log('✅ Products set, count:', response.data.suggestions.length);
        } else {
          console.log('⚠️ No suggestions in response');
          setSuggestedProducts([]);
        }
      } else {
        // Handle error response
        console.warn('⚠️ Response not successful:', response.data);
        addMessage({
          type: 'ai',
          text: response.data.reply || "I couldn't process that. Could you rephrase that or give me more details? 😊",
          timestamp: new Date()
        });
        setSuggestedProducts([]);
      }
    } catch (error) {
      console.error('❌ Chat error:', error);
      console.error('❌ Error type:', error.code);
      console.error('❌ Error message:', error.message);
      console.error('❌ Error response:', error.response?.data);
      console.error('❌ Full error:', error);
      
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
      clearTimeout(typingTimeout); // Clear the safety timeout
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
      text: `Great choice! ${normalizedProduct.name} is currently ${normalizedProduct.price.toLocaleString()} RWF. I can take up to 10% off — what price within that range would you like to offer? 💰`,
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
            text: `✅ Deal closed! Added ${makingOffer.name} to cart at ${offer.counterOffer.toLocaleString()} RWF!`,
            timestamp: new Date()
          });
          
          addMessage({
            type: 'ai',
            text: `Perfect! 🎉 Redirecting you to checkout in 2 seconds...`,
            timestamp: new Date()
          });
          
          setMakingOffer(null);
          setLastCounterOffer(null);
          setOfferPrice('');
          
          // Auto-redirect to checkout after 2 seconds
          setTimeout(() => {
            navigate('/checkout');
          }, 2000);
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
          
          addMessage({
            type: 'ai',
            text: `Type "yes" or "accept" to confirm this price and add it to your cart! 🛒`,
            timestamp: new Date()
          });
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
            style={{ height: '75vh', maxHeight: '650px', minHeight: '500px', zIndex: 9999 }}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-orange-600 to-red-600 text-white p-3 flex flex-col">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="relative">
                    <SparklesIcon className="h-5 w-5 animate-pulse" />
                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full border border-white animate-pulse"></div>
                  </div>
                  <div>
                    <h3 className="font-bold text-sm flex items-center space-x-2">
                      <span>AI Assistant</span>
                      <span className="text-xs bg-white/20 px-1.5 py-0.5 rounded-full">🧠</span>
                    </h3>
                    <p className="text-xs text-orange-100">Personalized shopping</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 hover:bg-white/20 rounded-full transition-colors"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
              
              {/* Product Context in Header */}
              {makingOffer && (
                <div className="mt-2 bg-white/10 backdrop-blur-sm rounded-lg p-2 flex items-center space-x-2">
                  <img
                    src={makingOffer.image || '/placeholder.png'}
                    alt={makingOffer.name}
                    className="w-8 h-8 object-cover rounded"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-white/80 truncate">Negotiating:</p>
                    <p className="font-semibold text-xs text-white truncate">{makingOffer.name}</p>
                  </div>
                  <p className="text-xs font-bold text-yellow-300 whitespace-nowrap">{makingOffer.price?.toLocaleString()} RWF</p>
                </div>
              )}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 scroll-smooth flex flex-col">
              {console.log('🎨 Rendering messages, count:', messages.length)}
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
              {suggestedProducts.length > 0 && !makingOffer && (
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
                  <div className="bg-white rounded-2xl px-4 py-2 shadow-md">
                    <div className="flex space-x-2">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                    </div>
                  </div>
                </div>
              )}

              {/* Scroll anchor at bottom */}
              <div ref={messagesEndRef} className="h-1" />
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
                  onChange={(e) => {
                    const value = e.target.value;
                    setInputMessage(value);
                    generateSmartSuggestions(value);
                  }}
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
              {/* Smart Suggestions */}
              {smartSuggestions.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {smartSuggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setInputMessage(suggestion);
                        setSmartSuggestions([]);
                      }}
                      className="text-xs bg-gray-100 hover:bg-orange-100 text-gray-700 px-3 py-1.5 rounded-full border border-gray-200 transition-colors"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}
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
