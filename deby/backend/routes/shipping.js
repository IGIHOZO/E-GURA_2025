const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

// Path to store shipping settings (using JSON file for simplicity)
const SETTINGS_FILE = path.join(__dirname, '../data/shipping-settings.json');

// Ensure data directory exists
const dataDir = path.join(__dirname, '../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Default shipping settings
const defaultSettings = {
  freeShippingEnabled: false,
  freeShippingType: 'none',
  standardShippingFee: 2000,
  freeShippingThreshold: 0,
  selectedProducts: []
};

// Helper function to read settings
const readSettings = () => {
  try {
    if (fs.existsSync(SETTINGS_FILE)) {
      const data = fs.readFileSync(SETTINGS_FILE, 'utf8');
      return JSON.parse(data);
    }
    return defaultSettings;
  } catch (error) {
    console.error('Error reading shipping settings:', error);
    return defaultSettings;
  }
};

// Helper function to write settings
const writeSettings = (settings) => {
  try {
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error('Error writing shipping settings:', error);
    return false;
  }
};

/**
 * GET /api/shipping/settings
 * Get current shipping settings
 */
router.get('/settings', (req, res) => {
  try {
    const settings = readSettings();
    res.json({
      success: true,
      settings
    });
  } catch (error) {
    console.error('Error fetching shipping settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch shipping settings',
      error: error.message
    });
  }
});

/**
 * PUT /api/shipping/settings
 * Update shipping settings
 */
router.put('/settings', (req, res) => {
  try {
    const newSettings = {
      freeShippingEnabled: req.body.freeShippingEnabled || false,
      freeShippingType: req.body.freeShippingType || 'none',
      standardShippingFee: parseInt(req.body.standardShippingFee) || 2000,
      freeShippingThreshold: parseInt(req.body.freeShippingThreshold) || 0,
      selectedProducts: req.body.selectedProducts || []
    };

    const success = writeSettings(newSettings);

    if (success) {
      console.log('✅ Shipping settings updated:', newSettings);
      res.json({
        success: true,
        message: 'Shipping settings updated successfully',
        settings: newSettings
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to save shipping settings'
      });
    }
  } catch (error) {
    console.error('Error updating shipping settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update shipping settings',
      error: error.message
    });
  }
});

/**
 * GET /api/shipping/calculate
 * Calculate shipping fee for an order
 */
router.post('/calculate', (req, res) => {
  try {
    const { items, subtotal } = req.body;
    const settings = readSettings();

    console.log('🚚 Shipping calculation request:');
    console.log('  - Items:', items?.length || 0);
    console.log('  - Subtotal:', subtotal);
    console.log('  - Settings:', {
      freeShippingType: settings.freeShippingType,
      selectedProducts: settings.selectedProducts,
      standardShippingFee: settings.standardShippingFee
    });

    let shippingFee = settings.standardShippingFee;
    let isFreeShipping = false;
    let reason = 'Standard shipping';

    // Check free shipping conditions
    if (settings.freeShippingType === 'all') {
      shippingFee = 0;
      isFreeShipping = true;
      reason = 'Free shipping on all products';
      console.log('✅ Free shipping: ALL products');
    } else if (settings.freeShippingType === 'selected' && items && items.length > 0) {
      // Check if all items have free shipping
      console.log('  - Checking selected products...');
      console.log('  - Cart item IDs:', items.map(i => i.productId || i.product));
      console.log('  - Free shipping product IDs:', settings.selectedProducts);
      
      const allItemsHaveFreeShipping = items.every(item => {
        const itemId = item.productId || item.product;
        const hasFreeShipping = settings.selectedProducts.includes(itemId);
        console.log(`    - Item ${itemId}: ${hasFreeShipping ? '✅ Free' : '❌ Paid'}`);
        return hasFreeShipping;
      });

      if (allItemsHaveFreeShipping) {
        shippingFee = 0;
        isFreeShipping = true;
        reason = 'Free shipping on selected products';
        console.log('✅ Free shipping: All items are selected');
      } else {
        console.log('❌ Standard shipping: Some items not selected');
      }
    }

    // Check threshold-based free shipping
    if (!isFreeShipping && settings.freeShippingThreshold > 0 && subtotal >= settings.freeShippingThreshold) {
      shippingFee = 0;
      isFreeShipping = true;
      reason = `Free shipping for orders over ${settings.freeShippingThreshold.toLocaleString()} RWF`;
      console.log('✅ Free shipping: Threshold met');
    }

    console.log('📦 Final shipping:', { shippingFee, isFreeShipping, reason });

    res.json({
      success: true,
      shippingFee,
      isFreeShipping,
      reason,
      standardFee: settings.standardShippingFee
    });
  } catch (error) {
    console.error('Error calculating shipping:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to calculate shipping fee',
      error: error.message
    });
  }
});

/**
 * POST /api/shipping/check-product
 * Check if a specific product has free shipping
 */
router.post('/check-product', (req, res) => {
  try {
    const { productId } = req.body;
    const settings = readSettings();

    let hasFreeShipping = false;
    let reason = 'No free shipping';

    if (settings.freeShippingType === 'all') {
      hasFreeShipping = true;
      reason = 'Free shipping on all products';
    } else if (settings.freeShippingType === 'selected' && settings.selectedProducts.includes(productId)) {
      hasFreeShipping = true;
      reason = 'Free shipping on this product';
    }

    res.json({
      success: true,
      hasFreeShipping,
      reason,
      shippingFee: hasFreeShipping ? 0 : settings.standardShippingFee
    });
  } catch (error) {
    console.error('Error checking product shipping:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check product shipping',
      error: error.message
    });
  }
});

module.exports = router;
