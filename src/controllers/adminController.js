const Admin = require('../models/Admin');
const { generateToken, responseHelpers } = require('../utils/helpers');

/**
 * @desc    Admin login
 * @route   POST /api/admin/login
 * @access  Public
 */
const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find admin by email
    const admin = await Admin.findOne({ email }).select('+password');
    if (!admin) {
      return responseHelpers.error(res, 'Invalid email or password', 401);
    }

    // Check if password matches
    const isMatch = await admin.comparePassword(password);
    if (!isMatch) {
      return responseHelpers.error(res, 'Invalid email or password', 401);
    }

    // Update last login time
    admin.last_login = new Date();
    await admin.save();

    // Generate JWT token
    const token = generateToken(admin);

    return responseHelpers.success(res, {
      _id: admin._id,
      name: admin.name,
      email: admin.email,
      last_login: admin.last_login,
      token,
    });
  } catch (error) {
    return responseHelpers.error(res, error.message, 500);
  }
};

/**
 * @desc    Get dashboard statistics
 * @route   GET /api/admin/dashboard
 * @access  Private/Admin
 */
const getDashboardStats = async (req, res) => {
  try {
    const User = require('../models/User');
    const Product = require('../models/Product');
    const Interaction = require('../models/Interaction');
    
    // Get user count
    const userCount = await User.countDocuments();
    
    // Get product count
    const productCount = await Product.countDocuments();
    
    // Get interaction count
    const interactionCount = await Interaction.countDocuments();
    
    // Get recent interactions
    const recentInteractions = await Interaction.find()
      .sort({ timestamp: -1 })
      .limit(10)
      .populate('user_id', 'name email')
      .populate('product_id', 'name category price');
    
    // Get interaction counts by type
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
    
    return responseHelpers.success(res, {
      userCount,
      productCount,
      interactionCount,
      recentInteractions,
      interactionsByType
    });
  } catch (error) {
    return responseHelpers.error(res, error.message, 500);
  }
};

/**
 * @desc    Get all users
 * @route   GET /api/admin/users
 * @access  Private/Admin
 */
const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const { skip, limit: limitNum } = require('../utils/helpers').getPagination(page, limit);
    
    const User = require('../models/User');
    const users = await User.find()
      .skip(skip)
      .limit(limitNum)
      .sort({ created_at: -1 });
    
    const total = await User.countDocuments();
    
    return responseHelpers.success(res, {
      users,
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

module.exports = {
  loginAdmin,
  getDashboardStats,
  getAllUsers,
};
