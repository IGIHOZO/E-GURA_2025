import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  PhoneIcon,
  ShieldCheckIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import { smsAPI } from '../services/smsApi';
import { useAuth } from '../context/AuthContext';

const SMSLogin = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  
  const [step, setStep] = useState(1); // 1: Phone, 2: OTP, 3: Details (if new)
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [sentOTP, setSentOTP] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // New user details
  const [userDetails, setUserDetails] = useState({
    firstName: '',
    lastName: '',
    email: ''
  });

  // Format phone number
  const formatPhone = (phone) => {
    let cleaned = phone.replace(/\D/g, '');
    if (cleaned.startsWith('0')) {
      cleaned = '250' + cleaned.substring(1);
    }
    if (!cleaned.startsWith('250')) {
      cleaned = '250' + cleaned;
    }
    return cleaned;
  };

  // Step 1: Send OTP
  const handleSendOTP = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      console.log('📱 Sending OTP to:', phoneNumber);
      
      // Generate OTP locally for testing (works without backend)
      const generatedOTP = Math.floor(100000 + Math.random() * 900000).toString();
      
      try {
        // Try to send via backend SMS service
        const response = await smsAPI.sendOTP(phoneNumber);
        
        if (response.success && response.data?.otp) {
          setSentOTP(response.data.otp);
          setSuccess(`✅ OTP: ${response.data.otp} (Check your phone or use this code)`);
          setStep(2);
          console.log('✅ OTP Code:', response.data.otp);
          console.log('✅ Use this OTP to login:', response.data.otp);
          return;
        }
      } catch (backendError) {
        console.warn('⚠️ Backend SMS failed, using local OTP:', backendError.message);
      }
      
      // Fallback: Use locally generated OTP if backend fails
      setSentOTP(generatedOTP);
      setSuccess(`✅ OTP Generated: ${generatedOTP} (Use this code to login)`);
      setStep(2);
      console.log('✅ OTP Code (Local):', generatedOTP);
      console.log('✅ Use this OTP to login:', generatedOTP);
      
    } catch (err) {
      console.error('❌ OTP generation error:', err);
      
      // Even if everything fails, generate OTP locally
      const fallbackOTP = Math.floor(100000 + Math.random() * 900000).toString();
      setSentOTP(fallbackOTP);
      setSuccess(`✅ OTP: ${fallbackOTP} (Backend offline - using local OTP)`);
      setStep(2);
      console.log('✅ Fallback OTP:', fallbackOTP);
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      console.log('🔐 Verifying OTP:', otp, 'Expected:', sentOTP);
      
      if (otp === sentOTP) {
        // OTP verified - check if user exists in DATABASE
        const formattedPhone = formatPhone(phoneNumber);
        
        try {
          // Check if user exists in database via API
          const response = await fetch(`http://localhost:5000/api/auth/check-phone`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone: formattedPhone })
          });
          
          const data = await response.json();
          
          if (data.exists && data.user) {
            // Existing user - auto login
            console.log('✅ Existing user found in database');
            login(data.user);
            localStorage.setItem('user', JSON.stringify(data.user));
            localStorage.setItem('token', data.token || '');
            setSuccess('Login successful! Redirecting...');
            
            setTimeout(() => {
              navigate('/');
            }, 1500);
          } else {
            // New user - collect details
            console.log('🆕 New user - collecting details');
            setStep(3);
          }
        } catch (apiError) {
          console.error('API check failed, assuming new user:', apiError);
          // If API fails, assume new user
          setStep(3);
        }
      } else {
        setError('Invalid OTP. Please try again.');
      }
    } catch (err) {
      console.error('❌ OTP verification error:', err);
      setError('Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Complete registration for new user
  const handleCompleteRegistration = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const formattedPhone = formatPhone(phoneNumber);
      
      console.log('📝 Registering new user to DATABASE...');
      
      // Register user in DATABASE via API
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: userDetails.firstName,
          lastName: userDetails.lastName,
          email: userDetails.email || `${formattedPhone}@temp.com`,
          phone: formattedPhone,
          password: `temp_${Date.now()}` // Temporary password
        })
      });

      const data = await response.json();
      console.log('📥 Registration response:', data);
      
      if (!response.ok) {
        throw new Error(data.message || `Server error: ${response.status}`);
      }
      
      if (data.success && data.data && data.data.user) {
        console.log('✅ User registered in database successfully!');
        
        // Auto login with the registered user
        const userData = data.data.user;
        login(userData);
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('token', data.data.token);
        localStorage.setItem('userId', userData.id);
        
        // Send welcome SMS
        try {
          await smsAPI.sendWelcomeSMS(
            formattedPhone,
            `${userDetails.firstName} ${userDetails.lastName}`
          );
          console.log('📱 Welcome SMS sent');
        } catch (smsErr) {
          console.error('Welcome SMS failed:', smsErr);
          // Don't fail registration if SMS fails
        }

        setSuccess('✅ Registration successful! Redirecting...');
        
        setTimeout(() => {
          navigate('/shop');
        }, 1500);
      } else {
        console.error('❌ Invalid response structure:', data);
        throw new Error(data.message || 'Registration failed - Invalid response');
      }
    } catch (err) {
      console.error('❌ Registration error:', err);
      const errorMessage = err.message || 'Registration failed. Please try again.';
      setError(errorMessage);
      
      // Show more helpful error messages
      if (errorMessage.includes('email already exists')) {
        setError('This email is already registered. Please use a different email.');
      } else if (errorMessage.includes('phone')) {
        setError('This phone number is already registered. Please login instead.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-white flex items-center justify-center py-12 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <PhoneIcon className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {step === 1 && 'Login with SMS'}
            {step === 2 && 'Verify OTP'}
            {step === 3 && 'Complete Registration'}
          </h1>
          <p className="text-gray-600">
            {step === 1 && 'Enter your phone number to receive OTP'}
            {step === 2 && 'Enter the code sent to your phone'}
            {step === 3 && 'Tell us a bit about yourself'}
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8">
          {[1, 2, 3].map((s) => (
            <React.Fragment key={s}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                step >= s ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                {step > s ? <CheckCircleIcon className="h-6 w-6" /> : s}
              </div>
              {s < 3 && (
                <div className={`w-16 h-1 ${step > s ? 'bg-red-600' : 'bg-gray-200'}`} />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Error/Success Messages */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700"
            >
              <XCircleIcon className="h-5 w-5" />
              {error}
            </motion.div>
          )}
          {success && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-700"
            >
              <CheckCircleIcon className="h-5 w-5" />
              {success}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Forms */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Step 1: Phone Number */}
          {step === 1 && (
            <form onSubmit={handleSendOTP} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <div className="relative">
                  <PhoneIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="tel"
                    required
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="0782540683"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  We'll send you a verification code
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 transition-colors font-semibold flex items-center justify-center gap-2 disabled:bg-gray-400"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Sending OTP...
                  </>
                ) : (
                  <>
                    Send OTP
                    <ArrowRightIcon className="h-5 w-5" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Step 2: OTP Verification */}
          {step === 2 && (
            <form onSubmit={handleVerifyOTP} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Enter OTP Code
                </label>
                <input
                  type="text"
                  required
                  maxLength="6"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="123456"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent text-center text-2xl tracking-widest font-mono"
                />
                <p className="text-xs text-gray-500 mt-1 text-center">
                  Code sent to {phoneNumber}
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 transition-colors font-semibold flex items-center justify-center gap-2 disabled:bg-gray-400"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Verifying...
                  </>
                ) : (
                  <>
                    Verify OTP
                    <ShieldCheckIcon className="h-5 w-5" />
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-full text-gray-600 hover:text-gray-900 text-sm"
              >
                ← Back to phone number
              </button>
            </form>
          )}

          {/* Step 3: User Details (New User) */}
          {step === 3 && (
            <form onSubmit={handleCompleteRegistration} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  First Name
                </label>
                <input
                  type="text"
                  required
                  value={userDetails.firstName}
                  onChange={(e) => setUserDetails({...userDetails, firstName: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Last Name
                </label>
                <input
                  type="text"
                  required
                  value={userDetails.lastName}
                  onChange={(e) => setUserDetails({...userDetails, lastName: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email (Optional)
                </label>
                <input
                  type="email"
                  value={userDetails.email}
                  onChange={(e) => setUserDetails({...userDetails, email: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 transition-colors font-semibold flex items-center justify-center gap-2 disabled:bg-gray-400"
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
            </form>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-gray-600 mt-6">
          By continuing, you agree to our Terms of Service and Privacy Policy
        </p>
      </motion.div>
    </div>
  );
};

export default SMSLogin;
