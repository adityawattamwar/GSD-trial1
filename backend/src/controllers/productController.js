const Product = require('../models/Product');

/**
 * @desc    Get all products
 * @route   GET /api/products
 * @access  Public
 * @green   Uses lean queries and pagination for efficient resource usage
 */
exports.getProducts = async (req, res) => {
  try {
    // Extract query parameters for filtering, sorting and pagination
    const { 
      category, 
      minPrice, 
      maxPrice, 
      sort = 'createdAt', 
      order = 'desc',
      page = 1,
      limit = 10,
      green = false // Filter for sustainable products
    } = req.query;
    
    // Build query filter object
    const filter = {};
    
    if (category) {
      filter.category = category;
    }
    
    if (minPrice !== undefined || maxPrice !== undefined) {
      filter.price = {};
      if (minPrice !== undefined) filter.price.$gte = Number(minPrice);
      if (maxPrice !== undefined) filter.price.$lte = Number(maxPrice);
    }
    
    // Filter for green/sustainable products if requested
    if (green === 'true') {
      filter.sustainabilityScore = { $gt: 70 }; // Products with high sustainability
    }
    
    // Calculate pagination values
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;
    
    // Sorting options
    const sortOptions = {};
    sortOptions[sort] = order === 'desc' ? -1 : 1;
    
    // Execute query with efficient options
    const products = await Product.find(filter)
      .sort(sortOptions)
      .skip(skip)
      .limit(limitNum)
      .lean(); // Green practice: Use lean for faster queries with less memory usage
    
    // Get total count for pagination info
    const totalProducts = await Product.countDocuments(filter);
    
    // Send response
    res.json({
      success: true,
      count: products.length,
      total: totalProducts,
      page: pageNum,
      pages: Math.ceil(totalProducts / limitNum),
      data: products,
      // Include energy usage info (green practice: transparency)
      energyUsage: {
        queryType: 'paginated_products',
        resourcesUsed: products.length,
        optimized: true
      }
    });
  } catch (error) {
    console.error('Error in getProducts:', error);
    res.status(500).json({
      success: false,
      message: 'Server error retrieving products',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc    Get product by ID
 * @route   GET /api/products/:id
 * @access  Public
 * @green   Uses lean queries for efficiency and minimal data transfer
 */
exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).lean();
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
    res.json({
      success: true,
      data: product,
      // Include carbon footprint info (green practice: transparency)
      carbonInfo: {
        productFootprint: product.carbonFootprint,
        sustainabilityScore: product.sustainabilityScore,
        recycledMaterials: product.recycledMaterials
      }
    });
  } catch (error) {
    console.error('Error in getProductById:', error);
    
    // Check if error is due to invalid MongoDB ObjectId
    if (error.kind === 'ObjectId') {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID format'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error retrieving product',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Seed products (for development only)
 * In production, this would be a secured admin route
 */
exports.seedProducts = async (req, res) => {
  try {
    // Sample product data with green attributes
    const sampleProducts = [
      {
        name: 'Eco-friendly Laptop',
        price: 1200,
        description: 'Energy-efficient laptop made with recycled materials',
        category: 'Electronics',
        image: 'laptop.jpg',
        carbonFootprint: 80,
        sustainabilityScore: 85,
        recycledMaterials: true
      },
      {
        name: 'Organic Cotton T-Shirt',
        price: 25,
        description: 'Sustainably sourced organic cotton t-shirt',
        category: 'Clothing',
        image: 'tshirt.jpg',
        carbonFootprint: 5,
        sustainabilityScore: 90,
        recycledMaterials: false
      },
      {
        name: 'Recycled Paper Notebook',
        price: 12,
        description: '100% recycled paper notebook',
        category: 'Office',
        image: 'notebook.jpg',
        carbonFootprint: 2,
        sustainabilityScore: 95,
        recycledMaterials: true
      },
      {
        name: 'Solar Power Bank',
        price: 45,
        description: 'Portable power bank with solar charging capabilities',
        category: 'Electronics',
        image: 'powerbank.jpg',
        carbonFootprint: 10,
        sustainabilityScore: 80,
        recycledMaterials: false
      },
      {
        name: 'Bamboo Toothbrush',
        price: 5,
        description: 'Biodegradable toothbrush with bamboo handle',
        category: 'Health',
        image: 'toothbrush.jpg',
        carbonFootprint: 1,
        sustainabilityScore: 98,
        recycledMaterials: true
      }
    ];
    
    // Clear existing products and insert new ones
    await Product.deleteMany({});
    const products = await Product.insertMany(sampleProducts);
    
    res.json({
      success: true,
      count: products.length,
      data: products
    });
  } catch (error) {
    console.error('Error in seedProducts:', error);
    res.status(500).json({
      success: false,
      message: 'Server error seeding products',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};