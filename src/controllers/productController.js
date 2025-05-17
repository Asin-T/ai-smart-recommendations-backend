const Product = require('../models/Product');
const { responseHelpers, getPagination } = require('../utils/helpers');

/**
 * @desc    Get all products with pagination
 * @route   GET /api/products
 * @access  Public
 */
const getProducts = async (req, res) => {
  try {
    const { page = 1, limit = 10, category, search } = req.query;
    const { skip, limit: limitNum } = getPagination(page, limit);
    
    // Build query
    const query = {};
    
    // Add category filter if provided
    if (category) {
      query.category = category;
    }
    
    // Add search filter if provided
    if (search) {
      query.$text = { $search: search };
    }
    
    // Execute query with pagination
    const products = await Product.find(query)
      .skip(skip)
      .limit(limitNum)
      .sort({ created_at: -1 });
    
    // Get total count for pagination
    const total = await Product.countDocuments(query);
    
    return responseHelpers.success(res, {
      products,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limitNum),
        limit: limitNum,
      },
    });
  } catch (error) {
    return responseHelpers.error(res, error.message, 500);
  }
};

/**
 * @desc    Get product by ID
 * @route   GET /api/products/:id
 * @access  Public
 */
const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return responseHelpers.error(res, 'Product not found', 404);
    }
    
    return responseHelpers.success(res, product);
  } catch (error) {
    return responseHelpers.error(res, error.message, 500);
  }
};

/**
 * @desc    Get products by category
 * @route   GET /api/products/category/:category
 * @access  Public
 */
const getProductsByCategory = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const { skip, limit: limitNum } = getPagination(page, limit);
    
    const products = await Product.find({ category: req.params.category })
      .skip(skip)
      .limit(limitNum)
      .sort({ created_at: -1 });
    
    const total = await Product.countDocuments({ category: req.params.category });
    
    return responseHelpers.success(res, {
      products,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limitNum),
        limit: limitNum,
      },
    });
  } catch (error) {
    return responseHelpers.error(res, error.message, 500);
  }
};

/**
 * @desc    Create a new product
 * @route   POST /api/products
 * @access  Private/Admin
 */
const createProduct = async (req, res) => {
  try {
    const { name, category, description, price, image_url, tags } = req.body;
    
    const product = await Product.create({
      name,
      category,
      description,
      price,
      image_url,
      tags,
    });
    
    return responseHelpers.success(res, product, 201);
  } catch (error) {
    return responseHelpers.error(res, error.message, 500);
  }
};

/**
 * @desc    Update a product
 * @route   PUT /api/products/:id
 * @access  Private/Admin
 */
const updateProduct = async (req, res) => {
  try {
    const { name, category, description, price, image_url, tags } = req.body;
    
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return responseHelpers.error(res, 'Product not found', 404);
    }
    
    // Update product fields if provided
    product.name = name || product.name;
    product.category = category !== undefined ? category : product.category;
    product.description = description !== undefined ? description : product.description;
    product.price = price !== undefined ? price : product.price;
    product.image_url = image_url !== undefined ? image_url : product.image_url;
    product.tags = tags || product.tags;
    
    const updatedProduct = await product.save();
    
    return responseHelpers.success(res, updatedProduct);
  } catch (error) {
    return responseHelpers.error(res, error.message, 500);
  }
};

/**
 * @desc    Delete a product
 * @route   DELETE /api/products/:id
 * @access  Private/Admin
 */
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return responseHelpers.error(res, 'Product not found', 404);
    }
    
    await product.deleteOne();
    
    return responseHelpers.success(res, { message: 'Product removed successfully' });
  } catch (error) {
    return responseHelpers.error(res, error.message, 500);
  }
};

module.exports = {
  getProducts,
  getProductById,
  getProductsByCategory,
  createProduct,
  updateProduct,
  deleteProduct,
};
