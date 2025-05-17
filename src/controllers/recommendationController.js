const Recommendation = require('../models/Recommendation');
const Product = require('../models/Product');
const Interaction = require('../models/Interaction');
const { responseHelpers } = require('../utils/helpers');
const collaborativeFiltering = require('../ai/collaborativeFiltering');
const contentBasedFiltering = require('../ai/contentBasedFiltering');
const hybridRecommendation = require('../ai/hybridRecommendation');

/**
 * @desc    Get recommendations for a user
 * @route   GET /api/recommendations/user/:userId
 * @access  Private
 */
const getUserRecommendations = async (req, res) => {
  try {
    const userId = req.params.userId || req.user._id;
    const { limit = 10, type = 'hybrid' } = req.query;
    
    // Check if we have recent recommendations in the database
    const existingRecommendations = await Recommendation.findOne({
      user_id: userId,
      recommendation_type: type,
      expires_at: { $gt: new Date() }
    }).sort({ generated_at: -1 });
    
    if (existingRecommendations) {
      // Get product details for the recommended product IDs
      const products = await Product.find({
        _id: { $in: existingRecommendations.product_ids }
      });
      
      return responseHelpers.success(res, {
        recommendations: products,
        source: 'cached',
        generated_at: existingRecommendations.generated_at
      });
    }
    
    // Generate new recommendations based on the requested type
    let recommendedProductIds = [];
    
    switch (type) {
      case 'collaborative':
        recommendedProductIds = await collaborativeFiltering.getRecommendations(userId, parseInt(limit));
        break;
      case 'content-based':
        recommendedProductIds = await contentBasedFiltering.getRecommendations(userId, parseInt(limit));
        break;
      case 'trending':
        // Get trending products based on recent interactions
        const trendingProducts = await Interaction.aggregate([
          {
            $match: {
              timestamp: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // Last 7 days
            }
          },
          {
            $group: {
              _id: '$product_id',
              count: { $sum: 1 }
            }
          },
          {
            $sort: { count: -1 }
          },
          {
            $limit: parseInt(limit)
          }
        ]);
        
        recommendedProductIds = trendingProducts.map(item => item._id);
        break;
      case 'hybrid':
      default:
        recommendedProductIds = await hybridRecommendation.getRecommendations(userId, parseInt(limit));
        break;
    }
    
    // Save the new recommendations to the database
    const newRecommendation = await Recommendation.create({
      user_id: userId,
      product_ids: recommendedProductIds,
      recommendation_type: type,
      generated_at: new Date(),
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000) // Expires in 24 hours
    });
    
    // Get product details for the recommended product IDs
    const products = await Product.find({
      _id: { $in: recommendedProductIds }
    });
    
    return responseHelpers.success(res, {
      recommendations: products,
      source: 'generated',
      generated_at: newRecommendation.generated_at
    });
  } catch (error) {
    return responseHelpers.error(res, error.message, 500);
  }
};

/**
 * @desc    Get similar products
 * @route   GET /api/recommendations/product/:productId/similar
 * @access  Public
 */
const getSimilarProducts = async (req, res) => {
  try {
    const { productId } = req.params;
    const { limit = 5 } = req.query;
    
    // Get the product details
    const product = await Product.findById(productId);
    if (!product) {
      return responseHelpers.error(res, 'Product not found', 404);
    }
    
    // Use content-based filtering to find similar products
    const similarProductIds = await contentBasedFiltering.getSimilarProducts(productId, parseInt(limit));
    
    // Get product details for the similar product IDs
    const similarProducts = await Product.find({
      _id: { $in: similarProductIds }
    });
    
    return responseHelpers.success(res, similarProducts);
  } catch (error) {
    return responseHelpers.error(res, error.message, 500);
  }
};

/**
 * @desc    Get trending products
 * @route   GET /api/recommendations/trending
 * @access  Public
 */
const getTrendingProducts = async (req, res) => {
  try {
    const { limit = 10, days = 7 } = req.query;
    
    // Get trending products based on recent interactions
    const trendingProducts = await Interaction.aggregate([
      {
        $match: {
          timestamp: { $gte: new Date(Date.now() - parseInt(days) * 24 * 60 * 60 * 1000) }
        }
      },
      {
        $group: {
          _id: '$product_id',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      },
      {
        $limit: parseInt(limit)
      }
    ]);
    
    const productIds = trendingProducts.map(item => item._id);
    
    // Get product details for the trending product IDs
    const products = await Product.find({
      _id: { $in: productIds }
    });
    
    return responseHelpers.success(res, products);
  } catch (error) {
    return responseHelpers.error(res, error.message, 500);
  }
};

module.exports = {
  getUserRecommendations,
  getSimilarProducts,
  getTrendingProducts
};
