import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios'; 
import { 
  FiHome, FiUser, FiLogOut, FiMenu, FiX, FiFilter, FiLock, FiMail, 
  FiBriefcase, FiCheckCircle, FiAlertCircle, FiClock, FiActivity, FiPrinter, FiSearch, FiBarChart2, FiEdit3, FiChevronDown
} from 'react-icons/fi';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable'; 
import './App.css';
import logo from './logo.png'; 
import userAvatar from './logo.png'; 
import { 
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend 
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

// API CONFIG
const API_BASE = 'https://grievancemanagementsystemrguktnuzvid.onrender.com';

function AuthorityDashboard() {
  // ==========================================
  //  STATE MANAGEMENT
  // ==========================================
  const [userInfo, setUserInfo] = useState(null); // Basic Info (Name, ID)
  const [fullProfile, setFullProfile] = useState(null); // Detailed Info (Dept, Designation)
  
  // Data States
  const [pendingGrievances, setPendingGrievances] = useState([]);
  const [solvedHistory, setSolvedHistory] = useState([]);
  const [stats, setStats] = useState({ pending: 0, solved: 0 });

  const [activeTab, setActiveTab] = useState('home'); 
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false); 
  const navigate = useNavigate();

const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);

  // Profile Modal
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [newPassword, setNewPassword] = useState({ pass: '', confirm: '' });

  const [isProfileImageOpen, setIsProfileImageOpen] = useState(false);

  // Resolution Modal
  const [selectedPending, setSelectedPending] = useState(null);
  const [isResolveModalOpen, setIsResolveModalOpen] = useState(false);
  const [resolutionData, setResolutionData] = useState({ reply: '', status: 'Resolved' });

  // History Modal
  const [selectedHistory, setSelectedHistory] = useState(null);
  const [isHistoryDetailOpen, setIsHistoryDetailOpen] = useState(false);


  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterDate, setFilterDate] = useState('');

  // ==========================================
  //  INITIALIZATION & FETCHING
  // ==========================================
  useEffect(() => {
    const token = localStorage.getItem('authority_token');
    const storedUser = localStorage.getItem('authority_user');

    if (!token) { navigate('/'); return; }

    if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        setUserInfo(parsedUser);
        
        // 1. Fetch Full Profile (To get Designation/Dept)
        fetchAuthorityProfile(parsedUser.username);
        
        // 2. Fetch Grievances (After we know the ID)
        fetchGrievances(parsedUser.username);
    }

    const handleStorageChange = (e) => {
      if (e.key === 'authority_token' && e.newValue === null) navigate('/');
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [navigate]);

  const fetchAuthorityProfile = async (empId) => {
      try {
          const res = await axios.get(`${API_BASE}/authorities/`);
          // Filter client-side to find *this* authority
          const myProfile = res.data.find(a => a.employee_id === empId);
          if (myProfile) {
              setFullProfile(myProfile);
          }
      } catch (error) {
          console.error("Error fetching profile:", error);
      }
  };

  // --- HELPER: Professional Average Time Calculation ---
  const calculateAvgTime = (grievancesList) => {
    // 1. Filter only resolved items that have a resolution date
    const resolvedGs = grievancesList.filter(g => g.status === 'Resolved' && g.resolved_at);
    
    if (resolvedGs.length === 0) return 'N/A';

    let totalMs = 0;
    resolvedGs.forEach(g => {
        const start = new Date(g.created_at);
        const end = new Date(g.resolved_at);
        // Prevent negative time (in case of server clock skew)
        if (end > start) {
            totalMs += (end - start);
        }
    });

    // 2. Get Average in Milliseconds
    const avgMs = totalMs / resolvedGs.length;

    // 3. Convert to larger units
    const avgMins = avgMs / (1000 * 60);
    const avgHours = avgMins / 60;
    const avgDays = avgHours / 24;

    // 4. Return formatted string based on duration magnitude
    if (avgMins < 60) {
        // Less than 1 hour -> Show Minutes (e.g., "45 Mins")
        return `${Math.round(avgMins)} Mins`;
    } else if (avgHours < 24) {
        // Less than 1 day -> Show Hours with 1 decimal (e.g., "5.5 Hours")
        return `${avgHours.toFixed(1)} Hours`;
    } else {
        // More than 1 day -> Show Days with 1 decimal (e.g., "2.4 Days")
        return `${avgDays.toFixed(1)} Days`;
    }
  };

  const fetchGrievances = async (empId) => {
      try {
          const res = await axios.get(`${API_BASE}/grievances/?role=authority&user_id=${empId}`);
          const allData = res.data;
          
          const pending = allData.filter(g => g.status === 'Pending');
          const history = allData.filter(g => ['Resolved', 'Escalated', 'Rejected'].includes(g.status));
          const resolvedCount = allData.filter(g => g.status === 'Resolved').length;
          
          setPendingGrievances(pending);
          setSolvedHistory(history);

          // --- UPDATE STATS HERE ---
          setStats({ 
              pending: pending.length, 
              solved: history.length,
              // Calculate real average time using the helper
              avgTime: calculateAvgTime(allData), 
              rate: allData.length > 0 ? `${Math.round((resolvedCount / allData.length) * 100)}%` : '0%'
          });

      } catch (error) { console.error("Error fetching grievances:", error); }
  };

  // ==========================================
  //  PDF GENERATION (PERFORMANCE REPORT)
  // ==========================================
  const generateMyReport = () => {
    const doc = new jsPDF();
    
    // Header
    try { doc.addImage(logo, 'PNG', 14, 10, 20, 20); } catch(e) {}
    doc.setFontSize(18); doc.setTextColor(30, 41, 59); doc.text("RGUKT NUZVID", 40, 20);
    doc.setFontSize(10); doc.setTextColor(100); doc.text("Smart Grievance Management System", 40, 26);
    
    doc.setFontSize(11); doc.setTextColor(0); 
    doc.text(`Authority Performance Report`, 14, 45);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 196, 20, {align: 'right'});

    // User Details
    if(fullProfile) {
        doc.text(`Name: ${fullProfile.name}`, 14, 55);
        doc.text(`Department: ${fullProfile.department}`, 14, 62);
    }

    // Stats Table
    autoTable(doc, {
        startY: 70,
        head: [['Performance Metric', 'Value']],
        body: [
            ['Total Assigned', stats.total],
            ['Resolved Successfully', stats.resolved],
            ['Pending Action', stats.pending],
            ['Escalated', stats.escalated],
            ['Resolution Rate', stats.rate],
            ['Avg Response Time', stats.avgTime]
        ],
        theme: 'grid',
        headStyles: { fillColor: [30, 41, 59] }
    });

    // Signature Footer
    const pageHeight = doc.internal.pageSize.height;
    doc.setFontSize(9); doc.setTextColor(150);
    doc.text("Authorized Signature", 14, pageHeight - 30);
    doc.text("_______________________", 14, pageHeight - 20);

    doc.save('My_Performance_Report.pdf');
  };

  const handleLogout = () => {
    localStorage.removeItem('authority_token');
    localStorage.removeItem('authority_user');
    navigate('/'); 
  };

  const handleMenuClick = (tab) => {
    setActiveTab(tab);
    setIsMobileMenuOpen(false); 
  };

  // ==========================================
  //  ACTIONS (RESOLVE / PASSWORD)
  // ==========================================

  const submitResolution = async () => {
      if (!resolutionData.reply) { alert("Please provide a reply."); return; }

      // Use FormData for File Upload
      const formData = new FormData();
      formData.append('id', selectedPending.id);
      formData.append('status', resolutionData.status);
      formData.append('reply', resolutionData.reply);
      if (resolutionData.file) {
          formData.append('resolved_image', resolutionData.file);
      }

      try {
          // Note: Backend must support PATCH with Multipart/Form-Data
          await axios.patch(`${API_BASE}/grievances/`, formData, {
               headers: { 'Content-Type': 'multipart/form-data' }
          });
          alert("Grievance Updated!");
          setIsResolveModalOpen(false);
          setResolutionData({ reply: '', status: 'Resolved', file: null });
          if (userInfo) fetchGrievances(userInfo.username);
      } catch (error) { alert("Error updating grievance."); console.error(error); }
  };

  const changePassword = async () => {
      if (newPassword.pass !== newPassword.confirm) { alert("Passwords mismatch"); return; }
      try {
          // Reusing the Authority Management API for password update
          await axios.put(`${API_BASE}/authorities/`, {
              id: userInfo.username,
              password: newPassword.pass
          });
          alert("Password Changed. Please login again.");
          handleLogout();
      } catch (error) {
          alert("Error changing password.");
      }
  };

  // --- HELPER FUNCTIONS ---
  const openResolveModal = (item) => {
    setSelectedPending(item);
    setResolutionData({ reply: '', status: 'Resolved' });
    setIsResolveModalOpen(true);
  };

  const openHistoryDetail = (item) => {
    setSelectedHistory(item);
    setIsHistoryDetailOpen(true);
  };

  // ==========================================
  //  PDF GENERATION (PRINT VIEW)
  // ==========================================
  const generatePDF = (item) => {
    const doc = new jsPDF();
    try { doc.addImage(logo, 'PNG', 14, 10, 15, 15); } catch(e) { }
    doc.setFontSize(18); doc.setTextColor(30, 41, 59); doc.text("RGUKT NUZVID", 35, 18);
    doc.setFontSize(12); doc.setTextColor(100); doc.text("Smart Grievance Management System", 35, 25);
    doc.setLineWidth(0.5); doc.line(14, 32, 196, 32);

    doc.setFontSize(14); doc.setTextColor(0); doc.text(`Grievance Report #${item.id}`, 14, 45);
    
    autoTable(doc, {
        startY: 50,
        head: [['Field', 'Details']],
        body: [
            ['Student ID', item.student_id || 'N/A'],
            ['Category', item.category],
            ['Reported Date', new Date(item.created_at).toLocaleString()],
            ['Issue Description', item.description],
        ],
        theme: 'striped',
        headStyles: { fillColor: [37, 99, 235] }
    });

    let currentY = doc.lastAutoTable.finalY + 10;

    // --- SIDE BY SIDE IMAGES ---
    const issueImg = item.image ? `http://127.0.0.1:8000${item.image}` : null;
    const resolvedImg = item.resolved_image ? `http://127.0.0.1:8000${item.resolved_image}` : null;

    if (issueImg || resolvedImg) {
        doc.setFontSize(12); doc.text("Attached Photos:", 14, currentY);
        currentY += 5;
        try {
            if (issueImg && resolvedImg) {
                doc.addImage(issueImg, 'JPEG', 14, currentY, 80, 60);
                doc.text("Issue Proof", 14, currentY + 65);
                doc.addImage(resolvedImg, 'JPEG', 105, currentY, 80, 60);
                doc.text("Resolution Proof", 105, currentY + 65);
            } else if (issueImg) {
                doc.addImage(issueImg, 'JPEG', 14, currentY, 80, 60);
                doc.text("Issue Proof", 14, currentY + 65);
            } else if (resolvedImg) {
                doc.addImage(resolvedImg, 'JPEG', 14, currentY, 80, 60);
                doc.text("Resolution Proof", 14, currentY + 65);
            }
            currentY += 75;
        } catch (e) { }
    }

    doc.setFontSize(14); doc.text("Resolution Details", 14, currentY + 10);
    autoTable(doc, {
        startY: currentY + 15,
        head: [['Field', 'Details']],
        body: [
            ['Status', item.status],
            ['Solved By', fullProfile ? `${fullProfile.name} (${fullProfile.designation})` : 'Authority'],
            ['Solved Date', item.resolved_at ? new Date(item.resolved_at).toLocaleString() : 'N/A'],
            ['Authority Reply', item.authority_reply || 'No reply recorded'],
            ['Student Feedback', item.feedback_stars ? `${item.feedback_stars} Stars` : 'Not Rated']
        ],
        theme: 'grid',
        headStyles: { fillColor: [5, 150, 105] }
    });
    
    doc.autoPrint();
    window.open(doc.output('bloburl'), '_blank');
  };

  // ==========================================
  //  TAB 1: HOME (ACTION CENTER)
  // ==========================================
  const renderHome = () => {
    // Logic for Graph Data
    const getGraphData = () => {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const data = new Array(12).fill(0);
        
        // Use solvedHistory or re-fetch allGrievances if stored separately
        solvedHistory.forEach(g => {
            if (g.status === 'Resolved') {
                const date = new Date(g.resolved_at || g.created_at);
                data[date.getMonth()]++;
            }
        });

        return { 
            labels: months, 
            datasets: [{ label: 'Resolved Cases', data, backgroundColor: '#2563eb', borderRadius: 4 }] 
        };
    };

    return (
    <div className="fade-in">
      <div className="content-header">
        <h2>Welcome, {fullProfile ? fullProfile.name : ''}</h2>
        <p style={{color: '#64748b'}}>{fullProfile ? fullProfile.designation : 'Loading...'}</p>
        <br></br>
      </div>

      {/* TOP STAT CARDS */}
      <div className="stats-grid" style={{marginBottom: "20px"}}>
        <div className="stat-card"><div className="stat-icon-box icon-orange"><FiAlertCircle /></div><div className="stat-info"><h3>{stats.pending}</h3><p>Pending</p></div></div>
        <div className="stat-card"><div className="stat-icon-box icon-green"><FiCheckCircle /></div><div className="stat-info"><h3>{stats.solved}</h3><p>Resolved</p></div></div>
        <div className="stat-card"><div className="stat-icon-box icon-blue"><FiActivity /></div><div className="stat-info"><h3>{stats.avgTime}</h3><p>Avg Time</p></div></div>
        <div className="stat-card"><div className="stat-icon-box icon-purple"><FiBarChart2 /></div><div className="stat-info"><h3>{stats.rate}</h3><p>Success Rate</p></div></div>
      </div>

      {/* SPLIT SECTION: PENDING (LEFT) - GRAPH (RIGHT) */}
      <div className="stats-container-split"> 
          
          {/* LEFT SIDE: PENDING ACTIONS LIST */}
          <div className="card" style={{height: "450px", display: "flex", flexDirection: "column", padding: 0, overflow: "hidden", border: "1px solid #e2e8f0"}}>
             
             {/* Header */}
             <div style={{padding: "15px 20px", background: "white", zIndex: 10, borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center"}}>
                <h3 style={{fontSize: "1.05rem", color: "#0f172a", margin: 0, fontWeight: "700"}}>Pending Actions</h3>
                <span style={{fontSize: "0.8rem", background: "#ef4444", color: "white", padding: "2px 8px", borderRadius: "10px", fontWeight: "600"}}>
                    {pendingGrievances.length} New
                </span>
             </div>
             
             {/* Scrollable List Area */}
             <div className="pending-list-container">
                 {pendingGrievances.length === 0 ? (
                    <div style={{textAlign: "center", padding: "80px 20px", color: "#94a3b8"}}>
                        <FiCheckCircle size={40} style={{marginBottom: "15px", opacity: 0.3}}/>
                        <p style={{fontSize: "0.95rem"}}>All caught up! No pending tasks.</p>
                    </div>
                 ) : (
                    <div>
                        {pendingGrievances.map(g => (
                            <div 
                                key={g.id} 
                                className="actionable-item" 
                                onClick={() => openResolveModal(g)}
                                title="Click to Resolve"
                            >
                                {/* Top Row: ID and Date */}
                                <div className="actionable-header">
                                    <span className="ticket-id">#{g.id}</span>
                                    <span className="ticket-date">{new Date(g.created_at).toLocaleDateString()}</span>
                                </div>

                                {/* Middle: Title (Category) + Student Badge */}
                                <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
                                    <h4 className="actionable-title">
                                        {g.category}
                                    </h4>
                                    <span className="student-badge">
                                        <FiUser size={10}/> {g.student_id}
                                    </span>
                                </div>

                                {/* Bottom: Description Preview */}
                                <p className="actionable-desc">
                                    {g.description}
                                </p>
                            </div>
                        ))}
                    </div>
                 )}
                </div>
          </div>

          {/* RIGHT SIDE: ANALYTICS GRAPH */}
          <div className="card" style={{height: "400px", display: "flex", flexDirection: "column", position: 'relative'}}>
             <div style={{display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px"}}>
                 <h3 style={{fontSize: "1.1rem", color: "#334155"}}>Monthly Progress</h3>
                 
                 {/* PRINT BUTTON */}
                 <button 
                    onClick={generateMyReport}
                    style={{
                        background: '#f1f5f9', border: 'none', padding: '6px 12px', 
                        borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
                        fontSize: '0.85rem', color: '#334155', fontWeight: '500'
                    }}
                 >
                    <FiPrinter /> Print Report
                 </button>
             </div>

             <div style={{flex: 1, position: "relative"}}>
                <Bar 
                    data={getGraphData()} 
                    options={{ 
                        responsive: true, 
                        maintainAspectRatio: false,
                        plugins: { legend: { display: false } }
                    }} 
                />
             </div>
          </div>
      </div>
    </div>
    );
  };

  // ==========================================
  //  TAB 2: PROFILE (DYNAMIC)
  // ==========================================
  const renderProfile = () => (
    <div className="fade-in">
      <div className="content-header">
        <h2>Authority Profile</h2>
      </div>
      
      <div className="card" style={{ padding: "0", overflow: "hidden" }}>
        {/* Banner */}
        <div className="profile-header-banner" style={{background: "linear-gradient(135deg, #059669 0%, #10b981 100%)"}}>
            <div 
                className="profile-avatar-section" 
                style={{color: "#059669", overflow: 'hidden', cursor: 'pointer'}} 
                onClick={() => setIsProfileImageOpen(true)}
                title="Click to expand"
            >
                {/* LOGIC: Check if profile_pic exists in the fetched profile data */}
                {fullProfile && fullProfile.profile_pic ? (
                    <img 
                        // Construct the full URL using the API_BASE domain
                        src={`${API_BASE.replace('/api', '')}${fullProfile.profile_pic}`} 
                        alt="Profile" 
                        style={{width: '100%', height: '100%', objectFit: 'cover'}}
                        onError={(e) => {e.target.style.display='none'; e.target.nextSibling.style.display='flex'}} 
                    />
                ) : null}
                
                {/* Fallback Icon (Shows if no photo exists or image fails to load) */}
                <div style={{display: (fullProfile && fullProfile.profile_pic) ? 'none' : 'flex', width:'100%', height:'100%', alignItems:'center', justifyContent:'center'}}>
                    <FiUser />
                </div>
            </div>
        </div>

        <div style={{ padding: "0 20px 20px", marginTop: "60px", display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "20px" }}>
            <div>
                <h2 style={{ color: "#1e293b", marginBottom: "5px" }}>{fullProfile ? fullProfile.name : 'Loading...'}</h2>
                <p style={{ color: "#64748b", fontWeight: "500" }}>{fullProfile ? fullProfile.designation : '...'}</p>
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
                <span className="tile-value">{fullProfile ? fullProfile.employee_id : '---'}</span>
            </div>
            <div className="info-tile">
                <span className="tile-label"><FiActivity style={{marginBottom: "-2px"}}/> Department</span>
                <span className="tile-value">{fullProfile ? fullProfile.department : '---'}</span>
            </div>
            <div className="info-tile">
                <span className="tile-label"><FiMail style={{marginBottom: "-2px"}}/> Official Email</span>
                <span className="tile-value">{fullProfile ? fullProfile.email : '---'}</span>
            </div>
            <div className="info-tile">
                <span className="tile-label"><FiCheckCircle style={{marginBottom: "-2px"}}/> Cases Solved</span>
                <span className="tile-value" style={{color: "#10b981"}}>{stats.solved}</span>
            </div>
        </div>
      </div>
    </div>
  );

  // ==========================================
  //  TAB 3: HISTORY (UPDATED WITH PDF)
  // ==========================================
  const renderHistory = () => {
    // --- UPDATED FILTER LOGIC (With Date) ---
    const filteredList = solvedHistory.filter(item => {
        // 1. Search Text (Category or Student ID)
        const matchSearch = searchTerm === '' || 
                            item.category.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            (item.student_id && item.student_id.toLowerCase().includes(searchTerm.toLowerCase()));
        
        // 2. Status Filter
        const matchStatus = filterStatus === 'All' || item.status === filterStatus;

        // 3. Date Filter (New)
        let matchDate = true;
        if (filterDate) {
            // Convert 'resolved_at' (e.g., "2026-01-24T10:00:00") to YYYY-MM-DD
            const resolvedDate = item.resolved_at ? new Date(item.resolved_at).toISOString().split('T')[0] : '';
            matchDate = resolvedDate === filterDate;
        }
        
        return matchSearch && matchStatus && matchDate;
    });

    return (
        <div className="fade-in">
            <div className="content-header">
                <h2>Resolution History</h2>
            </div>

            {/* --- UPDATED FILTERS BAR --- */}
            <div className="filter-bar" style={{flexWrap: 'wrap', gap: '10px'}}>
                {/* Search Input */}
                <div className="input-wrapper" style={{maxWidth: "250px"}}>
                     <FiSearch className="input-icon" />
                     <input 
                        className="form-input form-input-with-icon" 
                        placeholder="Search Category / ID..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)} 
                     />
                </div>

                {/* Status Dropdown */}
                <select className="filter-select" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                    <option value="All">All Statuses</option>
                    <option value="Resolved">Resolved</option>
                    <option value="Escalated">Escalated</option>
                </select>

                {/* Date Picker (New) */}
                <input 
                    type="date" 
                    className="form-input" 
                    style={{width: 'auto', padding: '8px'}}
                    value={filterDate}
                    onChange={(e) => setFilterDate(e.target.value)}
                />
                
                {/* Clear Filters Button (Optional) */}
                {(searchTerm || filterStatus !== 'All' || filterDate) && (
                    <button 
                        onClick={() => {setSearchTerm(''); setFilterStatus('All'); setFilterDate('');}}
                        style={{background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: '0.85rem', textDecoration: 'underline'}}
                    >
                        Clear
                    </button>
                )}
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
                                        <span style={{fontSize: "0.85rem", color: "#64748b"}}>
                                            📅 Solved: {item.resolved_at ? new Date(item.resolved_at).toLocaleDateString() : 'N/A'}
                                        </span>
                                        <span className={`status-badge ${item.status === 'Resolved' ? 'status-resolved' : 'status-pending'}`}
                                              style={item.status === 'Escalated' ? {backgroundColor: "#fef2f2", color: "#dc2626", borderColor: "#fecaca"} : {}}>
                                            {item.status}
                                        </span>
                                    </div>
                                </div>
                                <div style={{display: "flex", gap: "10px"}}>
                                    <button className="action-btn" onClick={() => openHistoryDetail(item)}>
                                        <FiActivity /> View Report
                                    </button>
                                    <button 
                                        className="action-btn" 
                                        onClick={() => generatePDF(item)}
                                        style={{backgroundColor: "#e0f2fe", color: "#0284c7", border: "1px solid #bae6fd"}}
                                        title="Print PDF Report"
                                    >
                                        <FiPrinter /> Print
                                    </button>
                                </div>
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
          <h1>Smart Grievance Management System</h1>
          <p>AUTHORITY PORTAL</p>
        </div>
        
        <div className="header-right">
            <div className="profile-trigger" onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}>
                <span className="header-user-name">
                    {fullProfile ? fullProfile.name : 'Authority'}
                </span>
                
                <div style={{width: '35px', height: '35px', borderRadius: '50%', overflow: 'hidden', border: '2px solid white'}}>
                    {fullProfile && fullProfile.profile_pic ? (
                        <img 
                            src={`${API_BASE.replace('/api', '')}${fullProfile.profile_pic}`} 
                            alt="Profile" 
                            style={{width: '100%', height: '100%', objectFit: 'cover'}}
                            onError={(e) => {
                                // Fallback logic if image fails
                                e.target.style.display='none'; 
                                e.target.parentElement.style.backgroundColor='#ccc';
                            }} 
                        />
                    ) : (
                        // Fallback Icon if no photo exists
                        <div style={{width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', background:'#e2e8f0'}}>
                            <FiUser color="#64748b"/>
                        </div>
                    )}
                </div>

                <FiChevronDown size={16} color="#64748b"/>
            </div>

            {isProfileDropdownOpen && (
                <div className="profile-dropdown-menu">
                    <button className="dropdown-item" onClick={() => {setActiveTab('profile'); setIsProfileDropdownOpen(false);}}>
                        <FiUser /> My Profile
                    </button>
                    <button className="dropdown-item" onClick={() => {setActiveTab('history'); setIsProfileDropdownOpen(false);}}>
                        <FiClock /> History
                    </button>
                    <button className="dropdown-item logout-option" onClick={handleLogout}>
                        <FiLogOut /> Logout
                    </button>
                </div>
            )}
        </div>

        {/* CLICK OUTSIDE OVERLAY (To close menu when clicking elsewhere) */}
        {isProfileDropdownOpen && (
            <div 
                style={{position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 199}} 
                onClick={() => setIsProfileDropdownOpen(false)}
            ></div>
        )}
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
                <h3>Take Action #{selectedPending.id}</h3>
                <p style={{background: "#f8fafc", padding: "10px", borderRadius: "8px", margin: "15px 0", fontSize: "0.9rem", color: "#475569"}}><strong>Issue:</strong> {selectedPending.description}</p>
                {selectedPending.image && (<div style={{marginBottom: "15px"}}><a href={`http://127.0.0.1:8000${selectedPending.image}`} target="_blank" rel="noreferrer" style={{fontSize:'0.85rem', color:'#2563eb'}}>View Attached Photo</a></div>)}
                <div className="form-group"><label className="form-label">Action Taken / Reply</label><textarea className="form-input" rows="4" placeholder="Describe how this issue was resolved..." value={resolutionData.reply} onChange={(e) => setResolutionData({...resolutionData, reply: e.target.value})}></textarea></div>
                <div className="form-group"><label className="form-label">Set Status</label><select className="form-select form-input" value={resolutionData.status} onChange={(e) => setResolutionData({...resolutionData, status: e.target.value})}><option value="Resolved">Resolved</option><option value="Escalated">Escalate to Higher Authority</option><option value="Rejected">Reject (Invalid)</option></select></div>
                
                {/* FILE UPLOAD INPUT */}
                <div className="form-group">
                    <label className="form-label">Attach Resolution Proof (Optional)</label>
                    <div className="file-upload-box" style={{padding: '10px'}}>
                        <input type="file" onChange={(e) => {if(e.target.files[0]) setResolutionData({...resolutionData, file: e.target.files[0]})}} />
                    </div>
                </div>

                <button className="login-btn" onClick={submitResolution}>Submit Resolution</button>
            </div>
        </div>
      )}

      {/* 2. PASSWORD MODAL (Updated) */}
      {isPasswordModalOpen && (
        <div className="modal-overlay">
            <div className="modal-content">
                <button className="close-modal-btn" onClick={() => setIsPasswordModalOpen(false)}><FiX /></button>
                <h3>Change Password</h3>
                <div className="form-group">
                    <label className="form-label">New Password</label>
                    <input type="password" class="form-input" onChange={(e) => setNewPassword({...newPassword, pass: e.target.value})} />
                </div>
                <div className="form-group">
                    <label className="form-label">Confirm</label>
                    <input type="password" class="form-input" onChange={(e) => setNewPassword({...newPassword, confirm: e.target.value})} />
                </div>
                <button className="login-btn" onClick={changePassword}>Update</button>
            </div>
        </div>
      )}

      {/* 3. HISTORY DETAIL MODAL (Updated) */}
      {isHistoryDetailOpen && selectedHistory && (
        <div className="modal-overlay">
            <div className="modal-content">
                <button className="close-modal-btn" onClick={() => setIsHistoryDetailOpen(false)}><FiX /></button>
                <h3 style={{marginBottom: "15px"}}>Grievance Report</h3>
                <table className="info-table">
                    <tbody>
                        <tr><td className="info-label">ID:</td><td className="info-value">#{selectedHistory.id}</td></tr>
                        <tr><td className="info-label">Status:</td><td className="info-value">{selectedHistory.status}</td></tr>
                        <tr><td className="info-label">Closed Date:</td><td className="info-value">{selectedHistory.resolved_at ? new Date(selectedHistory.resolved_at).toLocaleDateString() : '-'}</td></tr>
                    </tbody>
                </table>
                <div style={{marginTop: "15px", background: "#f0fdf4", padding: "10px", borderRadius: "8px", border: "1px solid #bbf7d0"}}>
                    <strong>Resolution Provided:</strong> <p>{selectedHistory.authority_reply}</p>
                </div>
                
                {/* Feedback Section (if student gave stars) */}
                {selectedHistory.feedback_stars > 0 && (
                    <div style={{marginTop: "10px", textAlign: 'center'}}>
                        <p style={{fontSize: '0.9rem', color:'#64748b'}}>Student Feedback:</p>
                        <div style={{color: '#f59e0b', fontSize:'1.2rem'}}>
                            {'★'.repeat(selectedHistory.feedback_stars)}
                            {'☆'.repeat(5 - selectedHistory.feedback_stars)}
                        </div>
                    </div>
                )}
            </div>
        </div>
      )}

      {/* --- PROFILE IMAGE POPUP MODAL (Authority) --- */}
      {isProfileImageOpen && fullProfile && (
        <div className="modal-overlay" onClick={() => setIsProfileImageOpen(false)}>
            <div 
                className="modal-content" 
                style={{
                    width: 'auto', 
                    maxWidth: '500px', 
                    padding: '10px', 
                    background: 'transparent', 
                    boxShadow: 'none', 
                    border: 'none',
                    display: 'flex',       
                    justifyContent: 'center',
                    position: 'relative'
                }}
            >
                {/* Close Button */}
                <button 
                    onClick={() => setIsProfileImageOpen(false)}
                    style={{
                        position: 'absolute', top: '20px', right: '20px', 
                        background: 'white', border: 'none', borderRadius: '50%', 
                        width: '35px', height: '35px', cursor: 'pointer', zIndex: 1000,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 2px 10px rgba(0,0,0,0.2)'
                    }}
                >
                    <FiX size={20} color="#333"/>
                </button>

                {/* Big Image from Database */}
                <img 
                    src={fullProfile.profile_pic 
                        ? `${API_BASE.replace('/api', '')}${fullProfile.profile_pic}` 
                        : logo // Fallback if no DB photo exists
                    } 
                    alt="Full Size"
                    style={{
                        maxWidth: '90vw',
                        maxHeight: '80vh',
                        borderRadius: '10px', 
                        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
                        border: '4px solid white',
                        objectFit: 'contain'
                    }}
                    onClick={(e) => e.stopPropagation()} 
                    onError={(e) => {
                        e.target.style.display = 'none'; // Hide if broken
                    }}
                />
            </div>
        </div>
      )}

    </>
  );
}

export default AuthorityDashboard;