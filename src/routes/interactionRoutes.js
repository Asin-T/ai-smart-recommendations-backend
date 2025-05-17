const express = require('express');
const router = express.Router();
const { validate } = require('../middleware/validation');
const { authenticateUser, authenticateAdmin } = require('../middleware/auth');
const { interactionValidation } = require('../utils/validators');
const {
  recordInteraction,
  getInteractionsByUser,
  getInteractionsByProduct,
  getInteractionStats
} = require('../controllers/interactionController');

// Protected routes
router.post('/', authenticateUser, validate(interactionValidation.create), recordInteraction);

// Admin routes
router.get('/user/:userId', authenticateAdmin, getInteractionsByUser);
router.get('/product/:productId', authenticateAdmin, getInteractionsByProduct);
router.get('/stats', authenticateAdmin, getInteractionStats);

module.exports = router;
