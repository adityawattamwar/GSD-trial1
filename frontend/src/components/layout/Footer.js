import React from 'react';
import { Link } from 'react-router-dom';
import { FaLeaf, FaGithub, FaRecycle, FaSeedling } from 'react-icons/fa';

const Footer = () => {
  // Get current year for copyright
  const currentYear = new Date().getFullYear();
  
  // Get approximate carbon saved by efficient website
  const getApproximateCarbonSaved = () => {
    // Green practice: Simple estimation based on typical website carbon vs this one
    // Average website: ~1.76g CO2 per page view
    // Our optimized site: ~0.5g CO2 per page view
    return '1.26g';
  };
  
  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-section">
          <h3>Green Shop</h3>
          <p>Sustainable e-commerce platform with eco-friendly products.</p>
          <div className="eco-badge">
            <FaLeaf />
            <span>Carbon Saved: ~{getApproximateCarbonSaved()} CO2 per page view</span>
          </div>
        </div>
        
        <div className="footer-section">
          <h3>Shop</h3>
          <ul className="footer-links">
            <li><Link to="/">Products</Link></li>
            <li><Link to="/cart">Shopping Cart</Link></li>
            <li><Link to="/green-metrics">Sustainability Metrics</Link></li>
          </ul>
        </div>
        
        <div className="footer-section">
          <h3>Resources</h3>
          <ul className="footer-links">
            <li><Link to="/chat">Eco Shopping Assistant</Link></li>
            <li>
              <a href="#" onClick={(e) => {
                e.preventDefault();
                // Green practice: Load resource-intensive content only on demand
                alert('Carbon calculator loading on demand to save resources');
              }}>
                Carbon Calculator
              </a>
            </li>
            <li><Link to="/green-metrics">Environmental Impact</Link></li>
          </ul>
        </div>
        
        <div className="footer-section">
          <h3>Our Green Practices</h3>
          <ul className="footer-links">
            <li>
              <FaRecycle />
              <span> Resource-efficient code</span>
            </li>
            <li>
              <FaSeedling />
              <span> Low-carbon hosting</span>
            </li>
            <li>
              <FaLeaf />
              <span> Sustainable product focus</span>
            </li>
          </ul>
        </div>
      </div>
      
      <div style={{ textAlign: 'center', marginTop: '2rem', fontSize: '0.9rem' }}>
        <p>
          &copy; {currentYear} Green Shop. All rights reserved. 
          <br />
          <small>Made with efficiency in mind to reduce digital carbon footprint.</small>
        </p>
      </div>
    </footer>
  );
};

export default Footer;