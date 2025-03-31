import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaRocket, FaUser, FaLock, FaEnvelope, FaIdCard, FaSpaceShuttle } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import './Auth.css';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const [formError, setFormError] = useState('');
  const { register, isAuthenticated, loading, error } = useAuth();
  const navigate = useNavigate();

  // Destructure form data
  const { name, email, password, confirmPassword } = formData;

  // Debug: Log initial state
  console.log("🔍 Initial formData:", formData);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      console.log("✅ User is authenticated, redirecting to home...");
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  // Update form error when auth context error changes
  useEffect(() => {
    if (error) {
      console.log("❌ Authentication Error:", error);
      setFormError(error);
    }
  }, [error]);

  // Handle input changes
  const handleChange = (e) => {
    const { id, value } = e.target;

    console.log(`✏ Updating field: ${id}, New Value: ${value}`); // Debugging log

    setFormData((prevData) => ({
      ...prevData,
      [id]: value
    }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    console.log("📤 Form Data before submission:", formData); // Debugging log

    // ** Debug: Ensure state has latest values **
    console.log("🔍 Current Name Value:", name);
    console.log("🔍 Current Email Value:", email);
    console.log("🔍 Current Password Value:", password);
    console.log("🔍 Current Confirm Password Value:", confirmPassword);

    // Check if any field is empty
    if (!name || !email || !password || !confirmPassword) {
      console.log("⚠ Missing required fields");
      setFormError('⚠ Please fill in all fields');
      return;
    }

    // Name validation
    if (name.length < 2) {
      console.log("⚠ Name is too short");
      setFormError('⚠ Name must be at least 2 characters');
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.log("⚠ Invalid email format");
      setFormError('⚠ Please enter a valid email address');
      return;
    }

    // Password validation
    if (password.length < 6) {
      console.log("⚠ Password is too short");
      setFormError('⚠ Password must be at least 6 characters');
      return;
    }

    // Password strength validation
    const hasLetter = /[a-z]/i.test(password);
    const hasNumber = /\d/.test(password);
    if (!hasLetter || !hasNumber) {
      console.log("⚠ Password lacks required characters");
      setFormError('⚠ Password must contain at least one letter and one number');
      return;
    }

    // Confirm password
    if (password !== confirmPassword) {
      console.log("⚠ Passwords do not match");
      setFormError('⚠ Passwords do not match');
      return;
    }

    // ** Debug: Check what we are sending to register function **
    console.log("📡 Sending Data to Register Function:", { name, email, password });

    const result = await register({ name, email, password });

    if (result?.success) {
      console.log("✅ Registration successful! Redirecting...");
    } else {
      console.log("❌ Registration failed:", result);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1 className="auth-title">
            <FaSpaceShuttle className="auth-icon" /> Register
          </h1>
          <p className="auth-subtitle">Create your account to start exploring</p>
        </div>

        {formError && (
          <div className="form-error" role="alert">
            {formError}
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name" className="form-label">
              <FaIdCard className="auth-icon" /> Full Name
            </label>
            <input
              id="name"
              type="text"
              className="form-input"
              placeholder="Enter your name"
              value={name}
              onChange={handleChange}
              disabled={loading}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="email" className="form-label">
              <FaEnvelope className="auth-icon" /> Email
            </label>
            <input
              id="email"
              type="email"
              className="form-input"
              placeholder="Enter your email"
              value={email}
              onChange={handleChange}
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
              placeholder="Create a password"
              value={password}
              onChange={handleChange}
              disabled={loading}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword" className="form-label">
              <FaLock className="auth-icon" /> Confirm Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              className="form-input"
              placeholder="Confirm your password"
              value={confirmPassword}
              onChange={handleChange}
              disabled={loading}
              required
            />
          </div>

          <button type="submit" className="auth-button" disabled={loading}>
            {loading ? (
              <>
                <span className="auth-spinner"></span> Creating Account...
              </>
            ) : (
              <>
                <FaRocket className="auth-icon" /> Create Account
              </>
            )}
          </button>
        </form>

        <div className="auth-footer">
          Already have an account?{' '}
          <Link to="/login" className="auth-link">
            Login here
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
