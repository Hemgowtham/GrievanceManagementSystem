import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { FiLock, FiEye, FiEyeOff, FiUser, FiAlertCircle } from 'react-icons/fi';
import './App.css'; 
import logo from './logo.png'; 

const API_BASE = "http://127.0.0.1:8000/api";

function Login() {
  const navigate = useNavigate();

  const [role, setRole] = useState('student');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false); 
  const [status, setStatus] = useState(null); 
  const [isLoading, setIsLoading] = useState(false);

  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [forgotStep, setForgotStep] = useState(1); // Step 1: ID, Step 2: OTP, Step 3: Password
  const [forgotData, setForgotData] = useState({ id: '', otp: '', newPass: '', confirmPass: '' });
  
 
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

  // --- HANDLER: Send OTP ---
  const handleSendOTP = async () => {
    if(!forgotData.id) return alert("Please enter your ID");
    
    setIsLoading(true); // Disable button
    try {
        const res = await axios.post(`${API_BASE}/forgot-password/send-otp/`, { id: forgotData.id });
        setForgotStep(2); 
        // Optional: Show success toast instead of alert
    } catch (err) {
        alert(err.response?.data?.message || "Failed to send OTP");
    } finally {
        setIsLoading(false); // Re-enable button
    }
  };

  // --- HANDLER: Reset Password ---
  const handleResetPassword = async () => {
    if(forgotData.newPass !== forgotData.confirmPass) return alert("Passwords do not match");
    if(!forgotData.otp) return alert("Please enter the OTP");

    setIsLoading(true);
    try {
        await axios.post(`${API_BASE}/forgot-password/reset/`, {
            id: forgotData.id,
            otp: forgotData.otp,
            new_password: forgotData.newPass
        });
        alert("Password Reset Successfully! Please Login.");
        closeModal();
    } catch (err) {
        alert(err.response?.data?.message || "Failed to reset password");
    } finally {
        setIsLoading(false);
    }
  };

  const closeModal = () => {
      setIsForgotModalOpen(false);
      setForgotStep(1);
      setForgotData({ id: '', otp: '', newPass: '', confirmPass: '' });
      setIsLoading(false);
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

            <div style={{textAlign: 'right', marginTop: '10px'}}>
              <span 
                  style={{color: '#2563eb', cursor: 'pointer', fontSize: '0.9rem'}}
                  onClick={() => setIsForgotModalOpen(true)}
              >
                  Forgot Password?
              </span>
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

      {/* ========================================= */}
      {/* PROFESSIONAL FORGOT PASSWORD MODAL        */}
      {/* ========================================= */}
      {isForgotModalOpen && (
        // 1. OVERLAY STYLE (FORCED INLINE)
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0, 0, 0, 0.6)', /* Dark dimming */
            backdropFilter: 'blur(5px)',           /* Modern Blur */
            zIndex: 9999,                          /* On top of everything */
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
        }}>
          
          {/* 2. CARD STYLE (FORCED INLINE) */}
          <div className="fp-modal-card" style={{
              backgroundColor: 'white',
              width: '90%',
              maxWidth: '400px',
              borderRadius: '12px',
              boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
              overflow: 'hidden',
              fontFamily: 'Segoe UI, sans-serif'
          }}>
             
             {/* Header */}
             <div className="fp-modal-header">
                <h3>{forgotStep === 1 ? 'Find Your Account' : 'Secure Account'}</h3>
                <button className="fp-close-btn" onClick={closeModal}>&times;</button>
             </div>

             {/* Body */}
             <div className="fp-modal-body">
                
                {/* STEP 1: ID INPUT */}
                {forgotStep === 1 && (
                    <div className="fp-step-content">
                        <p className="fp-instruction">
                            Enter your Student ID or Employee ID. We will send a verification code to your registered email.
                        </p>
                        <div className="fp-input-group">
                            <label>User ID</label>
                            <input 
                                type="text" 
                                placeholder="College ID" 
                                value={forgotData.id}
                                autoFocus
                                onChange={e => setForgotData({...forgotData, id: e.target.value})}
                            />
                        </div>
                        
                        <button 
                            className="fp-action-btn" 
                            onClick={handleSendOTP} 
                            disabled={isLoading}
                        >
                            {isLoading ? 'Sending Code...' : 'Send OTP'}
                        </button>
                    </div>
                )}

                {/* STEP 2: OTP & NEW PASSWORD */}
                {forgotStep === 2 && (
                    <div className="fp-step-content">
                        <div className="fp-success-badge">
                            ✓ OTP Sent to email
                        </div>

                        <div className="fp-input-group">
                            <label>6-Digit Code</label>
                            <input 
                                type="text" 
                                placeholder="000000" 
                                maxLength="6"
                                value={forgotData.otp}
                                onChange={e => setForgotData({...forgotData, otp: e.target.value})}
                            />
                        </div>

                        <div className="fp-row">
                            <div className="fp-input-group">
                                <label>New Password</label>
                                <input 
                                    type="password" 
                                    placeholder="New Password"
                                    value={forgotData.newPass}
                                    onChange={e => setForgotData({...forgotData, newPass: e.target.value})}
                                />
                            </div>
                            <div className="fp-input-group">
                                <label>Confirm</label>
                                <input 
                                    type="password" 
                                    placeholder="Confirm"
                                    value={forgotData.confirmPass}
                                    onChange={e => setForgotData({...forgotData, confirmPass: e.target.value})}
                                />
                            </div>
                        </div>

                        <button 
                            className="fp-action-btn" 
                            onClick={handleResetPassword}
                            disabled={isLoading}
                        >
                            {isLoading ? 'Resetting...' : 'Change Password'}
                        </button>

                        <button className="fp-back-link" onClick={() => setForgotStep(1)}>
                            Incorrect ID? Go Back
                        </button>
                    </div>
                )}
             </div>
          </div>
        </div>
      )}

    </>
  );
}

export default Login;