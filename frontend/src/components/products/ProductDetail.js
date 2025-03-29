import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import { FaLeaf, FaShoppingCart, FaRecycle } from "react-icons/fa";
import { useCart } from "../../context/CartContext";

const ProductDetail = ({ onApiCall }) => {
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { id } = useParams();
  const { addToCart } = useCart();

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        // In a real app, this would be an API call
        // For now, using sample data
        const sampleProduct = {
          _id: id,
          name: "Eco-friendly Product",
          price: 29.99,
          description:
            "This is a sustainable product with low carbon footprint",
          category: "Electronics",
          image: "https://via.placeholder.com/400x300",
          carbonFootprint: 12,
          sustainabilityScore: 85,
          recycledMaterials: true,
        };

        setProduct(sampleProduct);
        if (onApiCall) onApiCall(1); // Track API call
      } catch (err) {
        setError("Error loading product details");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id, onApiCall]);

  const handleAddToCart = () => {
    if (product) {
      addToCart(product);
    }
  };

  if (loading) return <p>Loading product details...</p>;
  if (error) return <p className="error">{error}</p>;
  if (!product) return <p>Product not found</p>;

  return (
    <div className="product-detail-container">
      <Link to="/" className="back-link">
        ← Back to Products
      </Link>

      <div className="product-detail">
        <div className="product-image-container">
          <img
            src={product.image}
            alt={product.name}
            className="product-detail-image"
            loading="lazy"
          />
        </div>

        <div className="product-info">
          <h1>{product.name}</h1>
          <p className="product-price">${product.price.toFixed(2)}</p>

          {/* Sustainability indicators */}
          <div className="sustainability-metrics">
            <div className="sustainability-score">
              <span>Sustainability Score:</span>
              <div className="score-bar">
                <div
                  className="score-fill"
                  style={{ width: `${product.sustainabilityScore}%` }}
                ></div>
              </div>
              <span>{product.sustainabilityScore}/100</span>
            </div>

            <div className="carbon-info">
              <FaLeaf />
              <span>Carbon Footprint: {product.carbonFootprint}kg CO2e</span>
            </div>

            {product.recycledMaterials && (
              <div className="eco-badge">
                <FaRecycle />
                <span>Made with recycled materials</span>
              </div>
            )}
          </div>

          <div className="product-description">
            <h3>Description</h3>
            <p>{product.description}</p>
          </div>

          <button className="btn btn-block" onClick={handleAddToCart}>
            <FaShoppingCart style={{ marginRight: "5px" }} />
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
