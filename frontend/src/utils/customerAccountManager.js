// Customer Account Manager - Auto-create accounts based on email
import axios from 'axios';

const sendWelcomeSMS = async (phone, customerName) => {
  try {
    await axios.post('/api/sms/welcome', {
      phone,
      customerName
    });
    console.log('📱 Welcome SMS sent to new customer');
  } catch (error) {
    console.error('Welcome SMS failed (non-blocking):', error);
  }
};

export const CustomerAccountManager = {
  
  // Create or update customer account
  createOrUpdateAccount: (customerInfo, shippingInfo) => {
    const email = customerInfo.email.toLowerCase().trim();
    
    // Get existing customers
    const customers = JSON.parse(localStorage.getItem('customers') || '{}');
    
    // Check if customer exists
    if (customers[email]) {
      // Update existing customer
      customers[email] = {
        ...customers[email],
        firstName: customerInfo.firstName,
        lastName: customerInfo.lastName,
        phoneNumber: customerInfo.phoneNumber,
        lastUpdated: new Date().toISOString(),
        loginCount: (customers[email].loginCount || 0) + 1
      };
      
      // Add new shipping address if different
      const existingAddresses = customers[email].shippingAddresses || [];
      const addressExists = existingAddresses.some(addr => 
        addr.address === shippingInfo.address && 
        addr.city === shippingInfo.city
      );
      
      if (!addressExists) {
        existingAddresses.push({
          ...shippingInfo,
          isDefault: existingAddresses.length === 0,
          addedAt: new Date().toISOString()
        });
        customers[email].shippingAddresses = existingAddresses;
      }
      
      console.log('✅ Customer account updated:', email);
    } else {
      // Create new customer account
      customers[email] = {
        email: email,
        firstName: customerInfo.firstName,
        lastName: customerInfo.lastName,
        phoneNumber: customerInfo.phoneNumber,
        shippingAddresses: [{
          ...shippingInfo,
          isDefault: true,
          addedAt: new Date().toISOString()
        }],
        orders: [],
        preferences: {
          categories: [],
          priceRange: { min: 0, max: 1000000 }
        },
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
        loginCount: 1
      };
      
      console.log('✅ New customer account created:', email);
      
      // Send welcome SMS to new customer
      const fullName = `${customerInfo.firstName} ${customerInfo.lastName}`;
      sendWelcomeSMS(customerInfo.phoneNumber, fullName);
    }
    
    // Save to localStorage
    localStorage.setItem('customers', JSON.stringify(customers));
    localStorage.setItem('currentCustomerEmail', email);
    
    return customers[email];
  },
  
  // Get customer by email
  getCustomerByEmail: (email) => {
    if (!email) return null;
    
    const customers = JSON.parse(localStorage.getItem('customers') || '{}');
    const customer = customers[email.toLowerCase().trim()];
    
    if (customer) {
      console.log('✅ Customer found:', email);
      return customer;
    }
    
    console.log('ℹ️ No customer found for:', email);
    return null;
  },
  
  // Add order to customer history
  addOrderToCustomer: (email, orderData) => {
    try {
      const customers = JSON.parse(localStorage.getItem('customers') || '{}');
      const customerEmail = email.toLowerCase().trim();
      
      if (customers[customerEmail]) {
        if (!customers[customerEmail].orders) {
          customers[customerEmail].orders = [];
        }
        
        // Store minimal order data to avoid quota issues
        const minimalOrder = {
          orderId: orderData.id,
          orderNumber: orderData.orderNumber,
          total: orderData.total,
          itemCount: orderData.items?.length || 0,
          status: orderData.status,
          createdAt: orderData.createdAt
        };
        
        customers[customerEmail].orders.push(minimalOrder);
        
        // Keep only last 10 orders to prevent quota issues
        if (customers[customerEmail].orders.length > 10) {
          customers[customerEmail].orders = customers[customerEmail].orders.slice(-10);
        }
        
        // Update preferences based on order
        updateCustomerPreferences(customers[customerEmail], orderData);
        
        // Save with error handling
        try {
          localStorage.setItem('customers', JSON.stringify(customers));
          console.log('✅ Order added to customer history:', email);
        } catch (quotaError) {
          // If quota exceeded, keep only essential customer data
          if (quotaError.name === 'QuotaExceededError') {
            console.warn('⚠️ Storage quota exceeded, cleaning up...');
            const essentialCustomer = {
              email: customers[customerEmail].email,
              firstName: customers[customerEmail].firstName,
              lastName: customers[customerEmail].lastName,
              phoneNumber: customers[customerEmail].phoneNumber,
              shippingAddresses: customers[customerEmail].shippingAddresses?.slice(0, 2) || [],
              orders: [minimalOrder],
              createdAt: customers[customerEmail].createdAt,
              lastUpdated: new Date().toISOString()
            };
            customers[customerEmail] = essentialCustomer;
            localStorage.setItem('customers', JSON.stringify(customers));
          }
        }
      }
    } catch (error) {
      console.error('Error adding order to customer:', error);
    }
  },
  
  // Get customer orders
  getCustomerOrders: (email) => {
    const customer = CustomerAccountManager.getCustomerByEmail(email);
    return customer?.orders || [];
  },
  
  // Get default shipping address
  getDefaultShippingAddress: (email) => {
    const customer = CustomerAccountManager.getCustomerByEmail(email);
    if (!customer || !customer.shippingAddresses) return null;
    
    const defaultAddress = customer.shippingAddresses.find(addr => addr.isDefault);
    return defaultAddress || customer.shippingAddresses[0];
  },
  
  // Get all shipping addresses
  getAllShippingAddresses: (email) => {
    const customer = CustomerAccountManager.getCustomerByEmail(email);
    return customer?.shippingAddresses || [];
  },
  
  // Set default shipping address
  setDefaultAddress: (email, addressIndex) => {
    const customers = JSON.parse(localStorage.getItem('customers') || '{}');
    const customerEmail = email.toLowerCase().trim();
    
    if (customers[customerEmail] && customers[customerEmail].shippingAddresses) {
      customers[customerEmail].shippingAddresses.forEach((addr, index) => {
        addr.isDefault = index === addressIndex;
      });
      
      localStorage.setItem('customers', JSON.stringify(customers));
      console.log('✅ Default address updated');
    }
  },
  
  // Get customer recommendations based on order history
  getRecommendations: (email) => {
    const customer = CustomerAccountManager.getCustomerByEmail(email);
    if (!customer || !customer.orders || customer.orders.length === 0) {
      return { categories: [], priceRange: { min: 0, max: 100000 } };
    }
    
    return customer.preferences || { categories: [], priceRange: { min: 0, max: 100000 } };
  }
};

// Helper function to update customer preferences
function updateCustomerPreferences(customer, orderData) {
  if (!customer.preferences) {
    customer.preferences = {
      categories: [],
      priceRange: { min: 0, max: 1000000 }
    };
  }
  
  // Extract categories from order items
  orderData.items.forEach(item => {
    if (item.category && !customer.preferences.categories.includes(item.category)) {
      customer.preferences.categories.push(item.category);
    }
  });
  
  // Update price range preferences
  const orderTotal = orderData.total;
  if (!customer.preferences.priceRange.min || orderTotal < customer.preferences.priceRange.min) {
    customer.preferences.priceRange.min = Math.floor(orderTotal * 0.5);
  }
  if (!customer.preferences.priceRange.max || orderTotal > customer.preferences.priceRange.max) {
    customer.preferences.priceRange.max = Math.ceil(orderTotal * 1.5);
  }
}

export default CustomerAccountManager;
