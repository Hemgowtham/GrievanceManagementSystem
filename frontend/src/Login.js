import React, { useState } from 'react';
import axios from 'axios';

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage(""); // Clear previous messages

    try {
      // Send login request to Django
      const response = await axios.post('http://127.0.0.1:8000/api/login/', {
        username: username,
        password: password
      });

      // If successful
      setMessage("✅ Success! Welcome " + response.data.username);
      console.log("Login Response:", response.data);

    } catch (error) {
      // If failed
      console.error("Login Error:", error);
      setMessage("❌ Login Failed: check your username/password");
    }
  };

  return (
    <div style={{ padding: "50px", textAlign: "center" }}>
      <h2>Grievance System Login</h2>
      <form onSubmit={handleLogin}>
        <div>
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={{ padding: "10px", margin: "10px", width: "200px" }}
          />
        </div>
        <div>
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ padding: "10px", margin: "10px", width: "200px" }}
          />
        </div>
        <button type="submit" style={{ padding: "10px 20px", cursor: "pointer", backgroundColor: "#007bff", color: "white", border: "none", borderRadius: "5px" }}>
          Login
        </button>
      </form>

      <h3 style={{ marginTop: "20px", color: message.includes("Success") ? "green" : "red" }}>
        {message}
      </h3>
    </div>
  );
}

export default Login;