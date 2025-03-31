import React, { useState, useEffect } from 'react';
import { FaBox, FaCalendarAlt, FaCreditCard, FaShippingFast, FaHistory } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import axios from '../../utils/axiosConfig';
import '../auth/Auth.css';
import './Orders.css';

const OrderHistory = ({ onApiCall }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const { user } = useAuth();

  // Fetch order history on component mount
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        
        const response = await axios.get('/api/orders/history');
        
        if (response.data.success) {
          setOrders(response.data.orders);
          
          // Track API call with approximate data size
          if (onApiCall) {
            const dataSize = JSON.stringify(response.data.orders).length / 1024;
            onApiCall(dataSize);
          }
        } else {
          setError('Could not retrieve order history');
        }
      } catch (err) {
        console.error('Error fetching orders:', err);
        setError(
          err.response?.data?.message || 
          'Failed to load order history. Please try again.'
        );
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchOrders();
    }
  }, [user, onApiCall]);

  // Toggle order details expansion
  const toggleOrderExpand = (orderId) => {
    setExpandedOrderId(expandedOrderId === orderId ? null : orderId);
  };

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Format price with currency
  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  // Get status badge class based on order status
  const getStatusBadgeClass = (status) => {
    switch (status.toLowerCase()) {
      case 'processing':
        return 'status-processing';
      case 'shipped':
        return 'status-shipped';
      case 'delivered':
        return 'status-delivered';
      case 'cancelled':
        return 'status-cancelled';
      default:
        return 'status-pending';
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="order-container">
        <div className="auth-card">
          <div className="order-header">
            <h1 className="auth-title">Order History</h1>
          </div>
          <div className="cosmic-loader">
            <div className="spinner"></div>
            <p>Loading your cosmic journey history...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="order-container">
        <div className="auth-card">
          <div className="order-header">
            <h1 className="auth-title">Order History</h1>
          </div>
          <div className="error-message">
            <p>{error}</p>
            <button 
              className="auth-button"
              onClick={() => window.location.reload()}
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Empty state
  if (orders.length === 0) {
    return (
      <div className="order-container">
        <div className="auth-card">
          <div className="order-header">
            <h1 className="auth-title">
              <FaHistory className="auth-icon" /> Order History
            </h1>
          </div>
          <div className="empty-orders">
            <FaBox className="empty-icon" />
            <h3>No Orders Yet</h3>
            <p>Your cosmic journey has just begun! Start exploring our products.</p>
            <a href="/" className="auth-button">Explore Products</a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="order-container">
      <div className="auth-card">
        <div className="order-header">
          <h1 className="auth-title">
            <FaHistory className="auth-icon" /> Order History
          </h1>
          <p className="auth-subtitle">Your past cosmic purchases</p>
        </div>

        <div className="orders-list">
          {orders.map((order) => (
            <div 
              key={order._id} 
              className={`order-card ${expandedOrderId === order._id ? 'expanded' : ''}`}
            >
              <div 
                className="order-summary"
                onClick={() => toggleOrderExpand(order._id)}
              >
                <div className="order-info">
                  <div className="order-number">
                    <span className="info-label">Order:</span>
                    <span className="info-value">#{order.orderNumber || order._id.substr(-8)}</span>
                  </div>
                  <div className="order-date">
                    <FaCalendarAlt className="info-icon" />
                    <span>{formatDate(order.createdAt)}</span>
                  </div>
                </div>
                
                <div className="order-status-price">
                  <div className={`status-badge ${getStatusBadgeClass(order.status)}`}>
                    {order.status}
                  </div>
                  <div className="order-total">
                    {formatPrice(order.totalAmount)}
                  </div>
                </div>
              </div>
              
              {expandedOrderId === order._id && (
                <div className="order-details">
                  <div className="order-items">
                    <h3 className="details-heading">Items</h3>
                    <ul className="items-list">
                      {order.items.map((item) => (
                        <li key={item.product._id || item._id} className="order-item">
                          <div className="item-image">
                            <img 
                              src={item.product.image || '/placeholder.jpg'} 
                              alt={item.product.name}
                              loading="lazy"
                            />
                          </div>
                          <div className="item-details">
                            <h4 className="item-name">{item.product.name}</h4>
                            <div className="item-meta">
                              <span className="item-quantity">Qty: {item.quantity}</span>
                              <span className="item-price">{formatPrice(item.price)}</span>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div className="order-info-grid">
                    <div className="info-block">
                      <h3 className="details-heading">Shipping</h3>
                      <div className="shipping-info">
                        <FaShippingFast className="details-icon" />
                        <div>
                          <p>{order.shippingAddress.name}</p>
                          <p>{order.shippingAddress.street}</p>
                          <p>
                            {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}
                          </p>
                          <p>{order.shippingAddress.country}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="info-block">
                      <h3 className="details-heading">Payment</h3>
                      <div className="payment-info">
                        <FaCreditCard className="details-icon" />
                        <div>
                          <p>Method: {order.paymentMethod}</p>
                          <p>Status: {order.paymentStatus}</p>
                          {order.paymentDetails && (
                            <p>Last 4: {order.paymentDetails.lastFour || 'XXXX'}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="order-summary-totals">
                    <div className="totals-row">
                      <span>Subtotal:</span>
                      <span>{formatPrice(order.subtotal)}</span>
                    </div>
                    <div className="totals-row">
                      <span>Shipping:</span>
                      <span>{formatPrice(order.shippingCost)}</span>
                    </div>
                    <div className="totals-row">
                      <span>Tax:</span>
                      <span>{formatPrice(order.taxAmount)}</span>
                    </div>
                    <div className="totals-row total">
                      <span>Total:</span>
                      <span>{formatPrice(order.totalAmount)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default OrderHistory;