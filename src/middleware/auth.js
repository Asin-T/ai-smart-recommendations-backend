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
 * Also accepts placeholder token in development environment
 */
const authenticateAdmin = (req, res, next) => {
  // Check for development placeholder token
  const authHeader = req.headers.authorization;
  const isDevelopment = config.env === 'development';
  
  // If we have a placeholder token in development mode, allow access
  if (isDevelopment && authHeader && authHeader === 'Bearer admin-jwt-tokenplaceholder') {
    console.log('Development mode: Using placeholder admin token');
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
