import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FiHome, FiUser, FiLogOut, FiMenu, FiX, FiFilter, FiLock, FiMail, 
  FiBriefcase, FiCheckCircle, FiAlertCircle, FiClock, FiActivity, FiEdit3 
} from 'react-icons/fi';
import './App.css';
import logo from './logo.png'; 

function AuthorityDashboard() {
  // ==========================================
  //  STATE MANAGEMENT
  // ==========================================
  const [activeTab, setActiveTab] = useState('home'); 
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false); 
  const navigate = useNavigate();

  // Profile Modal
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  // Resolution Modal (For Home Tab)
  const [selectedPending, setSelectedPending] = useState(null);
  const [isResolveModalOpen, setIsResolveModalOpen] = useState(false);

  // History Modal (For History Tab)
  const [selectedHistory, setSelectedHistory] = useState(null);
  const [isHistoryDetailOpen, setIsHistoryDetailOpen] = useState(false);

  // Filters (History Tab)
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');

  // --- MOCK DATA: PENDING ACTIONS (Home Tab) ---
  // These are complaints assigned to this authority that need fixing.
  const pendingGrievances = [
    {
      id: 201,
      date: '2023-12-25',
      student: 'N180555',
      category: 'Mess - Food Quality',
      description: 'Rice was undercooked in lunch today (DH-2).',
      status: 'Pending',
      urgency: 'High'
    },
    {
      id: 202,
      date: '2023-12-24',
      student: 'N190123',
      category: 'Mess - Hygiene',
      description: 'Water cooler filter looks dirty.',
      status: 'Pending',
      urgency: 'Medium'
    }
  ];

  // --- MOCK DATA: SOLVED HISTORY (History Tab) ---
  const solvedHistory = [
    {
      id: 105,
      date: '2023-12-20',
      category: 'Mess - Menu',
      description: 'Curry was not served as per the schedule.',
      status: 'Resolved',
      resolution: 'Spoke to catering manager. Vendor fined Rs. 5000.',
      resolvedDate: '2023-12-21'
    },
    {
      id: 106,
      date: '2023-12-18',
      category: 'Mess - Quantity',
      description: 'Curry ran out before 1:00 PM.',
      status: 'Resolved',
      resolution: 'Instructed to cook 10% extra buffer quantity.',
      resolvedDate: '2023-12-18'
    },
    {
      id: 107,
      date: '2023-11-05',
      category: 'Ragging',
      description: 'Reported minor conflict in dining hall.',
      status: 'Escalated',
      resolution: 'Forwarded to Disciplinary Committee.',
      resolvedDate: '2023-11-06'
    }
  ];

  // --- SECURITY LOGIC ---
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
    localStorage.removeItem('authority_token');
    navigate('/'); 
  };

  const handleMenuClick = (tab) => {
    setActiveTab(tab);
    setIsMobileMenuOpen(false); 
  };

  // --- HELPER FUNCTIONS ---
  const openResolveModal = (item) => {
    setSelectedPending(item);
    setIsResolveModalOpen(true);
  };

  const openHistoryDetail = (item) => {
    setSelectedHistory(item);
    setIsHistoryDetailOpen(true);
  };

  // ==========================================
  //  TAB 1: HOME (ACTION CENTER)
  // ==========================================
  const renderHome = () => (
    <div className="fade-in">
      <div className="content-header">
        <h2>👋 Welcome, Officer</h2>
        <p>You have <strong>{pendingGrievances.length}</strong> pending grievances to resolve.</p>
      </div>

      {/* STATS ROW */}
      <div className="stats-grid">
        <div className="stat-card">
            <div className="stat-icon-box icon-orange"><FiAlertCircle /></div>
            <div className="stat-info"><h3>{pendingGrievances.length}</h3><p>Pending Actions</p></div>
        </div>
        <div className="stat-card">
            <div className="stat-icon-box icon-green"><FiCheckCircle /></div>
            <div className="stat-info"><h3>145</h3><p>Solved This Month</p></div>
        </div>
        <div className="stat-card">
            <div className="stat-icon-box icon-blue"><FiClock /></div>
            <div className="stat-info"><h3>24h</h3><p>Avg Response Time</p></div>
        </div>
      </div>

      <h3 style={{marginBottom: "20px", marginTop: "30px", color: "#334155"}}>Pending Actions</h3>
      
      {/* PENDING LIST */}
      <div className="card" style={{padding: "0"}}>
        {pendingGrievances.length === 0 ? (
           <p style={{padding: "40px", textAlign: "center", color: "#64748b"}}>No pending work! Good job.</p>
        ) : (
           <div>
             {pendingGrievances.map((item) => (
                <div className="grievance-item" key={item.id} style={{borderLeft: "4px solid #f97316"}}>
                    <div className="grievance-info">
                        <h4>{item.category} <span style={{fontSize: "0.8rem", color: "#64748b"}}>(ID: {item.student})</span></h4>
                        <p style={{fontSize: "0.9rem", color: "#475569", margin: "5px 0"}}>{item.description}</p>
                        <span style={{fontSize: "0.8rem", color: "#f97316", fontWeight: "bold"}}>⚠ {item.urgency} Urgency</span>
                    </div>
                    <button 
                        className="login-btn" 
                        style={{width: "auto", fontSize: "0.85rem", padding: "8px 15px"}}
                        onClick={() => openResolveModal(item)}
                    >
                        Resolve
                    </button>
                </div>
             ))}
           </div>
        )}
      </div>
    </div>
  );

  // ==========================================
  //  TAB 2: PROFILE (MODERN)
  // ==========================================
  const renderProfile = () => (
    <div className="fade-in">
      <div className="content-header">
        <h2>👤 Authority Profile</h2>
      </div>
      
      <div className="card" style={{ padding: "0", overflow: "hidden" }}>
        {/* Banner */}
        <div className="profile-header-banner" style={{background: "linear-gradient(135deg, #059669 0%, #10b981 100%)"}}>
            <div className="profile-avatar-section" style={{color: "#059669"}}>
                <FiUser />
            </div>
        </div>

        <div style={{ padding: "0 20px 20px", marginTop: "60px", display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "20px" }}>
            <div>
                <h2 style={{ color: "#1e293b", marginBottom: "5px" }}>Dr. A. Sharma</h2>
                <p style={{ color: "#64748b", fontWeight: "500" }}>Chief Warden & Mess In-Charge</p>
            </div>
            <button 
                className="login-btn" 
                style={{ width: "auto", display: "flex", alignItems: "center", gap: "8px", backgroundColor: "#334155" }}
                onClick={() => setIsPasswordModalOpen(true)}
            >
                <FiLock /> Change Password
            </button>
        </div>

        <hr style={{ border: "0", borderTop: "1px solid #e2e8f0", margin: "20px 0" }} />

        {/* Info Tiles */}
        <div className="profile-details-grid">
            <div className="info-tile">
                <span className="tile-label"><FiBriefcase style={{marginBottom: "-2px"}}/> Employee ID</span>
                <span className="tile-value">AUTH-405</span>
            </div>
            <div className="info-tile">
                <span className="tile-label"><FiActivity style={{marginBottom: "-2px"}}/> Department</span>
                <span className="tile-value">Hostel & Mess</span>
            </div>
            <div className="info-tile">
                <span className="tile-label"><FiMail style={{marginBottom: "-2px"}}/> Official Email</span>
                <span className="tile-value">warden_chief@rguktn.ac.in</span>
            </div>
            <div className="info-tile">
                <span className="tile-label"><FiCheckCircle style={{marginBottom: "-2px"}}/> Cases Solved</span>
                <span className="tile-value" style={{color: "#10b981"}}>1,204</span>
            </div>
        </div>
      </div>
    </div>
  );

  // ==========================================
  //  TAB 3: HISTORY (SOLVED LIST)
  // ==========================================
  const renderHistory = () => {
    // Filter Logic
    const filteredList = solvedHistory.filter(item => {
        const matchCategory = filterCategory === 'All' || item.category.includes(filterCategory);
        const matchStatus = filterStatus === 'All' || item.status === filterStatus;
        return matchCategory && matchStatus;
    });

    return (
        <div className="fade-in">
            <div className="content-header">
                <h2>📜 Resolution History</h2>
                <p>Archive of grievances processed by you.</p>
            </div>

            {/* FILTERS */}
            <div className="filter-bar">
                <div className="filter-label"><FiFilter /> Filter By:</div>
                <select className="filter-select" value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
                    <option value="All">All Categories</option>
                    <option value="Mess">Mess</option>
                    <option value="Hostel">Hostel</option>
                    <option value="Ragging">Ragging</option>
                </select>
                <select className="filter-select" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                    <option value="All">All Statuses</option>
                    <option value="Resolved">Resolved</option>
                    <option value="Escalated">Escalated</option>
                </select>
            </div>

            <div className="card" style={{ padding: "0" }}>
                {filteredList.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "60px", color: "#94a3b8" }}>
                        <FiCheckCircle size={40} style={{ marginBottom: "10px", opacity: 0.5 }} />
                        <p>No records found.</p>
                    </div>
                ) : (
                    <div>
                        {filteredList.map((item) => (
                            <div className="grievance-item" key={item.id}>
                                <div className="grievance-info">
                                    <h4>{item.category}</h4>
                                    <div style={{display: "flex", alignItems: "center", gap: "10px", marginTop: "5px"}}>
                                        <span style={{fontSize: "0.85rem", color: "#64748b"}}>📅 Solved: {item.resolvedDate}</span>
                                        <span className={`status-badge ${item.status === 'Resolved' ? 'status-resolved' : 'status-pending'}`}
                                              style={item.status === 'Escalated' ? {backgroundColor: "#fef2f2", color: "#dc2626", borderColor: "#fecaca"} : {}}>
                                            {item.status}
                                        </span>
                                    </div>
                                </div>
                                <button className="action-btn" onClick={() => openHistoryDetail(item)}>
                                    <FiActivity /> View Report
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
  };

  // ==========================================
  //  MAIN RENDER
  // ==========================================
  return (
    <>
      <header className="app-header">
        <div className="hamburger-btn" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          {isMobileMenuOpen ? <FiX /> : <FiMenu />}
        </div>
        <img src={logo} alt="Logo" className="header-logo" />
        <div className="header-text">
          <h1>Smart Grievance System</h1>
          <p>AUTHORITY PORTAL</p>
        </div>
      </header>

      <div className="dashboard-container">
        {isMobileMenuOpen && ( <div className="overlay" onClick={() => setIsMobileMenuOpen(false)}></div> )}

        <aside className={`sidebar ${isMobileMenuOpen ? 'open' : ''}`}>
          <ul className="sidebar-menu">
            <li className={`menu-item ${activeTab === 'home' ? 'active' : ''}`} onClick={() => handleMenuClick('home')}>
              <FiHome size={20} /> Action Center
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

      {/* --- MODALS --- */}

      {/* 1. RESOLVE MODAL (Action) */}
      {isResolveModalOpen && selectedPending && (
        <div className="modal-overlay">
            <div className="modal-content">
                <button className="close-modal-btn" onClick={() => setIsResolveModalOpen(false)}><FiX /></button>
                <h3>Resolve Grievance #{selectedPending.id}</h3>
                <p style={{background: "#f8fafc", padding: "10px", borderRadius: "8px", margin: "15px 0", fontSize: "0.9rem", color: "#475569"}}>
                    <strong>Issue:</strong> {selectedPending.description}
                </p>
                
                <div className="form-group">
                    <label className="form-label">Action Taken / Reply</label>
                    <textarea className="form-input" rows="4" placeholder="Describe how this issue was resolved..."></textarea>
                </div>
                
                <div className="form-group">
                    <label className="form-label">Set Status</label>
                    <select className="form-select form-input">
                        <option>Resolved</option>
                        <option>Escalate to Higher Authority</option>
                        <option>Reject (Invalid)</option>
                    </select>
                </div>

                <button className="login-btn" onClick={() => setIsResolveModalOpen(false)}>Submit Resolution</button>
            </div>
        </div>
      )}

      {/* 2. PASSWORD MODAL */}
      {isPasswordModalOpen && (
        <div className="modal-overlay">
            <div className="modal-content">
                <button className="close-modal-btn" onClick={() => setIsPasswordModalOpen(false)}><FiX /></button>
                <h3>Change Password</h3>
                <div className="form-group"><label className="form-label">New Password</label><input type="password" class="form-input" /></div>
                <div className="form-group"><label className="form-label">Confirm</label><input type="password" class="form-input" /></div>
                <button className="login-btn" onClick={() => setIsPasswordModalOpen(false)}>Update</button>
            </div>
        </div>
      )}

      {/* 3. HISTORY DETAIL MODAL */}
      {isHistoryDetailOpen && selectedHistory && (
        <div className="modal-overlay">
            <div className="modal-content">
                <button className="close-modal-btn" onClick={() => setIsHistoryDetailOpen(false)}><FiX /></button>
                <h3 style={{marginBottom: "15px"}}>Grievance Report</h3>
                <table className="info-table">
                    <tbody>
                        <tr><td className="info-label">Status:</td><td className="info-value">{selectedHistory.status}</td></tr>
                        <tr><td className="info-label">Closed Date:</td><td className="info-value">{selectedHistory.resolvedDate}</td></tr>
                    </tbody>
                </table>
                <div style={{marginTop: "15px", background: "#f0fdf4", padding: "10px", borderRadius: "8px", border: "1px solid #bbf7d0"}}>
                    <strong>Resolution Provided:</strong> <p>{selectedHistory.resolution}</p>
                </div>
            </div>
        </div>
      )}
    </>
  );
}

export default AuthorityDashboard;