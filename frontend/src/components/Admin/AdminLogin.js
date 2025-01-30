import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './AdminLogin.css';  // CSS for Checkout component

const AdminLogin = () => {
  const [credentials, setCredentials] = useState({ username: '@dmin', password: 'anassaleem@86' });
  const navigate = useNavigate();

  const handleLogin = async () => {
    // Dummy check for username and password
    if (credentials.username === '@dmin' && credentials.password === 'anassaleem@86') {
      localStorage.setItem('isAuthenticated', 'true');
      navigate('/admin-dashboard');
    } else {
      alert('Invalid credentials');
    }
  };

  return (
    <div className="login-form">
      <h2>Admin Login</h2>
      <input
        type="text"
        placeholder="Username"
        value={credentials.username}
        onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
      />
      <input
        type="password"
        placeholder="Password"
        value={credentials.password}
        onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
      />
      <button onClick={handleLogin}>Login</button>
    </div>
  );
};

export default AdminLogin;
