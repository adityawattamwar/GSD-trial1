import React, { useEffect, useState, memo } from "react";
import { Link } from "react-router-dom";
import { FaShoppingCart } from "react-icons/fa";
import axios from "axios";
import "./ProductCard.css";

const PEXELS_API_KEY = "joqRztycjhwQBbr00BiSiodU577DXk7kJTOZ3hImJtWkN3Gr4NTcFFWT"; // Replace with your API Key

const ProductCard = memo(({ product, onAddToCart }) => {
  const [imageUrl, setImageUrl] = useState("");

  // Fetch image from Pexels API
  useEffect(() => {
    const fetchImage = async () => {
      try {
        const response = await axios.get(
          `https://api.pexels.com/v1/search?query=${product.name}&per_page=1`,
          {
            headers: { Authorization: PEXELS_API_KEY }
          }
        );

        if (response.data.photos.length > 0) {
          setImageUrl(response.data.photos[0].src.medium);
        } else {
          setImageUrl("https://via.placeholder.com/300x200?text=Image+Not+Found");
        }
      } catch (error) {
        console.error("Error fetching image from Pexels:", error);
        setImageUrl("https://via.placeholder.com/300x200?text=Error+Loading");
      }
    };

    fetchImage();
  }, [product.name]);

  return (
    <div className="product-card stars-bg">
      <div className="cosmic-glow"></div>

      {/* Dynamic product image */}
      <img src={imageUrl} alt={product.name} className="product-image" loading="lazy" />

      <div className="product-info">
        <h3 className="product-title">
          <Link to={`/product/${product._id}`}>
            <span className="title-text">{product.name}</span>
            <span className="title-hover-effect"></span>
          </Link>
        </h3>

        <p className="product-price">
          <span className="price-currency">$</span>
          {product.price.toFixed(2)}
        </p>

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
}, (prevProps, nextProps) => (
  prevProps.product._id === nextProps.product._id &&
  prevProps.product.price === nextProps.product.price &&
  prevProps.product.name === nextProps.product.name
));

export default ProductCard;
