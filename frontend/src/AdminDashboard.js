import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios'; 
import { 
  FiHome, FiUser, FiSettings, FiLogOut, FiMenu, FiX, FiUsers, FiBriefcase, 
  FiFileText, FiBarChart2, FiTrash2, FiEdit, FiSearch, 
  FiLock, FiMail, FiHash, FiCamera, FiPlus, FiPrinter 
} from 'react-icons/fi';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import './App.css';
import logo from './logo.png'; 

// API CONFIG
const API_BASE = 'http://127.0.0.1:8000/api';

function AdminDashboard() {
  // ... (State Management - largely same, just updated studentForm logic)
  
  const [activeTab, setActiveTab] = useState('home'); 
  const [dashboardView, setDashboardView] = useState('stats'); 
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false); 
  const navigate = useNavigate();

  // Settings
  const [systemTheme, setSystemTheme] = useState('default'); 
  const [allowRegistration, setAllowRegistration] = useState(true);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  // Data States
  const [stats, setStats] = useState({ students: 0, authorities: 0, complaints: 0, rate: '0%' });
  const [students, setStudents] = useState([]);      
  const [authorities, setAuthorities] = useState([]); 
  const [allGrievances, setAllGrievances] = useState([]);
  
  // Forms
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null); // Tracks if we are editing

  const [studentForm, setStudentForm] = useState({
    id: '', name: '', gender: '', year: '', branch: '', email: '', password: '', confirmPassword: ''
  });
  const [authForm, setAuthForm] = useState({
    id: '', name: '', gender: '', designation: '', dept: '', email: '', password: '', confirmPassword: ''
  });

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [dateFilter, setDateFilter] = useState('');

  // --- INITIALIZATION ---
  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (!token) navigate('/admin-login'); 
    
    document.body.className = systemTheme === 'navy' ? 'theme-navy' : '';
    fetchBackendData();

    const handleStorageChange = (e) => {
      if (e.key === 'admin_token' && e.newValue === null) navigate('/admin-login');
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [navigate, systemTheme]);


  // --- API FUNCTIONS ---
  const fetchBackendData = async () => {
    try {
        const statsRes = await axios.get(`${API_BASE}/stats/`);
        setStats(statsRes.data);
        const grievanceRes = await axios.get(`${API_BASE}/grievances/?role=admin`);
        setAllGrievances(grievanceRes.data);
        const studentsRes = await axios.get(`${API_BASE}/students/`);
        setStudents(studentsRes.data);
        const authRes = await axios.get(`${API_BASE}/authorities/`);
        setAuthorities(authRes.data);
    } catch (error) {
        console.error("Error fetching data:", error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    navigate('/admin-login'); 
  };


  // ==========================================
  //  STUDENT MANAGEMENT (EDIT ENABLED + PHOTO)
  // ==========================================

  const handleStudentIdChange = (e) => {
    const val = e.target.value.toUpperCase();
    setStudentForm({ ...studentForm, id: val, email: val ? `${val.toLowerCase()}@rguktn.ac.in` : '' });
  };

  const openAddStudent = () => {
    setEditingId(null); // We are Adding
    setStudentForm({ id: '', name: '', gender: '', year: '', branch: '', email: '', password: '', confirmPassword: '' });
    setIsStudentModalOpen(true);
  };

  // --- NEW: Open Modal for Editing ---
  const openEditStudent = (student) => {
    setEditingId(student.student_id); // We are Editing
    setStudentForm({
        id: student.student_id,
        name: student.name,
        email: student.email,
        gender: student.gender,
        year: student.year,
        branch: student.branch || '',
        password: '',       // Leave blank initially
        confirmPassword: ''
    });
    setIsStudentModalOpen(true);
  };

  const saveStudent = async () => {
    if (studentForm.password !== studentForm.confirmPassword) {
        alert("Passwords do not match!"); return;
    }

    try {
        let response;
        if (editingId) {
            // --- EDIT MODE (PUT) ---
            response = await axios.put(`${API_BASE}/students/`, {
                id: studentForm.id,
                name: studentForm.name,
                password: studentForm.password, // Optional in backend
                year: studentForm.year,
                branch: studentForm.year.startsWith('PUC') ? '' : studentForm.branch,
                gender: studentForm.gender
            });
        } else {
            // --- ADD MODE (POST) ---
            response = await axios.post(`${API_BASE}/register-student/`, {
                id: studentForm.id,
                name: studentForm.name,
                email: studentForm.email,
                password: studentForm.password,
                year: studentForm.year,
                branch: studentForm.year.startsWith('PUC') ? '' : studentForm.branch,
                gender: studentForm.gender
            });
        }

        if (response.data.status === 'success') {
            alert(editingId ? "Student Updated!" : "Student Added!");
            setIsStudentModalOpen(false);
            fetchBackendData(); 
        }
    } catch (error) {
        alert("Error saving student data.");
    }
  };

  const deleteStudent = async (id) => {
    if (window.confirm(`Delete ${id}? This will remove login access.`)) {
        try {
            await axios.delete(`${API_BASE}/students/?id=${id}`);
            fetchBackendData();
        } catch (error) {
            alert("Error deleting student.");
        }
    }
  };


  // ==========================================
  //  AUTHORITY MANAGEMENT (EDIT + PHOTO)
  // ==========================================

  const openAddAuth = () => {
    setEditingId(null);
    setAuthForm({ 
        id: '', name: '', gender: '', designation: '', dept: '', 
        email: '', password: '', confirmPassword: '', file: null 
    });
    setIsAuthModalOpen(true);
  };

  // --- NEW: Open Edit Modal ---
  const openEditAuth = (auth) => {
    setEditingId(auth.employee_id);
    setAuthForm({
        id: auth.employee_id,
        name: auth.name,
        email: auth.email,
        gender: auth.gender,
        designation: auth.designation,
        dept: auth.department,
        password: '',
        confirmPassword: '',
        file: null // Reset file on edit open
    });
    setIsAuthModalOpen(true);
  };

  const handleAuthPhotoChange = (e) => {
    if (e.target.files && e.target.files[0]) {
        setAuthForm({ ...authForm, file: e.target.files[0] });
    }
  };

  const saveAuth = async () => {
    if (authForm.password !== authForm.confirmPassword) {
        alert("Passwords do not match!"); return;
    }

    // Use FormData for File Uploads
    const formData = new FormData();
    formData.append('id', authForm.id);
    formData.append('name', authForm.name);
    formData.append('email', authForm.email);
    formData.append('gender', authForm.gender);
    formData.append('dept', authForm.dept);
    formData.append('designation', authForm.designation);
    if (authForm.password) formData.append('password', authForm.password);
    if (authForm.file) formData.append('image', authForm.file); // Append Photo

    try {
        let response;
        if (editingId) {
             // PUT for Edit
             response = await axios.put(`${API_BASE}/authorities/`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
             });
        } else {
             // POST for Add
             response = await axios.post(`${API_BASE}/register-authority/`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
             });
        }

        if (response.data.status === 'success') {
            alert(editingId ? "Authority Updated!" : "Authority Registered!");
            setIsAuthModalOpen(false);
            fetchBackendData();
        }
    } catch (error) {
        console.error(error);
        alert("Error saving authority data.");
    }
  };

  const deleteAuth = async (id) => {
    if (window.confirm(`Remove ${id}?`)) {
        try {
            await axios.delete(`${API_BASE}/authorities/?id=${id}`);
            fetchBackendData();
        } catch (error) {
            alert("Error deleting authority.");
        }
    }
  };

  // ==========================================
  //  PDF GENERATION (ADMIN VIEW)
  // ==========================================
  const generatePDF = (item) => {
    const doc = new jsPDF();

    // 1. HEADER
    try { doc.addImage(logo, 'PNG', 14, 10, 15, 15); } catch(e) { }
    doc.setFontSize(18); doc.setTextColor(30, 41, 59); doc.text("RGUKT NUZVID", 35, 18);
    doc.setFontSize(12); doc.setTextColor(100); doc.text("Smart Grievance Management System", 35, 25);
    doc.setLineWidth(0.5); doc.line(14, 32, 196, 32);

    // 2. TITLE
    doc.setFontSize(14); doc.setTextColor(0); doc.text(`Grievance Report #${item.id}`, 14, 45);
    
    // 3. DETAILS TABLE
    autoTable(doc, {
        startY: 50,
        head: [['Field', 'Details']],
        body: [
            // ADMIN CHANGE: Show Student Name & ID from the item
            ['Student', `${item.student_name || 'Unknown'} (${item.student_id})`],
            ['Category', item.category],
            ['Reported Date', new Date(item.created_at).toLocaleString()],
            ['Issue Description', item.description],
        ],
        theme: 'striped',
        headStyles: { fillColor: [37, 99, 235] }
    });

    let currentY = doc.lastAutoTable.finalY + 10;

    // 4. PHOTO SECTION (SIDE BY SIDE)
    const issueImg = item.image ? `http://127.0.0.1:8000${item.image}` : null;
    const resolvedImg = item.resolved_image ? `http://127.0.0.1:8000${item.resolved_image}` : null;

    if (issueImg || resolvedImg) {
        doc.setFontSize(12); doc.text("Attached Photos:", 14, currentY);
        currentY += 5;

        try {
            if (issueImg && resolvedImg) {
                // Both exist: Place Side by Side
                doc.addImage(issueImg, 'JPEG', 14, currentY, 80, 60);
                doc.text("Issue Proof", 14, currentY + 65);
                
                doc.addImage(resolvedImg, 'JPEG', 105, currentY, 80, 60);
                doc.text("Resolution Proof", 105, currentY + 65);
            } else if (issueImg) {
                // Only Issue
                doc.addImage(issueImg, 'JPEG', 14, currentY, 80, 60);
                doc.text("Issue Proof", 14, currentY + 65);
            } else if (resolvedImg) {
                // Only Resolved
                doc.addImage(resolvedImg, 'JPEG', 14, currentY, 80, 60);
                doc.text("Resolution Proof", 14, currentY + 65);
            }
            currentY += 75; // Advance Y position
        } catch (e) { 
            // Handle image loading errors silently or print text
        }
    }

    // 5. RESOLUTION DETAILS
    doc.setFontSize(14); doc.text("Resolution Details", 14, currentY + 10);
    
    autoTable(doc, {
        startY: currentY + 15,
        head: [['Field', 'Details']],
        body: [
            ['Status', item.status],
            ['Current Handler', item.current_handler_designation || 'Authority'],
            ['Solved Date', item.resolved_at ? new Date(item.resolved_at).toLocaleString() : 'N/A'],
            ['Authority Reply', item.authority_reply || 'No reply recorded'],
            ['Student Feedback', item.feedback_stars ? `${item.feedback_stars} Stars` : 'Not Rated']
        ],
        theme: 'grid',
        headStyles: { fillColor: [5, 150, 105] }
    });

    // 6. OUTPUT (PRINT VIEW)
    doc.autoPrint();
    window.open(doc.output('bloburl'), '_blank');
  };


  // ==========================================
  //  UI RENDERING
  // ==========================================

  const renderStats = () => (
    <div className="fade-in">
      <div className="stats-grid">
        <div className="stat-card"><div className="stat-icon-box icon-blue"><FiUsers /></div><div className="stat-info"><h3>{stats.students}</h3><p>Total Students</p></div></div>
        <div className="stat-card"><div className="stat-icon-box icon-purple"><FiBriefcase /></div><div className="stat-info"><h3>{stats.authorities}</h3><p>Authorities</p></div></div>
        <div className="stat-card"><div className="stat-icon-box icon-orange"><FiFileText /></div><div className="stat-info"><h3>{stats.complaints}</h3><p>Total Complaints</p></div></div>
        <div className="stat-card"><div className="stat-icon-box icon-green"><FiBarChart2 /></div><div className="stat-info"><h3>{stats.rate}</h3><p>Resolve Rate</p></div></div>
      </div>
    </div>
  );

  const renderStudentManagement = () => (
    <div className="fade-in">
       <div className="filter-bar">
          <div className="input-wrapper" style={{maxWidth: "300px"}}>
             <FiSearch className="input-icon" />
             <input className="form-input form-input-with-icon" placeholder="Search ID or Name..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
          <button className="login-btn" style={{width: "auto"}} onClick={openAddStudent}><FiPlus /> Add Student</button>
       </div>
       <div className="card" style={{padding: "0", overflowX: "auto"}}>
          <table className="data-table">
             <thead><tr><th>ID</th><th>Name</th><th>Branch</th><th>Year</th><th>Email</th><th>Actions</th></tr></thead>
             <tbody>
   {students.filter(s => 
       (s.name && s.name.toLowerCase().includes(searchTerm.toLowerCase())) || 
       (s.student_id && s.student_id.toLowerCase().includes(searchTerm.toLowerCase()))
   ).map(s => (
      <tr key={s.student_id}>
         <td>{s.student_id}</td>
         <td>{s.name}</td> {/* Now matches serializer 'name' */}
         <td>{s.branch || '-'}</td>
         <td>{s.year}</td>
         <td>{s.email}</td> {/* Now matches serializer 'email' */}
         <td>
            <button className="action-icon-btn btn-edit" title="Edit" onClick={() => openEditStudent(s)}><FiEdit /></button>
            <button className="action-icon-btn btn-delete" title="Delete" onClick={() => deleteStudent(s.student_id)}><FiTrash2 /></button>
         </td>
      </tr>
   ))}
   {students.length === 0 && <tr><td colSpan="6" style={{textAlign:"center", padding:"20px"}}>No students found.</td></tr>}
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
   {authorities.filter(a => 
       (a.name && a.name.toLowerCase().includes(searchTerm.toLowerCase()))
   ).map(a => (
      <tr key={a.employee_id}>
         <td>{a.employee_id}</td>
         <td>{a.name}</td> {/* Matches serializer 'name' */}
         <td>{a.designation}</td>
         <td>{a.department}</td> {/* Matches serializer 'department' */}
         <td>{a.email}</td> {/* Matches serializer 'email' */}
         <td>
            <button className="action-icon-btn btn-edit" title="Edit" onClick={() => openEditAuth(a)}><FiEdit /></button>
            <button className="action-icon-btn btn-delete" title="Delete" onClick={() => deleteAuth(a.employee_id)}><FiTrash2 /></button>
         </td>
      </tr>
   ))}
   {authorities.length === 0 && <tr><td colSpan="6" style={{textAlign:"center", padding:"20px"}}>No authorities found.</td></tr>}
</tbody>
          </table>
       </div>
    </div>
  );

  const renderGrievanceLog = () => {
    // --- ADVANCED FILTERING LOGIC ---
    const filteredGrievances = allGrievances.filter(g => {
        // 1. Text Search (ID or Student ID)
        const matchesSearch = 
            g.category?.toLowerCase().includes(searchTerm.toLowerCase()) || 
            g.student_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            g.id.toString().includes(searchTerm);

        // 2. Status Filter
        const matchesStatus = statusFilter === 'All' || g.status === statusFilter;

        // 3. Category Filter (Checks if string starts with "Hostel", "Mess", etc.)
        const matchesCategory = categoryFilter === 'All' || g.category.startsWith(categoryFilter);

        // 4. Date Filter
        let matchesDate = true;
        if (dateFilter) {
            const gDate = new Date(g.created_at).toISOString().split('T')[0]; // Extract YYYY-MM-DD
            matchesDate = gDate === dateFilter;
        }

        return matchesSearch && matchesStatus && matchesCategory && matchesDate;
    });

    return (
        <div className="fade-in">
            {/* --- FILTER BAR --- */}
            <div className="filter-bar" style={{flexWrap: 'wrap', gap: '10px', alignItems: 'center'}}>
                
                {/* Search Input */}
                <div className="input-wrapper" style={{maxWidth: "250px"}}>
                    <FiSearch className="input-icon" />
                    <input 
                        className="form-input form-input-with-icon" 
                        placeholder="Search ID..." 
                        onChange={(e) => setSearchTerm(e.target.value)} 
                    />
                </div>

                {/* Status Dropdown */}
                <select className="filter-select" onChange={(e) => setStatusFilter(e.target.value)}>
                    <option value="All">All Statuses</option>
                    <option value="Pending">Pending</option>
                    <option value="Resolved">Resolved</option>
                </select>

                {/* New: Category Dropdown */}
                <select className="filter-select" onChange={(e) => setCategoryFilter(e.target.value)}>
                    <option value="All">All Departments</option>
                    <option value="Hostel">Hostel</option>
                    <option value="Mess">Mess</option>
                    <option value="Academic">Academic</option>
                    <option value="Hospital">Hospital</option>
                    <option value="Sports">Sports/Gym</option>
                    <option value="Others">Others</option>
                </select>

                {/* New: Date Picker */}
                <input 
                    type="date" 
                    className="form-input" 
                    style={{width: 'auto', padding: '8px'}} 
                    onChange={(e) => setDateFilter(e.target.value)} 
                />

                {/* Clear Filters Button (Optional UX improvement) */}
                {(searchTerm || statusFilter !== 'All' || categoryFilter !== 'All' || dateFilter) && (
                    <button 
                        onClick={() => {setSearchTerm(''); setStatusFilter('All'); setCategoryFilter('All'); setDateFilter('');}}
                        style={{background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: '0.9rem', textDecoration: 'underline'}}
                    >
                        Clear
                    </button>
                )}
            </div>

            {/* --- RESULTS COUNT --- */}
            <div style={{marginBottom: '15px', color: '#64748b', fontSize: '0.9rem', fontWeight: '500'}}>
                Showing {filteredGrievances.length} results
            </div>

            {/* --- TABLE --- */}
            <div className="card" style={{padding: "0", overflowX: "auto"}}>
                <table className="data-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Student</th>
                        <th>Category</th>
                        <th>Date</th>
                        <th>Status</th>
                        <th>Action</th> {/* Added Header */}
                    </tr>
                </thead>
                <tbody>
                    {filteredGrievances.map(g => (
                    <tr key={g.id}>
                        <td>#{g.id}</td>
                        <td>{g.student_name} <br/><span style={{fontSize:"0.8em", color:"#64748b"}}>{g.student_id}</span></td>
                        <td>{g.category}</td>
                        <td>{new Date(g.created_at).toLocaleDateString()}</td>
                        <td>
                            <span className={`status-badge ${g.status === 'Resolved' ? 'status-resolved' : 'status-pending'}`}>
                                {g.status}
                            </span>
                        </td>
                        <td>
                            {/* PRINT BUTTON */}
                            {(g.status === 'Resolved' || g.status === 'Escalated') && (
                                <button 
                                    className="action-icon-btn" 
                                    onClick={() => generatePDF(g)}
                                    title="Print Report"
                                    style={{color: "#0284c7", backgroundColor: "#e0f2fe"}}
                                >
                                    <FiPrinter />
                                </button>
                            )}
                        </td>
                    </tr>
                    ))}
                    {filteredGrievances.length === 0 && <tr><td colSpan="6" style={{textAlign:"center", padding:"30px", color:"#94a3b8"}}>No grievances match your filters.</td></tr>}
                </tbody>
            </table>
            </div>
        </div>
    );
  };

  const renderHome = () => (
    <div>
      <div className="content-header"><h2>Administrator Dashboard</h2></div>
      
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
      <div className="content-header"><h2>Admin Profile</h2></div>
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
        </div>
      </div>
    </div>
  );

  const renderSettings = () => (
    <div className="fade-in">
      <div className="content-header"><h2>Global Settings</h2></div>
      <div className="card">
         <h4 style={{color: "#334155", marginBottom: "10px"}}>Appearance</h4>
         <div className="settings-row">
            <div><strong>Theme Color</strong><p style={{fontSize: "0.85rem", color: "#64748b"}}>Select the primary dashboard theme.</p></div>
            <select className="form-select" style={{width: "150px"}} value={systemTheme} onChange={(e) => setSystemTheme(e.target.value)}>
                <option value="default">Default Blue</option><option value="navy">Royal Navy</option><option value="dark">Dark Mode</option>
            </select>
         </div>
      </div>
    </div>
  );

  return (
    <>
      <header className="app-header">
        <div className="hamburger-btn" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>{isMobileMenuOpen ? <FiX /> : <FiMenu />}</div>
        <img src={logo} alt="Logo" className="header-logo" />
        <div className="header-text"><h1>Smart Grievance Management System</h1><p>ADMIN PORTAL</p></div>
      </header>

      <div className="dashboard-container">
        {isMobileMenuOpen && ( <div className="overlay" onClick={() => setIsMobileMenuOpen(false)}></div> )}

        <aside className={`sidebar ${isMobileMenuOpen ? 'open' : ''}`}>
          <ul className="sidebar-menu">
            <li className={`menu-item ${activeTab === 'home' ? 'active' : ''}`} onClick={() => {setActiveTab('home'); setIsMobileMenuOpen(false);}}><FiHome size={20} /> Dashboard</li>
            <li className={`menu-item ${activeTab === 'account' ? 'active' : ''}`} onClick={() => {setActiveTab('account'); setIsMobileMenuOpen(false);}}><FiUser size={20} /> Account</li>
            <li className={`menu-item ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => {setActiveTab('settings'); setIsMobileMenuOpen(false);}}><FiSettings size={20} /> Settings</li>
          </ul>
          <button className="logout-btn" onClick={handleLogout}><FiLogOut size={20} /> Logout</button>
        </aside>

        <main className="main-content">
          {activeTab === 'home' && renderHome()}
          {activeTab === 'account' && renderAccount()}
          {activeTab === 'settings' && renderSettings()}
        </main>
      </div>

      {/* --- STUDENT MODAL --- */}
      {isStudentModalOpen && (
        <div className="modal-overlay">
            <div className="modal-content" style={{maxWidth: "600px"}}>
                <button className="close-modal-btn" onClick={() => setIsStudentModalOpen(false)}><FiX /></button>
                <h3>{editingId ? 'Edit Student Details' : 'Add New Student'}</h3>
                
                {/* --- FIXED PHOTO LOGIC --- */}
                <div className="photo-upload-circle" style={{overflow: 'hidden', position: 'relative'}}>
                    {studentForm.id ? (
                        <img 
                            key={studentForm.id} /* <--- THIS KEY FIXES THE ISSUE */
                            src={`https://intranet.rguktn.ac.in/SMS/usrphotos/user/${studentForm.id}.jpg`}
                            alt="Student"
                            style={{width: '100%', height: '100%', objectFit: 'cover'}}
                            onError={(e) => {
                                // Hide the broken image
                                e.target.style.display='none'; 
                                // Show the fallback icon (next sibling)
                                e.target.nextSibling.style.display='flex';
                            }} 
                        />
                    ) : null}
                    
                    {/* Fallback Icon */}
                    <div 
                        key={studentForm.id + '-fallback'} /* Forces reset on every keystroke */
                        style={{
                            display: studentForm.id ? 'none' : 'flex', 
                            flexDirection:'column', 
                            alignItems:'center',
                            justifyContent: 'center',
                            width: '100%',
                            height: '100%'
                        }}
                    >
                        <FiCamera size={30} />
                        <span className="photo-upload-label">Photo</span>
                    </div>
                </div>

                <div className="grievance-form" style={{gridTemplateColumns: "1fr 1fr", gap: "15px"}}>
                    <div className="form-group">
                        <label className="form-label">Student ID</label>
                        <input className="form-input" value={studentForm.id} onChange={handleStudentIdChange} placeholder="N180xxx" disabled={!!editingId} style={editingId ? {backgroundColor: '#f1f5f9'} : {}}/>
                    </div>
                    <div className="form-group"><label className="form-label">Email</label><input className="form-input" value={studentForm.email} readOnly style={{backgroundColor: "#f1f5f9"}}/></div>
                    <div className="form-group"><label className="form-label">Full Name</label><input className="form-input" value={studentForm.name} onChange={(e) => setStudentForm({...studentForm, name: e.target.value})}/></div>
                    <div className="form-group"><label className="form-label">Gender</label><select className="form-select form-input" value={studentForm.gender} onChange={(e) => setStudentForm({...studentForm, gender: e.target.value})}><option value="">Select</option><option>Male</option><option>Female</option></select></div>
                    <div className="form-group"><label className="form-label">Year</label><select className="form-select form-input" value={studentForm.year} onChange={(e) => setStudentForm({...studentForm, year: e.target.value})}><option value="">Select</option><option>PUC1</option><option>PUC2</option><option>E1</option><option>E2</option><option>E3</option><option>E4</option></select></div>
                    {!studentForm.year.startsWith('PUC') && studentForm.year !== '' && (
                        <div className="form-group fade-in"><label className="form-label">Department</label><select className="form-select form-input" value={studentForm.branch} onChange={(e) => setStudentForm({...studentForm, branch: e.target.value})}><option value="">Select Branch</option><option>Computer Science and Engineering</option><option>Electronics and Communication Engineering</option><option>Mechanical Engineering</option><option>Electrical and Electronics Engineering</option><option>Civil Engineering</option><option>Chemical Engineering</option><option>Metallurgical and Materials Engineering</option></select></div>
                    )}
                </div>

                <hr style={{margin: "15px 0", borderTop: "1px solid #e2e8f0"}}/>
                <div className="grievance-form" style={{gridTemplateColumns: "1fr 1fr", gap: "15px"}}>
                    <div className="form-group"><label className="form-label">{editingId ? 'New Password (Optional)' : 'Password'}</label><input className="form-input" type="password" onChange={(e) => setStudentForm({...studentForm, password: e.target.value})} /></div>
                    <div className="form-group"><label className="form-label">Confirm Password</label><input className="form-input" type="password" onChange={(e) => setStudentForm({...studentForm, confirmPassword: e.target.value})} /></div>
                </div>

                <div style={{display: "flex", gap: "10px", marginTop: "20px"}}>
                   <button className="login-btn" onClick={saveStudent}>{editingId ? "Update Student" : "Register Student"}</button>
                   <button className="login-btn" style={{backgroundColor: "white", color: "#64748b", border: "1px solid #cbd5e1"}} onClick={() => setIsStudentModalOpen(false)}>Cancel</button>
                </div>
            </div>
        </div>
      )}

      {/* --- AUTHORITY MODAL --- */}
      {isAuthModalOpen && (
        <div className="modal-overlay">
            <div className="modal-content" style={{maxWidth: "600px"}}>
                <button className="close-modal-btn" onClick={() => setIsAuthModalOpen(false)}><FiX /></button>
                <h3>{editingId ? 'Edit Authority Details' : 'Add New Authority'}</h3>
                
                <div className="photo-upload-circle" style={{overflow: 'hidden', position: 'relative', cursor: 'pointer'}}>
                    {authForm.file ? (
                        <img src={URL.createObjectURL(authForm.file)} alt="Preview" style={{width:'100%', height:'100%', objectFit:'cover'}} />
                    ) : (
                        <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%'}}>
                            <FiCamera size={30} />
                            <span className="photo-upload-label">{editingId ? 'Change Photo' : 'Upload Photo'}</span>
                        </div>
                    )}
                    <input type="file" onChange={handleAuthPhotoChange} style={{position:'absolute', top:0, left:0, width:'100%', height:'100%', opacity:0, cursor:'pointer'}} accept="image/*"/>
                </div>

                <div className="grievance-form" style={{gridTemplateColumns: "1fr 1fr", gap: "15px"}}>
                    <div className="form-group"><label className="form-label">Employee ID</label><input className="form-input" value={authForm.id} onChange={(e) => setAuthForm({...authForm, id: e.target.value})} disabled={!!editingId} style={editingId ? {backgroundColor: '#f1f5f9'} : {}}/></div>
                    <div className="form-group"><label className="form-label">Email</label><input className="form-input" value={authForm.email} onChange={(e) => setAuthForm({...authForm, email: e.target.value})}/></div>
                    <div className="form-group"><label className="form-label">Full Name</label><input className="form-input" value={authForm.name} onChange={(e) => setAuthForm({...authForm, name: e.target.value})}/></div>
                    <div className="form-group"><label className="form-label">Gender</label><select className="form-select form-input" value={authForm.gender} onChange={(e) => setAuthForm({...authForm, gender: e.target.value})}><option value="">Select</option><option>Male</option><option>Female</option></select></div>
                    
                    {/* --- DYNAMIC DEPARTMENT SELECTION --- */}
                    <div className="form-group">
                        <label className="form-label">Department</label>
                        <select 
                            className="form-select form-input" 
                            value={authForm.dept} 
                            onChange={(e) => setAuthForm({...authForm, dept: e.target.value, designation: ''})} // Reset designation on dept change
                        >
                            <option value="">Select Dept</option>
                            <option value="Hostel">Hostel</option>
                            <option value="Mess">Mess</option>
                            <option value="Academic">Academic</option>
                            <option value="Hospital">Hospital</option>
                            <option value="Sports/Gym">Sports/Gym</option>
                            <option value="Administration">Administration</option>
                        </select>
                    </div>

                    {/* --- DYNAMIC DESIGNATION SELECTION --- */}
                    <div className="form-group">
                        <label className="form-label">Designation</label>
                        <select 
                            className="form-select form-input" 
                            value={authForm.designation} 
                            onChange={(e) => setAuthForm({...authForm, designation: e.target.value})}
                            disabled={!authForm.dept} // Disable if no dept selected
                        >
                            <option value="">Select Designation</option>
                            {/* Logic to show specific options based on Department */}
                            {authForm.dept === 'Hostel' && (
                                <><option>Chief Warden</option><option>DSW</option></>
                            )}
                            {authForm.dept === 'Mess' && (
                                <><option>Chief Mess Coordinator</option></>
                            )}
                            {authForm.dept === 'Academic' && (
                                <><option>Dean Academics</option></>
                            )}
                            {authForm.dept === 'Hospital' && (
                                <><option>Chief Medical Officer</option></>
                            )}
                            {authForm.dept === 'Sports/Gym' && (
                                <><option>Chief Sports Coordinator</option></>
                            )}
                            {authForm.dept === 'Administration' && (
                                <><option>AO</option><option>DIRECTOR</option></>
                            )}
                        </select>
                    </div>
                </div>

                <hr style={{margin: "15px 0", borderTop: "1px solid #e2e8f0"}}/>
                <div className="grievance-form" style={{gridTemplateColumns: "1fr 1fr", gap: "15px"}}>
                    <div className="form-group"><label className="form-label">{editingId ? 'New Password' : 'Password'}</label><input className="form-input" type="password" onChange={(e) => setAuthForm({...authForm, password: e.target.value})}/></div>
                    <div className="form-group"><label className="form-label">Confirm Password</label><input className="form-input" type="password" onChange={(e) => setAuthForm({...authForm, confirmPassword: e.target.value})}/></div>
                </div>

                <div style={{display: "flex", gap: "10px", marginTop: "20px"}}>
                   <button className="login-btn" onClick={saveAuth}>{editingId ? 'Update Authority' : 'Register Authority'}</button>
                   <button className="login-btn" style={{backgroundColor: "white", color: "#64748b", border: "1px solid #cbd5e1"}} onClick={() => setIsAuthModalOpen(false)}>Cancel</button>
                </div>
            </div>
        </div>
      )}

      {/* --- PASSWORD MODAL --- */}
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