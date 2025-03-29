import React from 'react';
import { Link } from 'react-router-dom';
import { FaLeaf, FaShoppingCart, FaComments, FaChartLine } from 'react-icons/fa';
import { useCart } from '../../context/CartContext';

const Header = ({ metrics }) => {
  const { totalItems } = useCart();
  
  // Green practice: Calculate energy efficiency class based on metrics
  const getEnergyClass = () => {
    if (!metrics) return 'A+';
    
    const score = metrics.pageLoads + (metrics.apiCalls * 2) + (metrics.dataTransferred / 50);
    
    if (score < 10) return 'A+';
    if (score < 20) return 'A';
    if (score < 30) return 'B';
    if (score < 50) return 'C';
    return 'D';
  };
  
  return (
    <header className="header">
      <div className="header-content">
        <Link to="/" className="logo">
          <FaLeaf size={24} />
          <span>Green Shop</span>
        </Link>
        
        {/* Energy efficiency badge */}
        <div className="eco-badge" title="Website energy efficiency rating">
          <FaLeaf size={14} />
          <span>Energy Class {getEnergyClass()}</span>
        </div>
        
        <nav>
          <ul className="nav-links">
            <li>
              <Link to="/">Products</Link>
            </li>
            <li>
              <Link to="/green-metrics">
                <FaChartLine />
                <span>Eco Impact</span>
              </Link>
            </li>
            <li>
              <Link to="/chat">
                <FaComments />
                <span>Eco Assistant</span>
              </Link>
            </li>
            <li>
              <Link to="/cart" className="cart-icon">
                <FaShoppingCart size={20} />
                {totalItems > 0 && (
                  <span className="cart-count">{totalItems}</span>
                )}
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default Header;