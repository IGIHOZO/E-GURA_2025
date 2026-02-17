import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  XMarkIcon, 
  PaperAirplaneIcon, 
  SparklesIcon,
  ChatBubbleLeftRightIcon,
  UserCircleIcon,
  ShoppingBagIcon
} from '@heroicons/react/24/outline';
import axios from 'axios';

const ChatOfferWidget = ({ 
  product, 
  onAccept, 
  onClose,
  isOpen: controlledIsOpen,
  initialMessage = null
}) => {
  const [isOpen, setIsOpen] = useState(controlledIsOpen || false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [currentRound, setCurrentRound] = useState(0);
  const [maxRounds] = useState(3);
  const [status, setStatus] = useState('active');
  const [counterPrice, setCounterPrice] = useState(null);
  const [language, setLanguage] = useState('en');
  
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const API_URL = import.meta.env.VITE_API_URL || '';

  // Device ID for tracking
  const getDeviceId = () => {
    let deviceId = localStorage.getItem('deviceId');
    if (!deviceId) {
      deviceId = `device-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('deviceId', deviceId);
    }
    return deviceId;
  };

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Welcome message when opened
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setTimeout(() => {
        addBotMessage(
          `👋 Hi there! I'm RutzBot, your personal shopping assistant!\n\n` +
          `I see you're interested in **${product?.name}**. ` +
          `The current price is **${product?.price?.toLocaleString()} RWF**.\n\n` +
          `💬 You can:\n` +
          `• Make me an offer (up to 10% off – e.g., "I can pay 90,000")\n` +
          `• Ask questions about the product\n` +
          `• Or just type "make an offer" to start negotiating!\n\n` +
          `Let's find you the best deal within our 10% discount limit! 🎯`
        );
      }, 500);
    }
  }, [isOpen, product]);

  // Handle initial message
  useEffect(() => {
    if (initialMessage && isOpen) {
      setTimeout(() => {
        handleSendMessage(initialMessage);
      }, 1000);
    }
  }, [initialMessage, isOpen]);

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

  const addSystemMessage = (content) => {
    setMessages(prev => [...prev, {
      id: Date.now() + Math.random(),
      sender: 'system',
      content,
      timestamp: new Date()
    }]);
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

  const handleOfferSubmit = async (offerAmount) => {
    setLoading(true);

    try {
      const response = await axios.post(`${API_URL}/api/negotiation/offer`, {
        sku: product.sku || product._id,
        userId: getDeviceId(),
        offerPrice: offerAmount,
        quantity: 1,
        sessionId,
        language,
        conversionSource: 'chat_widget'
      });

      const { data } = response.data;

      // Update session info
      setSessionId(data.sessionId);
      setCurrentRound(data.currentRound);
      
      // Handle response based on status
      if (data.status === 'accept') {
        setStatus('accepted');
        setCounterPrice(offerAmount);
        addBotMessage(
          `🎉 Amazing! ${data.justification}\n\n` +
          `✅ **Deal Accepted: ${offerAmount.toLocaleString()} RWF**\n\n` +
          `I'm adding this to your cart now...`,
          { accepted: true, finalPrice: offerAmount }
        );

        // Auto add to cart
        setTimeout(async () => {
          if (onAccept) {
            await onAccept({
              originalPrice: product.price,
              finalPrice: offerAmount,
              discountToken: data.discountToken,
              sessionId: data.sessionId
            });
            addSystemMessage('🛒 Added to cart successfully!');
          }
        }, 1500);

      } else if (data.status === 'reject') {
        setStatus('rejected');
        addBotMessage(
          `😔 ${data.justification}\n\n` +
          `But don't worry! Here's what I can do for you:\n` +
          `${data.altPerks?.map(p => `• ${p.description}`).join('\n') || ''}`,
          { rejected: true }
        );
        
      } else if (data.status === 'counter' || data.status === 'final') {
        setCounterPrice(data.counterPrice);
        const isFinal = data.status === 'final';
        
        addBotMessage(
          `🤝 ${data.justification}\n\n` +
          `**My Counter Offer: ${data.counterPrice.toLocaleString()} RWF** ${isFinal ? '🔥 (Final Offer!)' : ''}\n\n` +
          `What do you say? You can:\n` +
          `• Type "accept" to take this deal\n` +
          `• Type "decline" to reject\n` +
          `• Make a new offer`,
          { 
            counterPrice: data.counterPrice,
            isFinal,
            altPerks: data.altPerks,
            showActions: true
          }
        );
      }

    } catch (err) {
      console.error('Offer error:', err);
      addBotMessage(
        `❌ Oops! ${err.response?.data?.error || 'Something went wrong'}. Please try again!`
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (messageText = inputMessage) => {
    const text = messageText.trim();
    if (!text || loading) return;

    addUserMessage(text);
    setInputMessage('');

    // Check for accept/decline counter offer
    if (counterPrice && status === 'active') {
      const lowerText = text.toLowerCase();
      
      if (lowerText.includes('accept') || lowerText.includes('yes') || lowerText === 'ok' || lowerText === 'deal') {
        setLoading(true);
        await handleOfferSubmit(counterPrice);
        return;
      }
      
      if (lowerText.includes('decline') || lowerText.includes('no') || lowerText.includes('reject')) {
        setCounterPrice(null);
        addBotMessage(
          `No problem! 😊 Feel free to make another offer, or ask me anything about the product.`
        );
        return;
      }
    }

    // Extract offer amount from message
    const offerAmount = extractOfferAmount(text);
    
    if (offerAmount && offerAmount > 0) {
      await handleOfferSubmit(offerAmount);
    } else {
      // Handle general conversation
      setLoading(true);
      setTimeout(() => {
        const lowerText = text.toLowerCase();
        
        if (lowerText.includes('make an offer') || lowerText.includes('negotiate') || lowerText.includes('bargain')) {
          addBotMessage(
            `Great! Let's negotiate! 💰\n\n` +
            `The current price is **${product.price?.toLocaleString()} RWF**.\n` +
            `I can go up to **10% off** for you.\n\n` +
            `Tell me your price (e.g., offer ${Math.round(product.price * 0.9).toLocaleString()} RWF for a 10% discount) or type the amount directly.`
          );
        } else if (lowerText.includes('hello') || lowerText.includes('hi') || lowerText.includes('hey')) {
          addBotMessage(
            `Hello! 👋 I'm here to help you get the best deal on **${product.name}**!\n\n` +
            `Feel free to make me an offer or ask any questions! 😊`
          );
        } else if (lowerText.includes('price') || lowerText.includes('cost') || lowerText.includes('how much')) {
          addBotMessage(
            `The current price for **${product.name}** is **${product.price?.toLocaleString()} RWF**.\n\n` +
            `I can negotiate up to **10% off** to keep things fair. 🎯\n\n` +
            `Make an offer within that range and let's seal the deal!`
          );
        } else if (lowerText.includes('description') || lowerText.includes('about') || lowerText.includes('detail')) {
          addBotMessage(
            `Here's what I know about **${product.name}**:\n\n` +
            `${product.description?.substring(0, 200) || 'A quality product from our collection'}...\n\n` +
            `💰 Price: ${product.price?.toLocaleString()} RWF\n` +
            `📦 Stock: ${product.stockQuantity > 0 ? 'In Stock' : 'Limited'}\n\n` +
            `Want to make an offer? I'm ready to negotiate! 🤝`
          );
        } else {
          addBotMessage(
            `I understand you're interested! 😊\n\n` +
            `To make an offer, stay within **10% off** the listed price. For example:\n` +
            `• "I'll pay ${(product.price * 0.92).toFixed(0)}"\n` +
            `• "How about ${(product.price * 0.9).toFixed(0)} RWF?"\n\n` +
            `Let's find you the best deal within that limit! 💪`
          );
        }
        setLoading(false);
      }, 800);
    }
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  if (!isOpen) {
    return null;
  }

  return (
    <AnimatePresence>
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
              <h3 className="font-bold text-lg">RutzBot</h3>
              <p className="text-xs opacity-90">Your Shopping Assistant • Online</p>
            </div>
          </div>
          <button
            onClick={() => {
              setIsOpen(false);
              if (onClose) onClose();
            }}
            className="text-white/80 hover:text-white transition-colors"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Product Quick View */}
        {product && (
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-3 border-b border-purple-100">
            <div className="flex items-center space-x-3">
              <img
                src={product.image || product.imageUrl}
                alt={product.name}
                className="w-14 h-14 object-cover rounded-lg shadow-sm"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{product.name}</p>
                <p className="text-lg font-bold text-purple-600">{product.price?.toLocaleString()} RWF</p>
              </div>
              {currentRound > 0 && (
                <div className="text-xs text-purple-600 font-medium bg-white px-2 py-1 rounded-full">
                  Round {currentRound}/{maxRounds}
                </div>
              )}
            </div>
          </div>
        )}

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
                      : msg.sender === 'bot'
                      ? 'bg-white text-gray-800 rounded-tl-none'
                      : 'bg-yellow-50 text-yellow-900 border border-yellow-200'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">
                    {msg.content}
                  </p>
                  
                  {/* Quick Action Buttons for Counter Offers */}
                  {msg.showActions && msg.counterPrice && status === 'active' && (
                    <div className="flex gap-2 mt-3 pt-3 border-t border-gray-200">
                      <button
                        onClick={() => handleSendMessage('accept')}
                        className="flex-1 bg-green-500 text-white py-2 px-3 rounded-lg text-sm font-semibold hover:bg-green-600 transition-colors"
                      >
                        ✓ Accept
                      </button>
                      <button
                        onClick={() => handleSendMessage('decline')}
                        className="flex-1 bg-gray-300 text-gray-700 py-2 px-3 rounded-lg text-sm font-semibold hover:bg-gray-400 transition-colors"
                      >
                        ✗ Decline
                      </button>
                    </div>
                  )}
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

        {/* Quick Offer Buttons */}
        {status === 'active' && !counterPrice && product && (
          <div className="px-4 py-2 bg-white border-t border-gray-200">
            <p className="text-xs text-gray-500 mb-2">Quick offers:</p>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {[0.9, 0.93, 0.95, 0.98].map((ratio) => {
                const amount = Math.round(product.price * ratio);
                return (
                  <button
                    key={ratio}
                    onClick={() => handleSendMessage(`${amount}`)}
                    className="flex-shrink-0 px-3 py-1.5 bg-purple-100 text-purple-700 rounded-full text-xs font-medium hover:bg-purple-200 transition-colors"
                  >
                    {amount.toLocaleString()} RWF
                  </button>
                );
              })}
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
              placeholder={counterPrice ? "Type 'accept' or make new offer..." : "Type your offer or message..."}
              className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-full focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all text-sm"
              disabled={loading || status !== 'active'}
            />
            <button
              onClick={() => handleSendMessage()}
              disabled={!inputMessage.trim() || loading || status !== 'active'}
              className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-3 rounded-full hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <PaperAirplaneIcon className="w-5 h-5" />
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-2 text-center">
            💬 Chat naturally or type an amount to make an offer
          </p>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ChatOfferWidget;
