/**
 * Order Model
 * 
 * This model handles order data with green software practices:
 * - Selective indexing for efficient queries
 * - Optimized schema structure
 * - Validation to prevent unnecessary database operations
 * - Embedded documents to reduce query complexity
 */

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Order item schema (embedded document)
const orderItemSchema = new Schema({
  product: {
    type: Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: [1, 'Quantity cannot be less than 1']
  },
  price: {
    type: Number,
    required: true,
    min: [0, 'Price cannot be negative']
  },
  image: String,
  sustainabilityScore: Number,
  carbonFootprint: Number
});

// Address schema (embedded document)
const addressSchema = new Schema({
  street: {
    type: String,
    required: true,
    trim: true
  },
  city: {
    type: String,
    required: true,
    trim: true
  },
  state: {
    type: String,
    required: true,
    trim: true
  },
  zipCode: {
    type: String,
    required: true,
    trim: true
  },
  country: {
    type: String,
    required: true,
    trim: true,
    default: 'USA'
  }
});

// Main order schema
const orderSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true // Efficient lookup by user
  },
  orderItems: [orderItemSchema], // Embedded documents for better performance
  shippingAddress: addressSchema,
  paymentMethod: {
    type: String,
    required: true,
    enum: ['credit_card', 'paypal', 'crypto', 'bank_transfer','card']
  },
  paymentResult: {
    id: String,
    status: String,
    update_time: String,
    email_address: String
  },
  subtotal: {
    type: Number,
    required: true,
    default: 0.0
  },
  shippingPrice: {
    type: Number,
    required: true,
    default: 0.0
  },
  tax: {
    type: Number,
    required: true,
    default: 0.0
  },
  totalPrice: {
    type: Number,
    required: true,
    default: 0.0
  },
  // Green shipping options
  greenShipping: {
    type: Boolean,
    default: false
  },
  carbonOffset: {
    type: Boolean,
    default: false
  },
  // Order status
  isPaid: {
    type: Boolean,
    required: true,
    default: false
  },
  paidAt: {
    type: Date
  },
  isDelivered: {
    type: Boolean,
    required: true,
    default: false
  },
  deliveredAt: {
    type: Date
  },
  orderStatus: {
    type: String,
    required: true,
    enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
    default: 'pending',
    index: true // Frequent filtering by status
  },
  // Green metrics
  totalCarbonFootprint: {
    type: Number,
    default: 0 // Calculated based on items and shipping
  },
  sustainabilityRating: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  // Metadata
  createdAt: {
    type: Date,
    default: Date.now,
    immutable: true, // Can't be changed after creation
    index: true // For sorting/reporting
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true, // Automatically manage createdAt/updatedAt
  // Optimize for query performance
  collation: { locale: 'en', strength: 2 }
});

// Method to calculate total carbon footprint and sustainability rating
orderSchema.methods.calculateGreenMetrics = function() {
  let totalFootprint = 0;
  let totalSustainability = 0;
  
  this.orderItems.forEach(item => {
    if (item.carbonFootprint) {
      totalFootprint += item.carbonFootprint * item.quantity;
    }
    
    if (item.sustainabilityScore) {
      totalSustainability += item.sustainabilityScore * item.quantity;
    }
  });
  
  // Add shipping footprint if not using green shipping
  if (!this.greenShipping) {
    totalFootprint += 5; // Example value, would be calculated based on distance and method
  }
  
  // Subtract offset if applied
  if (this.carbonOffset) {
    totalFootprint = Math.max(0, totalFootprint - (totalFootprint * 0.8)); // 80% offset
  }
  
  this.totalCarbonFootprint = parseFloat(totalFootprint.toFixed(2));
  
  // Calculate average sustainability rating
  if (this.orderItems.length > 0) {
    const totalItems = this.orderItems.reduce((sum, item) => sum + item.quantity, 0);
    this.sustainabilityRating = parseFloat((totalSustainability / totalItems).toFixed(2));
  }
  
  return {
    carbonFootprint: this.totalCarbonFootprint,
    sustainabilityRating: this.sustainabilityRating
  };
};

// Pre-save hook to calculate totals and green metrics
orderSchema.pre('save', function(next) {
  // Calculate order totals
  this.subtotal = parseFloat(this.orderItems.reduce((sum, item) => 
    sum + (item.price * item.quantity), 0).toFixed(2));
  
  // Add shipping and tax
  this.totalPrice = parseFloat((
    this.subtotal + this.shippingPrice + this.tax
  ).toFixed(2));
  
  // Calculate green metrics
  this.calculateGreenMetrics();
  
  next();
});

// Static method to get user order history efficiently
orderSchema.statics.getUserOrderHistory = async function(userId, limit = 10) {
  return this.find({ user: userId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .select('orderStatus totalPrice isPaid isDelivered createdAt totalCarbonFootprint') // Only necessary fields
    .lean(); // Green practice: returns plain JS objects instead of Mongoose documents (uses less memory)
};

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;