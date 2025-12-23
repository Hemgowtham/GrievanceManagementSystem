import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiHome, FiUser, FiFileText, FiLogOut, FiPlusCircle, FiMenu, FiX } from 'react-icons/fi';
import './App.css';
import logo from './logo.png'; 

function StudentDashboard() {
  const [activeTab, setActiveTab] = useState('home'); 
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false); 
  const navigate = useNavigate();

  useEffect(() => {
    // Check specific Student Token
    const token = localStorage.getItem('student_token');
    if (!token) {
      navigate('/'); 
    }

    // Listen ONLY for student_token changes
    const handleStorageChange = (e) => {
      if (e.key === 'student_token' && e.newValue === null) {
        navigate('/');
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [navigate]);

  // --- 2. LOGOUT ---
  const handleLogout = () => {
    localStorage.removeItem('student_token'); // Only remove student access
    navigate('/'); 
  };

  const handleMenuClick = (tab) => {
    setActiveTab(tab);
    setIsMobileMenuOpen(false); 
  };
  // --- COMPONENT SECTIONS (Unchanged) ---
  const renderHome = () => (
    <div className="fade-in">
      <div className="content-header">
        <h2>👋 Welcome, Student!</h2>
        <p>This is your Grievance Control Center.</p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "20px", marginTop: "30px" }}>
        <div className="card" style={{ borderTop: "4px solid #2563eb" }}>
          <h3>Lodge a New Grievance</h3>
          <p style={{ margin: "10px 0 20px", color: "#64748b" }}>
            Facing an issue with Hostel, Academics, or Mess? Report it immediately.
          </p>
          <button className="login-btn" style={{ width: "auto", display: "flex", alignItems: "center", gap: "8px" }}>
            <FiPlusCircle /> Create New Complaint
          </button>
        </div>
        <div className="card">
          <h3>Your Status</h3>
          <div style={{ marginTop: "15px" }}>
            <p><strong>Pending:</strong> <span style={{ color: "#f59e0b" }}>0 Complaints</span></p>
            <p><strong>Resolved:</strong> <span style={{ color: "#10b981" }}>0 Complaints</span></p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderProfile = () => (
    <div className="fade-in">
      <div className="content-header">
        <h2>👤 My Profile</h2>
      </div>
      <div className="card" style={{ maxWidth: "100%", overflowX: "auto" }}>
        <table className="info-table">
          <tbody>
            <tr><td className="info-label">Full Name:</td><td className="info-value">Yasarapu Hem Gowtham</td></tr>
            <tr><td className="info-label">Student ID:</td><td className="info-value">N180000</td></tr>
            <tr><td className="info-label">Branch:</td><td className="info-value">Computer Science (CSE)</td></tr>
            <tr><td className="info-label">Email:</td><td className="info-value">n180000@rguktn.ac.in</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderGrievances = () => (
    <div className="fade-in">
      <div className="content-header">
        <h2>📂 My Grievance History</h2>
      </div>
      <div className="card">
        <p style={{ textAlign: "center", padding: "40px", color: "#94a3b8" }}>
          No grievances found. You haven't raised any complaints yet.
        </p>
      </div>
    </div>
  );

  return (
    <>
      {/* --- TOP FIXED HEADER --- */}
      <header className="app-header">
        
        {/* HAMBURGER TOGGLE BUTTON */}
        {/* If Open -> Show X, If Closed -> Show Menu */}
        <div 
          className="hamburger-btn" 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <FiX /> : <FiMenu />}
        </div>

        <img src={logo} alt="RGUKT Logo" className="header-logo" />
        <div className="header-text">
          <h1>Smart Grievance Management System</h1>
          <p>STUDENT DASHBOARD</p>
        </div>
      </header>

      <div className="dashboard-container">
        
        {/* OVERLAY */}
        {isMobileMenuOpen && (
          <div className="overlay" onClick={() => setIsMobileMenuOpen(false)}></div>
        )}

        {/* --- LEFT SIDEBAR (No inner close button now) --- */}
        <aside className={`sidebar ${isMobileMenuOpen ? 'open' : ''}`}>
          
          <ul className="sidebar-menu">
            <li className={`menu-item ${activeTab === 'home' ? 'active' : ''}`} onClick={() => handleMenuClick('home')}>
              <FiHome size={20} /> Home
            </li>
            <li className={`menu-item ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => handleMenuClick('profile')}>
              <FiUser size={20} /> Profile
            </li>
            <li className={`menu-item ${activeTab === 'grievances' ? 'active' : ''}`} onClick={() => handleMenuClick('grievances')}>
              <FiFileText size={20} /> My Grievances
            </li>
          </ul>

          <button className="logout-btn" onClick={handleLogout}>
            <FiLogOut size={20} /> Logout
          </button>
        </aside>

        {/* --- RIGHT MAIN CONTENT --- */}
        <main className="main-content">
          {activeTab === 'home' && renderHome()}
          {activeTab === 'profile' && renderProfile()}
          {activeTab === 'grievances' && renderGrievances()}
        </main>
      </div>
    </>
  );
}

export default StudentDashboard;