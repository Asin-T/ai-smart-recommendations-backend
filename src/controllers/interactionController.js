const Interaction = require('../models/Interaction');
const { responseHelpers, getPagination } = require('../utils/helpers');

/**
 * @desc    Record a user interaction
 * @route   POST /api/interactions
 * @access  Private
 */
const recordInteraction = async (req, res) => {
  try {
    const { product_id, interaction_type, metadata = {} } = req.body;
    const user_id = req.user._id;

    const interaction = await Interaction.create({
      user_id,
      product_id,
      interaction_type,
      metadata,
      timestamp: new Date()
    });

    return responseHelpers.success(res, interaction, 201);
  } catch (error) {
    return responseHelpers.error(res, error.message, 500);
  }
};

/**
 * @desc    Get interactions by user ID
 * @route   GET /api/interactions/user/:userId
 * @access  Private/Admin
 */
const getInteractionsByUser = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const { skip, limit: limitNum } = getPagination(page, limit);
    
    const interactions = await Interaction.find({ user_id: req.params.userId })
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limitNum)
      .populate('product_id', 'name category price image_url');
    
    const total = await Interaction.countDocuments({ user_id: req.params.userId });
    
    return responseHelpers.success(res, {
      interactions,
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
 * @desc    Get interactions by product ID
 * @route   GET /api/interactions/product/:productId
 * @access  Private/Admin
 */
const getInteractionsByProduct = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const { skip, limit: limitNum } = getPagination(page, limit);
    
    const interactions = await Interaction.find({ product_id: req.params.productId })
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limitNum)
      .populate('user_id', 'name email');
    
    const total = await Interaction.countDocuments({ product_id: req.params.productId });
    
    return responseHelpers.success(res, {
      interactions,
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
 * @desc    Get interaction statistics
 * @route   GET /api/interactions/stats
 * @access  Private/Admin
 */
const getInteractionStats = async (req, res) => {
  try {
    // Get total interactions count
    const totalInteractions = await Interaction.countDocuments();
    
    // Get interactions by type
    const interactionsByType = await Interaction.aggregate([
      {
        $group: {
          _id: '$interaction_type',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);
    
    // Get most interacted products
    const mostInteractedProducts = await Interaction.aggregate([
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
        $limit: 10
      },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'product'
        }
      },
      {
        $unwind: '$product'
      },
      {
        $project: {
          _id: 1,
          count: 1,
          'product.name': 1,
          'product.category': 1
        }
      }
    ]);
    
    // Get most active users
    const mostActiveUsers = await Interaction.aggregate([
      {
        $group: {
          _id: '$user_id',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      },
      {
        $limit: 10
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $unwind: '$user'
      },
      {
        $project: {
          _id: 1,
          count: 1,
          'user.name': 1,
          'user.email': 1
        }
      }
    ]);
    
    return responseHelpers.success(res, {
      totalInteractions,
      interactionsByType,
      mostInteractedProducts,
      mostActiveUsers
    });
  } catch (error) {
    return responseHelpers.error(res, error.message, 500);
  }
};

module.exports = {
  recordInteraction,
  getInteractionsByUser,
  getInteractionsByProduct,
  getInteractionStats
};
