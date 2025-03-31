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
 * @route   GET /api/orders/stats
 * @desc    Get user order statistics
 * @access  Private
 */
router.get('/stats', protect, orderController.getMyOrderStats);

/**
 * @route   GET /api/orders/:id/sustainability
 * @desc    Get order sustainability metrics
 * @access  Private
 */
router.get('/:id/sustainability', protect, orderController.getOrderSustainabilityMetrics);

module.exports = router;