const User = require('../models/User');
const { generateToken, responseHelpers } = require('../utils/helpers');

/**
 * @desc    Register a new user
 * @route   POST /api/users/register
 * @access  Public
 */
const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return responseHelpers.error(res, 'User already exists', 400);
    }

    // Create new user
    const user = await User.create({
      name,
      email,
      password,
    });

    if (user) {
      // Generate JWT token
      const token = generateToken(user);

      return responseHelpers.success(res, {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token,
      }, 201);
    } else {
      return responseHelpers.error(res, 'Invalid user data', 400);
    }
  } catch (error) {
    return responseHelpers.error(res, error.message, 500);
  }
};

/**
 * @desc    Login user
 * @route   POST /api/users/login
 * @access  Public
 */
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return responseHelpers.error(res, 'Invalid email or password', 401);
    }

    // Check if password matches
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return responseHelpers.error(res, 'Invalid email or password', 401);
    }

    // Generate JWT token
    const token = generateToken(user);

    return responseHelpers.success(res, {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token,
    });
  } catch (error) {
    return responseHelpers.error(res, error.message, 500);
  }
};

/**
 * @desc    Get user profile
 * @route   GET /api/users/profile
 * @access  Private
 */
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return responseHelpers.error(res, 'User not found', 404);
    }

    return responseHelpers.success(res, {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    });
  } catch (error) {
    return responseHelpers.error(res, error.message, 500);
  }
};

/**
 * @desc    Update user profile
 * @route   PUT /api/users/profile
 * @access  Private
 */
const updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return responseHelpers.error(res, 'User not found', 404);
    }

    // Update user fields if provided
    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;
    
    // Update password if provided
    if (req.body.password) {
      user.password = req.body.password;
    }

    // Save updated user
    const updatedUser = await user.save();

    // Generate new token with updated info
    const token = generateToken(updatedUser);

    return responseHelpers.success(res, {
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      token,
    });
  } catch (error) {
    return responseHelpers.error(res, error.message, 500);
  }
};

/**
 * @desc    Delete user account
 * @route   DELETE /api/users/profile
 * @access  Private
 */
const deleteUserAccount = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return responseHelpers.error(res, 'User not found', 404);
    }

    await user.deleteOne();
    return responseHelpers.success(res, { message: 'User account deleted successfully' });
  } catch (error) {
    return responseHelpers.error(res, error.message, 500);
  }
};

module.exports = {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
  deleteUserAccount,
};
