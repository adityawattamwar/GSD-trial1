/**
 * Authentication Middleware
 * 
 * This middleware verifies JWT tokens for protected routes with green software practices:
 * - Efficient token verification
 * - Minimal memory usage
 * - Proper error handling
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User');

// JWT secret key (should be in environment variables in production)
const JWT_SECRET = process.env.JWT_SECRET || 'cosmic-space-secret-key';

/**
 * Protect routes - Verify JWT token and attach user to request
 * 
 * Green practices:
 * - Only fetches necessary user data
 * - Uses lean queries for efficiency
 * - Proper error handling
 */
exports.protect = async (req, res, next) => {
  try {
    let token;
    
    // Check if token exists in Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      // Extract token from Bearer header
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.token) {
      // Alternative: Check cookies (if cookie-based auth is used)
      token = req.cookies.token;
    }

    // If no token found, return unauthorized
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized, no token provided'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);

    // Attach user ID to request (minimal fetch with lean)
    req.user = {
      id: decoded.id
    };

    // Optionally fetch user data for additional checks
    // Uncomment if you need user data in most protected routes
    /*
    const user = await User.findById(decoded.id)
      .select('_id username email role')
      .lean();
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }
    
    req.user = user;
    */

    next();
  } catch (error) {
    // Handle specific JWT errors to provide better feedback
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired'
      });
    }
    
    console.error('Auth middleware error:', error);
    return res.status(401).json({
      success: false,
      message: 'Not authorized'
    });
  }
};

/**
 * Optional middleware to check if user is authenticated, 
 * but allow the request to proceed even if not
 * 
 * Useful for routes that work differently for logged-in vs anonymous users
 */
exports.optionalAuth = async (req, res, next) => {
  try {
    let token;
    
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    // If no token, just continue without setting user
    if (!token) {
      return next();
    }

    // Verify token and attach user
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = {
      id: decoded.id
    };
    
    next();
  } catch (error) {
    // For optional auth, just continue without setting user on error
    next();
  }
};

/**
 * Admin only middleware - Verify user has admin role
 * 
 * Use after protect middleware
 */
exports.adminOnly = async (req, res, next) => {
  try {
    // User must already be attached by protect middleware
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized'
      });
    }

    // Check if user has admin role
    const user = await User.findById(req.user.id)
      .select('role')
      .lean();
    
    if (!user || user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized as admin'
      });
    }

    next();
  } catch (error) {
    console.error('Admin middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error checking permissions'
    });
  }
};