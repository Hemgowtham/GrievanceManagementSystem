import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FiAlertTriangle, FiHome, FiArrowLeft } from 'react-icons/fi';
import './App.css'; // Re-using your main CSS

function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="not-found-container">
      <div className="not-found-content">
        <div className="error-icon-box">
            <FiAlertTriangle />
        </div>
        
        <h1 className="error-code">404</h1>
        <h2 className="error-message">Page Not Found</h2>
        
        <p className="error-description">
            Oops! The page you are looking for might have been removed, 
            had its name changed, or is temporarily unavailable.
        </p>

        <div className="error-actions">
            <button className="login-btn btn-secondary" onClick={() => navigate(-1)}>
                <FiArrowLeft /> Go Back
            </button>
            <button className="login-btn" onClick={() => navigate('/')}>
                <FiHome /> Home Page
            </button>
        </div>
      </div>
    </div>
  );
}

export default NotFound;