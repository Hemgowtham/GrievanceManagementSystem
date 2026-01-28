import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { FiUser, FiLock, FiEye, FiEyeOff, FiAlertCircle } from 'react-icons/fi';
import './App.css';
import logo from './logo.png'; 

function AdminLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const API_BASE = "https://grievancemanagementsystemrguktnuzvid.onrender.com/api";

  const handleLogin = async (e) => {
    e.preventDefault();
    setStatus(null);
    setIsLoading(true);

    try {
      const response = await axios.post(`${API_BASE}/login/`, {
        username: username,
        password: password
      });

      // 1. Check if the backend says "success"
      if (response.data.status === 'success') {
          
        // 2. Security Check: Is this user actually an Admin?
        if (response.data.user_type === 'admin') {
            setStatus({ type: 'success', text: 'Credentials Verified. Redirecting...' });
            
            // 3. Save the REAL Token and User Info
            localStorage.setItem('admin_token', response.data.token);
            localStorage.setItem('admin_user', JSON.stringify({
                username: response.data.username,
                name: response.data.name || "Administrator"
            }));

            setTimeout(() => {
                navigate('/admin-dashboard');
            }, 800);
        } else {
            // User exists, but is NOT an admin (e.g., a Student trying to login here)
            setStatus({ type: 'error', text: 'Access Denied: You do not have Admin privileges.' });
            setIsLoading(false);
        }

      } else {
        // Fallback for other status messages
        setStatus({ type: 'error', text: 'Invalid Admin ID or Password' });
        setIsLoading(false);
      }

    } catch (error) {
      console.error(error);
      // Handle 401 (Unauthorized) or Network Errors
      if (error.response && error.response.status === 401) {
          setStatus({ type: 'error', text: 'Invalid Admin ID or Password' });
      } else {
          setStatus({ type: 'error', text: 'Server unreachable. Please try again.' });
      }
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

          {status && (
             <div className={`alert-box ${status.type === 'error' ? 'alert-error' : 'alert-success'}`} style={{marginTop: '15px'}}>
                 {status.type === 'error' && <FiAlertCircle style={{marginRight:'8px'}} />}
                 {status.text}
             </div>
          )}
        </div>
      </div>
    </>
  );
}

export default AdminLogin;