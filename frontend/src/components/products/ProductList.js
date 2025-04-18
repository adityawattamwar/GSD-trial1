import React, { useState, useEffect, useCallback, useRef } from "react";
import { FaInfoCircle, FaRocket, FaStar, FaMeteor, FaSatellite, FaChevronDown } from "react-icons/fa";
import ProductCard from "./ProductCard";
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
  const [visibleCount, setVisibleCount] = useState(3); // Initially show 3 products
  
  // Reference for lazy loading
  const loadMoreRef = useRef(null);

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
  
  // Load more products when user scrolls
  const loadMoreProducts = useCallback(() => {
    // Add 3 more products at a time
    setVisibleCount(prevCount => {
      const newCount = prevCount + 3;
      // Don't exceed total product count
      return Math.min(newCount, products.length);
    });
  }, [products.length]);
  
  // Setup intersection observer for lazy loading
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        // When the load more trigger becomes visible
        if (entries[0].isIntersecting && visibleCount < products.length) {
          loadMoreProducts();
        }
      },
      {
        rootMargin: '300px 0px', // Preload before reaching the end
        threshold: 0.1 // Trigger when even a small part is visible
      }
    );
    
    // Observe the load more trigger element
    if (loadMoreRef.current && visibleCount < products.length) {
      observer.observe(loadMoreRef.current);
    }
    
    return () => {
      if (loadMoreRef.current) {
        observer.unobserve(loadMoreRef.current);
      }
      observer.disconnect();
    };
  }, [visibleCount, products.length, loadMoreProducts]);
  
  // Manually load more products
  const handleManualLoadMore = () => {
    loadMoreProducts();
  };

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

  // Removed unused sustainability badge function

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

      {/* Cosmic Filters */}
      <div className="cosmic-filters stars-bg">
        <h3 className="cosmic-filter-title">
          <FaSatellite className="cosmic-icon" />
          <span>Filter Cosmic Products</span>
        </h3>
        
        <div className="cosmic-filter-controls">
          <div className="filter-group">
            <label htmlFor="category" className="cosmic-label">Galaxy: </label>
            <select
              id="category"
              name="category"
              value={filters.category}
              onChange={handleFilterChange}
              className="cosmic-select"
            >
              <option value="">All Categories</option>
              <option value="Electronics">Electronics</option>
              <option value="Clothing">Clothing</option>
              <option value="Office">Office</option>
              <option value="Health">Health</option>
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="sort" className="cosmic-label">Order by: </label>
            <select
              id="sort"
              name="sort"
              value={filters.sort}
              onChange={handleFilterChange}
              className="cosmic-select"
            >
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="sustainability">Cosmic Rating</option>
            </select>
          </div>

          
        </div>
      </div>

      {/* Cosmic Loading State */}
      {loading && (
        <div className="cosmic-loading-container">
          <div className="cosmic-loading-spinner"></div>
          <div className="cosmic-loading-orbit">
            <div className="cosmic-loading-planet"></div>
          </div>
          <p>Loading cosmic products...</p>
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
      {/* Add filter and loading styles */}
      <style jsx>{`
        .cosmic-filters {
          margin-bottom: 25px;
          padding: 20px;
          background: linear-gradient(145deg, #1E293B, #0F172A);
          border-radius: 12px;
          position: relative;
          overflow: hidden;
          box-shadow: 0 8px 20px rgba(79, 70, 229, 0.2);
          border: 1px solid #2D3748;
        }
        
        .cosmic-filter-title {
          display: flex;
          align-items: center;
          color: #A5F3FC;
          margin-bottom: 15px;
          position: relative;
        }
        
        .cosmic-icon {
          margin-right: 10px;
          color: #EC4899;
        }
        
        .meteor-icon {
          color: #F472B6;
          animation: pulse 2s infinite alternate;
        }
        
        .cosmic-filter-controls {
          display: flex;
          gap: 20px;
          flex-wrap: wrap;
          margin-top: 15px;
        }
        
        .filter-group {
          display: flex;
          align-items: center;
        }
        
        .cosmic-label {
          color: #E2E8F0;
          margin-right: 8px;
        }
        
        .checkbox-label {
          display: flex;
          align-items: center;
        }
        
        .cosmic-select {
          background-color: rgba(30, 41, 59, 0.8);
          border: 1px solid #4C1D95;
          color: #E2E8F0;
          padding: 8px 12px;
          border-radius: 8px;
          min-width: 160px;
          font-size: 0.95rem;
          box-shadow: 0 0 10px rgba(139, 92, 246, 0.2);
          transition: all 0.3s ease;
          position: relative;
          z-index: 100; /* Ensure dropdown appears above other elements */
          appearance: auto !important; /* Force browser default appearance */
          -webkit-appearance: auto !important;
          -moz-appearance: auto !important;
        }
        
        .cosmic-select:hover, .cosmic-select:focus {
          box-shadow: 0 0 15px rgba(139, 92, 246, 0.4);
          border-color: #7E22CE;
          outline: none;
        }
        
        /* Style for dropdown options */
        .cosmic-select option {
          background-color: #1E293B; /* Dark background for options */
          color: #E2E8F0; /* Light text color */
          padding: 10px; /* Add padding for better readability */
          font-size: 0.95rem;
        }
        
        /* Fix for Firefox */
        @-moz-document url-prefix() {
          .cosmic-select {
            background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23E2E8F0' d='M6 8.825l-6-6h12z'/%3E%3C/svg%3E");
            background-repeat: no-repeat;
            background-position: right 0.7em top 50%;
            padding-right: 1.5em;
          }
        }
        
        .cosmic-checkbox {
          width: 18px;
          height: 18px;
          margin-right: 8px;
          accent-color: #8B5CF6;
        }
        
        .cosmic-loading-container {
          position: relative;
          text-align: center;
          padding: 40px;
          background: linear-gradient(145deg, #1E293B, #0F172A);
          border-radius: 12px;
          box-shadow: 0 8px 20px rgba(79, 70, 229, 0.2);
          margin-bottom: 25px;
          color: #E2E8F0;
          overflow: hidden;
        }
        
        .cosmic-loading-spinner {
          display: inline-block;
          width: 50px;
          height: 50px;
          border: 3px solid rgba(79, 70, 229, 0.1);
          border-left-color: #8B5CF6;
          border-top-color: #EC4899;
          border-radius: 50%;
          animation: spin 1.5s linear infinite;
          margin-bottom: 15px;
        }
        
        .cosmic-loading-orbit {
          position: absolute;
          width: 160px;
          height: 160px;
          border: 1px dashed rgba(124, 58, 237, 0.3);
          border-radius: 50%;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          z-index: 0;
          animation: orbit-spin 10s linear infinite;
        }
        
        .cosmic-loading-planet {
          position: absolute;
          width: 14px;
          height: 14px;
          background: radial-gradient(#EC4899, #8B5CF6);
          border-radius: 50%;
          top: -7px;
          left: 50%;
          transform: translateX(-50%);
          box-shadow: 0 0 10px #EC4899;
        }
        
        @keyframes orbit-spin {
          from { transform: translate(-50%, -50%) rotate(0deg); }
          to { transform: translate(-50%, -50%) rotate(360deg); }
        }
      `}</style>
      {/* Product Grid */}
      {!loading && !error && (
        <>
          <p style={{ marginBottom: "15px" }}>
            <strong>{products.length}</strong> products found
            <span style={{ color: "#8B5CF6", marginLeft: "10px", fontSize: "0.9rem" }}>
              (Scroll down to see more)
            </span>
          </p>
          <div className="product-grid stars-bg">
            {/* Add cosmic background elements */}
            <div className="cosmic-nebula"></div>
            <div className="shooting-star product-star"></div>
            <div className="shooting-star product-star delay2"></div>
            
            {/* Render only the currently visible products */}
            {products.slice(0, visibleCount).map((product) => (
              <div 
                className="product-card-wrapper product-visible"
                key={product._id}
              >
                <ProductCard 
                  product={product} 
                  onAddToCart={handleAddToCart} 
                />
              </div>
            ))}
            
            {/* Load more trigger (hidden but used for intersection observer) */}
            {visibleCount < products.length && (
              <div 
                ref={loadMoreRef} 
                className="load-more-trigger"
              ></div>
            )}
          </div>

          {products.length === 0 && (
            <p>No products found. Try adjusting your filters.</p>
          )}
        </>
      )}

      {/* Load more button and indicator */}
      {!loading && visibleCount < products.length && (
        <div className="cosmic-load-more">
          <div className="cosmic-loading-spinner small"></div>
          <p>Scrolling will reveal more products...</p>
          <button 
            className="cosmic-button load-more-btn" 
            onClick={handleManualLoadMore}
          >
            Load More Products
          </button>
        </div>
      )}
      
      {/* Cosmic Shopping Tips */}
      {/* <div className="cosmic-tips-container stars-bg">
        <h3 className="cosmic-tips-title">
          <FaRocket className="cosmic-icon" />
          <span>Cosmic Shopping Tips</span>
        </h3>
        <ul className="cosmic-tips-list">
          <li><FaStar className="tip-icon" /> Find products that match your cosmic style</li>
          <li><FaStar className="tip-icon" /> Explore our interstellar collection</li>
          <li><FaStar className="tip-icon" /> Combine items for a complete space-themed experience</li>
          <li><FaStar className="tip-icon" /> Check our home page for new cosmic arrivals</li>
        </ul>
      </div> */}
      
      {/* Add styles for cosmic elements */}
      <style jsx>{`
        .cosmic-tips-container {
          margin-top: 30px;
          padding: 20px;
          background: linear-gradient(145deg, #1E293B, #0F172A);
          border-radius: 12px;
          position: relative;
          overflow: hidden;
          box-shadow: 0 8px 20px rgba(79, 70, 229, 0.2);
          border: 1px solid #2D3748;
        }
        
        .cosmic-tips-title {
          display: flex;
          align-items: center;
          color: #A5F3FC;
          margin-bottom: 15px;
          position: relative;
        }
        
        .cosmic-icon {
          margin-right: 10px;
          color: #EC4899;
          animation: pulse 2s infinite alternate;
        }
        
        .cosmic-tips-list {
          margin-left: 20px;
          color: #E2E8F0;
        }
        
        .cosmic-tips-list li {
          margin-bottom: 8px;
          display: flex;
          align-items: center;
        }
        
        .tip-icon {
          color: #8B5CF6;
          margin-right: 8px;
          font-size: 0.8rem;
        }
        
        .cosmic-nebula {
          position: absolute;
          width: 100%;
          height: 100%;
          top: 0;
          left: 0;
          background: radial-gradient(ellipse at top right, rgba(139, 92, 246, 0.15), transparent 70%);
          z-index: 0;
        }
        
        .product-star {
          animation-delay: 4s;
          top: 20%;
          left: 30%;
        }
        
        .delay2 {
          animation-delay: 7s;
          top: 70%;
          left: 65%;
        }
        
        .cosmic-load-more {
          text-align: center;
          padding: 15px;
          margin: 20px 0;
          color: #A5F3FC;
          background: linear-gradient(145deg, rgba(30, 41, 59, 0.6), rgba(15, 23, 42, 0.6));
          border-radius: 8px;
          border: 1px dashed #4C1D95;
        }
        
        .cosmic-button.load-more-btn {
          background: linear-gradient(145deg, #8B5CF6, #6D28D9);
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 30px;
          margin-top: 15px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 15px rgba(109, 40, 217, 0.3);
        }
        
        .cosmic-button.load-more-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(109, 40, 217, 0.4);
          background: linear-gradient(145deg, #9D71FB, #7E3AF2);
        }
        
        .product-card-wrapper {
          position: relative;
          transition: all 0.5s ease;
          min-height: 350px;
        }
        
        .load-more-trigger {
          width: 100%;
          height: 20px;
          margin-top: 20px;
          visibility: hidden; /* Hidden but still triggers intersection */
        }
        
        .product-visible {
          animation: fadeIn 0.5s ease forwards;
        }
        
        @keyframes placeholder-shimmer {
          0% { transform: translateX(-100%) rotate(0deg); }
          100% { transform: translateX(100%) rotate(360deg); }
        }
        
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(10px); }
        }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .cosmic-loading-spinner.small {
          width: 25px;
          height: 25px;
          display: inline-block;
          margin-right: 10px;
          vertical-align: middle;
        }
        
        @keyframes pulse {
          0% { transform: scale(1); opacity: 0.8; }
          100% { transform: scale(1.2); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default ProductList;
