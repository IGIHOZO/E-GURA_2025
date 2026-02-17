const express = require('express');
const router = express.Router();
const { User, Order, Product } = require('../models');
const { Op } = require('sequelize');

/**
 * Customer Account Routes - PostgreSQL Compatible
 * All routes require authentication via deviceId or userId
 */

/**
 * GET /api/customer-account/overview
 * Get customer overview data
 */
router.get('/overview', async (req, res) => {
  try {
    const { userId, phone } = req.query;
    
    if (!userId && !phone) {
      return res.status(400).json({
        success: false,
        message: 'User ID or phone number required'
      });
    }

    // Find customer
    let customer;
    if (phone) {
      customer = await User.findOne({ where: { phone } });
    } else {
      customer = await User.findByPk(userId);
    }

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    // Get orders count
    const totalOrders = await Order.count({
      where: { userId: customer.id }
    });

    // Get active deliveries (pending/processing orders)
    const activeDeliveries = await Order.count({
      where: {
        userId: customer.id,
        status: {
          [Op.in]: ['pending', 'processing', 'shipped']
        }
      }
    });

    // Get total spent
    const orderStats = await Order.findAll({
      where: { userId: customer.id, status: 'delivered' },
      attributes: [
        [require('sequelize').fn('SUM', require('sequelize').col('totalAmount')), 'totalSpent']
      ],
      raw: true
    });

    const totalSpent = orderStats[0]?.totalSpent || 0;

    // Get wishlist count (from localStorage for now, can be moved to DB)
    const wishlistCount = 0; // Will implement wishlist table later

    res.json({
      success: true,
      data: {
        customer: {
          id: customer.id,
          firstName: customer.firstName,
          lastName: customer.lastName,
          email: customer.email,
          phone: customer.phone,
          fullName: `${customer.firstName} ${customer.lastName}`,
          memberSince: customer.createdAt
        },
        stats: {
          totalOrders,
          activeDeliveries,
          totalSpent: parseFloat(totalSpent),
          wishlistCount
        }
      }
    });

  } catch (error) {
    console.error('Error getting overview:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get customer overview',
      error: error.message
    });
  }
});

/**
 * GET /api/customer-account/orders
 * Get customer's orders
 */
router.get('/orders', async (req, res) => {
  try {
    const { userId, phone, status, page = 1, limit = 10 } = req.query;
    
    if (!userId && !phone) {
      return res.status(400).json({
        success: false,
        message: 'User ID or phone number required'
      });
    }

    // Find customer
    let customer;
    if (phone) {
      customer = await User.findOne({ where: { phone } });
    } else {
      customer = await User.findByPk(userId);
    }

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    // Build query
    const where = { userId: customer.id };
    if (status) {
      where.status = status;
    }

    // Get orders with pagination
    const { count, rows: orders } = await Order.findAndCountAll({
      where,
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit)
    });

    res.json({
      success: true,
      data: {
        orders,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(count / parseInt(limit))
        }
      }
    });

  } catch (error) {
    console.error('Error getting orders:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get orders',
      error: error.message
    });
  }
});

/**
 * GET /api/customer-account/addresses
 * Get customer's saved addresses
 */
router.get('/addresses', async (req, res) => {
  try {
    const { userId, phone } = req.query;
    
    if (!userId && !phone) {
      return res.status(400).json({
        success: false,
        message: 'User ID or phone number required'
      });
    }

    // Find customer
    let customer;
    if (phone) {
      customer = await User.findOne({ where: { phone } });
    } else {
      customer = await User.findByPk(userId);
    }

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    // Get addresses (stored as JSONB in PostgreSQL)
    const addresses = customer.addresses || [];

    res.json({
      success: true,
      data: { addresses }
    });

  } catch (error) {
    console.error('Error getting addresses:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get addresses',
      error: error.message
    });
  }
});

/**
 * POST /api/customer-account/addresses
 * Add a new address
 */
router.post('/addresses', async (req, res) => {
  try {
    const { userId, phone, address } = req.body;
    
    if (!userId && !phone) {
      return res.status(400).json({
        success: false,
        message: 'User ID or phone number required'
      });
    }

    if (!address || !address.firstName || !address.phone) {
      return res.status(400).json({
        success: false,
        message: 'Address details required'
      });
    }

    // Find customer
    let customer;
    if (phone) {
      customer = await User.findOne({ where: { phone } });
    } else {
      customer = await User.findByPk(userId);
    }

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    // Get existing addresses
    const addresses = customer.addresses || [];
    
    // Add new address
    const newAddress = {
      id: Date.now().toString(),
      type: address.type || 'shipping',
      firstName: address.firstName,
      lastName: address.lastName || '',
      phone: address.phone,
      address: address.address || address.street,
      city: address.city || 'Kigali',
      district: address.district || '',
      sector: address.sector || '',
      country: address.country || 'Rwanda',
      postalCode: address.postalCode || '',
      isDefault: addresses.length === 0 || address.isDefault || false,
      createdAt: new Date()
    };

    // If this is set as default, unset others
    if (newAddress.isDefault) {
      addresses.forEach(addr => addr.isDefault = false);
    }

    addresses.push(newAddress);

    // Update customer
    await customer.update({ addresses });

    res.json({
      success: true,
      message: 'Address added successfully',
      data: { address: newAddress }
    });

  } catch (error) {
    console.error('Error adding address:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add address',
      error: error.message
    });
  }
});

/**
 * PUT /api/customer-account/addresses/:addressId
 * Update an address
 */
router.put('/addresses/:addressId', async (req, res) => {
  try {
    const { addressId } = req.params;
    const { userId, phone, address } = req.body;
    
    if (!userId && !phone) {
      return res.status(400).json({
        success: false,
        message: 'User ID or phone number required'
      });
    }

    // Find customer
    let customer;
    if (phone) {
      customer = await User.findOne({ where: { phone } });
    } else {
      customer = await User.findByPk(userId);
    }

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    // Get addresses
    const addresses = customer.addresses || [];
    const addressIndex = addresses.findIndex(a => a.id === addressId);

    if (addressIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Address not found'
      });
    }

    // Update address
    addresses[addressIndex] = {
      ...addresses[addressIndex],
      ...address,
      updatedAt: new Date()
    };

    // If this is set as default, unset others
    if (address.isDefault) {
      addresses.forEach((addr, idx) => {
        if (idx !== addressIndex) addr.isDefault = false;
      });
    }

    // Save
    await customer.update({ addresses });

    res.json({
      success: true,
      message: 'Address updated successfully',
      data: { address: addresses[addressIndex] }
    });

  } catch (error) {
    console.error('Error updating address:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update address',
      error: error.message
    });
  }
});

/**
 * DELETE /api/customer-account/addresses/:addressId
 * Delete an address
 */
router.delete('/addresses/:addressId', async (req, res) => {
  try {
    const { addressId } = req.params;
    const { userId, phone } = req.query;
    
    if (!userId && !phone) {
      return res.status(400).json({
        success: false,
        message: 'User ID or phone number required'
      });
    }

    // Find customer
    let customer;
    if (phone) {
      customer = await User.findOne({ where: { phone } });
    } else {
      customer = await User.findByPk(userId);
    }

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    // Get addresses
    let addresses = customer.addresses || [];
    const addressIndex = addresses.findIndex(a => a.id === addressId);

    if (addressIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Address not found'
      });
    }

    // Remove address
    const wasDefault = addresses[addressIndex].isDefault;
    addresses = addresses.filter(a => a.id !== addressId);

    // If deleted address was default, make first address default
    if (wasDefault && addresses.length > 0) {
      addresses[0].isDefault = true;
    }

    // Save
    await customer.update({ addresses });

    res.json({
      success: true,
      message: 'Address deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting address:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete address',
      error: error.message
    });
  }
});

/**
 * GET /api/customer-account/recommendations
 * Get personalized product recommendations
 */
router.get('/recommendations', async (req, res) => {
  try {
    const { userId, phone, limit = 10 } = req.query;
    
    if (!userId && !phone) {
      return res.status(400).json({
        success: false,
        message: 'User ID or phone number required'
      });
    }

    // Find customer
    let customer;
    if (phone) {
      customer = await User.findOne({ where: { phone } });
    } else {
      customer = await User.findByPk(userId);
    }

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    // Get customer's orders to find preferences
    const orders = await Order.findAll({
      where: { userId: customer.id },
      limit: 5,
      order: [['createdAt', 'DESC']]
    });

    // Extract categories from past orders
    const categories = new Set();
    orders.forEach(order => {
      if (order.items) {
        order.items.forEach(item => {
          if (item.category) categories.add(item.category);
        });
      }
    });

    // Get recommendations based on categories
    let recommendations;
    if (categories.size > 0) {
      recommendations = await Product.findAll({
        where: {
          isActive: true,
          category: {
            [Op.in]: Array.from(categories)
          }
        },
        order: [['createdAt', 'DESC']],
        limit: parseInt(limit)
      });
    } else {
      // New customer - show popular/new products
      recommendations = await Product.findAll({
        where: { isActive: true },
        order: [['createdAt', 'DESC']],
        limit: parseInt(limit)
      });
    }

    res.json({
      success: true,
      data: { recommendations }
    });

  } catch (error) {
    console.error('Error getting recommendations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get recommendations',
      error: error.message
    });
  }
});

/**
 * PUT /api/customer-account/profile
 * Update customer profile
 */
router.put('/profile', async (req, res) => {
  try {
    const { userId, phone, updates } = req.body;
    
    if (!userId && !phone) {
      return res.status(400).json({
        success: false,
        message: 'User ID or phone number required'
      });
    }

    // Find customer
    let customer;
    if (phone) {
      customer = await User.findOne({ where: { phone } });
    } else {
      customer = await User.findByPk(userId);
    }

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    // Update allowed fields
    const allowedFields = ['firstName', 'lastName', 'email'];
    const updateData = {};
    
    allowedFields.forEach(field => {
      if (updates[field] !== undefined) {
        updateData[field] = updates[field];
      }
    });

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid fields to update'
      });
    }

    // Update customer
    await customer.update(updateData);

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        customer: {
          id: customer.id,
          firstName: customer.firstName,
          lastName: customer.lastName,
          email: customer.email,
          phone: customer.phone
        }
      }
    });

  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile',
      error: error.message
    });
  }
});

module.exports = router;
