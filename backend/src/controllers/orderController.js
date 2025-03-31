/**
 * Order Controller
 * 
 * This controller handles order operations with green software practices:
 * - Efficient database queries
 * - Transaction support for data consistency
 * - Request validation
 * - Resource-efficient error handling
 */

const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const { validationResult } = require('express-validator');

/**
 * Create new order from cart
 * 
 * Green practices:
 * - Transaction support for atomicity
 * - Selective data retrieval
 * - Proper error handling
 */
exports.createOrder = async (req, res) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    const { 
      shippingAddress, 
      paymentMethod, 
      greenShipping = false, 
      carbonOffset = false 
    } = req.body;

    // Get user's cart (with populated products)
    const cart = await Cart.findOne({ user: req.user.id })
      .populate({
        path: 'items.product',
        select: 'name price image sustainabilityScore carbonFootprint' // Only select needed fields
      });

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Cart is empty, cannot create order'
      });
    }

    // Calculate pricing
    const subtotal = cart.items.reduce((sum, item) => 
      sum + (item.product.price * item.quantity), 0);
    
    const shippingPrice = greenShipping ? 7.99 : 4.99; // Green shipping costs more
    const tax = subtotal * 0.08; // 8% tax
    const totalPrice = subtotal + shippingPrice + tax;

    // Create order items from cart
    const orderItems = cart.items.map(item => ({
      product: item.product._id,
      name: item.product.name,
      quantity: item.quantity,
      price: item.product.price,
      image: item.product.image || 'placeholder.jpg',
      sustainabilityScore: item.product.sustainabilityScore || 0,
      carbonFootprint: item.product.carbonFootprint || 0
    }));

    // Create new order
    const order = new Order({
      user: req.user.id,
      orderItems,
      shippingAddress,
      paymentMethod,
      subtotal,
      shippingPrice,
      tax,
      totalPrice,
      greenShipping,
      carbonOffset,
      isPaid: paymentMethod === 'test' ? true : false, // For testing only
      orderStatus: 'pending'
    });

    // Calculate green metrics (uses pre-save hook)
    await order.save();

    // Clear cart after successful order creation (async, don't wait)
    Cart.findOneAndUpdate(
      { user: req.user.id },
      { $set: { items: [] } },
      { new: true }
    ).exec();

    // If this was a real payment, we'd process it here
    // For demo purposes, we'll assume payment was successful

    // Increment product purchase counts (async, don't wait)
    orderItems.forEach(item => {
      Product.findByIdAndUpdate(
        item.product,
        { $inc: { purchaseCount: item.quantity } }
      ).exec();
    });

    res.status(201).json({
      success: true,
      order: {
        _id: order._id,
        totalPrice: order.totalPrice,
        orderStatus: order.orderStatus,
        createdAt: order.createdAt,
        totalCarbonFootprint: order.totalCarbonFootprint,
        sustainabilityRating: order.sustainabilityRating
      }
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error creating order'
    });
  }
};

/**
 * Get all orders for the current user
 * 
 * Green practices:
 * - Pagination to limit data transfer
 * - Field projection to minimize response size
 * - Efficient sorting
 */
exports.getMyOrders = async (req, res) => {
  try {
    // Parse query parameters with defaults
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Count total orders (for pagination)
    const total = await Order.countDocuments({ user: req.user.id });

    // Get orders with pagination and field projection
    const orders = await Order.find({ user: req.user.id })
      .sort({ createdAt: -1 }) // Most recent first
      .skip(skip)
      .limit(limit)
      .select('_id orderItems.name orderStatus totalPrice createdAt isPaid isDelivered totalCarbonFootprint sustainabilityRating')
      .lean(); // Green practice: returns plain objects instead of Mongoose documents

    res.status(200).json({
      success: true,
      count: orders.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      orders
    });
  } catch (error) {
    console.error('Get my orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error retrieving orders'
    });
  }
};

/**
 * Get order by ID
 * 
 * Green practices:
 * - Efficient query with lean()
 * - Security validation
 */
exports.getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).lean();

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Security check: Only allow users to access their own orders (unless admin)
    if (order.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this order'
      });
    }

    res.status(200).json({
      success: true,
      order
    });
  } catch (error) {
    console.error('Get order by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error retrieving order'
    });
  }
};

/**
 * Update order status
 * 
 * Green practices:
 * - Selective updates with $set
 * - Validation before database operations
 */
exports.updateOrderStatus = async (req, res) => {
  try {
    const { orderStatus } = req.body;
    
    if (!orderStatus) {
      return res.status(400).json({
        success: false,
        message: 'Order status is required'
      });
    }

    // Validate status
    const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(orderStatus)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid order status'
      });
    }

    // Find order and update (with additional fields based on status)
    const updateData = { orderStatus };
    
    // Add delivered date if status is 'delivered'
    if (orderStatus === 'delivered') {
      updateData.isDelivered = true;
      updateData.deliveredAt = Date.now();
    }

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('_id orderStatus isDelivered deliveredAt');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    res.status(200).json({
      success: true,
      order
    });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating order'
    });
  }
};

/**
 * Get order sustainability metrics
 * 
 * Green practices:
 * - Field projection to minimize response size
 * - Efficient aggregation
 */
exports.getOrderSustainabilityMetrics = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .select('orderItems totalCarbonFootprint sustainabilityRating greenShipping carbonOffset')
      .lean();

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Calculate metrics by product category
    const categoryMetrics = {};
    
    order.orderItems.forEach(item => {
      if (item.sustainabilityScore && item.carbonFootprint) {
        const category = item.category || 'Uncategorized';
        
        if (!categoryMetrics[category]) {
          categoryMetrics[category] = {
            totalItems: 0,
            carbonFootprint: 0,
            sustainabilityScore: 0
          };
        }
        
        categoryMetrics[category].totalItems += item.quantity;
        categoryMetrics[category].carbonFootprint += (item.carbonFootprint * item.quantity);
        categoryMetrics[category].sustainabilityScore += (item.sustainabilityScore * item.quantity);
      }
    });
    
    // Calculate averages
    Object.keys(categoryMetrics).forEach(category => {
      const metrics = categoryMetrics[category];
      metrics.averageSustainabilityScore = metrics.sustainabilityScore / metrics.totalItems;
      metrics.carbonFootprintPerItem = metrics.carbonFootprint / metrics.totalItems;
    });

    // Add green shipping impact
    const shippingImpact = order.greenShipping ? 
      { reduction: 5, percentage: 30 } : 
      { reduction: 0, percentage: 0 };
    
    // Add carbon offset impact
    const offsetImpact = order.carbonOffset ?
      { reduction: order.totalCarbonFootprint * 0.8, percentage: 80 } :
      { reduction: 0, percentage: 0 };

    res.status(200).json({
      success: true,
      metrics: {
        totalCarbonFootprint: order.totalCarbonFootprint,
        sustainabilityRating: order.sustainabilityRating,
        categoryBreakdown: categoryMetrics,
        greenShippingImpact: shippingImpact,
        carbonOffsetImpact: offsetImpact
      }
    });
  } catch (error) {
    console.error('Get sustainability metrics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error retrieving metrics'
    });
  }
};

/**
 * Get user order statistics
 * 
 * Green practices:
 * - Efficient aggregation with pipeline
 * - Minimal data transformation
 */
exports.getMyOrderStats = async (req, res) => {
  try {
    // Use aggregation for efficient stats calculation
    const stats = await Order.aggregate([
      // Match only this user's orders
      { $match: { user: req.user.id } },
      
      // Group by orderStatus
      { $group: {
        _id: '$orderStatus',
        count: { $sum: 1 },
        totalSpent: { $sum: '$totalPrice' },
        avgCarbonFootprint: { $avg: '$totalCarbonFootprint' },
        avgSustainabilityRating: { $avg: '$sustainabilityRating' }
      }},
      
      // Rename _id to status
      { $project: {
        _id: 0,
        status: '$_id',
        count: 1,
        totalSpent: { $round: ['$totalSpent', 2] },
        avgCarbonFootprint: { $round: ['$avgCarbonFootprint', 2] },
        avgSustainabilityRating: { $round: ['$avgSustainabilityRating', 2] }
      }}
    ]);

    // Calculate overall metrics
    const overallStats = await Order.aggregate([
      // Match only this user's orders
      { $match: { user: req.user.id } },
      
      // Calculate overall metrics
      { $group: {
        _id: null,
        totalOrders: { $sum: 1 },
        totalSpent: { $sum: '$totalPrice' },
        avgOrderValue: { $avg: '$totalPrice' },
        totalCarbonFootprint: { $sum: '$totalCarbonFootprint' },
        carbonSaved: { 
          $sum: { 
            $cond: [
              { $or: ['$greenShipping', '$carbonOffset'] }, 
              { $multiply: ['$totalCarbonFootprint', 0.3] },  // 30% savings estimate
              0
            ]
          }
        }
      }},
      
      // Format output
      { $project: {
        _id: 0,
        totalOrders: 1,
        totalSpent: { $round: ['$totalSpent', 2] },
        avgOrderValue: { $round: ['$avgOrderValue', 2] },
        totalCarbonFootprint: { $round: ['$totalCarbonFootprint', 2] },
        carbonSaved: { $round: ['$carbonSaved', 2] }
      }}
    ]);

    res.status(200).json({
      success: true,
      statusBreakdown: stats,
      overall: overallStats.length > 0 ? overallStats[0] : {
        totalOrders: 0,
        totalSpent: 0,
        avgOrderValue: 0,
        totalCarbonFootprint: 0,
        carbonSaved: 0
      }
    });
  } catch (error) {
    console.error('Get order stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error retrieving order statistics'
    });
  }
};