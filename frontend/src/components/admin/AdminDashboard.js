import React, { useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { FaBoxOpen, FaClipboardList, FaSignOutAlt, FaTachometerAlt, FaUser } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import './AdminStyles.css';

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Check if a nav link is active
  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  return (
    <div className="admin-dashboard">
      <header className="admin-header">
        <button className="sidebar-toggle" onClick={toggleSidebar}>
          ☰
        </button>
        <h1>Admin Dashboard</h1>
        <div className="admin-user">
          <span><FaUser /> {user?.username || 'Administrator'}</span>
          <button onClick={logout} className="logout-button">
            <FaSignOutAlt /> Logout
          </button>
        </div>
      </header>

      <div className="admin-container">
        <aside className={`admin-sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
          <nav className="admin-nav">
            <ul>
              <li>
                <Link 
                  to="/admin/dashboard" 
                  className={isActive('/admin/dashboard') ? 'active' : ''}
                >
                  <FaTachometerAlt /> Dashboard
                </Link>
              </li>
              <li>
                <Link 
                  to="/admin/products" 
                  className={isActive('/admin/products') ? 'active' : ''}
                >
                  <FaBoxOpen /> Products
                </Link>
              </li>
              <li>
                <Link 
                  to="/admin/orders" 
                  className={isActive('/admin/orders') ? 'active' : ''}
                >
                  <FaClipboardList /> Orders
                </Link>
              </li>
            </ul>
          </nav>
        </aside>

        <main className="admin-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;