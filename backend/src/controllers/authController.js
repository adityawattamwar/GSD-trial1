/**
 * Authentication Controller
 * 
 * This controller handles user authentication with green software practices:
 * - Efficient token generation and validation
 * - Optimized database queries
 * - Secure password handling
 * - Resource-efficient error handling
 */

const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');

// JWT secret key (should be in environment variables in production)
const JWT_SECRET = process.env.JWT_SECRET || 'cosmic-space-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// Generate JWT token (green practice: using efficient algorithm)
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
    algorithm: 'HS256' // Most efficient JWT algorithm
  });
};

/**
 * Register a new user
 * 
 * Green practices:
 * - Input validation before database operations
 * - Optimized query with lean() for efficiency
 * - Proper error handling to prevent resource leaks
 */
exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    console.log('📥 Incoming Registration Request:', { name, email, password });

    // Check if required fields are present
    if (!email || !password || !name) {
      console.log('❌ Missing required fields');
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }

    // Check for existing user
    const existingUser = await User.findOne({ 
      $or: [{ email: email.toLowerCase() }, { name }] 
    }).lean();

    if (existingUser) {
      console.log('❌ User already exists:', existingUser);
      return res.status(400).json({
        success: false,
        message: existingUser.email === email.toLowerCase() 
          ? 'Email already registered' 
          : 'name already taken'
      });
    }

    // Create and save new user
    console.log('✅ Creating new user...');
    const user = new User({
      username:name,
      email: email.toLowerCase(),
      password, // Check if hashing is enabled in the User model
      preferences: {
        theme: 'system',
        enableEnergyEfficiency: true,
        dataConservation: true
      },
      lastLogin: new Date()
    });

    await user.save();
    console.log('✅ User successfully registered:', user);

    // Generate JWT token
    const token = generateToken(user._id);
    console.log('🔑 Generated JWT Token:', token);

    return res.status(201).json({
      success: true,
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        preferences: user.preferences
      }
    });

  } catch (error) {
    console.error('🚨 Registration error:', error);

    // Return appropriate error response
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid input data',
        errors: Object.values(error.errors).map(err => err.message)
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Server error during registration'
    });
  }
};
/**
 * Login user
 * 
 * Green practices:
 * - Using static method for optimized authentication
 * - Efficient token generation
 * - Minimized response payload
 */
exports.login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array(),
        message: 'Validation failed'
      });
    }

    const { email, password } = req.body;

    // Add basic validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required',
        errors: [
          { field: !email ? 'email' : 'password', msg: 'Field is required' }
        ]
      });
    }

    // Find user by credentials (using optimized static method)
    const user = await User.findByCredentials(email, password);
    
    // Add login attempts tracking (you'll need to add this field to User model)
    if (!user) {
      await User.findOneAndUpdate(
        { email: email.toLowerCase() },
        { $inc: { loginAttempts: 1 } }
      );
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Reset login attempts on successful login
    user.loginAttempts = 0;
    await user.save();

    // Generate token
    const token = generateToken(user._id);

    // Update lastLogin timestamp (async, don't wait for completion)
    User.findByIdAndUpdate(user._id, { 
      $set: { lastLogin: new Date() } 
    }).exec();

    // Send response with minimal data
    res.status(200).json({
      success: true,
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        preferences: user.preferences
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login'
    });
  }
};

/**
 * Get current user profile
 * 
 * Green practices:
 * - Field projection to limit data transfer
 * - Lean query for efficiency
 */
exports.getProfile = async (req, res) => {
  try {
    // User is already attached by auth middleware
    const user = await User.findById(req.user.id)
      .select('-password')
      .lean();
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error retrieving profile'
    });
  }
};

/**
 * Update user profile
 * 
 * Green practices:
 * - Validating before database operations
 * - Only updating necessary fields
 */
exports.updateProfile = async (req, res) => {
  try {
    const { name, email, preferences } = req.body;
    
    // Build update object with only provided fields
    const updateFields = {};
    if (name) updateFields.name = name;
    if (email) updateFields.email = email;
    if (preferences) {
      // Only update provided preference fields
      updateFields.preferences = {};
      const userPrefs = await User.findById(req.user.id)
        .select('preferences')
        .lean();
      
      // Merge existing and new preferences
      updateFields.preferences = {
        ...userPrefs.preferences,
        ...preferences
      };
    }

    // Update with optimized query ($set only what changed)
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: updateFields },
      { new: true, runValidators: true }
    ).select('-password');

    res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating profile'
    });
  }
};

/**
 * Change password
 * 
 * Green practices:
 * - Validating before expensive operations
 * - Proper error handling
 */
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    // Validate request
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required'
      });
    }

    // Get user with password
    const user = await User.findById(req.user.id);
    
    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password updated successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error changing password'
    });
  }
};

/**
 * Logout (client-side) - Backend doesn't need to do much
 * as JWT is stateless, client just removes the token
 * 
 * In a production app, we might implement token blacklisting,
 * but that would require Redis or similar for efficiency
 */
exports.logout = (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Logged out successfully'
  });
};