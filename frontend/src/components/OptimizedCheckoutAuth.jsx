import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  PhoneIcon, 
  UserIcon, 
  ShieldCheckIcon,
  CheckCircleIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const OptimizedCheckoutAuth = ({ onAuthComplete }) => {
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

  // Memoized phone formatter
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
      const response = await axios.post('/api/auth/check-phone', {
        phone: formattedPhone
      });

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
      setError(err.response?.data?.message || 'Failed to verify phone number');
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
        setTimeout(() => onAuthComplete(response.data.user), 1200);
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
        setTimeout(() => onAuthComplete(response.data.user), 1200);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to register');
    } finally {
      setLoading(false);
    }
  }, [phone, userDetails, formatPhone, login, onAuthComplete]);

  // Optimized animation variants with will-change
  const cardVariants = useMemo(() => ({
    initial: { 
      opacity: 0, 
      x: -50,
      scale: 0.95
    },
    animate: { 
      opacity: 1, 
      x: 0,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30,
        mass: 0.8
      }
    },
    exit: { 
      opacity: 0, 
      x: 50,
      scale: 0.95,
      transition: {
        duration: 0.2
      }
    }
  }), []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 flex items-center justify-center p-3 sm:p-6">
      <div className="w-full max-w-md">
        {/* Progress Bar */}
        <div className="flex gap-1 mb-4" role="progressbar" aria-valuenow={step} aria-valuemin="1" aria-valuemax="3">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-1 flex-1 rounded-full transition-all duration-500 ${
                s <= step ? 'bg-gradient-to-r from-purple-600 to-pink-600' : 'bg-gray-200'
              }`}
            />
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* Step 1: Phone Number */}
          {step === 1 && (
            <motion.div
              key="step1"
              variants={cardVariants}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
                <div className="flex items-center justify-center mb-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg">
                    <PhoneIcon className="h-8 w-8 text-white" />
                  </div>
                </div>

                <h2 className="text-2xl font-bold text-center bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-1">
                  Welcome! 👋
                </h2>
                <p className="text-center text-gray-600 text-sm mb-6">
                  Enter your phone to continue
                </p>

                {error && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                    {error}
                  </div>
                )}

                <form onSubmit={handlePhoneSubmit} className="space-y-4">
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0788 123 456"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-center text-lg font-semibold"
                    required
                    autoFocus
                    aria-label="Phone number"
                  />

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 active:scale-[0.98]"
                  >
                    {loading ? 'Checking...' : 'Continue →'}
                  </button>
                </form>

                <p className="mt-4 text-center text-xs text-gray-500">🔒 Secure & Encrypted</p>
              </div>
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
            >
              <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
                <div className="flex items-center justify-center mb-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center shadow-lg">
                    {isExistingUser ? (
                      <ShieldCheckIcon className="h-8 w-8 text-white" />
                    ) : (
                      <UserIcon className="h-8 w-8 text-white" />
                    )}
                  </div>
                </div>

                <h2 className="text-2xl font-bold text-center bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-1">
                  {isExistingUser ? 'Verify OTP' : 'Create Account'}
                </h2>
                <p className="text-center text-gray-600 text-sm mb-6">
                  {isExistingUser ? 'Code: ' + generatedOtp : 'Quick setup'}
                </p>

                {error && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                    {error}
                  </div>
                )}

                {isExistingUser ? (
                  <form onSubmit={handleOtpVerify} className="space-y-4">
                    <input
                      type="text"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="000000"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-2xl font-bold tracking-widest"
                      maxLength="6"
                      required
                      aria-label="OTP Code"
                    />

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setStep(1)}
                        className="px-4 py-3 border-2 border-gray-300 rounded-xl font-semibold hover:bg-gray-50 transition-all active:scale-[0.98]"
                      >
                        Back
                      </button>
                      <button
                        type="submit"
                        disabled={loading || otp.length !== 6}
                        className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 active:scale-[0.98]"
                      >
                        {loading ? 'Verifying...' : 'Verify'}
                      </button>
                    </div>
                  </form>
                ) : (
                  <form onSubmit={handleRegistration} className="space-y-3">
                    <input
                      type="text"
                      value={userDetails.fullName}
                      onChange={(e) => setUserDetails({ ...userDetails, fullName: e.target.value })}
                      placeholder="Full Name"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                      required
                      autoFocus
                      aria-label="Full Name"
                    />
                    
                    <input
                      type="text"
                      value={userDetails.address}
                      onChange={(e) => setUserDetails({ ...userDetails, address: e.target.value })}
                      placeholder="Street Address"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                      required
                      aria-label="Address"
                    />
                    
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={userDetails.city}
                        onChange={(e) => setUserDetails({ ...userDetails, city: e.target.value })}
                        placeholder="City"
                        className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                        required
                        aria-label="City"
                      />
                      <select
                        value={userDetails.district}
                        onChange={(e) => setUserDetails({ ...userDetails, district: e.target.value })}
                        className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                        required
                        aria-label="District"
                      >
                        <option value="Gasabo">Gasabo</option>
                        <option value="Kicukiro">Kicukiro</option>
                        <option value="Nyarugenge">Nyarugenge</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setStep(1)}
                        className="px-4 py-3 border-2 border-gray-300 rounded-xl font-semibold hover:bg-gray-50 transition-all active:scale-[0.98]"
                      >
                        Back
                      </button>
                      <button
                        type="submit"
                        disabled={loading}
                        className="bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 active:scale-[0.98]"
                      >
                        {loading ? 'Creating...' : 'Complete'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
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
            >
              <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100 text-center">
                <div className="mx-auto w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center mb-4 shadow-lg">
                  <CheckCircleIcon className="h-10 w-10 text-white" />
                </div>

                <h2 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-2">
                  All Set! ✨
                </h2>
                
                <p className="text-gray-600 mb-4">
                  Completing your order...
                </p>

                <div className="flex justify-center gap-2">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      className="w-2 h-2 bg-green-500 rounded-full"
                      animate={{ scale: [1, 1.5, 1] }}
                      transition={{ repeat: Infinity, duration: 1, delay: i * 0.2 }}
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default OptimizedCheckoutAuth;
