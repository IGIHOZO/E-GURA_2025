const jwt = require('jsonwebtoken');
const { User } = require('../models');

const normalizeRole = (role) => {
  if (role === 'moderator') {
    return 'storekeeper';
  }
  return role;
};

const getUserFromRequest = async (req) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Access denied. No token provided.');
  }

  const token = authHeader.substring(7); // Remove 'Bearer ' prefix
  const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
  
  const user = await User.findByPk(decoded.id, {
    attributes: { exclude: ['password'] }
  });
  
  if (!user) {
    throw new Error('Invalid token. User not found.');
  }

  if (!user.isActive) {
    throw new Error('Account is deactivated.');
  }

  return user;
};

const authMiddleware = async (req, res, next) => {
  try {
    const user = await getUserFromRequest(req);
    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({ 
      success: false, 
      message: error.message || 'Invalid token.' 
    });
  }
};

// Optional auth middleware for routes that can work with or without auth
const optionalAuthMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      const user = await User.findByPk(decoded.id, {
        attributes: { exclude: ['password'] }
      });
      if (user && user.isActive) {
        req.user = user;
      }
    }
    next();
  } catch (error) {
    // Continue without user if token is invalid
    next();
  }
};

// Admin-only middleware - requires admin role
const adminMiddleware = async (req, res, next) => {
  try {
    const user = await getUserFromRequest(req);
    if (normalizeRole(user.role) !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. Admin privileges required.' 
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Admin auth error:', error);
    res.status(401).json({ 
      success: false, 
      message: error.message || 'Invalid token.' 
    });
  }
};

const staffMiddleware = async (req, res, next) => {
  try {
    const user = await getUserFromRequest(req);
    const role = normalizeRole(user.role);
    if (!['admin', 'storekeeper'].includes(role)) {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. Staff privileges required.' 
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Staff auth error:', error);
    res.status(401).json({ 
      success: false, 
      message: error.message || 'Invalid token.' 
    });
  }
};

module.exports = { 
  authMiddleware, 
  optionalAuthMiddleware,
  adminMiddleware,
  staffMiddleware,
  protect: authMiddleware // Alias for backward compatibility
}; 
