import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { FiMail, FiLock, FiEye, FiEyeOff } from 'react-icons/fi'; // Clean Icons
import './App.css'; 
import logo from './logo.png'; 


function Login() {
  const [role, setRole] = useState('student');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false); // Toggle State
  const [status, setStatus] = useState(null); 
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setStatus(null);
    setIsLoading(true);

    try {
      const response = await axios.post('http://127.0.0.1:8000/api/login/', {
        username: email, 
        password: password
      });

      if (response.data.message === 'Login Successful') {
        setStatus({ type: 'success', text: 'Credentials Verified. Redirecting...' });
        
        // --- UPDATED: USE UNIQUE KEYS ---
        if (role === 'student') {
            localStorage.setItem('student_token', 'active');
        } else {
            localStorage.setItem('authority_token', 'active');
        }
        // --------------------------------

        setTimeout(() => {
            role === 'authority' ? navigate('/authority-dashboard') : navigate('/student-dashboard');
        }, 800);
      }
    } catch (error) {
      setStatus({ type: 'error', text: 'We could not verify your credentials.' });
      setIsLoading(false);
    }
  };

  return (
    <>
      <header className="app-header">
        <img src={logo} alt="RGUKT Logo" className="header-logo" />
        <div className="header-text">
          <h1>Smart Grievance Management System</h1>
          <p>RGUKT NUZVID</p>
        </div>
      </header>

      <div className="login-container">
        <div className="login-card">
          
          <div className="welcome-text">
            <h2>{role === 'student' ? 'Student Portal' : 'Authority Portal'}</h2>
            <p>Please enter your details to login.</p>
          </div>

          {/* Slider */}
          <div className="role-toggle-container">
            <div className={`slider ${role === 'authority' ? 'right' : ''}`}></div>
            <div className={`toggle-option ${role === 'student' ? 'active' : ''}`} onClick={() => setRole('student')}>Student Login</div>
            <div className={`toggle-option ${role === 'authority' ? 'active' : ''}`} onClick={() => setRole('authority')}>Authority Login</div>
          </div>

          <form onSubmit={handleLogin}>
            
            {/* EMAIL INPUT */}
            <div className="form-group">
              <label className="form-label">College Email ID</label>
              <div className="input-wrapper">
                <FiMail className="input-icon" /> {/* Mail Icon */}
                <input
                  className="form-input form-input-with-icon"
                  type="text"
                  placeholder="id@rguktn.ac.in"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* PASSWORD INPUT */}
            <div className="form-group">
              <label className="form-label">Password</label>
              <div className="input-wrapper">
                <FiLock className="input-icon" /> {/* Lock Icon */}
                <input
                  className="form-input form-input-with-icon"
                  type={showPassword ? "text" : "password"} // Toggles Type
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                />
                {/* Eye Icon Button */}
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

export default Login;