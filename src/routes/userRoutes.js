const express = require('express');
const router = express.Router();
const { validate } = require('../middleware/validation');
const { authenticateUser } = require('../middleware/auth');
const { userValidation } = require('../utils/validators');
const {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
  deleteUserAccount,
} = require('../controllers/userController');

// Public routes
router.post('/register', validate(userValidation.register), registerUser);
router.post('/login', validate(userValidation.login), loginUser);

// Protected routes
router.get('/profile', authenticateUser, getUserProfile);
router.put('/profile', authenticateUser, validate(userValidation.updateProfile), updateUserProfile);
router.delete('/profile', authenticateUser, deleteUserAccount);

module.exports = router;
