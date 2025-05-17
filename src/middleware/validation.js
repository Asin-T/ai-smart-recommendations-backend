const { responseHelpers } = require('../utils/helpers');
const { userValidation, productValidation, interactionValidation } = require('../utils/validators');

/**
 * Validation middleware for request data
 * @param {Object} schema - Joi validation schema
 * @returns {Function} Express middleware
 */
const validate = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body);
  
  if (error) {
    const errorMessage = error.details.map((detail) => detail.message).join(', ');
    return responseHelpers.error(res, errorMessage, 400);
  }
  
  return next();
};

/**
 * Error handling middleware
 * Catches all errors and sends appropriate response
 */
const errorHandler = (err, req, res, next) => {
  // Log error
  console.error(err.stack);
  
  // MongoDB duplicate key error
  if (err.code === 11000) {
    return responseHelpers.error(
      res,
      'Duplicate key error. This record already exists.',
      400
    );
  }
  
  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((val) => val.message);
    return responseHelpers.error(res, messages.join(', '), 400);
  }
  
  // JWT error
  if (err.name === 'JsonWebTokenError') {
    return responseHelpers.error(res, 'Invalid token. Please log in again.', 401);
  }
  
  // JWT expired error
  if (err.name === 'TokenExpiredError') {
    return responseHelpers.error(res, 'Token expired. Please log in again.', 401);
  }
  
  // Default to 500 server error
  return responseHelpers.error(
    res,
    err.message || 'Internal server error',
    err.statusCode || 500
  );
};

module.exports = {
  validate,
  errorHandler,
};
