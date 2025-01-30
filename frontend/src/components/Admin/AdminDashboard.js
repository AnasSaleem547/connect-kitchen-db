import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './AdminDashboard.css';  // CSS for Checkout component


const AdminDashboard = () => {
  const navigate = useNavigate();

  // Handle logout
  const handleLogout = () => {
    // Clear auth data from localStorage
    localStorage.removeItem('authToken');
    localStorage.removeItem('isAuthenticated');
    
    // Redirect to login page
    navigate('/admin-login');
  };

  return (
    <div className="dashboard">
      <h2>Admin Dashboard</h2>

      {/* Logout Button */}
      <button onClick={handleLogout} className="logout-button">Logout</button>

      {/* Navigation Links */}
      <ul>
        <li><Link to="/order-history">Order History</Link></li>
        <li><Link to="/user-profiles">User Profiles</Link></li>
        <li><Link to="/voucher-creation">Create Voucher</Link></li>
        <li><Link to="/sales-analytics">Sales Analytics</Link></li>
        <li><Link to="/view-comments">Manage Comments</Link></li>
      </ul>
    </div>
  );
};

export default AdminDashboard;
