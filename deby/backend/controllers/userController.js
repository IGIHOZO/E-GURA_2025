const User = require('../models/User');
const Order = require('../models/Order');
const Payment = require('../models/Payment');

// Get User Profile
const getUserProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await User.findById(userId)
      .select('-password -verificationToken -resetPasswordToken');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      success: true,
      user: user
    });

  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({ message: 'Error retrieving user profile', error: error.message });
  }
};

// Update User Profile
const updateUserProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      firstName,
      lastName,
      phone,
      profile,
      preferences
    } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update basic info
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (phone) user.phone = phone;

    // Update profile
    if (profile) {
      user.profile = { ...user.profile, ...profile };
    }

    // Update preferences
    if (preferences) {
      user.preferences = { ...user.preferences, ...preferences };
    }

    await user.save();

    res.json({
      success: true,
      user: user,
      message: 'Profile updated successfully'
    });

  } catch (error) {
    console.error('Update user profile error:', error);
    res.status(500).json({ message: 'Error updating user profile', error: error.message });
  }
};

// Add User Address
const addUserAddress = async (req, res) => {
  try {
    const userId = req.user.id;
    const addressData = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // If this is the first address, make it default
    if (user.addresses.length === 0) {
      addressData.isDefault = true;
    }

    // If this address is set as default, unset others
    if (addressData.isDefault) {
      user.addresses.forEach(addr => addr.isDefault = false);
    }

    user.addresses.push(addressData);
    await user.save();

    res.json({
      success: true,
      addresses: user.addresses,
      message: 'Address added successfully'
    });

  } catch (error) {
    console.error('Add user address error:', error);
    res.status(500).json({ message: 'Error adding address', error: error.message });
  }
};

// Update User Address
const updateUserAddress = async (req, res) => {
  try {
    const userId = req.user.id;
    const { addressId } = req.params;
    const addressData = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const addressIndex = user.addresses.findIndex(addr => addr._id.toString() === addressId);
    if (addressIndex === -1) {
      return res.status(404).json({ message: 'Address not found' });
    }

    // If this address is set as default, unset others
    if (addressData.isDefault) {
      user.addresses.forEach(addr => addr.isDefault = false);
    }

    user.addresses[addressIndex] = { ...user.addresses[addressIndex], ...addressData };
    await user.save();

    res.json({
      success: true,
      addresses: user.addresses,
      message: 'Address updated successfully'
    });

  } catch (error) {
    console.error('Update user address error:', error);
    res.status(500).json({ message: 'Error updating address', error: error.message });
  }
};

// Delete User Address
const deleteUserAddress = async (req, res) => {
  try {
    const userId = req.user.id;
    const { addressId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const addressIndex = user.addresses.findIndex(addr => addr._id.toString() === addressId);
    if (addressIndex === -1) {
      return res.status(404).json({ message: 'Address not found' });
    }

    const deletedAddress = user.addresses[addressIndex];
    user.addresses.splice(addressIndex, 1);

    // If deleted address was default and there are other addresses, make first one default
    if (deletedAddress.isDefault && user.addresses.length > 0) {
      user.addresses[0].isDefault = true;
    }

    await user.save();

    res.json({
      success: true,
      addresses: user.addresses,
      message: 'Address deleted successfully'
    });

  } catch (error) {
    console.error('Delete user address error:', error);
    res.status(500).json({ message: 'Error deleting address', error: error.message });
  }
};

// Add Payment Method
const addPaymentMethod = async (req, res) => {
  try {
    const userId = req.user.id;
    const paymentMethodData = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // If this is the first payment method, make it default
    if (user.paymentMethods.length === 0) {
      paymentMethodData.isDefault = true;
    }

    // If this payment method is set as default, unset others
    if (paymentMethodData.isDefault) {
      user.paymentMethods.forEach(pm => pm.isDefault = false);
    }

    user.paymentMethods.push(paymentMethodData);
    await user.save();

    res.json({
      success: true,
      paymentMethods: user.paymentMethods,
      message: 'Payment method added successfully'
    });

  } catch (error) {
    console.error('Add payment method error:', error);
    res.status(500).json({ message: 'Error adding payment method', error: error.message });
  }
};

// Update Payment Method
const updatePaymentMethod = async (req, res) => {
  try {
    const userId = req.user.id;
    const { methodId } = req.params;
    const paymentMethodData = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const methodIndex = user.paymentMethods.findIndex(pm => pm._id.toString() === methodId);
    if (methodIndex === -1) {
      return res.status(404).json({ message: 'Payment method not found' });
    }

    // If this payment method is set as default, unset others
    if (paymentMethodData.isDefault) {
      user.paymentMethods.forEach(pm => pm.isDefault = false);
    }

    user.paymentMethods[methodIndex] = { ...user.paymentMethods[methodIndex], ...paymentMethodData };
    await user.save();

    res.json({
      success: true,
      paymentMethods: user.paymentMethods,
      message: 'Payment method updated successfully'
    });

  } catch (error) {
    console.error('Update payment method error:', error);
    res.status(500).json({ message: 'Error updating payment method', error: error.message });
  }
};

// Delete Payment Method
const deletePaymentMethod = async (req, res) => {
  try {
    const userId = req.user.id;
    const { methodId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const methodIndex = user.paymentMethods.findIndex(pm => pm._id.toString() === methodId);
    if (methodIndex === -1) {
      return res.status(404).json({ message: 'Payment method not found' });
    }

    const deletedMethod = user.paymentMethods[methodIndex];
    user.paymentMethods.splice(methodIndex, 1);

    // If deleted method was default and there are other methods, make first one default
    if (deletedMethod.isDefault && user.paymentMethods.length > 0) {
      user.paymentMethods[0].isDefault = true;
    }

    await user.save();

    res.json({
      success: true,
      paymentMethods: user.paymentMethods,
      message: 'Payment method deleted successfully'
    });

  } catch (error) {
    console.error('Delete payment method error:', error);
    res.status(500).json({ message: 'Error deleting payment method', error: error.message });
  }
};

// Get User Analytics
const getUserAnalytics = async (req, res) => {
  try {
    const userId = req.user.id;
    const { period = '30' } = req.query; // days
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));

    // Get user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get orders in period
    const orders = await Order.find({
      user: userId,
      createdAt: { $gte: startDate }
    }).sort({ createdAt: -1 });

    // Get payments in period
    const payments = await Payment.find({
      user: userId,
      createdAt: { $gte: startDate }
    }).sort({ createdAt: -1 });

    // Calculate analytics
    const totalOrders = orders.length;
    const totalSpent = orders.reduce((sum, order) => sum + order.total, 0);
    const averageOrderValue = totalOrders > 0 ? totalSpent / totalOrders : 0;

    // Orders by status
    const ordersByStatus = orders.reduce((acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1;
      return acc;
    }, {});

    // Orders by payment method
    const ordersByPayment = orders.reduce((acc, order) => {
      acc[order.paymentMethod] = (acc[order.paymentMethod] || 0) + 1;
      return acc;
    }, {});

    // Recent activity
    const recentOrders = orders.slice(0, 5);
    const recentPayments = payments.slice(0, 5);

    res.json({
      success: true,
      analytics: {
        period: `${period} days`,
        totalOrders,
        totalSpent,
        averageOrderValue,
        ordersByStatus,
        ordersByPayment,
        recentOrders,
        recentPayments,
        userStats: {
          totalOrders: user.totalOrders,
          totalSpent: user.totalSpent,
          lastLogin: user.lastLogin
        }
      }
    });

  } catch (error) {
    console.error('Get user analytics error:', error);
    res.status(500).json({ message: 'Error retrieving analytics', error: error.message });
  }
};

module.exports = {
  getUserProfile,
  updateUserProfile,
  addUserAddress,
  updateUserAddress,
  deleteUserAddress,
  addPaymentMethod,
  updatePaymentMethod,
  deletePaymentMethod,
  getUserAnalytics
}; 