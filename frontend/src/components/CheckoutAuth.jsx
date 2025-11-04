import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  PhoneIcon, 
  UserIcon, 
  MapPinIcon,
  CheckCircleIcon,
  XMarkIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const CheckoutAuth = ({ onAuthComplete }) => {
  const { login } = useAuth();
  const [step, setStep] = useState(1); // 1: Phone, 2: OTP/Details, 3: Success
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

  // Check if user exists and handle accordingly
  const handlePhoneSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const formattedPhone = formatPhone(phone);
      const response = await axios.get(`http://localhost:5000/api/auth/check-phone`, {
        params: { phone: formattedPhone }
      });

      if (response.data.exists) {
        // Existing user - generate and send OTP
        setIsExistingUser(true);
        const newOtp = generateOTP();
        setGeneratedOtp(newOtp);
        
        // AUTO-FILL OTP for easy verification
        setOtp(newOtp);
        
        // TODO: Send OTP via SMS (for now, just log it)
        console.log(`📱 OTP for ${formattedPhone}: ${newOtp}`);
        alert(`Your OTP is: ${newOtp}\n(Auto-filled for you - just click Verify!)`);
        
        setStep(2);
        // Auto-scroll to verify button after step changes
        setTimeout(() => {
          document.getElementById('verify-button')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);
      } else {
        // New user - collect details
        setIsExistingUser(false);
        setStep(2);
        // Auto-scroll to first input field after step changes
        setTimeout(() => {
          document.getElementById('fullname-input')?.focus();
          document.getElementById('fullname-input')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);
      }
    } catch (err) {
      console.error('Error checking phone:', err);
      console.error('Error details:', err.response?.data);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to verify phone number. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Verify OTP for existing users
  const handleOTPVerify = async (e) => {
    e.preventDefault();
    setError('');

    if (otp !== generatedOtp) {
      setError('Invalid OTP. Please try again.');
      return;
    }

    setLoading(true);
    try {
      const formattedPhone = formatPhone(phone);
      const response = await axios.get(`http://localhost:5000/api/auth/check-phone`, {
        params: { phone: formattedPhone }
      });

      if (response.data.exists) {
        const user = response.data.user;
        
        // Save user data and update AuthContext
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('userId', user.id);
        localStorage.setItem('userPhone', formattedPhone);
        
        // Update AuthContext
        await login(user);
        
        setStep(3);
        setTimeout(() => {
          onAuthComplete(user);
        }, 1000);
      }
    } catch (err) {
      console.error('OTP verification error:', err);
      setError('Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Register new user
  const handleRegistration = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const formattedPhone = formatPhone(phone);
      const email = `${formattedPhone.replace('+', '')}@customer.com`;
      
      // Split full name into first and last name
      const nameParts = userDetails.fullName.trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || nameParts[0];

      const response = await axios.post('/api/auth/register', {
        firstName: firstName,
        lastName: lastName,
        email: email,
        phone: formattedPhone,
        password: `temp_${Date.now()}`, // Temporary password
        addresses: [{
          type: 'home',
          firstName: firstName,
          lastName: lastName,
          phone: formattedPhone,
          address: userDetails.address,
          city: userDetails.city,
          district: userDetails.district,
          country: 'Rwanda',
          isDefault: true
        }]
      });

      if (response.data.success) {
        const user = response.data.data.user;
        
        // Save user data
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('userId', user.id);
        localStorage.setItem('userPhone', formattedPhone);
        localStorage.setItem('token', response.data.data.token);
        
        // Update AuthContext
        await login(user);
        
        setStep(3);
        setTimeout(() => {
          onAuthComplete(user);
        }, 1000);
      }
    } catch (err) {
      console.error('Registration error:', err);
      setError(err.response?.data?.message || 'Failed to register. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl p-3 sm:p-4 max-w-md mx-auto">
      <AnimatePresence mode="wait">
        {/* Step Indicator - Compact */}
        <div className="flex justify-center mb-2 sm:mb-3">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center mx-1 text-xs sm:text-sm ${
                s === step
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold'
                  : s < step
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-200 text-gray-500'
              }`}
            >
              {s < step ? <CheckCircleIcon className="h-4 w-4 sm:h-5 sm:w-5" /> : s}
            </div>
          ))}
        </div>

        {/* Header - Compact */}
        <div className="text-center mb-2 sm:mb-3">
          <div className="mx-auto w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center mb-2">
            {step === 1 && <PhoneIcon className="h-7 w-7 sm:h-8 sm:w-8 text-white" />}
            {step === 2 && (isExistingUser ? <ShieldCheckIcon className="h-7 w-7 sm:h-8 sm:w-8 text-white" /> : <UserIcon className="h-7 w-7 sm:h-8 sm:w-8 text-white" />)}
            {step === 3 && <CheckCircleIcon className="h-7 w-7 sm:h-8 sm:w-8 text-white" />}
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-1 px-2">
            {step === 1 && 'Verify Your Phone'}
            {step === 2 && (isExistingUser ? 'Enter OTP Code' : 'Complete Your Profile')}
            {step === 3 && 'All Set! ✨'}
          </h2>
          <p className="text-xs sm:text-sm text-gray-600 px-2">
            {step === 1 && "We'll confirm your delivery"}
            {step === 2 && (isExistingUser ? `Code sent to ${phone}` : 'Just a few details')}
            {step === 3 && 'Your account is ready!'}
          </p>
        </div>

        {/* Error Message */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start"
            >
              <XMarkIcon className="h-5 w-5 text-red-600 mr-2 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-600">{error}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Step 1: Phone Number */}
        {step === 1 && (
          <motion.form
            key="phone"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            onSubmit={handlePhoneSubmit}
            className="space-y-4"
          >
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number
              </label>
              <div className="relative">
                <PhoneIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0788 123 456"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                />
              </div>
              <p className="mt-2 text-xs text-gray-500">
                We'll use this for delivery updates and order confirmation
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Verifying...' : 'Continue'}
            </button>
          </motion.form>
        )}

        {/* Step 2: OTP or Registration Form */}
        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            {isExistingUser ? (
              // OTP Form for existing users
              <form onSubmit={handleOTPVerify} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Enter 6-Digit OTP
                  </label>
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="000000"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg text-center text-2xl tracking-widest focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    maxLength={6}
                    required
                  />
                  <p className="mt-2 text-xs text-gray-500 text-center">
                    Check your SMS for the verification code
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                  >
                    Back
                  </button>
                  <button
                    id="verify-button"
                    type="submit"
                    disabled={loading || otp.length !== 6}
                    className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Verifying...' : 'Verify OTP'}
                  </button>
                </div>
              </form>
            ) : (
              // Registration Form for new users - COMPACT
              <form onSubmit={handleRegistration} className="space-y-2">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Full Name *
                  </label>
                  <input
                    id="fullname-input"
                    type="text"
                    value={userDetails.fullName}
                    onChange={(e) => setUserDetails({ ...userDetails, fullName: e.target.value })}
                    placeholder="e.g., John Doe"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Street Address *
                  </label>
                  <input
                    type="text"
                    value={userDetails.address}
                    onChange={(e) => setUserDetails({ ...userDetails, address: e.target.value })}
                    placeholder="KN 5 Ave, House #123"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      City *
                    </label>
                    <input
                      type="text"
                      value={userDetails.city}
                      onChange={(e) => setUserDetails({ ...userDetails, city: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      District *
                    </label>
                    <select
                      value={userDetails.district}
                      onChange={(e) => setUserDetails({ ...userDetails, district: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      required
                    >
                      <option value="Gasabo">Gasabo</option>
                      <option value="Kicukiro">Kicukiro</option>
                      <option value="Nyarugenge">Nyarugenge</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-2 mt-3">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm font-semibold hover:bg-gray-50 transition-colors"
                  >
                    Back
                  </button>
                  <button
                    id="register-button"
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white py-2 rounded-lg text-sm font-semibold hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Creating...' : 'Complete Registration'}
                  </button>
                </div>
              </form>
            )}
          </motion.div>
        )}

        {/* Step 3: Success */}
        {step === 3 && (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-8"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
              className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4"
            >
              <CheckCircleIcon className="h-12 w-12 text-green-600" />
            </motion.div>
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
              {isExistingUser ? 'Welcome Back!' : 'Account Created!'}
            </h3>
            <p className="text-sm sm:text-base text-gray-600 mb-4">
              {isExistingUser 
                ? 'Logged in successfully'
                : 'Your account has been created successfully'}
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4 mb-4">
              <p className="text-xs sm:text-sm text-blue-800 font-semibold mb-1">
                📍 What's Next?
              </p>
              <p className="text-xs sm:text-sm text-blue-700">
                Your information has been saved. Proceeding to checkout...
              </p>
            </div>
            <div className="flex items-center justify-center text-sm text-gray-500">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600 mr-2"></div>
              Loading your details...
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CheckoutAuth;
