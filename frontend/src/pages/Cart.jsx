import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SEO from '../components/SEO';
import { 
  TrashIcon, 
  PlusIcon, 
  MinusIcon,
  ShoppingBagIcon,
  TagIcon
} from '@heroicons/react/24/outline';
import { useCart } from '../context/CartContext';
import CouponInput from '../components/CouponInput';
import useResponsive from '../hooks/useResponsive';
import CartAddons from '../components/CartAddons';

const Cart = () => {
  const navigate = useNavigate();
  const { items, removeFromCart, updateQuantity, getCartTotal, clearCart, addToCart } = useCart();
  const { isMobile, isTablet, isSmallMobile } = useResponsive();
  const [refreshKey, setRefreshKey] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [freeShipping, setFreeShipping] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState(null);

  const subtotal = getCartTotal();
  // Shipping will be calculated at checkout, not in cart
  const total = subtotal - discount;

  // Monitor cart state changes
  useEffect(() => {
    console.log('Cart items changed:', items);
    console.log('Cart items length:', items?.length);
  }, [items]);

  const handleCouponApplied = (coupon) => {
    if (coupon) {
      setDiscount(coupon.discount || 0);
      setFreeShipping(coupon.freeShipping || false);
      setAppliedCoupon(coupon);
    } else {
      setDiscount(0);
      setFreeShipping(false);
      setAppliedCoupon(null);
    }
  };

  const handleQuantityChange = (item, newQuantity) => {
    console.log('Changing quantity for item:', item, 'to:', newQuantity);
    if (newQuantity <= 0) {
      removeFromCart(item.id, item.size, item.color);
    } else {
      updateQuantity(item.id, item.size, item.color, newQuantity);
    }
  };


  if (!items || items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <ShoppingBagIcon className="h-12 w-12 sm:h-16 sm:w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-2">Your cart is empty</h2>
          <p className="text-sm sm:text-base text-gray-600 mb-6">Add some products to your cart to continue with checkout.</p>
          <button
            onClick={() => navigate('/shop')}
            className="bg-orange-500 text-white px-6 py-3 sm:px-8 sm:py-4 rounded-lg hover:bg-orange-600 transition-colors text-sm sm:text-base min-h-[48px] w-full sm:w-auto"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <SEO
        title="Shopping Cart - E-Gura Store | Kigali, Rwanda"
        description="Review your shopping cart at E-Gura Store. Secure checkout with MTN MoMo and Airtel Money. Free delivery in Kigali, Rwanda."
        keywords="shopping cart, E-Gura store, checkout, online shopping Rwanda, mobile money, Kigali delivery, secure payment"
        canonicalUrl="https://egura.rw/cart"
        ogImage="https://egura.rw/og-image.jpg"
      />
      <div className="min-h-screen bg-gray-50 pb-20 sm:pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 gap-2 sm:gap-0">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Shopping Cart ({items.length} {isMobile ? '' : 'items'})</h1>
            {!isMobile && (
              <button
                onClick={() => navigate('/shop')}
                className="text-sm text-orange-600 hover:text-orange-700 font-medium"
              >
                Continue Shopping
              </button>
            )}
          </div>
          
          <div className="space-y-3 sm:space-y-4">
            {items.map((item, index) => (
              <div key={`${item.id}-${item.size}-${item.color}-${refreshKey}`} className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-gray-50 rounded-lg border border-gray-100">
                {/* Image and Content */}
                <div className="flex items-start sm:items-center gap-3 sm:gap-4 flex-1">
                  <div className="flex-shrink-0">
                    <img
                      src={item.mainImage || item.image}
                      alt={item.name}
                      className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-lg shadow-sm"
                    />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 text-sm sm:text-base leading-tight line-clamp-2">{item.name}</h3>
                    <p className="text-xs sm:text-sm text-gray-500 mt-1">
                      {item.size && `Size: ${item.size}`}
                      {item.size && item.color && ' | '}
                      {item.color && `Color: ${item.color}`}
                      {!item.size && !item.color && 'Default'}
                    </p>
                    <p className="text-base sm:text-lg font-bold text-orange-600 mt-2">
                      RWF {(item.price * item.quantity).toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Quantity Controls and Delete - Horizontal on mobile */}
                <div className="flex items-center justify-between sm:justify-end gap-4 sm:gap-3">
                  {/* Quantity Controls */}
                  <div className="flex items-center gap-2 sm:gap-3 bg-white rounded-lg border border-gray-200 p-1">
                    <button
                      onClick={() => handleQuantityChange(item, item.quantity - 1)}
                      className="p-2 sm:p-2.5 rounded-md hover:bg-gray-100 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center active:scale-95"
                      disabled={item.quantity <= 1}
                    >
                      <MinusIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                    <span className="w-8 sm:w-10 text-center font-semibold text-sm sm:text-base">{item.quantity}</span>
                    <button
                      onClick={() => handleQuantityChange(item, item.quantity + 1)}
                      className="p-2 sm:p-2.5 rounded-md hover:bg-gray-100 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center active:scale-95"
                    >
                      <PlusIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                  </div>

                  {/* Delete Button */}
                  <button
                    onClick={() => removeFromCart(item.id, item.size, item.color)}
                    className="p-2.5 sm:p-3 text-red-500 hover:bg-red-50 rounded-lg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center active:scale-95"
                  >
                    <TrashIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Intelligent Add-On Suggestions */}
          <div className="mt-6">
            <CartAddons
              cartItems={items}
              onAddToCart={(product) => {
                // Add the recommended product to cart
                const cartItem = {
                  id: product.id,
                  name: product.name,
                  price: product.price,
                  mainImage: product.mainImage,
                  category: product.category,
                  quantity: 1,
                  size: product.sizes?.[0] || 'Default',
                  color: product.colors?.[0] || 'Default'
                };
                addToCart(cartItem);
              }}
            />
          </div>

          <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-gray-200">
            {/* Coupon Section */}
            <div className="mb-4 sm:mb-6">
              <div className="flex items-center space-x-2 mb-3">
                <TagIcon className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600" />
                <h3 className="font-semibold text-gray-900 text-sm sm:text-base">Have a Coupon?</h3>
              </div>
              <CouponInput 
                orderTotal={subtotal}
                onCouponApplied={handleCouponApplied}
              />
            </div>

            {/* Order Summary */}
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-4 sm:p-5 space-y-3">
              <div className="flex justify-between text-sm sm:text-base">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-semibold">RWF {subtotal.toLocaleString()}</span>
              </div>
              
              {discount > 0 && (
                <div className="flex justify-between text-sm sm:text-base">
                  <span className="text-green-600">Discount ({appliedCoupon?.code})</span>
                  <span className="font-semibold text-green-600">-RWF {discount.toLocaleString()}</span>
                </div>
              )}
              
              <div className="pt-3 border-t border-gray-300 mt-2">
                <div className="text-xs sm:text-sm text-gray-500 text-center mb-3">
                  Shipping fees will be calculated at checkout
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-base sm:text-lg font-bold text-gray-900">Total</span>
                  <span className="text-xl sm:text-2xl font-bold text-orange-600">RWF {total.toLocaleString()}</span>
                </div>
              </div>
            </div>
            
            {/* Action Buttons - Stack on mobile */}
            <div className="mt-4 sm:mt-6 flex flex-col-reverse sm:flex-row gap-3 sm:gap-4">
              <button
                onClick={() => navigate('/shop')}
                className="flex-1 px-6 py-3 sm:py-4 border-2 border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium text-sm sm:text-base min-h-[48px] active:scale-98"
              >
                Continue Shopping
              </button>
              <button
                onClick={() => navigate('/checkout')}
                className="flex-1 px-6 py-4 sm:py-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all font-bold text-sm sm:text-base min-h-[48px] shadow-lg hover:shadow-xl active:scale-98"
              >
                Proceed to Checkout →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
};

export default Cart; 