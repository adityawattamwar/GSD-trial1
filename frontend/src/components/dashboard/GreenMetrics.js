import React, { useState, useEffect } from "react";
import {
  FaLeaf,
  FaRecycle,
  FaSeedling,
  FaSolarPanel,
  FaServer,
  FaCode,
} from "react-icons/fa";
import { useCart } from "../../context/CartContext";

const GreenMetrics = () => {
  const { items, carbonFootprint } = useCart();
  const [metrics, setMetrics] = useState({
    // General app metrics
    appEnergyEfficiency: "A+",
    estimatedPageWeight: "32KB", // Lightweight app
    cacheHitRate: "94%",

    // User shopping metrics
    sustainableProductsCount: 0,
    carbonSavingsTotal: 0,
    recycledMaterialsCount: 0,

    // Server metrics
    serverEnergyUsage: "0.02 kWh",
    apiCallsOptimized: "85%",
    dataTransferSaved: "120KB",
  });

  // Calculate user sustainability metrics based on cart
  useEffect(() => {
    if (items.length > 0) {
      // Count sustainable products (sustainability score > 70)
      const sustainableItems = items.filter(
        (item) =>
          item.product.sustainabilityScore &&
          item.product.sustainabilityScore > 70
      );

      // Count products with recycled materials
      const recycledItems = items.filter(
        (item) => item.product.recycledMaterials
      );

      // Calculate carbon savings (compared to typical products)
      const standardProductFootprint = 10; // Average carbon footprint
      let totalSavings = 0;

      items.forEach((item) => {
        if (
          item.product.carbonFootprint &&
          item.product.carbonFootprint < standardProductFootprint
        ) {
          totalSavings +=
            (standardProductFootprint - item.product.carbonFootprint) *
            item.quantity;
        }
      });

      setMetrics((prev) => ({
        ...prev,
        sustainableProductsCount: sustainableItems.length,
        recycledMaterialsCount: recycledItems.length,
        carbonSavingsTotal: totalSavings.toFixed(2),
      }));
    }
  }, [items]);

  // Facts about green software practices
  const greenPractices = [
    {
      title: "Efficient Algorithms",
      icon: <FaCode />,
      description:
        "Our application uses optimized algorithms to reduce computational load and energy consumption.",
    },
    {
      title: "Lightweight Frontend",
      icon: <FaLeaf />,
      description:
        "Our React application practices code splitting, lazy loading, and minimal dependencies to reduce bundle size.",
    },
    {
      title: "Local Processing",
      icon: <FaServer />,
      description:
        "We use Ollama to run AI models locally, reducing cloud server usage and associated carbon emissions.",
    },
    {
      title: "Resource Caching",
      icon: <FaRecycle />,
      description:
        "Aggressive caching strategies minimize redundant data transfers and server requests.",
    },
    {
      title: "Sustainability Tracking",
      icon: <FaSeedling />,
      description:
        "We track and display carbon footprint data to help you make informed eco-friendly choices.",
    },
    {
      title: "Energy-Efficient Operations",
      icon: <FaSolarPanel />,
      description:
        "Our backend uses connection pooling, efficient database queries, and optimized API endpoints.",
    },
  ];

  return (
    <div
      style={{
        backgroundColor: "#121212",
        color: "#f0f0f0",
        padding: "20px",
        borderRadius: "8px",
      }}
    >
      <h1 style={{ color: "#4caf50" }}>
        Green Software & Sustainability Metrics
      </h1>
      <p>
        This application is built with green software practices to minimize its
        environmental impact.
      </p>

      {/* Main metrics dashboard */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
          gap: "20px",
          margin: "30px 0",
        }}
      >
        {/* Application Metrics */}
        <div
          className="metrics-card"
          style={{
            backgroundColor: "#1e1e1e",
            borderRadius: "8px",
            padding: "20px",
            boxShadow: "0 4px 6px rgba(0,0,0,0.3)",
            color: "#f0f0f0",
          }}
        >
          <h3
            style={{ display: "flex", alignItems: "center", color: "#e0e0e0" }}
          >
            <FaCode style={{ marginRight: "8px", color: "#4caf50" }} />
            Application Efficiency
          </h3>
          <ul style={{ listStyle: "none", padding: 0, marginTop: "15px" }}>
            <li
              style={{
                margin: "10px 0",
                display: "flex",
                justifyContent: "space-between",
              }}
            >
              <span>Energy Class:</span>
              <strong style={{ color: "#4caf50" }}>
                {metrics.appEnergyEfficiency}
              </strong>
            </li>
            <li
              style={{
                margin: "10px 0",
                display: "flex",
                justifyContent: "space-between",
              }}
            >
              <span>Avg. Page Weight:</span>
              <strong>{metrics.estimatedPageWeight}</strong>
            </li>
            <li
              style={{
                margin: "10px 0",
                display: "flex",
                justifyContent: "space-between",
              }}
            >
              <span>Cache Hit Rate:</span>
              <strong>{metrics.cacheHitRate}</strong>
            </li>
          </ul>
        </div>

        {/* Shopping Metrics */}
        <div
          className="metrics-card"
          style={{
            backgroundColor: "#1e1e1e",
            borderRadius: "8px",
            padding: "20px",
            boxShadow: "0 4px 6px rgba(0,0,0,0.3)",
            color: "#f0f0f0",
          }}
        >
          <h3
            style={{ display: "flex", alignItems: "center", color: "#e0e0e0" }}
          >
            <FaLeaf style={{ marginRight: "8px", color: "#4caf50" }} />
            Your Green Impact
          </h3>
          <ul style={{ listStyle: "none", padding: 0, marginTop: "15px" }}>
            <li
              style={{
                margin: "10px 0",
                display: "flex",
                justifyContent: "space-between",
              }}
            >
              <span>Sustainable Products Selected:</span>
              <strong>{metrics.sustainableProductsCount}</strong>
            </li>
            <li
              style={{
                margin: "10px 0",
                display: "flex",
                justifyContent: "space-between",
              }}
            >
              <span>Recycled Materials Products:</span>
              <strong>{metrics.recycledMaterialsCount}</strong>
            </li>
            <li
              style={{
                margin: "10px 0",
                display: "flex",
                justifyContent: "space-between",
              }}
            >
              <span>Carbon Savings:</span>
              <strong style={{ color: "#4caf50" }}>
                {metrics.carbonSavingsTotal} kg CO2e
              </strong>
            </li>
          </ul>
        </div>

        {/* Server Metrics */}
        <div
          className="metrics-card"
          style={{
            backgroundColor: "#1e1e1e",
            borderRadius: "8px",
            padding: "20px",
            boxShadow: "0 4px 6px rgba(0,0,0,0.3)",
            color: "#f0f0f0",
          }}
        >
          <h3
            style={{ display: "flex", alignItems: "center", color: "#e0e0e0" }}
          >
            <FaServer style={{ marginRight: "8px", color: "#4caf50" }} />
            Server Efficiency
          </h3>
          <ul style={{ listStyle: "none", padding: 0, marginTop: "15px" }}>
            <li
              style={{
                margin: "10px 0",
                display: "flex",
                justifyContent: "space-between",
              }}
            >
              <span>Energy Consumption:</span>
              <strong>{metrics.serverEnergyUsage}</strong>
            </li>
            <li
              style={{
                margin: "10px 0",
                display: "flex",
                justifyContent: "space-between",
              }}
            >
              <span>API Call Optimization:</span>
              <strong>{metrics.apiCallsOptimized}</strong>
            </li>
            <li
              style={{
                margin: "10px 0",
                display: "flex",
                justifyContent: "space-between",
              }}
            >
              <span>Data Transfer Saved:</span>
              <strong>{metrics.dataTransferSaved}</strong>
            </li>
          </ul>
        </div>
      </div>

      {/* Carbon footprint comparison */}
      <div
        style={{
          padding: "20px",
          backgroundColor: "#2e2e2e",
          borderRadius: "8px",
          marginBottom: "30px",
          border: "1px solid #444444",
        }}
      >
        <h3 style={{ color: "#4caf50" }}>Your Cart's Carbon Footprint</h3>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            marginTop: "20px",
          }}
        >
          <div
            style={{
              width: "100%",
              height: "24px",
              backgroundColor: "#333333",
              borderRadius: "12px",
              position: "relative",
              overflow: "hidden",
              marginBottom: "10px",
            }}
          >
            {/* Determine position based on carbon footprint (scale: 0-50kg) */}
            <div
              style={{
                position: "absolute",
                left: "0",
                top: "0",
                height: "100%",
                width: `${Math.min(100, (carbonFootprint / 50) * 100)}%`,
                backgroundColor:
                  carbonFootprint < 10
                    ? "#4caf50"
                    : carbonFootprint < 25
                    ? "#ff9800"
                    : "#f44336",
                borderRadius: "12px",
                transition: "width 1s ease-in-out",
              }}
            ></div>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              width: "100%",
              color: "#e0e0e0",
            }}
          >
            <span>0 kg CO2e</span>
            <span>25 kg CO2e</span>
            <span>50+ kg CO2e</span>
          </div>
          <p
            style={{ marginTop: "15px", textAlign: "center", color: "#f0f0f0" }}
          >
            <strong>
              Your Current Footprint: {carbonFootprint.toFixed(2)} kg CO2e
            </strong>
            <br />
            <span style={{ fontSize: "0.9rem", color: "#e0e0e0" }}>
              {carbonFootprint < 10
                ? "Great! Your cart has a low carbon footprint."
                : carbonFootprint < 25
                ? "Your cart has a moderate carbon footprint."
                : "Consider swapping some items for more sustainable alternatives."}
            </span>
          </p>
        </div>
      </div>

      {/* Green Software Practices */}
      <h2 style={{ color: "#4caf50" }}>Our Green Software Practices</h2>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
          gap: "20px",
          margin: "20px 0",
        }}
      >
        {greenPractices.map((practice, index) => (
          <div
            key={index}
            style={{
              backgroundColor: "#1e1e1e",
              borderRadius: "8px",
              padding: "20px",
              boxShadow: "0 4px 6px rgba(0,0,0,0.3)",
              color: "#f0f0f0",
            }}
          >
            <h3
              style={{
                display: "flex",
                alignItems: "center",
                color: "#e0e0e0",
              }}
            >
              <span style={{ marginRight: "8px", color: "#4caf50" }}>
                {practice.icon}
              </span>
              {practice.title}
            </h3>
            <p style={{ marginTop: "10px", color: "#e0e0e0" }}>
              {practice.description}
            </p>
          </div>
        ))}
      </div>

      {/* Environmental impact section */}
      <div
        style={{
          padding: "20px",
          backgroundColor: "#2e2e2e",
          borderRadius: "8px",
          marginTop: "30px",
          border: "1px solid #444444",
        }}
      >
        <h3 style={{ color: "#4caf50" }}>Why Green Software Matters</h3>
        <p style={{ color: "#e0e0e0" }}>
          The IT sector is responsible for 2-3% of global carbon emissions,
          similar to the aviation industry. By implementing green software
          practices, we can reduce energy consumption, lower carbon emissions,
          and minimize environmental impact.
        </p>

        <h4 style={{ marginTop: "15px", color: "#4caf50" }}>Our Commitment</h4>
        <p style={{ color: "#e0e0e0" }}>
          We continuously optimize our application to reduce its environmental
          footprint. By choosing our platform for your shopping needs, you're
          supporting sustainable development practices in the digital world.
        </p>
      </div>
    </div>
  );
};

export default GreenMetrics;
