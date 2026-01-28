import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios'; 
import { 
  FiHome, FiUser, FiSettings, FiLogOut, FiMenu, FiX, FiUsers, FiBriefcase, 
  FiFileText, FiBarChart2, FiTrash2, FiEdit, FiSearch, 
  FiLock, FiMail, FiHash, FiCamera, FiPlus, FiPrinter, FiEye
} from 'react-icons/fi';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import './App.css';
import logo from './logo.png'; 
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  Title, 
  Tooltip, 
  Legend, 
  ArcElement 
} from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale, 
  LinearScale, 
  BarElement, 
  Title, 
  Tooltip, 
  Legend, 
  ArcElement
);

// API CONFIG
const API_BASE = 'https://grievancemanagementsystemrguktnuzvid.onrender.com';

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
  const [adminPassData, setAdminPassData] = useState({ old: '', new: '', confirm: '' });

  // Data States
  const [stats, setStats] = useState({ students: 0, authorities: 0, complaints: 0, rate: '0%' });
  const [students, setStudents] = useState([]);      
  const [authorities, setAuthorities] = useState([]); 
  const [allGrievances, setGrievances] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // --- VIEW MODAL STATE ---
  const [selectedGrievance, setSelectedGrievance] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  // --- STATS TAB STATE ---
  const [chartView, setChartView] = useState('graph'); // 'graph' or 'pie'
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [authSearchTerm, setAuthSearchTerm] = useState('');
  const [selectedAuthorityStats, setSelectedAuthorityStats] = useState(null);

  // --- HELPER FUNCTION ---
  const openViewModal = (grievance) => {
    setSelectedGrievance(grievance);
    setIsViewModalOpen(true);
  };
  
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

  // --- SETTINGS STATE ---
  const [settings, setSettings] = useState({
    maintenanceMode: false,
    allowRegistration: true,
    emailAlerts: true,
    autoEscalate: false,
    adminLastLogin: 'Loading...'
  });

  // Fetch Settings on Load
  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
        const res = await axios.get(`${API_BASE}/settings/`);
        setSettings({
            // ... other settings ...
            maintenanceMode: res.data.maintenance_mode, 
            allowRegistration: res.data.allow_registration,
            emailAlerts: res.data.email_alerts,
            autoEscalate: res.data.auto_escalation,
            
            // --- USE NEW KEY ---
            adminPassChanged: res.data.admin_pass_changed 
        });
    } catch (err) { console.error("Failed settings"); }
  };


  const handleChangeAdminPassword = async () => {
      // 1. MATCH THE KEY NAME FROM YOUR LOGIN FILE
      const token = localStorage.getItem('admin_token'); // <--- CHANGED THIS

      console.log("Admin Token being sent:", token); // Debugging check

      if (!token) {
          alert("Session expired. Please log out and login again.");
          return;
      }

      if (adminPassData.new !== adminPassData.confirm) {
          alert("New passwords do not match!");
          return;
      }

      try {
          await axios.post(
              `${API_BASE}/admin/change-password/`, 
              {
                  old_password: adminPassData.old,
                  new_password: adminPassData.new
              },
              {
                  headers: {
                    'Authorization': `Token ${token}`, // <--- Changed from 'Bearer' to 'Token'
                    'Content-Type': 'application/json'
                }
              }
          );
          alert("Password Changed Successfully. Please login again.");
          handleLogout();
      } catch (err) {
          console.error(err);
          alert("Failed: " + (err.response?.data?.message || "Incorrect old password."));
      }
  };

  // --- DATA PROCESSING HELPERS ---
  
  // 1. Process Data for Global Graph (Month-wise Resolved)
  const getMonthlyResolvedData = (year, dept = null, designation = null) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const data = new Array(12).fill(0);

    allGrievances.forEach(g => {
        const d = new Date(g.resolved_at || g.created_at);
        const isResolved = g.status === 'Resolved';
        const matchesYear = d.getFullYear() === parseInt(year);
        
        // --- FIXED FILTERING LOGIC ---
        let matchesCategory = true;

        if (dept) { // If we are in the Modal View (Specific Authority)
            if (designation === 'DIRECTOR') {
                matchesCategory = g.category.startsWith('Ragging');
            } 
            else if (designation === 'AO' || designation === 'Administrative Officer') {
                matchesCategory = g.category.startsWith('Administration') || g.category.startsWith('Others');
            } 
            else {
                matchesCategory = g.category.startsWith(dept);
            }
        }

        if (isResolved && matchesYear && matchesCategory) {
            data[d.getMonth()]++;
        }
    });
    return { labels: months, datasets: [{ label: 'Resolved Cases', data, backgroundColor: '#3b82f6', borderRadius: 4 }] };
  };

  // 2. Process Data for Pie Chart (Dept-wise)
  const getDeptPieData = () => {
    const depts = { 'Hostel': 0, 'Mess': 0, 'Academic': 0, 'Hospital': 0, 'Sports': 0, 'Administration': 0 };
    
    allGrievances.forEach(g => {
        if (g.status === 'Resolved') {
            let cat = g.category.split(' - ')[0]; // Get main category
            if (['Hostel', 'Mess', 'Academic', 'Hospital'].includes(cat)) {
                depts[cat]++;
            } else if (cat.startsWith('Sports')) {
                depts['Sports']++;
            } else {
                depts['Administration']++; // "Others" mapped to Administration
            }
        }
    });

    return {
        labels: Object.keys(depts),
        datasets: [{
            data: Object.values(depts),
            backgroundColor: ['#f87171', '#fbbf24', '#34d399', '#60a5fa', '#a78bfa', '#94a3b8'],
            borderWidth: 1
        }]
    };
  };

  // 3. Authority Modal Logic (Calculates Stats on Click)
  const openAuthorityStats = (auth) => {
    const authGrievances = allGrievances.filter(g => {
        
        // CASE 1: DIRECTOR (Handles ONLY 'Ragging')
        if (auth.designation === 'DIRECTOR') {
            return g.category.startsWith('Ragging');
        }

        // CASE 2: AO (Handles 'Administration' AND 'Others')
        if (auth.designation === 'AO' || auth.designation === 'Administrative Officer') {
            return g.category.startsWith('Administration') || g.category.startsWith('Others');
        }

        // CASE 3: Standard Departments (Hostel, Mess, Academic, etc.)
        return g.category.startsWith(auth.department);
    });

    const total = authGrievances.length;
    const resolved = authGrievances.filter(g => g.status === 'Resolved').length;
    const escalated = authGrievances.filter(g => g.status === 'Escalated').length;
    const pending = authGrievances.filter(g => g.status === 'Pending').length;
    const rate = total === 0 ? 0 : Math.round((resolved / total) * 100);

    setSelectedAuthorityStats({
        ...auth,
        stats: { total, resolved, escalated, pending, rate }
    });
  };

  // 4. Generate Professional PDF for Authority
  const printAuthReport = () => {
    if (!selectedAuthorityStats) return;
    const doc = new jsPDF();
    const auth = selectedAuthorityStats;

    // --- A. PROFESSIONAL HEADER ---
    // 1. Add Logo (Top Left)
    try { 
        doc.addImage(logo, 'PNG', 14, 10, 20, 20); 
    } catch(e) { 
        console.warn("Logo not found"); 
    }

    // 2. University Name & System Title
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.setTextColor(30, 41, 59); // Dark Slate
    doc.text("RGUKT NUZVID", 40, 20);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text("Smart Grievance Management System", 40, 26);

    // 3. Report Title & Date (Top Right)
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Report Date: ${new Date().toLocaleDateString()}`, 196, 20, { align: 'right' });
    
    doc.setDrawColor(200);
    doc.setLineWidth(0.5);
    doc.line(14, 35, 196, 35); // Horizontal Line

    // --- B. EMPLOYEE PROFILE SECTION ---
    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.text("Authority Performance Profile", 14, 48);

    doc.setFontSize(11);
    doc.setTextColor(50);
    
    // Employee Details Grid
    doc.text(`Name:`, 14, 58);       doc.setFont("helvetica", "bold"); doc.text(auth.name, 45, 58); doc.setFont("helvetica", "normal");
    doc.text(`Employee ID:`, 14, 65); doc.setFont("helvetica", "bold"); doc.text(auth.employee_id, 45, 65); doc.setFont("helvetica", "normal");
    
    doc.text(`Department:`, 110, 58); doc.setFont("helvetica", "bold"); doc.text(auth.department, 140, 58); doc.setFont("helvetica", "normal");
    doc.text(`Designation:`, 110, 65); doc.setFont("helvetica", "bold"); doc.text(auth.designation, 140, 65); doc.setFont("helvetica", "normal");

    // --- C. STATS TABLE ---
    autoTable(doc, {
        startY: 75,
        head: [['Performance Metric', 'Value']],
        body: [
            ['Total Grievances Assigned', auth.stats.total],
            ['Successfully Resolved', auth.stats.resolved],
            ['Escalated Cases', auth.stats.escalated],
            ['Pending Action', auth.stats.pending],
            ['Overall Resolution Rate', `${auth.stats.rate}%`]
        ],
        theme: 'grid', // Professional Grid Theme
        headStyles: { 
            fillColor: [15, 23, 42], // Dark Blue/Slate Header
            textColor: [255, 255, 255],
            fontStyle: 'bold'
        },
        styles: {
            fontSize: 11,
            cellPadding: 6
        },
        alternateRowStyles: {
            fillColor: [241, 245, 249] // Light Gray alternating rows
        }
    });

    // --- D. FOOTER ---
    const pageHeight = doc.internal.pageSize.height;
    doc.setFontSize(9);
    doc.setTextColor(150);
    doc.text("Authorized by Administrative Section, RGUKT Nuzvid", 14, pageHeight - 10);
    doc.text("Page 1 of 1", 196, pageHeight - 10, { align: 'right' });

    // Save File
    doc.save(`${auth.name}_Performance_Report.pdf`);
  };

  // --- INITIALIZATION ---
  // --- INITIALIZATION ---
  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (!token) { navigate('/admin-login'); return; }
    
    document.body.className = systemTheme === 'navy' ? 'theme-navy' : '';

    // --- NEW: LOAD ALL DATA AT ONCE ---
    const loadAllData = async () => {
        setIsLoading(true); // Turn Global Spinner ON
        try {
            // We pass 'false' to individual functions so they don't turn off the spinner prematurely
            await Promise.all([
                fetchStats(),
                fetchStudents(false), 
                fetchAuthorities(false), 
                fetchAllGrievances(false)
            ]);
        } catch (e) {
            console.error("Error loading initial data", e);
        } finally {
            setIsLoading(false); // Turn Global Spinner OFF only when everything is done
        }
    };

    loadAllData();
    // ----------------------------------

    const handleStorageChange = (e) => {
      if (e.key === 'admin_token' && e.newValue === null) navigate('/admin-login');
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [navigate, systemTheme]);


  // --- API FUNCTIONS ---
  // --- 1. Fetch Stats (Dashboard Home) ---
  const fetchStats = async () => {
    try {
        const res = await axios.get(`${API_BASE}/stats/`);
        setStats(res.data);
    } catch (error) { console.error("Error fetching stats:", error); }
  };

  // --- 2. Fetch Students ---
  const fetchStudents = async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    try {
        const res = await axios.get(`${API_BASE}/students/`);
        setStudents(res.data);
    } catch (error) { console.error("Error fetching students:", error); }
    finally { if (showLoading) setIsLoading(false); }
  };

  // --- 3. Fetch Authorities ---
  const fetchAuthorities = async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    try {
        const res = await axios.get(`${API_BASE}/authorities/`);
        setAuthorities(res.data);
    } catch (error) { console.error("Error fetching authorities:", error); }
    finally { if (showLoading) setIsLoading(false); }
  };

  // --- 4. Fetch Grievances ---
  const fetchAllGrievances = async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    try {
        const res = await axios.get(`${API_BASE}/grievances/?role=admin`);
        setGrievances(res.data); 
    } catch (error) { 
        console.error("Error fetching grievances:", error); 
    } finally { 
        if (showLoading) setIsLoading(false);
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
                password: studentForm.password, 
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
            fetchStudents(); 
        }
    } catch (error) {
        // --- UPDATED ERROR HANDLING ---
        // If the backend sends a specific message (like "Registration is disabled")
        if (error.response && error.response.data && error.response.data.message) {
            alert(error.response.data.message);
        } else {
            // Fallback for generic network errors
            alert("Error saving student data. Please check connection.");
        }
        console.error(error);
    }
  };

  const deleteStudent = async (id) => {
    if (window.confirm(`Delete ${id}? This will remove login access.`)) {
        try {
            await axios.delete(`${API_BASE}/students/?id=${id}`);
            fetchStudents();
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
        file: null, // Reset file on edit open
        existingPhoto: auth.profile_pic
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
            fetchAuthorities();
        }
    } catch (error) {
        console.error(error);
        
        // --- UPDATED ERROR HANDLING ---
        // Display specific backend message (e.g., "Registration is disabled")
        if (error.response && error.response.data && error.response.data.message) {
            alert(error.response.data.message);
        } else {
            alert("Error saving authority data.");
        }
    }
  };

  const deleteAuth = async (id) => {
    if (window.confirm(`Remove ${id}?`)) {
        try {
            await axios.delete(`${API_BASE}/authorities/?id=${id}`);
            fetchAuthorities();
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

  const handleSettingToggle = async (key) => {
    // 1. Calculate New State
    const newState = { ...settings, [key]: !settings[key] };
    
    // 2. Optimistic Update (Update UI immediately)
    setSettings(newState);

    // 3. Send to Backend
    try {
        // Map back to snake_case for Django
        const payload = {
            maintenance_mode: newState.maintenanceMode,
            allow_registration: newState.allowRegistration,
            email_alerts: newState.emailAlerts,
            auto_escalation: newState.autoEscalate
        };
        await axios.post(`${API_BASE}/settings/`, payload);
        
        // Optional: Show success toast/alert
        // alert("Settings Saved"); 
    } catch (err) {
        alert("Failed to save setting. Reverting...");
        setSettings(settings); // Revert on error
    }
  };

  // 2. Export Data to CSV
  const exportGrievancesCSV = () => {
    if (!allGrievances.length) { alert("No data to export."); return; }

    // Define Headers
    const headers = ["ID", "Student ID", "Category", "Description", "Status", "Date", "Resolved Date"];
    
    // Map Data
    const rows = allGrievances.map(g => [
        g.id,
        g.student_id,
        `"${g.category}"`, // Quote to handle commas in text
        `"${g.description.replace(/"/g, '""')}"`, // Escape quotes
        g.status,
        new Date(g.created_at).toLocaleDateString(),
        g.resolved_at ? new Date(g.resolved_at).toLocaleDateString() : "-"
    ]);

    // Build CSV String
    const csvContent = "data:text/csv;charset=utf-8," 
        + headers.join(",") + "\n" 
        + rows.map(e => e.join(",")).join("\n");

    // Trigger Download
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Grievance_Report_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };


  // ==========================================
  //  UI RENDERING
  // ==========================================

  const renderStats = () => (
    <div className="fade-in">
      {/* 1. TOP CARDS */}
      <div className="stats-grid" style={{marginBottom: "20px"}}>
        <div className="stat-card"><div className="stat-icon-box icon-blue"><FiUsers /></div><div className="stat-info"><h3>{stats.students}</h3><p>Total Students</p></div></div>
        <div className="stat-card"><div className="stat-icon-box icon-purple"><FiBriefcase /></div><div className="stat-info"><h3>{stats.authorities}</h3><p>Authorities</p></div></div>
        <div className="stat-card"><div className="stat-icon-box icon-orange"><FiFileText /></div><div className="stat-info"><h3>{stats.complaints}</h3><p>Total Complaints</p></div></div>
        <div className="stat-card"><div className="stat-icon-box icon-green"><FiBarChart2 /></div><div className="stat-info"><h3>{stats.rate}</h3><p>Resolve Rate</p></div></div>
      </div>

      {/* 2. SPLIT SECTION (Graph & List) */}
      <div className="stats-container-split">
        
        {/* LEFT: VISUALIZATIONS (MAIN DASHBOARD) */}
        <div className="card" style={{minHeight: "450px"}}>
            <div style={{display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "10px"}}>
                <div className="toggle-pill-container" style={{display: 'flex', background: '#f1f5f9', borderRadius: '20px', padding: '4px'}}>
                    <button 
                        onClick={() => setChartView('graph')}
                        style={{
                            padding: '6px 15px', borderRadius: '15px', border: 'none', cursor: 'pointer', fontWeight: '500', fontSize: '0.9rem',
                            background: chartView === 'graph' ? 'white' : 'transparent',
                            boxShadow: chartView === 'graph' ? '0 2px 5px rgba(0,0,0,0.1)' : 'none',
                            color: chartView === 'graph' ? '#0f172a' : '#64748b'
                        }}
                    >Graph</button>
                    <button 
                        onClick={() => setChartView('pie')}
                        style={{
                            padding: '6px 15px', borderRadius: '15px', border: 'none', cursor: 'pointer', fontWeight: '500', fontSize: '0.9rem',
                            background: chartView === 'pie' ? 'white' : 'transparent',
                            boxShadow: chartView === 'pie' ? '0 2px 5px rgba(0,0,0,0.1)' : 'none',
                            color: chartView === 'pie' ? '#0f172a' : '#64748b'
                        }}
                    >Pie Chart</button>
                </div>

                {chartView === 'graph' && (
                    <select 
                        className="form-select" 
                        style={{width: "auto", padding: "5px 10px", fontSize: "0.9rem"}}
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(e.target.value)}
                    >
                        <option value="2025">2025</option>
                        <option value="2026">2026</option>
                        <option value="2027">2027</option>
                    </select>
                )}
            </div>

            <div className="mobile-chart-height" style={{height: "350px", display: "flex", justifyContent: "center", alignItems: "center", width: "100%"}}>
                {chartView === 'graph' ? (
                    /* --- MAIN GRAPH (No Department Filter) --- */
                    <Bar 
                        data={getMonthlyResolvedData(selectedYear)} 
                        options={{
                            responsive: true, 
                            maintainAspectRatio: false,
                            plugins: { legend: { display: false }, title: { display: true, text: `Monthly Resolutions (${selectedYear})` } }
                        }} 
                    />
                ) : (
                    <div style={{width: "100%", maxWidth: "300px", height: "100%"}}>
                        <Pie 
                            data={getDeptPieData()} 
                            options={{ 
                                maintainAspectRatio: false,
                                plugins: { title: { display: true, text: 'Department Resolution %' } } 
                            }}
                        />
                    </div>
                )}
            </div>
        </div>

        {/* RIGHT: AUTHORITY PERFORMANCE LIST */}
        <div className="card" style={{height: "450px", display: "flex", flexDirection: "column"}}>
            <h4 style={{marginBottom: "15px", color: "#334155"}}>Authority Performance</h4>
            
            <div className="input-wrapper" style={{marginBottom: "15px"}}>
                <FiSearch className="input-icon" />
                <input 
                    className="form-input form-input-with-icon" 
                    placeholder="Search Name or ID..." 
                    value={authSearchTerm}
                    onChange={(e) => setAuthSearchTerm(e.target.value)}
                />
            </div>

            <div style={{flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "10px", paddingRight: "5px"}}>
                {authorities
                    .filter(a => 
                        a.name.toLowerCase().includes(authSearchTerm.toLowerCase()) || 
                        a.employee_id.toLowerCase().includes(authSearchTerm.toLowerCase())
                    )
                    .map(auth => (
                    <div 
                        key={auth.employee_id} 
                        onClick={() => openAuthorityStats(auth)}
                        style={{
                            padding: "12px", border: "1px solid #e2e8f0", borderRadius: "8px", 
                            cursor: "pointer", transition: "all 0.2s", display: "flex", alignItems: "center", gap: "12px",
                            background: "white"
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.borderColor = "#3b82f6"}
                        onMouseLeave={(e) => e.currentTarget.style.borderColor = "#e2e8f0"}
                    >
                        <img 
                             src={`https://intranet.rguktn.ac.in/SMS/usrphotos/user/${auth.employee_id}.jpg`} 
                             onError={(e) => { e.target.style.display = 'none'; }}
                             alt="" 
                             style={{width: "40px", height: "40px", borderRadius: "50%", objectFit: "cover"}}
                        />
                        <div style={{display: 'flex', flexDirection: 'column'}}>
                            <span style={{fontWeight: "600", fontSize: "0.95rem", color: "#1e293b"}}>{auth.name}</span>
                            <span style={{fontSize: "0.8rem", color: "#64748b"}}>{auth.department}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
      </div>

      {/* 3. AUTHORITY DETAILS MODAL (POPUP) */}
      {selectedAuthorityStats && (
        <div className="modal-overlay" onClick={() => setSelectedAuthorityStats(null)}>
            <div className="modal-content responsive-modal" onClick={(e) => e.stopPropagation()}>
                <button className="close-modal-btn" onClick={() => setSelectedAuthorityStats(null)}><FiX /></button>
                
                {/* SECTION 1: HEADER INFO */}
                <div style={{display: "flex", flexWrap: "wrap", gap: "20px", borderBottom: "1px solid #e2e8f0", paddingBottom: "20px", marginBottom: "20px"}}>
                     <img 
                        src={selectedAuthorityStats.profile_pic 
                            ? `${API_BASE.replace('/api', '')}${selectedAuthorityStats.profile_pic}` 
                            : logo
                        }
                        onError={(e) => { e.target.src = logo; }}
                        alt="Profile"
                        style={{width: "100px", height: "100px", borderRadius: "10px", objectFit: "cover", border: "3px solid #f1f5f9"}}
                     />
                     <div>
                        <h2 style={{margin: 0, color: "#1e293b", fontSize: "1.5rem"}}>{selectedAuthorityStats.name}</h2>
                        <p style={{color: "#64748b", margin: "5px 0 10px"}}>{selectedAuthorityStats.designation} - {selectedAuthorityStats.department}</p>
                        <div style={{display: "flex", gap: "15px", fontSize: "0.9rem", flexWrap: "wrap"}}>
                            <span style={{background: "#f1f5f9", padding: "4px 8px", borderRadius: "4px"}}><FiUser/> {selectedAuthorityStats.employee_id}</span>
                            <span style={{background: "#f1f5f9", padding: "4px 8px", borderRadius: "4px"}}><FiMail/> {selectedAuthorityStats.email}</span>
                        </div>
                     </div>
                </div>

                {/* SECTION 2: MODAL GRAPH & STATS */}
                <div className="auth-modal-grid">
                    {/* Left: Individual Graph (USES DEPT & DESIGNATION) */}
                    <div style={{height: "250px", width: "100%"}}>
                        <h5 style={{marginBottom: "10px", color: "#64748b"}}>Monthly Performance ({selectedYear})</h5>
                        <Bar 
                            /* --- THIS IS WHERE THE ERROR WAS HAPPENING --- */
                            data={getMonthlyResolvedData(
                                selectedYear, 
                                selectedAuthorityStats.department, 
                                selectedAuthorityStats.designation
                            )}
                            options={{
                                responsive: true, maintainAspectRatio: false,
                                plugins: { legend: { display: false } },
                                scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
                            }}
                        />
                    </div>

                    {/* Right: Stats Grid */}
                    <div>
                        <h5 style={{marginBottom: "10px", color: "#64748b"}}>Overview</h5>
                        <div style={{display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px"}}>
                            <div className="stat-card" style={{padding: "15px", flexDirection: "column", alignItems: "flex-start", gap: "5px"}}>
                                <span style={{fontSize: "2rem", fontWeight: "bold", color: "#2563eb"}}>{selectedAuthorityStats.stats.rate}%</span>
                                <span style={{fontSize: "0.85rem", color: "#64748b"}}>Resolve Rate</span>
                            </div>
                            <div className="stat-card" style={{padding: "15px", flexDirection: "column", alignItems: "flex-start", gap: "5px"}}>
                                <span style={{fontSize: "2rem", fontWeight: "bold", color: "#16a34a"}}>{selectedAuthorityStats.stats.resolved}</span>
                                <span style={{fontSize: "0.85rem", color: "#64748b"}}>Solved</span>
                            </div>
                            <div className="stat-card" style={{padding: "15px", flexDirection: "column", alignItems: "flex-start", gap: "5px"}}>
                                <span style={{fontSize: "2rem", fontWeight: "bold", color: "#dc2626"}}>{selectedAuthorityStats.stats.escalated}</span>
                                <span style={{fontSize: "0.85rem", color: "#64748b"}}>Escalated</span>
                            </div>
                            <div className="stat-card" style={{padding: "15px", flexDirection: "column", alignItems: "flex-start", gap: "5px"}}>
                                <span style={{fontSize: "2rem", fontWeight: "bold", color: "#f59e0b"}}>{selectedAuthorityStats.stats.pending}</span>
                                <span style={{fontSize: "0.85rem", color: "#64748b"}}>Pending</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* FOOTER: PRINT */}
                <div style={{textAlign: "right", borderTop: "1px solid #e2e8f0", paddingTop: "15px"}}>
                    <button className="login-btn" style={{width: "auto"}} onClick={printAuthReport}>
                        <FiPrinter /> Print Report
                    </button>
                </div>
            </div>
        </div>
      )}
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
          {/* --- LOADING SPINNER --- */}
          {isLoading ? (
              <div style={{textAlign: "center", padding: "50px 20px"}}>
                  <div className="spinner"></div>
                  <p style={{marginTop: "15px", color: "#64748b"}}>Loading student records...</p>
              </div>
          ) : (
              <table className="data-table">
                 <thead><tr><th>ID</th><th>Name</th><th>Branch</th><th>Year</th><th>Email</th><th>Actions</th></tr></thead>
                 <tbody>
                   {students.filter(s => 
                       (s.name && s.name.toLowerCase().includes(searchTerm.toLowerCase())) || 
                       (s.student_id && s.student_id.toLowerCase().includes(searchTerm.toLowerCase()))
                   ).map(s => (
                      <tr key={s.student_id}>
                         <td>{s.student_id}</td>
                         <td>{s.name}</td>
                         <td>{s.branch || '-'}</td>
                         <td>{s.year}</td>
                         <td>{s.email}</td>
                         <td>
                            <button className="action-icon-btn btn-edit" title="Edit" onClick={() => openEditStudent(s)}><FiEdit /></button>
                            <button className="action-icon-btn btn-delete" title="Delete" onClick={() => deleteStudent(s.student_id)}><FiTrash2 /></button>
                         </td>
                      </tr>
                   ))}
                   {students.length === 0 && <tr><td colSpan="6" style={{textAlign:"center", padding:"20px"}}>No students found.</td></tr>}
                 </tbody>
              </table>
          )}
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
          {/* --- LOADING SPINNER --- */}
          {isLoading ? (
              <div style={{textAlign: "center", padding: "50px 20px"}}>
                  <div className="spinner"></div>
                  <p style={{marginTop: "15px", color: "#64748b"}}>Loading authority records...</p>
              </div>
          ) : (
              <table className="data-table">
                 <thead><tr><th>ID</th><th>Name</th><th>Designation</th><th>Dept</th><th>Email</th><th>Actions</th></tr></thead>
                 <tbody>
                   {authorities.filter(a => 
                       (a.name && a.name.toLowerCase().includes(searchTerm.toLowerCase()))
                   ).map(a => (
                      <tr key={a.employee_id}>
                         <td>{a.employee_id}</td>
                         <td>{a.name}</td>
                         <td>{a.designation}</td>
                         <td>{a.department}</td>
                         <td>{a.email}</td>
                         <td>
                            <button className="action-icon-btn btn-edit" title="Edit" onClick={() => openEditAuth(a)}><FiEdit /></button>
                            <button className="action-icon-btn btn-delete" title="Delete" onClick={() => deleteAuth(a.employee_id)}><FiTrash2 /></button>
                         </td>
                      </tr>
                   ))}
                   {authorities.length === 0 && <tr><td colSpan="6" style={{textAlign:"center", padding:"20px"}}>No authorities found.</td></tr>}
                 </tbody>
              </table>
          )}
       </div>
    </div>
  );

  const renderGrievanceLog = () => {
    // --- ADVANCED FILTERING LOGIC ---
    const filteredGrievances = allGrievances.filter(g => {
        // 1. Text Search (ID or Student ID)
        const matchesSearch = 
            (g.category && g.category.toLowerCase().includes(searchTerm.toLowerCase())) || 
            (g.student_id && g.student_id.toLowerCase().includes(searchTerm.toLowerCase())) ||
            g.id.toString().includes(searchTerm);

        // 2. Status Filter
        const matchesStatus = statusFilter === 'All' || g.status === statusFilter;

        // 3. Category Filter
        const matchesCategory = categoryFilter === 'All' || g.category.startsWith(categoryFilter);

        // 4. Date Filter
        let matchesDate = true;
        if (dateFilter) {
            const gDate = new Date(g.created_at).toISOString().split('T')[0];
            matchesDate = gDate === dateFilter;
        }

        return matchesSearch && matchesStatus && matchesCategory && matchesDate;
    });

    return (
        <div className="fade-in">
            <div className="content-header">
                <h2>Grievance Log</h2>
            </div>

            {/* --- FILTER BAR --- */}
            <div className="filter-bar" style={{flexWrap: 'wrap', gap: '10px', alignItems: 'center'}}>
                
                {/* Search Input */}
                <div className="input-wrapper" style={{maxWidth: "250px"}}>
                    <FiSearch className="input-icon" />
                    <input 
                        className="form-input form-input-with-icon" 
                        placeholder="Search ID..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)} 
                    />
                </div>

                {/* Status Dropdown */}
                <select className="filter-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                    <option value="All">All Statuses</option>
                    <option value="Pending">Pending</option>
                    <option value="Resolved">Resolved</option>
                    <option value="Escalated">Escalated</option>
                </select>

                {/* Category Dropdown */}
                <select className="filter-select" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
                    <option value="All">All Departments</option>
                    <option value="Hostel">Hostel</option>
                    <option value="Mess">Mess</option>
                    <option value="Academic">Academic</option>
                    <option value="Hospital">Hospital</option>
                    <option value="Sports">Sports/Gym</option>
                    <option value="Ragging">Ragging</option>
                    <option value="Others">Others</option>
                </select>

                {/* Date Picker */}
                <input 
                    type="date" 
                    className="form-input" 
                    style={{width: 'auto', padding: '8px'}} 
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)} 
                />

                {/* Clear Filters Button */}
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

            {/* --- TABLE CARD --- */}
            <div className="card" style={{padding: "0", overflowX: "auto"}}>
                
                {/* --- LOADING SPINNER LOGIC --- */}
                {isLoading ? (
                    <div style={{textAlign: "center", padding: "50px 20px"}}>
                        <div className="spinner"></div>
                        <p style={{marginTop: "15px", color: "#64748b"}}>Loading grievances...</p>
                    </div>
                ) : filteredGrievances.length === 0 ? (
                    <div style={{padding: "60px", textAlign: "center", color: "#94a3b8"}}>
                        <FiFileText size={40} style={{marginBottom:"10px", opacity:0.5}}/>
                        <p>No grievances match your filters.</p>
                    </div>
                ) : (
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Student</th>
                                <th>Category</th>
                                <th>Date</th>
                                <th>Status</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredGrievances.map(g => (
                            <tr key={g.id}>
                                <td>#{g.id}</td>
                                <td>{g.student_name || 'Student'} <br/><span style={{fontSize:"0.8em", color:"#64748b"}}>{g.student_id}</span></td>
                                <td>{g.category}</td>
                                <td>{new Date(g.created_at).toLocaleDateString()}</td>
                                <td>
                                    <span className={`status-badge ${g.status === 'Resolved' ? 'status-resolved' : 'status-pending'}`}>
                                        {g.status}
                                    </span>
                                </td>
                                <td>
                                    {/* PRINT BUTTON (Only if Resolved/Escalated) */}
                                    {(g.status === 'Resolved' || g.status === 'Escalated') && (
                                        <button 
                                            className="action-icon-btn" 
                                            onClick={() => generatePDF(g)}
                                            title="Print Report"
                                            style={{color: "#0284c7", backgroundColor: "#e0f2fe", marginRight: '5px'}}
                                        >
                                            <FiPrinter />
                                        </button>
                                    )}

                                    {/* VIEW BUTTON (Always visible) */}
                                    <button 
                                        className="action-icon-btn" 
                                        onClick={() => openViewModal(g)}
                                        title="View Details"
                                    >
                                        <FiEye />
                                    </button>
                                </td>
                            </tr>
                            ))}
                        </tbody>
                    </table>
                )}
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
      <div className="content-header">
        <h2>System Configuration</h2>
        <p style={{color: "#64748b"}}>Manage global application settings and data.</p>
        <br></br>
      </div>

      <div className="ads-grid"> {/* Renamed from settings-grid */}
         
         {/* SECTION 1: SYSTEM CONTROLS */}
         <div className="ads-card"> {/* Renamed from settings-card */}
            <h4><FiSettings /> System Controls</h4>
            
            <div className="ads-row"> {/* Renamed from setting-row */}
                <div className="ads-info"> {/* Renamed from setting-info */}
                    <h5>Maintenance Mode</h5>
                    <p>Prevents students from logging new complaints.</p>
                </div>
                <label className="ads-toggle"> {/* Renamed from toggle-switch */}
                    <input type="checkbox" checked={settings.maintenanceMode} onChange={() => handleSettingToggle('maintenanceMode')} />
                    <span className="ads-slider"></span> {/* Renamed from slider */}
                </label>
            </div>

            <div className="ads-row">
                <div className="ads-info">
                    <h5>Allow Registration</h5>
                    <p>Enable new user signups (Student/Authority).</p>
                </div>
                <label className="ads-toggle">
                    <input type="checkbox" checked={settings.allowRegistration} onChange={() => handleSettingToggle('allowRegistration')} />
                    <span className="ads-slider"></span>
                </label>
            </div>

            <div className="ads-row">
                <div className="ads-info">
                    <h5>Auto-Escalation</h5>
                    <p>Auto-escalate pending issues after 7 days.</p>
                </div>
                <label className="ads-toggle">
                    <input type="checkbox" checked={settings.autoEscalate} onChange={() => handleSettingToggle('autoEscalate')} />
                    <span className="ads-slider"></span>
                </label>
            </div>
         </div>

         {/* SECTION 2: DATA MANAGEMENT */}
         <div className="ads-card">
            <h4><FiBarChart2 /> Data Management</h4>
            
            <div className="ads-row">
                <div className="ads-info">
                    <h5>Export Grievance Data</h5>
                    <p>Download all records as a CSV file.</p>
                </div>
                <button 
                    className="login-btn" 
                    style={{width: "auto", padding: "8px 16px", fontSize: "0.85rem", display: "flex", gap: "8px", alignItems: "center"}}
                    onClick={exportGrievancesCSV}
                >
                    <FiPrinter /> Download CSV
                </button>
            </div>

            <div className="ads-row">
                <div className="ads-info">
                    <h5>Theme Preference</h5>
                    <p>Customize the dashboard appearance.</p>
                </div>
                <select 
                    className="form-select" 
                    style={{width: "120px", fontSize: "0.9rem"}} 
                    value={systemTheme} 
                    onChange={(e) => setSystemTheme(e.target.value)}
                >
                    <option value="default">Default</option>
                    <option value="navy">Navy Blue</option>
                    <option value="dark">Dark Mode</option>
                </select>
            </div>
         </div>

         {/* SECTION 3: SECURITY & NOTIFICATIONS */}
         <div className="ads-card">
            <h4><FiLock /> Security & Alerts</h4>
            
            <div className="ads-row">
                <div className="ads-info">
                    <h5>Email Notifications</h5>
                    <p>Receive daily digest of escalated issues.</p>
                </div>
                <label className="ads-toggle">
                    <input type="checkbox" checked={settings.emailAlerts} onChange={() => handleSettingToggle('emailAlerts')} />
                    <span className="ads-slider"></span>
                </label>
            </div>

            <div className="ads-row">
                <div className="ads-info">
                    <h5>Admin Password</h5>
                    <p>Last changed: {settings.adminPassChanged || 'Loading...'}</p>
                </div>
                <button 
                    className="link-btn" 
                    style={{textDecoration: "underline", color: "#2563eb"}}
                    onClick={() => setIsPasswordModalOpen(true)}
                >
                    Change
                </button>
            </div>
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
                    {/* PRIORITY 1: Show New File (if user just uploaded one) */}
                    {authForm.file ? (
                        <img src={URL.createObjectURL(authForm.file)} alt="Preview" style={{width:'100%', height:'100%', objectFit:'cover'}} />
                    
                    // PRIORITY 2: Show Existing DB Photo (if editing)
                    ) : (editingId && authForm.existingPhoto) ? (
                        <img 
                            src={`${API_BASE.replace('/api', '')}${authForm.existingPhoto}`} 
                            alt="Existing" 
                            style={{width:'100%', height:'100%', objectFit:'cover'}} 
                            onError={(e) => {e.target.style.display='none'; e.target.nextSibling.style.display='flex'}}
                        />
                    
                    // PRIORITY 3: Show Fallback Icon
                    ) : null}

                    {/* FALLBACK ICON (Hidden if image exists) */}
                    <div style={{
                        display: (authForm.file || (editingId && authForm.existingPhoto)) ? 'none' : 'flex', 
                        flexDirection: 'column', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        height: '100%',
                        width: '100%'
                    }}>
                        <FiCamera size={30} />
                        <span className="photo-upload-label">{editingId ? 'Change Photo' : 'Upload Photo'}</span>
                    </div>

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


      {/* --- VIEW DETAILS MODAL --- */}
      {isViewModalOpen && selectedGrievance && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button className="close-modal-btn" onClick={() => setIsViewModalOpen(false)}><FiX /></button>
            <h3>Grievance #{selectedGrievance.id}</h3>
            
            <div style={{marginTop: "15px"}}>
                <table className="info-table">
                    <tbody>
                        <tr><td className="info-label">Student:</td><td className="info-value">{selectedGrievance.student_name} ({selectedGrievance.student_id})</td></tr>
                        <tr><td className="info-label">Category:</td><td className="info-value">{selectedGrievance.category}</td></tr>
                        <tr><td className="info-label">Date:</td><td className="info-value">{new Date(selectedGrievance.created_at).toLocaleString()}</td></tr>
                        <tr><td className="info-label">Status:</td><td className="info-value"><span className={`status-badge ${selectedGrievance.status === 'Resolved' ? 'status-resolved' : 'status-pending'}`}>{selectedGrievance.status}</span></td></tr>
                    </tbody>
                </table>

                <div style={{marginTop: "15px"}}>
                    <h5 style={{color: "#64748b", marginBottom: "5px"}}>Description:</h5>
                    <p style={{background: "#f8fafc", padding: "10px", borderRadius: "6px", fontSize: "0.9rem", whiteSpace: "pre-wrap"}}>{selectedGrievance.description}</p>
                </div>

                {/* Show Images if available */}
                {(selectedGrievance.image || selectedGrievance.resolved_image) && (
                    <div style={{marginTop: "15px", display: "flex", gap: "10px", flexWrap: "wrap"}}>
                        {selectedGrievance.image && (
                            <div>
                                <small style={{display:'block', marginBottom:'5px', color:'#64748b'}}>Issue Proof:</small>
                                <img 
                                    src={`${API_BASE.replace('/api', '')}${selectedGrievance.image}`} 
                                    alt="Issue" 
                                    style={{width: '100px', height: '100px', objectFit: 'cover', borderRadius: '5px', border: '1px solid #e2e8f0', cursor: 'pointer'}}
                                    onClick={() => window.open(`${API_BASE.replace('/api', '')}${selectedGrievance.image}`, '_blank')}
                                />
                            </div>
                        )}
                        {selectedGrievance.resolved_image && (
                            <div>
                                <small style={{display:'block', marginBottom:'5px', color:'#64748b'}}>Resolution Proof:</small>
                                <img 
                                    src={`${API_BASE.replace('/api', '')}${selectedGrievance.resolved_image}`} 
                                    alt="Resolved" 
                                    style={{width: '100px', height: '100px', objectFit: 'cover', borderRadius: '5px', border: '1px solid #e2e8f0', cursor: 'pointer'}}
                                    onClick={() => window.open(`${API_BASE.replace('/api', '')}${selectedGrievance.resolved_image}`, '_blank')}
                                />
                            </div>
                        )}
                    </div>
                )}

                {/* Authority Reply */}
                {selectedGrievance.authority_reply && (
                    <div style={{marginTop: "15px", background: "#f0fdf4", padding: "10px", borderRadius: "6px", border: "1px solid #bbf7d0"}}>
                        <h5 style={{color: "#166534", marginBottom: "5px"}}>Authority Reply:</h5>
                        <p style={{fontSize: "0.9rem", color: "#14532d"}}>{selectedGrievance.authority_reply}</p>
                    </div>
                )}
            </div>
          </div>
        </div>
      )}

      {/* CHANGE PASSWORD MODAL */}
      {isPasswordModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{maxWidth: '400px'}}>
             <h3>Change Admin Password</h3>
             
             <div style={{margin: '15px 0'}}>
                <label>Current Password</label>
                <input type="password" className="form-input" 
                    value={adminPassData.old} 
                    onChange={e => setAdminPassData({...adminPassData, old: e.target.value})} 
                />
             </div>
             
             <div style={{margin: '15px 0'}}>
                <label>New Password</label>
                <input type="password" className="form-input" 
                    value={adminPassData.new} 
                    onChange={e => setAdminPassData({...adminPassData, new: e.target.value})} 
                />
             </div>

             <div style={{margin: '15px 0'}}>
                <label>Confirm New Password</label>
                <input type="password" className="form-input" 
                    value={adminPassData.confirm} 
                    onChange={e => setAdminPassData({...adminPassData, confirm: e.target.value})} 
                />
             </div>

             <div style={{display: 'flex', gap: '10px', marginTop: '20px'}}>
                <button className="login-btn" onClick={handleChangeAdminPassword}>Update</button>
                <button className="login-btn" style={{background:'#ccc', color: 'black'}} onClick={() => setIsPasswordModalOpen(false)}>Cancel</button>
             </div>
          </div>
        </div>
      )}
    </>
  );
}

export default AdminDashboard;