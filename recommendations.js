require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./backend/src/models/Product');
const Order = require('./backend/src/models/Order');

const OLLAMA_URL = process.env.OLLAMA_URL || "http://localhost:11434/api/generate";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "llama3.2:1b";
const OLLAMA_TIMEOUT_MS = 15000;
const USE_OLLAMA = process.env.USE_OLLAMA !== "false";

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// Cache products for 5 minutes to reduce DB load
let productsCache = {
  data: null,
  lastUpdate: 0
};

async function getProductsWithOrderCounts() {
  const now = Date.now();
  if (productsCache.data && (now - productsCache.lastUpdate < 300000)) {
    return productsCache.data;
  }

  const products = await Product.find().lean();
  
  // Get order counts for each product
  const orderCounts = await Order.aggregate([
    { $unwind: '$orderItems' },
    {
      $group: {
        _id: '$orderItems.product',
        orderCount: { $sum: '$orderItems.quantity' }
      }
    }
  ]);

  // Map order counts to products
  const productsWithCounts = products.map(product => ({
    id: product._id,
    name: product.name,
    categories: [product.category],
    orderCount: orderCounts.find(o => o._id.equals(product._id))?.orderCount || 0,
    sustainabilityScore: product.sustainabilityScore
  }));

  // Update cache
  productsCache.data = productsWithCounts;
  productsCache.lastUpdate = now;

  return productsWithCounts;
}

async function isOllamaAvailable() {
  try {
    const baseUrl = OLLAMA_URL.replace('/api/generate', '');
    const response = await fetch(baseUrl, {
      method: 'GET',
      signal: AbortSignal.timeout(3000)
    });
    return response.ok;
  } catch (error) {
    console.error("Ollama check failed:", error);
    return false;
  }
}

async function getOllamaRecommendations(currentProduct, productsToRank, limit) {
  if (productsToRank.length < limit) return null;

  const prompt = `Given this product: "${currentProduct.name}", recommend ${limit} most relevant products from this list:
${productsToRank.map(p => `[${p.id}] ${p.name}`).join('\n')}
Response format: just comma-separated product IDs`;

  try {
    const response = await fetch(OLLAMA_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        prompt,
        stream: false,
        options: { temperature: 0.1 }
      }),
      signal: AbortSignal.timeout(OLLAMA_TIMEOUT_MS)
    });

    if (!response.ok) return null;

    const result = await response.json();
    const numbers = result.response.match(/\d+/g);
    if (!numbers) return null;

    return numbers
      .map(id => parseInt(id, 10))
      .filter(id => !isNaN(id) && productsToRank.some(p => p.id === id))
      .slice(0, limit);
  } catch (error) {
    console.error("Ollama request failed:", error);
    return null;
  }
}

export async function getRecommendations({ productId, limit = 4 }) {
  try {
    const products = await getProductsWithOrderCounts();
    
    // Get fallback recommendations (most ordered products)
    const fallbackProducts = products
      .sort((a, b) => b.orderCount - a.orderCount)
      .slice(0, limit);

    if (!productId) return fallbackProducts;

    // Get current product
    const currentProduct = products.find(p => p.id.toString() === productId);
    if (!currentProduct) return fallbackProducts;

    // Get similar products (same categories and similar sustainability score)
    const similarProducts = products
      .filter(p => p.id.toString() !== productId && 
        p.categories.some(c => currentProduct.categories.includes(c)) &&
        Math.abs(p.sustainabilityScore - currentProduct.sustainabilityScore) <= 20)
      .slice(0, limit * 2);

    // Try Ollama recommendations if available
    if (USE_OLLAMA && await isOllamaAvailable() && similarProducts.length >= limit) {
      const recommendedIds = await getOllamaRecommendations(
        currentProduct,
        similarProducts,
        limit
      );

      if (recommendedIds?.length >= 2) {
        const recommendations = recommendedIds
          .map(id => similarProducts.find(p => p.id === id))
          .filter(Boolean)
          .slice(0, limit);

        if (recommendations.length === limit) return recommendations;
      }
    }

    // Return similar products or fallback to popular products
    return similarProducts.length >= limit 
      ? similarProducts.slice(0, limit)
      : fallbackProducts;

  } catch (error) {
    console.error("Recommendation error:", error);
    return getPopularProducts(limit);
  }
}

export async function getPopularProducts(limit = 4) {
  const products = await getProductsWithOrderCounts();
  return products
    .sort((a, b) => b.orderCount - a.orderCount)
    .slice(0, limit);
}

export async function prewarmOllamaModel() {
  if (!USE_OLLAMA) return false;
  try {
    const response = await fetch(OLLAMA_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        prompt: "Warmup request",
        stream: false,
        options: { temperature: 0.0 }
      })
    });
    return response.ok;
  } catch (error) {
    console.error("Model warmup failed:", error);
    return false;
  }
}
