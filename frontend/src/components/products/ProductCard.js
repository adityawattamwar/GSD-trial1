import React, { memo } from "react";
import { Link } from "react-router-dom";
import { FaShoppingCart, FaStar } from "react-icons/fa";
import "./ProductCard.css";

// Memoized component to prevent unnecessary re-renders
const ProductCard = memo(({ product, onAddToCart }) => {
  return (
    <div className="product-card stars-bg">
      {/* Animated cosmic element */}
      <div className="cosmic-glow"></div>
      
      {/* Product image with lazy loading */}
      <img
        src={
          product.image ||
          `https://via.placeholder.com/300x200?text=${encodeURIComponent(
            product.name
          )}`
        }
        alt={product.name}
        className="product-image"
        loading="lazy"
      />

      <div className="product-info">
        {/* Only showing name as requested */}
        <h3 className="product-title">
          <Link to={`/product/${product._id}`}>
            <span className="title-text">{product.name}</span>
            <span className="title-hover-effect"></span>
          </Link>
        </h3>

        {/* Only showing price as requested */}
        <p className="product-price">
          <span className="price-currency">$</span>
          {product.price.toFixed(2)}
        </p>

        {/* Only showing add to cart button as requested */}
        <div className="product-actions">
          <button
            className="cosmic-button"
            onClick={() => onAddToCart(product)}
            aria-label={`Add ${product.name} to cart`}
          >
            <FaShoppingCart className="button-icon" />
            <span>Add to Cart</span>
            <div className="button-glow"></div>
          </button>
        </div>
      </div>
    </div>
  );
}, 
// Custom equality function for performance optimization
(prevProps, nextProps) => {
  return (
    prevProps.product._id === nextProps.product._id &&
    prevProps.product.price === nextProps.product.price &&
    prevProps.product.name === nextProps.product.name
  );
});

export default ProductCard;