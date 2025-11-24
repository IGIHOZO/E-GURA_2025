import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  PhoneIcon, 
  UserIcon, 
  ShieldCheckIcon,
  CheckCircleIcon,
  SparklesIcon,
  LockClosedIcon,
  MapPinIcon
} from '@heroicons/react/24/outline';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const Enhanced3DCheckoutAuth = ({ onAuthComplete }) => {
  const { login } = useAuth();
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

  // Format phone number to Rwanda format
  const formatPhone = (value) => {
    let cleaned = value.replace(/\D/g, '');
    
    if (cleaned.startsWith('250')) {
      return '+' + cleaned;
    } else if (cleaned.startsWith('0')) {
      return '+250' + cleaned.substring(1);
    } else if (cleaned.length === 9) {
      return '+250' + cleaned;
    }
    
    return '+250' + cleaned;
  };

  // Generate 6-digit OTP
  const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  // Check if user exists
  const handlePhoneSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const formattedPhone = formatPhone(phone);
      const response = await axios.post('/api/auth/check-phone', {
        phone: formattedPhone
      });

      if (response.data.exists) {
        setIsExistingUser(true);
        const newOtp = generateOTP();
        setGeneratedOtp(newOtp);
        setOtp(newOtp);
        console.log(`📱 OTP for ${formattedPhone}: ${newOtp}`);
        alert(`Your OTP is: ${newOtp}\n(Auto-filled for you!)`);
        setStep(2);
      } else {
        setIsExistingUser(false);
        setStep(2);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to verify phone number');
    } finally {
      setLoading(false);
    }
  };

  // Verify OTP for existing user
  const handleOtpVerify = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (otp !== generatedOtp) {
      setError('Invalid OTP. Please try again.');
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
        setTimeout(() => {
          onAuthComplete(response.data.user);
        }, 1500);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to verify OTP');
    } finally {
      setLoading(false);
    }
  };

  // Register new user
  const handleRegistration = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const formattedPhone = formatPhone(phone);
      const [firstName, ...lastNameParts] = userDetails.fullName.trim().split(' ');
      const lastName = lastNameParts.join(' ') || firstName;

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

      if (response.data.user) {
        login(response.data.user);
        setStep(3);
        setTimeout(() => {
          onAuthComplete(response.data.user);
        }, 1500);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to register');
    } finally {
      setLoading(false);
    }
  };

  // 3D Card Animation Variants
  const cardVariants = {
    initial: { 
      opacity: 0, 
      rotateY: -90,
      scale: 0.8,
      z: -100
    },
    animate: { 
      opacity: 1, 
      rotateY: 0,
      scale: 1,
      z: 0,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 15,
        duration: 0.6
      }
    },
    exit: { 
      opacity: 0, 
      rotateY: 90,
      scale: 0.8,
      z: -100,
      transition: {
        duration: 0.3
      }
    }
  };

  const floatingAnimation = {
    y: [0, -10, 0],
    transition: {
      duration: 3,
      repeat: Infinity,
      ease: "easeInOut"
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex items-center justify-center p-4 perspective-1000">
      <div className="w-full max-w-md">
        {/* Progress Dots */}
        <motion.div 
          className="flex justify-center gap-2 mb-6"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {[1, 2, 3].map((s) => (
            <motion.div
              key={s}
              className={`h-2 rounded-full transition-all duration-300 ${
                s === step
                  ? 'w-8 bg-gradient-to-r from-purple-600 to-pink-600'
                  : s < step
                  ? 'w-2 bg-green-500'
                  : 'w-2 bg-gray-300'
              }`}
              animate={s === step ? { scale: [1, 1.2, 1] } : {}}
              transition={{ repeat: Infinity, duration: 2 }}
            />
          ))}
        </motion.div>

        <AnimatePresence mode="wait">
          {/* Step 1: Phone Number */}
          {step === 1 && (
            <motion.div
              key="step1"
              variants={cardVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="relative"
              style={{ transformStyle: 'preserve-3d' }}
            >
              <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl p-6 border border-white/20">
                {/* Floating Icon */}
                <motion.div
                  className="mx-auto w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mb-4 shadow-lg"
                  animate={floatingAnimation}
                >
                  <PhoneIcon className="h-10 w-10 text-white" />
                </motion.div>

                <h2 className="text-2xl font-bold text-center bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
                  Welcome Back! 👋
                </h2>
                <p className="text-center text-gray-600 text-sm mb-6">
                  Enter your phone to continue
                </p>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm flex items-center gap-2"
                  >
                    <span className="text-lg">⚠️</span>
                    {error}
                  </motion.div>
                )}

                <form onSubmit={handlePhoneSubmit} className="space-y-4">
                  <div className="relative">
                    <PhoneIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-purple-500" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="0788 123 456"
                      className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-center text-lg font-semibold"
                      required
                      autoFocus
                    />
                  </div>

                  <motion.button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <motion.div
                          className="w-5 h-5 border-3 border-white border-t-transparent rounded-full"
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        />
                        Checking...
                      </span>
                    ) : (
                      'Continue →'
                    )}
                  </motion.button>
                </form>

                <div className="mt-6 text-center text-xs text-gray-500">
                  🔒 Your data is secure and encrypted
                </div>
              </div>

              {/* 3D Background Elements */}
              <motion.div
                className="absolute -top-10 -right-10 w-40 h-40 bg-purple-200 rounded-full blur-3xl opacity-30 -z-10"
                animate={{ scale: [1, 1.2, 1], rotate: 360 }}
                transition={{ duration: 10, repeat: Infinity }}
              />
              <motion.div
                className="absolute -bottom-10 -left-10 w-40 h-40 bg-pink-200 rounded-full blur-3xl opacity-30 -z-10"
                animate={{ scale: [1.2, 1, 1.2], rotate: -360 }}
                transition={{ duration: 10, repeat: Infinity }}
              />
            </motion.div>
          )}

          {/* Step 2: OTP or Registration */}
          {step === 2 && (
            <motion.div
              key="step2"
              variants={cardVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="relative"
              style={{ transformStyle: 'preserve-3d' }}
            >
              <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl p-6 border border-white/20">
                <motion.div
                  className="mx-auto w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center mb-4 shadow-lg"
                  animate={floatingAnimation}
                >
                  {isExistingUser ? (
                    <ShieldCheckIcon className="h-10 w-10 text-white" />
                  ) : (
                    <UserIcon className="h-10 w-10 text-white" />
                  )}
                </motion.div>

                <h2 className="text-2xl font-bold text-center bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                  {isExistingUser ? 'Verify OTP' : 'Create Account'}
                </h2>
                <p className="text-center text-gray-600 text-sm mb-6">
                  {isExistingUser ? 'Enter the code we sent you' : 'Tell us about yourself'}
                </p>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm"
                  >
                    {error}
                  </motion.div>
                )}

                {isExistingUser ? (
                  <form onSubmit={handleOtpVerify} className="space-y-4">
                    <div>
                      <input
                        type="text"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        placeholder="000000"
                        className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-2xl font-bold tracking-widest"
                        maxLength="6"
                        required
                      />
                    </div>

                    <div className="flex gap-2">
                      <motion.button
                        type="button"
                        onClick={() => setStep(1)}
                        className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-xl font-semibold hover:bg-gray-50 transition-all"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        Back
                      </motion.button>
                      <motion.button
                        type="submit"
                        disabled={loading || otp.length !== 6}
                        className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        {loading ? 'Verifying...' : 'Verify'}
                      </motion.button>
                    </div>
                  </form>
                ) : (
                  <form onSubmit={handleRegistration} className="space-y-3">
                    <input
                      type="text"
                      value={userDetails.fullName}
                      onChange={(e) => setUserDetails({ ...userDetails, fullName: e.target.value })}
                      placeholder="Full Name"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      required
                      autoFocus
                    />
                    
                    <input
                      type="text"
                      value={userDetails.address}
                      onChange={(e) => setUserDetails({ ...userDetails, address: e.target.value })}
                      placeholder="Street Address"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      required
                    />
                    
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={userDetails.city}
                        onChange={(e) => setUserDetails({ ...userDetails, city: e.target.value })}
                        placeholder="City"
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        required
                      />
                      <select
                        value={userDetails.district}
                        onChange={(e) => setUserDetails({ ...userDetails, district: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        required
                      >
                        <option value="Gasabo">Gasabo</option>
                        <option value="Kicukiro">Kicukiro</option>
                        <option value="Nyarugenge">Nyarugenge</option>
                      </select>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <motion.button
                        type="button"
                        onClick={() => setStep(1)}
                        className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-xl font-semibold hover:bg-gray-50 transition-all"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        Back
                      </motion.button>
                      <motion.button
                        type="submit"
                        disabled={loading}
                        className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        {loading ? 'Creating...' : 'Complete'}
                      </motion.button>
                    </div>
                  </form>
                )}
              </div>

              <motion.div
                className="absolute -top-10 -right-10 w-40 h-40 bg-blue-200 rounded-full blur-3xl opacity-30 -z-10"
                animate={{ scale: [1, 1.2, 1], rotate: 360 }}
                transition={{ duration: 10, repeat: Infinity }}
              />
            </motion.div>
          )}

          {/* Step 3: Success */}
          {step === 3 && (
            <motion.div
              key="step3"
              variants={cardVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="relative"
              style={{ transformStyle: 'preserve-3d' }}
            >
              <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-white/20 text-center">
                <motion.div
                  className="mx-auto w-24 h-24 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center mb-6 shadow-lg"
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", stiffness: 200, damping: 15 }}
                >
                  <CheckCircleIcon className="h-12 w-12 text-white" />
                </motion.div>

                <motion.h2
                  className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-3"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  All Set! ✨
                </motion.h2>
                
                <motion.p
                  className="text-gray-600 mb-6"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  Let's complete your order
                </motion.p>

                <motion.div
                  className="flex justify-center gap-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                >
                  <motion.div
                    className="w-2 h-2 bg-green-500 rounded-full"
                    animate={{ scale: [1, 1.5, 1] }}
                    transition={{ repeat: Infinity, duration: 1, delay: 0 }}
                  />
                  <motion.div
                    className="w-2 h-2 bg-green-500 rounded-full"
                    animate={{ scale: [1, 1.5, 1] }}
                    transition={{ repeat: Infinity, duration: 1, delay: 0.2 }}
                  />
                  <motion.div
                    className="w-2 h-2 bg-green-500 rounded-full"
                    animate={{ scale: [1, 1.5, 1] }}
                    transition={{ repeat: Infinity, duration: 1, delay: 0.4 }}
                  />
                </motion.div>
              </div>

              <motion.div
                className="absolute -top-10 -right-10 w-40 h-40 bg-green-200 rounded-full blur-3xl opacity-30 -z-10"
                animate={{ scale: [1, 1.2, 1], rotate: 360 }}
                transition={{ duration: 10, repeat: Infinity }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Enhanced3DCheckoutAuth;
