import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { FiUser, FiLock, FiEye, FiEyeOff } from 'react-icons/fi'; // Used FiUser for Admin
import './App.css';
import logo from './logo.png'; 

function AdminLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setStatus(null);
    setIsLoading(true);

    try {
      const response = await axios.post('http://127.0.0.1:8000/api/login/', {
        username: username,
        password: password
      });

      if (response.data.message === 'Login Successful') {
        setStatus({ type: 'success', text: 'Admin Verified. Accessing Portal...' });
        
        // --- FIX: SAVE THE CORRECT TOKEN ---
        localStorage.setItem('admin_token', 'active');
        // -----------------------------------

        setTimeout(() => {
            navigate('/admin-dashboard');
        }, 800);
      }
    } catch (error) {
      setStatus({ type: 'error', text: 'Access Denied: Invalid Admin Credentials' });
      setIsLoading(false);
    }
  };

  return (
    <>
      <header className="app-header">
        <img src={logo} alt="RGUKT Logo" className="header-logo" />
        <div className="header-text">
          <h1>Smart Grievance Management System</h1>
          <p>ADMINISTRATION PORTAL</p>
        </div>
      </header>

      <div className="login-container">
        <div className="login-card">
          <div style={{marginBottom: "20px", textAlign: "center"}}>
             <h3 style={{color: "#334155"}}>Admin Authentication</h3>
          </div>

          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label className="form-label">Admin Username</label>
              <div className="input-wrapper">
                <FiUser className="input-icon" />
                <input
                  className="form-input form-input-with-icon"
                  type="text"
                  placeholder="Enter Admin ID"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <div className="input-wrapper">
                <FiLock className="input-icon" />
                <input
                  className="form-input form-input-with-icon"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                />
                <div className="password-toggle-icon" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <FiEyeOff /> : <FiEye />}
                </div>
              </div>
            </div>

            <button type="submit" className="login-btn" disabled={isLoading}>
              {isLoading ? 'Verifying . . .' : 'Login'}
            </button>
          </form>

          {status && <div className={`alert-box ${status.type === 'error' ? 'alert-error' : 'alert-success'}`}>{status.text}</div>}
        </div>
      </div>
    </>
  );
}

export default AdminLogin;