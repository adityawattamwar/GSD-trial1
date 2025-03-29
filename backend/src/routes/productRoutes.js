const express = require("express");
const router = express.Router();
const {
  getProducts,
  getProductById,
  seedProducts,
} = require("../controllers/productController");

/**
 * @route   GET /api/products
 * @desc    Get all products
 * @access  Public
 */
router.get("/", getProducts);

/**
 * @route   GET /api/products/:id
 * @desc    Get product by ID
 * @access  Public
 */
router.get("/:id", getProductById);

/**
 * @route   POST /api/products/seed
 * @desc    Seed product data for development
 * @access  Public (should be secured in production)
 */
router.post("/seed", seedProducts);

router.get("/filter", async (req, res) => {
  try {
    const {
      minSustainability,
      recycledMaterials,
      category,
      maxCarbonFootprint,
    } = req.query;

    // Build query object
    const query = {};

    // Add filters only if they exist
    if (minSustainability) {
      query.sustainabilityScore = { $gte: parseInt(minSustainability) };
    }

    if (recycledMaterials === "true") {
      query.recycledMaterials = true;
    }

    if (category && category !== "all") {
      query.category = category;
    }

    if (maxCarbonFootprint) {
      query.carbonFootprint = { $lte: parseInt(maxCarbonFootprint) };
    }

    // Execute query
    const products = await Product.find(query).lean();

    // Calculate stats
    const totalProducts = await Product.countDocuments();
    const recycledProducts = await Product.countDocuments({
      recycledMaterials: true,
    });
    const sustainableProducts = await Product.countDocuments({
      sustainabilityScore: { $gte: 70 },
    });

    // Calculate average sustainability score
    const avgSustainability =
      products.length > 0
        ? products.reduce(
            (sum, product) => sum + (product.sustainabilityScore || 0),
            0
          ) / products.length
        : 0;

    res.json({
      products,
      stats: {
        totalProducts,
        recycledProducts,
        sustainableProducts,
        avgSustainability,
      },
    });
  } catch (error) {
    console.error("Error filtering products:", error);
    res.status(500).json({ message: "Server error while filtering products" });
  }
});

module.exports = router;
