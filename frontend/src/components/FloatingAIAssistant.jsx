import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChatBubbleLeftRightIcon,
  XMarkIcon,
  PaperAirplaneIcon,
  SparklesIcon,
  UserCircleIcon,
  ShoppingBagIcon,
  MagnifyingGlassIcon,
  HeartIcon
} from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import ChatOfferWidget from './ChatOfferWidget';

const FloatingAIAssistant = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showOfferWidget, setShowOfferWidget] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [hasNewMessage, setHasNewMessage] = useState(false);
  
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Show attention-grabbing animation
  useEffect(() => {
    if (!isOpen) {
      const timer = setTimeout(() => {
        setHasNewMessage(true);
        setTimeout(() => setHasNewMessage(false), 3000);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Welcome message when opened for first time
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setTimeout(() => {
        addBotMessage(
          `👋 Hello! I'm RutzBot, your personal shopping assistant!\n\n` +
          `I'm here to help you:\n` +
          `🔍 Find products\n` +
          `💰 Get the best deals\n` +
          `🤝 Negotiate prices\n` +
          `📦 Track orders\n\n` +
          `How can I assist you today? 😊`
        );
      }, 500);
    }
  }, [isOpen]);

  const addBotMessage = (content, data = {}) => {
    setMessages(prev => [...prev, {
      id: Date.now() + Math.random(),
      sender: 'bot',
      content,
      timestamp: new Date(),
      ...data
    }]);
  };

  const addUserMessage = (content) => {
    setMessages(prev => [...prev, {
      id: Date.now() + Math.random(),
      sender: 'user',
      content,
      timestamp: new Date()
    }]);
  };

  const handleOpenOfferWidget = (product) => {
    setSelectedProduct(product);
    setShowOfferWidget(true);
    setIsOpen(false);
  };

  const handleSendMessage = async () => {
    const text = inputMessage.trim();
    if (!text || loading) return;

    addUserMessage(text);
    setInputMessage('');
    setLoading(true);

    // Simulate AI response with context-aware replies
    setTimeout(() => {
      const lowerText = text.toLowerCase();

      // Greetings
      if (lowerText.match(/^(hi|hello|hey|good morning|good afternoon|good evening)/)) {
        addBotMessage(
          `Hello! 👋 Great to see you!\n\n` +
          `I'm here to make your shopping experience amazing! You can:\n\n` +
          `• Search for products\n` +
          `• Make offers and negotiate\n` +
          `• Get personalized recommendations\n` +
          `• Ask about deals and discounts\n\n` +
          `What would you like to explore today? 🛍️`
        );
      }
      // Search queries
      else if (lowerText.includes('search') || lowerText.includes('find') || lowerText.includes('looking for')) {
        const searchTerm = text.replace(/(search|find|looking for|show me|i want)/gi, '').trim();
        addBotMessage(
          `🔍 Great! Let me help you find "${searchTerm}".\n\n` +
          `I'm searching through our catalog now...`
        );
        setTimeout(() => {
          navigate(`/search?q=${encodeURIComponent(searchTerm)}`);
          addBotMessage(
            `✨ I've redirected you to the search results! Check out what I found for you.`
          );
        }, 1000);
      }
      // Pricing and deals
      else if (lowerText.includes('price') || lowerText.includes('cost') || lowerText.includes('how much')) {
        addBotMessage(
          `💰 I love talking about prices! I can help you:\n\n` +
          `• Find products in your budget\n` +
          `• Negotiate better deals\n` +
          `• Get exclusive discounts\n\n` +
          `What's your budget, or which product are you interested in?`
        );
      }
      // Offers and negotiation
      else if (lowerText.includes('offer') || lowerText.includes('negotiate') || lowerText.includes('bargain') || lowerText.includes('deal')) {
        addBotMessage(
          `🤝 Excellent! I'm a pro negotiator!\n\n` +
          `I can help you get the best price on any product. Just:\n\n` +
          `1️⃣ Browse products and click "Make Offer"\n` +
          `2️⃣ Or tell me which product you're interested in\n` +
          `3️⃣ I'll work with you to get an amazing deal!\n\n` +
          `Want to start shopping? 🛍️`
        );
      }
      // Product categories
      else if (lowerText.includes('clothes') || lowerText.includes('shirt') || lowerText.includes('dress') || lowerText.includes('fashion')) {
        addBotMessage(
          `👗 Fashion! My favorite topic!\n\n` +
          `We have amazing collections:\n` +
          `• Men's Fashion\n` +
          `• Women's Wear\n` +
          `• Accessories\n` +
          `• Shoes & More\n\n` +
          `What style are you looking for? I can show you trending items! ✨`
        );
      }
      // Help and support
      else if (lowerText.includes('help') || lowerText === '?') {
        addBotMessage(
          `🆘 I'm here to help! Here's what I can do:\n\n` +
          `**Shopping**\n` +
          `• Search products: "Find red dresses"\n` +
          `• Check prices: "How much is..."\n` +
          `• Make offers: "I want to negotiate"\n\n` +
          `**Orders**\n` +
          `• Track orders: "Where's my order?"\n` +
          `• Order history: "My orders"\n\n` +
          `**Deals**\n` +
          `• Current deals: "Show me deals"\n` +
          `• Personalized offers: "Best prices"\n\n` +
          `Try asking me anything! 😊`
        );
      }
      // Shipping and delivery
      else if (lowerText.includes('ship') || lowerText.includes('deliver') || lowerText.includes('when will')) {
        addBotMessage(
          `📦 Shipping Information:\n\n` +
          `• **Free Shipping** on orders over 50,000 RWF\n` +
          `• **Standard Delivery**: 2-3 business days\n` +
          `• **Express Delivery**: 1 business day\n\n` +
          `We deliver across Rwanda! 🇷🇼\n\n` +
          `Want to place an order? Let's find you something great!`
        );
      }
      // Thanks
      else if (lowerText.includes('thank') || lowerText.includes('thanks')) {
        addBotMessage(
          `You're very welcome! 😊\n\n` +
          `I'm always here to help! Feel free to ask me anything else.\n\n` +
          `Happy shopping! 🛍️✨`
        );
      }
      // Goodbye
      else if (lowerText.match(/^(bye|goodbye|see you|later)/)) {
        addBotMessage(
          `Goodbye! 👋\n\n` +
          `Thanks for chatting! Come back anytime you need help.\n\n` +
          `I'll be right here waiting for you! 🌟`
        );
      }
      // Default helpful response
      else {
        addBotMessage(
          `Interesting! 🤔\n\n` +
          `I want to make sure I help you best. Could you:\n\n` +
          `• Tell me what product you're looking for?\n` +
          `• Ask about prices or deals?\n` +
          `• Or type "help" to see what I can do?\n\n` +
          `I'm here to make your shopping easy! 💪`
        );
      }

      setLoading(false);
    }, 800);
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Quick action suggestions
  const quickActions = [
    { icon: '🔍', text: 'Search products', action: 'search for popular items' },
    { icon: '💰', text: 'Best deals', action: 'show me best deals' },
    { icon: '🤝', text: 'Make offer', action: 'I want to negotiate a price' },
    { icon: '📦', text: 'My orders', action: 'show my orders' }
  ];

  return (
    <>
      {/* Floating Button */}
      <AnimatePresence>
        {!isOpen && !showOfferWidget && (
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 right-6 w-16 h-16 bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 text-white rounded-full shadow-2xl hover:shadow-3xl transition-all z-50 flex items-center justify-center group"
          >
            <ChatBubbleLeftRightIcon className="w-8 h-8 group-hover:scale-110 transition-transform" />
            
            {/* Notification Badge */}
            {hasNewMessage && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full border-2 border-white flex items-center justify-center"
              >
                <span className="text-xs font-bold">!</span>
              </motion.div>
            )}

            {/* Pulsing Ring */}
            <div className="absolute inset-0 rounded-full bg-purple-400 animate-ping opacity-75"></div>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed bottom-0 right-0 md:bottom-6 md:right-6 w-full md:w-[420px] h-[100vh] md:h-[650px] bg-white md:rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 text-white p-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
                    <SparklesIcon className="w-6 h-6 text-purple-600" />
                  </div>
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-white"></div>
                </div>
                <div>
                  <h3 className="font-bold text-lg">RutzBot AI</h3>
                  <p className="text-xs opacity-90">Always here to help • Online</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white/80 hover:text-white transition-colors"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2`}
                >
                  {msg.sender === 'bot' && (
                    <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mr-2 flex-shrink-0">
                      <SparklesIcon className="w-5 h-5 text-white" />
                    </div>
                  )}

                  <div className={`max-w-[75%] ${msg.sender === 'user' ? 'order-1' : ''}`}>
                    <div
                      className={`rounded-2xl p-3 shadow-sm ${
                        msg.sender === 'user'
                          ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-tr-none'
                          : 'bg-white text-gray-800 rounded-tl-none'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">
                        {msg.content}
                      </p>
                    </div>
                    <p className="text-xs text-gray-400 mt-1 px-2">
                      {formatTime(msg.timestamp)}
                    </p>
                  </div>

                  {msg.sender === 'user' && (
                    <div className="w-8 h-8 bg-gradient-to-br from-gray-400 to-gray-500 rounded-full flex items-center justify-center ml-2 flex-shrink-0">
                      <UserCircleIcon className="w-5 h-5 text-white" />
                    </div>
                  )}
                </div>
              ))}

              {loading && (
                <div className="flex justify-start">
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mr-2">
                    <SparklesIcon className="w-5 h-5 text-white" />
                  </div>
                  <div className="bg-white rounded-2xl rounded-tl-none p-4 shadow-sm">
                    <div className="flex space-x-2">
                      <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Quick Actions */}
            {messages.length <= 1 && (
              <div className="px-4 py-3 bg-white border-t border-gray-200">
                <p className="text-xs text-gray-500 mb-2 font-medium">Quick actions:</p>
                <div className="grid grid-cols-2 gap-2">
                  {quickActions.map((action, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setInputMessage(action.action);
                        setTimeout(() => handleSendMessage(), 100);
                      }}
                      className="flex items-center space-x-2 px-3 py-2 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors text-left"
                    >
                      <span className="text-lg">{action.icon}</span>
                      <span className="text-xs font-medium text-gray-700">{action.text}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input Area */}
            <div className="p-4 bg-white border-t border-gray-200">
              <div className="flex items-center space-x-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Ask me anything..."
                  className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-full focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all text-sm"
                  disabled={loading}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim() || loading}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-3 rounded-full hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <PaperAirplaneIcon className="w-5 h-5" />
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-2 text-center">
                💬 I'm AI-powered and here to help 24/7
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Offer Widget */}
      {showOfferWidget && selectedProduct && (
        <ChatOfferWidget
          product={selectedProduct}
          isOpen={showOfferWidget}
          onClose={() => {
            setShowOfferWidget(false);
            setSelectedProduct(null);
          }}
          onAccept={(deal) => {
            console.log('Deal accepted:', deal);
            // Handle cart addition
          }}
        />
      )}
    </>
  );
};

export default FloatingAIAssistant;
