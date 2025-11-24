import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { 
  PhoneIcon,
  UserIcon,
  ShieldCheckIcon,
  CheckCircleIcon,
  SparklesIcon,
  MapPinIcon,
  HomeIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const AuthPage = () => {
  const navigate = useNavigate();
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

  // Step 1: Submit phone number
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
        // Existing user - generate OTP
        setIsExistingUser(true);
        const newOtp = generateOTP();
        setGeneratedOtp(newOtp);
        setOtp(newOtp);
        console.log(`📱 OTP for ${formattedPhone}: ${newOtp}`);
        setStep(2);
      } else {
        // New user - go to registration
        setIsExistingUser(false);
        setStep(2);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to verify phone number');
    } finally {
      setLoading(false);
    }
  }, [phone, formatPhone, generateOTP]);

  // Step 2: Verify OTP (for existing users)
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
        login(response.data.user, response.data.token);
        setStep(3);
        setTimeout(() => navigate('/'), 1500);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to verify OTP');
    } finally {
      setLoading(false);
    }
  }, [otp, generatedOtp, phone, formatPhone, login, navigate]);

  // Step 2: Register new user
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

      if (response.data.user || (response.data.data && response.data.data.user)) {
        const user = response.data.user || response.data.data.user;
        login(user, response.data.token || response.data.data.token);
        setStep(3);
        setTimeout(() => navigate('/'), 1500);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to register');
    } finally {
      setLoading(false);
    }
  }, [phone, userDetails, formatPhone, login, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl w-full grid md:grid-cols-2 gap-8 items-center">
        {/* Left Side - Branding */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="hidden md:block"
        >
          <div className="text-center md:text-left">
            <div className="inline-flex items-center space-x-2 mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-600 to-red-600 rounded-2xl flex items-center justify-center">
                <ShieldCheckIcon className="h-10 w-10 text-white" />
              </div>
              <h1 className="text-4xl font-black bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                E-Gura Store
              </h1>
            </div>
            
            <h2 className="text-5xl font-black text-gray-900 mb-6">
              Welcome Back!
            </h2>
            
            <p className="text-xl text-gray-600 mb-8">
              Join thousands of happy shoppers. Get access to exclusive deals and AI-powered negotiation.
            </p>

            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <SparklesIcon className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">AI Negotiation</h3>
                  <p className="text-sm text-gray-600">Save up to 10% on every purchase</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <ShieldCheckIcon className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">Secure Shopping</h3>
                  <p className="text-sm text-gray-600">100% buyer protection</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <UserIcon className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">Personal Account</h3>
                  <p className="text-sm text-gray-600">Track orders & save favorites</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Right Side - Auth Form */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="bg-white rounded-3xl shadow-2xl p-8 md:p-12"
        >
          {/* Step Progress */}
          <div className="flex items-center justify-center mb-8">
            {[1, 2, 3].map((s) => (
              <React.Fragment key={s}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                  step >= s ? 'bg-gradient-to-r from-orange-600 to-red-600 text-white' : 'bg-gray-200 text-gray-600'
                }`}>
                  {step > s ? <CheckCircleIcon className="h-6 w-6" /> : s}
                </div>
                {s < 3 && (
                  <div className={`w-12 h-1 transition-all ${
                    step > s ? 'bg-gradient-to-r from-orange-600 to-red-600' : 'bg-gray-200'
                  }`} />
                )}
              </React.Fragment>
            ))}
          </div>

          {/* Error Message */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-center gap-2"
              >
                <span className="text-xl">⚠️</span>
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence mode="wait">
            {/* Step 1: Phone Number */}
            {step === 1 && (
              <motion.form
                key="phone"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                onSubmit={handlePhoneSubmit}
                className="space-y-6"
              >
                <div className="text-center">
                  <div className="w-20 h-20 bg-gradient-to-r from-orange-600 to-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <PhoneIcon className="h-10 w-10 text-white" />
                  </div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">
                    Welcome!
                  </h2>
                  <p className="text-gray-600">
                    Enter your phone number to continue
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <div className="relative">
                    <PhoneIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full pl-10 pr-4 py-4 border-2 border-gray-300 rounded-xl focus:border-orange-500 focus:outline-none transition-colors text-lg"
                      placeholder="0788 123 456"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    We'll check if you have an account
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 bg-gradient-to-r from-orange-600 to-red-600 text-white font-bold rounded-xl hover:shadow-xl transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Checking...
                    </>
                  ) : (
                    'Continue'
                  )}
                </button>
              </motion.form>
            )}

            {/* Step 2A: OTP Verification (Existing User) */}
            {step === 2 && isExistingUser && (
              <motion.form
                key="otp"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                onSubmit={handleOtpVerify}
                className="space-y-6"
              >
                <div className="text-center">
                  <div className="w-20 h-20 bg-gradient-to-r from-green-600 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <ShieldCheckIcon className="h-10 w-10 text-white" />
                  </div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">
                    Verify OTP
                  </h2>
                  <p className="text-gray-600">
                    Enter the code sent to {phone}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 text-center">
                    OTP Code
                  </label>
                  <input
                    type="text"
                    required
                    maxLength="6"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className="w-full px-4 py-4 border-2 border-gray-300 rounded-xl focus:border-green-500 focus:outline-none transition-colors text-center text-3xl tracking-widest font-mono font-bold"
                    placeholder="000000"
                  />
                  <p className="text-xs text-green-600 mt-2 text-center font-medium">
                    💡 Check console for OTP: {generatedOtp}
                  </p>
                </div>

                <div className="space-y-3">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold rounded-xl hover:shadow-xl transition-all transform hover:scale-105 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        Verifying...
                      </>
                    ) : (
                      <>
                        Verify OTP
                        <CheckCircleIcon className="h-5 w-5" />
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="w-full text-gray-600 hover:text-gray-900 text-sm"
                  >
                    ← Change phone number
                  </button>
                </div>
              </motion.form>
            )}

            {/* Step 2B: Registration (New User) */}
            {step === 2 && !isExistingUser && (
              <motion.form
                key="register"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                onSubmit={handleRegistration}
                className="space-y-6"
              >
                <div className="text-center">
                  <div className="w-20 h-20 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <UserIcon className="h-10 w-10 text-white" />
                  </div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">
                    Create Account
                  </h2>
                  <p className="text-gray-600">
                    Tell us a bit about yourself
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name
                  </label>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      required
                      value={userDetails.fullName}
                      onChange={(e) => setUserDetails({ ...userDetails, fullName: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
                      placeholder="John Doe"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Delivery Address
                  </label>
                  <div className="relative">
                    <MapPinIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      required
                      value={userDetails.address}
                      onChange={(e) => setUserDetails({ ...userDetails, address: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
                      placeholder="KG 123 St"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      City
                    </label>
                    <select
                      value={userDetails.city}
                      onChange={(e) => setUserDetails({ ...userDetails, city: e.target.value })}
                      className="w-full px-3 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
                    >
                      <option>Kigali</option>
                      <option>Huye</option>
                      <option>Musanze</option>
                      <option>Rubavu</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      District
                    </label>
                    <select
                      value={userDetails.district}
                      onChange={(e) => setUserDetails({ ...userDetails, district: e.target.value })}
                      className="w-full px-3 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
                    >
                      <option>Gasabo</option>
                      <option>Kicukiro</option>
                      <option>Nyarugenge</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-3">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-xl hover:shadow-xl transition-all transform hover:scale-105 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        Creating Account...
                      </>
                    ) : (
                      <>
                        Complete Registration
                        <CheckCircleIcon className="h-5 w-5" />
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="w-full text-gray-600 hover:text-gray-900 text-sm"
                  >
                    ← Change phone number
                  </button>
                </div>
              </motion.form>
            )}

            {/* Step 3: Success */}
            {step === 3 && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-8"
              >
                <div className="w-24 h-24 bg-gradient-to-r from-green-600 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircleIcon className="h-16 w-16 text-white" />
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-3">
                  Welcome! 🎉
                </h2>
                <p className="text-gray-600 text-lg">
                  You're all set. Redirecting to home...
                </p>
                <div className="mt-6">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto"></div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Back to Home */}
          <div className="mt-8 text-center">
            <Link to="/" className="text-sm text-gray-600 hover:text-orange-600 transition-colors">
              ← Back to Shopping
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AuthPage;
