/**
 * Content-Based Filtering Algorithm Implementation
 * 
 * This module implements content-based filtering to generate
 * personalized product recommendations based on product attributes
 * and user preferences.
 */

const Product = require('../models/Product');
const Interaction = require('../models/Interaction');
const logger = require('../utils/logger');

/**
 * Calculate similarity between two products based on their attributes
 * @param {Object} product1 - First product
 * @param {Object} product2 - Second product
 * @returns {Number} Similarity score between 0 and 1
 */
const calculateProductSimilarity = (product1, product2) => {
  try {
    let similarityScore = 0;
    let totalWeight = 0;
    
    // Category similarity (highest weight)
    const categoryWeight = 0.4;
    if (product1.category && product2.category && product1.category === product2.category) {
      similarityScore += categoryWeight;
    }
    totalWeight += categoryWeight;
    
    // Tags similarity
    const tagsWeight = 0.3;
    if (product1.tags && product2.tags && product1.tags.length > 0 && product2.tags.length > 0) {
      const tags1 = new Set(product1.tags);
      const tags2 = new Set(product2.tags);
      const commonTags = [...tags1].filter(tag => tags2.has(tag));
      const unionTags = new Set([...tags1, ...tags2]);
      
      const tagSimilarity = unionTags.size > 0 ? commonTags.length / unionTags.size : 0;
      similarityScore += tagSimilarity * tagsWeight;
    }
    totalWeight += tagsWeight;
    
    // Price range similarity
    const priceWeight = 0.2;
    if (product1.price !== undefined && product2.price !== undefined) {
      // Calculate price similarity based on percentage difference
      const maxPrice = Math.max(product1.price, product2.price);
      const minPrice = Math.min(product1.price, product2.price);
      
      // If prices are very close, high similarity
      if (maxPrice === 0) {
        similarityScore += priceWeight;
      } else {
        const priceDiff = (maxPrice - minPrice) / maxPrice;
        const priceSimilarity = Math.max(0, 1 - priceDiff);
        similarityScore += priceSimilarity * priceWeight;
      }
    }
    totalWeight += priceWeight;
    
    // Name and description similarity (basic text matching)
    const textWeight = 0.1;
    if (product1.name && product2.name) {
      // Simple word overlap for name
      const words1 = product1.name.toLowerCase().split(/\W+/).filter(Boolean);
      const words2 = product2.name.toLowerCase().split(/\W+/).filter(Boolean);
      const commonWords = words1.filter(word => words2.includes(word));
      
      const nameSimilarity = Math.min(words1.length, words2.length) > 0 ? 
        commonWords.length / Math.min(words1.length, words2.length) : 0;
      
      similarityScore += nameSimilarity * textWeight;
    }
    totalWeight += textWeight;
    
    // Normalize score based on weights used
    return totalWeight > 0 ? similarityScore / totalWeight : 0;
  } catch (error) {
    logger.error(`Error calculating product similarity: ${error.message}`);
    return 0;
  }
};

/**
 * Get user preferences based on interaction history
 * @param {String} userId - User ID
 * @returns {Promise<Object>} User preference profile
 */
const getUserPreferences = async (userId) => {
  try {
    // Get user interactions
    const interactions = await Interaction.find({ 
      user_id: userId,
      interaction_type: { $in: ['view', 'click', 'like', 'purchase'] }
    }).sort({ timestamp: -1 });
    
    if (interactions.length === 0) {
      return null;
    }
    
    // Get products the user has interacted with
    const productIds = interactions.map(interaction => interaction.product_id);
    const products = await Product.find({ _id: { $in: productIds } });
    
    // Create a map of product ID to product
    const productMap = {};
    products.forEach(product => {
      productMap[product._id.toString()] = product;
    });
    
    // Create a map of product ID to interaction type
    const interactionMap = {};
    interactions.forEach(interaction => {
      const productId = interaction.product_id.toString();
      
      // Assign weights to different interaction types
      let weight = 1;
      if (interaction.interaction_type === 'purchase') {
        weight = 4;
      } else if (interaction.interaction_type === 'like') {
        weight = 3;
      } else if (interaction.interaction_type === 'click') {
        weight = 2;
      }
      
      // If multiple interactions with same product, take the highest weight
      if (!interactionMap[productId] || interactionMap[productId] < weight) {
        interactionMap[productId] = weight;
      }
    });
    
    // Build user preference profile
    const preferences = {
      categories: {},
      tags: {},
      priceRanges: {
        low: 0,
        medium: 0,
        high: 0
      },
      interactedProducts: new Set(Object.keys(interactionMap))
    };
    
    // Process each product to build preference profile
    Object.keys(interactionMap).forEach(productId => {
      const product = productMap[productId];
      const weight = interactionMap[productId];
      
      if (!product) return;
      
      // Category preferences
      if (product.category) {
        preferences.categories[product.category] = 
          (preferences.categories[product.category] || 0) + weight;
      }
      
      // Tag preferences
      if (product.tags && Array.isArray(product.tags)) {
        product.tags.forEach(tag => {
          preferences.tags[tag] = (preferences.tags[tag] || 0) + weight;
        });
      }
      
      // Price range preferences
      if (product.price !== undefined) {
        if (product.price < 50) {
          preferences.priceRanges.low += weight;
        } else if (product.price < 200) {
          preferences.priceRanges.medium += weight;
        } else {
          preferences.priceRanges.high += weight;
        }
      }
    });
    
    return preferences;
  } catch (error) {
    logger.error(`Error getting user preferences: ${error.message}`);
    return null;
  }
};

/**
 * Get similar products based on a reference product
 * @param {String} productId - Reference product ID
 * @param {Number} limit - Maximum number of similar products to return
 * @returns {Promise<Array>} Array of similar product IDs
 */
const getSimilarProducts = async (productId, limit = 5) => {
  try {
    // Get reference product
    const referenceProduct = await Product.findById(productId);
    
    if (!referenceProduct) {
      return [];
    }
    
    // Get all other products
    const allProducts = await Product.find({ _id: { $ne: productId } });
    
    // Calculate similarity for each product
    const similarityScores = [];
    
    for (const product of allProducts) {
      const similarity = calculateProductSimilarity(referenceProduct, product);
      
      if (similarity > 0) {
        similarityScores.push({
          productId: product._id,
          similarity
        });
      }
    }
    
    // Sort by similarity (descending) and limit results
    return similarityScores
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit)
      .map(item => item.productId);
  } catch (error) {
    logger.error(`Error finding similar products: ${error.message}`);
    return [];
  }
};

/**
 * Generate product recommendations based on content-based filtering
 * @param {String} userId - Target user ID
 * @param {Number} limit - Maximum number of recommendations to return
 * @returns {Promise<Array>} Array of recommended product IDs
 */
const getRecommendations = async (userId, limit = 10) => {
  try {
    // Get user preferences
    const preferences = await getUserPreferences(userId);
    
    if (!preferences) {
      // Fall back to trending products if no preferences found
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
    
    // Get all products the user hasn't interacted with
    const allProducts = await Product.find({
      _id: { $nin: Array.from(preferences.interactedProducts) }
    });
    
    // Score each product based on user preferences
    const scoredProducts = [];
    
    for (const product of allProducts) {
      let score = 0;
      
      // Category score
      if (product.category && preferences.categories[product.category]) {
        score += preferences.categories[product.category] * 0.4;
      }
      
      // Tags score
      if (product.tags && Array.isArray(product.tags)) {
        let tagScore = 0;
        product.tags.forEach(tag => {
          if (preferences.tags[tag]) {
            tagScore += preferences.tags[tag];
          }
        });
        score += tagScore * 0.3;
      }
      
      // Price range score
      if (product.price !== undefined) {
        let priceScore = 0;
        if (product.price < 50 && preferences.priceRanges.low > 0) {
          priceScore = preferences.priceRanges.low;
        } else if (product.price < 200 && preferences.priceRanges.medium > 0) {
          priceScore = preferences.priceRanges.medium;
        } else if (preferences.priceRanges.high > 0) {
          priceScore = preferences.priceRanges.high;
        }
        score += priceScore * 0.2;
      }
      
      if (score > 0) {
        scoredProducts.push({
          productId: product._id,
          score
        });
      }
    }
    
    // Sort by score (descending) and limit results
    return scoredProducts
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(item => item.productId);
  } catch (error) {
    logger.error(`Error generating content-based recommendations: ${error.message}`);
    return [];
  }
};

module.exports = {
  calculateProductSimilarity,
  getUserPreferences,
  getSimilarProducts,
  getRecommendations
};
