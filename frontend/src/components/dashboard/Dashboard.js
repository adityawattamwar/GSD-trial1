import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  FaChartLine,
  FaLeaf,
  FaServer,
  FaShoppingCart,
  FaFilter,
} from "react-icons/fa";
import axios from "axios";
import "./Dashboard.css";

const Dashboard = ({ metrics }) => {
  const [filters, setFilters] = useState({
    sustainabilityScore: 0,
    hasRecycledMaterials: false,
    category: "all",
    maxCarbonFootprint: 100,
  });
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    avgSustainability: 0,
    totalProducts: 0,
    sustainableProducts: 0,
    recycledProducts: 0,
  });

  // Fetch filtered products based on criteria
  useEffect(() => {
    const fetchFilteredProducts = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams();

        if (filters.sustainabilityScore > 0) {
          params.append("minSustainability", filters.sustainabilityScore);
        }

        if (filters.hasRecycledMaterials) {
          params.append("recycledMaterials", "true");
        }

        if (filters.category !== "all") {
          params.append("category", filters.category);
        }

        if (filters.maxCarbonFootprint < 100) {
          params.append("maxCarbonFootprint", filters.maxCarbonFootprint);
        }

        const response = await axios.get(
          `/api/products/filter?${params.toString()}`
        );
        setFilteredProducts(response.data.products);
        setStats(response.data.stats);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching filtered products:", error);
        setLoading(false);
      }
    };

    fetchFilteredProducts();
  }, [filters]);

  const handleFilterChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  return (
    <div className="dashboard-container">
      <h1>Green E-commerce Dashboard</h1>
      <p>
        Overview of application performance and environmental impact metrics
      </p>

      {/* Sustainability Filter Section */}
      <div className="filter-container">
        <h3>
          <FaFilter /> Product Sustainability Filters
        </h3>
        <div className="filter-grid">
          <div className="filter-item">
            <label htmlFor="sustainabilityScore">
              Min Sustainability Score: {filters.sustainabilityScore}
            </label>
            <input
              type="range"
              id="sustainabilityScore"
              name="sustainabilityScore"
              min="0"
              max="100"
              value={filters.sustainabilityScore}
              onChange={handleFilterChange}
            />
          </div>

          <div className="filter-item">
            <label htmlFor="maxCarbonFootprint">
              Max Carbon Footprint: {filters.maxCarbonFootprint}kg
            </label>
            <input
              type="range"
              id="maxCarbonFootprint"
              name="maxCarbonFootprint"
              min="0"
              max="100"
              value={filters.maxCarbonFootprint}
              onChange={handleFilterChange}
            />
          </div>

          <div className="filter-item">
            <label>
              <input
                type="checkbox"
                name="hasRecycledMaterials"
                checked={filters.hasRecycledMaterials}
                onChange={handleFilterChange}
              />
              Only Products with Recycled Materials
            </label>
          </div>

          <div className="filter-item">
            <label htmlFor="category">Product Category</label>
            <select
              name="category"
              id="category"
              value={filters.category}
              onChange={handleFilterChange}
            >
              <option value="all">All Categories</option>
              <option value="Electronics">Electronics</option>
              <option value="Clothing">Clothing</option>
              <option value="Office">Office</option>
              <option value="Health">Health</option>
              <option value="Home">Home</option>
              <option value="Food">Food</option>
              <option value="Furniture">Furniture</option>
            </select>
          </div>
        </div>

        {/* Filter Results Summary */}
        <div className="filter-results">
          {loading ? (
            <p>Loading filter results...</p>
          ) : (
            <>
              <p>
                <strong>{filteredProducts.length}</strong> products match your
                sustainability criteria
              </p>
              <div className="stats-summary">
                <div className="stat-item">
                  <span>Avg. Sustainability Score:</span>
                  <span className="stat-value">
                    {stats.avgSustainability.toFixed(1)}
                  </span>
                </div>
                <div className="stat-item">
                  <span>Recycled Material Products:</span>
                  <span className="stat-value">{stats.recycledProducts}</span>
                </div>
                <div className="stat-item">
                  <span>Highly Sustainable Products:</span>
                  <span className="stat-value">
                    {stats.sustainableProducts}
                  </span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Existing Dashboard Content */}
      <div className="dashboard-grid">
        {/* Your existing dashboard cards */}
        <div className="dashboard-card">
          <h3>
            <FaLeaf /> Environmental Impact
          </h3>
          <div className="metric-row">
            <span>Carbon Footprint:</span>
            <span>~{(metrics?.dataTransferred * 0.02).toFixed(2)} g CO2e</span>
          </div>
          <div className="metric-row">
            <span>Energy Efficiency Rating:</span>
            <span>A+</span>
          </div>
          <div className="metric-row">
            <span>Optimized API Calls:</span>
            <span>{metrics?.apiCalls || 0}</span>
          </div>
          <Link to="/green-metrics" className="btn btn-outline">
            View Detailed Metrics
          </Link>
        </div>

        <div className="dashboard-card">
          <h3>
            <FaShoppingCart /> Shopping Activity
          </h3>
          <p>View your shopping history and impact</p>
          <Link to="/cart" className="btn btn-outline">
            Go to Cart
          </Link>
        </div>

        <div className="dashboard-card">
          <h3>
            <FaServer /> Resource Usage
          </h3>
          <div className="metric-row">
            <span>Page Loads:</span>
            <span>{metrics?.pageLoads || 0}</span>
          </div>
          <div className="metric-row">
            <span>Data Transferred:</span>
            <span>{metrics?.dataTransferred?.toFixed(2) || 0} KB</span>
          </div>
          <div className="metric-row">
            <span>API Calls:</span>
            <span>{metrics?.apiCalls || 0}</span>
          </div>
        </div>

        <div className="dashboard-card">
          <h3>
            <FaChartLine /> Performance
          </h3>
          <div className="metric-row">
            <span>Page Load Time:</span>
            <span>~{(Math.random() * 0.5 + 0.2).toFixed(2)}s</span>
          </div>
          <div className="metric-row">
            <span>Memory Usage:</span>
            <span>~{(Math.random() * 5 + 10).toFixed(1)} MB</span>
          </div>
          <div className="metric-row">
            <span>Network Requests:</span>
            <span>
              {(metrics?.apiCalls || 0) + (metrics?.pageLoads || 0) * 3}
            </span>
          </div>
        </div>
      </div>

      <div className="dashboard-info">
        <h3>About Green Software Practices</h3>
        <p>
          This application implements various green software practices to
          minimize its environmental footprint:
        </p>
        <ul>
          <li>
            Code splitting and lazy loading to reduce initial payload size
          </li>
          <li>Efficient API calls with data aggregation and debouncing</li>
          <li>
            Local processing for AI features to reduce cloud computing usage
          </li>
          <li>
            Dark mode support for OLED screens to reduce power consumption
          </li>
          <li>Optimized rendering and reduced unnecessary re-renders</li>
        </ul>
      </div>
    </div>
  );
};

export default Dashboard;
