import React, { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  PhoneIcon, 
  UserIcon, 
  ShieldCheckIcon,
  CheckCircleIcon,
  ShoppingBagIcon,
  TrashIcon,
  SparklesIcon,
  HeartIcon,
  StarIcon
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolid } from '@heroicons/react/24/solid';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

const CartoonCheckoutLayout = ({ onAuthComplete }) => {
  const { login } = useAuth();
  const { items: cart, removeFromCart, updateQuantity, getCartTotal } = useCart();
  const [step, setStep] = useState(1);
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [isExistingUser, setIsExistingUser] = useState(false);
  const [userDetails, setUserDetails] = useState({
    fullName: '',
    address: '',
    city: 'Kigali',
    district: 'Gasabo'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [hoveredItem, setHoveredItem] = useState(null);

  const cartTotal = getCartTotal();

  // Format phone number
  const formatPhone = useCallback((value) => {
    let cleaned = value.replace(/\D/g, '');
    if (cleaned.startsWith('250')) return '+' + cleaned;
    if (cleaned.startsWith('0')) return '+250' + cleaned.substring(1);
    if (cleaned.length === 9) return '+250' + cleaned;
    return '+250' + cleaned;
  }, []);

  // Generate OTP
  const generateOTP = useCallback(() => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }, []);

  // Check if user exists
  const handlePhoneSubmit = useCallback(async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const formattedPhone = formatPhone(phone);
      console.log('📱 Checking phone:', formattedPhone);
      
      const response = await axios.post('/api/auth/check-phone', {
        phone: formattedPhone
      });

      console.log('✅ Phone check response:', response.data);

      if (response.data.success === false) {
        setError(response.data.message || 'Failed to verify phone number');
        return;
      }

      if (response.data.exists) {
        setIsExistingUser(true);
        const newOtp = generateOTP();
        setGeneratedOtp(newOtp);
        setOtp(newOtp);
        console.log(`📱 OTP for ${formattedPhone}: ${newOtp}`);
        setStep(2);
      } else {
        setIsExistingUser(false);
        setStep(2);
      }
    } catch (err) {
      console.error('❌ Phone verification error:', err);
      console.error('Error response:', err.response?.data);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to verify phone number. Please check your connection.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [phone, formatPhone, generateOTP]);

  // Verify OTP
  const handleOtpVerify = useCallback(async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (otp !== generatedOtp) {
      setError('Invalid OTP');
      setLoading(false);
      return;
    }

    try {
      const formattedPhone = formatPhone(phone);
      const response = await axios.post('/api/auth/login-phone', {
        phone: formattedPhone
      });

      if (response.data.user) {
        login(response.data.user);
        setStep(3);
        setTimeout(() => onAuthComplete(response.data.user), 1500);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to verify OTP');
    } finally {
      setLoading(false);
    }
  }, [otp, generatedOtp, phone, formatPhone, login, onAuthComplete]);

  // Register new user
  const handleRegistration = useCallback(async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validate form fields
    if (!userDetails.fullName || !userDetails.fullName.trim()) {
      setError('Please enter your full name');
      setLoading(false);
      return;
    }

    if (!userDetails.address || !userDetails.address.trim()) {
      setError('Please enter your delivery address');
      setLoading(false);
      return;
    }

    try {
      const formattedPhone = formatPhone(phone);
      const [firstName, ...lastNameParts] = userDetails.fullName.trim().split(' ');
      const lastName = lastNameParts.join(' ') || firstName;

      console.log('📝 Registering user:', {
        phone: formattedPhone,
        firstName,
        lastName,
        address: userDetails.address
      });

      const response = await axios.post('/api/auth/register', {
        phone: formattedPhone,
        firstName,
        lastName,
        email: `${formattedPhone.replace('+', '')}@customer.com`,
        password: 'temp123',
        addresses: [{
          type: 'shipping',
          address: userDetails.address,
          city: userDetails.city,
          district: userDetails.district,
          country: 'Rwanda',
          isDefault: true
        }]
      });

      console.log('✅ Registration response:', response.data);

      if (response.data.success && response.data.data && response.data.data.user) {
        login(response.data.data.user);
        setStep(3);
        setTimeout(() => onAuthComplete(response.data.data.user), 1500);
      } else {
        setError('Registration failed. Please try again.');
      }
    } catch (err) {
      console.error('❌ Registration error:', err);
      console.error('Error response:', err.response?.data);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to register. Please check your connection and try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [phone, userDetails, formatPhone, login, onAuthComplete]);

  // 3D Cartoon Animation Variants
  const cartItemVariants = {
    hidden: { opacity: 0, scale: 0.8, rotateX: -90 },
    visible: (i) => ({
      opacity: 1,
      scale: 1,
      rotateX: 0,
      transition: {
        delay: i * 0.1,
        type: "spring",
        stiffness: 200,
        damping: 20
      }
    }),
    hover: {
      scale: 1.05,
      rotateY: 5,
      z: 50,
      transition: { type: "spring", stiffness: 300 }
    }
  };

  const authCardVariants = {
    initial: { 
      opacity: 0, 
      x: 100,
      rotateY: -30,
      scale: 0.9
    },
    animate: { 
      opacity: 1, 
      x: 0,
      rotateY: 0,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 150,
        damping: 20
      }
    },
    exit: { 
      opacity: 0, 
      x: 100,
      rotateY: 30,
      scale: 0.9
    }
  };

  const floatingIcons = {
    animate: {
      y: [0, -15, 0],
      rotate: [0, 10, -10, 0],
      transition: {
        duration: 3,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-100 to-blue-100 p-4 sm:p-6 lg:p-8">
      {/* Floating Decoration Elements */}
      <motion.div
        className="fixed top-10 left-10 text-yellow-400 opacity-20"
        variants={floatingIcons}
        animate="animate"
      >
        <StarIcon className="w-16 h-16" />
      </motion.div>
      <motion.div
        className="fixed top-20 right-20 text-pink-400 opacity-20"
        variants={floatingIcons}
        animate="animate"
        style={{ animationDelay: '1s' }}
      >
        <HeartSolid className="w-12 h-12" />
      </motion.div>
      <motion.div
        className="fixed bottom-20 left-1/4 text-purple-400 opacity-20"
        variants={floatingIcons}
        animate="animate"
        style={{ animationDelay: '2s' }}
      >
        <SparklesIcon className="w-14 h-14" />
      </motion.div>

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 200 }}
        >
          <h1 className="text-4xl sm:text-5xl font-black bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent mb-2 drop-shadow-lg">
            🛒 Checkout Time! 🎉
          </h1>
          <p className="text-gray-600 text-lg">Almost there... Just a few clicks away! ✨</p>
        </motion.div>

        {/* Main Grid - Side by Side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
          
          {/* LEFT SIDE - Cart Details */}
          <motion.div
            initial={{ opacity: 0, x: -100, rotateY: 30 }}
            animate={{ opacity: 1, x: 0, rotateY: 0 }}
            transition={{ type: "spring", stiffness: 150, damping: 20 }}
            className="space-y-4"
          >
            {/* Cart Header */}
            <motion.div
              className="bg-white rounded-3xl shadow-2xl p-6 border-4 border-purple-200"
              whileHover={{ scale: 1.02, rotateX: 5 }}
              style={{ transformStyle: 'preserve-3d' }}
            >
              <div className="flex items-center gap-3 mb-4">
                <motion.div
                  className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg"
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                >
                  <ShoppingBagIcon className="w-7 h-7 text-white" />
                </motion.div>
                <div>
                  <h2 className="text-2xl font-black text-gray-800">Your Cart</h2>
                  <p className="text-sm text-gray-500">{cart.length} awesome items! 🎁</p>
                </div>
              </div>

              {/* Cart Items */}
              <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar">
                {cart.length === 0 ? (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="text-center py-8"
                  >
                    <p className="text-gray-400 text-lg">Your cart is empty 😢</p>
                  </motion.div>
                ) : (
                  cart.map((item, index) => (
                    <motion.div
                      key={item._id || index}
                      custom={index}
                      variants={cartItemVariants}
                      initial="hidden"
                      animate="visible"
                      whileHover="hover"
                      onHoverStart={() => setHoveredItem(item._id || item.id)}
                      onHoverEnd={() => setHoveredItem(null)}
                      className="relative bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-4 border-2 border-purple-200 shadow-lg"
                      style={{ transformStyle: 'preserve-3d' }}
                    >
                      <div className="flex gap-4">
                        {/* Image */}
                        <motion.div
                          className="w-20 h-20 rounded-xl overflow-hidden shadow-md flex-shrink-0"
                          animate={hoveredItem === (item._id || item.id) ? { scale: 1.1, rotate: 5 } : {}}
                        >
                          <img
                            src={item.mainImage || item.image || item.images?.[0] || '/placeholder.jpg'}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        </motion.div>

                        {/* Details */}
                        <div className="flex-1">
                          <h3 className="font-bold text-gray-800 mb-1 line-clamp-1">{item.name}</h3>
                          <p className="text-sm text-gray-600 mb-2">
                            {item.selectedSize && <span className="mr-2">📏 {item.selectedSize}</span>}
                            {item.selectedColor && <span>🎨 {item.selectedColor}</span>}
                          </p>
                          <div className="flex items-center justify-between">
                            <span className="text-lg font-black text-purple-600">
                              {item.price?.toLocaleString()} RWF
                            </span>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => updateQuantity(item._id || item.id, item.selectedSize || item.size, item.selectedColor || item.color, Math.max(1, item.quantity - 1))}
                                className="w-7 h-7 rounded-full bg-purple-200 hover:bg-purple-300 flex items-center justify-center font-bold transition-all active:scale-90"
                              >
                                -
                              </button>
                              <span className="w-8 text-center font-bold">{item.quantity}</span>
                              <button
                                onClick={() => updateQuantity(item._id || item.id, item.selectedSize || item.size, item.selectedColor || item.color, item.quantity + 1)}
                                className="w-7 h-7 rounded-full bg-purple-200 hover:bg-purple-300 flex items-center justify-center font-bold transition-all active:scale-90"
                              >
                                +
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Remove Button */}
                        <motion.button
                          onClick={() => removeFromCart(item._id || item.id, item.selectedSize || item.size, item.selectedColor || item.color)}
                          className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center shadow-lg text-white"
                          whileHover={{ scale: 1.2, rotate: 90 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          <TrashIcon className="w-4 h-4" />
                        </motion.button>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </motion.div>

            {/* Total */}
            <motion.div
              className="bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 rounded-3xl shadow-2xl p-6 text-white border-4 border-white"
              whileHover={{ scale: 1.05, rotate: -1 }}
              style={{ transformStyle: 'preserve-3d' }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90 mb-1">Total Amount</p>
                  <p className="text-4xl font-black drop-shadow-lg">{cartTotal.toLocaleString()} RWF</p>
                </div>
                <motion.div
                  animate={{ rotate: 360, scale: [1, 1.2, 1] }}
                  transition={{ duration: 3, repeat: Infinity }}
                  className="text-5xl"
                >
                  💰
                </motion.div>
              </div>
            </motion.div>
          </motion.div>

          {/* RIGHT SIDE - Auth Form */}
          <motion.div
            initial={{ opacity: 0, x: 100, rotateY: -30 }}
            animate={{ opacity: 1, x: 0, rotateY: 0 }}
            transition={{ type: "spring", stiffness: 150, damping: 20, delay: 0.2 }}
          >
            <AnimatePresence mode="wait">
              {/* Step 1: Phone Number */}
              {step === 1 && (
                <motion.div
                  key="step1"
                  variants={authCardVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  className="bg-white rounded-3xl shadow-2xl p-8 border-4 border-blue-200"
                  style={{ transformStyle: 'preserve-3d' }}
                >
                  <motion.div
                    className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl"
                    animate={{ y: [0, -10, 0], rotate: [0, 5, -5, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <PhoneIcon className="w-10 h-10 text-white" />
                  </motion.div>

                  <h2 className="text-3xl font-black text-center bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                    Hey There! 👋
                  </h2>
                  <p className="text-center text-gray-600 mb-6">
                    Let's get you logged in! 📱
                  </p>

                  {error && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="mb-4 p-4 bg-red-100 border-2 border-red-300 rounded-2xl text-red-700"
                    >
                      ⚠️ {error}
                    </motion.div>
                  )}

                  <form onSubmit={handlePhoneSubmit} className="space-y-4">
                    <motion.input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="0788 123 456"
                      className="w-full px-6 py-4 border-3 border-blue-300 rounded-2xl focus:ring-4 focus:ring-blue-300 focus:border-blue-500 transition-all text-center text-xl font-bold shadow-lg"
                      required
                      autoFocus
                      whileFocus={{ scale: 1.05 }}
                    />

                    <motion.button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 rounded-2xl font-black text-lg shadow-xl"
                      whileHover={{ scale: 1.05, y: -5 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {loading ? '⏳ Checking...' : 'Continue! 🚀'}
                    </motion.button>
                  </form>

                  <p className="mt-6 text-center text-sm text-gray-500">
                    🔒 Super secure & encrypted
                  </p>
                </motion.div>
              )}

              {/* Step 2: OTP or Registration */}
              {step === 2 && (
                <motion.div
                  key="step2"
                  variants={authCardVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  className="bg-white rounded-3xl shadow-2xl p-8 border-4 border-green-200"
                  style={{ transformStyle: 'preserve-3d' }}
                >
                  <motion.div
                    className="w-20 h-20 bg-gradient-to-br from-green-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl"
                    animate={{ y: [0, -10, 0], scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    {isExistingUser ? (
                      <ShieldCheckIcon className="w-10 h-10 text-white" />
                    ) : (
                      <UserIcon className="w-10 h-10 text-white" />
                    )}
                  </motion.div>

                  <h2 className="text-3xl font-black text-center bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent mb-2">
                    {isExistingUser ? 'Verify Code! 🔐' : 'Quick Setup! ⚡'}
                  </h2>
                  <p className="text-center text-gray-600 mb-6">
                    {isExistingUser ? `Your code: ${generatedOtp}` : 'Just a few details!'}
                  </p>

                  {error && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="mb-4 p-4 bg-red-100 border-2 border-red-300 rounded-2xl text-red-700"
                    >
                      {error}
                    </motion.div>
                  )}

                  {isExistingUser ? (
                    <form onSubmit={handleOtpVerify} className="space-y-4">
                      <motion.input
                        type="text"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        placeholder="000000"
                        className="w-full px-6 py-4 border-3 border-green-300 rounded-2xl text-center text-3xl font-black tracking-widest shadow-lg"
                        maxLength="6"
                        required
                        whileFocus={{ scale: 1.05 }}
                      />

                      <div className="grid grid-cols-2 gap-3">
                        <motion.button
                          type="button"
                          onClick={() => setStep(1)}
                          className="py-3 border-3 border-gray-300 rounded-2xl font-bold"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          ← Back
                        </motion.button>
                        <motion.button
                          type="submit"
                          disabled={loading || otp.length !== 6}
                          className="bg-gradient-to-r from-green-600 to-blue-600 text-white py-3 rounded-2xl font-black shadow-xl disabled:opacity-50"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          {loading ? '⏳' : 'Verify! ✓'}
                        </motion.button>
                      </div>
                    </form>
                  ) : (
                    <form onSubmit={handleRegistration} className="space-y-3">
                      <motion.input
                        type="text"
                        value={userDetails.fullName}
                        onChange={(e) => setUserDetails({ ...userDetails, fullName: e.target.value })}
                        placeholder="Full Name"
                        className="w-full px-4 py-3 border-2 border-purple-300 rounded-xl shadow-md"
                        required
                        autoFocus
                        whileFocus={{ scale: 1.02 }}
                      />
                      
                      <motion.input
                        type="text"
                        value={userDetails.address}
                        onChange={(e) => setUserDetails({ ...userDetails, address: e.target.value })}
                        placeholder="Street Address"
                        className="w-full px-4 py-3 border-2 border-purple-300 rounded-xl shadow-md"
                        required
                        whileFocus={{ scale: 1.02 }}
                      />
                      
                      <div className="grid grid-cols-2 gap-2">
                        <motion.input
                          type="text"
                          value={userDetails.city}
                          onChange={(e) => setUserDetails({ ...userDetails, city: e.target.value })}
                          placeholder="City"
                          className="px-4 py-3 border-2 border-purple-300 rounded-xl shadow-md"
                          required
                          whileFocus={{ scale: 1.02 }}
                        />
                        <motion.select
                          value={userDetails.district}
                          onChange={(e) => setUserDetails({ ...userDetails, district: e.target.value })}
                          className="px-4 py-3 border-2 border-purple-300 rounded-xl shadow-md"
                          required
                          whileFocus={{ scale: 1.02 }}
                        >
                          <option value="Gasabo">Gasabo</option>
                          <option value="Kicukiro">Kicukiro</option>
                          <option value="Nyarugenge">Nyarugenge</option>
                        </motion.select>
                      </div>

                      <div className="grid grid-cols-2 gap-3 pt-2">
                        <motion.button
                          type="button"
                          onClick={() => setStep(1)}
                          className="py-3 border-3 border-gray-300 rounded-2xl font-bold"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          ← Back
                        </motion.button>
                        <motion.button
                          type="submit"
                          disabled={loading}
                          className="bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-2xl font-black shadow-xl disabled:opacity-50"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          {loading ? '⏳' : 'Complete! 🎉'}
                        </motion.button>
                      </div>
                    </form>
                  )}
                </motion.div>
              )}

              {/* Step 3: Success */}
              {step === 3 && (
                <motion.div
                  key="step3"
                  variants={authCardVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  className="bg-white rounded-3xl shadow-2xl p-12 border-4 border-green-300 text-center"
                  style={{ transformStyle: 'preserve-3d' }}
                >
                  <motion.div
                    className="text-8xl mb-6"
                    animate={{ scale: [0, 1.2, 1], rotate: [0, 360] }}
                    transition={{ duration: 0.8 }}
                  >
                    🎉
                  </motion.div>

                  <h2 className="text-4xl font-black bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent mb-4">
                    Woohoo! 🥳
                  </h2>
                  
                  <p className="text-gray-600 text-lg mb-6">
                    You're all set! Completing your order...
                  </p>

                  <div className="flex justify-center gap-2">
                    {[0, 1, 2].map((i) => (
                      <motion.div
                        key={i}
                        className="w-4 h-4 bg-green-500 rounded-full"
                        animate={{ scale: [1, 1.5, 1], y: [0, -10, 0] }}
                        transition={{ repeat: Infinity, duration: 1, delay: i * 0.2 }}
                      />
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, #a855f7, #ec4899);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(to bottom, #9333ea, #db2777);
        }
      `}</style>
    </div>
  );
};

export default CartoonCheckoutLayout;
