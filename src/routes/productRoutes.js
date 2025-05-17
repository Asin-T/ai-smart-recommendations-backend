const express = require('express');
const router = express.Router();
const { validate } = require('../middleware/validation');
const { authenticateAdmin } = require('../middleware/auth');
const { productValidation } = require('../utils/validators');
const {
  getProducts,
  getProductById,
  getProductsByCategory,
  createProduct,
  updateProduct,
  deleteProduct,
} = require('../controllers/productController');

// Public routes
router.get('/', getProducts);
router.get('/:id', getProductById);
router.get('/category/:category', getProductsByCategory);

// Admin routes
router.post('/', authenticateAdmin, validate(productValidation.create), createProduct);
router.put('/:id', authenticateAdmin, validate(productValidation.update), updateProduct);
router.delete('/:id', authenticateAdmin, deleteProduct);

module.exports = router;
