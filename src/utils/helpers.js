const jwt = require('jsonwebtoken');
const config = require('../config');

/**
 * Generate JWT token for authentication
 * @param {Object} user - User object containing id and role
 * @returns {String} JWT token
 */
const generateToken = (user) => {
  return jwt.sign(
    { 
      id: user._id,
      role: user.role || 'user'
    },
    config.jwt.secret,
    {
      expiresIn: config.jwt.expiresIn,
    }
  );
};

/**
 * Helper functions for API responses
 */
const responseHelpers = {
  success: (res, data, statusCode = 200) => {
    return res.status(statusCode).json({
      success: true,
      data,
    });
  },
  
  error: (res, message, statusCode = 400) => {
    return res.status(statusCode).json({
      success: false,
      error: message,
    });
  },
};

/**
 * Pagination helper
 * @param {Number} page - Page number
 * @param {Number} limit - Items per page
 * @returns {Object} Pagination object with skip and limit
 */
const getPagination = (page = 1, limit = 10) => {
  const skip = (page - 1) * limit;
  return {
    skip,
    limit: parseInt(limit),
  };
};

module.exports = {
  generateToken,
  responseHelpers,
  getPagination,
};
