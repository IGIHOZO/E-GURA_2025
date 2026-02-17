import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  PhoneIcon, 
  UserIcon, 
  MapPinIcon,
  CheckCircleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const QuickAuth = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  
  const [step, setStep] = useState(1); // 1: Phone, 2: Details (if new), 3: Success
  const [phone, setPhone] = useState('');
  const [userDetails, setUserDetails] = useState({
    firstName: '',
    lastName: '',
    address: '',
    city: '',
    district: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isExistingUser, setIsExistingUser] = useState(false);

  // Get redirect path from location state (product ID or page)
  const redirectTo = location.state?.from || '/shop';
  const productId = location.state?.productId;
  const action = location.state?.action; // 'buy', 'addToCart', or view product

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

  // Check if user exists by phone
  const checkUserExists = async (phoneNumber) => {
    try {
      const formattedPhone = formatPhone(phoneNumber);
      const response = await axios.get(`http://localhost:5000/api/auth/check-phone`, {
        params: { phone: formattedPhone }
      });
      return response.data;
    } catch (error) {
      console.error('Error checking user:', error);
      return { exists: false };
    }
  };

  // Handle phone submission
  const handlePhoneSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!phone || phone.length < 9) {
      setError('Please enter a valid phone number');
      return;
    }

    setLoading(true);

    try {
      const formattedPhone = formatPhone(phone);
      const result = await checkUserExists(phone);

      if (result.exists && result.user) {
        // Existing user - login directly
        setIsExistingUser(true);
        login(result.user);
        localStorage.setItem('user', JSON.stringify(result.user));
        localStorage.setItem('userId', result.user.id);
        localStorage.setItem('phone', formattedPhone);
        
        setStep(3);
        setTimeout(() => {
          if (productId) {
            navigate(`/product/${productId}`);
          } else {
            navigate(redirectTo);
          }
        }, 1500);
      } else {
        // New user - ask for details
        setIsExistingUser(false);
        setStep(2);
      }
    } catch (err) {
      console.error('Error:', err);
      setError('Failed to verify phone number. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle registration for new users
  const handleRegistration = async (e) => {
    e.preventDefault();
    setError('');

    if (!userDetails.firstName || !userDetails.lastName) {
      setError('Please provide your name');
      return;
    }

    if (!userDetails.address || !userDetails.city || !userDetails.district) {
      setError('Please provide your address details');
      return;
    }

    setLoading(true);

    try {
      const formattedPhone = formatPhone(phone);
      
      const response = await axios.post('/api/auth/register', {
        firstName: userDetails.firstName,
        lastName: userDetails.lastName,
        phone: formattedPhone,
        email: `${formattedPhone}@customer.com`, // Auto-generate email
        password: `temp_${Date.now()}`, // Temporary password
        addresses: [{
          type: 'home',
          firstName: userDetails.firstName,
          lastName: userDetails.lastName,
          phone: formattedPhone,
          address: userDetails.address,
          city: userDetails.city,
          district: userDetails.district,
          country: 'Rwanda',
          isDefault: true
        }]
      });

      if (response.data.success && response.data.data.user) {
        const userData = response.data.data.user;
        login(userData);
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('token', response.data.data.token);
        localStorage.setItem('userId', userData.id);
        localStorage.setItem('phone', formattedPhone);

        setStep(3);
        setTimeout(() => {
          if (productId) {
            navigate(`/product/${productId}`);
          } else {
            navigate(redirectTo);
          }
        }, 1500);
      } else {
        throw new Error(response.data.message || 'Registration failed');
      }
    } catch (err) {
      console.error('Registration error:', err);
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full"
      >
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-4">
              {step === 1 && <PhoneIcon className="h-8 w-8 text-white" />}
              {step === 2 && <UserIcon className="h-8 w-8 text-white" />}
              {step === 3 && <CheckCircleIcon className="h-8 w-8 text-white" />}
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {step === 1 && 'Welcome! 👋'}
              {step === 2 && 'Tell us about yourself'}
              {step === 3 && 'All set! ✨'}
            </h1>
            <p className="text-gray-600">
              {step === 1 && (
                action === 'buy' 
                  ? 'Enter your phone number to complete purchase' 
                  : action === 'addToCart'
                  ? 'Enter your phone number to add to cart'
                  : 'Enter your phone number to continue'
              )}
              {step === 2 && 'Just a few quick details to get started'}
              {step === 3 && (isExistingUser ? 'Welcome back!' : 'Account created successfully!')}
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
            <form onSubmit={handlePhoneSubmit} className="space-y-4">
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
                    placeholder="07XX XXX XXX"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  />
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  We'll check if you're already a customer
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Checking...' : 'Continue'}
              </button>
            </form>
          )}

          {/* Step 2: User Details (New Users Only) */}
          {step === 2 && (
            <form onSubmit={handleRegistration} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    First Name *
                  </label>
                  <input
                    type="text"
                    value={userDetails.firstName}
                    onChange={(e) => setUserDetails({ ...userDetails, firstName: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    value={userDetails.lastName}
                    onChange={(e) => setUserDetails({ ...userDetails, lastName: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Street Address *
                </label>
                <div className="relative">
                  <MapPinIcon className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    value={userDetails.address}
                    onChange={(e) => setUserDetails({ ...userDetails, address: e.target.value })}
                    placeholder="e.g., KN 5 Ave, House #123"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    City *
                  </label>
                  <input
                    type="text"
                    value={userDetails.city}
                    onChange={(e) => setUserDetails({ ...userDetails, city: e.target.value })}
                    placeholder="Kigali"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    District *
                  </label>
                  <input
                    type="text"
                    value={userDetails.district}
                    onChange={(e) => setUserDetails({ ...userDetails, district: e.target.value })}
                    placeholder="Gasabo"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Creating...' : 'Complete'}
                </button>
              </div>
            </form>
          )}

          {/* Step 3: Success */}
          {step === 3 && (
            <div className="text-center py-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4"
              >
                <CheckCircleIcon className="h-12 w-12 text-green-600" />
              </motion.div>
              <p className="text-gray-600 mb-4">
                {isExistingUser ? 'Logging you in...' : 'Redirecting to your product...'}
              </p>
              <div className="flex justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
              </div>
            </div>
          )}
        </div>

        {/* Privacy Note */}
        <p className="text-center text-sm text-gray-600 mt-4">
          Your information is secure and will only be used for order delivery
        </p>
      </motion.div>
    </div>
  );
};

export default QuickAuth;
