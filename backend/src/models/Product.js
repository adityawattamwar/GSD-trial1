const mongoose = require('mongoose');

/**
 * Product Schema - defines structure for product data in MongoDB
 * Green practice: Efficient schema design with only necessary fields
 */
const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true
  },
  price: {
    type: Number,
    required: [true, 'Product price is required'],
    min: [0, 'Price must be a positive number']
  },
  description: {
    type: String,
    trim: true,
    default: ''
  },
  category: {
    type: String,
    required: [true, 'Product category is required'],
    trim: true
  },
  image: {
    type: String,
    default: 'default-product.jpg'
  },
  inStock: {
    type: Boolean,
    default: true
  },
  // Green practice: Track carbon footprint of each product
  carbonFootprint: {
    type: Number,
    default: 0,
    description: 'Carbon footprint in kg CO2e'
  },
  // Green practice: Track product sustainability score
  sustainabilityScore: {
    type: Number,
    min: 0,
    max: 100,
    default: 50
  },
  // Green practice: Flag products made from recycled materials
  recycledMaterials: {
    type: Boolean,
    default: false
  },
  // Useful for tracking inventory and recommendations
  purchaseCount: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  // Enable timestamps, which will automatically update the updatedAt field
  timestamps: true,
  // Use lean option by default for more efficient queries (green practice)
  // This will reduce memory usage when querying data
  toJSON: { virtuals: true, getters: true },
  toObject: { virtuals: true, getters: true }
});

// Create index for frequent queries (green practice: query efficiency)
productSchema.index({ category: 1 });
productSchema.index({ price: 1 });
productSchema.index({ name: 'text', description: 'text' }); // Text search index

// Virtual property for product carbon efficiency rating
productSchema.virtual('carbonEfficiencyRating').get(function() {
  // Logic to calculate rating based on price and carbon footprint
  if (this.carbonFootprint <= 0) return 'Not Available';
  const ratio = this.price / this.carbonFootprint;
  if (ratio > 100) return 'Excellent';
  if (ratio > 50) return 'Good';
  if (ratio > 20) return 'Average';
  return 'Poor';
});

// Method to update purchase count when product is sold
productSchema.methods.updatePurchaseCount = function() {
  this.purchaseCount += 1;
  return this.save();
};

const Product = mongoose.model('Product', productSchema);

module.exports = Product;