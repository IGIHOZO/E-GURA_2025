import React, { createContext, useContext, useState, useEffect } from 'react';
import { getCustomerByPhone, formatPhoneNumber, generatePasswordFromPhone } from '../utils/customerUtils';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // Check for existing session on mount
  useEffect(() => {
    // Check multiple sources for user data
    const savedUser = localStorage.getItem('user') || localStorage.getItem('currentUser');
    const userId = localStorage.getItem('userId');
    const userPhone = localStorage.getItem('userPhone');
    
    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        setUser(userData);
        setIsAuthenticated(true);
        console.log('✅ User loaded from localStorage:', userData);
      } catch (error) {
        console.error('Error parsing saved user:', error);
      }
    } else if (userId && userPhone) {
      // User is logged in but no user object, try to reconstruct
      console.log('✅ User session found (userId + phone)');
      setIsAuthenticated(true);
    }
    setLoading(false);
  }, []);

  const login = async (phoneNumberOrUserData, password) => {
    try {
      setLoading(true);
      
      // Check if first parameter is a user object (from SMS login)
      if (typeof phoneNumberOrUserData === 'object') {
        const userData = phoneNumberOrUserData;
        setUser(userData);
        setIsAuthenticated(true);
        // Save to both locations for compatibility
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('currentUser', JSON.stringify(userData));
        localStorage.setItem('userId', userData.id);
        localStorage.setItem('userPhone', userData.phone);
        console.log('✅ User logged in (direct):', userData);
        return { success: true, user: userData };
      }
      
      // Original phone/password login
      const phoneNumber = phoneNumberOrUserData;
      
      // Find customer by phone number
      const customer = getCustomerByPhone(phoneNumber);
      
      if (!customer) {
        throw new Error('Customer not found. Please add items to cart first to create an account.');
      }

      // Check password - use the same logic as customer creation
      const formattedPhone = formatPhoneNumber(phoneNumber);
      const expectedPassword = generatePasswordFromPhone(formattedPhone);
      
      if (password !== expectedPassword) {
        throw new Error(`Invalid password. Expected: ${expectedPassword}. Please use the password shown when you added items to cart.`);
      }

      // Set user and save to localStorage
      setUser(customer);
      setIsAuthenticated(true);
      // Save to both locations for compatibility
      localStorage.setItem('user', JSON.stringify(customer));
      localStorage.setItem('currentUser', JSON.stringify(customer));
      localStorage.setItem('userId', customer.id);
      localStorage.setItem('userPhone', customer.phone);
      
      return { success: true, user: customer };
      
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    // Clear all auth-related localStorage items
    localStorage.removeItem('currentUser');
    localStorage.removeItem('user');
    localStorage.removeItem('userId');
    localStorage.removeItem('userPhone');
    localStorage.removeItem('token');
    console.log('✅ User logged out - all auth data cleared');
    // Redirect to home
    window.location.href = '/';
  };

  const getCurrentUser = () => {
    return user;
  };

  const value = {
    user,
    isAuthenticated,
    loading,
    login,
    logout,
    getCurrentUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 