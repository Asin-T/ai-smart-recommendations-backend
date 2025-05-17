const express = require('express');
const router = express.Router();
const { authenticateUser } = require('../middleware/auth');
const {
  getUserRecommendations,
  getSimilarProducts,
  getTrendingProducts
} = require('../controllers/recommendationController');

// Public routes
router.get('/product/:productId/similar', getSimilarProducts);
router.get('/trending', getTrendingProducts);

// Protected routes
router.get('/user/:userId?', authenticateUser, getUserRecommendations);

module.exports = router;
