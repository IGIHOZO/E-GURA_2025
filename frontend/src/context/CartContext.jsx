import React, { createContext, useContext, useReducer, useEffect } from 'react';

const CartContext = createContext();

const cartReducer = (state, action) => {
  switch (action.type) {
    case 'ADD_TO_CART':
      // Check if an item with the same id, size, and color already exists
      const existingItemIndex = state.items.findIndex(item => 
        item.id === action.payload.id && 
        item.size === action.payload.size && 
        item.color === action.payload.color
      );
      
      if (existingItemIndex !== -1) {
        // Update existing item quantity
        const updatedItems = state.items.map((item, index) => 
          index === existingItemIndex 
            ? { ...item, quantity: item.quantity + action.payload.quantity }
            : item
        );
        return {
          ...state,
          items: updatedItems
        };
      } else {
        // Add new item
        return {
          ...state,
          items: [...state.items, action.payload]
        };
      }

    case 'REMOVE_FROM_CART':
      return {
        ...state,
        items: state.items.filter(item => 
          !(item.id === action.payload.id && 
            item.size === action.payload.size && 
            item.color === action.payload.color)
        )
      };

    case 'UPDATE_QUANTITY':
      return {
        ...state,
        items: state.items.map(item =>
          item.id === action.payload.id && 
          item.size === action.payload.size && 
          item.color === action.payload.color
            ? { ...item, quantity: action.payload.quantity }
            : item
        )
      };

    case 'CLEAR_CART':
      return {
        ...state,
        items: []
      };

    case 'SET_CART':
      return {
        ...state,
        items: Array.isArray(action.payload) ? action.payload : []
      };

    default:
      return state;
  }
};

export const CartProvider = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, {
    items: [],
    isOpen: false
  });

  // Load cart from localStorage on mount
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem('cart');
      if (savedCart) {
        const parsedCart = JSON.parse(savedCart);
        // Validate cart data
        if (Array.isArray(parsedCart)) {
          dispatch({ type: 'SET_CART', payload: parsedCart });
        }
      }
    } catch (error) {
      console.error('Error loading cart from localStorage:', error);
      // Clear corrupted cart data
      localStorage.removeItem('cart');
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    try {
      // Only save essential cart data to avoid quota issues
      const lightCart = state.items.map(item => ({
        id: item.id,
        _id: item._id,
        name: item.name,
        price: item.price,
        mainImage: item.mainImage,
        size: item.size,
        color: item.color,
        quantity: item.quantity
      }));
      localStorage.setItem('cart', JSON.stringify(lightCart));
    } catch (error) {
      console.error('Error saving cart to localStorage:', error);
      // If quota exceeded, clear old cart and try again with just IDs
      if (error.name === 'QuotaExceededError') {
        try {
          localStorage.removeItem('cart');
          const minimalCart = state.items.map(item => ({
            id: item.id,
            quantity: item.quantity,
            size: item.size,
            color: item.color
          }));
          localStorage.setItem('cart', JSON.stringify(minimalCart));
        } catch (e) {
          console.error('Failed to save minimal cart:', e);
        }
      }
    }
  }, [state.items]);

  const addToCart = (product, size = 'M', color = 'Default', quantity = 1, shippingInfo = null) => {
    console.log('Adding to cart:', product.name);
    
    const cartItem = {
      id: product.id || product._id, // Prefer id for PostgreSQL
      _id: product.id || product._id,
      name: product.name,
      price: product.price,
      originalPrice: product.originalPrice,
      mainImage: product.mainImage || product.image,
      image: product.mainImage || product.image,
      category: product.category,
      size,
      selectedSize: size,
      color,
      selectedColor: color,
      quantity,
      stockQuantity: product.stockQuantity,
      shippingInfo
    };
    
    // Dispatch the action
    dispatch({ type: 'ADD_TO_CART', payload: cartItem });
  };

  const removeFromCart = (productId, size, color) => {
    dispatch({ 
      type: 'REMOVE_FROM_CART', 
      payload: { id: productId, size, color } 
    });
  };

  const updateQuantity = (productId, size, color, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productId, size, color);
    } else {
      dispatch({ 
        type: 'UPDATE_QUANTITY', 
        payload: { id: productId, size, color, quantity } 
      });
    }
  };

  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' });
  };

  const getCartTotal = () => {
    return state.items.reduce((total, item) => {
      return total + (item.price * item.quantity);
    }, 0);
  };

  const getCartCount = () => {
    return state.items.reduce((count, item) => count + item.quantity, 0);
  };

  const debugCart = () => {
    console.log('=== CART DEBUG ===');
    console.log('Cart items:', state.items);
    console.log('Cart count:', getCartCount());
    console.log('Cart total:', getCartTotal());
    console.log('localStorage cart:', localStorage.getItem('cart'));
  };

  const value = {
    items: state.items,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getCartTotal,
    getCartCount,
    debugCart
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}; 