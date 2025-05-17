const express = require('express');
const router = express.Router();
const { validate } = require('../middleware/validation');
const { authenticateAdmin } = require('../middleware/auth');
const { adminValidation } = require('../utils/validators');
const {
  loginAdmin,
  getDashboardStats,
  getAllUsers
} = require('../controllers/adminController');

// Public routes
router.post('/login', validate(adminValidation.login), loginAdmin);

// Admin routes
router.get('/dashboard', authenticateAdmin, getDashboardStats);
router.get('/users', authenticateAdmin, getAllUsers);

module.exports = router;
