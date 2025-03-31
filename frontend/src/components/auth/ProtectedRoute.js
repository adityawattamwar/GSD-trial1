import React from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

/**
 * ProtectedRoute Component
 * Wraps protected routes and redirects to login if user is not authenticated
 */
const ProtectedRoute = () => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();
  
  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="auth-container">
        <div className="auth-card" style={{ textAlign: 'center' }}>
          <span className="auth-spinner" style={{ width: '40px', height: '40px', margin: '20px auto' }}></span>
          <p>Verifying authentication...</p>
        </div>
      </div>
    );
  }
  
  // Redirect to login if not authenticated, preserve the intended location
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  // Render the child routes if authenticated
  return <Outlet />;
};

export default ProtectedRoute;