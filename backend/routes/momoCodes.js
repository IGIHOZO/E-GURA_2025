const express = require('express');
const router = express.Router();
const { MomoCode } = require('../models');
const { protect, adminMiddleware } = require('../middleware/authMiddleware');

// @desc    Get all active MOMO codes (public)
// @route   GET /api/momo-codes
// @access  Public
router.get('/', async (req, res) => {
  try {
    const momoCodes = await MomoCode.findAll({
      where: { isActive: true },
      order: [['displayOrder', 'ASC'], ['createdAt', 'ASC']]
    });

    res.json({
      success: true,
      data: momoCodes
    });
  } catch (error) {
    console.error('Error fetching MOMO codes:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching MOMO codes',
      error: error.message
    });
  }
});

// @desc    Get primary MOMO code (public)
// @route   GET /api/momo-codes/primary
// @access  Public
router.get('/primary', async (req, res) => {
  try {
    const primaryCode = await MomoCode.findOne({
      where: { isActive: true, isPrimary: true }
    });

    if (!primaryCode) {
      // Fallback to first active code
      const fallbackCode = await MomoCode.findOne({
        where: { isActive: true },
        order: [['displayOrder', 'ASC'], ['createdAt', 'ASC']]
      });

      return res.json({
        success: true,
        data: fallbackCode
      });
    }

    res.json({
      success: true,
      data: primaryCode
    });
  } catch (error) {
    console.error('Error fetching primary MOMO code:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching primary MOMO code',
      error: error.message
    });
  }
});

// Admin routes (require authentication)
// Apply middleware to all admin routes

// @desc    Get all MOMO codes (admin)
// @route   GET /api/momo-codes/admin
// @access  Admin
router.get('/admin', protect, adminMiddleware, async (req, res) => {
  try {
    const momoCodes = await MomoCode.findAll({
      order: [['displayOrder', 'ASC'], ['createdAt', 'ASC']]
    });

    res.json({
      success: true,
      data: momoCodes,
      count: momoCodes.length
    });
  } catch (error) {
    console.error('Error fetching all MOMO codes:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching MOMO codes',
      error: error.message
    });
  }
});

// @desc    Create new MOMO code
// @route   POST /api/momo-codes/admin
// @access  Admin
router.post('/admin', protect, adminMiddleware, async (req, res) => {
  try {
    const {
      name,
      phoneNumber,
      accountName,
      description,
      isActive = true,
      isPrimary = false,
      displayOrder = 0,
      network = 'MTN',
      instructions
    } = req.body;

    // Validate required fields
    if (!name || !phoneNumber || !accountName) {
      return res.status(400).json({
        success: false,
        message: 'Name, phone number, and account name are required'
      });
    }

    // Validate phone number format
    if (!/^250\d{9}$/.test(phoneNumber)) {
      return res.status(400).json({
        success: false,
        message: 'Phone number must be in format 250XXXXXXXXX'
      });
    }

    // Check if phone number already exists
    const existingCode = await MomoCode.findOne({ where: { phoneNumber } });
    if (existingCode) {
      return res.status(400).json({
        success: false,
        message: 'A MOMO code with this phone number already exists'
      });
    }

    const momoCode = await MomoCode.create({
      name,
      phoneNumber,
      accountName,
      description,
      isActive,
      isPrimary,
      displayOrder,
      network,
      instructions
    });

    res.status(201).json({
      success: true,
      data: momoCode,
      message: 'MOMO code created successfully'
    });
  } catch (error) {
    console.error('Error creating MOMO code:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating MOMO code',
      error: error.message
    });
  }
});

// @desc    Update MOMO code
// @route   PUT /api/momo-codes/admin/:id
// @access  Admin
router.put('/admin/:id', protect, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    console.log('Updating MOMO code with ID:', id);
    console.log('Update data:', updateData);

    // Validate ID format
    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'MOMO code ID is required'
      });
    }

    // Validate phone number format if provided
    if (updateData.phoneNumber && !/^250\d{9}$/.test(updateData.phoneNumber)) {
      return res.status(400).json({
        success: false,
        message: 'Phone number must be in format 250XXXXXXXXX'
      });
    }

    // Check if phone number already exists (excluding current record)
    if (updateData.phoneNumber) {
      const existingCode = await MomoCode.findOne({
        where: {
          phoneNumber: updateData.phoneNumber,
          id: { [require('sequelize').Op.ne]: id }
        }
      });
      if (existingCode) {
        return res.status(400).json({
          success: false,
          message: 'A MOMO code with this phone number already exists'
        });
      }
    }

    const momoCode = await MomoCode.findByPk(id);
    console.log('Found MOMO code:', momoCode ? 'Yes' : 'No');
    
    if (!momoCode) {
      return res.status(404).json({
        success: false,
        message: 'MOMO code not found'
      });
    }
    
    console.log('Updating MOMO code:', momoCode.phoneNumber);
    await momoCode.update(updateData);
    console.log('MOMO code updated successfully');

    res.json({
      success: true,
      data: momoCode,
      message: 'MOMO code updated successfully'
    });
  } catch (error) {
    console.error('Error updating MOMO code:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Error updating MOMO code',
      error: error.message
    });
  }
});

// @desc    Delete MOMO code
// @route   DELETE /api/momo-codes/admin/:id
// @access  Admin
router.delete('/admin/:id', protect, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    console.log('Attempting to delete MOMO code with ID:', id);

    // Validate ID format
    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'MOMO code ID is required'
      });
    }

    const momoCode = await MomoCode.findByPk(id);
    console.log('Found MOMO code:', momoCode ? 'Yes' : 'No');
    
    if (!momoCode) {
      return res.status(404).json({
        success: false,
        message: 'MOMO code not found'
      });
    }

    // Allow deletion of any MOMO code - admin has full control
    // Note: If this is the last MOMO code, the MOMO Code payment method will show "No codes configured"
    console.log('Deleting MOMO code:', momoCode.phoneNumber);

    await MomoCode.destroy({ where: { id } });
    console.log('MOMO code deleted successfully');

    res.json({
      success: true,
      message: 'MOMO code deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting MOMO code:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Error deleting MOMO code',
      error: error.message
    });
  }
});

// @desc    Set primary MOMO code
// @route   PUT /api/momo-codes/admin/:id/set-primary
// @access  Admin
router.put('/admin/:id/set-primary', protect, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const momoCode = await MomoCode.findByPk(id);
    if (!momoCode) {
      return res.status(404).json({
        success: false,
        message: 'MOMO code not found'
      });
    }

    if (!momoCode.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Cannot set inactive MOMO code as primary'
      });
    }

    // Set all other codes to non-primary
    await MomoCode.update(
      { isPrimary: false },
      { where: { id: { [require('sequelize').Op.ne]: id } } }
    );

    // Set this code as primary
    momoCode.isPrimary = true;
    await momoCode.save();

    res.json({
      success: true,
      data: momoCode,
      message: 'MOMO code set as primary successfully'
    });
  } catch (error) {
    console.error('Error setting primary MOMO code:', error);
    res.status(500).json({
      success: false,
      message: 'Error setting primary MOMO code',
      error: error.message
    });
  }
});

// @desc    Toggle MOMO code status
// @route   PUT /api/momo-codes/admin/:id/toggle-status
// @access  Admin
router.put('/admin/:id/toggle-status', protect, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const momoCode = await MomoCode.findByPk(id);
    if (!momoCode) {
      return res.status(404).json({
        success: false,
        message: 'MOMO code not found'
      });
    }

    // Allow deactivation of any MOMO code - admin has full control

    momoCode.isActive = !momoCode.isActive;
    
    // If deactivating a primary code, set another active code as primary
    if (!momoCode.isActive && momoCode.isPrimary) {
      momoCode.isPrimary = false;
      
      // Find another active code to set as primary
      const newPrimary = await MomoCode.findOne({
        where: {
          id: { [require('sequelize').Op.ne]: id },
          isActive: true
        },
        order: [['displayOrder', 'ASC'], ['createdAt', 'ASC']]
      });
      
      if (newPrimary) {
        newPrimary.isPrimary = true;
        await newPrimary.save();
      }
    }

    await momoCode.save();

    res.json({
      success: true,
      data: momoCode,
      message: `MOMO code ${momoCode.isActive ? 'activated' : 'deactivated'} successfully`
    });
  } catch (error) {
    console.error('Error toggling MOMO code status:', error);
    res.status(500).json({
      success: false,
      message: 'Error toggling MOMO code status',
      error: error.message
    });
  }
});

module.exports = router;
