import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const WishlistContext = createContext();

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within WishlistProvider');
  }
  return context;
};

export const WishlistProvider = ({ children }) => {
  const [wishlist, setWishlist] = useState(() => {
    // Initialize from localStorage
    try {
      const stored = localStorage.getItem('wishlist');
      if (stored) {
        const parsed = JSON.parse(stored);
        return Array.isArray(parsed) ? parsed : [];
      }
    } catch (error) {
      console.error('Error loading initial wishlist:', error);
    }
    return [];
  });

  // Save wishlist to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('wishlist', JSON.stringify(wishlist));
  }, [wishlist]);

  const loadWishlist = useCallback(() => {
    try {
      const stored = localStorage.getItem('wishlist');
      if (stored) {
        const parsed = JSON.parse(stored);
        setWishlist(Array.isArray(parsed) ? parsed : []);
      } else {
        setWishlist([]);
      }
    } catch (error) {
      console.error('Error loading wishlist:', error);
      setWishlist([]);
    }
  }, []);

  const addToWishlist = (product) => {
    const exists = wishlist.find(item => item._id === product._id || item.id === product.id);
    if (!exists) {
      const wishlistItem = {
        _id: product._id || product.id,
        id: product.id || product._id,
        name: product.name,
        price: product.price,
        image: product.mainImage || product.image,
        category: product.category,
        brand: product.brand
      };
      setWishlist(prev => [...prev, wishlistItem]);
      return true;
    }
    return false;
  };

  const removeFromWishlist = (productId) => {
    setWishlist(prev => prev.filter(item => 
      item._id !== productId && item.id !== productId
    ));
  };

  const isInWishlist = (productId) => {
    return wishlist.some(item => item._id === productId || item.id === productId);
  };

  const toggleWishlist = (product) => {
    if (isInWishlist(product._id || product.id)) {
      removeFromWishlist(product._id || product.id);
      return false;
    } else {
      addToWishlist(product);
      return true;
    }
  };

  const clearWishlist = () => {
    setWishlist([]);
    localStorage.removeItem('wishlist');
  };

  const getWishlistCount = () => {
    return wishlist.length;
  };

  return (
    <WishlistContext.Provider
      value={{
        wishlist,
        addToWishlist,
        removeFromWishlist,
        isInWishlist,
        toggleWishlist,
        clearWishlist,
        getWishlistCount,
        loadWishlist
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
};

export default WishlistContext;
