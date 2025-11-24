const express = require('express');
const router = express.Router();
const cartIntegrationService = require('../services/cartIntegrationService');

/**
 * Shopify webhook endpoint
 */
router.post('/shopify', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const hmac = req.headers['x-shopify-hmac-sha256'];
    const topic = req.headers['x-shopify-topic'];
    const shop = req.headers['x-shopify-shop-domain'];

    // Verify webhook signature
    const secret = process.env.SHOPIFY_WEBHOOK_SECRET;
    if (secret && hmac) {
      const isValid = cartIntegrationService.verifyShopifyWebhook(
        req.body,
        hmac,
        secret
      );

      if (!isValid) {
        return res.status(401).json({ error: 'Invalid webhook signature' });
      }
    }

    // Parse payload
    const payload = JSON.parse(req.body.toString());

    // Process webhook
    const result = await cartIntegrationService.handleWebhook('shopify', topic, payload);

    console.log(`Shopify webhook processed: ${topic}`, result);

    res.status(200).json({ success: true, result });
  } catch (error) {
    console.error('Shopify webhook error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * WooCommerce webhook endpoint
 */
router.post('/woocommerce', express.json(), async (req, res) => {
  try {
    const signature = req.headers['x-wc-webhook-signature'];
    const event = req.headers['x-wc-webhook-topic'];

    // Verify webhook signature
    const secret = process.env.WOO_WEBHOOK_SECRET;
    if (secret && signature) {
      const isValid = cartIntegrationService.verifyWooWebhook(
        JSON.stringify(req.body),
        signature,
        secret
      );

      if (!isValid) {
        return res.status(401).json({ error: 'Invalid webhook signature' });
      }
    }

    // Process webhook
    const result = await cartIntegrationService.handleWebhook('woocommerce', event, req.body);

    console.log(`WooCommerce webhook processed: ${event}`, result);

    res.status(200).json({ success: true, result });
  } catch (error) {
    console.error('WooCommerce webhook error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Generic cart discount application
 */
router.post('/apply-discount', express.json(), async (req, res) => {
  try {
    const { token, cart } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'Missing discount token' });
    }

    const discount = await cartIntegrationService.applyDiscountToCart(token, cart);

    res.json({
      success: true,
      discount
    });
  } catch (error) {
    console.error('Apply discount error:', error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * Validate cart with negotiated items
 */
router.post('/validate-cart', express.json(), async (req, res) => {
  try {
    const { cart } = req.body;

    const validation = await cartIntegrationService.validateNegotiatedCart(cart);

    res.json({
      success: true,
      validation
    });
  } catch (error) {
    console.error('Validate cart error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get active discounts for user
 */
router.get('/active-discounts/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const discounts = await cartIntegrationService.getActiveDiscounts(userId);

    res.json({
      success: true,
      discounts
    });
  } catch (error) {
    console.error('Get active discounts error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Cancel discount
 */
router.post('/cancel-discount', express.json(), async (req, res) => {
  try {
    const { token } = req.body;

    const result = await cartIntegrationService.cancelDiscount(token);

    res.json({
      success: true,
      result
    });
  } catch (error) {
    console.error('Cancel discount error:', error);
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
