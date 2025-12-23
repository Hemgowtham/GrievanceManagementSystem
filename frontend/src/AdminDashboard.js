import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiHome, FiUser, FiSettings, FiLogOut, FiMenu, FiX, FiUsers, FiDatabase } from 'react-icons/fi';
import './App.css';
import logo from './logo.png'; 

function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('home'); 
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false); 
  const navigate = useNavigate();

  useEffect(() => {
    // 1. Check if the token exists immediately
    const token = localStorage.getItem('admin_token');
    if (!token) {
      navigate('/admin-login'); 
    }

    // 2. Listen for changes (Logout from another tab)
    const handleStorageChange = (e) => {
      if (e.key === 'admin_token' && e.newValue === null) {
        navigate('/admin-login');
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [navigate]);

  // --- FIX: REMOVE CORRECT TOKEN ON LOGOUT ---
  const handleLogout = () => {
    localStorage.removeItem('admin_token'); 
    navigate('/admin-login'); 
  };

  const handleMenuClick = (tab) => {
    setActiveTab(tab);
    setIsMobileMenuOpen(false); 
  };

  // --- HOME VIEW (Admin) ---
  const renderHome = () => (
    <div className="fade-in">
      <div className="content-header">
        <h2>🛡️ System Overview</h2>
        <p>Welcome, Administrator. Monitor system health and users.</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "20px", marginTop: "30px" }}>
        
        {/* User Management Card */}
        <div className="card" style={{ borderTop: "4px solid #0f172a" }}>
          <h3>User Management</h3>
          <p style={{ margin: "10px 0 20px", color: "#64748b" }}>
            Add, remove, or modify Student and Authority accounts.
          </p>
          <button className="login-btn" style={{ width: "auto", display: "flex", alignItems: "center", gap: "8px", backgroundColor: "#0f172a" }}>
            <FiUsers /> Manage Users
          </button>
        </div>

        {/* Database Status Card */}
        <div className="card">
          <h3>System Status</h3>
          <div style={{ marginTop: "15px" }}>
            <p><strong>Database:</strong> <span style={{ color: "#10b981" }}>Connected (Neon Cloud)</span></p>
            <p><strong>Total Users:</strong> <span>1,240</span></p>
            <p><strong>Active Issues:</strong> <span style={{ color: "#ef4444" }}>5 Critical</span></p>
          </div>
        </div>
      </div>
    </div>
  );

  // --- ACCOUNT VIEW ---
  const renderAccount = () => (
    <div className="fade-in">
      <div className="content-header">
        <h2>👤 Administrator Account</h2>
      </div>
      <div className="card" style={{ maxWidth: "100%", overflowX: "auto" }}>
        <table className="info-table">
          <tbody>
            <tr><td className="info-label">Username:</td><td className="info-value">admin_master</td></tr>
            <tr><td className="info-label">Role:</td><td className="info-value">Superuser</td></tr>
            <tr><td className="info-label">Access Level:</td><td className="info-value">Level 5 (Full Access)</td></tr>
            <tr><td className="info-label">Last Login:</td><td className="info-value">Today, 10:42 AM</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  );

  // --- SETTINGS VIEW ---
  const renderSettings = () => (
    <div className="fade-in">
      <div className="content-header">
        <h2>⚙️ Global Settings</h2>
      </div>
      <div className="card">
        <p style={{ marginBottom: "20px" }}>Configure system-wide parameters.</p>
        
        <div style={{ padding: "15px", borderBottom: "1px solid #eee" }}>
          <strong>Allow New Registrations</strong>
          <p style={{ fontSize: "0.85rem", color: "#64748b" }}>If disabled, no new students can sign up.</p>
          <button style={{ marginTop: "10px", padding: "5px 10px", cursor: "pointer" }}>Disable</button>
        </div>

        <div style={{ padding: "15px" }}>
          <strong>Maintenance Mode</strong>
          <p style={{ fontSize: "0.85rem", color: "#64748b" }}>Shut down the system for updates.</p>
          <button style={{ marginTop: "10px", padding: "5px 10px", cursor: "pointer", color: "red" }}>Enable Maintenance</button>
        </div>
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
          <p>ADMIN DASHBOARD</p>
        </div>
      </header>

      <div className="dashboard-container">
        {isMobileMenuOpen && ( <div className="overlay" onClick={() => setIsMobileMenuOpen(false)}></div> )}

        <aside className={`sidebar ${isMobileMenuOpen ? 'open' : ''}`}>
          <ul className="sidebar-menu">
            <li className={`menu-item ${activeTab === 'home' ? 'active' : ''}`} onClick={() => handleMenuClick('home')}>
              <FiHome size={20} /> Home
            </li>
            <li className={`menu-item ${activeTab === 'account' ? 'active' : ''}`} onClick={() => handleMenuClick('account')}>
              <FiUser size={20} /> Account
            </li>
            <li className={`menu-item ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => handleMenuClick('settings')}>
              <FiSettings size={20} /> Settings
            </li>
          </ul>
          <button className="logout-btn" onClick={handleLogout}>
            <FiLogOut size={20} /> Logout
          </button>
        </aside>

        <main className="main-content">
          {activeTab === 'home' && renderHome()}
          {activeTab === 'account' && renderAccount()}
          {activeTab === 'settings' && renderSettings()}
        </main>
      </div>
    </>
  );
}

export default AdminDashboard;