import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import ProductList from './components/products/ProductList';
import ProductDetail from './components/products/ProductDetail';
import Cart from './components/cart/Cart';
import Checkout from './components/cart/Checkout';
import SustainableChat from './components/chat/SustainableChat';
import GreenMetrics from './components/dashboard/GreenMetrics';
import { CartProvider } from './context/CartContext';
import './App.css';

// Green practice: Use React.lazy for code splitting to reduce initial load size
const Dashboard = React.lazy(() => import('./components/dashboard/Dashboard'));

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
      <CartProvider>
        <div className="app-container">
          <Header metrics={resourceMetrics} />
          
          <main className="main-content">
            <React.Suspense fallback={<div>Loading...</div>}>
              <Routes>
                <Route path="/" element={<ProductList onApiCall={trackApiCall} />} />
                <Route path="/product/:id" element={<ProductDetail onApiCall={trackApiCall} />} />
                <Route path="/cart" element={<Cart onApiCall={trackApiCall} />} />
                <Route path="/checkout" element={<Checkout onApiCall={trackApiCall} />} />
                <Route path="/chat" element={<SustainableChat onApiCall={trackApiCall} />} />
                <Route path="/dashboard" element={<Dashboard metrics={resourceMetrics} />} />
                <Route path="/green-metrics" element={<GreenMetrics />} />
              </Routes>
            </React.Suspense>
          </main>
          
          <Footer />
        </div>
      </CartProvider>
    </Router>
  );
}

export default App;