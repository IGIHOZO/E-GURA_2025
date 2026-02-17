/**
 * Promotions & Marketing Engine
 * Coupons, discounts, loyalty programs, and dynamic offers
 */

class PromotionsEngine {
  constructor() {
    this.coupons = new Map();
    this.loyaltyPoints = new Map();
    this.referrals = new Map();
    this.bundles = new Map();
    this.flashSales = new Map();
    
    // Initialize some default coupons
    this.initializeDefaultCoupons();
  }

  /**
   * Initialize default coupons
   */
  initializeDefaultCoupons() {
    const defaultCoupons = [
      {
        code: 'WELCOME10',
        type: 'percentage',
        value: 10,
        minPurchase: 0,
        maxDiscount: 50000,
        description: 'Welcome discount for new customers',
        usageLimit: 1000,
        usedCount: 0,
        validFrom: new Date(),
        validUntil: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
        active: true
      },
      {
        code: 'SAVE20',
        type: 'percentage',
        value: 20,
        minPurchase: 100000,
        maxDiscount: 100000,
        description: '20% off on orders above 100,000 RWF',
        usageLimit: 500,
        usedCount: 0,
        validFrom: new Date(),
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        active: true
      },
      {
        code: 'FLAT5000',
        type: 'fixed',
        value: 5000,
        minPurchase: 50000,
        description: 'Flat 5000 RWF off',
        usageLimit: 1000,
        usedCount: 0,
        validFrom: new Date(),
        validUntil: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
        active: true
      },
      {
        code: 'FREESHIP',
        type: 'free_shipping',
        value: 0,
        minPurchase: 30000,
        description: 'Free shipping on orders above 30,000 RWF',
        usageLimit: -1, // Unlimited
        usedCount: 0,
        validFrom: new Date(),
        validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        active: true
      }
    ];

    defaultCoupons.forEach(coupon => {
      this.coupons.set(coupon.code, coupon);
    });

    console.log('✅ Default coupons initialized');
  }

  /**
   * Create new coupon
   */
  createCoupon(couponData) {
    const coupon = {
      code: couponData.code.toUpperCase(),
      type: couponData.type, // percentage, fixed, free_shipping
      value: couponData.value,
      minPurchase: couponData.minPurchase || 0,
      maxDiscount: couponData.maxDiscount || Infinity,
      description: couponData.description,
      usageLimit: couponData.usageLimit || -1, // -1 = unlimited
      usedCount: 0,
      validFrom: new Date(couponData.validFrom || Date.now()),
      validUntil: new Date(couponData.validUntil),
      active: true,
      createdAt: new Date()
    };

    this.coupons.set(coupon.code, coupon);
    console.log('🎟️ Coupon created:', coupon.code);
    return coupon;
  }

  /**
   * Validate and apply coupon
   */
  applyCoupon(code, orderTotal, userId = null) {
    const coupon = this.coupons.get(code.toUpperCase());

    if (!coupon) {
      return {
        valid: false,
        error: 'Invalid coupon code',
        discount: 0
      };
    }

    // Check if active
    if (!coupon.active) {
      return {
        valid: false,
        error: 'This coupon is no longer active',
        discount: 0
      };
    }

    // Check validity period
    const now = new Date();
    if (now < coupon.validFrom || now > coupon.validUntil) {
      return {
        valid: false,
        error: 'This coupon has expired',
        discount: 0
      };
    }

    // Check usage limit
    if (coupon.usageLimit !== -1 && coupon.usedCount >= coupon.usageLimit) {
      return {
        valid: false,
        error: 'This coupon has reached its usage limit',
        discount: 0
      };
    }

    // Check minimum purchase
    if (orderTotal < coupon.minPurchase) {
      return {
        valid: false,
        error: `Minimum purchase of ${coupon.minPurchase.toLocaleString()} RWF required`,
        discount: 0
      };
    }

    // Calculate discount
    let discount = 0;
    if (coupon.type === 'percentage') {
      discount = (orderTotal * coupon.value) / 100;
      discount = Math.min(discount, coupon.maxDiscount || Infinity);
    } else if (coupon.type === 'fixed') {
      discount = coupon.value;
    } else if (coupon.type === 'free_shipping') {
      // Shipping discount will be applied separately
      discount = 0;
    }

    return {
      valid: true,
      code: coupon.code,
      type: coupon.type,
      discount: Math.round(discount),
      description: coupon.description,
      freeShipping: coupon.type === 'free_shipping'
    };
  }

  /**
   * Mark coupon as used
   */
  useCoupon(code, userId) {
    const coupon = this.coupons.get(code.toUpperCase());
    if (coupon) {
      coupon.usedCount++;
      this.coupons.set(code, coupon);
      console.log(`✅ Coupon used: ${code} (${coupon.usedCount}/${coupon.usageLimit})`);
    }
  }

  /**
   * Loyalty Points System
   */
  addLoyaltyPoints(userId, points, reason) {
    const userPoints = this.loyaltyPoints.get(userId) || {
      total: 0,
      available: 0,
      history: []
    };

    userPoints.total += points;
    userPoints.available += points;
    userPoints.history.push({
      points,
      reason,
      timestamp: new Date(),
      type: 'earned'
    });

    this.loyaltyPoints.set(userId, userPoints);
    console.log(`⭐ ${points} loyalty points added to ${userId}`);
    return userPoints;
  }

  /**
   * Redeem loyalty points
   */
  redeemLoyaltyPoints(userId, points) {
    const userPoints = this.loyaltyPoints.get(userId);
    
    if (!userPoints || userPoints.available < points) {
      return {
        success: false,
        error: 'Insufficient loyalty points'
      };
    }

    // Convert points to discount (100 points = 1000 RWF)
    const discount = points * 10;

    userPoints.available -= points;
    userPoints.history.push({
      points: -points,
      reason: 'Redeemed for discount',
      timestamp: new Date(),
      type: 'redeemed',
      discount
    });

    this.loyaltyPoints.set(userId, userPoints);
    
    return {
      success: true,
      pointsRedeemed: points,
      discount,
      remaining: userPoints.available
    };
  }

  /**
   * Referral Program
   */
  createReferral(userId) {
    const referralCode = `REF${userId.substr(0, 6).toUpperCase()}${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
    
    const referral = {
      code: referralCode,
      userId,
      referrals: [],
      totalRewards: 0,
      createdAt: new Date()
    };

    this.referrals.set(referralCode, referral);
    console.log('🎁 Referral code created:', referralCode);
    return referral;
  }

  /**
   * Apply referral
   */
  applyReferral(referralCode, newUserId) {
    const referral = this.referrals.get(referralCode);
    
    if (!referral) {
      return {
        success: false,
        error: 'Invalid referral code'
      };
    }

    // Reward referrer (10% of first purchase or 5000 RWF bonus)
    const reward = 5000;
    this.addLoyaltyPoints(referral.userId, 500, 'Referral reward');

    // Reward new user (welcome bonus)
    this.addLoyaltyPoints(newUserId, 100, 'Referral welcome bonus');

    referral.referrals.push({
      userId: newUserId,
      reward,
      timestamp: new Date()
    });
    referral.totalRewards += reward;

    this.referrals.set(referralCode, referral);

    return {
      success: true,
      referrerReward: 500,
      newUserReward: 100
    };
  }

  /**
   * Create product bundle
   */
  createBundle(bundleData) {
    const bundleId = `BUNDLE_${Date.now()}`;
    
    const bundle = {
      id: bundleId,
      name: bundleData.name,
      products: bundleData.products, // Array of product IDs
      regularPrice: bundleData.regularPrice,
      bundlePrice: bundleData.bundlePrice,
      discount: bundleData.regularPrice - bundleData.bundlePrice,
      discountPercent: ((bundleData.regularPrice - bundleData.bundlePrice) / bundleData.regularPrice * 100).toFixed(0),
      description: bundleData.description,
      active: true,
      validUntil: new Date(bundleData.validUntil || Date.now() + 30 * 24 * 60 * 60 * 1000),
      createdAt: new Date()
    };

    this.bundles.set(bundleId, bundle);
    console.log('📦 Bundle created:', bundleId);
    return bundle;
  }

  /**
   * Flash Sale
   */
  createFlashSale(saleData) {
    const saleId = `FLASH_${Date.now()}`;
    
    const sale = {
      id: saleId,
      name: saleData.name,
      products: saleData.products, // Product IDs
      discountPercent: saleData.discountPercent,
      startTime: new Date(saleData.startTime),
      endTime: new Date(saleData.endTime),
      quantity: saleData.quantity || -1, // Limited quantity or -1 for unlimited
      sold: 0,
      active: true
    };

    this.flashSales.set(saleId, sale);
    console.log('⚡ Flash sale created:', saleId);
    
    // Auto-activate/deactivate based on time
    this.scheduleFlashSale(saleId);
    
    return sale;
  }

  /**
   * Schedule flash sale activation
   */
  scheduleFlashSale(saleId) {
    const sale = this.flashSales.get(saleId);
    if (!sale) return;

    const now = Date.now();
    const startDelay = sale.startTime.getTime() - now;
    const endDelay = sale.endTime.getTime() - now;

    if (startDelay > 0) {
      setTimeout(() => {
        console.log('⚡ Flash sale started:', saleId);
      }, startDelay);
    }

    if (endDelay > 0) {
      setTimeout(() => {
        sale.active = false;
        this.flashSales.set(saleId, sale);
        console.log('⏰ Flash sale ended:', saleId);
      }, endDelay);
    }
  }

  /**
   * AI-based personalized offer
   */
  generatePersonalizedOffer(userId, userHistory) {
    // Simplified AI logic (can be enhanced with real ML)
    const totalSpent = userHistory.totalSpent || 0;
    const orderCount = userHistory.orderCount || 0;
    const avgOrderValue = totalSpent / Math.max(orderCount, 1);
    const lastPurchase = userHistory.lastPurchase || new Date(0);
    const daysSinceLastPurchase = (Date.now() - lastPurchase.getTime()) / (1000 * 60 * 60 * 24);

    let offer = null;

    // High-value customer (spent > 500,000 RWF)
    if (totalSpent > 500000) {
      offer = {
        type: 'vip',
        code: `VIP${Date.now().toString(36).toUpperCase()}`,
        discount: 25,
        message: 'Exclusive VIP offer just for you! 25% off your next purchase'
      };
    }
    // Win-back campaign (inactive > 30 days)
    else if (daysSinceLastPurchase > 30) {
      offer = {
        type: 'winback',
        code: `WINBACK${Date.now().toString(36).toUpperCase()}`,
        discount: 20,
        message: 'We miss you! Come back with 20% off'
      };
    }
    // Frequent buyer (> 5 orders)
    else if (orderCount > 5) {
      offer = {
        type: 'loyalty',
        code: `LOYAL${Date.now().toString(36).toUpperCase()}`,
        discount: 15,
        message: 'Thank you for being loyal! 15% off as a reward'
      };
    }
    // New customer
    else if (orderCount === 0) {
      offer = {
        type: 'welcome',
        code: 'WELCOME10',
        discount: 10,
        message: 'Welcome! Get 10% off your first purchase'
      };
    }

    if (offer) {
      console.log(`🎯 Personalized offer generated for ${userId}:`, offer.code);
    }

    return offer;
  }

  /**
   * Get all active promotions
   */
  getActivePromotions() {
    const now = new Date();
    
    return {
      coupons: Array.from(this.coupons.values()).filter(c => 
        c.active && c.validFrom <= now && c.validUntil >= now
      ),
      bundles: Array.from(this.bundles.values()).filter(b => 
        b.active && b.validUntil >= now
      ),
      flashSales: Array.from(this.flashSales.values()).filter(s => 
        s.active && s.startTime <= now && s.endTime >= now
      )
    };
  }

  /**
   * Get promotion statistics
   */
  getStats() {
    return {
      coupons: {
        total: this.coupons.size,
        active: Array.from(this.coupons.values()).filter(c => c.active).length,
        totalUsed: Array.from(this.coupons.values()).reduce((sum, c) => sum + c.usedCount, 0)
      },
      bundles: {
        total: this.bundles.size,
        active: Array.from(this.bundles.values()).filter(b => b.active).length
      },
      flashSales: {
        total: this.flashSales.size,
        active: Array.from(this.flashSales.values()).filter(s => s.active).length
      },
      loyalty: {
        totalUsers: this.loyaltyPoints.size,
        totalPointsIssued: Array.from(this.loyaltyPoints.values()).reduce((sum, u) => sum + u.total, 0)
      },
      referrals: {
        total: this.referrals.size,
        totalReferrals: Array.from(this.referrals.values()).reduce((sum, r) => sum + r.referrals.length, 0)
      }
    };
  }
}

module.exports = new PromotionsEngine();
