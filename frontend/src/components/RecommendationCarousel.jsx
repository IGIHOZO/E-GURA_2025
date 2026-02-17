import React, { useState, useEffect } from 'react';
import axios from 'axios';

const RecommendationCarousel = ({ type, productId, category, title }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deviceId, setDeviceId] = useState('');

  useEffect(() => {
    let id = localStorage.getItem('deviceId');
    if (!id) {
      id = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('deviceId', id);
    }
    setDeviceId(id);
  }, []);

  useEffect(() => {
    if (deviceId) {
      fetchRecommendations();
    }
  }, [type, productId, category, deviceId]);

  const fetchRecommendations = async () => {
    setLoading(true);
    try {
      let url = '/api/v2/search';
      
      switch (type) {
        case 'home':
          url += `/reco/home?limit=10&deviceId=${deviceId}`;
          break;
        case 'related':
          url += `/reco/related/${productId}?limit=10`;
          break;
        case 'trending':
          url += `/trending?limit=10${category ? `&category=${category}` : ''}`;
          break;
        default:
          return;
      }

      const response = await axios.get(url);
      if (response.data.success) {
        setProducts(response.data.data);
      }
    } catch (error) {
      console.error('Recommendations error:', error);
    } finally {
      setLoading(false);
    }
  };

  const trackClick = async (productId) => {
    try {
      await axios.post('/api/v2/search/track', {
        eventType: 'click',
        productId,
        deviceId
      });
    } catch (error) {
      console.error('Tracking error:', error);
    }
  };

  if (loading) {
    return (
      <div className="py-8">
        <h2 className="text-2xl font-bold mb-4">{title}</h2>
        <div className="flex gap-4 overflow-x-auto">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="w-64 h-80 bg-gray-200 rounded-lg animate-pulse flex-shrink-0"></div>
          ))}
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return null;
  }

  return (
    <div className="py-8">
      <h2 className="text-2xl font-bold mb-4">{title}</h2>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {products.map((product) => (
          <div
            key={product._id}
            onClick={() => {
              trackClick(product._id);
              window.location.href = `/product/${product._id}`;
            }}
            className="w-64 bg-white rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer flex-shrink-0"
          >
            <img
              src={product.mainImage}
              alt={product.name}
              className="w-full h-48 object-cover rounded-t-lg"
            />
            <div className="p-4">
              <h3 className="font-semibold text-sm mb-2 line-clamp-2">{product.name}</h3>
              <p className="text-lg font-bold text-blue-600">
                {product.price?.toLocaleString()} RWF
              </p>
              {product.averageRating > 0 && (
                <div className="flex items-center mt-2">
                  <span className="text-yellow-500">★</span>
                  <span className="text-sm ml-1">{product.averageRating}</span>
                </div>
              )}
              {product.stockQuantity === 0 && (
                <span className="text-xs text-red-500 mt-2 block">Out of Stock</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecommendationCarousel;
