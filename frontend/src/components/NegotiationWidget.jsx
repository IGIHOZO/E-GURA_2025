import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

const translations = {
  en: {
    title: "Make an Offer",
    subtitle: "Let's find a fair deal!",
    yourOffer: "Your Offer",
    basePrice: "Base Price",
    send: "Send Offer",
    accept: "Accept & Add to Cart",
    decline: "No Thanks",
    thinking: "RutzBot is thinking...",
    expired: "Offer expired",
    rejected: "Negotiation ended",
    accepted: "✅ Deal accepted! Adding to cart...",
    addedToCart: "🛒 Added to cart successfully!",
    round: "Round",
    of: "of",
    placeholder: "Enter your offer in RWF",
    minOffer: "Minimum offer",
    close: "Close",
    applyDiscount: "Apply Discount",
    error: "Something went wrong. Please try again.",
    rateLimit: "Too many attempts. Please wait.",
    invalidOffer: "Please enter a valid offer amount",
    tooLow: "Offer is too low",
    exitIntent: "Wait! Let's negotiate a better price",
    dwellPrompt: "Interested? Make an offer!"
  },
  rw: {
    title: "Tanga Icyifuzo",
    subtitle: "Reka turebe igiciro cyiza!",
    yourOffer: "Icyifuzo Cyawe",
    basePrice: "Igiciro cy'Ibanze",
    send: "Ohereza",
    accept: "Emera & Shyira mu Gitebo",
    decline: "Oya Murakoze",
    thinking: "RutzBot aratekereza...",
    expired: "Igihe cyarangiye",
    rejected: "Ibiganiro byarangiye",
    accepted: "✅ Byemewe! Turashyira mu gitebo...",
    addedToCart: "🛒 Byashyizwe mu gitebo neza!",
    round: "Urwego",
    of: "kuri",
    placeholder: "Andika icyifuzo mu RWF",
    minOffer: "Icyifuzo ntarengwa",
    close: "Funga",
    applyDiscount: "Koresha Igabanuka",
    error: "Habaye ikibazo. Ongera ugerageze.",
    rateLimit: "Uragerageza kenshi. Tegereza.",
    invalidOffer: "Andika igiciro cyemewe",
    tooLow: "Igiciro ni gito cyane",
    exitIntent: "Tegereza! Reka tuganire ku giciro",
    dwellPrompt: "Urabikunda? Tanga icyifuzo!"
  }
};

const NegotiationWidget = ({ 
  product, 
  userId, 
  onAccept, 
  onClose, // Callback when widget is closed
  trigger = 'button', // 'button', 'exit-intent', 'dwell'
  conversionSource = 'product_page',
  initialLanguage = 'en',
  autoOpen = false // Auto-open the widget when rendered
}) => {
  const [isOpen, setIsOpen] = useState(autoOpen);
  const [language, setLanguage] = useState(initialLanguage);
  const [sessionId, setSessionId] = useState(null);
  const [currentOffer, setCurrentOffer] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('active'); // active, accepted, rejected, expired
  const [currentRound, setCurrentRound] = useState(0);
  const [maxRounds, setMaxRounds] = useState(3);
  const [counterPrice, setCounterPrice] = useState(null);
  const [discountToken, setDiscountToken] = useState(null);
  const [error, setError] = useState(null);
  const [expiresAt, setExpiresAt] = useState(null);

  const messagesEndRef = useRef(null);
  const dwellTimerRef = useRef(null);
  const API_URL = import.meta.env.VITE_API_URL || '';

  const t = translations[language];

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Exit intent detection
  useEffect(() => {
    if (trigger === 'exit-intent') {
      const handleMouseLeave = (e) => {
        if (e.clientY <= 0 && !isOpen) {
          setIsOpen(true);
        }
      };
      document.addEventListener('mouseleave', handleMouseLeave);
      return () => document.removeEventListener('mouseleave', handleMouseLeave);
    }
  }, [trigger, isOpen]);

  // Dwell time detection
  useEffect(() => {
    if (trigger === 'dwell' && !isOpen) {
      dwellTimerRef.current = setTimeout(() => {
        setIsOpen(true);
      }, 30000); // 30 seconds

      return () => clearTimeout(dwellTimerRef.current);
    }
  }, [trigger, isOpen]);

  // Expiration timer
  useEffect(() => {
    if (expiresAt && status === 'active') {
      const checkExpiration = setInterval(() => {
        if (new Date() > new Date(expiresAt)) {
          setStatus('expired');
          addMessage('system', t.expired);
        }
      }, 1000);

      return () => clearInterval(checkExpiration);
    }
  }, [expiresAt, status]);

  const addMessage = (sender, content, data = {}) => {
    setMessages(prev => [...prev, {
      id: Date.now(),
      sender, // 'user', 'bot', 'system'
      content,
      timestamp: new Date(),
      ...data
    }]);
  };

  const sendOffer = async () => {
    const offerAmount = parseFloat(currentOffer);

    if (!offerAmount || offerAmount <= 0) {
      setError(t.invalidOffer);
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const response = await axios.post(`${API_URL}/api/negotiation/offer`, {
        sku: product.sku,
        userId,
        offerPrice: offerAmount,
        quantity: product.quantity || 1,
        sessionId,
        language,
        conversionSource
      });

      const { data } = response.data;

      // Add user message
      addMessage('user', `${offerAmount.toLocaleString()} RWF`);

      // Update session
      setSessionId(data.sessionId);
      setCurrentRound(data.currentRound);
      setMaxRounds(data.maxRounds);
      setExpiresAt(data.expiresAt);

      // Handle response
      if (data.status === 'accept') {
        setStatus('accepted');
        setDiscountToken(data.counterPrice ? null : data.discountToken);
        setCounterPrice(offerAmount);
        addMessage('bot', data.justification, {
          accepted: true,
          finalPrice: offerAmount
        });
      } else if (data.status === 'reject') {
        setStatus('rejected');
        addMessage('bot', data.justification, {
          rejected: true,
          altPerks: data.altPerks
        });
      } else if (data.status === 'counter' || data.status === 'final') {
        setCounterPrice(data.counterPrice);
        addMessage('bot', data.justification, {
          counterPrice: data.counterPrice,
          isFinal: data.status === 'final',
          altPerks: data.altPerks,
          bundleSuggestions: data.bundleSuggestions
        });
      }

      setCurrentOffer('');
    } catch (err) {
      console.error('Negotiation error:', err);
      const errorMsg = err.response?.data?.error || t.error;
      setError(errorMsg);
      addMessage('system', errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const acceptCounter = async () => {
    if (!counterPrice) return;

    setLoading(true);
    try {
      // Send acceptance as new offer
      const response = await axios.post(`${API_URL}/api/negotiation/offer`, {
        sku: product.sku,
        userId,
        offerPrice: counterPrice,
        quantity: product.quantity || 1,
        sessionId,
        language,
        conversionSource
      });

      const { data } = response.data;
      
      setStatus('accepted');
      const finalDiscountToken = data.discountToken || discountToken;
      setDiscountToken(finalDiscountToken);
      
      addMessage('user', `${t.accept} - ${counterPrice.toLocaleString()} RWF`);
      addMessage('bot', data.justification || t.accepted, {
        accepted: true,
        finalPrice: counterPrice
      });

      // AUTOMATICALLY notify parent to add to cart
      console.log('🛒 Calling onAccept to add to cart...');
      console.log('Deal details:', {
        originalPrice: product.price,
        finalPrice: counterPrice,
        discountToken: finalDiscountToken,
        sessionId
      });
      
      if (onAccept) {
        try {
          await onAccept({
            originalPrice: product.price,
            finalPrice: counterPrice,
            discountToken: finalDiscountToken,
            sessionId
          });
          console.log('✅ onAccept completed successfully');
          
          // Show success message after cart addition
          addMessage('system', t.addedToCart, {
            accepted: true,
            finalPrice: counterPrice
          });
        } catch (error) {
          console.error('❌ Error in onAccept:', error);
          addMessage('system', '❌ Failed to add to cart. Please try adding manually.', {
            error: true
          });
        }
      } else {
        console.warn('⚠️ No onAccept callback provided');
      }
      
      // Auto-close widget after 3 seconds (increased time)
      setTimeout(() => {
        console.log('Closing negotiation widget...');
        setIsOpen(false);
        if (onClose) onClose();
      }, 3000);
      
    } catch (err) {
      console.error('Accept error:', err);
      setError(err.response?.data?.error || t.error);
    } finally {
      setLoading(false);
    }
  };

  const declineCounter = () => {
    setCounterPrice(null);
    addMessage('user', t.decline);
  };

  const applyDiscount = () => {
    if (onAccept && discountToken) {
      onAccept({
        originalPrice: product.price,
        finalPrice: counterPrice,
        discountToken,
        sessionId
      });
      setIsOpen(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-RW', {
      style: 'currency',
      currency: 'RWF',
      minimumFractionDigits: 0
    }).format(price);
  };

  if (!isOpen && trigger === 'button' && !autoOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-6 py-3 rounded-lg font-semibold hover:from-orange-600 hover:to-red-600 transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
        {t.title}
      </button>
    );
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          className="fixed bottom-4 right-4 w-96 bg-white rounded-2xl shadow-2xl z-50 overflow-hidden border border-gray-200"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white p-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-bold text-lg">{t.title}</h3>
                <p className="text-sm opacity-90">{t.subtitle}</p>
              </div>
              <div className="flex gap-2">
                {/* Language toggle */}
                <button
                  onClick={() => setLanguage(language === 'en' ? 'rw' : 'en')}
                  className="text-white/80 hover:text-white text-xs px-2 py-1 rounded bg-white/20"
                >
                  {language === 'en' ? 'RW' : 'EN'}
                </button>
                <button
                  onClick={() => {
                    setIsOpen(false);
                    if (onClose) onClose();
                  }}
                  className="text-white/80 hover:text-white"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Progress */}
            {status === 'active' && (
              <div className="mt-3">
                <div className="flex justify-between text-xs mb-1">
                  <span>{t.round} {currentRound} {t.of} {maxRounds}</span>
                  {expiresAt && (
                    <span>
                      {Math.max(0, Math.floor((new Date(expiresAt) - new Date()) / 1000 / 60))}m
                    </span>
                  )}
                </div>
                <div className="w-full bg-white/30 rounded-full h-1.5">
                  <div
                    className="bg-white rounded-full h-1.5 transition-all"
                    style={{ width: `${(currentRound / maxRounds) * 100}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="p-4 bg-gray-50 border-b">
            <div className="flex gap-3">
              {product.image && (
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-16 h-16 object-cover rounded-lg"
                />
              )}
              <div className="flex-1">
                <h4 className="font-semibold text-sm">{product.name}</h4>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-xs text-gray-600">{t.basePrice}:</span>
                  <span className="font-bold text-orange-600">{formatPrice(product.price)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="h-64 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 && (
              <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                <p>Start by making an offer below!</p>
              </div>
            )}
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    msg.sender === 'user'
                      ? 'bg-orange-500 text-white'
                      : msg.sender === 'bot'
                      ? 'bg-gray-100 text-gray-800'
                      : 'bg-yellow-50 text-yellow-800 text-sm'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                  
                  {/* Counter offer */}
                  {msg.counterPrice && (
                    <div className="mt-2 pt-2 border-t border-gray-300">
                      <p className="text-xs text-gray-600 mb-1">
                        {language === 'en' ? 'Counter Offer:' : 'Icyifuzo Cyacu:'}
                      </p>
                      <p className="font-bold text-lg text-orange-600">{formatPrice(msg.counterPrice)}</p>
                      {msg.isFinal && (
                        <p className="text-xs mt-1 text-red-600 font-semibold flex items-center gap-1">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          {language === 'en' ? 'Final Offer' : 'Icyifuzo cya Nyuma'}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Perks */}
                  {msg.altPerks && msg.altPerks.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-gray-300">
                      <p className="text-xs text-gray-600 mb-1 font-semibold">
                        {language === 'en' ? 'Added Benefits:' : 'Inyungu Zongerwaho:'}
                      </p>
                      <div className="space-y-1">
                        {msg.altPerks.map((perk, idx) => (
                          <div key={idx} className="flex items-start gap-2 text-xs">
                            <svg className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span className="flex-1">{perk.description}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Bundle suggestions */}
                  {msg.bundleSuggestions && msg.bundleSuggestions.length > 0 && (
                    <div className="mt-2 p-2 bg-blue-50 rounded-lg text-xs border border-blue-200">
                      <p className="font-semibold mb-1 text-blue-800 flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        {language === 'en' ? 'Bundle Deal:' : 'Igicuruzwa Hamwe:'}
                      </p>
                      <div className="space-y-1">
                        {msg.bundleSuggestions.map((bundle, idx) => (
                          <p key={idx} className="text-blue-700">+ {bundle.name?.[language]} ({formatPrice(bundle.price)})</p>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Accepted */}
                  {msg.accepted && (
                    <div className="mt-2 pt-2 border-t border-green-300 bg-green-50 -m-3 mt-2 p-3 rounded-b-lg">
                      <div className="flex items-center gap-2 text-green-700">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="font-semibold">{t.accepted}</span>
                      </div>
                      {msg.finalPrice && (
                        <p className="text-sm font-bold text-green-800 mt-1">
                          {language === 'en' ? 'Final Price:' : 'Igiciro cya Nyuma:'} {formatPrice(msg.finalPrice)}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-lg p-3 shadow-sm">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                    <span className="text-xs text-gray-600">{t.thinking}</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          {status === 'active' && !counterPrice && (
            <div className="p-4 border-t bg-white">
              {error && (
                <div className="mb-2 p-2 bg-red-50 text-red-600 text-xs rounded">
                  {error}
                </div>
              )}
              <div className="flex gap-2">
                <input
                  type="number"
                  value={currentOffer}
                  onChange={(e) => setCurrentOffer(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendOffer()}
                  placeholder={t.placeholder}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  disabled={loading}
                />
                <button
                  onClick={sendOffer}
                  disabled={loading || !currentOffer}
                  className="bg-orange-500 text-white px-6 py-2 rounded-lg font-semibold hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {t.send}
                </button>
              </div>
            </div>
          )}

          {/* Counter offer actions */}
          {status === 'active' && counterPrice && (
            <div className="p-4 border-t bg-white space-y-2">
              <button
                onClick={acceptCounter}
                disabled={loading}
                className="w-full bg-green-500 text-white py-3 rounded-lg font-semibold hover:bg-green-600 disabled:opacity-50 transition-colors"
              >
                {t.accept} - {formatPrice(counterPrice)}
              </button>
              <button
                onClick={declineCounter}
                disabled={loading || currentRound >= maxRounds}
                className="w-full bg-gray-200 text-gray-700 py-2 rounded-lg font-semibold hover:bg-gray-300 disabled:opacity-50 transition-colors"
              >
                {t.decline}
              </button>
            </div>
          )}

          {/* Accepted state */}
          {status === 'accepted' && discountToken && (
            <div className="p-4 border-t bg-green-50">
              <button
                onClick={applyDiscount}
                className="w-full bg-green-500 text-white py-3 rounded-lg font-semibold hover:bg-green-600 transition-colors"
              >
                {t.applyDiscount}
              </button>
            </div>
          )}

          {/* Rejected/Expired state */}
          {(status === 'rejected' || status === 'expired') && (
            <div className="p-4 border-t bg-gray-50 text-center">
              <p className="text-gray-600 text-sm">
                {status === 'rejected' ? t.rejected : t.expired}
              </p>
              <button
                onClick={() => {
                  setIsOpen(false);
                  if (onClose) onClose();
                }}
                className="mt-2 text-orange-500 hover:text-orange-600 font-semibold"
              >
                {t.close}
              </button>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default NegotiationWidget;
