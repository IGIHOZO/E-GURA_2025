const express = require('express');
const router = express.Router();
const { User } = require('../models');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const normalizeRole = (role) => (role === 'moderator' ? 'storekeeper' : role);
const STAFF_ROLES = ['admin', 'storekeeper'];

const buildPermissions = (role) => ({
  canAccessAdmin: role === 'admin',
  canManageInventory: role === 'admin' || role === 'storekeeper',
  canQuickAddProducts: role === 'admin' || role === 'storekeeper'
});

const sanitizeUser = (user, roleOverride) => {
  const safeUser = user.toJSON ? user.toJSON() : user;
  return {
    id: safeUser.id,
    firstName: safeUser.firstName,
    lastName: safeUser.lastName,
    email: safeUser.email,
    phone: safeUser.phone,
    role: roleOverride || normalizeRole(safeUser.role)
  };
};

/**
 * Admin Authentication Routes
 * Default admin credentials: admin@sewithdebby.com / Admin@123
 */

// Admin / Storekeeper Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    console.log('dY"? Admin login attempt:', email);
    console.log('dY"\u0015 Request body:', { email, password: '***' });
    
    if (!email || !password) {
      return res.status(400).json({ 
        success: false,
        message: 'Please provide email and password' 
      });
    }

    // Find user by email
    console.log('dY"? Looking for user with email:', email);
    const user = await User.findOne({ where: { email } });
    
    if (!user) {
      console.log('�?O User not found');
      return res.status(401).json({ 
        success: false,
        message: 'Invalid email or password. Did you run /api/admin/auth/setup first?' 
      });
    }

    const normalizedRole = normalizeRole(user.role);
    console.log('�o. User found:', { id: user.id, email: user.email, role: normalizedRole });

    if (!STAFF_ROLES.includes(normalizedRole)) {
      console.log('�?O User is not staff, role:', normalizedRole);
      return res.status(403).json({ 
        success: false,
        message: 'Access denied. Staff privileges required.' 
      });
    }

    // Verify password
    console.log('dY"` Verifying password...');
    let isMatch;
    try {
      if (typeof user.comparePassword === 'function') {
        isMatch = await user.comparePassword(password);
      } else {
        // Fallback: use bcrypt directly
        isMatch = await bcrypt.compare(password, user.password);
      }
      console.log('dY"` Password match:', isMatch);
    } catch (pwdError) {
      console.error('�?O Password comparison error:', pwdError);
      return res.status(500).json({
        success: false,
        message: 'Password verification failed',
        error: pwdError.message
      });
    }
    
    if (!isMatch) {
      return res.status(401).json({ 
        success: false,
        message: 'Invalid email or password' 
      });
    }

    // Update login count and last login
    await user.update({
      loginCount: (user.loginCount || 0) + 1,
      lastLogin: new Date()
    });

    // Generate token
    const token = jwt.sign(
      { id: user.id, role: normalizedRole },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    console.log('�o. Staff login successful:', user.email);

    const responseUser = sanitizeUser(user, normalizedRole);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: responseUser,
        token,
        permissions: buildPermissions(normalizedRole)
      }
    });
  } catch (err) {
    console.error('�?O Admin login error:', err);
    res.status(500).json({ 
      success: false,
      message: 'Login failed',
      error: err.message 
    });
  }
});

// Create default admin (for first-time setup)
router.post('/setup', async (req, res) => {
  try {
    console.log('dY"\u0015 Running admin setup...');
    
    // Check if admin already exists
    const existingAdmin = await User.findOne({ 
      where: { 
        email: 'admin@sewithdebby.com' 
      } 
    });
    
    if (existingAdmin) {
      console.log('�,1�,? Admin already exists');
      return res.json({
        success: true,
        message: 'Default admin account already exists',
        credentials: {
          email: 'admin@sewithdebby.com',
          password: 'Use your existing password'
        }
      });
    }

    console.log('�z\u0007 Creating new admin user...');
    
    // Create default admin
    const admin = await User.create({
      firstName: 'Admin',
      lastName: 'SEWITHDEBBY',
      email: 'admin@sewithdebby.com',
      phone: '+250780000000',
      password: 'Admin@123', // Will be hashed automatically by User model hook
      role: 'admin',
      isActive: true,
      isVerified: true,
      emailVerified: true,
      phoneVerified: true
    });

    console.log('�o. Default admin created successfully:', admin.id);

    res.json({
      success: true,
      message: 'Default admin account created successfully',
      credentials: {
        email: 'admin@sewithdebby.com',
        password: 'Admin@123',
        note: 'Please change this password after first login'
      }
    });
  } catch (err) {
    console.error('�?O Admin setup error:', err);
    console.error('�?O Error stack:', err.stack);
    res.status(500).json({ 
      success: false,
      message: 'Failed to create admin account',
      error: err.message,
      details: err.stack
    });
  }
});

// Verify staff token
router.get('/verify', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ 
        success: false,
        message: 'No token provided' 
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const user = await User.findByPk(decoded.id, {
      attributes: { exclude: ['password'] }
    });

    if (!user) {
      return res.status(403).json({ 
        success: false,
        message: 'Invalid token or insufficient permissions' 
      });
    }

    const normalizedRole = normalizeRole(user.role);

    if (!STAFF_ROLES.includes(normalizedRole)) {
      return res.status(403).json({ 
        success: false,
        message: 'Invalid token or insufficient permissions' 
      });
    }

    res.json({
      success: true,
      data: { 
        user: sanitizeUser(user, normalizedRole),
        permissions: buildPermissions(normalizedRole),
        isAdmin: normalizedRole === 'admin'
      }
    });
  } catch (err) {
    res.status(401).json({ 
      success: false,
      message: 'Invalid token',
      error: err.message 
    });
  }
});

module.exports = router;
