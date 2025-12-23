import React from 'react';

function AdminDashboard() {
  return (
    <div style={{ padding: "50px" }}>
      <h1>🔑 Admin Dashboard</h1>
      <p>Welcome, Admin. You can manage users and system settings here.</p>
      
      <div style={{ marginTop: "20px", border: "1px solid #ccc", padding: "20px" }}>
        <h3>User Management</h3>
        <button style={{ marginRight: "10px" }}>Create Student</button>
        <button>Create Authority</button>
      </div>
    </div>
  );
}
export default AdminDashboard;