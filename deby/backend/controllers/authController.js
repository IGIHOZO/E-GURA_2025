const { User } = require('../models');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const registerUser = async (req, res) => {
  try {
    const { firstName, lastName, email, phone, password, addresses } = req.body;
    
    // Validate required fields
    if (!firstName || !lastName || !email || !phone || !password) {
      return res.status(400).json({ 
        success: false,
        message: 'Please provide all required fields: firstName, lastName, email, phone, password' 
      });
    }

    // Check if user already exists by PHONE (primary identifier for checkout)
    let existingUserByPhone = await User.findOne({ where: { phone } });
    if (existingUserByPhone) {
      console.log('📱 User with phone already exists, returning existing user for checkout');
      
      // UPDATE existing user's details if provided (e.g., new address)
      if (addresses && addresses.length > 0) {
        const currentAddresses = existingUserByPhone.addresses || [];
        const updatedAddresses = [...currentAddresses, ...addresses];
        await existingUserByPhone.update({ addresses: updatedAddresses });
        console.log('📍 Added new address to existing user');
        
        // Reload user to get updated data
        existingUserByPhone = await User.findOne({ where: { phone } });
      }
      
      // Return existing user (treat as successful "registration" for checkout flow)
      return res.status(200).json({
        success: true,
        message: 'User already exists, logged in successfully',
        data: {
          user: {
            id: existingUserByPhone.id,
            firstName: existingUserByPhone.firstName,
            lastName: existingUserByPhone.lastName,
            email: existingUserByPhone.email,
            phone: existingUserByPhone.phone,
            role: existingUserByPhone.role || 'customer',
            addresses: existingUserByPhone.addresses || [],
            paymentMethods: existingUserByPhone.paymentMethods || []
          },
          token: generateToken(existingUserByPhone.id)
        }
      });
    }

    // Check if email exists with DIFFERENT phone (actual duplicate)
    const existingUserByEmail = await User.findOne({ where: { email } });
    if (existingUserByEmail && existingUserByEmail.phone !== phone) {
      return res.status(400).json({ 
        success: false,
        message: 'User with this email already exists with a different phone number' 
      });
    }
    
    // Create new user
    console.log('✅ Creating new user for checkout');
    const user = await User.create({
      firstName,
      lastName,
      email,
      phone,
      password, // Will be hashed by model hook
      profile: {},
      addresses: addresses || [],
      paymentMethods: [],
      preferences: {}
    });

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phone: user.phone,
          role: user.role || 'customer',
          addresses: user.addresses || [],
          paymentMethods: user.paymentMethods || []
        },
        token: generateToken(user.id)
      }
    });
  } catch (err) {
    console.error('❌ Registration error:', err);
    res.status(500).json({ 
      success: false,
      message: 'Failed to register user',
      error: err.message 
    });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password, phone } = req.body;
    
    // Support both email/password and phone-only login
    if (phone) {
      // Phone-only login (for checkout)
      console.log('📱 Phone login attempt:', phone);
      const user = await User.findOne({ where: { phone } });
      
      if (!user) {
        return res.status(400).json({ 
          success: false,
          message: 'Phone number not found. Please register first.' 
        });
      }

      // Update login count and last login
      await user.update({
        loginCount: (user.loginCount || 0) + 1,
        lastLogin: new Date()
      });

      return res.json({
        success: true,
        message: 'Login successful',
        user: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phone: user.phone,
          role: user.role,
          addresses: user.addresses || [],
          paymentMethods: user.paymentMethods || []
        },
        token: generateToken(user.id)
      });
    }
    
    // Email/password login
    if (!email || !password) {
      return res.status(400).json({ 
        success: false,
        message: 'Please provide email and password or phone number' 
      });
    }

    const user = await User.findOne({ where: { email } });
    
    if (!user) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid email or password' 
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid email or password' 
      });
    }

    // Update login count and last login
    await user.update({
      loginCount: user.loginCount + 1,
      lastLogin: new Date()
    });

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phone: user.phone,
          role: user.role
        },
        token: generateToken(user.id)
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ 
      success: false,
      message: 'Failed to login',
      error: err.message 
    });
  }
};

const getProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password'] }
    });
    
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (err) {
    console.error('Get profile error:', err);
    res.status(500).json({ 
      success: false,
      message: 'Failed to get profile',
      error: err.message 
    });
  }
};

const checkPhoneExists = async (req, res) => {
  try {
    // Support both GET (query) and POST (body) requests
    const { phone } = req.method === 'GET' ? req.query : req.body;
    
    console.log('📱 Check phone request:', phone, 'Method:', req.method);
    
    if (!phone) {
      return res.status(400).json({
        success: false,
        message: 'Phone number is required'
      });
    }

    // Use Sequelize syntax with where clause
    const user = await User.findOne({ where: { phone } });
    
    console.log('🔍 User found:', user ? `Yes (${user.phone})` : 'No');
    
    if (user) {
      // User exists - return user data for auto-login
      return res.json({
        success: true,
        exists: true,
        user: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          phone: user.phone,
          email: user.email,
          role: user.role,
          addresses: user.addresses || [],
          paymentMethods: user.paymentMethods || []
        }
      });
    }
    
    // User doesn't exist
    console.log('👤 New user - phone not found');
    res.json({
      success: true,
      exists: false
    });
    
  } catch (err) {
    console.error('❌ Check phone error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to check phone number. Database error.',
      error: err.message
    });
  }
};

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

module.exports = { registerUser, loginUser, getProfile, checkPhoneExists }; 