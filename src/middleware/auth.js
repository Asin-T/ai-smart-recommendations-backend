const passport = require('passport');
const { responseHelpers } = require('../utils/helpers');

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
 */
const authenticateAdmin = (req, res, next) => {
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
