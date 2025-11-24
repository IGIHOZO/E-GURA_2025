const express = require('express');
const router = express.Router();
const { Customer, Order } = require('../models');
const bcrypt = require('bcryptjs');

// Handle MongoDB-specific imports for legacy compatibility
let CustomerActivity;
try {
  CustomerActivity = require('../models/CustomerActivity');
} catch (error) {
  console.log('ℹ️ CustomerActivity model not available (using PostgreSQL)');
}

// ============================================
// ADMIN ROUTES - Complete Customer Management
// ============================================

// Get all customers with filtering and pagination
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      search,
      segment,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const query = {};

    // Search by phone, email, or name
    if (search) {
      query.$or = [
        { phone: { $regex: search } },
        { email: { $regex: search } },
        { firstName: { $regex: search } },
        { lastName: { $regex: search } }
      ];
    }

    // Filter by segment
    if (segment) {
      query.segment = segment;
    }

    const skip = (page - 1) * limit;
    const sortOptions = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    const customers = await Customer.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Customer.countDocuments(query);

    res.json({
      success: true,
      data: customers,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching customers',
      error: error.message
    });
  }
});

// Get customer statistics for admin dashboard
router.get('/statistics', async (req, res) => {
  try {
    const totalCustomers = await Customer.countDocuments();
    const newCustomers = await Customer.countDocuments({
      createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
    });
    const activeCustomers = await Customer.countDocuments({ segment: 'active' });
    const vipCustomers = await Customer.countDocuments({ segment: 'vip' });
    const atRiskCustomers = await Customer.countDocuments({ segment: 'at_risk' });

    // Calculate total revenue from all customers
    const revenueData = await Customer.aggregate([
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$lifetimeValue.totalRevenue' },
          averageOrderValue: { $avg: '$orderStats.averageOrderValue' }
        }
      }
    ]);

    // Segment distribution
    const segmentDistribution = await Customer.aggregate([
      {
        $group: {
          _id: '$segment',
          count: { $sum: 1 }
        }
      }
    ]);

    // Top customers by spending
    const topCustomers = await Customer.find()
      .sort({ 'orderStats.totalSpent': -1 })
      .limit(10)
      .select('phone firstName lastName email orderStats.totalSpent orderStats.totalOrders')
      .lean();

    res.json({
      success: true,
      data: {
        overview: {
          totalCustomers,
          newCustomers,
          activeCustomers,
          vipCustomers,
          atRiskCustomers
        },
        revenue: revenueData[0] || { totalRevenue: 0, averageOrderValue: 0 },
        segmentDistribution,
        topCustomers
      }
    });
  } catch (error) {
    console.error('Error fetching customer statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching customer statistics',
      error: error.message
    });
  }
});

// Get single customer by phone number (PRIMARY KEY)
router.get('/phone/:phone', async (req, res) => {
  try {
    const customer = await Customer.findOne({ phone: req.params.phone });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    // Get customer's orders
    const orders = await Order.find({ user: customer._id })
      .sort({ createdAt: -1 })
      .limit(20);

    // Get customer's activity timeline (only if CustomerActivity exists)
    let activities = [];
    let activitySummary = null;
    if (CustomerActivity) {
      try {
        activities = await CustomerActivity.getCustomerTimeline(
          customer.phone,
          { limit: 50 }
        );
        activitySummary = await CustomerActivity.getActivitySummary(customer.phone);
      } catch (err) {
        console.log('CustomerActivity not available:', err.message);
      }
    }

    res.json({
      success: true,
      data: {
        customer,
        orders,
        activities,
        activitySummary
      }
    });
  } catch (error) {
    console.error('Error fetching customer:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching customer',
      error: error.message
    });
  }
});

// Get single customer by ID
router.get('/:id', async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    // Get customer's orders
    const orders = await Order.find({ user: customer._id })
      .sort({ createdAt: -1 })
      .limit(20);

    // Get customer's activity timeline (only if CustomerActivity exists)
    let activities = [];
    let activitySummary = null;
    if (CustomerActivity) {
      try {
        activities = await CustomerActivity.getCustomerTimeline(
          customer.phone,
          { limit: 50 }
        );
        activitySummary = await CustomerActivity.getActivitySummary(customer.phone);
      } catch (err) {
        console.log('CustomerActivity not available:', err.message);
      }
    }

    res.json({
      success: true,
      data: {
        customer,
        orders,
        activities,
        activitySummary
      }
    });
  } catch (error) {
    console.error('Error fetching customer:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching customer',
      error: error.message
    });
  }
});

// Get customer's complete activity history
router.get('/:id/activities', async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    const {
      page = 1,
      limit = 50,
      activityType,
      startDate,
      endDate
    } = req.query;

    let activities = [];
    
    if (CustomerActivity) {
      try {
        const options = {
          limit: parseInt(limit),
          activityTypes: activityType ? [activityType] : undefined,
          startDate,
          endDate
        };

        activities = await CustomerActivity.getCustomerTimeline(
          customer.phone,
          options
        );
      } catch (err) {
        console.log('CustomerActivity not available:', err.message);
      }
    }

    res.json({
      success: true,
      data: activities
    });
  } catch (error) {
    console.error('Error fetching customer activities:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching customer activities',
      error: error.message
    });
  }
});

// Get customer's orders
router.get('/:id/orders', async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    
    const query = { user: req.params.id };
    if (status) {
      query.status = status;
    }

    const skip = (page - 1) * limit;

    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Order.countDocuments(query);

    res.json({
      success: true,
      data: orders,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching customer orders:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching customer orders',
      error: error.message
    });
  }
});

// Update customer information (Admin)
router.put('/:id', async (req, res) => {
  try {
    const updates = req.body;
    
    // Don't allow password updates through this route
    delete updates.password;
    delete updates.role;

    const customer = await Customer.findById(req.params.id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    // Update customer fields
    Object.keys(updates).forEach(key => {
      if (updates[key] !== undefined && key !== '_id') {
        customer[key] = updates[key];
      }
    });

    await customer.save();

    // Log activity (only if CustomerActivity exists)
    if (CustomerActivity) {
      try {
        await CustomerActivity.logActivity({
          customerPhone: customer.phone,
          customerId: customer._id || customer.id,
          activityType: 'profile_updated',
          details: {
            updatedBy: 'admin',
            fields: Object.keys(updates)
          },
          priority: 'low'
        });
      } catch (err) {
        console.log('CustomerActivity logging failed:', err.message);
      }
    }

    res.json({
      success: true,
      data: customer,
      message: 'Customer updated successfully'
    });
  } catch (error) {
    console.error('Error updating customer:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating customer',
      error: error.message
    });
  }
});

// Add admin note to customer
router.post('/:id/notes', async (req, res) => {
  try {
    const { note, priority = 'low', adminId } = req.body;

    const customer = await Customer.findById(req.params.id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    customer.adminNotes.push({
      note,
      priority,
      addedBy: adminId,
      addedAt: new Date()
    });

    await customer.save();

    res.json({
      success: true,
      data: customer.adminNotes,
      message: 'Note added successfully'
    });
  } catch (error) {
    console.error('Error adding note:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding note',
      error: error.message
    });
  }
});

// Update customer segment manually
router.put('/:id/segment', async (req, res) => {
  try {
    const { segment } = req.body;

    const customer = await Customer.findById(req.params.id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    customer.segment = segment;
    await customer.save();

    res.json({
      success: true,
      data: customer,
      message: 'Customer segment updated successfully'
    });
  } catch (error) {
    console.error('Error updating segment:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating segment',
      error: error.message
    });
  }
});

// Deactivate/Activate customer
router.put('/:id/status', async (req, res) => {
  try {
    const { isActive } = req.body;

    const customer = await Customer.findById(req.params.id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    customer.isActive = isActive;
    await customer.save();

    // Log activity (only if CustomerActivity exists)
    if (CustomerActivity) {
      try {
        await CustomerActivity.logActivity({
          customerPhone: customer.phone,
          customerId: customer._id || customer.id,
          activityType: 'profile_updated',
          details: {
            action: isActive ? 'activated' : 'deactivated',
            updatedBy: 'admin'
          },
          priority: 'high'
        });
      } catch (err) {
        console.log('CustomerActivity logging failed:', err.message);
      }
    }

    res.json({
      success: true,
      data: customer,
      message: `Customer ${isActive ? 'activated' : 'deactivated'} successfully`
    });
  } catch (error) {
    console.error('Error updating customer status:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating customer status',
      error: error.message
    });
  }
});

// Get customer's AI recommendations history
router.get('/:id/ai-recommendations', async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id)
      .select('aiRecommendations phone firstName lastName')
      .populate('aiRecommendations.recommendations.product')
      .populate('aiRecommendations.accepted')
      .populate('aiRecommendations.rejected')
      .lean();

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    res.json({
      success: true,
      data: customer.aiRecommendations || []
    });
  } catch (error) {
    console.error('Error fetching AI recommendations:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching AI recommendations',
      error: error.message
    });
  }
});

// Get customer's shopping behavior
router.get('/:id/shopping-behavior', async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id)
      .select('shoppingBehavior phone firstName lastName')
      .populate('shoppingBehavior.viewedProducts.product')
      .populate('shoppingBehavior.wishlist.product')
      .lean();

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    res.json({
      success: true,
      data: customer.shoppingBehavior || {}
    });
  } catch (error) {
    console.error('Error fetching shopping behavior:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching shopping behavior',
      error: error.message
    });
  }
});

// Export customer data (GDPR compliance)
router.get('/:id/export', async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    const orders = await Order.find({ user: customer._id || customer.id });
    let activities = [];
    
    if (CustomerActivity) {
      try {
        activities = await CustomerActivity.find({ customer: customer._id || customer.id });
      } catch (err) {
        console.log('CustomerActivity not available:', err.message);
      }
    }

    const exportData = {
      customer,
      orders,
      activities,
      exportDate: new Date(),
      exportedBy: 'admin'
    };

    res.json({
      success: true,
      data: exportData
    });
  } catch (error) {
    console.error('Error exporting customer data:', error);
    res.status(500).json({
      success: false,
      message: 'Error exporting customer data',
      error: error.message
    });
  }
});

// ============================================
// ADDRESS MANAGEMENT ROUTES
// ============================================

// Get all addresses for a customer
router.get('/:id/addresses', async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id)
      .select('addresses phone firstName lastName');

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    res.json({
      success: true,
      data: customer.addresses,
      defaultAddress: customer.addresses.find(addr => addr.isDefault)
    });
  } catch (error) {
    console.error('Error fetching addresses:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching addresses',
      error: error.message
    });
  }
});

// Add new address to customer
router.post('/:id/addresses', async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    const { firstName, lastName, phone, address, city, district, postalCode, country, type, instructions, isDefault } = req.body;

    // If this is set as default, unset other defaults
    if (isDefault) {
      customer.addresses.forEach(addr => {
        addr.isDefault = false;
      });
    }

    // If this is the first address, make it default
    const makeDefault = isDefault || customer.addresses.length === 0;

    const newAddress = {
      firstName: firstName || customer.firstName,
      lastName: lastName || customer.lastName,
      phone: phone || customer.phone,
      address,
      city,
      district,
      postalCode,
      country: country || 'Rwanda',
      type: type || 'home',
      instructions,
      isDefault: makeDefault,
      usageCount: 0,
      createdAt: new Date()
    };

    customer.addresses.push(newAddress);
    await customer.save();

    // Log activity (only if CustomerActivity exists)
    if (CustomerActivity) {
      try {
        await CustomerActivity.logActivity({
          customerPhone: customer.phone,
          customerId: customer._id || customer.id,
          activityType: 'address_added',
          details: {
            address: `${city}, ${district}`,
            isDefault: makeDefault
          },
          priority: 'low'
        });
      } catch (err) {
        console.log('CustomerActivity logging failed:', err.message);
      }
    }

    res.json({
      success: true,
      data: customer.addresses,
      message: 'Address added successfully'
    });
  } catch (error) {
    console.error('Error adding address:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding address',
      error: error.message
    });
  }
});

// Update address
router.put('/:id/addresses/:addressId', async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    const address = customer.addresses.id(req.params.addressId);

    if (!address) {
      return res.status(404).json({
        success: false,
        message: 'Address not found'
      });
    }

    // Update address fields
    Object.keys(req.body).forEach(key => {
      if (key !== '_id' && req.body[key] !== undefined) {
        address[key] = req.body[key];
      }
    });

    // If setting as default, unset others
    if (req.body.isDefault) {
      customer.addresses.forEach(addr => {
        if (!addr._id.equals(address._id)) {
          addr.isDefault = false;
        }
      });
    }

    await customer.save();

    // Log activity (only if CustomerActivity exists)
    if (CustomerActivity) {
      try {
        await CustomerActivity.logActivity({
          customerPhone: customer.phone,
          customerId: customer._id || customer.id,
          activityType: 'address_updated',
          details: {
            addressId: address._id || address.id,
            isDefault: address.isDefault
          },
          priority: 'low'
        });
      } catch (err) {
        console.log('CustomerActivity logging failed:', err.message);
      }
    }

    res.json({
      success: true,
      data: customer.addresses,
      message: 'Address updated successfully'
    });
  } catch (error) {
    console.error('Error updating address:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating address',
      error: error.message
    });
  }
});

// Set default address
router.put('/:id/addresses/:addressId/set-default', async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    const address = customer.addresses.id(req.params.addressId);

    if (!address) {
      return res.status(404).json({
        success: false,
        message: 'Address not found'
      });
    }

    // Unset all other defaults
    customer.addresses.forEach(addr => {
      addr.isDefault = false;
    });

    // Set this as default
    address.isDefault = true;

    await customer.save();

    // Log activity (only if CustomerActivity exists)
    if (CustomerActivity) {
      try {
        await CustomerActivity.logActivity({
          customerPhone: customer.phone,
          customerId: customer._id || customer.id,
          activityType: 'address_set_default',
          details: {
            address: `${address.city}, ${address.district}`
          },
          priority: 'low'
        });
      } catch (err) {
        console.log('CustomerActivity logging failed:', err.message);
      }
    }

    res.json({
      success: true,
      data: customer.addresses,
      defaultAddress: address,
      message: 'Default address updated successfully'
    });
  } catch (error) {
    console.error('Error setting default address:', error);
    res.status(500).json({
      success: false,
      message: 'Error setting default address',
      error: error.message
    });
  }
});

// Delete address
router.delete('/:id/addresses/:addressId', async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    const address = customer.addresses.id(req.params.addressId);

    if (!address) {
      return res.status(404).json({
        success: false,
        message: 'Address not found'
      });
    }

    const wasDefault = address.isDefault;
    address.remove();

    // If deleted address was default, set first remaining as default
    if (wasDefault && customer.addresses.length > 0) {
      customer.addresses[0].isDefault = true;
    }

    await customer.save();

    // Log activity (only if CustomerActivity exists)
    if (CustomerActivity) {
      try {
        await CustomerActivity.logActivity({
          customerPhone: customer.phone,
          customerId: customer._id || customer.id,
          activityType: 'address_removed',
          details: {
            address: `${address.city}, ${address.district}`
          },
          priority: 'low'
        });
      } catch (err) {
        console.log('CustomerActivity logging failed:', err.message);
      }
    }

    res.json({
      success: true,
      data: customer.addresses,
      message: 'Address deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting address:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting address',
      error: error.message
    });
  }
});

module.exports = router;
