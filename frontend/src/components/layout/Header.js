import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  FaRocket, FaShoppingCart, FaComments, FaChartLine, FaStar, FaSpaceShuttle, 
  FaUser, FaSignInAlt, FaUserPlus, FaSignOutAlt, FaClipboardList, FaUserAstronaut, 
  FaCaretDown 
} from 'react-icons/fa';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';

const Header = ({ metrics }) => {
  const { totalItems } = useCart();
  const { user, isAuthenticated, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  
  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  // Handle click outside dropdown to close it
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dropdownRef]);
  
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
  
  // Handle logout
  const handleLogout = async () => {
    await logout();
    navigate('/login');
    setDropdownOpen(false);
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
            
            {/* Authentication Links */}
            {isAuthenticated ? (
              <li className="user-dropdown" ref={dropdownRef}>
                <button 
                  className={`dropdown-trigger ${dropdownOpen ? 'active' : ''}`}
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                >
                  <FaUserAstronaut className="nav-icon" />
                  <span className="nav-text">{user?.name?.split(' ')[0] || 'Explorer'}</span>
                  <FaCaretDown className="caret-icon" />
                </button>
                
                {dropdownOpen && (
                  <div className="dropdown-menu">
                    <Link to="/profile" onClick={() => setDropdownOpen(false)}>
                      <FaUser className="dropdown-icon" />
                      Profile
                    </Link>
                    <Link to="/orders" onClick={() => setDropdownOpen(false)}>
                      <FaClipboardList className="dropdown-icon" />
                      My Orders
                    </Link>
                    <Link to="/dashboard" onClick={() => setDropdownOpen(false)}>
                      <FaChartLine className="dropdown-icon" />
                      Dashboard
                    </Link>
                    <button className="logout-button" onClick={handleLogout}>
                      <FaSignOutAlt className="dropdown-icon" />
                      Logout
                    </button>
                  </div>
                )}
              </li>
            ) : (
              <>
                <li>
                  <Link to="/login" className={location.pathname === '/login' ? 'active' : ''}>
                    <FaSignInAlt className="nav-icon" />
                    <span className="nav-text">Login</span>
                    <div className="nav-highlight"></div>
                  </Link>
                </li>
                <li>
                  <Link to="/register" className={location.pathname === '/register' ? 'active' : ''}>
                    <FaUserPlus className="nav-icon" />
                    <span className="nav-text">Register</span>
                    <div className="nav-highlight"></div>
                  </Link>
                </li>
              </>
            )}
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
        
        /* User dropdown styles */
        .user-dropdown {
          position: relative;
          height: 100%;
        }
        
        .dropdown-trigger {
          display: flex;
          align-items: center;
          background: none;
          border: none;
          color: var(--light-text);
          padding: 0.5rem 0.75rem;
          cursor: pointer;
          font-family: inherit;
          font-size: inherit;
          transition: all 0.3s ease;
        }
        
        .dropdown-trigger:hover,
        .dropdown-trigger.active {
          color: #f9fafb;
          text-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
        }
        
        .caret-icon {
          margin-left: 0.25rem;
          transition: transform 0.3s ease;
        }
        
        .dropdown-trigger.active .caret-icon {
          transform: rotate(180deg);
        }
        
        .dropdown-menu {
          position: fixed;
          margin-top: 10px;
          right: inherit;
          background: rgba(30, 41, 59, 0.98);
          max-height: calc(100vh - 80px);
          overflow-y: auto;
          border: 1px solid rgba(79, 70, 229, 0.3);
          border-radius: var(--radius-md);
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2), 0 0 15px rgba(79, 70, 229, 0.3);
          overflow: hidden;
          z-index: 1000;
          backdrop-filter: blur(10px);
          animation: fadeInDown 0.2s ease-out;
        }

        /* Add custom scrollbar for dropdown */
        .dropdown-menu::-webkit-scrollbar {
          width: 6px;
        }

        .dropdown-menu::-webkit-scrollbar-track {
          background: rgba(79, 70, 229, 0.1);
        }

        .dropdown-menu::-webkit-scrollbar-thumb {
          background: rgba(79, 70, 229, 0.3);
          border-radius: 3px;
        }

        .dropdown-menu::-webkit-scrollbar-thumb:hover {
          background: rgba(79, 70, 229, 0.5);
        }
        
        .dropdown-menu a,
        .dropdown-menu button {
          display: flex;
          align-items: center;
          padding: 0.75rem 1rem;
          color: var(--text-color);
          text-decoration: none;
          transition: all 0.2s ease;
          border-bottom: 1px solid rgba(79, 70, 229, 0.1);
          width: 100%;
          text-align: left;
          background: none;
          border: none;
          font-family: inherit;
          font-size: inherit;
          cursor: pointer;
        }
        
        .dropdown-menu a:last-child,
        .dropdown-menu button:last-child {
          border-bottom: none;
        }
        
        .dropdown-menu a:hover,
        .dropdown-menu button:hover {
          background: rgba(79, 70, 229, 0.1);
          color: var(--primary-color);
          padding-left: 1.25rem;
        }
        
        .dropdown-icon {
          margin-right: 0.75rem;
          color: var(--primary-color);
        }
        
        .logout-button {
          color: #ef4444 !important;
        }
        
        .logout-button:hover {
          background: rgba(239, 68, 68, 0.1) !important;
        }
        
        .logout-button .dropdown-icon {
          color: #ef4444;
        }
        
        @keyframes fadeInDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
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