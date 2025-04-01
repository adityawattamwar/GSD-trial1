import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from '../utils/axiosConfig';

// Create auth context
const AuthContext = createContext();

// Custom hook for using auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  // State for authentication
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [isAdmin, setIsAdmin] = useState(false);

  // Configure axios auth header when token changes
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      localStorage.setItem('token', token);
    } else {
      delete axios.defaults.headers.common['Authorization'];
      localStorage.removeItem('token');
    }
  }, [token]);

  // Load user on mount if token exists (token validation)
  useEffect(() => {
    const checkAuth = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await axios.get('/api/auth/profile');
        
        if (response.data.success) {
          setUser(response.data.user);
        } else {
          // Invalid token or error
          setToken(null);
          setUser(null);
        }
      } catch (err) {
        console.error('Auth check error:', err);
        setToken(null);
        setUser(null);
        
        if (err.response?.status === 401) {
          setError('Session expired. Please login again.');
        } else {
          setError('Authentication error. Please try again.');
        }
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [token]);

  // Clear auth error on route change or after display
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError(null);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Register new user
  const register = async (userData) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.post('/api/auth/register', userData);
      
      if (response.data.success) {
        setToken(response.data.token);
        setUser(response.data.user);
        return { success: true };
      }
    } catch (err) {
      console.error('Registration error:', err);
      setError(
        err.response?.data?.message || 
        'Registration failed. Please try again.'
      );
      return { success: false, error: err.response?.data?.message };
    } finally {
      setLoading(false);
    }
  };

  // Login user
  const login = async (email, password) => {
    try {
      setLoading(true);
      setError(null);
      
      // Special case for admin
      if (email === 'admin@gmail.com' && password === 'admin') {
        // Create an admin user object
        const adminUser = {
          _id: 'admin',
          email: 'admin@gmail.com',
          username: 'Administrator',
          isAdmin: true
        };
        
        // Set admin state
        setUser(adminUser);
        setIsAdmin(true);
        
        // Store in localStorage to persist admin session
        localStorage.setItem('user', JSON.stringify(adminUser));
        
        return { success: true, isAdmin: true };
      }
      
      // Regular user login
      const response = await axios.post('/api/auth/login', { email, password });
      
      if (response.data.success) {
        setToken(response.data.token);
        setUser(response.data.user);
        setIsAdmin(false);
        return { success: true };
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(
        err.response?.data?.message || 
        'Login failed. Please check your credentials.'
      );
      return { success: false, error: err.response?.data?.message };
    } finally {
      setLoading(false);
    }
  };

  // Logout user
  const logout = useCallback(async () => {
    try {
      // Call logout endpoint (optional, server doesn't do much for stateless auth)
      if (token && !isAdmin) {
        await axios.post('/api/auth/logout');
      }
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      // Clear state and storage regardless of API call result
      setToken(null);
      setUser(null);
      setIsAdmin(false);
      localStorage.removeItem('user');
    }
  }, [token, isAdmin]);

  // Update profile
  const updateProfile = async (userData) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.put('/api/auth/profile', userData);
      
      if (response.data.success) {
        setUser(response.data.user);
        return { success: true };
      }
    } catch (err) {
      console.error('Profile update error:', err);
      setError(
        err.response?.data?.message || 
        'Profile update failed. Please try again.'
      );
      return { success: false, error: err.response?.data?.message };
    } finally {
      setLoading(false);
    }
  };

  // Change password
  const changePassword = async (currentPassword, newPassword) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.put('/api/auth/change-password', {
        currentPassword,
        newPassword
      });
      
      if (response.data.success) {
        return { success: true };
      }
    } catch (err) {
      console.error('Password change error:', err);
      setError(
        err.response?.data?.message || 
        'Password change failed. Please try again.'
      );
      return { success: false, error: err.response?.data?.message };
    } finally {
      setLoading(false);
    }
  };

  // Provide auth context value
  const value = {
    user,
    token,
    loading,
    error,
    isAuthenticated: !!user,
    isAdmin,
    register,
    login,
    logout,
    updateProfile,
    changePassword
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;