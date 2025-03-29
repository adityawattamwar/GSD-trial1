/**
 * Green E-commerce Server
 *
 * This Express server is built using green software practices to minimize environmental impact
 * while providing a full-featured e-commerce API. Green practices focus on reducing resource
 * usage, optimizing network traffic, and efficient data processing.
 */

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const morgan = require("morgan");
const path = require("path");
const mongoose = require("mongoose");

const app = express();
const PORT = process.env.PORT || 5000;

// Specific CORS configuration (green practice: only allowing necessary origins/methods)
app.use(
  cors({
    origin: ["http://localhost:3000", "http://localhost:8000"],
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization", "user-id"],
  })
);

/**
 * MongoDB Connection with Green Practices
 *
 * - Connection pooling: Reuses connections to reduce resource overhead
 * - Unified topology: More efficient connection management
 * - Monitoring: Tracks resource usage to identify optimization opportunities
 * - Graceful shutdown: Ensures proper cleanup of resources
 */

mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(async () => {
    console.log("MongoDB connected successfully");

    // Log connection pool stats (green practice: monitoring resource usage)
    const poolSize =
      mongoose.connection.client.s.options.maxPoolSize || "default";
    console.log(`MongoDB connection pool size: ${poolSize}`);

    // Check if we need to seed initial data
    const Product = require("./models/Product");
    const Cart = require("./models/Cart");

    try {
      // Only seed if no products exist in the database
      const productCount = await Product.countDocuments();

      if (productCount === 0) {
        console.log("No products found in database. Seeding initial data...");

        // Sample product data with diverse sustainability ratings
        const sampleProducts = [
          // Electronics - Sustainable
          {
            name: "Eco-friendly Laptop",
            price: 1200,
            description:
              "Energy-efficient laptop made with recycled materials and designed for easy repair and upgrade.",
            category: "Electronics",
            image: "laptop.jpg",
            carbonFootprint: 80,
            sustainabilityScore: 85,
            recycledMaterials: true,
            purchaseCount: 24,
          },
          {
            name: "Solar Power Bank",
            price: 45,
            description: "Portable power bank with solar charging capabilities",
            category: "Electronics",
            image: "powerbank.jpg",
            carbonFootprint: 10,
            sustainabilityScore: 80,
            recycledMaterials: false,
            purchaseCount: 67,
          },
          {
            name: "Energy Efficient Monitor",
            price: 250,
            description:
              "Low power consumption monitor with eco-friendly materials",
            category: "Electronics",
            image: "monitor.jpg",
            carbonFootprint: 35,
            sustainabilityScore: 75,
            recycledMaterials: true,
            purchaseCount: 42,
          },

          // Electronics - Conventional
          {
            name: "Gaming Laptop",
            price: 1800,
            description:
              "High-performance gaming laptop with RGB lighting and powerful graphics",
            category: "Electronics",
            image: "gaming-laptop.jpg",
            carbonFootprint: 145,
            sustainabilityScore: 30,
            recycledMaterials: false,
            purchaseCount: 120,
          },
          {
            name: "Smartphone",
            price: 899,
            description:
              "Latest model smartphone with high-resolution camera and fast processor",
            category: "Electronics",
            image: "smartphone.jpg",
            carbonFootprint: 60,
            sustainabilityScore: 45,
            recycledMaterials: false,
            purchaseCount: 350,
          },

          // Clothing - Sustainable
          {
            name: "Organic Cotton T-Shirt",
            price: 25,
            description: "Sustainably sourced organic cotton t-shirt",
            category: "Clothing",
            image: "tshirt.jpg",
            carbonFootprint: 5,
            sustainabilityScore: 90,
            recycledMaterials: false,
            purchaseCount: 150,
          },
          {
            name: "Recycled Polyester Jacket",
            price: 89,
            description:
              "Weather-resistant jacket made from recycled plastic bottles",
            category: "Clothing",
            image: "jacket.jpg",
            carbonFootprint: 12,
            sustainabilityScore: 85,
            recycledMaterials: true,
            purchaseCount: 78,
          },
          {
            name: "Hemp Jeans",
            price: 65,
            description: "Durable jeans made from sustainable hemp fibers",
            category: "Clothing",
            image: "hemp-jeans.jpg",
            carbonFootprint: 8,
            sustainabilityScore: 88,
            recycledMaterials: false,
            purchaseCount: 56,
          },

          // Clothing - Conventional
          {
            name: "Designer Jeans",
            price: 120,
            description: "Premium denim jeans from popular fashion brand",
            category: "Clothing",
            image: "designer-jeans.jpg",
            carbonFootprint: 25,
            sustainabilityScore: 40,
            recycledMaterials: false,
            purchaseCount: 89,
          },
          {
            name: "Leather Jacket",
            price: 199,
            description: "Classic style leather jacket",
            category: "Clothing",
            image: "leather-jacket.jpg",
            carbonFootprint: 75,
            sustainabilityScore: 30,
            recycledMaterials: false,
            purchaseCount: 45,
          },

          // Office/Stationery
          {
            name: "Recycled Paper Notebook",
            price: 12,
            description:
              "100% recycled paper notebook with biodegradable cover",
            category: "Office",
            image: "notebook.jpg",
            carbonFootprint: 2,
            sustainabilityScore: 95,
            recycledMaterials: true,
            purchaseCount: 89,
          },
          {
            name: "Bamboo Desk Organizer",
            price: 35,
            description: "Desk organizer made from sustainable bamboo",
            category: "Office",
            image: "desk-organizer.jpg",
            carbonFootprint: 4,
            sustainabilityScore: 90,
            recycledMaterials: false,
            purchaseCount: 62,
          },
          {
            name: "Standard Printer Paper",
            price: 8,
            description: "Standard white office printer paper, 500 sheets",
            category: "Office",
            image: "printer-paper.jpg",
            carbonFootprint: 12,
            sustainabilityScore: 35,
            recycledMaterials: false,
            purchaseCount: 230,
          },

          // Health & Beauty
          {
            name: "Bamboo Toothbrush",
            price: 5,
            description: "Biodegradable toothbrush with bamboo handle",
            category: "Health",
            image: "toothbrush.jpg",
            carbonFootprint: 1,
            sustainabilityScore: 98,
            recycledMaterials: true,
            purchaseCount: 215,
          },
          {
            name: "Organic Shampoo Bar",
            price: 12,
            description: "Zero-waste shampoo bar with organic ingredients",
            category: "Health",
            image: "shampoo-bar.jpg",
            carbonFootprint: 2,
            sustainabilityScore: 95,
            recycledMaterials: false,
            purchaseCount: 134,
          },
          {
            name: "Luxury Face Cream",
            price: 75,
            description: "Premium face cream with anti-aging properties",
            category: "Health",
            image: "face-cream.jpg",
            carbonFootprint: 18,
            sustainabilityScore: 40,
            recycledMaterials: false,
            purchaseCount: 88,
          },

          // Home & Kitchen
          {
            name: "Compost Bin",
            price: 38,
            description: "Kitchen compost bin for food waste recycling",
            category: "Home",
            image: "compost-bin.jpg",
            carbonFootprint: 15,
            sustainabilityScore: 85,
            recycledMaterials: true,
            purchaseCount: 72,
          },
          {
            name: "Energy Efficient LED Bulbs (4-pack)",
            price: 15,
            description: "Long-lasting, low energy LED light bulbs",
            category: "Home",
            image: "led-bulbs.jpg",
            carbonFootprint: 8,
            sustainabilityScore: 80,
            recycledMaterials: false,
            purchaseCount: 190,
          },
          {
            name: "Stainless Steel Water Bottle",
            price: 22,
            description: "Reusable water bottle to reduce plastic waste",
            category: "Home",
            image: "water-bottle.jpg",
            carbonFootprint: 12,
            sustainabilityScore: 88,
            recycledMaterials: false,
            purchaseCount: 245,
          },
          {
            name: "Non-stick Cookware Set",
            price: 129,
            description:
              "Complete non-stick cookware set for all kitchen needs",
            category: "Home",
            image: "cookware.jpg",
            carbonFootprint: 65,
            sustainabilityScore: 45,
            recycledMaterials: false,
            purchaseCount: 68,
          },

          // Food & Grocery
          {
            name: "Organic Coffee Beans",
            price: 14,
            description: "Fair trade, organic coffee beans",
            category: "Food",
            image: "coffee.jpg",
            carbonFootprint: 6,
            sustainabilityScore: 85,
            recycledMaterials: false,
            purchaseCount: 325,
          },
          {
            name: "Plant-based Protein Powder",
            price: 25,
            description:
              "Sustainable plant protein with no artificial additives",
            category: "Food",
            image: "protein.jpg",
            carbonFootprint: 7,
            sustainabilityScore: 80,
            recycledMaterials: true,
            purchaseCount: 110,
          },
          {
            name: "Imported Chocolate Box",
            price: 18,
            description: "Luxury chocolate assortment in fancy packaging",
            category: "Food",
            image: "chocolate.jpg",
            carbonFootprint: 28,
            sustainabilityScore: 35,
            recycledMaterials: false,
            purchaseCount: 85,
          },

          // Furniture
          {
            name: "Reclaimed Wood Coffee Table",
            price: 250,
            description:
              "Coffee table made from reclaimed wood with minimal processing",
            category: "Furniture",
            image: "coffee-table.jpg",
            carbonFootprint: 30,
            sustainabilityScore: 90,
            recycledMaterials: true,
            purchaseCount: 28,
          },
          {
            name: "Flat-Pack Bookshelf",
            price: 89,
            description: "Modern style bookshelf that ships in flat packaging",
            category: "Furniture",
            image: "bookshelf.jpg",
            carbonFootprint: 80,
            sustainabilityScore: 55,
            recycledMaterials: false,
            purchaseCount: 75,
          },
        ];

        const products = await Product.insertMany(sampleProducts);
        console.log(`Successfully seeded ${products.length} products`);
      } else {
        console.log(
          `Database already contains ${productCount} products. Skipping seed.`
        );
      }
    } catch (err) {
      console.error("Error seeding initial data:", err);
    }
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  });

// Connection event handlers (green practice: efficient resource management)
mongoose.connection.on("connected", () => {
  console.log("MongoDB connection established");
});

mongoose.connection.on("disconnected", () => {
  console.log("MongoDB connection disconnected");
});

// Graceful shutdown (green practice: prevents resource leaks)
process.on("SIGINT", () => {
  mongoose.connection.close(() => {
    console.log("MongoDB connection closed due to app termination");
    process.exit(0);
  });
});

// Import routes
const productRoutes = require("./routes/productRoutes");
const cartRoutes = require("./routes/cartRoutes");

/**
 * Middleware Configuration with Green Practices
 */

// Security middleware (green practice: efficient security implementation)
app.use(helmet());

// Compression middleware (green practice: reduces network traffic by 40-60%)
app.use(compression());

// Minimal logging - 'tiny' format (green practice: reduces storage usage)
app.use(morgan("tiny"));

// Parse JSON bodies
app.use(express.json());

// Parse URL-encoded bodies
app.use(express.urlencoded({ extended: true }));

/**
 * API Routes
 * The controllers implement green practices such as:
 * - Lean queries to reduce memory usage
 * - Pagination to limit data transfer
 * - Selective field retrieval to minimize response size
 * - Efficient database indexing
 */
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);

// Health check route
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Server is running" });
});

// Error handling middleware (green practice: prevents unhandled crashes that waste resources)
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: true,
    message: "An internal server error occurred",
  });
});

/**
 * Server Startup with Resource Monitoring
 *
 * Green practices:
 * - Memory usage tracking
 * - Resource consumption monitoring
 * - Efficient process management
 */
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Server started at ${new Date().toISOString()}`);

  // Log memory usage (green software practice: monitoring resource consumption)
  const used = process.memoryUsage();
  console.log("Memory usage:");
  for (const key in used) {
    console.log(
      `${key}: ${Math.round((used[key] / 1024 / 1024) * 100) / 100} MB`
    );
  }
});
