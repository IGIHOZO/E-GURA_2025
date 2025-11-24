import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  XMarkIcon, 
  PhoneIcon, 
  UserIcon, 
  MapPinIcon, 
  CheckCircleIcon,
  ChevronRightIcon,
  ChevronLeftIcon,
  PlusIcon,
  PencilIcon,
  TruckIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';
import { 
  validateShippingForm, 
  createCustomerData, 
  createShippingAddressData,
  storeCustomerLocally,
  storeShippingAddressLocally,
  getCustomerByPhone,
  getCustomerShippingAddresses
} from '../utils/customerUtils';

const ModernShippingForm = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  actionType, 
  product,
  isSubmitting = false 
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [shippingForm, setShippingForm] = useState({
    phoneNumber: '',
    receiverName: '',
    location: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);
  const [loadingAddresses, setLoadingAddresses] = useState(false);

  const steps = [
    { id: 1, title: 'Contact Info', icon: PhoneIcon },
    { id: 2, title: 'Delivery Address', icon: MapPinIcon },
    { id: 3, title: 'Review & Confirm', icon: CheckCircleIcon }
  ];

  useEffect(() => {
    if (isOpen) {
      setCurrentStep(1);
      setFormErrors({});
      setSelectedAddress(null);
      setShowNewAddressForm(false);
    }
  }, [isOpen]);

  const handleFormChange = (field, value) => {
    setShippingForm(prev => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateCurrentStep = () => {
    const errors = {};
    
    switch (currentStep) {
      case 1:
        if (!shippingForm.phoneNumber.trim()) {
          errors.phoneNumber = 'Phone number is required';
        }
        break;
      case 2:
        if (!shippingForm.receiverName.trim()) {
          errors.receiverName = 'Receiver name is required';
        }
        if (!shippingForm.location.trim()) {
          errors.location = 'Delivery location is required';
        }
        // FORCE ACCEPT ANY LOCATION - NO MINIMUM LENGTH
        console.log('FORCE ACCEPTING ANY LOCATION:', shippingForm.location);
        break;
      default:
        break;
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const nextStep = () => {
    if (validateCurrentStep()) {
      if (currentStep < steps.length) {
        setCurrentStep(currentStep + 1);
      }
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handlePhoneNumberChange = async (phoneNumber) => {
    handleFormChange('phoneNumber', phoneNumber);
    
    if (phoneNumber.length >= 10) {
      setLoadingAddresses(true);
      try {
        const addresses = getCustomerShippingAddresses(phoneNumber);
        console.log('Loaded addresses for phone:', phoneNumber, addresses);
        setSavedAddresses(addresses);
        
        // Auto-select default address if available
        const defaultAddress = addresses.find(addr => addr.isDefault);
        if (defaultAddress) {
          console.log('Auto-selecting default address:', defaultAddress);
          setSelectedAddress(defaultAddress);
          setShippingForm(prev => ({
            ...prev,
            receiverName: defaultAddress.receiverName,
            location: defaultAddress.location
          }));
          setShowNewAddressForm(false);
        } else if (addresses.length > 0) {
          // If no default, select the first address
          console.log('Auto-selecting first address:', addresses[0]);
          setSelectedAddress(addresses[0]);
          setShippingForm(prev => ({
            ...prev,
            receiverName: addresses[0].receiverName,
            location: addresses[0].location
          }));
          setShowNewAddressForm(false);
        } else {
          // No saved addresses, show new address form
          setSelectedAddress(null);
          setShowNewAddressForm(true);
        }
      } catch (error) {
        console.error('Error loading addresses:', error);
      } finally {
        setLoadingAddresses(false);
      }
    }
  };

  const handleAddressSelect = (address) => {
    setSelectedAddress(address);
    setShippingForm(prev => ({
      ...prev,
      receiverName: address.receiverName,
      location: address.location
    }));
    setShowNewAddressForm(false);
  };

  const handleSubmit = () => {
    if (validateCurrentStep()) {
      onSubmit(shippingForm);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="relative bg-gradient-to-r from-purple-600 to-pink-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Shipping & Delivery</h2>
              <p className="text-purple-100 mt-1">Complete your order in {steps.length} simple steps</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-full transition-colors"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
          
          {/* Progress Steps */}
          <div className="flex items-center justify-between mt-6">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all ${
                  currentStep >= step.id 
                    ? 'bg-white text-purple-600 border-white' 
                    : 'border-white/30 text-white/70'
                }`}>
                  {currentStep > step.id ? (
                    <CheckCircleIcon className="h-5 w-5" />
                  ) : (
                    <step.icon className="h-5 w-5" />
                  )}
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-16 h-0.5 mx-2 transition-all ${
                    currentStep > step.id ? 'bg-white' : 'bg-white/30'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[50vh] overflow-y-auto">
          <AnimatePresence mode="wait">
            {currentStep === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="text-center mb-6">
                  <PhoneIcon className="h-12 w-12 text-purple-600 mx-auto mb-3" />
                  <h3 className="text-xl font-semibold text-gray-900">Contact Information</h3>
                  <p className="text-gray-600 mt-1">We'll use this to create your account and contact you</p>
                </div>

                <div className="space-y-4">
                  <div className="group">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Phone Number *
                    </label>
                    <div className="relative">
                      <PhoneIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="tel"
                        value={shippingForm.phoneNumber}
                        onChange={(e) => handlePhoneNumberChange(e.target.value)}
                        placeholder="+250 788 123 456"
                        className={`w-full pl-12 pr-4 py-4 border-2 rounded-xl focus:ring-4 focus:ring-purple-100 focus:border-purple-400 transition-all ${
                          formErrors.phoneNumber ? 'border-red-300' : 'border-gray-200'
                        }`}
                      />
                    </div>
                    {formErrors.phoneNumber && (
                      <p className="text-red-500 text-sm mt-1">{formErrors.phoneNumber}</p>
                    )}
                    <p className="text-gray-500 text-xs mt-2">
                      💡 We'll create your account automatically with this number
                    </p>
                  </div>

                  {loadingAddresses && (
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                      <div className="flex items-center space-x-3">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                        <p className="text-sm text-blue-800">Checking for saved addresses...</p>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {currentStep === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="text-center mb-6">
                  <MapPinIcon className="h-12 w-12 text-purple-600 mx-auto mb-3" />
                  <h3 className="text-xl font-semibold text-gray-900">Delivery Address</h3>
                  <p className="text-gray-600 mt-1">Choose a saved address or create a new one</p>
                </div>

                {/* Address Selection */}
                {savedAddresses.length > 0 && !showNewAddressForm ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-gray-900">Choose Delivery Address</h4>
                      <button
                        onClick={() => setShowNewAddressForm(true)}
                        className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
                      >
                        <PlusIcon className="h-4 w-4" />
                        <span>Add New Address</span>
                      </button>
                    </div>
                    
                    <div className="grid gap-3">
                      {savedAddresses.map((address) => (
                        <div
                          key={address.id}
                          className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${
                            selectedAddress?.id === address.id
                              ? 'border-purple-500 bg-purple-50'
                              : 'border-gray-200 hover:border-purple-300'
                          }`}
                          onClick={() => handleAddressSelect(address)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-2">
                                <h5 className="font-semibold">{address.receiverName}</h5>
                                {address.isDefault && (
                                  <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                                    Default
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-gray-600">{address.location}</p>
                              <p className="text-sm text-gray-500">{address.phoneNumber}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 border-t pt-6">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-gray-900">Create New Address</h4>
                      {savedAddresses.length > 0 && (
                        <button
                          onClick={() => setShowNewAddressForm(false)}
                          className="text-gray-500 hover:text-gray-700"
                        >
                          <XMarkIcon className="h-5 w-5" />
                        </button>
                      )}
                    </div>

                                         <div className="space-y-4">
                       <div className="group">
                         <label className="block text-sm font-semibold text-gray-700 mb-2">
                           Receiver Name *
                         </label>
                         <div className="relative">
                           <UserIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                           <input
                             type="text"
                             value={shippingForm.receiverName}
                             onChange={(e) => handleFormChange('receiverName', e.target.value)}
                             placeholder="Full name"
                             className={`w-full pl-12 pr-4 py-4 border-2 rounded-xl focus:ring-4 focus:ring-purple-100 focus:border-purple-400 transition-all ${
                               formErrors.receiverName ? 'border-red-300' : 'border-gray-200'
                             }`}
                           />
                         </div>
                         {formErrors.receiverName && (
                           <p className="text-red-500 text-sm mt-1">{formErrors.receiverName}</p>
                         )}
                       </div>

                       <div className="group">
                         <label className="block text-sm font-semibold text-gray-700 mb-2">
                           Detailed Address *
                         </label>
                         <div className="relative">
                           <MapPinIcon className="absolute left-4 top-4 h-5 w-5 text-gray-400" />
                           <textarea
                             value={shippingForm.location}
                             onChange={(e) => handleFormChange('location', e.target.value)}
                             placeholder="Street address, building, floor, room number..."
                             rows={3}
                             className={`w-full pl-12 pr-4 py-4 border-2 rounded-xl focus:ring-4 focus:ring-purple-100 focus:border-purple-400 transition-all resize-none ${
                               formErrors.location ? 'border-red-300' : 'border-gray-200'
                             }`}
                           />
                         </div>
                         {formErrors.location && (
                           <p className="text-red-500 text-sm mt-1">{formErrors.location}</p>
                         )}
                       </div>

                       {/* Save Address Option */}
                       <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                         <div className="flex items-center space-x-3">
                           <input
                             type="checkbox"
                             id="saveAddress"
                             defaultChecked={true}
                             className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                           />
                           <label htmlFor="saveAddress" className="text-sm font-medium text-blue-900">
                             Save this address as default for future orders
                           </label>
                         </div>
                         <p className="text-xs text-blue-700 mt-2">
                           💡 This address will be automatically selected for your next orders
                         </p>
                       </div>
                     </div>
                  </div>
                )}
              </motion.div>
            )}

            {currentStep === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="text-center mb-6">
                  <CheckCircleIcon className="h-12 w-12 text-purple-600 mx-auto mb-3" />
                  <h3 className="text-xl font-semibold text-gray-900">Review & Confirm</h3>
                  <p className="text-gray-600 mt-1">Please review your order details</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Order Summary */}
                  <div className="space-y-4">
                    <h4 className="font-semibold text-gray-900">Order Summary</h4>
                    <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                      <div className="flex items-center space-x-3">
                        <img 
                          src={product?.images?.[0]} 
                          alt={product?.name}
                          className="w-16 h-16 object-cover rounded-lg"
                        />
                        <div className="flex-1">
                          <h5 className="font-semibold text-gray-900">{product?.name}</h5>
                          <p className="text-sm text-gray-600">{product?.price?.toLocaleString()} RWF</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Delivery Details */}
                  <div className="space-y-4">
                    <h4 className="font-semibold text-gray-900">Delivery Details</h4>
                    <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                      <div>
                        <p className="text-sm text-gray-600">Receiver</p>
                        <p className="font-semibold">{shippingForm.receiverName}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Phone</p>
                        <p className="font-semibold">{shippingForm.phoneNumber}</p>
                      </div>
                                             <div>
                         <p className="text-sm text-gray-600">Address</p>
                         <p className="font-semibold">{shippingForm.location}</p>
                       </div>
                    </div>
                  </div>
                </div>

                {/* Security Notice */}
                <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                  <div className="flex items-start space-x-3">
                    <ShieldCheckIcon className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-semibold text-green-900">Secure Checkout</h4>
                      <p className="text-sm text-green-700 mt-1">
                        Your information is protected with bank-level security. We'll never share your details.
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="border-t bg-gray-50 p-6">
          <div className="flex items-center justify-between">
            <button
              onClick={prevStep}
              disabled={currentStep === 1}
              className="flex items-center space-x-2 px-6 py-3 border-2 border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeftIcon className="h-4 w-4" />
              <span>Previous</span>
            </button>

            <div className="flex items-center space-x-3">
              {currentStep < steps.length ? (
                <button
                  onClick={nextStep}
                  className="flex items-center space-x-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all"
                >
                  <span>Next</span>
                  <ChevronRightIcon className="h-4 w-4" />
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="flex items-center space-x-2 px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <span>{actionType === 'cart' ? 'Add to Cart' : 'Buy Now'}</span>
                      <span className="font-bold">({product?.price?.toLocaleString()} RWF)</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ModernShippingForm; 