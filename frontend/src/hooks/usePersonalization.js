import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

/**
 * Hook for personalized product recommendations
 */
export const usePersonalization = () => {
  const [deviceId, setDeviceId] = useState('');
  const [personalizedProducts, setPersonalizedProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  // Get or create device ID
  useEffect(() => {
    let id = localStorage.getItem('deviceId');
    if (!id) {
      id = 'device-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('deviceId', id);
    }
    setDeviceId(id);
  }, []);

  // Track product view
  const trackView = useCallback(async (productData) => {
    if (!deviceId || !productData) return;

    try {
      await axios.post('/api/personalization/track/view', {
        userId: deviceId,
        productData: {
          id: productData.id || productData._id,
          name: productData.name,
          category: productData.category,
          brand: productData.brand,
          price: productData.price,
          tags: productData.tags || []
        }
      });
    } catch (error) {
      console.error('Error tracking view:', error);
    }
  }, [deviceId]);

  // Track search
  const trackSearch = useCallback(async (query) => {
    if (!deviceId || !query) return;

    try {
      await axios.post('/api/personalization/track/search', {
        userId: deviceId,
        query
      });
    } catch (error) {
      console.error('Error tracking search:', error);
    }
  }, [deviceId]);

  // Get personalized recommendations
  const getRecommendations = useCallback(async (limit = 12) => {
    if (!deviceId) return [];

    setLoading(true);
    try {
      const response = await axios.get('/api/personalization/recommendations', {
        params: { userId: deviceId, limit }
      });

      if (response.data.success) {
        setPersonalizedProducts(response.data.data);
        return response.data.data;
      }
      return [];
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      return [];
    } finally {
      setLoading(false);
    }
  }, [deviceId]);

  // Get similar products
  const getSimilarProducts = useCallback(async (productId, limit = 6) => {
    if (!productId) return [];

    try {
      const response = await axios.get(`/api/personalization/similar/${productId}`, {
        params: { userId: deviceId || 'guest', limit }
      });

      if (response.data.success) {
        return response.data.data;
      }
      return [];
    } catch (error) {
      console.error('Error fetching similar products:', error);
      return [];
    }
  }, [deviceId]);

  return {
    deviceId,
    personalizedProducts,
    loading,
    trackView,
    trackSearch,
    getRecommendations,
    getSimilarProducts
  };
};

export default usePersonalization;
