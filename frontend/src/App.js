import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './Login';
import AdminLogin from './AdminLogin'; // Import the new file
import StudentDashboard from './StudentDashboard';
import AuthorityDashboard from './AuthorityDashboard';
import AdminDashboard from './AdminDashboard';
import NotFound from './NotFound';

function App() {
  return (
    <Router>
      <Routes>
        {/* Common Login Page (Default) */}
        <Route path="/" element={<Login />} />
        
        {/* Separate Admin Login Page */}
        <Route path="/admin-login" element={<AdminLogin />} />

        {/* Dashboards */}
        <Route path="/student-dashboard" element={<StudentDashboard />} />
        <Route path="/authority-dashboard" element={<AuthorityDashboard />} />
        <Route path="/admin-dashboard" element={<AdminDashboard />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

export default App;