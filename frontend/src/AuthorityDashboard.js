import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiHome, FiUser, FiClock, FiLogOut, FiMenu, FiX, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import './App.css';
import logo from './logo.png'; 

function AuthorityDashboard() {
  const [activeTab, setActiveTab] = useState('home'); 
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false); 
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('authority_token');
    if (!token) navigate('/'); 

    const handleStorageChange = (e) => {
      if (e.key === 'authority_token' && e.newValue === null) {
        navigate('/');
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('authority_token'); // Only remove authority access
    navigate('/'); 
  };

  const handleMenuClick = (tab) => {
    setActiveTab(tab);
    setIsMobileMenuOpen(false); 
  };

  // --- HOME VIEW (Authority) ---
  const renderHome = () => (
    <div className="fade-in">
      <div className="content-header">
        <h2>👮 Authority Panel</h2>
        <p>Manage and resolve student grievances assigned to you.</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "20px", marginTop: "30px" }}>
        
        {/* Action Card */}
        <div className="card" style={{ borderTop: "4px solid #f59e0b" }}>
          <h3>Pending Actions</h3>
          <p style={{ margin: "10px 0 20px", color: "#64748b" }}>
            You have <strong>3</strong> new grievances waiting for your review.
          </p>
          <button className="login-btn" style={{ width: "auto", display: "flex", alignItems: "center", gap: "8px", backgroundColor: "#f59e0b", color: "#000" }}>
            <FiAlertCircle /> Review Now
          </button>
        </div>

        {/* Stats Card */}
        <div className="card">
          <h3>Resolution Stats</h3>
          <div style={{ marginTop: "15px" }}>
            <p><strong>This Month:</strong> <span style={{ color: "#2563eb" }}>12 Resolved</span></p>
            <p><strong>Total:</strong> <span style={{ color: "#10b981" }}>45 Resolved</span></p>
          </div>
        </div>
      </div>
    </div>
  );

  // --- PROFILE VIEW ---
  const renderProfile = () => (
    <div className="fade-in">
      <div className="content-header">
        <h2>👤 My Profile</h2>
      </div>
      <div className="card" style={{ maxWidth: "100%", overflowX: "auto" }}>
        <table className="info-table">
          <tbody>
            <tr><td className="info-label">Name:</td><td className="info-value">Dr. A. Sharma</td></tr>
            <tr><td className="info-label">Designation:</td><td className="info-value">Chief Warden</td></tr>
            <tr><td className="info-label">Department:</td><td className="info-value">Hostel Administration</td></tr>
            <tr><td className="info-label">Email:</td><td className="info-value">cw@rguktn.ac.in</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  );

  // --- HISTORY VIEW ---
  const renderHistory = () => (
    <div className="fade-in">
      <div className="content-header">
        <h2>📜 Resolution History</h2>
      </div>
      <div className="card">
        <p style={{ textAlign: "center", padding: "40px", color: "#94a3b8" }}>
          <FiCheckCircle size={40} style={{ marginBottom: "10px", display: "block", margin: "0 auto" }}/>
          No past records found.
        </p>
      </div>
    </div>
  );

  return (
    <>
      <header className="app-header">
        <div className="hamburger-btn" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          {isMobileMenuOpen ? <FiX /> : <FiMenu />}
        </div>
        <img src={logo} alt="RGUKT Logo" className="header-logo" />
        <div className="header-text">
          <h1>Smart Grievance Management System</h1>
          <p>AUTHORITY DASHBOARD</p>
        </div>
      </header>

      <div className="dashboard-container">
        {isMobileMenuOpen && ( <div className="overlay" onClick={() => setIsMobileMenuOpen(false)}></div> )}

        <aside className={`sidebar ${isMobileMenuOpen ? 'open' : ''}`}>
          <ul className="sidebar-menu">
            <li className={`menu-item ${activeTab === 'home' ? 'active' : ''}`} onClick={() => handleMenuClick('home')}>
              <FiHome size={20} /> Home
            </li>
            <li className={`menu-item ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => handleMenuClick('profile')}>
              <FiUser size={20} /> Profile
            </li>
            <li className={`menu-item ${activeTab === 'history' ? 'active' : ''}`} onClick={() => handleMenuClick('history')}>
              <FiClock size={20} /> History
            </li>
          </ul>
          <button className="logout-btn" onClick={handleLogout}>
            <FiLogOut size={20} /> Logout
          </button>
        </aside>

        <main className="main-content">
          {activeTab === 'home' && renderHome()}
          {activeTab === 'profile' && renderProfile()}
          {activeTab === 'history' && renderHistory()}
        </main>
      </div>
    </>
  );
}

export default AuthorityDashboard;