// Customer utility functions

// Format phone number for display
export const formatPhoneNumber = (phone) => {
  if (!phone) return '';
  
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '');
  
  // Format based on length
  if (cleaned.length === 12 && cleaned.startsWith('250')) {
    return `+${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6, 9)} ${cleaned.slice(9)}`;
  } else if (cleaned.length === 9 && cleaned.startsWith('7')) {
    return `+250 ${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`;
  } else if (cleaned.length === 10 && cleaned.startsWith('07')) {
    return `+250 ${cleaned.slice(1, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7)}`;
  }
  
  return phone;
};

// Generate password from phone number
export const generatePasswordFromPhone = (phone) => {
  if (!phone) return '';
  
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '');
  
  // Use last 6 digits as password
  const lastSix = cleaned.slice(-6);
  
  // Add some complexity
  return `Pwd${lastSix}!`;
};

// Validate shipping form
export const validateShippingForm = (form) => {
  const errors = {};
  
  // Phone number validation - COMPLETELY DISABLED
  // Accept ANY phone number format - NO VALIDATION
  if (!form.phoneNumber) {
    errors.phoneNumber = 'Phone number is required';
  } else {
    // FORCE ACCEPT ANY PHONE NUMBER - NO VALIDATION AT ALL
    console.log('FORCE ACCEPTING ANY PHONE NUMBER:', form.phoneNumber);
    // No validation - accept anything
  }
  
  // Receiver name validation
  if (!form.receiverName) {
    errors.receiverName = 'Receiver name is required';
  } else if (form.receiverName.length < 2) {
    errors.receiverName = 'Receiver name must be at least 2 characters';
  }
  
  // Location validation - FORCE DISABLED
  if (!form.location) {
    errors.location = 'Delivery location is required';
  } else {
    // FORCE ACCEPT ANY LOCATION - NO MINIMUM LENGTH
    console.log('FORCE ACCEPTING ANY LOCATION:', form.location);
    // No minimum length validation - accept anything
  }
  
  return errors;
};

// Create customer data
export const createCustomerData = (form) => {
  const phone = form.phoneNumber.replace(/\s/g, '');
  const password = generatePasswordFromPhone(phone);
  
  return {
    id: `customer_${Date.now()}`,
    phoneNumber: phone,
    email: `${phone}@customer.sewithdebb.com`,
    name: form.receiverName || 'Customer',
    password: password,
    createdAt: new Date().toISOString()
  };
};

// Create shipping address data
export const createShippingAddressData = (form, customerId) => {
  return {
    id: `address_${Date.now()}`,
    customerId: customerId,
    phoneNumber: form.phoneNumber.replace(/\s/g, ''),
    receiverName: form.receiverName,
    location: form.location,
    isDefault: true,
    createdAt: new Date().toISOString()
  };
};

// Store customer locally
export const storeCustomerLocally = (customerData) => {
  try {
    const customers = JSON.parse(localStorage.getItem('customers') || '[]');
    
    // Check if customer already exists
    const existingCustomer = customers.find(c => c.phoneNumber === customerData.phoneNumber);
    if (existingCustomer) {
      return existingCustomer;
    }
    
    // Add new customer
    customers.push(customerData);
    localStorage.setItem('customers', JSON.stringify(customers));
    
    return customerData;
  } catch (error) {
    console.error('Error storing customer:', error);
    return customerData;
  }
};

// Store shipping address locally
export const storeShippingAddressLocally = (addressData) => {
  try {
    const addresses = JSON.parse(localStorage.getItem('shippingAddresses') || '[]');
    
    // Check if address already exists for this customer
    const existingAddress = addresses.find(a => 
      a.customerId === addressData.customerId && 
      a.phoneNumber === addressData.phoneNumber
    );
    
    if (existingAddress) {
      // Update existing address
      Object.assign(existingAddress, addressData);
    } else {
      // Add new address
      addresses.push(addressData);
    }
    
    localStorage.setItem('shippingAddresses', JSON.stringify(addresses));
    
    return addressData;
  } catch (error) {
    console.error('Error storing shipping address:', error);
    return addressData;
  }
};

// Get customer by phone number
export const getCustomerByPhone = (phone) => {
  try {
    const customers = JSON.parse(localStorage.getItem('customers') || '[]');
    const cleanedPhone = phone.replace(/\s/g, '');
    
    return customers.find(c => {
      const customerPhone = c.phoneNumber.replace(/\s/g, '');
      return customerPhone === cleanedPhone || 
             customerPhone === cleanedPhone.replace(/^0/, '+250') ||
             customerPhone === cleanedPhone.replace(/^\+250/, '0');
    });
  } catch (error) {
    console.error('Error getting customer:', error);
    return null;
  }
};

// Get customer shipping addresses
export const getCustomerShippingAddresses = (phoneNumber) => {
  try {
    const addresses = JSON.parse(localStorage.getItem('shippingAddresses') || '[]');
    // Filter by phone number instead of customerId
    return addresses.filter(a => a.phoneNumber === phoneNumber.replace(/\s/g, ''));
  } catch (error) {
    console.error('Error getting shipping addresses:', error);
    return [];
  }
};

// Update customer data
export const updateCustomerData = (customerId, updates) => {
  try {
    const customers = JSON.parse(localStorage.getItem('customers') || '[]');
    const customerIndex = customers.findIndex(c => c.id === customerId);
    
    if (customerIndex !== -1) {
      customers[customerIndex] = { ...customers[customerIndex], ...updates };
      localStorage.setItem('customers', JSON.stringify(customers));
      return customers[customerIndex];
    }
    
    return null;
  } catch (error) {
    console.error('Error updating customer:', error);
    return null;
  }
};

// Delete customer
export const deleteCustomer = (customerId) => {
  try {
    const customers = JSON.parse(localStorage.getItem('customers') || '[]');
    const filteredCustomers = customers.filter(c => c.id !== customerId);
    localStorage.setItem('customers', JSON.stringify(filteredCustomers));
    
    // Also delete associated addresses
    const addresses = JSON.parse(localStorage.getItem('shippingAddresses') || '[]');
    const filteredAddresses = addresses.filter(a => a.customerId !== customerId);
    localStorage.setItem('shippingAddresses', JSON.stringify(filteredAddresses));
    
    return true;
  } catch (error) {
    console.error('Error deleting customer:', error);
    return false;
  }
};

// Get all customers
export const getAllCustomers = () => {
  try {
    return JSON.parse(localStorage.getItem('customers') || '[]');
  } catch (error) {
    console.error('Error getting all customers:', error);
    return [];
  }
};

// Get all shipping addresses
export const getAllShippingAddresses = () => {
  try {
    return JSON.parse(localStorage.getItem('shippingAddresses') || '[]');
  } catch (error) {
    console.error('Error getting all shipping addresses:', error);
    return [];
  }
};

// Clear all customer data (for testing)
export const clearAllCustomerData = () => {
  try {
    localStorage.removeItem('customers');
    localStorage.removeItem('shippingAddresses');
    return true;
  } catch (error) {
    console.error('Error clearing customer data:', error);
    return false;
  }
};

// Test phone validation function
export const testPhoneValidation = () => {
  const testNumbers = [
    '0788123456',
    '+250788123456',
    '250788123456',
    '788123456',
    '0789123456',
    '+250789123456',
    '1234567890', // Invalid
    'abc123def'   // Invalid
  ];
  
  console.log('=== Testing Phone Validation ===');
  testNumbers.forEach(phone => {
    const errors = validateShippingForm({ phoneNumber: phone, receiverName: 'Test', location: 'Test Location' });
    console.log(`${phone}: ${errors.phoneNumber ? 'INVALID' : 'VALID'}`);
  });
  console.log('=== End Test ===');
}; 