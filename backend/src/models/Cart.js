const mongoose = require('mongoose');

/**
 * CartItem Schema - defines structure for items in a cart
 * Green practice: Store only references to products not duplicated data
 */
const cartItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: [1, 'Quantity cannot be less than 1'],
    default: 1
  }
}, {
  timestamps: true
});

/**
 * Cart Schema - defines structure for shopping cart data in MongoDB
 * Green practice: Efficient schema design with minimal duplication
 */
const cartSchema = new mongoose.Schema({
  user: {
    type: String,
    required: true,
    description: 'User identifier (could be ObjectId reference in a real auth system)'
  },
  items: [cartItemSchema],
  // Green practice: Track if this is a green delivery option
  greenDelivery: {
    type: Boolean,
    default: true,
    description: 'Indicates if user selected eco-friendly delivery option'
  },
  // Green practice: Track carbon offset option
  carbonOffset: {
    type: Boolean,
    default: false,
    description: 'Indicates if user purchased carbon offset'
  },
  active: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: '30d' // Green practice: Delete abandoned carts after 30 days to save db space
  }
}, {
  timestamps: true
});

// Index for frequent queries (green practice: query efficiency)
cartSchema.index({ user: 1, active: 1 });

/**
 * Calculate total cart value
 * (Implemented as a method rather than virtual property for caching potential)
 */
cartSchema.methods.calculateTotal = async function() {
  // need to populate products first
  await this.populate('items.product');
  
  return this.items.reduce((total, item) => {
    return total + (item.product.price * item.quantity);
  }, 0);
};

/**
 * Calculate total carbon footprint of the cart
 * Green practice: Track environmental impact
 */
cartSchema.methods.calculateCarbonFootprint = async function() {
  await this.populate('items.product');
  
  const productFootprint = this.items.reduce((total, item) => {
    return total + ((item.product.carbonFootprint || 0) * item.quantity);
  }, 0);
  
  // Add delivery footprint based on delivery option
  const deliveryFootprint = this.greenDelivery ? 0.5 : 2.0; // kg CO2e
  
  // Subtract if carbon offset is purchased
  const offsetAmount = this.carbonOffset ? productFootprint * 0.8 : 0; // Offset 80% if purchased
  
  return productFootprint + deliveryFootprint - offsetAmount;
};

const Cart = mongoose.model('Cart', cartSchema);

module.exports = Cart;