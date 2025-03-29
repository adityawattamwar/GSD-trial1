const Cart = require('../models/Cart');
const Product = require('../models/Product');

/**
 * @desc    Get shopping cart contents
 * @route   GET /api/cart
 * @access  Public
 * @green   Uses populate with field selection to minimize data transfer
 */
exports.getCart = async (req, res) => {
  try {
    // In a real app, we would get userId from auth middleware
    // For now, using a simple userId from query or headers
    const userId = req.query.userId || req.headers['user-id'] || 'guest-user';
    
    // Find active cart for user
    let cart = await Cart.findOne({ 
      user: userId, 
      active: true 
    }).populate({
      path: 'items.product',
      select: 'name price image carbonFootprint sustainabilityScore' // Only select needed fields
    });
    
    // If no cart exists, create new one
    if (!cart) {
      cart = new Cart({ user: userId, items: [] });
      await cart.save();
    }
    
    // Calculate total price and carbon footprint
    const totalPrice = await cart.calculateTotal();
    const carbonFootprint = await cart.calculateCarbonFootprint();
    
    // Count sustainable products in cart (for green metrics)
    const sustainableItemsCount = cart.items.filter(
      item => item.product.sustainabilityScore > 70
    ).length;
    
    res.json({
      success: true,
      data: {
        cart,
        totalPrice,
        totalItems: cart.items.reduce((total, item) => total + item.quantity, 0),
        greenMetrics: {
          carbonFootprint,
          sustainableItemsCount,
          greenDelivery: cart.greenDelivery,
          carbonOffset: cart.carbonOffset
        }
      }
    });
  } catch (error) {
    console.error('Error in getCart:', error);
    res.status(500).json({
      success: false,
      message: 'Server error retrieving cart',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc    Add product to cart
 * @route   POST /api/cart/add
 * @access  Public
 * @green   Optimizes database operations with findOneAndUpdate
 */
exports.addToCart = async (req, res) => {
  try {
    const { productId, quantity = 1, userId = 'guest-user' } = req.body;
    
    // Validate product exists
    const product = await Product.findById(productId);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
    // Validate quantity is positive
    if (quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Quantity must be greater than 0'
      });
    }
    
    // Find or create cart
    let cart = await Cart.findOne({ user: userId, active: true });
    
    if (!cart) {
      cart = new Cart({
        user: userId,
        items: [{ product: productId, quantity }]
      });
      await cart.save();
    } else {
      // Check if product already in cart
      const itemIndex = cart.items.findIndex(item => 
        item.product.toString() === productId
      );
      
      if (itemIndex > -1) {
        // Product exists in cart, update quantity
        cart.items[itemIndex].quantity += quantity;
      } else {
        // Product not in cart, add new item
        cart.items.push({ product: productId, quantity });
      }
      
      await cart.save();
    }
    
    // Get updated cart with populated product info
    cart = await Cart.findById(cart._id).populate({
      path: 'items.product',
      select: 'name price image carbonFootprint sustainabilityScore'
    });
    
    // Calculate total and carbon footprint
    const totalPrice = await cart.calculateTotal();
    const carbonFootprint = await cart.calculateCarbonFootprint();
    
    res.json({
      success: true,
      message: 'Product added to cart',
      data: {
        cart,
        totalPrice,
        totalItems: cart.items.reduce((total, item) => total + item.quantity, 0),
        greenMetrics: {
          carbonFootprint,
          greenDelivery: cart.greenDelivery,
          carbonOffset: cart.carbonOffset
        }
      }
    });
  } catch (error) {
    console.error('Error in addToCart:', error);
    
    // Check if error is due to invalid MongoDB ObjectId
    if (error.kind === 'ObjectId') {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID format'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error adding product to cart',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc    Remove product from cart
 * @route   DELETE /api/cart/remove/:id
 * @access  Public
 */
exports.removeFromCart = async (req, res) => {
  try {
    const productId = req.params.id;
    // In a real app, we would get userId from auth middleware
    const userId = req.query.userId || req.headers['user-id'] || 'guest-user';
    
    // Find cart
    const cart = await Cart.findOne({ user: userId, active: true });
    
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      });
    }
    
    // Remove item from cart
    const itemIndex = cart.items.findIndex(item => 
      item.product.toString() === productId
    );
    
    if (itemIndex > -1) {
      cart.items.splice(itemIndex, 1);
      await cart.save();
    } else {
      return res.status(404).json({
        success: false,
        message: 'Product not found in cart'
      });
    }
    
    // Get updated cart with populated product info
    const updatedCart = await Cart.findById(cart._id).populate({
      path: 'items.product',
      select: 'name price image carbonFootprint sustainabilityScore'
    });
    
    // Calculate total
    const totalPrice = await updatedCart.calculateTotal();
    const carbonFootprint = await updatedCart.calculateCarbonFootprint();
    
    res.json({
      success: true,
      message: 'Product removed from cart',
      data: {
        cart: updatedCart,
        totalPrice,
        totalItems: updatedCart.items.reduce((total, item) => total + item.quantity, 0),
        greenMetrics: {
          carbonFootprint,
          greenDelivery: updatedCart.greenDelivery,
          carbonOffset: updatedCart.carbonOffset
        }
      }
    });
  } catch (error) {
    console.error('Error in removeFromCart:', error);
    
    // Check if error is due to invalid MongoDB ObjectId
    if (error.kind === 'ObjectId') {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID format'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error removing product from cart',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc    Process checkout
 * @route   POST /api/cart/checkout
 * @access  Public
 * @green   Updates product purchase counts efficiently
 */
exports.checkout = async (req, res) => {
  try {
    // In a real app, we would get userId from auth middleware
    const userId = req.body.userId || req.headers['user-id'] || 'guest-user';
    const { greenDelivery = true, carbonOffset = false } = req.body;
    
    // Find cart
    let cart = await Cart.findOne({ user: userId, active: true }).populate('items.product');
    
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Cart is empty or not found'
      });
    }
    
    // Update green delivery and carbon offset options
    cart.greenDelivery = greenDelivery;
    cart.carbonOffset = carbonOffset;
    await cart.save();
    
    // Calculate totals
    const totalPrice = await cart.calculateTotal();
    const carbonFootprint = await cart.calculateCarbonFootprint();
    
    // Process order (in a real app, this would create an Order document)
    
    // Update product purchase counts (green practice: batch operations)
    const productUpdatePromises = cart.items.map(item => {
      return Product.findByIdAndUpdate(
        item.product._id,
        { $inc: { purchaseCount: item.quantity } },
        { new: true }
      );
    });
    
    await Promise.all(productUpdatePromises);
    
    // Calculate carbon saved based on delivery option
    const standardDeliveryFootprint = 2.0; // kg CO2e
    const greenDeliveryFootprint = 0.5; // kg CO2e
    const carbonSaved = greenDelivery ? 
      (standardDeliveryFootprint - greenDeliveryFootprint) : 0;
    
    // Calculate offset amount if carbon offset purchased
    const offsetAmount = carbonOffset ? carbonFootprint * 0.8 : 0;
    
    // Clear the cart (mark as inactive)
    cart.active = false;
    await cart.save();
    
    // Create a new empty cart for the user
    const newCart = new Cart({ user: userId });
    await newCart.save();
    
    res.json({
      success: true,
      message: 'Checkout completed successfully',
      data: {
        orderId: cart._id, // In real app, would be a new Order ID
        totalPrice,
        items: cart.items,
        greenMetrics: {
          carbonFootprint,
          carbonSaved: carbonSaved + offsetAmount,
          greenDelivery,
          carbonOffset,
          sustainableItemsCount: cart.items.filter(
            item => item.product.sustainabilityScore > 70
          ).length
        }
      }
    });
  } catch (error) {
    console.error('Error in checkout:', error);
    res.status(500).json({
      success: false,
      message: 'Server error processing checkout',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc    Update cart green delivery options
 * @route   PATCH /api/cart/green-options
 * @access  Public
 */
exports.updateGreenOptions = async (req, res) => {
  try {
    const userId = req.body.userId || req.headers['user-id'] || 'guest-user';
    const { greenDelivery, carbonOffset } = req.body;
    
    // Validate that at least one option is provided
    if (greenDelivery === undefined && carbonOffset === undefined) {
      return res.status(400).json({
        success: false,
        message: 'At least one green option must be provided'
      });
    }
    
    // Find cart
    const cart = await Cart.findOne({ user: userId, active: true });
    
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      });
    }
    
    // Update options
    if (greenDelivery !== undefined) {
      cart.greenDelivery = greenDelivery;
    }
    
    if (carbonOffset !== undefined) {
      cart.carbonOffset = carbonOffset;
    }
    
    await cart.save();
    
    // Calculate carbon footprint with new options
    await cart.populate('items.product');
    const carbonFootprint = await cart.calculateCarbonFootprint();
    
    res.json({
      success: true,
      message: 'Green options updated',
      data: {
        greenDelivery: cart.greenDelivery,
        carbonOffset: cart.carbonOffset,
        carbonFootprint
      }
    });
  } catch (error) {
    console.error('Error in updateGreenOptions:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating green options',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};