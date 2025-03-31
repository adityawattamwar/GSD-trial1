import React, { useState, useEffect } from 'react';
import { FaUser, FaEnvelope, FaEdit, FaCheck, FaTimes, FaSpaceShuttle } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import './Auth.css';

const Profile = ({ onApiCall }) => {
  const { user, updateProfile, loading, error } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: ''
  });
  const [formError, setFormError] = useState('');
  const [updateSuccess, setUpdateSuccess] = useState(false);

  // Initialize form data when user data loads
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || ''
      });
    }
  }, [user]);

  // Track API calls
  useEffect(() => {
    if (onApiCall && user) {
      // Estimate size of user profile data in KB
      const userDataSize = JSON.stringify(user).length / 1024;
      onApiCall(userDataSize);
    }
  }, [user, onApiCall]);

  // Reset success message after display
  useEffect(() => {
    if (updateSuccess) {
      const timer = setTimeout(() => {
        setUpdateSuccess(false);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [updateSuccess]);

  // Handle input changes
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.id]: e.target.value
    });
  };

  // Toggle edit mode
  const toggleEdit = () => {
    setIsEditing(!isEditing);
    setFormError('');
    setUpdateSuccess(false);
    
    // Reset form data when canceling edit
    if (isEditing && user) {
      setFormData({
        name: user.name || '',
        email: user.email || ''
      });
    }
  };

  // Handle profile update
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setUpdateSuccess(false);
    
    // Basic validation
    if (!formData.name.trim()) {
      setFormError('Name cannot be empty');
      return;
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setFormError('Please enter a valid email address');
      return;
    }
    
    try {
      // Only update if values have changed
      if (formData.name !== user.name || formData.email !== user.email) {
        const result = await updateProfile(formData);
        
        if (result?.success) {
          setUpdateSuccess(true);
          setIsEditing(false);
          if (onApiCall) onApiCall(0.5); // Track profile update API call
        }
      } else {
        // No changes made
        setIsEditing(false);
      }
    } catch (err) {
      setFormError('Failed to update profile. Please try again.');
      console.error('Profile update error:', err);
    }
  };

  if (!user) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <h1 className="auth-title">Profile</h1>
            <p className="auth-subtitle">Loading your profile...</p>
          </div>
          <div className="cosmic-loader">
            <div className="spinner"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1 className="auth-title">
            <FaSpaceShuttle className="auth-icon" /> My Profile
          </h1>
          <p className="auth-subtitle">
            {isEditing 
              ? "Edit your cosmic explorer profile" 
              : "Your cosmic explorer details"}
          </p>
        </div>
        
        {error && (
          <div className="form-error" role="alert">
            {error}
          </div>
        )}
        
        {formError && (
          <div className="form-error" role="alert">
            {formError}
          </div>
        )}
        
        {updateSuccess && (
          <div className="success-message">
            <FaCheck className="success-icon" /> Profile updated successfully!
          </div>
        )}
        
        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name" className="form-label">
              <FaUser className="auth-icon" /> Name
            </label>
            {isEditing ? (
              <input
                id="name"
                type="text"
                className="form-input"
                value={formData.name}
                onChange={handleChange}
                disabled={loading}
                required
              />
            ) : (
              <div className="profile-value">{user.name}</div>
            )}
          </div>
          
          <div className="form-group">
            <label htmlFor="email" className="form-label">
              <FaEnvelope className="auth-icon" /> Email
            </label>
            {isEditing ? (
              <input
                id="email"
                type="email"
                className="form-input"
                value={formData.email}
                onChange={handleChange}
                disabled={loading}
                required
              />
            ) : (
              <div className="profile-value">{user.email}</div>
            )}
          </div>
          
          <div className="profile-actions">
            {isEditing ? (
              <>
                <button 
                  type="submit" 
                  className="auth-button" 
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="auth-spinner"></span>
                      Saving...
                    </>
                  ) : (
                    <>
                      <FaCheck className="auth-icon" /> Save Changes
                    </>
                  )}
                </button>
                
                <button 
                  type="button" 
                  className="auth-button auth-button-cancel" 
                  onClick={toggleEdit}
                  disabled={loading}
                >
                  <FaTimes className="auth-icon" /> Cancel
                </button>
              </>
            ) : (
              <button 
                type="button" 
                className="auth-button" 
                onClick={toggleEdit}
              >
                <FaEdit className="auth-icon" /> Edit Profile
              </button>
            )}
          </div>
        </form>
        
        <div className="profile-section">
          <h2 className="section-title">Account Info</h2>
          <div className="profile-info">
            <div className="info-item">
              <span className="info-label">Member Since:</span>
              <span className="info-value">
                {new Date(user.createdAt).toLocaleDateString()}
              </span>
            </div>
            <div className="info-item">
              <span className="info-label">Account Status:</span>
              <span className="info-value status-active">Active</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;