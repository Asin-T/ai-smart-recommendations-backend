const Joi = require('joi');

// Validation schemas for user-related operations
const userValidation = {
  // Registration validation
  register: Joi.object({
    name: Joi.string().required().min(2).max(50),
    email: Joi.string().required().email(),
    password: Joi.string().required().min(6).max(40),
  }),

  // Login validation
  login: Joi.object({
    email: Joi.string().required().email(),
    password: Joi.string().required().min(6).max(40),
  }),

  // Update profile validation
  updateProfile: Joi.object({
    name: Joi.string().min(2).max(50),
    email: Joi.string().email(),
    password: Joi.string().min(6).max(40),
  }),
};

// Validation schemas for product-related operations
const productValidation = {
  // Create product validation
  create: Joi.object({
    name: Joi.string().required().min(2).max(100),
    category: Joi.string().allow('', null),
    description: Joi.string().allow('', null),
    price: Joi.number().required().min(0),
    image_url: Joi.string().allow('', null),
    tags: Joi.array().items(Joi.string()),
  }),

  // Update product validation
  update: Joi.object({
    name: Joi.string().min(2).max(100),
    category: Joi.string().allow('', null),
    description: Joi.string().allow('', null),
    price: Joi.number().min(0),
    image_url: Joi.string().allow('', null),
    tags: Joi.array().items(Joi.string()),
  }),
};

// Validation schemas for interaction-related operations
const interactionValidation = {
  // Create interaction validation
  create: Joi.object({
    product_id: Joi.string().required().hex().length(24),
    interaction_type: Joi.string().required().valid('view', 'click', 'like', 'purchase', 'search'),
    metadata: Joi.object(),
  }),
};

// Validation schemas for admin-related operations
const adminValidation = {
  // Admin login validation
  login: Joi.object({
    email: Joi.string().required().email(),
    password: Joi.string().required().min(6).max(40),
  }),
};

module.exports = {
  userValidation,
  productValidation,
  interactionValidation,
  adminValidation,
};
