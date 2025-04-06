import React from 'react';
import { Link } from 'react-router-dom';
import { FaRocket, FaGithub, FaSatellite, FaSpaceShuttle, FaStar, FaMeteor, FaAtom } from 'react-icons/fa';

const Footer = () => {
  // Get current year for copyright
  const currentYear = new Date().getFullYear();
  
  // Get approximate cosmic energy conserved by efficient website
  const getCosmicEnergyConserved = () => {
    // Cosmic version of carbon saved metric
    return '1.26 quantum units';
  };
  
  return (
    <footer className="footer stars-bg">
      {/* Cosmic wave separator */}
      <div className="cosmic-waves">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320" preserveAspectRatio="none">
          <path fill="rgba(139, 92, 246, 0.3)" d="M0,64L40,96C80,128,160,192,240,186.7C320,181,400,107,480,112C560,117,640,203,720,208C800,213,880,139,960,144C1040,149,1120,235,1200,245.3C1280,256,1360,192,1400,160L1440,128L1440,0L1400,0C1360,0,1280,0,1200,0C1120,0,1040,0,960,0C880,0,800,0,720,0C640,0,560,0,480,0C400,0,320,0,240,0C160,0,80,0,40,0L0,0Z"></path>
        </svg>
      </div>
      
      <div className="footer-content">
        <div className="footer-section">
          <h3 className="cosmic-heading">Smart Shop</h3>
          <p>Interstellar commerce platform with cosmic products.</p>
          <div className="cosmic-badge">
            <FaStar className="cosmic-pulse" />
            <span>Space Energy Conserved: ~{getCosmicEnergyConserved()} per warp</span>
          </div>
        </div>
        
        <div className="footer-section">
          <h3 className="cosmic-heading">Navigate</h3>
          <ul className="footer-links">
            <li><Link to="/" className="cosmic-link"><span className="link-text">Products</span></Link></li>
            <li><Link to="/cart" className="cosmic-link"><span className="link-text">Shopping Cart</span></Link></li>
            <li><Link to="/green-metrics" className="cosmic-link"><span className="link-text">Space Metrics</span></Link></li>
          </ul>
        </div>
        
        <div className="footer-section">
          <h3 className="cosmic-heading">Space Tools</h3>
          <ul className="footer-links">
            <li><Link to="/chat" className="cosmic-link"><span className="link-text">Space Guide</span></Link></li>
            <li>
              <a href="#" className="cosmic-link" onClick={(e) => {
                e.preventDefault();
                // On-demand loading to save resources
                alert('Cosmic calculator loading on demand to conserve energy');
              }}>
                <span className="link-text">Smart Calculator</span>
              </a>
            </li>
            <li><Link to="/green-metrics" className="cosmic-link"><span className="link-text">Cosmic Impact</span></Link></li>
          </ul>
        </div>
        
        <div className="footer-section">
          <h3 className="cosmic-heading">Our Green Technologies</h3>
          <ul className="footer-links cosmic-features">
            <li>
              <FaAtom className="cosmic-icon" />
              <span>efficient code</span>
            </li>
            <li>
              <FaSatellite className="cosmic-icon" />
              <span> Low-energy space hosting</span>
            </li>
            <li>
              <FaMeteor className="cosmic-icon" />
              <span> Sustainability</span>
            </li>
          </ul>
        </div>
      </div>
      
      <div className="cosmic-copyright">
        <p>
          &copy; {currentYear} Smart Shop. All rights reserved across the universe. 
          <br />
          <small>Engineered with quantum efficiency to minimize cosmic energy consumption.</small>
        </p>
      </div>
      
      {/* Shooting star animation */}
      <div className="shooting-star footer-star"></div>
      <div className="shooting-star footer-star delay1"></div>
      
      {/* CSS for cosmic styling */}
      <style jsx>{`
        .footer {
          position: relative;
          background: linear-gradient(to bottom, #1E293B, #0F172A);
          color: var(--light-text);
          padding: 3rem 2rem 2rem;
          margin-top: auto;
          overflow: hidden;
        }
        
        .cosmic-waves {
          position: absolute;
          top: -2px;
          left: 0;
          right: 0;
          width: 100%;
          overflow: hidden;
          line-height: 0;
          transform: rotate(180deg);
        }
        
        .cosmic-waves svg {
          position: relative;
          display: block;
          width: 100%;
          height: 70px;
        }
        
        .cosmic-heading {
          color: #A5F3FC;
          position: relative;
          display: inline-block;
          font-weight: 600;
          margin-bottom: 1.2rem;
          text-shadow: 0 0 10px rgba(165, 243, 252, 0.5);
        }
        
        .cosmic-heading::after {
          content: "";
          position: absolute;
          bottom: -8px;
          left: 0;
          width: 40px;
          height: 3px;
          background: linear-gradient(90deg, #7E22CE, #EC4899);
          border-radius: 3px;
        }
        
        .cosmic-badge {
          display: flex;
          align-items: center;
          background: rgba(79, 70, 229, 0.2);
          border-left: 3px solid #F472B6;
          padding: 0.5rem 1rem;
          border-radius: 4px;
          margin-top: 1rem;
          backdrop-filter: blur(5px);
          box-shadow: 0 0 15px rgba(79, 70, 229, 0.3);
        }
        
        .cosmic-pulse {
          margin-right: 0.75rem;
          color: #F472B6;
          animation: pulse 2s infinite alternate;
        }
        
        .cosmic-link {
          display: flex;
          align-items: center;
          position: relative;
          color: var(--light-text);
          text-decoration: none;
          padding: 0.25rem 0;
          transition: all 0.3s ease;
          transform-origin: left;
        }
        
        .cosmic-link:hover {
          transform: translateX(8px);
          color: #A5F3FC;
        }
        
        .cosmic-link:hover .link-text {
          text-shadow: 0 0 8px rgba(165, 243, 252, 0.6);
        }
        
        .cosmic-link::before {
          content: '';
          position: absolute;
          top: 50%;
          left: -12px;
          width: 6px;
          height: 6px;
          background: #EC4899;
          border-radius: 50%;
          transform: translateY(-50%) scale(0);
          transition: transform 0.3s ease;
          box-shadow: 0 0 8px #EC4899;
        }
        
        .cosmic-link:hover::before {
          transform: translateY(-50%) scale(1);
        }
        
        .cosmic-features li {
          display: flex;
          align-items: center;
          margin-bottom: 0.75rem;
        }
        
        .cosmic-icon {
          color: #A5F3FC;
          margin-right: 0.5rem;
          animation: pulse 3s infinite alternate;
        }
        
        .cosmic-copyright {
          text-align: center;
          margin-top: 2.5rem;
          font-size: 0.9rem;
          color: var(--text-secondary);
          position: relative;
          z-index: 5;
        }
        
        .footer-star {
          animation: shootingStar 6s linear infinite;
          animation-delay: 1s;
          top: 70%;
          left: 10%;
        }
        
        .delay1 {
          animation-delay: 8s;
          top: 30%;
          left: 75%;
        }
        
        @keyframes pulse {
          0% { transform: scale(1); opacity: 0.8; }
          100% { transform: scale(1.2); opacity: 1; }
        }
      `}</style>
    </footer>
  );
};

export default Footer;