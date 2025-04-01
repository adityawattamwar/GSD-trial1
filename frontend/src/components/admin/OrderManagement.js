import React, { useState, useEffect } from 'react';
import { FaEye, FaClipboardList, FaTruck, FaCheckCircle, FaTimesCircle, FaLeaf } from 'react-icons/fa';
import axios from '../../utils/axiosConfig';
import './AdminStyles.css';
  
const OrderManagement = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  
  // Load orders on component mount
  useEffect(() => {
    fetchOrders();
  }, []);
  
  const fetchOrders = async () => {
    try {
      setLoading(true);
      // Use the admin endpoint without authentication
      const response = await axios.get('/api/orders/admin');
      setOrders(response.data.orders);
      setError(null);
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError('Failed to load orders. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Format date for display
  const formatDate = (dateString) => {
    const options = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  
  // Get appropriate badge class based on order status
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'pending':
        return 'badge-warning';
      case 'processing':
        return 'badge-info';
      case 'shipped':
        return 'badge-primary';
      case 'delivered':
        return 'badge-success';
      case 'cancelled':
        return 'badge-danger';
      default:
        return 'badge-secondary';
    }
  };
  
  // View order details
  const viewOrderDetails = (order) => {
    setSelectedOrder(order);
  };
  
  // Close order details modal
  const closeOrderDetails = () => {
    setSelectedOrder(null);
  };
  
  return (
    <div className="order-management">
      <h2>Order Management</h2>
      
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}
      
      {loading ? (
        <div className="loading-spinner">
          <span className="spinner"></span>
          <p>Loading orders...</p>
        </div>
      ) : (
        <>
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Date</th>
                  <th>Customer</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center' }}>No orders found</td>
                  </tr>
                ) : (
                  orders.map(order => (
                    <tr key={order._id}>
                      <td>#{order._id.substring(order._id.length - 6).toUpperCase()}</td>
                      <td>{formatDate(order.createdAt)}</td>
                      <td>{order.user.username || order.user.email || 'Unknown'}</td>
                      <td>${order.totalPrice.toFixed(2)}</td>
                      <td>
                        <span className={`status-badge ${getStatusBadgeClass(order.orderStatus)}`}>
                          {order.orderStatus}
                        </span>
                      </td>
                      <td>
                        <button 
                          className="action-button view-button"
                          onClick={() => viewOrderDetails(order)}
                        >
                          <FaEye /> View
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          {/* Order details modal */}
          {selectedOrder && (
            <div className="order-modal">
              <div className="order-modal-content">
                <div className="order-modal-header">
                  <h3>
                    <FaClipboardList /> Order Details
                  </h3>
                  <button className="close-button" onClick={closeOrderDetails}>×</button>
                </div>
                
                <div className="order-modal-body">
                  <div className="order-detail-header">
                    <div>
                      <h4>Order #{selectedOrder._id.substring(selectedOrder._id.length - 6).toUpperCase()}</h4>
                      <p>Placed on {formatDate(selectedOrder.createdAt)}</p>
                    </div>
                    <div>
                      <span className={`status-badge ${getStatusBadgeClass(selectedOrder.orderStatus)}`}>
                        {selectedOrder.orderStatus}
                      </span>
                    </div>
                  </div>
                  
                  <div className="order-section">
                    <h5>Customer Information</h5>
                    <p><strong>Name:</strong> {selectedOrder.user.username || 'N/A'}</p>
                    <p><strong>Email:</strong> {selectedOrder.user.email || 'N/A'}</p>
                  </div>
                  
                  <div className="order-section">
                    <h5>Shipping Address</h5>
                    <p>{selectedOrder.shippingAddress.street}</p>
                    <p>{selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state} {selectedOrder.shippingAddress.zipCode}</p>
                    <p>{selectedOrder.shippingAddress.country}</p>
                  </div>
                  
                  <div className="order-section">
                    <h5>Payment Information</h5>
                    <p><strong>Method:</strong> {selectedOrder.paymentMethod}</p>
                    <p><strong>Status:</strong> {selectedOrder.isPaid ? 'Paid' : 'Not Paid'}</p>
                    {selectedOrder.isPaid && selectedOrder.paidAt && (
                      <p><strong>Paid on:</strong> {formatDate(selectedOrder.paidAt)}</p>
                    )}
                  </div>
                  
                  <div className="order-section">
                    <h5>Order Items</h5>
                    <table className="items-table">
                      <thead>
                        <tr>
                          <th>Product</th>
                          <th>Quantity</th>
                          <th>Price</th>
                          <th>Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedOrder.orderItems.map((item, index) => (
                          <tr key={index}>
                            <td>
                              <div className="product-cell">
                                {item.image && (
                                  <img src={item.image} alt={item.name} className="product-thumbnail" />
                                )}
                                <span>{item.name}</span>
                              </div>
                            </td>
                            <td>{item.quantity}</td>
                            <td>${item.price.toFixed(2)}</td>
                            <td>${(item.price * item.quantity).toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                  <div className="order-totals">
                    <div className="total-row">
                      <span>Subtotal:</span>
                      <span>${selectedOrder.subtotal.toFixed(2)}</span>
                    </div>
                    <div className="total-row">
                      <span>Shipping:</span>
                      <span>${selectedOrder.shippingPrice.toFixed(2)}</span>
                    </div>
                    <div className="total-row">
                      <span>Tax:</span>
                      <span>${selectedOrder.tax.toFixed(2)}</span>
                    </div>
                    <div className="total-row grand-total">
                      <span>Total:</span>
                      <span>${selectedOrder.totalPrice.toFixed(2)}</span>
                    </div>
                  </div>
                  
                  <div className="order-section green-metrics">
                    <h5><FaLeaf /> Sustainability Metrics</h5>
                    <div className="metrics-container">
                      <div className="metric-item">
                        <div className="metric-value">
                          {selectedOrder.totalCarbonFootprint.toFixed(1)} kg
                        </div>
                        <div className="metric-label">Carbon Footprint</div>
                      </div>
                      <div className="metric-item">
                        <div className="metric-value">
                          {selectedOrder.sustainabilityRating} / 100
                        </div>
                        <div className="metric-label">Sustainability Rating</div>
                      </div>
                      <div className="metric-item">
                        <div className="metric-icon">
                          {selectedOrder.greenShipping ? <FaCheckCircle className="icon-success" /> : <FaTimesCircle className="icon-danger" />}
                        </div>
                        <div className="metric-label">Green Shipping</div>
                      </div>
                      <div className="metric-item">
                        <div className="metric-icon">
                          {selectedOrder.carbonOffset ? <FaCheckCircle className="icon-success" /> : <FaTimesCircle className="icon-danger" />}
                        </div>
                        <div className="metric-label">Carbon Offset</div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="order-modal-footer">
                  <button className="form-button btn-secondary" onClick={closeOrderDetails}>
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default OrderManagement;