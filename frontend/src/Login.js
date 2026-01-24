import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { FiLock, FiEye, FiEyeOff, FiUser, FiAlertCircle } from 'react-icons/fi'; 
import './App.css'; 
import logo from './logo.png'; 

function Login() {
  const navigate = useNavigate();

  const [role, setRole] = useState('student');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false); 
  const [status, setStatus] = useState(null); 
  const [isLoading, setIsLoading] = useState(false);
 
  const handleLogin = async (e) => {
    e.preventDefault();
    setStatus(null);
    setIsLoading(true);

    try {
      const response = await axios.post('http://127.0.0.1:8000/api/login/', {
        username: email, 
        password: password
      });

      if (response.data.status === 'success') {
        const serverRole = response.data.user_type; 
        const token = response.data.token;
        
        // Prepare User Data Object
        const userData = JSON.stringify({
            username: response.data.username,
            name: response.data.name,
            user_type: response.data.user_type
        });

        // --- RESTRICT ADMINS ---
        if (serverRole === 'admin') {
            setStatus({ type: 'error', text: 'Incorrect ID or password.' });
            setIsLoading(false);
            return; 
        }

        // --- SUCCESS LOGIC ---
        setStatus({ type: 'success', text: 'Login successful. Redirecting...' });

        setTimeout(() => {
            if (serverRole === 'student') {
                localStorage.setItem('student_token', token);
                localStorage.setItem('student_user', userData); 
                navigate('/student-dashboard');
            } 
            else if (serverRole === 'authority') {
                localStorage.setItem('authority_token', token);
                localStorage.setItem('authority_user', userData); 
                navigate('/authority-dashboard');
            } 
            else {
                navigate(role === 'authority' ? '/authority-dashboard' : '/student-dashboard');
            }
        }, 800);

      } else {
        // Fallback for unexpected API status
        setStatus({ type: 'error', text: 'Incorrect ID or password.' });
        setIsLoading(false);
      }
    } catch (error) {
      // Differentiate between "Wrong Password" (401) and "Server Down"
      if (error.response && error.response.status === 401) {
          setStatus({ type: 'error', text: 'Incorrect ID or password.' });
      } else {
          setStatus({ type: 'error', text: 'Server unreachable. Please try again later.' });
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
          <p>RGUKT NUZVID</p>
        </div>
      </header>

      <div className="login-container">
        <div className="login-card">
          
          <div className="welcome-text">
            <h2>{role === 'student' ? 'Student Portal' : 'Authority Portal'}</h2>
            <p>Please enter your credentials to continue.</p>
          </div>

          {/* Slider */}
          <div className="role-toggle-container">
            <div className={`slider ${role === 'authority' ? 'right' : ''}`}></div>
            <div className={`toggle-option ${role === 'student' ? 'active' : ''}`} onClick={() => setRole('student')}>Student Login</div>
            <div className={`toggle-option ${role === 'authority' ? 'active' : ''}`} onClick={() => setRole('authority')}>Authority Login</div>
          </div>

          <form onSubmit={handleLogin}>
            
            {/* ID INPUT */}
            <div className="form-group">
              <label className="form-label">{role === 'student' ? 'Student ID' : 'Employee ID'}</label>
              <div className="input-wrapper">
                <FiUser className="input-icon" /> 
                <input
                  className="form-input form-input-with-icon"
                  type="text"
                  placeholder={role === 'student' ? "Eg: N180000" : "Eg: E210042"}
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
              {isLoading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>

          {status && (
             <div className={`alert-box ${status.type === 'error' ? 'alert-error' : 'alert-success'}`} style={{marginTop:'15px'}}>
                 {status.type === 'error' ? <FiAlertCircle style={{marginRight:'5px'}}/> : null}
                 {status.text}
             </div>
          )}

        </div>
      </div>
    </>
  );
}

export default Login;