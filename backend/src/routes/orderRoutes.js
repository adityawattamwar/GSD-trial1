/**
 * Order Routes
 * 
 * These routes handle order operations with green software practices:
 * - Authentication protection
 * - Request validation
 * - Proper route organization
 */

const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const orderController = require('../controllers/orderController');
const { protect } = require('../middleware/authMiddleware');
const Order = require('../models/Order');

/**
 * @route   POST /api/orders
 * @desc    Create new order from cart
 * @access  Private
 * 
 * Green practice: Validate input before processing
 */
router.post(
  '/',
  protect,
  [
    check('shippingAddress', 'Shipping address is required')
      .not()
      .isEmpty()
      .isObject(),
    
    check('shippingAddress.street', 'Street is required')
      .not()
      .isEmpty(),
    
    check('shippingAddress.city', 'City is required')
      .not()
      .isEmpty(),
    
    check('shippingAddress.state', 'State is required')
      .not()
      .isEmpty(),
    
    check('shippingAddress.zipCode', 'Zip code is required')
      .not()
      .isEmpty(),
    
    check('paymentMethod', 'Payment method is required')
      .not()
      .isEmpty()
  ],
  orderController.createOrder
);

/**
 * @route   GET /api/orders
 * @desc    Get all orders for the current user
 * @access  Private
 */
router.get('/', protect, orderController.getMyOrders);

/**
 * @route   GET /api/orders/admin/count
 * @desc    Get direct order count from database for admin
 * @access  Public (for admin dashboard)
 */
router.get('/admin/count', async (req, res) => {
  try {
    const count = await Order.countDocuments();
    res.status(200).json({ success: true, count });
  } catch (error) {
    console.error('Error counting orders:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

/**
 * @route   GET /api/orders/admin
 * @desc    Get all orders (admin route without auth)
 * @access  Public (for admin interface)
 */
router.get('/admin', async (req, res) => {
  try {
    const orders = await Order.find()
      .populate('user', 'username email')
      .sort({ createdAt: -1 })
      .lean();
    
    res.status(200).json({
      success: true,
      orders
    });
  } catch (error) {
    console.error('Get all orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error retrieving orders'
    });
  }
});

/**
 * @route   GET /api/orders/stats
 * @desc    Get user order statistics
 * @access  Private
 */
router.get('/stats', protect, orderController.getMyOrderStats);

/**
 * @route   GET /api/orders/:id
 * @desc    Get order by ID
 * @access  Private
 */
router.get('/:id', protect, orderController.getOrderById);

/**
 * @route   PATCH /api/orders/:id/status
 * @desc    Update order status
 * @access  Private (admin only in a real app)
 */
router.patch(
  '/:id/status',
  protect,
  [
    check('orderStatus', 'Order status is required')
      .not()
      .isEmpty()
      .isIn(['pending', 'processing', 'shipped', 'delivered', 'cancelled'])
  ],
  orderController.updateOrderStatus
);

/**
 * @route   GET /api/orders/:id/sustainability
 * @desc    Get order sustainability metrics
 * @access  Private
 */
router.get('/:id/sustainability', protect, orderController.getOrderSustainabilityMetrics);

module.exports = router;