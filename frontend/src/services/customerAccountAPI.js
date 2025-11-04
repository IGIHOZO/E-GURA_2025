import axios from 'axios';

const API_URL = '/api/customer-account';

/**
 * Customer Account API Service
 * Handles all customer account operations
 */

/**
 * Get customer overview (stats, info)
 */
export const getCustomerOverview = async (userId, phone) => {
  try {
    const params = {};
    if (userId) params.userId = userId;
    if (phone) params.phone = phone;

    const response = await axios.get(`${API_URL}/overview`, { params });
    return response.data;
  } catch (error) {
    console.error('Error getting customer overview:', error);
    throw error;
  }
};

/**
 * Get customer orders
 */
export const getCustomerOrders = async (userId, phone, status = null, page = 1, limit = 10) => {
  try {
    const params = { page, limit };
    if (userId) params.userId = userId;
    if (phone) params.phone = phone;
    if (status) params.status = status;

    const response = await axios.get(`${API_URL}/orders`, { params });
    return response.data;
  } catch (error) {
    console.error('Error getting customer orders:', error);
    throw error;
  }
};

/**
 * Get customer addresses
 */
export const getCustomerAddresses = async (userId, phone) => {
  try {
    const params = {};
    if (userId) params.userId = userId;
    if (phone) params.phone = phone;

    const response = await axios.get(`${API_URL}/addresses`, { params });
    return response.data;
  } catch (error) {
    console.error('Error getting customer addresses:', error);
    throw error;
  }
};

/**
 * Add new address
 */
export const addCustomerAddress = async (userId, phone, address) => {
  try {
    const response = await axios.post(`${API_URL}/addresses`, {
      userId,
      phone,
      address
    });
    return response.data;
  } catch (error) {
    console.error('Error adding address:', error);
    throw error;
  }
};

/**
 * Update address
 */
export const updateCustomerAddress = async (userId, phone, addressId, address) => {
  try {
    const response = await axios.put(`${API_URL}/addresses/${addressId}`, {
      userId,
      phone,
      address
    });
    return response.data;
  } catch (error) {
    console.error('Error updating address:', error);
    throw error;
  }
};

/**
 * Delete address
 */
export const deleteCustomerAddress = async (userId, phone, addressId) => {
  try {
    const params = {};
    if (userId) params.userId = userId;
    if (phone) params.phone = phone;

    const response = await axios.delete(`${API_URL}/addresses/${addressId}`, { params });
    return response.data;
  } catch (error) {
    console.error('Error deleting address:', error);
    throw error;
  }
};

/**
 * Get personalized recommendations
 */
export const getCustomerRecommendations = async (userId, phone, limit = 10) => {
  try {
    const params = { limit };
    if (userId) params.userId = userId;
    if (phone) params.phone = phone;

    const response = await axios.get(`${API_URL}/recommendations`, { params });
    return response.data;
  } catch (error) {
    console.error('Error getting recommendations:', error);
    throw error;
  }
};

/**
 * Update customer profile
 */
export const updateCustomerProfile = async (userId, phone, updates) => {
  try {
    const response = await axios.put(`${API_URL}/profile`, {
      userId,
      phone,
      updates
    });
    return response.data;
  } catch (error) {
    console.error('Error updating profile:', error);
    throw error;
  }
};
