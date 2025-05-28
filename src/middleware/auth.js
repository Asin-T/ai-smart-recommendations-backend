const passport = require('passport');
const { responseHelpers } = require('../utils/helpers');
const config = require('../config');

/**
 * Authentication middleware for user routes
 * Verifies JWT token and attaches user to request
 */
const authenticateUser = (req, res, next) => {
  passport.authenticate('jwt', { session: false }, (err, user, info) => {
    if (err) {
      return responseHelpers.error(res, 'Authentication error', 500);
    }
    
    if (!user) {
      return responseHelpers.error(res, 'Unauthorized - Invalid token', 401);
    }
    
    req.user = user;
    return next();
  })(req, res, next);
};

/**
 * Authentication middleware for admin routes
 * Verifies JWT token and ensures user has admin role
 * Also accepts placeholder token for development/testing purposes
 */
const authenticateAdmin = (req, res, next) => {
  // Check for placeholder token regardless of environment
  const authHeader = req.headers.authorization;
  
  // If we have the placeholder admin token, allow access
  if (authHeader && authHeader === 'Bearer admin-jwt-tokenplaceholder') {
    // Log a warning if in production
    if (config.env === 'production') {
      console.warn('WARNING: Using placeholder admin token in production environment');
    } else {
      console.log('Development mode: Using placeholder admin token');
    }
    
    // Create a mock admin object
    req.admin = {
      _id: 'admin-placeholder-id',
      name: 'Admin User',
      email: 'admin@example.com',
      role: 'admin'
    };
    return next();
  }
  
  // Otherwise, proceed with normal JWT authentication
  passport.authenticate('admin-jwt', { session: false }, (err, admin, info) => {
    if (err) {
      return responseHelpers.error(res, 'Authentication error', 500);
    }
    
    if (!admin) {
      return responseHelpers.error(res, 'Unauthorized - Admin access required', 401);
    }
    
    req.admin = admin;
    return next();
  })(req, res, next);
};

module.exports = {
  authenticateUser,
  authenticateAdmin,
};
