import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaRocket, FaShoppingCart, FaComments, FaChartLine, FaStar, FaSpaceShuttle } from 'react-icons/fa';
import { useCart } from '../../context/CartContext';

const Header = ({ metrics }) => {
  const { totalItems } = useCart();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  
  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  // Cosmic energy rating (replaced green energy class)
  const getCosmicEnergyRating = () => {
    if (!metrics) return 'Quantum';
    
    const score = metrics.pageLoads + (metrics.apiCalls * 2) + (metrics.dataTransferred / 50);
    
    if (score < 10) return 'Quantum';
    if (score < 20) return 'Nebula';
    if (score < 30) return 'Stellar';
    if (score < 50) return 'Solar';
    return 'Cosmic';
  };
  
  return (
    <header className={`header stars-bg ${scrolled ? 'header-scrolled' : ''}`}>
      {/* Adding shooting stars for visual effect */}
      <div className="shooting-star"></div>
      <div className="shooting-star"></div>
      
      {/* Animated cosmic gradient background */}
      <div className="header-backdrop"></div>
      
      <div className="header-content">
        <Link to="/" className="logo cosmic-logo">
          <FaRocket size={28} className="logo-icon" />
          <span>Cosmic Shop</span>
          <div className="logo-glow"></div>
        </Link>
        
        {/* Cosmic energy indicator */}
        <div className="cosmic-badge" title="Website cosmic energy rating">
          <FaStar size={16} className="cosmic-pulse" />
          <span>Energy: <strong>{getCosmicEnergyRating()}</strong></span>
        </div>
        
        <nav>
          <ul className="nav-links">
            <li>
              <Link to="/" className={location.pathname === '/' ? 'active' : ''}>
                <span className="nav-text">Products</span>
                <div className="nav-highlight"></div>
              </Link>
            </li>
            <li>
              <Link to="/green-metrics" className={location.pathname === '/green-metrics' ? 'active' : ''}>
                <FaChartLine className="nav-icon" />
                <span className="nav-text">Space Stats</span>
                <div className="nav-highlight"></div>
              </Link>
            </li>
            <li>
              <Link to="/chat" className={location.pathname === '/chat' ? 'active' : ''}>
                <FaComments className="nav-icon" />
                <span className="nav-text">Space Guide</span>
                <div className="nav-highlight"></div>
              </Link>
            </li>
            <li>
              <Link to="/cart" className={`cart-icon ${location.pathname === '/cart' ? 'active' : ''}`}>
                <FaShoppingCart size={20} />
                {totalItems > 0 && (
                  <span className="cart-count">{totalItems}</span>
                )}
                <div className="nav-highlight"></div>
              </Link>
            </li>
          </ul>
        </nav>
      </div>
      
      {/* Add CSS to make this work with our cosmic theme in App.css */}
      <style jsx>{`
        .header {
          background: var(--cosmic-gradient);
          position: sticky;
          top: 0;
          z-index: 1000;
          transition: all 0.3s ease;
          overflow: hidden;
        }
        
        .header-scrolled {
          padding: 0.5rem 2rem;
          box-shadow: 0 5px 20px rgba(79, 70, 229, 0.4);
        }
        
        .header-backdrop {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: var(--cosmic-gradient);
          opacity: 0.9;
          z-index: -1;
        }
        
        .cosmic-logo {
          display: flex;
          align-items: center;
          position: relative;
          z-index: 2;
        }
        
        .logo-icon {
          color: #f472b6;
          filter: drop-shadow(0 0 5px rgba(244, 114, 182, 0.8));
          margin-right: 0.5rem;
          animation: pulse 2s infinite alternate;
        }
        
        .logo-glow {
          position: absolute;
          width: 100%;
          height: 100%;
          border-radius: 50%;
          filter: blur(15px);
          background: radial-gradient(circle, rgba(244, 114, 182, 0.6) 0%, rgba(79, 70, 229, 0) 70%);
          z-index: -1;
          animation: glow 3s infinite alternate;
        }
        
        .cosmic-badge {
          display: flex;
          align-items: center;
          background: rgba(139, 92, 246, 0.3);
          border-left: 3px solid #f472b6;
          border-radius: 4px;
          padding: 0.25rem 0.75rem;
          font-size: 0.85rem;
          backdrop-filter: blur(5px);
          box-shadow: 0 0 15px rgba(244, 114, 182, 0.4);
          transition: all 0.3s ease;
        }
        
        .cosmic-badge:hover {
          transform: translateY(-3px);
          box-shadow: 0 0 20px rgba(244, 114, 182, 0.6);
        }
        
        .cosmic-pulse {
          margin-right: 0.5rem;
          color: #f472b6;
          animation: pulse 2s infinite alternate;
        }
        
        .nav-links a {
          position: relative;
          display: flex;
          align-items: center;
          padding: 0.5rem 0.75rem;
          color: var(--light-text);
          text-decoration: none;
          transition: all 0.3s ease;
          overflow: hidden;
        }
        
        .nav-icon {
          margin-right: 0.5rem;
        }
        
        .nav-highlight {
          position: absolute;
          bottom: 0;
          left: 0;
          width: 100%;
          height: 2px;
          background: linear-gradient(90deg, transparent, #f472b6, transparent);
          transform: scaleX(0);
          transition: transform 0.3s ease;
        }
        
        .nav-links a:hover .nav-highlight,
        .nav-links a.active .nav-highlight {
          transform: scaleX(1);
        }
        
        .nav-links a:hover,
        .nav-links a.active {
          color: #f9fafb;
          text-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
        }
        
        .cart-count {
          background: #f472b6;
          color: white;
          text-shadow: none;
          box-shadow: 0 0 10px rgba(244, 114, 182, 0.6);
        }
        
        @keyframes pulse {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.1); opacity: 0.8; }
          100% { transform: scale(1); opacity: 1; }
        }
        
        @keyframes glow {
          0% { opacity: 0.5; filter: blur(15px); }
          50% { opacity: 0.8; filter: blur(20px); }
          100% { opacity: 0.5; filter: blur(15px); }
        }
      `}</style>
    </header>
  );
};

export default Header;