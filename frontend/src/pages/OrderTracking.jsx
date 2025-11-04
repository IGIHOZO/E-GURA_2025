import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TruckIcon, 
  MapPinIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  MagnifyingGlassIcon,
  ArrowLeftIcon,
  InboxIcon,
  PhoneIcon,
  EnvelopeIcon
} from '@heroicons/react/24/outline';
import axios from 'axios';

const OrderTracking = () => {
  const { trackingId: urlTrackingId } = useParams();
  const navigate = useNavigate();
  
  const [trackingId, setTrackingId] = useState(urlTrackingId || '');
  const [tracking, setTracking] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load tracking if ID in URL
  useEffect(() => {
    if (urlTrackingId) {
      fetchTracking(urlTrackingId);
    }
  }, [urlTrackingId]);

  const fetchTracking = async (id) => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.get(`http://localhost:5000/api/tracking/${id}`);
      
      if (response.data.success) {
        const trackingData = response.data.tracking;
        // Normalize field names - backend uses statusHistory, frontend expects history
        if (trackingData.statusHistory && !trackingData.history) {
          trackingData.history = trackingData.statusHistory;
        }
        // Ensure history is always an array
        if (!trackingData.history || !Array.isArray(trackingData.history)) {
          trackingData.history = [];
        }
        setTracking(trackingData);
      } else {
        setError('Tracking not found. Please check your tracking number.');
      }
    } catch (err) {
      console.error('Tracking error:', err);
      setError(err.response?.data?.message || 'Unable to fetch tracking information. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (trackingId.trim()) {
      navigate(`/track/${trackingId.trim()}`);
      fetchTracking(trackingId.trim());
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'confirmed': 'bg-blue-100 text-blue-800',
      'processing': 'bg-purple-100 text-purple-800',
      'shipped': 'bg-indigo-100 text-indigo-800',
      'in_transit': 'bg-cyan-100 text-cyan-800',
      'out_for_delivery': 'bg-orange-100 text-orange-800',
      'delivered': 'bg-green-100 text-green-800',
      'cancelled': 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status) => {
    const isDelivered = status === 'delivered';
    const isCancelled = status === 'cancelled';
    
    if (isDelivered) return <CheckCircleIcon className="h-6 w-6 text-green-600" />;
    if (isCancelled) return <XCircleIcon className="h-6 w-6 text-red-600" />;
    return <TruckIcon className="h-6 w-6 text-orange-600" />;
  };

  const calculateProgress = (status) => {
    const statuses = ['pending', 'confirmed', 'processing', 'shipped', 'in_transit', 'out_for_delivery', 'delivered'];
    const index = statuses.indexOf(status);
    return ((index + 1) / statuses.length) * 100;
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/')}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Back to Home
          </button>
          
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Track Your Order</h1>
          <p className="text-gray-600">Enter your tracking number to see the latest updates</p>
        </div>

        {/* Search Form */}
        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleSearch}
          className="bg-white rounded-2xl shadow-lg p-6 mb-8"
        >
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={trackingId}
                onChange={(e) => setTrackingId(e.target.value)}
                placeholder="Enter tracking number (e.g., TRK1729198765ABC123)"
                className="w-full pl-12 pr-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>
            <button
              type="submit"
              disabled={loading || !trackingId.trim()}
              className="px-8 py-4 bg-orange-600 text-white rounded-xl font-semibold hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Tracking...' : 'Track'}
            </button>
          </div>
        </motion.form>

        {/* Error Message */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-red-50 border border-red-200 rounded-xl p-4 mb-8 flex items-start"
            >
              <XCircleIcon className="h-6 w-6 text-red-600 mr-3 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-red-900">Error</h3>
                <p className="text-red-700">{error}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-orange-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Fetching tracking information...</p>
          </div>
        )}

        {/* Tracking Results */}
        <AnimatePresence>
          {tracking && !loading && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
            >
              {/* Current Status Card */}
              <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <div className="flex items-center space-x-3 mb-2">
                      {getStatusIcon(tracking.status)}
                      <h2 className="text-2xl font-bold text-gray-900">Order Status</h2>
                    </div>
                    <p className="text-gray-600">Tracking #: <span className="font-mono font-semibold">{tracking.trackingId}</span></p>
                  </div>
                  <span className={`px-4 py-2 rounded-full font-semibold ${getStatusColor(tracking.status)}`}>
                    {tracking.status.toUpperCase().replace('_', ' ')}
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="mb-6">
                  <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${calculateProgress(tracking.status)}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                      className="h-full bg-gradient-to-r from-orange-500 to-orange-600"
                    />
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="flex items-start space-x-3">
                    <MapPinIcon className="h-6 w-6 text-orange-600 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-gray-600">Current Location</p>
                      <p className="font-semibold text-gray-900">{tracking.currentLocation}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <TruckIcon className="h-6 w-6 text-orange-600 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-gray-600">Carrier</p>
                      <p className="font-semibold text-gray-900">{tracking.carrier}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <ClockIcon className="h-6 w-6 text-orange-600 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-gray-600">Estimated Delivery</p>
                      <p className="font-semibold text-gray-900">
                        {new Date(tracking.estimatedDelivery).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tracking History */}
              <div className="bg-white rounded-2xl shadow-lg p-8">
                <h3 className="text-xl font-bold text-gray-900 mb-6">Tracking History</h3>
                
                <div className="relative">
                  {/* Timeline Line */}
                  <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>
                  
                  {/* Timeline Items */}
                  <div className="space-y-8">
                    {tracking.history && tracking.history.length > 0 ? tracking.history.map((event, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="relative pl-12"
                      >
                        {/* Timeline Dot */}
                        <div className={`absolute left-0 w-8 h-8 rounded-full flex items-center justify-center ${
                          index === 0 ? 'bg-orange-600' : 'bg-gray-300'
                        }`}>
                          <CheckCircleIcon className="h-5 w-5 text-white" />
                        </div>
                        
                        {/* Event Content */}
                        <div className={`${index === 0 ? 'bg-orange-50 border-orange-200' : 'bg-gray-50 border-gray-200'} border rounded-lg p-4`}>
                          <div className="flex items-start justify-between mb-2">
                            <h4 className={`font-semibold ${index === 0 ? 'text-orange-900' : 'text-gray-900'}`}>
                              {event.status.toUpperCase().replace('_', ' ')}
                            </h4>
                            <span className="text-sm text-gray-600">
                              {new Date(event.timestamp).toLocaleString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                          <p className="text-gray-700 mb-1">{event.location}</p>
                          <p className="text-sm text-gray-600">{event.message}</p>
                        </div>
                      </motion.div>
                    )) : (
                      <div className="text-center py-8">
                        <ClockIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600">No tracking history available yet.</p>
                        <p className="text-sm text-gray-500 mt-2">Your order is being processed.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Contact Support */}
              <div className="mt-8 bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl p-8 text-white">
                <h3 className="text-2xl font-bold mb-4">Need Help?</h3>
                <p className="mb-6">Our customer support team is here to assist you with any questions about your order.</p>
                
                <div className="grid md:grid-cols-3 gap-4">
                  <a href="tel:+250788123456" className="bg-white bg-opacity-20 backdrop-blur-sm hover:bg-opacity-30 transition-all rounded-xl p-4 flex items-center space-x-3">
                    <PhoneIcon className="h-6 w-6" />
                    <div>
                      <p className="text-sm opacity-90">Call Us</p>
                      <p className="font-semibold">+250 788 123 456</p>
                    </div>
                  </a>
                  
                  <a href="mailto:support@egura.com" className="bg-white bg-opacity-20 backdrop-blur-sm hover:bg-opacity-30 transition-all rounded-xl p-4 flex items-center space-x-3">
                    <EnvelopeIcon className="h-6 w-6" />
                    <div>
                      <p className="text-sm opacity-90">Email</p>
                      <p className="font-semibold">support@egura.com</p>
                    </div>
                  </a>
                  
                  <button className="bg-white bg-opacity-20 backdrop-blur-sm hover:bg-opacity-30 transition-all rounded-xl p-4 flex items-center space-x-3">
                    <InboxIcon className="h-6 w-6" />
                    <div>
                      <p className="text-sm opacity-90">Live Chat</p>
                      <p className="font-semibold">Start Chat</p>
                    </div>
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Empty State */}
        {!tracking && !loading && !error && (
          <div className="text-center py-12">
            <TruckIcon className="h-24 w-24 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Track Your Order</h3>
            <p className="text-gray-600">Enter your tracking number above to see your order status</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderTracking;
