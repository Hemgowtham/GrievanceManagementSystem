import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FiHome, FiUser, FiFileText, FiLogOut, FiMenu, FiX, FiUpload, 
  FiAlertTriangle, FiCheckCircle, FiEdit2, FiEye, FiMessageSquare, FiStar, 
  FiFilter, FiLock, FiMail, FiHash, FiCalendar 
} from 'react-icons/fi';
import './App.css';
import logo from './logo.png'; 

function StudentDashboard() {
  // ==========================================
  //  STATE MANAGEMENT
  // ==========================================
  
  // Navigation & Menu
  const [activeTab, setActiveTab] = useState('home'); 
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false); 
  const navigate = useNavigate();

  // Home Tab (Grievance Form)
  const [activeGrievanceTab, setActiveGrievanceTab] = useState('Hostel');
  const [academicYear, setAcademicYear] = useState(''); // Conditional logic for Academic
  const [sportsCategory, setSportsCategory] = useState(''); // Conditional logic for Sports

  // Profile Tab
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  // Grievance History Tab
  const [selectedGrievance, setSelectedGrievance] = useState(null); 
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [feedbackRating, setFeedbackRating] = useState(0);
  
  // Filters
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');

  // MOCK DATA (History)
  const dummyGrievances = [
    {
      id: 101,
      date: '2023-12-20',
      category: 'Mess - Food Quality',
      description: 'Found an insect in the dal served during lunch. This is the second time this week.',
      status: 'Resolved',
      feedbackGiven: false,
      reply: 'We have warned the catering contractor. Quality checks will be strict from tomorrow.'
    },
    {
      id: 102,
      date: '2023-12-18',
      category: 'Hostel - Electrical',
      description: 'Fan in Room TF-60 is making loud noise and rotating very slowly.',
      status: 'Pending',
      feedbackGiven: false,
      reply: null
    },
    {
      id: 103,
      date: '2023-11-05',
      category: 'Academic - Wifi',
      description: 'Wifi signal is very weak in CSE Lab 2. Unable to do project work.',
      status: 'Resolved',
      feedbackGiven: true,
      reply: 'Router has been replaced. Signal strength restored.'
    },
    {
      id: 104,
      date: '2023-10-10',
      category: 'Sports/Gym - Equipment',
      description: 'Treadmill 2 is broken.',
      status: 'Pending',
      feedbackGiven: false,
      reply: null
    }
  ];

  // ==========================================
  //  SECURITY & SYNC LOGIC
  // ==========================================
  useEffect(() => {
    // 1. Check if logged in
    const token = localStorage.getItem('student_token');
    if (!token) navigate('/'); 

    // 2. Listen for logout in other tabs
    const handleStorageChange = (e) => {
      if (e.key === 'student_token' && e.newValue === null) {
        navigate('/');
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('student_token');
    navigate('/'); 
  };

  const handleMenuClick = (tab) => {
    setActiveTab(tab);
    setIsMobileMenuOpen(false); 
  };

  // --- Modal Helpers ---
  const openDetailModal = (grievance) => {
    setSelectedGrievance(grievance);
    setIsDetailModalOpen(true);
  };

  const openFeedbackModal = (grievance) => {
    setSelectedGrievance(grievance);
    setFeedbackRating(0); 
    setIsFeedbackModalOpen(true);
  };


  // ==========================================
  //  1. SUB-COMPONENTS: GRIEVANCE FORMS
  // ==========================================

  const renderHostelForm = () => (
    <>
      <div>
        <div className="form-group">
          <label className="form-label">Select Hostel Block</label>
          <select className="form-select form-input">
            <option>Select Block</option>
            <option>I1 (Boys)</option><option>I2 (Boys)</option><option>I3 (Boys)</option>
            <option>K1 (Girls)</option><option>K2 (Girls)</option><option>K3 (Girls)</option>
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Room Number</label>
          <input type="text" className="form-input" placeholder="Ex: TF-60A" />
        </div>
        <div className="form-group">
          <label className="form-label">Category</label>
          <select className="form-select form-input">
            <option>Select Issue</option>
            <option>Wifi / Internet</option><option>Electrical</option><option>Plumbing</option>
            <option>Carpentry</option><option>Racks / Furniture</option><option>Cots / Beds</option>
          </select>
        </div>
      </div>
      <div>
        <div className="form-group">
          <label className="form-label">Describe the Issue</label>
          <textarea className="form-input" rows="5" placeholder="Describe details..."></textarea>
        </div>
        <div className="file-upload-box">
          <FiUpload size={24} />
          <p>Attach Photo (Optional)</p>
        </div>
      </div>
    </>
  );

  const renderMessForm = () => (
    <>
      <div>
        <div className="form-group">
          <label className="form-label">Select Dining Hall</label>
          <select className="form-select form-input">
            <option>Select DH</option>
            <option>DH 1</option><option>DH 2</option><option>DH 3</option><option>DH 4</option>
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Category</label>
          <select className="form-select form-input">
            <option>Select Issue</option>
            <option>Food Quality</option><option>Cleanliness</option><option>Menu Discrepancy</option>
            <option>Eggs & Fruits</option><option>Food Quantity</option>
          </select>
        </div>
      </div>
      <div>
        <div className="form-group">
          <label className="form-label">Describe the Issue</label>
          <textarea className="form-input" rows="5" placeholder="Describe details..."></textarea>
        </div>
        <div className="file-upload-box">
          <FiUpload size={24} />
          <p>Attach Photo (Optional)</p>
        </div>
      </div>
    </>
  );

  const renderAcademicForm = () => (
    <>
      <div>
        <div className="form-group">
          <label className="form-label">Select Year</label>
          <select className="form-select form-input" onChange={(e) => setAcademicYear(e.target.value)}>
            <option value="">Select Year</option>
            <option value="PUC">PUC 1 / PUC 2</option>
            <option value="ENG">Engineering (E1-E4)</option>
          </select>
        </div>
        {academicYear === 'ENG' && (
          <div className="form-group fade-in">
            <label className="form-label">Department</label>
            <select className="form-select form-input">
              <option>Select Branch</option>
              <option>CSE</option><option>ECE</option><option>MECH</option>
              <option>EEE</option><option>CIVIL</option><option>CHEM</option><option>MME</option>
            </select>
          </div>
        )}
        <div className="form-group">
          <label className="form-label">Category</label>
          <select className="form-select form-input">
            <option>Select Issue</option>
            <option>Lab Equipment</option><option>Wifi</option><option>Classroom Equipment</option>
            <option>Exams</option><option>ID Cards</option>
          </select>
        </div>
      </div>
      <div>
        <div className="form-group">
          <label className="form-label">Describe the Issue</label>
          <textarea className="form-input" rows="5" placeholder="Describe details..."></textarea>
        </div>
        <div className="file-upload-box"><FiUpload size={24} /><p>Attach Photo (Optional)</p></div>
      </div>
    </>
  );

  const renderHospitalForm = () => (
    <>
      <div>
        <div className="form-group">
          <label className="form-label">Category</label>
          <select className="form-select form-input">
            <option>Doctor Availability</option><option>Medicine Availability</option><option>Laboratory</option>
          </select>
        </div>
      </div>
      <div>
        <div className="form-group">
          <label className="form-label">Description</label>
          <textarea className="form-input" rows="5"></textarea>
        </div>
        <div className="file-upload-box"><FiUpload size={24} /><p>Attach Photo</p></div>
      </div>
    </>
  );

  const renderRaggingForm = () => (
    <>
      <div style={{gridColumn: "1 / -1"}}>
        <div className="ragging-alert-box">
          <FiAlertTriangle size={24} />
          <div><strong>Strict Action Warning:</strong> Ragging is a serious offense. Your identity is protected.</div>
        </div>
      </div>
      <div>
        <div className="form-group">
          <label className="form-label" style={{color: "#991b1b"}}>Student Names & Year</label>
          <textarea className="form-input" rows="3" style={{borderColor: "#fca5a5"}} placeholder="Names of seniors involved..."></textarea>
        </div>
      </div>
      <div>
        <div className="form-group">
          <label className="form-label" style={{color: "#991b1b"}}>Complaint to Director</label>
          <textarea className="form-input" rows="8" defaultValue="To The Director:&#13;&#10;&#13;&#10;" style={{borderColor: "#fca5a5"}}></textarea>
        </div>
      </div>
    </>
  );

  const renderSportsForm = () => (
    <>
      <div>
        <div className="form-group">
          <label className="form-label">Category</label>
          <select className="form-select form-input" onChange={(e) => setSportsCategory(e.target.value)}>
            <option value="">Select Type</option>
            <option value="sports">Sports</option>
            <option value="gym">Gym</option>
          </select>
        </div>
        {sportsCategory === 'sports' && (
           <div className="form-group fade-in">
             <label className="form-label">Select Sport</label>
             <select className="form-select form-input">
               <option>Cricket</option><option>Football</option><option>Badminton</option>
               <option>Volleyball</option><option>Basketball</option>
             </select>
           </div>
        )}
        {sportsCategory === 'gym' && (
           <div className="form-group fade-in">
             <label className="form-label">Gym Issue</label>
             <select className="form-select form-input">
               <option>Equipment Damage</option><option>Time Slots</option>
             </select>
           </div>
        )}
      </div>
      <div>
        <div className="form-group">
          <label className="form-label">Description</label>
          <textarea className="form-input" rows="5"></textarea>
        </div>
        <div className="file-upload-box"><FiUpload size={24} /><p>Attach Photo</p></div>
      </div>
    </>
  );

  const renderOthersForm = () => (
    <>
      <div>
        <div className="form-group">
          <label className="form-label">Category</label>
          <select className="form-select form-input">
            <option>Holidays</option><option>Uniforms</option><option>Laptops</option><option>Outings</option>
          </select>
        </div>
      </div>
      <div>
        <div className="form-group">
          <label className="form-label">Description</label>
          <textarea className="form-input" rows="5"></textarea>
        </div>
      </div>
    </>
  );


  // ==========================================
  //  2. MAIN TAB RENDERERS
  // ==========================================

  const renderHome = () => (
    <div className="fade-in">
      <div className="content-header">
        <h2>👋 Welcome, Student!</h2>
        <p>Select a category below to lodge your grievance.</p>
      </div>

      <div className="tabs-container">
        {['Hostel', 'Mess', 'Academic', 'Hospital', 'Ragging', 'Sports/Gym', 'Others'].map((tab) => (
          <div 
            key={tab}
            className={`tab-btn ${activeGrievanceTab === tab ? 'active' : ''} ${tab === 'Ragging' ? 'ragging-tab' : ''}`}
            onClick={() => setActiveGrievanceTab(tab)}
          >
            {tab}
          </div>
        ))}
      </div>

      <div className="card">
        <h3 style={{marginBottom: "20px", color: activeGrievanceTab === 'Ragging' ? '#dc2626' : '#334155'}}>
            {activeGrievanceTab} Grievance Form
        </h3>
        
        <form className="grievance-form">
          {activeGrievanceTab === 'Hostel' && renderHostelForm()}
          {activeGrievanceTab === 'Mess' && renderMessForm()}
          {activeGrievanceTab === 'Academic' && renderAcademicForm()}
          {activeGrievanceTab === 'Hospital' && renderHospitalForm()}
          {activeGrievanceTab === 'Ragging' && renderRaggingForm()}
          {activeGrievanceTab === 'Sports/Gym' && renderSportsForm()}
          {activeGrievanceTab === 'Others' && renderOthersForm()}

          <div style={{gridColumn: "1 / -1", marginTop: "10px"}}>
             <button type="button" className="login-btn" style={{
                 backgroundColor: activeGrievanceTab === 'Ragging' ? '#dc2626' : '#2563eb'
             }}>
                 Submit {activeGrievanceTab} Complaint
             </button>
          </div>
        </form>
      </div>
    </div>
  );

  const renderProfile = () => (
    <div className="fade-in">
      <div className="content-header">
        <h2>👤 My Profile</h2>
      </div>
      
      <div className="card" style={{ padding: "0", overflow: "hidden" }}>
        {/* Banner & Avatar */}
        <div className="profile-header-banner">
            <div className="profile-avatar-section">
                <FiUser />
            </div>
        </div>

        <div style={{ padding: "0 20px 20px", marginTop: "60px", display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "20px" }}>
            <div>
                <h2 style={{ color: "#1e293b", marginBottom: "5px" }}>Yasarapu Hem Gowtham</h2>
                <p style={{ color: "#64748b", fontWeight: "500" }}>Computer Science & Engineering</p>
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

        {/* Info Grid Tiles */}
        <div className="profile-details-grid">
            <div className="info-tile">
                <span className="tile-label"><FiHash style={{marginBottom: "-2px"}}/> Student ID</span>
                <span className="tile-value">N180000</span>
            </div>
            <div className="info-tile">
                <span className="tile-label"><FiCalendar style={{marginBottom: "-2px"}}/> Current Year</span>
                <span className="tile-value">E4 (Final Year)</span>
            </div>
            <div className="info-tile">
                <span className="tile-label"><FiMail style={{marginBottom: "-2px"}}/> College Email</span>
                <span className="tile-value">n180000@rguktn.ac.in</span>
            </div>
            <div className="info-tile">
                <span className="tile-label"><FiUser style={{marginBottom: "-2px"}}/> Gender</span>
                <span className="tile-value">Male</span>
            </div>
        </div>
      </div>
    </div>
  );

  const renderGrievances = () => {
    // FILTER LOGIC
    const filteredList = dummyGrievances.filter(item => {
        const matchCategory = filterCategory === 'All' || item.category.includes(filterCategory);
        const matchStatus = filterStatus === 'All' || item.status === filterStatus;
        return matchCategory && matchStatus;
    });

    return (
        <div className="fade-in">
        <div className="content-header">
            <h2>📂 My Grievance History</h2>
        </div>
        
        {/* Filter Bar */}
        <div className="filter-bar">
            <div className="filter-label"><FiFilter /> Filter By:</div>
            <select className="filter-select" value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
                <option value="All">All Categories</option>
                <option value="Hostel">Hostel</option><option value="Mess">Mess</option>
                <option value="Academic">Academic</option><option value="Hospital">Hospital</option>
                <option value="Sports">Sports</option><option value="Ragging">Ragging</option>
            </select>
            <select className="filter-select" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                <option value="All">All Statuses</option>
                <option value="Pending">Pending</option><option value="Resolved">Resolved</option>
            </select>
        </div>

        <div className="card" style={{ padding: "0" }}> 
            {filteredList.length === 0 ? (
                <div style={{ textAlign: "center", padding: "60px", color: "#94a3b8" }}>
                    <FiFileText size={40} style={{ marginBottom: "10px", opacity: 0.5 }} />
                    <p>No grievances match your filters.</p>
                </div>
            ) : (
                <div>
                    {filteredList.map((item) => (
                        <div className="grievance-item" key={item.id}>
                            <div className="grievance-info">
                                <h4>{item.category}</h4>
                                <div style={{display: "flex", alignItems: "center", flexWrap: "wrap", gap: "5px"}}>
                                    <span>📅 {item.date}</span>
                                    <span className={`status-badge ${item.status === 'Resolved' ? 'status-resolved' : 'status-pending'}`}>
                                        {item.status}
                                    </span>
                                </div>
                            </div>
                            <div style={{display: "flex"}}>
                                <button className="action-btn" onClick={() => openDetailModal(item)}>
                                    <FiEye style={{marginRight: "5px"}}/> View
                                </button>
                                {item.status === 'Resolved' && !item.feedbackGiven && (
                                    <button className="action-btn btn-feedback" onClick={() => openFeedbackModal(item)}>
                                        <FiMessageSquare style={{marginRight: "5px"}}/> Feedback
                                    </button>
                                )}
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
  //  3. MAIN RENDER
  // ==========================================

  return (
    <>
      <header className="app-header">
        <div className="hamburger-btn" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          {isMobileMenuOpen ? <FiX /> : <FiMenu />}
        </div>
        <img src={logo} alt="RGUKT Logo" className="header-logo" />
        <div className="header-text">
          <h1>Smart Grievance System</h1>
          <p>STUDENT DASHBOARD</p>
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
            <li className={`menu-item ${activeTab === 'grievances' ? 'active' : ''}`} onClick={() => handleMenuClick('grievances')}>
              <FiFileText size={20} /> My Grievances
            </li>
          </ul>
          <button className="logout-btn" onClick={handleLogout}>
            <FiLogOut size={20} /> Logout
          </button>
        </aside>

        <main className="main-content">
          {activeTab === 'home' && renderHome()}
          {activeTab === 'profile' && renderProfile()}
          {activeTab === 'grievances' && renderGrievances()}
        </main>
      </div>

      {/* --- MODALS --- */}
      
      {/* 1. PASSWORD CHANGE MODAL */}
      {isPasswordModalOpen && (
        <div className="modal-overlay">
            <div className="modal-content">
                <button className="close-modal-btn" onClick={() => setIsPasswordModalOpen(false)}><FiX /></button>
                <h3 style={{marginBottom: "20px", color: "#334155"}}>Change Password</h3>
                <div className="form-group">
                    <label className="form-label">Current Password</label>
                    <div className="input-wrapper"><FiLock className="input-icon"/><input type="password" class="form-input form-input-with-icon" placeholder="Old password" /></div>
                </div>
                <hr style={{margin: "20px 0", borderTop: "1px solid #e2e8f0"}}/>
                <div className="form-group">
                    <label className="form-label">New Password</label>
                    <div className="input-wrapper"><FiLock className="input-icon"/><input type="password" class="form-input form-input-with-icon" placeholder="New password" /></div>
                </div>
                <div className="form-group">
                    <label className="form-label">Confirm New Password</label>
                    <div className="input-wrapper"><FiLock className="input-icon"/><input type="password" class="form-input form-input-with-icon" placeholder="Confirm" /></div>
                </div>
                <div style={{display: "flex", gap: "10px", marginTop: "20px"}}>
                    <button className="login-btn" onClick={() => setIsPasswordModalOpen(false)}>Update Password</button>
                    <button className="login-btn" style={{backgroundColor: "white", color: "#64748b", border: "1px solid #cbd5e1"}} onClick={() => setIsPasswordModalOpen(false)}>Cancel</button>
                </div>
            </div>
        </div>
      )}

      {/* 2. DETAIL MODAL */}
      {isDetailModalOpen && selectedGrievance && (
        <div className="modal-overlay">
            <div className="modal-content">
                <button className="close-modal-btn" onClick={() => setIsDetailModalOpen(false)}><FiX /></button>
                <h3 style={{marginBottom: "20px", color: "#334155"}}>Complaint #{selectedGrievance.id}</h3>
                <table className="info-table">
                    <tbody>
                        <tr><td className="info-label">Date:</td><td className="info-value">{selectedGrievance.date}</td></tr>
                        <tr><td className="info-label">Category:</td><td className="info-value">{selectedGrievance.category}</td></tr>
                        <tr><td className="info-label">Status:</td><td><span className={`status-badge ${selectedGrievance.status === 'Resolved' ? 'status-resolved' : 'status-pending'}`}>{selectedGrievance.status}</span></td></tr>
                    </tbody>
                </table>
                <div style={{marginTop: "20px"}}>
                    <h5 style={{color: "#64748b", marginBottom: "8px"}}>Description:</h5>
                    <p style={{background: "#f8fafc", padding: "15px", borderRadius: "8px", fontSize: "0.95rem"}}>{selectedGrievance.description}</p>
                </div>
                {selectedGrievance.reply && (
                    <div style={{marginTop: "20px"}}>
                        <h5 style={{color: "#10b981", marginBottom: "8px"}}>Authority Reply:</h5>
                        <p style={{background: "#f0fdf4", padding: "15px", borderRadius: "8px", fontSize: "0.95rem", border: "1px solid #bbf7d0"}}>{selectedGrievance.reply}</p>
                    </div>
                )}
            </div>
        </div>
      )}

      {/* 3. FEEDBACK MODAL */}
      {isFeedbackModalOpen && selectedGrievance && (
        <div className="modal-overlay">
            <div className="modal-content">
                <button className="close-modal-btn" onClick={() => setIsFeedbackModalOpen(false)}><FiX /></button>
                <h3 style={{marginBottom: "10px", textAlign: "center"}}>Rate Resolution</h3>
                <p style={{textAlign: "center", color: "#64748b", marginBottom: "20px"}}>How satisfied are you with the resolution?</p>
                <div style={{display: "flex", justifyContent: "center", marginBottom: "20px"}}>
                    {[1, 2, 3, 4, 5].map((star) => (
                        <FiStar key={star} className={`star-rating ${star <= feedbackRating ? 'active' : ''}`} onClick={() => setFeedbackRating(star)} fill={star <= feedbackRating ? "#f59e0b" : "none"} />
                    ))}
                </div>
                <button className="login-btn" onClick={() => setIsFeedbackModalOpen(false)}>Submit Feedback</button>
            </div>
        </div>
      )}
    </>
  );
}

export default StudentDashboard;