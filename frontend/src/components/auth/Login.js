import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FaRocket, FaUser, FaLock, FaSpaceShuttle } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import './Auth.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState('');
  const { login, isAuthenticated, loading, error } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get redirect path from location state or default to home
  const from = location.state?.from?.pathname || '/';
  
  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      // Check if user is admin
      if (email === 'admin@gmail.com' && password === 'admin') {
        navigate('/admin/dashboard', { replace: true });
      } else {
        navigate(from, { replace: true });
      }
    }
  }, [isAuthenticated, navigate, from, email, password]);
  
  // Update form error when auth context error changes
  useEffect(() => {
    if (error) {
      setFormError(error);
    }
  }, [error]);
  
  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    
    // Basic validation - check if fields are filled
    if (!email || !password) {
      setFormError('Please enter both email and password');
      return;
    }
    
    // ADMIN LOGIN - Direct redirect with no additional checks
    if (email === 'admin@gmail.com' && password === 'admin') {
      // Force navigation directly to admin dashboard
      navigate('/admin/dashboard', { replace: true });
      return;
    }
    
    // Regular user validation (only if not admin)
    
    // Email validation using regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setFormError('Please enter a valid email address');
      return;
    }
    
    // Minimum password length - this won't run for admin credentials
    if (password.length < 5) {
      setFormError('Password must be at least 5 characters');
      return;
    }
    
    // Attempt login for regular user
    const result = await login(email, password);
    
    if (result?.success) {
      // Successful login will trigger useEffect redirect
    }
  };
  
  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1 className="auth-title">
            <FaSpaceShuttle className="auth-icon" /> Login
          </h1>
          <p className="auth-subtitle">Enter your credentials to access your account</p>
        </div>
        
        {formError && (
          <div className="form-error" role="alert">
            {formError}
          </div>
        )}
        
        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email" className="form-label">
              <FaUser className="auth-icon" /> Email
            </label>
            <input
              id="email"
              type="email"
              className="form-input"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password" className="form-label">
              <FaLock className="auth-icon" /> Password
            </label>
            <input
              id="password"
              type="password"
              className="form-input"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              required
            />
          </div>
          
          <button 
            type="submit" 
            className="auth-button" 
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="auth-spinner"></span>
                Logging in...
              </>
            ) : (
              <>
                <FaRocket className="auth-icon" /> Login
              </>
            )}
          </button>
        </form>
        
        <div className="auth-footer">
          Don't have an account?{' '}
          <Link to="/register" className="auth-link">
            Register here
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;