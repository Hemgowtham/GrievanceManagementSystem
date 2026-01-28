import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios'; 
import { 
  FiHome, FiUser, FiFileText, FiLogOut, FiMenu, FiX, FiUpload, 
  FiAlertTriangle, FiEye, FiMessageSquare, FiStar, 
  FiFilter, FiLock, FiMail, FiHash, FiCalendar, FiChevronDown,
  FiCoffee, FiBook, FiActivity, FiLayers, FiAlertCircle, FiTrash2, FiPrinter
} from 'react-icons/fi';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import './App.css';
import logo from './logo.png'; 
import userAvatar from './logo.png'; 

// API BASE URL
const API_BASE = 'https://grievancemanagementsystemrguktnuzvid.onrender.com';

function StudentDashboard() {
  // ==========================================
  //  STATE MANAGEMENT
  // ==========================================
  const [userInfo, setUserInfo] = useState(null); 
  const [fullProfile, setFullProfile] = useState(null); 
  const [realGrievances, setRealGrievances] = useState([]); 

  const [isLoading, setIsLoading] = useState(true);
  
  const [activeTab, setActiveTab] = useState('home'); 
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false); 
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false); 
  const navigate = useNavigate();
  const dropdownRef = useRef(null); 

  const [activeGrievanceTab, setActiveGrievanceTab] = useState('Hostel');
  const [academicYear, setAcademicYear] = useState(''); 
  const [sportsCategory, setSportsCategory] = useState(''); 

  // Password Modal State
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [passwordData, setPasswordData] = useState({ current: '', new: '', confirm: '' });

  const [isProfileImageOpen, setIsProfileImageOpen] = useState(false);

  // Detail & Feedback Modal States
  const [selectedGrievance, setSelectedGrievance] = useState(null); 
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [feedbackRating, setFeedbackRating] = useState(0);
  
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterDate, setFilterDate] = useState('');

  const [formInputs, setFormInputs] = useState({
    subLocation: '', specificLocation: '', category: '', description: '', file: null
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ==========================================
  //  HELPER FUNCTIONS (MOVED TO TOP TO FIX ERROR)
  // ==========================================
  
  const openDetailModal = (grievance) => {
    setSelectedGrievance(grievance);
    setIsDetailModalOpen(true);
  };

  const openFeedbackModal = (grievance) => {
    setSelectedGrievance(grievance);
    setFeedbackRating(0); 
    setIsFeedbackModalOpen(true);
  };

  const deleteGrievance = async (id, createdAt) => {
      // Client-side check for better UX
      const diffInMinutes = (new Date() - new Date(createdAt)) / 1000 / 60;
      if (diffInMinutes > 5) {
          alert("Time limit exceeded! You can only delete within 5 minutes.");
          fetchUserGrievances(userInfo.username); // Refresh to remove the button
          return;
      }

      if(!window.confirm("Are you sure you want to delete this complaint?")) return;

      try {
          const response = await axios.delete(`${API_BASE}/grievances/?id=${id}&student_id=${userInfo.username}`);
          if (response.data.status === 'success') {
              alert("Complaint deleted successfully.");
              fetchUserGrievances(userInfo.username); // Refresh list
          }
      } catch (error) {
          alert(error.response?.data?.message || "Error deleting complaint.");
      }
  };

  // ==========================================
  //  INITIALIZATION
  // ==========================================
  useEffect(() => {
    const token = localStorage.getItem('student_token');
    if (!token) { navigate('/'); return; }

    const storedUser = localStorage.getItem('student_user'); 
    if (storedUser) {
        const parsed = JSON.parse(storedUser);
        setUserInfo(parsed);
        fetchUserGrievances(parsed.username);
        fetchFullProfile(parsed.username); 
    }

    function handleClickOutside(event) {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
            setIsProfileDropdownOpen(false);
        }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
        document.removeEventListener("mousedown", handleClickOutside);
        window.removeEventListener('storage', () => {});
    };
  }, [navigate]);

  const fetchFullProfile = async (studentId) => {
    try {
        const response = await axios.get(`${API_BASE}/students/`);
        const myProfile = response.data.find(s => s.student_id === studentId);
        if (myProfile) {
            setFullProfile(myProfile);
        }
    } catch (error) {
        console.error("Error fetching profile details", error);
    }
  };

  const fetchUserGrievances = async (studentId) => {
    setIsLoading(true); // 1. Start Loading
    try {
        const response = await axios.get(`${API_BASE}/grievances/?role=student&user_id=${studentId}`);
        setRealGrievances(response.data);
    } catch (error) { 
        console.error("Error fetching grievances", error); 
    } finally {
        setIsLoading(false); // 2. Stop Loading (whether success or error)
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('student_token');
    localStorage.removeItem('student_user');
    navigate('/'); 
  };

  const handleMenuClick = (tab) => {
    setActiveTab(tab);
    setIsMobileMenuOpen(false); 
  };

  // ==========================================
  //  PASSWORD UPDATE LOGIC
  // ==========================================
  const handlePasswordUpdate = async () => {
      if (passwordData.new !== passwordData.confirm) {
          alert("New passwords do not match."); return;
      }
      if (passwordData.new.length < 4) {
          alert("Password is too short."); return;
      }

      try {
          const response = await axios.put(`${API_BASE}/students/`, {
              id: userInfo.username,
              password: passwordData.new
          });

          if (response.data.status === 'success') {
              alert("Password Updated Successfully! Please login again.");
              handleLogout();
          }
      } catch (error) {
          alert("Error updating password. Please try again.");
          console.error(error);
      }
  };

  // ==========================================
  //  FORM HANDLERS
  // ==========================================
  const handleInput = (e) => {
      const { name, value } = e.target;
      setFormInputs(prev => ({...prev, [name]: value}));
  };

  const handleFile = (e) => {
      if (e.target.files[0]) {
          setFormInputs(prev => ({...prev, file: e.target.files[0]}));
      }
  };

  const submitGrievance = async () => {
      if (!userInfo) return;

      // --- 1. VALIDATION FIX ---
      // We skip the 'category' check if it is a Ragging case because Ragging has no sub-category dropdown
      if (activeGrievanceTab !== 'Ragging' && !formInputs.category) {
          alert("Please select a specific Issue/Category.");
          return;
      }
      
      // Basic Description Check
      if (!formInputs.description) {
          alert("Please provide a description of the incident.");
          return;
      }

      setIsSubmitting(true);
      const formData = new FormData();
      formData.append('student_id', userInfo.username);

      // --- 2. DATA FORMATTING ---
      let finalCategory = activeGrievanceTab; // e.g., "Ragging"
      let finalDescription = formInputs.description;

      if (activeGrievanceTab === 'Ragging') {
          // RAGGING LOGIC:
          // Since Ragging stores "Student Names" in specificLocation, we append it to the description
          // so the Director sees it clearly in the report.
          if (formInputs.specificLocation) {
              finalDescription = `[Seniors/Students Involved: ${formInputs.specificLocation}]\n\n${finalDescription}`;
          }
      } else {
          // STANDARD LOGIC (Hostel, Mess, etc.):
          // Build the category string: "Hostel - Block 1 - WiFi"
          if (formInputs.subLocation) finalCategory += ` - ${formInputs.subLocation}`;
          if (formInputs.category) finalCategory += ` - ${formInputs.category}`;
          
          // Append Room/Location to description
          if (formInputs.specificLocation) {
              finalDescription = `[Location: ${formInputs.specificLocation}]\n${finalDescription}`;
          }
      }

      formData.append('category', finalCategory);
      formData.append('description', finalDescription);
      
      if (formInputs.file) {
          formData.append('image', formInputs.file);
      }

      try {
          const res = await axios.post(`${API_BASE}/grievances/`, formData, { 
              headers: { 'Content-Type': 'multipart/form-data' } 
          });

          if (res.data.status === 'success') {
              alert("Grievance Submitted Successfully!");
              // Reset all inputs
              setFormInputs({ subLocation: '', specificLocation: '', category: '', description: '', file: null });
              fetchUserGrievances(userInfo.username);
              setActiveTab('grievances');
          }
      } catch (error) { 
          console.error(error);
          alert("Failed to submit grievance. Please try again."); 
      } finally { 
          setIsSubmitting(false); 
      }
  };

  const submitFeedback = async () => {
    if (!selectedGrievance) return;
    try {
        await axios.patch(`${API_BASE}/grievances/`, {
            id: selectedGrievance.id,
            feedback_stars: feedbackRating
        });
        alert("Feedback Submitted!");
        setIsFeedbackModalOpen(false);
        fetchUserGrievances(userInfo.username);
    } catch (e) { alert("Error submitting feedback"); }
  };


  // --- PDF GENERATOR (Dual Photos) ---
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
            ['Student ID', userInfo.username],
            ['Category', item.category],
            ['Reported Date', new Date(item.created_at).toLocaleString()],
            ['Issue', item.description],
        ],
        theme: 'striped',
        headStyles: { fillColor: [37, 99, 235] }
    });

    let currentY = doc.lastAutoTable.finalY + 10;

    // --- PHOTO SECTION (SIDE BY SIDE) ---
    const issueImg = item.image ? `http://127.0.0.1:8000${item.image}` : null;
    const resolvedImg = item.resolved_image ? `http://127.0.0.1:8000${item.resolved_image}` : null;

    if (issueImg || resolvedImg) {
        doc.setFontSize(12); doc.text("Attached Photos:", 14, currentY);
        currentY += 5;

        // Image Dimensions: W=80, H=60
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
            currentY += 75; // Advance Y
        } catch (e) { }
    }

    doc.setFontSize(14); doc.text("Resolution Details", 14, currentY + 10);
    
    autoTable(doc, {
        startY: currentY + 15,
        head: [['Field', 'Details']],
        body: [
            ['Status', item.status],
            ['Solved By', item.current_handler_designation || 'Authority'],
            ['Solved Date', item.resolved_at ? new Date(item.resolved_at).toLocaleString() : 'Pending'],
            ['Reply', item.authority_reply || 'No reply yet'],
            ['Student Feedback', item.feedback_stars ? `${item.feedback_stars} Stars` : 'Not Rated']
        ],
        theme: 'grid',
        headStyles: { fillColor: [5, 150, 105] }
    });

    doc.autoPrint();
    window.open(doc.output('bloburl'), '_blank');
  };

  // ==========================================
  //  1. SUB-COMPONENTS: FORMS
  // ==========================================

  const renderHostelForm = () => (
    <>
      <div>
        <div className="form-group">
          <label className="form-label">Select Hostel Block</label>
          <select className="form-select form-input" name="subLocation" onChange={handleInput}>
            <option value="">Select Block</option>
            <option>I1 (Boys)</option><option>I2 (Boys)</option><option>I3 (Boys)</option>
            <option>K1 (Girls)</option><option>K2 (Girls)</option><option>K3 (Girls)</option>
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Room Number</label>
          <input type="text" className="form-input" name="specificLocation" placeholder="Ex: TF-60A" onChange={handleInput} />
        </div>
        <div className="form-group">
          <label className="form-label">Category</label>
          <select className="form-select form-input" name="category" onChange={handleInput}>
            <option value="">Select Issue</option>
            <option>Wifi / Internet</option><option>Electrical</option><option>Plumbing</option>
            <option>Carpentry</option><option>Racks / Furniture</option><option>Cots / Beds</option>
          </select>
        </div>
      </div>
      <div>
        <div className="form-group">
          <label className="form-label">Describe the Issue</label>
          <textarea className="form-input" rows="5" name="description" placeholder="Describe details..." onChange={handleInput}></textarea>
        </div>
        <div className="file-upload-box">
            <label style={{cursor: 'pointer', textAlign: 'center', width: '100%'}}>
                <input type="file" style={{display: 'none'}} onChange={handleFile} />
                <FiUpload size={24} />
                <p>{formInputs.file ? formInputs.file.name : "Attach Photo (Optional)"}</p>
            </label>
        </div>
      </div>
    </>
  );

  const renderMessForm = () => (
    <>
      <div>
        <div className="form-group">
          <label className="form-label">Select Dining Hall</label>
          <select className="form-select form-input" name="subLocation" onChange={handleInput}>
            <option value="">Select DH</option>
            <option>DH 1</option><option>DH 2</option><option>DH 3</option><option>DH 4</option>
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Category</label>
          <select className="form-select form-input" name="category" onChange={handleInput}>
            <option value="">Select Issue</option>
            <option>Food Quality</option><option>Cleanliness</option><option>Menu Discrepancy</option>
            <option>Eggs & Fruits</option><option>Food Quantity</option>
          </select>
        </div>
      </div>
      <div>
        <div className="form-group">
          <label className="form-label">Describe the Issue</label>
          <textarea className="form-input" rows="5" name="description" placeholder="Describe details..." onChange={handleInput}></textarea>
        </div>
        <div className="file-upload-box">
            <label style={{cursor: 'pointer', textAlign: 'center', width: '100%'}}>
                <input type="file" style={{display: 'none'}} onChange={handleFile} />
                <FiUpload size={24} />
                <p>{formInputs.file ? formInputs.file.name : "Attach Photo (Optional)"}</p>
            </label>
        </div>
      </div>
    </>
  );

  const renderAcademicForm = () => (
    <>
      <div>
        <div className="form-group">
          <label className="form-label">Select Year</label>
          <select className="form-select form-input" name="subLocation" onChange={(e) => {setAcademicYear(e.target.value); handleInput(e);}}>
            <option value="">Select Year</option>
            <option value="PUC">PUC 1 / PUC 2</option>
            <option value="ENG">Engineering (E1-E4)</option>
          </select>
        </div>
        {academicYear === 'ENG' && (
          <div className="form-group fade-in">
            <label className="form-label">Department</label>
            <select className="form-select form-input" name="specificLocation" onChange={handleInput}>
              <option value="">Select Branch</option>
              <option>CSE</option><option>ECE</option><option>MECH</option>
              <option>EEE</option><option>CIVIL</option><option>CHEM</option><option>MME</option>
            </select>
          </div>
        )}
        <div className="form-group">
          <label className="form-label">Category</label>
          <select className="form-select form-input" name="category" onChange={handleInput}>
            <option value="">Select Issue</option>
            <option>Lab Equipment</option><option>Wifi</option><option>Classroom Equipment</option>
            <option>Exams</option><option>ID Cards</option>
          </select>
        </div>
      </div>
      <div>
        <div className="form-group">
          <label className="form-label">Describe the Issue</label>
          <textarea className="form-input" rows="5" name="description" placeholder="Describe details..." onChange={handleInput}></textarea>
        </div>
        <div className="file-upload-box">
            <label style={{cursor: 'pointer', textAlign: 'center', width: '100%'}}>
                <input type="file" style={{display: 'none'}} onChange={handleFile} />
                <FiUpload size={24} />
                <p>{formInputs.file ? formInputs.file.name : "Attach Photo (Optional)"}</p>
            </label>
        </div>
      </div>
    </>
  );

  const renderHospitalForm = () => (
    <>
      <div>
        <div className="form-group">
          <label className="form-label">Category</label>
          <select className="form-select form-input" name="category" onChange={handleInput}>
            <option value="">Select Issue</option>
            <option>Doctor Availability</option><option>Medicine Availability</option><option>Laboratory</option>
          </select>
        </div>
      </div>
      <div>
        <div className="form-group">
          <label className="form-label">Description</label>
          <textarea className="form-input" rows="5" name="description" onChange={handleInput}></textarea>
        </div>
        <div className="file-upload-box">
            <label style={{cursor: 'pointer', textAlign: 'center', width: '100%'}}>
                <input type="file" style={{display: 'none'}} onChange={handleFile} />
                <FiUpload size={24} />
                <p>{formInputs.file ? formInputs.file.name : "Attach Photo (Optional)"}</p>
            </label>
        </div>
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
          <textarea className="form-input" rows="3" name="specificLocation" style={{borderColor: "#fca5a5"}} placeholder="Names of seniors involved..." onChange={handleInput}></textarea>
        </div>
      </div>
      <div>
        <div className="form-group">
          <label className="form-label" style={{color: "#991b1b"}}>Complaint to Director</label>
          <textarea className="form-input" rows="8" name="description" placeholder="Describe the incident..." style={{borderColor: "#fca5a5"}} onChange={handleInput}></textarea>
        </div>
      </div>
    </>
  );

  const renderSportsForm = () => (
    <>
      <div>
        <div className="form-group">
          <label className="form-label">Category</label>
          <select className="form-select form-input" name="subLocation" onChange={(e) => {setSportsCategory(e.target.value); handleInput(e);}}>
            <option value="">Select Type</option>
            <option value="sports">Sports</option>
            <option value="gym">Gym</option>
          </select>
        </div>
        {sportsCategory === 'sports' && (
           <div className="form-group fade-in">
             <label className="form-label">Select Sport</label>
             <select className="form-select form-input" name="category" onChange={handleInput}>
               <option>Cricket</option><option>Football</option><option>Badminton</option>
               <option>Volleyball</option><option>Basketball</option>
             </select>
           </div>
        )}
        {sportsCategory === 'gym' && (
           <div className="form-group fade-in">
             <label className="form-label">Gym Issue</label>
             <select className="form-select form-input" name="category" onChange={handleInput}>
               <option>Equipment Damage</option><option>Time Slots</option>
             </select>
           </div>
        )}
      </div>
      <div>
        <div className="form-group">
          <label className="form-label">Description</label>
          <textarea className="form-input" rows="5" name="description" onChange={handleInput}></textarea>
        </div>
        <div className="file-upload-box">
            <label style={{cursor: 'pointer', textAlign: 'center', width: '100%'}}>
                <input type="file" style={{display: 'none'}} onChange={handleFile} />
                <FiUpload size={24} />
                <p>{formInputs.file ? formInputs.file.name : "Attach Photo (Optional)"}</p>
            </label>
        </div>
      </div>
    </>
  );

  const renderOthersForm = () => (
    <>
      <div>
        <div className="form-group">
          <label className="form-label">Category</label>
          <select className="form-select form-input" name="category" onChange={handleInput}>
            <option>Holidays</option><option>Uniforms</option><option>Laptops</option><option>Outings</option><option>Library</option>
          </select>
        </div>
      </div>
      <div>
        <div className="form-group">
          <label className="form-label">Description</label>
          <textarea className="form-input" rows="5" name="description" onChange={handleInput}></textarea>
        </div>
      </div>
    </>
  );

  // ==========================================
  //  2. HOME RENDERER
  // ==========================================
  const renderHome = () => (
    <div className="fade-in">
      <div className="content-header">
        <h2>Welcome, {userInfo ? userInfo.username : 'Student'}</h2>
        <br></br>
      </div>

      <div className="category-grid">
        {['Hostel', 'Mess', 'Academic', 'Hospital', 'Sports/Gym', 'Ragging', 'Others'].map(cat => (
            <div 
                key={cat} 
                className={`category-card ${activeGrievanceTab === cat ? (cat === 'Ragging' ? 'ragging-active' : 'active') : ''}`} 
                onClick={() => {setActiveGrievanceTab(cat); setFormInputs({ subLocation: '', specificLocation: '', category: '', description: '', file: null });}}
            >
                {cat === 'Hostel' && <FiHome size={24} />}
                {cat === 'Mess' && <FiCoffee size={24} />}
                {cat === 'Academic' && <FiBook size={24} />}
                {cat === 'Hospital' && <FiActivity size={24} />}
                {cat === 'Sports/Gym' && <FiLayers size={24} />}
                {cat === 'Ragging' && <FiAlertTriangle size={24} />}
                {cat === 'Others' && <FiAlertCircle size={24} />}
                <span>{cat}</span>
            </div>
        ))}
      </div>

      <div key={activeGrievanceTab} className="animate-content card">
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
             <button 
                type="button" 
                className="login-btn" 
                onClick={submitGrievance}
                disabled={isSubmitting}
                style={{
                    backgroundColor: activeGrievanceTab === 'Ragging' ? '#dc2626' : '#2563eb',
                    opacity: isSubmitting ? 0.7 : 1
                }}
             >
                 {isSubmitting ? 'Submitting...' : `Submit ${activeGrievanceTab} Complaint`}
             </button>
          </div>
        </form>
      </div>
    </div>
  );

  // ==========================================
  //  3. PROFILE RENDERER
  // ==========================================
  const renderProfile = () => (
    <div className="fade-in">
      <div className="content-header">
        <h2>My Profile</h2>
      </div>
      
      <div className="card" style={{ padding: "0", overflow: "hidden" }}>
        <div className="profile-header-banner">
            <div 
                className="profile-avatar-section" 
                style={{overflow:'hidden', cursor: 'pointer'}} // Added cursor pointer
                onClick={() => setIsProfileImageOpen(true)}    // Added Click Handler
                title="Click to expand"
            >
                {userInfo ? (
                    <img 
                        src={`https://intranet.rguktn.ac.in/SMS/usrphotos/user/${userInfo.username}.jpg`} 
                        alt="Profile"
                        style={{width:'100%', height:'100%', objectFit:'cover'}}
                        onError={(e) => {e.target.style.display='none'; e.target.nextSibling.style.display='flex'}} 
                    />
                ) : null}
                <div style={{display: userInfo ? 'none' : 'flex', width:'100%', height:'100%', alignItems:'center', justifyContent:'center'}}>
                    <FiUser />
                </div>
            </div>
        </div>

        <div style={{ padding: "0 20px 20px", marginTop: "60px", display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "20px" }}>
            <div>
                <h2 style={{ color: "#1e293b", marginBottom: "5px" }}>{userInfo ? userInfo.name : 'Student Name'}</h2>
                <p style={{ color: "#64748b", fontWeight: "500" }}>
                   {fullProfile && fullProfile.branch ? fullProfile.branch : 'Pre University Course'} 
                </p>
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

        <div className="profile-details-grid">
            <div className="info-tile">
                <span className="tile-label"><FiHash style={{marginBottom: "-2px"}}/> Student ID</span>
                <span className="tile-value">{userInfo ? userInfo.username : '---'}</span>
            </div>
            <div className="info-tile">
                <span className="tile-label"><FiCalendar style={{marginBottom: "-2px"}}/> Academic Year</span>
                <span className="tile-value">{fullProfile ? fullProfile.year : 'Loading...'}</span>
            </div>
            <div className="info-tile">
                <span className="tile-label"><FiMail style={{marginBottom: "-2px"}}/> College Email</span>
                <span className="tile-value">{userInfo ? `${userInfo.username.toLowerCase()}@rguktn.ac.in` : '---'}</span>
            </div>
            <div className="info-tile">
                <span className="tile-label"><FiUser style={{marginBottom: "-2px"}}/> Gender</span>
                <span className="tile-value">{fullProfile ? fullProfile.gender : 'Loading...'}</span>
            </div>
        </div>
      </div>
    </div>
  );

  const renderGrievances = () => {
    // --- UPDATED FILTER LOGIC ---
    const filteredList = realGrievances.filter(item => {
        const matchCategory = filterCategory === 'All' || item.category.includes(filterCategory);
        const matchStatus = filterStatus === 'All' || item.status === filterStatus;
        
        let matchDate = true;
        if (filterDate) {
             const gDate = new Date(item.created_at).toISOString().split('T')[0];
             matchDate = gDate === filterDate;
        }

        return matchCategory && matchStatus && matchDate;
    });

    return (
        <div className="fade-in">
            <div className="content-header"><h2>My Grievance History</h2></div>
            
            {/* Filter Bar */}
            <div className="filter-bar" style={{flexWrap: 'wrap', gap: '10px'}}>
               {/* ... (Keep your existing filter inputs here) ... */}
               <select className="filter-select" value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}><option value="All">All Categories</option><option value="Hostel">Hostel</option><option value="Mess">Mess</option><option value="Academic">Academic</option><option value="Hospital">Hospital</option><option value="Sports">Sports</option><option value="Ragging">Ragging</option></select>
               <select className="filter-select" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}><option value="All">All Statuses</option><option value="Pending">Pending</option><option value="Resolved">Resolved</option></select>
               <input type="date" className="form-input" style={{width: 'auto', padding: '8px'}} value={filterDate} onChange={(e) => setFilterDate(e.target.value)}/>
            </div>

            <div className="card" style={{ padding: "0" }}> 
                {/* --- LOADING LOGIC START --- */}
                {isLoading ? (
                    <div style={{textAlign: "center", padding: "50px 20px"}}>
                        <div className="spinner"></div>
                        <p style={{marginTop: "15px", color: "#64748b", fontWeight: "500"}}>Loading records...</p>
                    </div>
                ) : filteredList.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "60px", color: "#94a3b8" }}>
                        <FiFileText size={40} style={{ marginBottom: "10px", opacity: 0.5 }} />
                        <p>No grievances match your filters.</p>
                    </div>
                ) : (
                    <div>
                        {filteredList.map((item) => {
                             // ... (Keep your existing list mapping code exactly as is) ...
                             const timeDiff = (new Date() - new Date(item.created_at)) / 60000;
                             const isDeletable = timeDiff < 5 && item.status === 'Pending';
                             return (
                                <div className="grievance-item" key={item.id}>
                                    {/* ... existing item content ... */}
                                    <div className="grievance-info">
                                        <h4>{item.category}</h4>
                                        <div style={{display: "flex", alignItems: "center", flexWrap: "wrap", gap: "5px"}}>
                                            <span>📅 {new Date(item.created_at).toLocaleDateString()}</span>
                                            <span className={`status-badge ${item.status === 'Resolved' ? 'status-resolved' : 'status-pending'}`}>{item.status}</span>
                                        </div>
                                    </div>
                                    <div style={{display: "flex", gap: "5px"}}>
                                        {(item.status === 'Resolved' || item.status === 'Escalated') && (
                                            <button className="action-btn" onClick={() => generatePDF(item)} style={{backgroundColor: "#e0f2fe", color: "#0284c7", border: "1px solid #bae6fd"}} title="Print Report"><FiPrinter /></button>
                                        )}
                                        <button className="action-btn" onClick={() => openDetailModal(item)}><FiEye style={{marginRight: "5px"}}/> View</button>
                                        {isDeletable && (
                                            <button className="action-btn" onClick={() => deleteGrievance(item.id, item.created_at)} style={{backgroundColor: "#fee2e2", color: "#dc2626", border: "1px solid #fecaca"}} title="Delete"><FiTrash2 /></button>
                                        )}
                                        {item.status === 'Resolved' && !item.feedback_stars && (
                                            <button className="action-btn btn-feedback" onClick={() => openFeedbackModal(item)}><FiMessageSquare style={{marginRight: "5px"}}/> Feedback</button>
                                        )}
                                    </div>
                                </div>
                             );
                        })}
                    </div>
                )}
                {/* --- LOADING LOGIC END --- */}
            </div>
        </div>
    );
  };

  // ==========================================
  //  4. MAIN LAYOUT
  // ==========================================
  return (
    <>
      <header className="app-header">
        <div className="hamburger-btn" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          {isMobileMenuOpen ? <FiX /> : <FiMenu />}
        </div>
        <img src={logo} alt="RGUKT Logo" className="header-logo" />
        <div className="header-text">
          <h1>Smart Grievance Management System</h1>
          <p>STUDENT DASHBOARD</p>
        </div>
        
        <div className="header-right" ref={dropdownRef}>
            <div className="profile-trigger" onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}>
                <span className="header-user-name">{userInfo ? userInfo.name : 'Student'}</span>
                
                <div style={{width: '35px', height: '35px', borderRadius: '50%', overflow: 'hidden', border: '2px solid white'}}>
                    {userInfo ? (
                        <img 
                            src={`https://intranet.rguktn.ac.in/SMS/usrphotos/user/${userInfo.username}.jpg`}
                            alt="Profile" 
                            style={{width: '100%', height: '100%', objectFit: 'cover'}}
                            onError={(e) => {e.target.src = userAvatar}} 
                        />
                    ) : <img src={userAvatar} alt="Default" style={{width: '100%'}} />}
                </div>

                <FiChevronDown size={16} color="#64748b"/>
            </div>

            {isProfileDropdownOpen && (
                <div className="profile-dropdown-menu">
                    <button className="dropdown-item" onClick={() => {setActiveTab('profile'); setIsProfileDropdownOpen(false);}}>
                        <FiUser /> My Profile
                    </button>
                    <button className="dropdown-item" onClick={() => {setActiveTab('grievances'); setIsProfileDropdownOpen(false);}}>
                        <FiFileText /> My History
                    </button>
                    <button className="dropdown-item logout-option" onClick={handleLogout}>
                        <FiLogOut /> Logout
                    </button>
                </div>
            )}
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

      {/* --- PASSWORD CHANGE MODAL --- */}
      {isPasswordModalOpen && (
        <div className="modal-overlay">
            <div className="modal-content">
                <button className="close-modal-btn" onClick={() => setIsPasswordModalOpen(false)}><FiX /></button>
                <h3 style={{marginBottom: "20px", color: "#334155"}}>Change Password</h3>
                <div className="form-group">
                    <label className="form-label">New Password</label>
                    <div className="input-wrapper"><FiLock className="input-icon"/><input type="password" class="form-input form-input-with-icon" placeholder="New password" onChange={(e) => setPasswordData({...passwordData, new: e.target.value})} /></div>
                </div>
                <div className="form-group">
                    <label className="form-label">Confirm New Password</label>
                    <div className="input-wrapper"><FiLock className="input-icon"/><input type="password" class="form-input form-input-with-icon" placeholder="Confirm" onChange={(e) => setPasswordData({...passwordData, confirm: e.target.value})} /></div>
                </div>
                <div style={{display: "flex", gap: "10px", marginTop: "20px"}}>
                    <button className="login-btn" onClick={handlePasswordUpdate}>Update Password</button>
                    <button className="login-btn" style={{backgroundColor: "white", color: "#64748b", border: "1px solid #cbd5e1"}} onClick={() => setIsPasswordModalOpen(false)}>Cancel</button>
                </div>
            </div>
        </div>
      )}

      {/* Detail Modal */}
      {isDetailModalOpen && selectedGrievance && (
        <div className="modal-overlay">
            <div className="modal-content">
                <button className="close-modal-btn" onClick={() => setIsDetailModalOpen(false)}><FiX /></button>
                <h3 style={{marginBottom: "20px", color: "#334155"}}>Complaint #{selectedGrievance.id}</h3>
                <table className="info-table">
                    <tbody>
                        <tr><td className="info-label">Date:</td><td className="info-value">{new Date(selectedGrievance.created_at).toLocaleDateString()}</td></tr>
                        <tr><td className="info-label">Category:</td><td className="info-value">{selectedGrievance.category}</td></tr>
                        <tr><td className="info-label">Status:</td><td><span className={`status-badge ${selectedGrievance.status === 'Resolved' ? 'status-resolved' : 'status-pending'}`}>{selectedGrievance.status}</span></td></tr>
                    </tbody>
                </table>
                <div style={{marginTop: "20px"}}>
                    <h5 style={{color: "#64748b", marginBottom: "8px"}}>Description:</h5>
                    <p style={{background: "#f8fafc", padding: "15px", borderRadius: "8px", fontSize: "0.95rem"}}>{selectedGrievance.description}</p>
                </div>
                {selectedGrievance.authority_reply && (
                    <div style={{marginTop: "20px"}}>
                        <h5 style={{color: "#10b981", marginBottom: "8px"}}>Authority Reply:</h5>
                        <p style={{background: "#f0fdf4", padding: "15px", borderRadius: "8px", fontSize: "0.95rem", border: "1px solid #bbf7d0"}}>{selectedGrievance.authority_reply}</p>
                    </div>
                )}
            </div>
        </div>
      )}

      {/* Feedback Modal */}
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
                <button className="login-btn" onClick={submitFeedback}>Submit Feedback</button>
            </div>
        </div>
      )}

      {/* --- PROFILE IMAGE POPUP MODAL --- */}
      {isProfileImageOpen && userInfo && (
        <div className="modal-overlay" onClick={() => setIsProfileImageOpen(false)}>
            <div className="modal-content" style={{width: 'auto', maxWidth: '500px', padding: '10px', background: 'transparent', boxShadow: 'none', border: 'none'}}>
                {/* Close Button */}
                <button 
                    onClick={() => setIsProfileImageOpen(false)}
                    style={{
                        position: 'absolute', top: '20px', right: '20px', 
                        background: 'white', border: 'none', borderRadius: '50%', 
                        width: '30px', height: '30px', cursor: 'pointer', zIndex: 1000
                    }}
                >
                    <FiX size={20}/>
                </button>

                {/* Big Image */}
                <img 
                    src={`https://intranet.rguktn.ac.in/SMS/usrphotos/user/${userInfo.username}.jpg`} 
                    alt="Full Size"
                    style={{
                        width: '100%', 
                        borderRadius: '10px', 
                        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                        border: '4px solid white'
                    }}
                    onClick={(e) => e.stopPropagation()} // Prevent closing when clicking the image itself
                    onError={(e) => {
                        e.target.src = userAvatar; // Fallback if full image fails
                    }}
                />
            </div>
        </div>
      )}
      
    </>
  );
}

export default StudentDashboard;