import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FiHome, FiUser, FiSettings, FiLogOut, FiMenu, FiX, FiUsers, FiBriefcase, 
  FiFileText, FiBarChart2, FiTrash2, FiEdit, FiSearch, FiFilter, 
  FiCheck, FiLock, FiMail, FiHash, FiCamera, FiPlus, FiActivity 
} from 'react-icons/fi';
import './App.css';
import logo from './logo.png'; 

function AdminDashboard() {
  // ==========================================
  //  STATE MANAGEMENT
  // ==========================================
  
  // Navigation
  const [activeTab, setActiveTab] = useState('home'); 
  const [dashboardView, setDashboardView] = useState('stats'); // Sub-tabs: stats, students, authorities, grievances
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false); 
  const navigate = useNavigate();

  // Settings Toggles
  const [systemTheme, setSystemTheme] = useState('default'); 
  const [allowRegistration, setAllowRegistration] = useState(true);
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  // Profile Modal
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  // --- MOCK DATA ---
  const [students, setStudents] = useState([
    { id: 'N180001', name: 'Ravi Kumar', branch: 'CSE', year: 'E4', gender: 'Male', email: 'n180001@rguktn.ac.in', status: 'Active' },
    { id: 'N190502', name: 'Priya S', branch: 'ECE', year: 'E3', gender: 'Female', email: 'n190502@rguktn.ac.in', status: 'Active' },
    { id: 'N210100', name: 'Kiran V', branch: '-', year: 'PUC1', gender: 'Male', email: 'n210100@rguktn.ac.in', status: 'Suspended' },
  ]);

  const [authorities, setAuthorities] = useState([
    { id: 'AUTH-01', name: 'Dr. Sharma', dept: 'Hostel', designation: 'Chief Warden', email: 'warden@rguktn.ac.in', gender: 'Male' },
    { id: 'AUTH-02', name: 'Mrs. Geetha', dept: 'Mess', designation: 'Manager', email: 'mess_head@rguktn.ac.in', gender: 'Female' },
  ]);

  const [allGrievances, setAllGrievances] = useState([
    { id: 101, student: 'N180001', category: 'Mess - Food', status: 'Resolved', date: '2023-12-01' },
    { id: 102, student: 'N190502', category: 'Hostel - Wifi', status: 'Pending', date: '2023-12-24' },
    { id: 103, student: 'N200100', category: 'Ragging', status: 'Escalated', date: '2023-12-25' },
    { id: 104, student: 'N180001', category: 'Academic', status: 'Pending', date: '2023-12-26' },
  ]);

  // --- FORM MODAL STATES ---
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null); // Null = Adding, Value = Editing

  // Form Data Holders
  const [studentForm, setStudentForm] = useState({
    id: '', name: '', gender: '', year: '', branch: '', email: '', password: '', confirmPassword: ''
  });
  const [authForm, setAuthForm] = useState({
    id: '', name: '', gender: '', designation: '', dept: '', email: '', password: '', confirmPassword: ''
  });

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');


  // ==========================================
  //  SECURITY & THEME LOGIC
  // ==========================================
  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (!token) navigate('/admin-login'); 
    
    // Theme application (Simulated for UI)
    document.body.className = systemTheme === 'navy' ? 'theme-navy' : '';
    
    // Sync Logout Listener
    const handleStorageChange = (e) => {
      if (e.key === 'admin_token' && e.newValue === null) navigate('/admin-login');
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [navigate, systemTheme]);

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    navigate('/admin-login'); 
  };

  const handleMenuClick = (tab) => {
    setActiveTab(tab);
    setIsMobileMenuOpen(false); 
  };


  // ==========================================
  //  CRUD HANDLERS
  // ==========================================

  // --- STUDENT ACTIONS ---
  const handleStudentIdChange = (e) => {
    const val = e.target.value.toUpperCase();
    setStudentForm({ ...studentForm, id: val, email: val ? `${val.toLowerCase()}@rguktn.ac.in` : '' });
  };

  const openAddStudent = () => {
    setEditingId(null);
    setStudentForm({ id: '', name: '', gender: '', year: '', branch: '', email: '', password: '', confirmPassword: '' });
    setIsStudentModalOpen(true);
  };

  const openEditStudent = (student) => {
    setEditingId(student.id);
    setStudentForm({ ...student, password: '', confirmPassword: '' });
    setIsStudentModalOpen(true);
  };

  const saveStudent = () => {
    if (editingId) {
        // Edit Logic
        setStudents(students.map(s => s.id === editingId ? { ...s, ...studentForm, branch: studentForm.year.startsWith('PUC') ? '-' : studentForm.branch } : s));
    } else {
        // Add Logic
        setStudents([...students, { ...studentForm, status: 'Active', branch: studentForm.year.startsWith('PUC') ? '-' : studentForm.branch }]);
    }
    setIsStudentModalOpen(false);
  };

  const deleteStudent = (id) => {
    if (window.confirm(`Are you sure you want to delete student ${id}?`)) {
        setStudents(students.filter(s => s.id !== id));
    }
  };

  // --- AUTHORITY ACTIONS ---
  const openAddAuth = () => {
    setEditingId(null);
    setAuthForm({ id: '', name: '', gender: '', designation: '', dept: '', email: '', password: '', confirmPassword: '' });
    setIsAuthModalOpen(true);
  };

  const openEditAuth = (auth) => {
    setEditingId(auth.id);
    setAuthForm({ ...auth, password: '', confirmPassword: '' });
    setIsAuthModalOpen(true);
  };

  const saveAuth = () => {
    if (editingId) {
        setAuthorities(authorities.map(a => a.id === editingId ? { ...a, ...authForm } : a));
    } else {
        setAuthorities([...authorities, { ...authForm }]);
    }
    setIsAuthModalOpen(false);
  };

  const deleteAuth = (id) => {
    if (window.confirm(`Are you sure you want to remove authority ${id}?`)) {
        setAuthorities(authorities.filter(a => a.id !== id));
    }
  };


  // ==========================================
  //  SUB-VIEWS FOR HOME TAB
  // ==========================================

  const renderStats = () => (
    <div className="fade-in">
      <div className="stats-grid">
        <div className="stat-card"><div className="stat-icon-box icon-blue"><FiUsers /></div><div className="stat-info"><h3>{students.length}</h3><p>Total Students</p></div></div>
        <div className="stat-card"><div className="stat-icon-box icon-purple"><FiBriefcase /></div><div className="stat-info"><h3>{authorities.length}</h3><p>Authorities</p></div></div>
        <div className="stat-card"><div className="stat-icon-box icon-orange"><FiFileText /></div><div className="stat-info"><h3>{allGrievances.length}</h3><p>Total Complaints</p></div></div>
        <div className="stat-card"><div className="stat-icon-box icon-green"><FiBarChart2 /></div><div className="stat-info"><h3>75%</h3><p>Resolve Rate</p></div></div>
      </div>
      
      {/* Charts Placeholders */}
      <div style={{marginTop: "30px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "20px"}}>
         <div className="card">
            <h4>Month-wise Registration</h4>
            <div style={{height: "150px", background: "#f1f5f9", marginTop: "15px", display: "flex", alignItems: "center", justifyContent: "center", color: "#64748b"}}>(Chart Visualization)</div>
         </div>
         <div className="card">
            <h4>Department-wise Grievances</h4>
            <div style={{height: "150px", background: "#f1f5f9", marginTop: "15px", display: "flex", alignItems: "center", justifyContent: "center", color: "#64748b"}}>(Chart Visualization)</div>
         </div>
      </div>
    </div>
  );

  const renderStudentManagement = () => (
    <div className="fade-in">
       <div className="filter-bar">
          <div className="input-wrapper" style={{maxWidth: "300px"}}>
             <FiSearch className="input-icon" />
             <input className="form-input form-input-with-icon" placeholder="Search by ID or Name..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
          <button className="login-btn" style={{width: "auto"}} onClick={openAddStudent}><FiPlus /> Add Student</button>
       </div>
       <div className="card" style={{padding: "0", overflowX: "auto"}}>
          <table className="data-table">
             <thead><tr><th>ID</th><th>Name</th><th>Branch</th><th>Year</th><th>Email</th><th>Actions</th></tr></thead>
             <tbody>
                {students.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()) || s.id.toLowerCase().includes(searchTerm.toLowerCase())).map(s => (
                   <tr key={s.id}>
                      <td>{s.id}</td><td>{s.name}</td><td>{s.branch}</td><td>{s.year}</td><td>{s.email}</td>
                      <td>
                         <button className="action-icon-btn btn-edit" title="Edit" onClick={() => openEditStudent(s)}><FiEdit /></button>
                         <button className="action-icon-btn btn-delete" title="Delete" onClick={() => deleteStudent(s.id)}><FiTrash2 /></button>
                      </td>
                   </tr>
                ))}
             </tbody>
          </table>
       </div>
    </div>
  );

  const renderAuthorityManagement = () => (
    <div className="fade-in">
       <div className="filter-bar">
          <div className="input-wrapper" style={{maxWidth: "300px"}}>
             <FiSearch className="input-icon" />
             <input className="form-input form-input-with-icon" placeholder="Search Authorities..." onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
          <button className="login-btn" style={{width: "auto", backgroundColor: "#0f172a"}} onClick={openAddAuth}><FiPlus /> Add Authority</button>
       </div>
       <div className="card" style={{padding: "0", overflowX: "auto"}}>
          <table className="data-table">
             <thead><tr><th>ID</th><th>Name</th><th>Designation</th><th>Dept</th><th>Email</th><th>Actions</th></tr></thead>
             <tbody>
                {authorities.filter(a => a.name.toLowerCase().includes(searchTerm.toLowerCase())).map(a => (
                   <tr key={a.id}>
                      <td>{a.id}</td><td>{a.name}</td><td>{a.designation}</td><td>{a.dept}</td><td>{a.email}</td>
                      <td>
                         <button className="action-icon-btn btn-edit" title="Edit" onClick={() => openEditAuth(a)}><FiEdit /></button>
                         <button className="action-icon-btn btn-delete" title="Delete" onClick={() => deleteAuth(a.id)}><FiTrash2 /></button>
                      </td>
                   </tr>
                ))}
             </tbody>
          </table>
       </div>
    </div>
  );

  const renderGrievanceLog = () => {
    const filteredGrievances = allGrievances.filter(g => {
        const matchesSearch = g.category.toLowerCase().includes(searchTerm.toLowerCase()) || g.student.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'All' || g.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    return (
        <div className="fade-in">
        <div className="filter-bar">
            <div className="input-wrapper" style={{maxWidth: "300px"}}>
                <FiSearch className="input-icon" />
                <input className="form-input form-input-with-icon" placeholder="Search ID or Category..." onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
            <select className="filter-select" onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="All">All Statuses</option>
                <option value="Pending">Pending</option>
                <option value="Resolved">Resolved</option>
                <option value="Escalated">Escalated</option>
            </select>
        </div>
        <div className="card" style={{padding: "0", overflowX: "auto"}}>
            <table className="data-table">
                <thead><tr><th>ID</th><th>Student</th><th>Category</th><th>Date</th><th>Status</th></tr></thead>
                <tbody>
                    {filteredGrievances.map(g => (
                    <tr key={g.id}>
                        <td>#{g.id}</td><td>{g.student}</td><td>{g.category}</td><td>{g.date}</td>
                        <td>
                            <span className={`status-badge ${g.status === 'Resolved' ? 'status-resolved' : 'status-pending'}`}
                                style={g.status === 'Escalated' ? {backgroundColor: "#fef2f2", color: "#dc2626"} : {}}>
                                {g.status}
                            </span>
                        </td>
                    </tr>
                    ))}
                </tbody>
            </table>
        </div>
        </div>
    );
  };


  // ==========================================
  //  MAIN TABS
  // ==========================================

  const renderHome = () => (
    <div>
      <div className="content-header"><h2>🛡️ Administrator Dashboard</h2><p>System Overview & Global Management</p></div>
      
      {/* Home Sub-Navigation */}
      <div className="admin-sub-nav">
         <button className={`sub-nav-btn ${dashboardView === 'stats' ? 'active' : ''}`} onClick={() => setDashboardView('stats')}>Statistics</button>
         <button className={`sub-nav-btn ${dashboardView === 'students' ? 'active' : ''}`} onClick={() => setDashboardView('students')}>Manage Students</button>
         <button className={`sub-nav-btn ${dashboardView === 'authorities' ? 'active' : ''}`} onClick={() => setDashboardView('authorities')}>Manage Authorities</button>
         <button className={`sub-nav-btn ${dashboardView === 'grievances' ? 'active' : ''}`} onClick={() => setDashboardView('grievances')}>Grievance Log</button>
      </div>

      {dashboardView === 'stats' && renderStats()}
      {dashboardView === 'students' && renderStudentManagement()}
      {dashboardView === 'authorities' && renderAuthorityManagement()}
      {dashboardView === 'grievances' && renderGrievanceLog()}
    </div>
  );

  const renderAccount = () => (
    <div className="fade-in">
      <div className="content-header"><h2>👤 Admin Profile</h2></div>
      <div className="card" style={{ padding: "0", overflow: "hidden" }}>
        <div className="profile-header-banner" style={{background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)"}}><div className="profile-avatar-section" style={{color: "#0f172a"}}><FiUser /></div></div>
        <div style={{ padding: "0 20px 20px", marginTop: "60px", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
            <div><h2 style={{ color: "#1e293b" }}>Super Admin</h2><p style={{ color: "#64748b" }}>IT Department</p></div>
            <button className="login-btn" style={{ width: "auto", display: "flex", alignItems: "center", gap: "8px", backgroundColor: "#334155" }} onClick={() => setIsPasswordModalOpen(true)}><FiLock /> Change Password</button>
        </div>
        <hr style={{ border: "0", borderTop: "1px solid #e2e8f0", margin: "20px 0" }} />
        <div className="profile-details-grid">
            <div className="info-tile"><span className="tile-label"><FiHash/> Admin ID</span><span className="tile-value">ROOT-001</span></div>
            <div className="info-tile"><span className="tile-label"><FiMail/> Email</span><span className="tile-value">admin@rguktn.ac.in</span></div>
            <div className="info-tile"><span className="tile-label"><FiLock/> Access Level</span><span className="tile-value">Level 5 (Full)</span></div>
        </div>
      </div>
    </div>
  );

  const renderSettings = () => (
    <div className="fade-in">
      <div className="content-header"><h2>⚙️ Global Settings</h2><p>Configure system-wide parameters.</p></div>
      <div className="card">
         <h4 style={{color: "#334155", marginBottom: "10px"}}>Appearance</h4>
         <div className="settings-row">
            <div><strong>Theme Color</strong><p style={{fontSize: "0.85rem", color: "#64748b"}}>Select the primary dashboard theme.</p></div>
            <select className="form-select" style={{width: "150px"}} value={systemTheme} onChange={(e) => setSystemTheme(e.target.value)}>
                <option value="default">Default Blue</option><option value="navy">Royal Navy</option><option value="dark">Dark Mode</option>
            </select>
         </div>
         <h4 style={{color: "#334155", marginTop: "30px", marginBottom: "10px"}}>System Controls</h4>
         <div className="settings-row">
            <div><strong>Allow New Registrations</strong><p style={{fontSize: "0.85rem", color: "#64748b"}}>If disabled, signup page will be blocked.</p></div>
            <label className="toggle-switch"><input type="checkbox" className="toggle-input" checked={allowRegistration} onChange={() => setAllowRegistration(!allowRegistration)} /><span className="toggle-slider"></span></label>
         </div>
         <div className="settings-row">
            <div><strong>Maintenance Mode</strong><p style={{fontSize: "0.85rem", color: "#64748b"}}>Block all user logins (except Admin).</p></div>
            <label className="toggle-switch"><input type="checkbox" className="toggle-input" checked={maintenanceMode} onChange={() => setMaintenanceMode(!maintenanceMode)} /><span className="toggle-slider"></span></label>
         </div>
      </div>
    </div>
  );


  // ==========================================
  //  MAIN RETURN
  // ==========================================

  return (
    <>
      <header className="app-header">
        <div className="hamburger-btn" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>{isMobileMenuOpen ? <FiX /> : <FiMenu />}</div>
        <img src={logo} alt="Logo" className="header-logo" />
        <div className="header-text"><h1>Smart Grievance System</h1><p>ADMIN PORTAL</p></div>
      </header>

      <div className="dashboard-container">
        {isMobileMenuOpen && ( <div className="overlay" onClick={() => setIsMobileMenuOpen(false)}></div> )}

        <aside className={`sidebar ${isMobileMenuOpen ? 'open' : ''}`}>
          <ul className="sidebar-menu">
            <li className={`menu-item ${activeTab === 'home' ? 'active' : ''}`} onClick={() => handleMenuClick('home')}><FiHome size={20} /> Dashboard</li>
            <li className={`menu-item ${activeTab === 'account' ? 'active' : ''}`} onClick={() => handleMenuClick('account')}><FiUser size={20} /> Account</li>
            <li className={`menu-item ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => handleMenuClick('settings')}><FiSettings size={20} /> Settings</li>
          </ul>
          <button className="logout-btn" onClick={handleLogout}><FiLogOut size={20} /> Logout</button>
        </aside>

        <main className="main-content">
          {activeTab === 'home' && renderHome()}
          {activeTab === 'account' && renderAccount()}
          {activeTab === 'settings' && renderSettings()}
        </main>
      </div>

      {/* --- STUDENT MODAL (ADD/EDIT) --- */}
      {isStudentModalOpen && (
        <div className="modal-overlay">
            <div className="modal-content" style={{maxWidth: "600px"}}>
                <button className="close-modal-btn" onClick={() => setIsStudentModalOpen(false)}><FiX /></button>
                <h3>{editingId ? 'Edit Student Details' : 'Add New Student'}</h3>
                
                {/* Photo Upload Placeholder */}
                <div className="photo-upload-circle"><FiCamera size={30} /><span className="photo-upload-label">Upload Photo</span></div>

                <div className="grievance-form" style={{gridTemplateColumns: "1fr 1fr", gap: "15px"}}>
                    <div className="form-group"><label className="form-label">Student ID</label><input className="form-input" value={studentForm.id} onChange={handleStudentIdChange} placeholder="N180xxx" disabled={!!editingId}/></div>
                    <div className="form-group"><label className="form-label">Email (Auto-filled)</label><input className="form-input" value={studentForm.email} readOnly style={{backgroundColor: "#f1f5f9"}}/></div>
                    <div className="form-group"><label className="form-label">Full Name</label><input className="form-input" value={studentForm.name} onChange={(e) => setStudentForm({...studentForm, name: e.target.value})}/></div>
                    <div className="form-group"><label className="form-label">Gender</label><select className="form-select form-input" value={studentForm.gender} onChange={(e) => setStudentForm({...studentForm, gender: e.target.value})}><option value="">Select</option><option>Male</option><option>Female</option></select></div>
                    <div className="form-group"><label className="form-label">Year</label><select className="form-select form-input" value={studentForm.year} onChange={(e) => setStudentForm({...studentForm, year: e.target.value})}><option value="">Select</option><option>PUC1</option><option>PUC2</option><option>E1</option><option>E2</option><option>E3</option><option>E4</option></select></div>
                    {/* Conditional Department: Only show if NOT PUC */}
                    {!studentForm.year.startsWith('PUC') && studentForm.year !== '' && (
                        <div className="form-group fade-in"><label className="form-label">Department</label><select className="form-select form-input" value={studentForm.branch} onChange={(e) => setStudentForm({...studentForm, branch: e.target.value})}><option value="">Select Branch</option><option>CSE</option><option>ECE</option><option>MECH</option><option>EEE</option><option>CIVIL</option><option>CHEM</option><option>MME</option></select></div>
                    )}
                </div>

                <hr style={{margin: "15px 0", borderTop: "1px solid #e2e8f0"}}/>
                <div className="grievance-form" style={{gridTemplateColumns: "1fr 1fr", gap: "15px"}}>
                    <div className="form-group"><label className="form-label">{editingId ? 'Reset Password (Optional)' : 'Password'}</label><input className="form-input" type="password" /></div>
                    <div className="form-group"><label className="form-label">Confirm Password</label><input className="form-input" type="password" /></div>
                </div>

                <div style={{display: "flex", gap: "10px", marginTop: "20px"}}>
                   <button className="login-btn" onClick={saveStudent}>Save Student</button>
                   <button className="login-btn" style={{backgroundColor: "white", color: "#64748b", border: "1px solid #cbd5e1"}} onClick={() => setIsStudentModalOpen(false)}>Cancel</button>
                </div>
            </div>
        </div>
      )}

      {/* --- AUTHORITY MODAL (ADD/EDIT) --- */}
      {isAuthModalOpen && (
        <div className="modal-overlay">
            <div className="modal-content" style={{maxWidth: "600px"}}>
                <button className="close-modal-btn" onClick={() => setIsAuthModalOpen(false)}><FiX /></button>
                <h3>{editingId ? 'Edit Authority Details' : 'Add New Authority'}</h3>
                
                <div className="photo-upload-circle"><FiCamera size={30} /><span className="photo-upload-label">Upload Photo</span></div>

                <div className="grievance-form" style={{gridTemplateColumns: "1fr 1fr", gap: "15px"}}>
                    <div className="form-group"><label className="form-label">Employee ID</label><input className="form-input" value={authForm.id} onChange={(e) => setAuthForm({...authForm, id: e.target.value})} disabled={!!editingId}/></div>
                    <div className="form-group"><label className="form-label">Official Email</label><input className="form-input" value={authForm.email} onChange={(e) => setAuthForm({...authForm, email: e.target.value})}/></div>
                    <div className="form-group"><label className="form-label">Full Name</label><input className="form-input" value={authForm.name} onChange={(e) => setAuthForm({...authForm, name: e.target.value})}/></div>
                    <div className="form-group"><label className="form-label">Gender</label><select className="form-select form-input" value={authForm.gender} onChange={(e) => setAuthForm({...authForm, gender: e.target.value})}><option value="">Select</option><option>Male</option><option>Female</option></select></div>
                    <div className="form-group"><label className="form-label">Designation</label><input className="form-input" placeholder="Ex: Chief Warden" value={authForm.designation} onChange={(e) => setAuthForm({...authForm, designation: e.target.value})}/></div>
                    <div className="form-group"><label className="form-label">Department</label><select className="form-select form-input" value={authForm.dept} onChange={(e) => setAuthForm({...authForm, dept: e.target.value})}><option value="">Select Dept</option><option>Hostel</option><option>Mess</option><option>Academics</option><option>Hospital</option><option>Sports</option><option>Administration</option></select></div>
                </div>

                <hr style={{margin: "15px 0", borderTop: "1px solid #e2e8f0"}}/>
                <div className="grievance-form" style={{gridTemplateColumns: "1fr 1fr", gap: "15px"}}>
                    <div className="form-group"><label className="form-label">Password</label><input className="form-input" type="password" /></div>
                    <div className="form-group"><label className="form-label">Confirm Password</label><input className="form-input" type="password" /></div>
                </div>

                <div style={{display: "flex", gap: "10px", marginTop: "20px"}}>
                   <button className="login-btn" onClick={saveAuth}>Save Authority</button>
                   <button className="login-btn" style={{backgroundColor: "white", color: "#64748b", border: "1px solid #cbd5e1"}} onClick={() => setIsAuthModalOpen(false)}>Cancel</button>
                </div>
            </div>
        </div>
      )}

      {/* --- PASSWORD CHANGE MODAL --- */}
      {isPasswordModalOpen && (
        <div className="modal-overlay">
            <div className="modal-content">
                <button className="close-modal-btn" onClick={() => setIsPasswordModalOpen(false)}><FiX /></button>
                <h3>Change Admin Password</h3>
                <div className="form-group"><label className="form-label">New Password</label><input type="password" class="form-input" /></div>
                <div className="form-group"><label className="form-label">Confirm</label><input type="password" class="form-input" /></div>
                <div style={{display: "flex", gap: "10px", marginTop: "20px"}}>
                   <button className="login-btn" onClick={() => setIsPasswordModalOpen(false)}>Update</button>
                   <button className="login-btn" style={{backgroundColor: "white", color: "#64748b", border: "1px solid #cbd5e1"}} onClick={() => setIsPasswordModalOpen(false)}>Cancel</button>
                </div>
            </div>
        </div>
      )}
    </>
  );
}

export default AdminDashboard;