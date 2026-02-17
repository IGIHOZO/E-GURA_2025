/**
 * Guest Checkout & One-Click Checkout Service
 * Frictionless checkout with guest support
 */

class CheckoutService {
  constructor() {
    this.guestCheckouts = new Map(); // In-memory for demo (use Redis in production)
    this.oneClickProfiles = new Map();
  }

  /**
   * Create guest checkout session
   */
  createGuestCheckout(cartItems, guestInfo) {
    const checkoutId = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const checkout = {
      id: checkoutId,
      type: 'guest',
      email: guestInfo.email,
      phone: guestInfo.phone,
      items: cartItems,
      subtotal: this.calculateSubtotal(cartItems),
      shippingAddress: guestInfo.shippingAddress || null,
      billingAddress: guestInfo.billingAddress || null,
      status: 'initiated',
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 30 * 60 * 1000) // 30 minutes
    };

    this.guestCheckouts.set(checkoutId, checkout);
    
    console.log('✅ Guest checkout created:', checkoutId);
    return checkout;
  }

  /**
   * Save one-click profile for future purchases
   */
  saveOneClickProfile(userId, profileData) {
    const profile = {
      userId,
      paymentMethod: profileData.paymentMethod, // Tokenized
      shippingAddress: profileData.shippingAddress,
      billingAddress: profileData.billingAddress,
      phone: profileData.phone,
      savedAt: new Date()
    };

    this.oneClickProfiles.set(userId, profile);
    console.log('💾 One-click profile saved for user:', userId);
    return profile;
  }

  /**
   * One-click checkout (registered users)
   */
  async oneClickCheckout(userId, cartItems) {
    const profile = this.oneClickProfiles.get(userId);
    
    if (!profile) {
      throw new Error('No one-click profile found. Please complete checkout once.');
    }

    const order = {
      orderId: `ORDER_${Date.now()}`,
      userId,
      items: cartItems,
      subtotal: this.calculateSubtotal(cartItems),
      shippingAddress: profile.shippingAddress,
      billingAddress: profile.billingAddress,
      paymentMethod: profile.paymentMethod,
      status: 'processing',
      createdAt: new Date()
    };

    console.log('⚡ One-click checkout completed:', order.orderId);
    return order;
  }

  /**
   * Calculate cart subtotal
   */
  calculateSubtotal(items) {
    return items.reduce((total, item) => {
      return total + (item.price * item.quantity);
    }, 0);
  }

  /**
   * Apply discount/coupon
   */
  applyDiscount(subtotal, couponCode) {
    // Will integrate with promotions engine
    const discounts = {
      'WELCOME10': { type: 'percentage', value: 10 },
      'SAVE20': { type: 'percentage', value: 20 },
      'FLAT5000': { type: 'fixed', value: 5000 }
    };

    const discount = discounts[couponCode];
    if (!discount) {
      return { subtotal, discount: 0, total: subtotal };
    }

    let discountAmount = 0;
    if (discount.type === 'percentage') {
      discountAmount = (subtotal * discount.value) / 100;
    } else {
      discountAmount = discount.value;
    }

    return {
      subtotal,
      discount: discountAmount,
      total: subtotal - discountAmount,
      couponCode
    };
  }

  /**
   * Calculate shipping cost
   */
  calculateShipping(items, address) {
    const totalWeight = items.reduce((w, item) => w + (item.weight || 1) * item.quantity, 0);
    
    // Simple shipping logic (can be enhanced with real APIs)
    if (address.city === 'Kigali') {
      return totalWeight > 5 ? 2000 : 1000;
    } else {
      return totalWeight > 5 ? 5000 : 3000;
    }
  }

  /**
   * Validate checkout data
   */
  validateCheckout(checkoutData) {
    const errors = [];

    if (!checkoutData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(checkoutData.email)) {
      errors.push('Valid email is required');
    }

    if (!checkoutData.phone || checkoutData.phone.length < 10) {
      errors.push('Valid phone number is required');
    }

    if (!checkoutData.shippingAddress || !checkoutData.shippingAddress.city) {
      errors.push('Shipping address is required');
    }

    if (!checkoutData.items || checkoutData.items.length === 0) {
      errors.push('Cart is empty');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Get checkout by ID
   */
  getCheckout(checkoutId) {
    return this.guestCheckouts.get(checkoutId);
  }

  /**
   * Clean expired checkouts
   */
  cleanExpiredCheckouts() {
    const now = new Date();
    for (const [id, checkout] of this.guestCheckouts.entries()) {
      if (checkout.expiresAt < now) {
        this.guestCheckouts.delete(id);
        console.log('🧹 Expired checkout removed:', id);
      }
    }
  }
}

// Auto-cleanup every 10 minutes
const checkoutService = new CheckoutService();
setInterval(() => {
  checkoutService.cleanExpiredCheckouts();
}, 10 * 60 * 1000);

module.exports = checkoutService;
