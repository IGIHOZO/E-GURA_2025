// Enhanced Shipping Utilities
import { validateShippingForm as baseValidateForm } from './customerUtils';

// Delivery options with pricing and timing
export const DELIVERY_OPTIONS = {
  standard: {
    id: 'standard',
    name: 'Standard Delivery',
    description: '2-3 business days',
    price: 0,
    time: '2-3 days',
    icon: '🚚'
  },
  express: {
    id: 'express',
    name: 'Express Delivery',
    description: 'Next business day',
    price: 2000,
    time: '1 day',
    icon: '⚡'
  },
  sameDay: {
    id: 'sameDay',
    name: 'Same Day Delivery',
    description: 'Within 4-6 hours',
    price: 5000,
    time: 'Same day',
    icon: '🚀'
  }
};

// Enhanced phone number validation with multiple formats
export const validatePhoneNumber = (phoneNumber) => {
  if (!phoneNumber) return { isValid: false, error: 'Phone number is required' };
  
  // Remove all non-digit characters
  const cleaned = phoneNumber.replace(/\D/g, '');
  
  // Accept multiple formats
  const validFormats = [
    /^250\d{9}$/, // +250788123456
    /^0\d{9}$/,   // 0788123456
    /^\d{9}$/,    // 788123456
    /^\d{10}$/,   // 0788123456 (with leading 0)
    /^\d{12}$/    // 250788123456
  ];
  
  const isValid = validFormats.some(format => format.test(cleaned));
  
  if (!isValid) {
    return { 
      isValid: false, 
      error: 'Please enter a valid phone number (any format accepted)' 
    };
  }
  
  return { isValid: true, error: null };
};

// Enhanced address validation
export const validateAddress = (address) => {
  const errors = {};
  
  if (!address.receiverName?.trim()) {
    errors.receiverName = 'Receiver name is required';
  } else if (address.receiverName.trim().length < 2) {
    errors.receiverName = 'Receiver name must be at least 2 characters';
  }
  
  if (!address.location?.trim()) {
    errors.location = 'Delivery address is required';
  } else {
    // FORCE ACCEPT ANY LOCATION - NO MINIMUM LENGTH
    console.log('FORCE ACCEPTING ANY LOCATION:', address.location);
    // No minimum length validation - accept anything
  }
  

  
  return errors;
};

// Enhanced shipping form validation
export const validateEnhancedShippingForm = (form) => {
  const errors = {};
  
  // Phone validation
  const phoneValidation = validatePhoneNumber(form.phoneNumber);
  if (!phoneValidation.isValid) {
    errors.phoneNumber = phoneValidation.error;
  }
  
  // Address validation
  const addressErrors = validateAddress(form);
  Object.assign(errors, addressErrors);
  
  return errors;
};

// Format phone number for display
export const formatPhoneForDisplay = (phoneNumber) => {
  if (!phoneNumber) return '';
  
  const cleaned = phoneNumber.replace(/\D/g, '');
  
  if (cleaned.length === 12 && cleaned.startsWith('250')) {
    return `+${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6, 9)} ${cleaned.slice(9)}`;
  } else if (cleaned.length === 9 && cleaned.startsWith('7')) {
    return `+250 ${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`;
  } else if (cleaned.length === 10 && cleaned.startsWith('07')) {
    return `+250 ${cleaned.slice(1, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7)}`;
  }
  
  return phoneNumber;
};

// Calculate delivery cost
export const calculateDeliveryCost = (deliveryOption, subtotal = 0) => {
  const option = DELIVERY_OPTIONS[deliveryOption];
  if (!option) return 0;
  
  // Free delivery for orders over 50,000 RWF with standard delivery
  if (deliveryOption === 'standard' && subtotal >= 50000) {
    return 0;
  }
  
  return option.price;
};

// Calculate total with delivery
export const calculateTotal = (subtotal, deliveryOption) => {
  const deliveryCost = calculateDeliveryCost(deliveryOption, subtotal);
  return subtotal + deliveryCost;
};

// Get delivery time estimate
export const getDeliveryTimeEstimate = (deliveryOption) => {
  const option = DELIVERY_OPTIONS[deliveryOption];
  return option ? option.time : '2-3 days';
};

// Address autocomplete suggestions (mock data for Rwanda)
export const getAddressSuggestions = (query) => {
  const suggestions = [
    'Kigali, Gasabo District',
    'Kigali, Kicukiro District', 
    'Kigali, Nyarugenge District',
    'Huye, Southern Province',
    'Musanze, Northern Province',
    'Rubavu, Western Province',
    'Rusizi, Western Province',
    'Karongi, Western Province',
    'Nyagatare, Eastern Province',
    'Rwamagana, Eastern Province',
    'Kayonza, Eastern Province',
    'Ngoma, Eastern Province',
    'Bugesera, Eastern Province',
    'Gisagara, Southern Province',
    'Nyanza, Southern Province',
    'Nyaruguru, Southern Province',
    'Gicumbi, Northern Province',
    'Burera, Northern Province',
    'Rulindo, Northern Province',
    'Gakenke, Northern Province'
  ];
  
  if (!query) return suggestions.slice(0, 5);
  
  return suggestions
    .filter(suggestion => 
      suggestion.toLowerCase().includes(query.toLowerCase())
    )
    .slice(0, 5);
};

// Validate delivery area
export const validateDeliveryArea = (address) => {
  const supportedAreas = [
    'kigali', 'gasabo', 'kicukiro', 'nyarugenge',
    'huye', 'musanze', 'rubavu', 'rusizi', 'karongi',
    'nyagatare', 'rwamagana', 'kayonza', 'ngoma', 'bugesera'
  ];
  
  const addressLower = address.toLowerCase();
  const isSupported = supportedAreas.some(area => 
    addressLower.includes(area)
  );
  
  return {
    isSupported,
    message: isSupported 
      ? 'Delivery available in this area' 
      : 'Delivery may not be available in this area. Contact us for confirmation.'
  };
};

// Generate delivery tracking number
export const generateTrackingNumber = () => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substr(2, 5);
  return `RW${timestamp}${random}`.toUpperCase();
};

// Calculate delivery date
export const calculateDeliveryDate = (deliveryOption, orderDate = new Date()) => {
  const deliveryDays = {
    standard: 3,
    express: 1,
    sameDay: 0
  };
  
  const days = deliveryDays[deliveryOption] || 3;
  const deliveryDate = new Date(orderDate);
  deliveryDate.setDate(deliveryDate.getDate() + days);
  
  // Skip weekends
  while (deliveryDate.getDay() === 0 || deliveryDate.getDay() === 6) {
    deliveryDate.setDate(deliveryDate.getDate() + 1);
  }
  
  return deliveryDate;
};

// Format delivery date
export const formatDeliveryDate = (date) => {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

// Get delivery status
export const getDeliveryStatus = (status) => {
  const statuses = {
    pending: { label: 'Pending', color: 'yellow', icon: '⏳' },
    confirmed: { label: 'Confirmed', color: 'blue', icon: '✅' },
    processing: { label: 'Processing', color: 'purple', icon: '🔧' },
    shipped: { label: 'Shipped', color: 'indigo', icon: '📦' },
    out_for_delivery: { label: 'Out for Delivery', color: 'orange', icon: '🚚' },
    delivered: { label: 'Delivered', color: 'green', icon: '🎉' },
    failed: { label: 'Delivery Failed', color: 'red', icon: '❌' }
  };
  
  return statuses[status] || statuses.pending;
};

// Enhanced customer data creation
export const createEnhancedCustomerData = (form) => {
  const phone = form.phoneNumber.replace(/\s/g, '');
  const password = `Pwd${phone.slice(-6)}!`;
  
  return {
    id: `customer_${Date.now()}`,
    phoneNumber: phone,
    email: `${phone}@customer.sewithdebb.com`,
    name: form.receiverName,
    password: password,
    createdAt: new Date().toISOString(),
    lastLogin: new Date().toISOString(),
    isActive: true,
    preferences: {
      deliveryOption: 'standard',
      notifications: true
    }
  };
};

// Enhanced shipping address data
export const createEnhancedShippingAddressData = (form, customerId) => {
  const deliveryArea = validateDeliveryArea(form.location);
  
  return {
    id: `address_${Date.now()}`,
    customerId: customerId,
    phoneNumber: form.phoneNumber.replace(/\s/g, ''),
    receiverName: form.receiverName,
    location: form.location,
    additionalInfo: form.additionalInfo || '',
    isDefault: true,
    isDeliverySupported: deliveryArea.isSupported,
    createdAt: new Date().toISOString(),
    lastUsed: new Date().toISOString()
  };
};

// Export the base validation function for backward compatibility
export const validateShippingForm = baseValidateForm; 