import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import ProductList from './components/products/ProductList';
import ProductDetail from './components/products/ProductDetail';
import Cart from './components/cart/Cart';
import Checkout from './components/cart/Checkout';
import SustainableChat from './components/chat/SustainableChat';
import GreenMetrics from './components/dashboard/GreenMetrics';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import ProtectedRoute from './components/auth/ProtectedRoute';
import { CartProvider } from './context/CartContext';
import { AuthProvider } from './context/AuthContext';
import './App.css';

// Green practice: Use React.lazy for code splitting to reduce initial load size
const Dashboard = React.lazy(() => import('./components/dashboard/Dashboard'));
const Profile = React.lazy(() => import('./components/auth/Profile'));
const OrderHistory = React.lazy(() => import('./components/orders/OrderHistory'));

// Admin components
const AdminDashboard = React.lazy(() => import('./components/admin/AdminDashboard'));
const AdminDashboardHome = React.lazy(() => import('./components/admin/Dashboard'));
const ProductManagement = React.lazy(() => import('./components/admin/ProductManagement'));
const OrderManagement = React.lazy(() => import('./components/admin/OrderManagement'));

function App() {
  // Green practice: Track and display energy consumption metrics
  const [resourceMetrics, setResourceMetrics] = useState({
    pageLoads: 0,
    apiCalls: 0,
    dataTransferred: 0, // in KB
  });

  useEffect(() => {
    // Increment page load counter
    setResourceMetrics(prev => ({
      ...prev,
      pageLoads: prev.pageLoads + 1
    }));

    // Log metrics for green software monitoring
    console.log('Green E-commerce App initialized');
    
    // Clean up event listeners on unmount to prevent memory leaks (green practice)
    return () => {
      console.log('App cleanup performed');
    };
  }, []);

  // Intercept API calls to track metrics (simplified example)
  const trackApiCall = (size = 1) => {
    setResourceMetrics(prev => ({
      ...prev,
      apiCalls: prev.apiCalls + 1,
      dataTransferred: prev.dataTransferred + size
    }));
  };

  return (
    <Router>
      <AuthProvider>
        <CartProvider>
          <div className="app-container">
            <Header metrics={resourceMetrics} />
            
            <main className="main-content">
              <React.Suspense fallback={
                <div className="loading-container">
                  <div className="cosmic-loader">
                    <div className="spinner"></div>
                    <p>Loading cosmic content...</p>
                  </div>
                </div>
              }>
                <Routes>
                  {/* Public Routes */}
                  <Route path="/" element={<ProductList onApiCall={trackApiCall} />} />
                  <Route path="/product/:id" element={<ProductDetail onApiCall={trackApiCall} />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/green-metrics" element={<GreenMetrics />} />
                  
                  {/* Protected Routes */}
                  <Route element={<ProtectedRoute />}>
                    <Route path="/cart" element={<Cart onApiCall={trackApiCall} />} />
                    <Route path="/checkout" element={<Checkout onApiCall={trackApiCall} />} />
                    <Route path="/profile" element={<Profile onApiCall={trackApiCall} />} />
                    <Route path="/orders" element={<OrderHistory onApiCall={trackApiCall} />} />
                    <Route path="/dashboard" element={<Dashboard metrics={resourceMetrics} />} />
                    <Route path="/chat" element={<SustainableChat onApiCall={trackApiCall} />} />
                  </Route>
                  
                  {/* Admin Routes */}
                  <Route path="/admin">
                    <Route index element={<Navigate to="/admin/dashboard" />} />
                    <Route path="dashboard" element={<AdminDashboardHome />} />
                    <Route path="products" element={<ProductManagement />} />
                    <Route path="orders" element={<OrderManagement />} />
                  </Route>
                  
                  {/* Fallback for invalid routes */}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </React.Suspense>
            </main>
            
            <Footer />
          </div>
        </CartProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;