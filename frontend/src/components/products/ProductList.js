import React, { useState, useEffect, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import {
  FaLeaf,
  FaRecycle,
  FaShoppingCart,
  FaInfoCircle,
} from "react-icons/fa";
import { useCart } from "../../context/CartContext";
import axiosInstance, { getMockProducts } from "../../utils/axiosConfig";

const ProductList = ({ onApiCall }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    category: "",
    sustainableOnly: false,
    sort: "price-asc",
  });
  const [usingMockData, setUsingMockData] = useState(false);

  // Cache reference to avoid unnecessary API calls
  const productsCache = useRef({});
  const lastFetchTime = useRef(0);
  const fetchTimeoutRef = useRef(null);

  // Get cart context
  const { addToCart } = useCart();

  // Generate a cache key from the current filters
  const getCacheKey = useCallback(() => {
    return `${filters.category}_${filters.sustainableOnly}_${filters.sort}`;
  }, [filters]);

  // Fetch products with debounced API calls (green practice)
  const fetchProducts = useCallback(async () => {
    try {
      // Avoid unnecessary loading state for cached data
      if (!productsCache.current[getCacheKey()]) {
        setLoading(true);
      }

      // Check if we've already fetched this data in the last 5 minutes (300000ms)
      const now = Date.now();
      const cacheKey = getCacheKey();
      const cacheEntry = productsCache.current[cacheKey];

      if (cacheEntry && now - lastFetchTime.current < 300000) {
        // Use cached data if available and recent
        setProducts(cacheEntry);
        setLoading(false);
        setUsingMockData(false);
        return;
      }

      // Create query string from filters
      const queryParams = new URLSearchParams();
      if (filters.category) queryParams.append("category", filters.category);
      if (filters.sustainableOnly)
        queryParams.append("sustainableOnly", "true");

      let productData;

      try {
        const response = await axiosInstance.get(
          `/api/products?${queryParams}`
        );

        // Track API call for metrics
        if (onApiCall) onApiCall(response.data.data.length * 0.5); // Approx KB per product

        productData = response.data.data;
        setUsingMockData(false);
      } catch (apiError) {
        console.log("API error, using mock data:", apiError.message);
        // Use mock data when API is unavailable
        productData = getMockProducts().filter((product) => {
          if (filters.category && product.category !== filters.category)
            return false;
          if (filters.sustainableOnly && product.sustainabilityScore < 80)
            return false;
          return true;
        });
        setUsingMockData(true);
      }

      let sortedProducts = [...productData];

      // Sort products client-side to reduce server load (green practice)
      switch (filters.sort) {
        case "price-asc":
          sortedProducts.sort((a, b) => a.price - b.price);
          break;
        case "price-desc":
          sortedProducts.sort((a, b) => b.price - a.price);
          break;
        case "sustainability":
          sortedProducts.sort(
            (a, b) => b.sustainabilityScore - a.sustainabilityScore
          );
          break;
        default:
        // No sorting
      }

      // Update cache and last fetch time
      productsCache.current[cacheKey] = sortedProducts;
      lastFetchTime.current = now;

      setProducts(sortedProducts);
      setLoading(false);
      setError(null);
    } catch (err) {
      setError("Error fetching products. Please try again.");
      setLoading(false);
      console.error("Error fetching products:", err);

      // Try to show mock data if anything fails
      if (!products.length) {
        const mockData = getMockProducts();
        setProducts(mockData);
        setUsingMockData(true);
      }
    }
  }, [filters, onApiCall]);

  // Debounced filter change to reduce API calls (green practice)
  useEffect(() => {
    // Clear any existing timeout
    if (fetchTimeoutRef.current) {
      clearTimeout(fetchTimeoutRef.current);
    }

    // Set a longer debounce time to reduce API calls
    fetchTimeoutRef.current = setTimeout(() => {
      fetchProducts();
    }, 800); // Increased from 300ms to 800ms

    return () => {
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
      }
    };
  }, [fetchProducts]);

  // Initial load - fetch only once when component mounts
  useEffect(() => {
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle filter changes
  const handleFilterChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // Handle adding product to cart
  const handleAddToCart = (product) => {
    addToCart(product);
  };

  // Render sustainability badge based on score
  const renderSustainabilityBadge = (score) => {
    if (score >= 90) {
      return (
        <div title="Excellent sustainability rating" className="eco-badge">
          <FaLeaf color="#2e7d32" />
          <span>Excellent</span>
        </div>
      );
    } else if (score >= 70) {
      return (
        <div title="Good sustainability rating" className="eco-badge">
          <FaLeaf color="#4caf50" />
          <span>Good</span>
        </div>
      );
    }
    return null;
  };

  return (
    <div>
      <h1>Sustainable Products</h1>

      {/* Mock Data Notice */}
      {usingMockData && (
        <div
          style={{
            backgroundColor: "#fff3cd",
            color: "#856404",
            padding: "10px",
            borderRadius: "4px",
            marginBottom: "15px",
            display: "flex",
            alignItems: "center",
          }}
        >
          <FaInfoCircle style={{ marginRight: "8px" }} />
          <span>
            Currently showing demo products. The backend server might be
            unavailable.
          </span>
        </div>
      )}

      {/* Filters */}
      <div
        className="filters"
        style={{
          marginBottom: "20px",
          padding: "15px",
          backgroundColor: "#f1f8e9",
          borderRadius: "8px",
        }}
      >
        <h3>Filter Products</h3>
        <div
          style={{
            display: "flex",
            gap: "15px",
            flexWrap: "wrap",
            margin: "10px 0",
          }}
        >
          <div>
            <label htmlFor="category">Category: </label>
            <select
              id="category"
              name="category"
              value={filters.category}
              onChange={handleFilterChange}
              className="filter-select"
            >
              <option value="">All Categories</option>
              <option value="Electronics">Electronics</option>
              <option value="Clothing">Clothing</option>
              <option value="Office">Office</option>
              <option value="Health">Health</option>
            </select>
          </div>

          <div>
            <label htmlFor="sort">Sort by: </label>
            <select
              id="sort"
              name="sort"
              value={filters.sort}
              onChange={handleFilterChange}
              className="filter-select"
            >
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="sustainability">Sustainability</option>
            </select>
          </div>

          <div style={{ display: "flex", alignItems: "center" }}>
            <input
              type="checkbox"
              id="sustainableOnly"
              name="sustainableOnly"
              checked={filters.sustainableOnly}
              onChange={handleFilterChange}
              className="green-checkbox"
            />
            <label
              htmlFor="sustainableOnly"
              style={{
                marginLeft: "5px",
                display: "flex",
                alignItems: "center",
              }}
            >
              <FaLeaf color="#2e7d32" style={{ marginRight: "5px" }} />
              Sustainable Products Only
            </label>
          </div>
        </div>
      </div>

      {/* Loading and Error States */}
      {loading && (
        <div
          style={{
            textAlign: "center",
            padding: "30px",
            backgroundColor: "white",
            borderRadius: "8px",
            boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
            marginBottom: "20px",
          }}
        >
          <div
            className="loading-spinner"
            style={{
              display: "inline-block",
              width: "40px",
              height: "40px",
              border: "4px solid rgba(0, 0, 0, 0.1)",
              borderLeftColor: "#2e7d32",
              borderRadius: "50%",
              animation: "spin 1s linear infinite",
              marginBottom: "10px",
            }}
          ></div>
          <style>
            {`@keyframes spin { to { transform: rotate(360deg) } }`}
          </style>
          <p>Loading sustainable products...</p>
        </div>
      )}
      {error && !usingMockData && (
        <div
          style={{
            backgroundColor: "#f8d7da",
            color: "#721c24",
            padding: "15px",
            borderRadius: "4px",
            marginBottom: "20px",
          }}
        >
          <p>{error}</p>
        </div>
      )}

      {/* Product Grid */}
      {!loading && !error && (
        <>
          <p style={{ marginBottom: "15px" }}>
            <strong>{products.length}</strong> products found
          </p>
          <div className="product-grid">
            {products.map((product) => (
              <div key={product._id} className="product-card">
                <img
                  src={
                    product.image ||
                    `https://via.placeholder.com/300x200?text=${encodeURIComponent(
                      product.name
                    )}`
                  }
                  alt={product.name}
                  className="product-image"
                  // Green practice: Use loading=lazy to defer loading offscreen images
                  loading="lazy"
                />

                <div className="product-info">
                  <h3 className="product-title">
                    <Link to={`/product/${product._id}`}>{product.name}</Link>
                  </h3>

                  <p className="product-price">${product.price.toFixed(2)}</p>

                  {/* Sustainability Indicators */}
                  <div className="sustainability-score">
                    <span>Sustainability:</span>
                    <div className="score-bar">
                      <div
                        className="score-fill"
                        style={{ width: `${product.sustainabilityScore}%` }}
                      ></div>
                    </div>
                  </div>

                  {renderSustainabilityBadge(product.sustainabilityScore)}

                  {product.recycledMaterials && (
                    <div
                      className="eco-badge"
                      title="Made with recycled materials"
                    >
                      <FaRecycle color="#4caf50" />
                      <span>Recycled</span>
                    </div>
                  )}

                  {/* Carbon Footprint */}
                  <p
                    className="carbon-info"
                    style={{ fontSize: "0.8rem", marginTop: "8px" }}
                  >
                    Carbon Footprint: {product.carbonFootprint}kg CO2e
                  </p>

                  <div className="product-actions">
                    <button
                      className="btn btn-block"
                      onClick={() => handleAddToCart(product)}
                    >
                      <FaShoppingCart style={{ marginRight: "5px" }} />
                      Add to Cart
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {products.length === 0 && (
            <p>No products found. Try adjusting your filters.</p>
          )}
        </>
      )}

      {/* Green Software Info */}
      <div
        style={{
          marginTop: "30px",
          padding: "15px",
          backgroundColor: "#e8f5e9",
          borderRadius: "8px",
        }}
      >
        <h3 style={{ display: "flex", alignItems: "center" }}>
          <FaLeaf style={{ marginRight: "8px" }} />
          Green Shopping Tips
        </h3>
        <ul style={{ marginTop: "10px", marginLeft: "20px" }}>
          <li>Look for products with high sustainability scores</li>
          <li>Consider the carbon footprint of each product</li>
          <li>Choose items made from recycled materials when possible</li>
          <li>Consolidate your orders to reduce shipping emissions</li>
        </ul>
      </div>
    </div>
  );
};

export default ProductList;
