/**
 * Hybrid Recommendation Algorithm Implementation
 * 
 * This module combines collaborative filtering and content-based filtering
 * to generate more accurate and diverse product recommendations.
 */

const collaborativeFiltering = require('./collaborativeFiltering');
const contentBasedFiltering = require('./contentBasedFiltering');
const Interaction = require('../models/Interaction');
const logger = require('../utils/logger');

/**
 * Generate product recommendations using a hybrid approach
 * @param {String} userId - Target user ID
 * @param {Number} limit - Maximum number of recommendations to return
 * @returns {Promise<Array>} Array of recommended product IDs
 */
const getRecommendations = async (userId, limit = 10) => {
  try {
    // Get user interaction count to determine weighting
    const interactionCount = await Interaction.countDocuments({ user_id: userId });
    
    // Determine weights for each algorithm based on user interaction history
    let collaborativeWeight = 0.5;
    let contentBasedWeight = 0.5;
    
    // Adjust weights based on interaction count
    // New users get more content-based recommendations
    // Users with more history get more collaborative recommendations
    if (interactionCount < 5) {
      collaborativeWeight = 0.2;
      contentBasedWeight = 0.8;
    } else if (interactionCount > 20) {
      collaborativeWeight = 0.7;
      contentBasedWeight = 0.3;
    }
    
    // Calculate how many recommendations to get from each algorithm
    const collaborativeLimit = Math.ceil(limit * collaborativeWeight);
    const contentBasedLimit = Math.ceil(limit * contentBasedWeight);
    
    // Get recommendations from both algorithms
    const [collaborativeRecs, contentBasedRecs] = await Promise.all([
      collaborativeFiltering.getRecommendations(userId, collaborativeLimit),
      contentBasedFiltering.getRecommendations(userId, contentBasedLimit)
    ]);
    
    // Combine recommendations, removing duplicates
    const recommendationSet = new Set();
    
    // Add collaborative recommendations first (higher priority)
    collaborativeRecs.forEach(productId => {
      recommendationSet.add(productId.toString());
    });
    
    // Add content-based recommendations
    contentBasedRecs.forEach(productId => {
      recommendationSet.add(productId.toString());
    });
    
    // Convert to array and limit to requested size
    const recommendations = Array.from(recommendationSet).slice(0, limit);
    
    // If we don't have enough recommendations, fill with trending products
    if (recommendations.length < limit) {
      const trendingProducts = await Interaction.aggregate([
        {
          $match: {
            product_id: { $nin: recommendations.map(id => typeof id === 'string' ? id : id.toString()) }
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
          $limit: limit - recommendations.length
        }
      ]);
      
      recommendations.push(...trendingProducts.map(item => item._id.toString()));
    }
    
    return recommendations;
  } catch (error) {
    logger.error(`Error generating hybrid recommendations: ${error.message}`);
    
    // Fall back to collaborative filtering if hybrid approach fails
    try {
      return await collaborativeFiltering.getRecommendations(userId, limit);
    } catch (fallbackError) {
      logger.error(`Fallback to collaborative filtering failed: ${fallbackError.message}`);
      return [];
    }
  }
};

module.exports = {
  getRecommendations
};
