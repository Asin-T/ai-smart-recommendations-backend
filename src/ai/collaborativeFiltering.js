/**
 * Collaborative Filtering Algorithm Implementation
 * 
 * This module implements user-based collaborative filtering to generate
 * personalized product recommendations based on user interaction patterns.
 */

const Interaction = require('../models/Interaction');
const User = require('../models/User');
const Product = require('../models/Product');
const logger = require('../utils/logger');

/**
 * Calculate similarity between two users based on their interaction patterns
 * @param {Array} userInteractions1 - First user's interactions
 * @param {Array} userInteractions2 - Second user's interactions
 * @returns {Number} Similarity score between 0 and 1
 */
const calculateUserSimilarity = (userInteractions1, userInteractions2) => {
  try {
    // Create sets of product IDs that each user has interacted with
    const products1 = new Set(userInteractions1.map(interaction => interaction.product_id.toString()));
    const products2 = new Set(userInteractions2.map(interaction => interaction.product_id.toString()));
    
    // Find common products
    const commonProducts = [...products1].filter(productId => products2.has(productId));
    
    // Calculate Jaccard similarity coefficient
    const unionSize = new Set([...products1, ...products2]).size;
    const similarity = unionSize > 0 ? commonProducts.length / unionSize : 0;
    
    return similarity;
  } catch (error) {
    logger.error(`Error calculating user similarity: ${error.message}`);
    return 0;
  }
};

/**
 * Find similar users based on interaction patterns
 * @param {String} userId - Target user ID
 * @param {Number} limit - Maximum number of similar users to return
 * @returns {Promise<Array>} Array of similar user IDs with similarity scores
 */
const findSimilarUsers = async (userId, limit = 10) => {
  try {
    // Get target user's interactions
    const userInteractions = await Interaction.find({ user_id: userId });
    
    if (userInteractions.length === 0) {
      return [];
    }
    
    // Get all other users
    const allUsers = await User.find({ _id: { $ne: userId } });
    
    // Calculate similarity for each user
    const similarityScores = [];
    
    for (const otherUser of allUsers) {
      const otherUserInteractions = await Interaction.find({ user_id: otherUser._id });
      
      if (otherUserInteractions.length > 0) {
        const similarity = calculateUserSimilarity(userInteractions, otherUserInteractions);
        
        if (similarity > 0) {
          similarityScores.push({
            userId: otherUser._id,
            similarity
          });
        }
      }
    }
    
    // Sort by similarity (descending) and limit results
    return similarityScores
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);
  } catch (error) {
    logger.error(`Error finding similar users: ${error.message}`);
    return [];
  }
};

/**
 * Generate product recommendations based on collaborative filtering
 * @param {String} userId - Target user ID
 * @param {Number} limit - Maximum number of recommendations to return
 * @returns {Promise<Array>} Array of recommended product IDs
 */
const getRecommendations = async (userId, limit = 10) => {
  try {
    // Find similar users
    const similarUsers = await findSimilarUsers(userId);
    
    if (similarUsers.length === 0) {
      // Fall back to trending products if no similar users found
      const trendingProducts = await Interaction.aggregate([
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
          $limit: limit
        }
      ]);
      
      return trendingProducts.map(item => item._id);
    }
    
    // Get products that the target user has already interacted with
    const userInteractions = await Interaction.find({ user_id: userId });
    const userProductIds = new Set(userInteractions.map(interaction => 
      interaction.product_id.toString()
    ));
    
    // Get products that similar users have interacted with
    const recommendationCandidates = [];
    
    for (const similarUser of similarUsers) {
      const similarUserInteractions = await Interaction.find({ 
        user_id: similarUser.userId,
        interaction_type: { $in: ['view', 'like', 'purchase'] } // Focus on positive interactions
      });
      
      for (const interaction of similarUserInteractions) {
        const productId = interaction.product_id.toString();
        
        // Skip products the target user has already interacted with
        if (!userProductIds.has(productId)) {
          // Weight by similarity and interaction type
          let weight = similarUser.similarity;
          
          // Increase weight for stronger interactions
          if (interaction.interaction_type === 'purchase') {
            weight *= 3;
          } else if (interaction.interaction_type === 'like') {
            weight *= 2;
          }
          
          // Add to candidates or update weight if already exists
          const existingCandidate = recommendationCandidates.find(
            candidate => candidate.productId === productId
          );
          
          if (existingCandidate) {
            existingCandidate.weight += weight;
          } else {
            recommendationCandidates.push({
              productId,
              weight
            });
          }
        }
      }
    }
    
    // Sort by weight (descending) and limit results
    const recommendations = recommendationCandidates
      .sort((a, b) => b.weight - a.weight)
      .slice(0, limit)
      .map(candidate => candidate.productId);
    
    // If we don't have enough recommendations, fill with trending products
    if (recommendations.length < limit) {
      const trendingProducts = await Interaction.aggregate([
        {
          $match: {
            product_id: { $nin: [...userProductIds, ...recommendations] }
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
    logger.error(`Error generating collaborative recommendations: ${error.message}`);
    return [];
  }
};

module.exports = {
  calculateUserSimilarity,
  findSimilarUsers,
  getRecommendations
};
