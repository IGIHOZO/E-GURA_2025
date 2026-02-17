const express = require('express');
const router = express.Router();
const { Address } = require('../models');
const { authMiddleware } = require('../middleware/authMiddleware');

// Create address
router.post('/', authMiddleware, async (req, res) => {
  try {
    const {
      type,
      fullName,
      phone,
      email,
      addressLine1,
      addressLine2,
      city,
      district,
      province,
      postalCode,
      country,
      isDefault
    } = req.body;

    // Validate required fields
    if (!fullName || !phone || !addressLine1 || !city) {
      return res.status(400).json({
        success: false,
        message: 'Full name, phone, address line 1, and city are required'
      });
    }

    // If this is set as default, unset other default addresses
    if (isDefault) {
      await Address.update(
        { isDefault: false },
        { where: { userId: req.user.id, isDefault: true } }
      );
    }

    // Create address
    const address = await Address.create({
      userId: req.user.id,
      type: type || 'both',
      fullName,
      phone,
      email,
      addressLine1,
      addressLine2,
      city,
      district,
      province,
      postalCode,
      country: country || 'Rwanda',
      isDefault: isDefault || false
    });

    console.log('✅ Address created:', address.id);

    res.status(201).json({
      success: true,
      message: 'Address created successfully',
      address: address
    });

  } catch (error) {
    console.error('❌ Error creating address:', error);
    res.status(500).json({ success: false, message: 'Failed to create address', error: error.message });
  }
});

// Get user's addresses
router.get('/', authMiddleware, async (req, res) => {
  try {
    const addresses = await Address.findAll({
      where: { userId: req.user.id },
      order: [
        ['isDefault', 'DESC'],
        ['createdAt', 'DESC']
      ]
    });

    res.json({
      success: true,
      addresses: addresses,
      count: addresses.length
    });

  } catch (error) {
    console.error('❌ Error fetching addresses:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch addresses', error: error.message });
  }
});

// Get default address
router.get('/default', authMiddleware, async (req, res) => {
  try {
    const address = await Address.findOne({
      where: { userId: req.user.id, isDefault: true }
    });

    if (!address) {
      return res.status(404).json({ success: false, message: 'No default address found' });
    }

    res.json({
      success: true,
      address: address
    });

  } catch (error) {
    console.error('❌ Error fetching default address:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch default address', error: error.message });
  }
});

// Get address by ID
router.get('/:addressId', authMiddleware, async (req, res) => {
  try {
    const address = await Address.findOne({
      where: { id: req.params.addressId, userId: req.user.id }
    });

    if (!address) {
      return res.status(404).json({ success: false, message: 'Address not found' });
    }

    res.json({
      success: true,
      address: address
    });

  } catch (error) {
    console.error('❌ Error fetching address:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch address', error: error.message });
  }
});

// Update address
router.put('/:addressId', authMiddleware, async (req, res) => {
  try {
    const address = await Address.findOne({
      where: { id: req.params.addressId, userId: req.user.id }
    });

    if (!address) {
      return res.status(404).json({ success: false, message: 'Address not found' });
    }

    const {
      type,
      fullName,
      phone,
      email,
      addressLine1,
      addressLine2,
      city,
      district,
      province,
      postalCode,
      country,
      isDefault
    } = req.body;

    // If setting as default, unset other defaults
    if (isDefault && !address.isDefault) {
      await Address.update(
        { isDefault: false },
        { where: { userId: req.user.id, isDefault: true } }
      );
    }

    // Update address
    await address.update({
      type: type !== undefined ? type : address.type,
      fullName: fullName || address.fullName,
      phone: phone || address.phone,
      email: email !== undefined ? email : address.email,
      addressLine1: addressLine1 || address.addressLine1,
      addressLine2: addressLine2 !== undefined ? addressLine2 : address.addressLine2,
      city: city || address.city,
      district: district !== undefined ? district : address.district,
      province: province !== undefined ? province : address.province,
      postalCode: postalCode !== undefined ? postalCode : address.postalCode,
      country: country || address.country,
      isDefault: isDefault !== undefined ? isDefault : address.isDefault
    });

    console.log('✅ Address updated:', address.id);

    res.json({
      success: true,
      message: 'Address updated successfully',
      address: address
    });

  } catch (error) {
    console.error('❌ Error updating address:', error);
    res.status(500).json({ success: false, message: 'Failed to update address', error: error.message });
  }
});

// Delete address
router.delete('/:addressId', authMiddleware, async (req, res) => {
  try {
    const address = await Address.findOne({
      where: { id: req.params.addressId, userId: req.user.id }
    });

    if (!address) {
      return res.status(404).json({ success: false, message: 'Address not found' });
    }

    const wasDefault = address.isDefault;
    await address.destroy();

    // If deleted address was default, set another as default
    if (wasDefault) {
      const nextAddress = await Address.findOne({
        where: { userId: req.user.id },
        order: [['createdAt', 'DESC']]
      });

      if (nextAddress) {
        await nextAddress.update({ isDefault: true });
      }
    }

    console.log('✅ Address deleted:', req.params.addressId);

    res.json({
      success: true,
      message: 'Address deleted successfully'
    });

  } catch (error) {
    console.error('❌ Error deleting address:', error);
    res.status(500).json({ success: false, message: 'Failed to delete address', error: error.message });
  }
});

// Set default address
router.put('/:addressId/set-default', authMiddleware, async (req, res) => {
  try {
    const address = await Address.findOne({
      where: { id: req.params.addressId, userId: req.user.id }
    });

    if (!address) {
      return res.status(404).json({ success: false, message: 'Address not found' });
    }

    // Unset all other defaults
    await Address.update(
      { isDefault: false },
      { where: { userId: req.user.id, isDefault: true } }
    );

    // Set this as default
    await address.update({ isDefault: true });

    console.log('✅ Default address set:', address.id);

    res.json({
      success: true,
      message: 'Default address set successfully',
      address: address
    });

  } catch (error) {
    console.error('❌ Error setting default address:', error);
    res.status(500).json({ success: false, message: 'Failed to set default address', error: error.message });
  }
});

// Get shipping addresses only
router.get('/shipping/all', authMiddleware, async (req, res) => {
  try {
    const addresses = await Address.findAll({
      where: {
        userId: req.user.id,
        type: ['shipping', 'both']
      },
      order: [
        ['isDefault', 'DESC'],
        ['createdAt', 'DESC']
      ]
    });

    res.json({
      success: true,
      addresses: addresses
    });

  } catch (error) {
    console.error('❌ Error fetching shipping addresses:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch shipping addresses', error: error.message });
  }
});

// Get billing addresses only
router.get('/billing/all', authMiddleware, async (req, res) => {
  try {
    const addresses = await Address.findAll({
      where: {
        userId: req.user.id,
        type: ['billing', 'both']
      },
      order: [
        ['isDefault', 'DESC'],
        ['createdAt', 'DESC']
      ]
    });

    res.json({
      success: true,
      addresses: addresses
    });

  } catch (error) {
    console.error('❌ Error fetching billing addresses:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch billing addresses', error: error.message });
  }
});

module.exports = router;
