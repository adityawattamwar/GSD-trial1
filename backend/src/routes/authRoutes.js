/**
 * Authentication Routes
 * 
 * These routes handle user authentication with green software practices:
 * - Efficient middleware composition
 * - Request validation before processing
 * - Proper route organization
 */

const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const authController = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const User = require('../models/User'); // Assuming User model is defined

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 * 
 * Green practice: Validate input before processing
 */
router.post(
  '/register',
  [
    check('name', 'name is required')
      .not().isEmpty()
      .trim()
      .isLength({ min: 3, max: 30 })
      .withMessage('name must be between 3 and 30 characters'),
    
    check('email', 'Please include a valid email')
      .isEmail()
      .normalizeEmail()
      .custom(async (email) => {
        const user = await User.findOne({ email: email.toLowerCase() });
        if (user) {
          throw new Error('Email already in use');
        }
        return true;
      }),
    
    check('password', 'Password is required')
      .not().isEmpty()
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters long')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
      .withMessage('Password must contain at least 8 characters, one uppercase, one lowercase, one number and one special character')
  ],
  authController.register
);

/**
 * @route   POST /api/auth/login
 * @desc    Login user and get token
 * @access  Public
 */
router.post(
  '/login',
  [
    check('email', 'Please include a valid email')
      .isEmail()
      .withMessage('Please provide a valid email')
      .normalizeEmail(),
    check('password', 'Password is required')
      .not().isEmpty()
      .withMessage('Password is required')
  ],
  authController.login
);

/**
 * @route   GET /api/auth/profile
 * @desc    Get user profile
 * @access  Private
 */
router.get('/profile', protect, authController.getProfile);

/**
 * @route   PUT /api/auth/profile
 * @desc    Update user profile
 * @access  Private
 */
router.put(
  '/profile',
  protect, 
  [
    check('name', 'name must be at least 3 characters')
      .optional()
      .isLength({ min: 3, max: 30 }),
    
    check('email', 'Please include a valid email')
      .optional()
      .isEmail()
  ],
  authController.updateProfile
);

/**
 * @route   PUT /api/auth/change-password
 * @desc    Change user password
 * @access  Private
 */
router.put(
  '/change-password',
  protect,
  [
    check('currentPassword', 'Current password is required').exists(),
    check('newPassword', 'New password must be at least 8 characters long')
      .isLength({ min: 8 })
  ],
  authController.changePassword
);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user (client-side)
 * @access  Private
 */
router.post('/logout', protect, authController.logout);

/**
 * @route   GET /api/auth/check
 * @desc    Check if user is authenticated
 * @access  Private
 */
router.get('/check', protect, (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Token is valid',
    userId: req.user.id
  });
});

module.exports = router;