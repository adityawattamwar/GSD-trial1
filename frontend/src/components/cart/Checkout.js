import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaLeaf, FaShieldAlt, FaTruck, FaCreditCard } from "react-icons/fa";
import { useCart } from "../../context/CartContext";
import "./Checkout.css";

const Checkout = ({ onApiCall }) => {
  const navigate = useNavigate();
  const {
    items,
    totalPrice,
    totalItems,
    greenDelivery,
    carbonOffset,
    carbonFootprint,
    checkout,
  } = useCart();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    address: "",
    city: "",
    zipCode: "",
    paymentMethod: "card",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (items.length === 0) {
      setError("Your cart is empty");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Track API call
      if (onApiCall) onApiCall(2);

      // Simulate checkout process
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Success message
      alert("Order placed successfully!");
      navigate("/");
    } catch (err) {
      setError("Error processing your order. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="checkout-container">
      <h1>Checkout</h1>

      {error && <p className="error">{error}</p>}

      <div className="checkout-layout">
        <div className="checkout-form-container">
          <h2>Shipping Information</h2>

          <form onSubmit={handleSubmit} className="checkout-form">
            <div className="form-group">
              <label htmlFor="name">Full Name</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="address">Address</label>
              <input
                type="text"
                id="address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="city">City</label>
                <input
                  type="text"
                  id="city"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="zipCode">Zip Code</label>
                <input
                  type="text"
                  id="zipCode"
                  name="zipCode"
                  value={formData.zipCode}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <h2>Payment Method</h2>

            <div className="payment-options">
              <div className="payment-option">
                <input
                  type="radio"
                  id="card"
                  name="paymentMethod"
                  value="card"
                  checked={formData.paymentMethod === "card"}
                  onChange={handleChange}
                />
                <label htmlFor="card">
                  <FaCreditCard />
                  <span>Credit Card</span>
                </label>
              </div>
            </div>

            <div className="actions">
              <Link to="/cart" className="btn btn-outline">
                Back to Cart
              </Link>

              <button
                type="submit"
                className="btn"
                disabled={loading || items.length === 0}
              >
                {loading ? "Processing..." : "Place Order"}
              </button>
            </div>
          </form>
        </div>

        <div className="order-summary">
          <h2>Order Summary</h2>

          <div className="summary-detail">
            <span>Items ({totalItems}):</span>
            <span>${totalPrice.toFixed(2)}</span>
          </div>

          <div className="summary-detail">
            <span>Shipping:</span>
            <span>
              {greenDelivery ? "Green Shipping (Free)" : "Standard ($5.00)"}
            </span>
          </div>

          <div className="summary-detail">
            <span>Carbon Offset:</span>
            <span>
              {carbonOffset
                ? `$${(carbonFootprint * 0.1).toFixed(2)}`
                : "$0.00"}
            </span>
          </div>

          <div className="summary-total">
            <span>Total:</span>
            <span>
              $
              {(
                totalPrice +
                (greenDelivery ? 0 : 5) +
                (carbonOffset ? carbonFootprint * 0.1 : 0)
              ).toFixed(2)}
            </span>
          </div>

          <div className="eco-info">
            <div className="eco-badge">
              <FaLeaf />
              <span>Carbon Footprint: {carbonFootprint.toFixed(2)}kg CO2e</span>
            </div>

            {greenDelivery && (
              <div className="eco-badge">
                <FaTruck />
                <span>Eco-friendly Delivery</span>
              </div>
            )}

            {carbonOffset && (
              <div className="eco-badge">
                <FaShieldAlt />
                <span>Carbon Offset</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
