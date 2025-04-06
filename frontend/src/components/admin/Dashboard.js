import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaBoxOpen, FaChartLine, FaClipboardList, FaDollarSign, FaLeaf, FaShoppingCart, FaUsers } from 'react-icons/fa';
import axios from '../../utils/axiosConfig';
import './AdminStyles.css';

const Dashboard = () => {
  const [stats, setStats] = useState({
    productCount: 0,
    orderCount: 0,
    totalRevenue: 0,
    recentOrders: [],
    sustainabilityScore: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    fetchDashboardData();
  }, []);
  
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Use direct database count endpoints for product and order counts
      const [productCountRes, orderCountRes, ordersRes, productsRes] = await Promise.all([
        axios.get('/api/products/admin/count'),
        axios.get('/api/orders/admin/count'),
        axios.get('/api/orders/admin'),
        axios.get('/api/products')
      ]);
      
      const products = productsRes.data.products || [];
      const orders = ordersRes.data.orders || [];
      
      // Get counts directly from database
      const productCount = productCountRes.data.count;
      const orderCount = orderCountRes.data.count;
      
      // Calculate statistics
      const totalRevenue = orders.reduce((sum, order) => sum + order.totalPrice, 0);
      const avgSustainability = products.length > 0 
        ? products.reduce((sum, product) => sum + (product.sustainabilityScore || 0), 0) / products.length 
        : 0;
      
      setStats({
        productCount,
        orderCount,
        totalRevenue,
        recentOrders: orders.slice(0, 5), // Get 5 most recent orders
        sustainabilityScore: avgSustainability
      });
      
      setError(null);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data. Please try again.');
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
  
  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
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
  
  return (
    <div className="admin-dashboard-home">
      <h2>Dashboard Overview</h2>
      
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}
      
      {loading ? (
        <div className="loading-spinner">
          <span className="spinner"></span>
          <p>Loading dashboard data...</p>
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="admin-cards">
            <div className="admin-card">
              <div className="admin-card-header">
                <h3 className="admin-card-title">Products</h3>
                <FaBoxOpen className="admin-card-icon" />
              </div>
              <div className="admin-card-value">{stats.productCount}</div>
              <p className="admin-card-description">Total products in inventory</p>
              <Link to="/admin/products" className="card-link">Manage Products</Link>
            </div>
            
            <div className="admin-card">
              <div className="admin-card-header">
                <h3 className="admin-card-title">Orders</h3>
                <FaClipboardList className="admin-card-icon" />
              </div>
              <div className="admin-card-value">{stats.orderCount}</div>
              <p className="admin-card-description">Total orders placed</p>
              <Link to="/admin/orders" className="card-link">View All Orders</Link>
            </div>
            
            <div className="admin-card">
              <div className="admin-card-header">
                <h3 className="admin-card-title">Revenue</h3>
                <FaDollarSign className="admin-card-icon" />
              </div>
              <div className="admin-card-value">{formatCurrency(stats.totalRevenue)}</div>
              <p className="admin-card-description">Total revenue generated</p>
            </div>
            
            
          </div>
          
          {/* Recent Orders */}
          <div className="admin-section">
            <div className="section-header">
              <h3><FaShoppingCart /> Recent Orders</h3>
              <Link to="/admin/orders" className="view-all-link">View All</Link>
            </div>
            
            <div className="admin-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th color='#007bff'>Order ID</th>
                    <th color='#007bff'>Date</th>
                    <th color='#007bff'>Customer</th>
                    <th color='#007bff'>Total</th>
                    <th color='#007bff'>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentOrders.length === 0 ? (
                    <tr>
                      <td colSpan="5" style={{ textAlign: 'center' }}>No orders found</td>
                    </tr>
                  ) : (
                    stats.recentOrders.map(order => (
                      <tr  color='#007bff' key={order._id}>
                        <td color='#007bff'>#{order._id.substring(order._id.length - 6).toUpperCase()}</td>
                        <td color='#007bff'>{formatDate(order.createdAt)}</td>
                        <td color='#007bff'>{order.user.username || order.user.email || 'Unknown'}</td>
                        <td color='#007bff'>{formatCurrency(order.totalPrice)}</td>
                        <td>
                          <span className={`status-badge ${getStatusBadgeClass(order.orderStatus)}`}>
                            {order.orderStatus}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
          
          {/* Quick Actions */}
          <div className="admin-section">
            <div className="section-header">
              
            </div>
            
            <div className="quick-actions">
              <Link to="/admin/products" className="action-card">
                <FaBoxOpen className="action-icon" />
                <span className='hello'>Add New Product</span>
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;