import { prisma } from "@/lib/prisma";

// Ollama configuration
const OLLAMA_URL = process.env.OLLAMA_URL || "http://localhost:11434/api/generate";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "llama3.2:1b";  // Use a more compatible model
const OLLAMA_TIMEOUT_MS = 15000; // 15 seconds timeout
const USE_OLLAMA = process.env.USE_OLLAMA !== "false"; // Allow disabling Ollama via env var

// Helper function to check if Ollama is available
async function isOllamaAvailable(): Promise<boolean> {
  try {
    // The base URL without /api/generate
    const baseUrl = OLLAMA_URL.replace('/api/generate', '');
    console.log(`Checking Ollama availability at ${baseUrl}...`);

    const response = await fetch(baseUrl, {
      method: 'GET',
      signal: AbortSignal.timeout(3000)
    });

    console.log(`Ollama availability check result: ${response.status}`);
    return response.ok;
  } catch (error) {
    console.error("Ollama availability check failed:", error);
    return false;
  }
}

// Helper function to get a more optimized Ollama response
async function getOllamaRecommendations(
  currentProduct: any,
  productsToRank: any[],
  limit: number
): Promise<number[] | null> {
  // Make sure we have enough products to rank
  if (productsToRank.length < limit) {
    console.log(`Not enough products to rank: ${productsToRank.length} < ${limit}`);
    return null;
  }

  // Create a clearer prompt that's more likely to get a valid response
  const prompt = `You are a helpful shopping assistant for an eco-friendly online store.

A customer is viewing this product: "${currentProduct.name}" (${currentProduct.description || ''})

Based on this customer's interest, which of these products would you recommend they might also like?

Available products:
${productsToRank.map((p, i) => `- ID ${p.id}: ${p.name} - ${p.description?.substring(0, 100) || ''}`).join('\n')}

When making your recommendations, please first think about which products complement or match well with ${currentProduct.name}, then select the ${limit} best options.

In your response, include a section at the end that says "Recommended product IDs: " followed by the IDs of your recommended products (just the numbers, separated by commas).`;

  try {
    console.log("Sending optimized request to Ollama API...");
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.log("Aborting Ollama request due to timeout");
      controller.abort();
    }, OLLAMA_TIMEOUT_MS);

    console.log("Ollama prompt:", prompt);

    const response = await fetch(OLLAMA_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        prompt: prompt,
        stream: false,
        options: {
          temperature: 0.1, // Lower temperature for more deterministic output
          num_predict: 100  // Limit token generation
        }
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.error(`Ollama request failed with status: ${response.status}`);
      return null;
    }

    const result = await response.json();
    const ollamaResponse = result.response;
    console.log("Ollama raw response:", ollamaResponse);

    // Better regex to extract numbers
    const idSection = ollamaResponse.match(/Recommended product IDs:([^\n]+)/i);
    const numberMatches = idSection ? idSection[1].match(/\d+/g) : ollamaResponse.match(/\d+/g);
    if (!numberMatches || numberMatches.length === 0) {
      console.error("No numbers found in Ollama response");
      return null;
    }

    console.log("Extracted numbers from Ollama response:", numberMatches);

    // Convert to integers and filter to valid product IDs
    const productIds = numberMatches
      .map(id => parseInt(id, 10))
      .filter(id => !isNaN(id) && productsToRank.some(p => p.id === id));

    console.log("Valid product IDs from Ollama response:", productIds);

    // If we don't have enough IDs, return null to trigger fallback
    if (productIds.length < Math.min(2, limit)) {
      console.error("Not enough valid product IDs in Ollama response");
      return null;
    }

    return productIds;
  } catch (error) {
    console.error("Error in Ollama request:", error);
    return null;
  }
}

// Helper function for order-based recommendations
async function getOllamaRecommendationsForOrder(
  order: any,
  productsToRank: any[],
  limit: number
): Promise<number[] | null> {
  // Make sure we have enough products to rank
  if (productsToRank.length < limit) {
    console.log(`Not enough products to rank for order: ${productsToRank.length} < ${limit}`);
    return null;
  }

  try {
    // Create a description of what the user purchased
    const orderDescription = order.items
      .map((item: any) => `${item.product.name}${item.product.description ? ': ' + item.product.description : ''}`)
      .join('\n- ');

    const categories = order.items
      .flatMap((item: any) => item.product.categories || [])
      .map((cat: any) => cat.name)
      .filter((name: string, index: number, self: string[]) => self.indexOf(name) === index) // Remove duplicates
      .join(', ');

    // Create a clearer prompt that's more likely to get a valid response
    const prompt = `You are an e-commerce recommendation system.
A customer purchased these items:
- ${orderDescription}

Categories in this order: ${categories}

Recommend ${limit} products from this list that would complement their purchase:
${productsToRank.map((p, i) => `[${p.id}] ${p.name} - ${p.description?.substring(0, 100) || 'No description'}`).join('\n')}

ONLY respond with the exact product IDs of your recommendations, comma-separated.
For example: 12,45,23,8`;

    console.log("Sending order-based recommendation request to Ollama");
    console.log("Ollama prompt:", prompt);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.log("Aborting Ollama request due to timeout");
      controller.abort();
    }, OLLAMA_TIMEOUT_MS);

    const response = await fetch(OLLAMA_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        prompt: prompt,
        stream: false,
        options: {
          temperature: 0.1,
          num_predict: 100
        }
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.error(`Ollama request failed with status: ${response.status}`);
      return null;
    }

    const result = await response.json();
    const ollamaResponse = result.response;
    console.log("Ollama raw response for order:", ollamaResponse);

    // Better regex to extract numbers
    const numberMatches = ollamaResponse.match(/\b\d+\b/g);
    if (!numberMatches || numberMatches.length === 0) {
      console.error("No numbers found in Ollama response for order");
      return null;
    }

    console.log("Extracted numbers from Ollama order response:", numberMatches);

    // Convert to integers and filter to valid product IDs
    const productIds = numberMatches
      .map(id => parseInt(id, 10))
      .filter(id => !isNaN(id) && productsToRank.some(p => p.id === id));

    console.log("Valid product IDs from Ollama order response:", productIds);

    // If we don't have enough IDs, return null to trigger fallback
    if (productIds.length < Math.min(2, limit)) {
      console.error("Not enough valid product IDs in Ollama order response");
      return null;
    }

    return productIds;
  } catch (error) {
    console.error("Error getting Ollama recommendations for order:", error);
    return null;
  }
}

export async function getRecommendations({
  productId,
  userId,
  orderId,
  limit = 4
}: {
  productId?: number;
  userId?: string;
  orderId?: number;
  limit?: number;
}) {
  try {
    console.log("Starting recommendation generation with params:", { productId, userId, orderId });

    // Skip Ollama if disabled
    const useOllama = USE_OLLAMA && (await isOllamaAvailable());
    console.log(`Using Ollama: ${useOllama}`);

    // Prepare fallback recommendations first - this will be our safety net
    const fallbackProducts = await prisma.product.findMany({
      where: {
        ...(productId ? { id: { not: productId } } : {})
      },
      orderBy: {
        orderItems: {
          _count: 'desc'
        }
      },
      take: limit,
      include: {
        categories: true
      }
    });

    console.log(`Found ${fallbackProducts.length} fallback products`);

    // For order-based recommendations - prioritize order recommendations
    if (orderId) {
      try {
        // Get the order details with products
        const order = await prisma.order.findUnique({
          where: { id: orderId },
          include: {
            items: {
              include: {
                product: {
                  include: {
                    categories: true
                  }
                }
              }
            },
            user: true
          }
        });

        if (!order || !order.items || order.items.length === 0) {
          console.log("No items found in order, using fallback products");
          return fallbackProducts;
        }

        console.log(`Order has ${order.items.length} items`);

        // Get all category IDs from the ordered products
        const categoryIds = order.items
          .flatMap(item => (item.product?.categories || []).map(c => c.id))
          .filter((id, index, self) => self.indexOf(id) === index); // Remove duplicates

        console.log(`Found ${categoryIds.length} unique categories in the order`);

        // If no categories are found, use fallbacks
        if (categoryIds.length === 0) {
          console.log("No categories found in ordered products, using fallbacks");
          return fallbackProducts;
        }

        // Find products in the same categories
        const similarCategoryProducts = await prisma.product.findMany({
          where: {
            id: {
              notIn: order.items.map(item => item.productId) // Exclude products the user just bought
            },
            categories: {
              some: {
                id: { in: categoryIds }
              }
            }
          },
          take: limit * 2, // Get more than we need for Ollama ranking
          include: {
            categories: true
          }
        });

        console.log(`Found ${similarCategoryProducts.length} products in similar categories for order ${orderId}`);

        // If we have enough products, try to use Ollama for ranking
        if (useOllama && similarCategoryProducts.length >= 2) {
          console.log("Using Ollama for order-based recommendations");

          const recommendedIds = await getOllamaRecommendationsForOrder(
            order,
            similarCategoryProducts,
            limit
          );

          if (recommendedIds && recommendedIds.length > 0) {
            // Create a map for quick lookup
            const productsMap = new Map(similarCategoryProducts.map(p => [p.id, p]));

            // Get products in order of recommended IDs
            const recommendedProducts = recommendedIds
              .map(id => productsMap.get(id))
              .filter(Boolean)
              .slice(0, limit);

            if (recommendedProducts.length >= Math.min(2, limit)) {
              console.log(`SUCCESS! Returning ${recommendedProducts.length} Ollama-recommended products for order`);

              // If we don't have enough recommendations, fill with more similar products
              if (recommendedProducts.length < limit) {
                const remainingProducts = similarCategoryProducts
                  .filter(p => !recommendedIds.includes(p.id))
                  .slice(0, limit - recommendedProducts.length);

                console.log(`Adding ${remainingProducts.length} more similar products to reach ${limit} total`);
                return [...recommendedProducts, ...remainingProducts];
              }

              return recommendedProducts;
            }
          }
        }

        // Use category products if we don't have Ollama recommendations
        if (similarCategoryProducts.length > 0) {
          const needed = limit - similarCategoryProducts.length;
          if (needed <= 0) {
            console.log(`Returning ${limit} category products (no Ollama) for order`);
            return similarCategoryProducts.slice(0, limit);
          } else {
            const additionalFallbacks = fallbackProducts.filter(
              p => !similarCategoryProducts.some(sp => sp.id === p.id)
            ).slice(0, needed);

            console.log(`Returning ${similarCategoryProducts.length} category products + ${additionalFallbacks.length} fallbacks for order`);
            return [...similarCategoryProducts, ...additionalFallbacks].slice(0, limit);
          }
        }

        console.log("No matching products found, returning fallback products");
        return fallbackProducts;
      } catch (error) {
        console.error("Error in order-based recommendations:", error);
        return fallbackProducts;
      }
    }

    // For product-based recommendations
    if (productId) {
      try {
        // Simple approach: Use category-based matching first
        const currentProduct = await prisma.product.findUnique({
          where: { id: productId },
          include: { categories: true }
        });

        if (!currentProduct || !currentProduct.categories.length) {
          console.log("No current product or categories found, using fallbacks");
          return fallbackProducts;
        }

        console.log(`Found current product: ${currentProduct.name} with ${currentProduct.categories.length} categories`);

        // Get products in same categories
        const similarCategoryProducts = await prisma.product.findMany({
          where: {
            id: { not: productId },
            categories: {
              some: {
                id: { in: currentProduct.categories.map(c => c.id) }
              }
            }
          },
          take: 10, // Limit for optimization
          include: { categories: true }
        });

        console.log(`Found ${similarCategoryProducts.length} products in similar categories`);

        // Get additional products to supplement if we don't have enough category products
        let productsToRank = [...similarCategoryProducts];

        // If we don't have enough similar products, add some popular products
        if (similarCategoryProducts.length < limit) {
          const additionalProducts = await prisma.product.findMany({
            where: {
              id: {
                not: productId,
                notIn: similarCategoryProducts.map(p => p.id)
              }
            },
            orderBy: {
              orderItems: {
                _count: 'desc'
              }
            },
            take: limit * 2, // Get extra products to ensure we have enough
            include: { categories: true }
          });

          console.log(`Found ${additionalProducts.length} additional popular products`);
          productsToRank = [...similarCategoryProducts, ...additionalProducts];
        }

        // Use Ollama if enabled and we have products to rank
        if (useOllama && productsToRank.length >= limit) {
          console.log("Attempting to use Ollama for product ranking...");

          const recommendedIds = await getOllamaRecommendations(currentProduct, productsToRank, limit);

          if (recommendedIds && recommendedIds.length > 0) {
            console.log("Successfully got recommendations from Ollama:", recommendedIds);

            // Create a map for quick lookup
            const productsMap = new Map(productsToRank.map(p => [p.id, p]));

            // Get products in order of recommended IDs
            const recommendedProducts = recommendedIds
              .map(id => productsMap.get(id))
              .filter(Boolean)
              .slice(0, limit);

            if (recommendedProducts.length >= limit) {
              console.log(`SUCCESS! Returning ${recommendedProducts.length} Ollama-recommended products`);
              return recommendedProducts;
            }

            // Fill remaining slots with category products
            console.log(`Got ${recommendedProducts.length} Ollama recommendations, filling to ${limit}`);
            const remainingProducts = productsToRank.filter(p => !recommendedIds.includes(p.id));
            return [...recommendedProducts, ...remainingProducts].slice(0, limit);
          }
        } else if (!useOllama) {
          console.log("Skipping Ollama because it's not available");
        }

        // If we get here, Ollama didn't work or wasn't attempted
        // Use category products first, then fallbacks
        if (similarCategoryProducts.length > 0) {
          const needed = limit - similarCategoryProducts.length;
          if (needed <= 0) {
            console.log(`Returning ${limit} category products (no Ollama)`);
            return similarCategoryProducts.slice(0, limit);
          } else {
            const additionalFallbacks = fallbackProducts.filter(
              p => !similarCategoryProducts.some(sp => sp.id === p.id)
            ).slice(0, needed);

            console.log(`Returning ${similarCategoryProducts.length} category products + ${additionalFallbacks.length} fallbacks (no Ollama)`);
            return [...similarCategoryProducts, ...additionalFallbacks];
          }
        }

        console.log("No category products found, returning all fallbacks");
        return fallbackProducts;
      } catch (error) {
        console.error("Error in product recommendations:", error);
        return fallbackProducts;
      }
    }

    // If no specific recommendation type or all failed, return fallbacks
    return fallbackProducts;
  } catch (error) {
    console.error("Error in recommendation system:", error);
    return getPopularProducts(limit);
  }
}

// Helper function to get popular products
export async function getPopularProducts(limit = 4) {
  return prisma.product.findMany({
    orderBy: {
      orderItems: {
        _count: 'desc'
      }
    },
    take: limit,
    include: {
      categories: true
    }
  });
}

export async function prewarmOllamaModel() {
  try {
    console.log("Pre-warming Ollama model...");
    const response = await fetch(OLLAMA_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        prompt: "Hello, this is a warmup request to load the model into memory.",
        stream: false,
        options: {
          temperature: 0.0,
          num_predict: 10  // Keep it very small for quick response
        }
      }),
      // Don't set a timeout for warmup - we want to wait for model loading
    }).catch(err => {
      console.error("Error in Ollama warm-up request:", err);
      return null;
    });
    
    if (response && response.ok) {
      console.log("Ollama model pre-warmed successfully");
      return true;
    } else {
      console.log("Ollama warm-up request failed or timed out");
      return false;
    }
  } catch (error) {
    console.error("Failed to pre-warm Ollama model:", error);
    return false;
  }
}