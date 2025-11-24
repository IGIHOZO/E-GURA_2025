const crypto = require('crypto');
const Negotiation = require('../models/Negotiation');

/**
 * Cart Integration Service
 * Handles discount token application and cart webhooks
 */

class CartIntegrationService {
  /**
   * Apply negotiated discount to cart
   */
  async applyDiscountToCart(token, cartData) {
    // Validate token
    const negotiation = await Negotiation.findOne({ 
      discountToken: token,
      status: 'accepted'
    });

    if (!negotiation) {
      throw new Error('Invalid or expired discount token');
    }

    if (negotiation.discountApplied) {
      throw new Error('Discount already applied');
    }

    if (negotiation.isExpired()) {
      throw new Error('Discount has expired');
    }

    // Verify SKU matches
    const cartItem = cartData.items?.find(item => item.sku === negotiation.sku);
    if (!cartItem) {
      throw new Error('Negotiated product not in cart');
    }

    // Calculate discount
    const originalPrice = negotiation.basePrice;
    const discountedPrice = negotiation.finalPrice;
    const discountAmount = originalPrice - discountedPrice;
    const discountPct = (discountAmount / originalPrice) * 100;

    // Create discount object
    const discount = {
      code: `NEGO-${token.substring(0, 8).toUpperCase()}`,
      type: 'negotiation',
      sku: negotiation.sku,
      originalPrice,
      discountedPrice,
      discountAmount,
      discountPct,
      quantity: negotiation.quantity,
      expiresAt: negotiation.expiresAt,
      sessionId: negotiation.sessionId,
      metadata: {
        userId: negotiation.userId,
        rounds: negotiation.currentRound,
        appliedAt: new Date()
      }
    };

    // Mark as applied
    negotiation.discountApplied = true;
    await negotiation.save();

    return discount;
  }

  /**
   * Generate Shopify discount code
   */
  async generateShopifyDiscount(negotiation) {
    // This would integrate with Shopify Admin API
    // For now, return a mock structure
    const discountCode = `NEGO${Date.now().toString(36).toUpperCase()}`;
    
    return {
      code: discountCode,
      value_type: 'fixed_amount',
      value: (negotiation.basePrice - negotiation.finalPrice).toString(),
      customer_selection: 'prerequisite',
      prerequisite_customer_ids: [negotiation.userId],
      prerequisite_product_ids: [negotiation.sku],
      usage_limit: 1,
      starts_at: new Date().toISOString(),
      ends_at: negotiation.expiresAt.toISOString()
    };
  }

  /**
   * Generate WooCommerce coupon
   */
  async generateWooCoupon(negotiation) {
    // This would integrate with WooCommerce REST API
    const couponCode = `NEGO${Date.now().toString(36).toUpperCase()}`;
    
    return {
      code: couponCode,
      discount_type: 'fixed_product',
      amount: (negotiation.basePrice - negotiation.finalPrice).toString(),
      product_ids: [negotiation.sku],
      usage_limit: 1,
      usage_limit_per_user: 1,
      individual_use: true,
      exclude_sale_items: false,
      date_expires: negotiation.expiresAt.toISOString(),
      meta_data: [
        { key: 'negotiation_session', value: negotiation.sessionId },
        { key: 'user_id', value: negotiation.userId }
      ]
    };
  }

  /**
   * Create generic cart line item with discount
   */
  createDiscountedLineItem(negotiation) {
    return {
      sku: negotiation.sku,
      quantity: negotiation.quantity,
      originalPrice: negotiation.basePrice,
      price: negotiation.finalPrice,
      discount: negotiation.basePrice - negotiation.finalPrice,
      discountPct: ((negotiation.basePrice - negotiation.finalPrice) / negotiation.basePrice) * 100,
      metadata: {
        negotiationSession: negotiation.sessionId,
        negotiatedPrice: true,
        expiresAt: negotiation.expiresAt
      }
    };
  }

  /**
   * Validate cart before checkout
   */
  async validateNegotiatedCart(cartData) {
    const errors = [];
    const warnings = [];

    for (const item of cartData.items || []) {
      if (item.metadata?.negotiationSession) {
        const negotiation = await Negotiation.findOne({
          sessionId: item.metadata.negotiationSession
        });

        if (!negotiation) {
          errors.push(`Invalid negotiation session for ${item.sku}`);
          continue;
        }

        if (negotiation.isExpired()) {
          errors.push(`Negotiated price for ${item.sku} has expired`);
          continue;
        }

        if (negotiation.discountApplied) {
          warnings.push(`Discount for ${item.sku} already applied`);
        }

        // Verify price hasn't changed
        if (item.price !== negotiation.finalPrice) {
          errors.push(`Price mismatch for ${item.sku}`);
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Handle webhook from e-commerce platform
   */
  async handleWebhook(platform, event, payload) {
    switch (platform) {
      case 'shopify':
        return this.handleShopifyWebhook(event, payload);
      case 'woocommerce':
        return this.handleWooWebhook(event, payload);
      default:
        throw new Error(`Unsupported platform: ${platform}`);
    }
  }

  /**
   * Handle Shopify webhook
   */
  async handleShopifyWebhook(event, payload) {
    switch (event) {
      case 'orders/create':
        return this.processOrderCreated(payload);
      case 'checkouts/create':
        return this.processCheckoutCreated(payload);
      default:
        console.log(`Unhandled Shopify event: ${event}`);
        return { processed: false };
    }
  }

  /**
   * Handle WooCommerce webhook
   */
  async handleWooWebhook(event, payload) {
    switch (event) {
      case 'order.created':
        return this.processOrderCreated(payload);
      default:
        console.log(`Unhandled WooCommerce event: ${event}`);
        return { processed: false };
    }
  }

  /**
   * Process order created
   */
  async processOrderCreated(orderData) {
    // Find negotiations in order
    const negotiations = [];

    for (const item of orderData.line_items || []) {
      if (item.properties?.negotiation_session || item.meta_data?.find(m => m.key === 'negotiation_session')) {
        const sessionId = item.properties?.negotiation_session || 
                         item.meta_data?.find(m => m.key === 'negotiation_session')?.value;

        const negotiation = await Negotiation.findOne({ sessionId });
        if (negotiation) {
          negotiations.push(negotiation);
          
          // Mark as applied if not already
          if (!negotiation.discountApplied) {
            negotiation.discountApplied = true;
            await negotiation.save();
          }
        }
      }
    }

    return {
      processed: true,
      negotiationsFound: negotiations.length,
      orderValue: orderData.total_price || orderData.total
    };
  }

  /**
   * Process checkout created
   */
  async processCheckoutCreated(checkoutData) {
    // Similar to order created but for checkout events
    return {
      processed: true,
      checkoutId: checkoutData.id
    };
  }

  /**
   * Verify webhook signature (Shopify)
   */
  verifyShopifyWebhook(data, hmacHeader, secret) {
    const hash = crypto
      .createHmac('sha256', secret)
      .update(data, 'utf8')
      .digest('base64');
    
    return hash === hmacHeader;
  }

  /**
   * Verify webhook signature (WooCommerce)
   */
  verifyWooWebhook(data, signature, secret) {
    const hash = crypto
      .createHmac('sha256', secret)
      .update(data)
      .digest('base64');
    
    return hash === signature;
  }

  /**
   * Get active discounts for user
   */
  async getActiveDiscounts(userId) {
    const negotiations = await Negotiation.find({
      userId,
      status: 'accepted',
      discountApplied: false,
      expiresAt: { $gt: new Date() }
    }).sort({ acceptedAt: -1 });

    return negotiations.map(neg => ({
      sessionId: neg.sessionId,
      sku: neg.sku,
      originalPrice: neg.basePrice,
      discountedPrice: neg.finalPrice,
      discount: neg.basePrice - neg.finalPrice,
      discountPct: ((neg.basePrice - neg.finalPrice) / neg.basePrice) * 100,
      expiresAt: neg.expiresAt,
      token: neg.discountToken
    }));
  }

  /**
   * Cancel/invalidate discount
   */
  async cancelDiscount(token) {
    const negotiation = await Negotiation.findOne({ discountToken: token });
    
    if (!negotiation) {
      throw new Error('Discount not found');
    }

    if (negotiation.discountApplied) {
      throw new Error('Discount already applied and cannot be cancelled');
    }

    negotiation.status = 'expired';
    await negotiation.save();

    return {
      success: true,
      message: 'Discount cancelled'
    };
  }
}

module.exports = new CartIntegrationService();
