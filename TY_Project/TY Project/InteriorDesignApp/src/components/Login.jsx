import React, { useState, useEffect } from "react";

const Login = ({ selectedRole: initialRole, onLoginSuccess }) => {
  const [role, setRole] = useState(initialRole || "user");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (initialRole) setRole(initialRole);
  }, [initialRole]);

  const handleLogin = (e) => {
    e.preventDefault();

    if (!email.trim() || !password.trim()) {
      setError("Please fill in all fields.");
      return;
    }

    // Simple email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    // Save logged user locally
    localStorage.setItem("loggedUser", JSON.stringify({ email, role }));

    // Pass role and email
    onLoginSuccess(role, email);
  };

  const roleEmoji = { user: "👤", designer: "🎨", admin: "⚙️" };

  return (
    <form onSubmit={handleLogin} className="login-form">
      <div className="login-avatar">{roleEmoji[role]}</div>

      <h2 className="login-title">
        {role.charAt(0).toUpperCase() + role.slice(1)} Login
      </h2>

      {error && <p className="login-error">{error}</p>}

      <div className="login-field">
        <label>Email Address</label>
        <input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setError("");
          }}
          autoFocus
        />
      </div>

      <div className="login-field">
        <label>Password</label>
        <input
          type="password"
          placeholder="Enter your password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            setError("");
          }}
        />
      </div>

      <div className="login-field">
        <label>Role</label>
        <select value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="user">👤 User</option>
          <option value="designer">🎨 Designer</option>
          <option value="admin">⚙️ Admin</option>
        </select>
      </div>

      <button type="submit" className="login-btn">Login →</button>
    </form>
  );
};

export default Login;