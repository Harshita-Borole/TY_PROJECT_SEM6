import React, { useState } from "react";
import "./Home.css";
import Frontpage from "./Frontpage";
import Dashboard from "./Dashboard";

function Home() {
  // "landing" | "roles" | "dashboard"
  const [view, setView] = useState("landing");
  const [selectedRole, setSelectedRole] = useState(null);

  const handleRoleSelect = (role) => {
    setSelectedRole(role);
    setView("dashboard");
  };

  return (
    <>
      {/* 1. Landing — Frontpage hero (includes its own Navbar) */}
      {view === "landing" && (
        <Frontpage onStart={() => setView("roles")} />
      )}

      {/* 2. Role selection */}
      {view === "roles" && (
        <RoleSelectionPage
          onRoleSelect={handleRoleSelect}
          onBack={() => setView("landing")}
        />
      )}

      {/* 3. Dashboard — full screen after login */}
      {view === "dashboard" && (
        <Dashboard
          role={selectedRole}
          onBack={() => setView("roles")}
        />
      )}
    </>
  );
}

// ── Role Selection Page ───────────────────────────────────────────────────────
function RoleSelectionPage({ onRoleSelect, onBack }) {
  const roles = [
    { key: "user",     label: "User",     icon: "👤", desc: "Book consultations, explore designs & track appointments", accent: "#2196F3" },
    { key: "designer", label: "Designer", icon: "🎨", desc: "Manage appointments, suggest products & view room details",  accent: "#FF6B35" },
    { key: "admin",    label: "Admin",    icon: "⚙️", desc: "Monitor users, appointments & manage the platform",         accent: "#4CAF50" },
  ];

  return (
    <div className="role-page">
      <div className="role-page-inner">
        <button className="back-link" onClick={onBack}>← Back to Home</button>
        <h1 className="role-page-title">Interior Design Pro</h1>
        <p className="role-page-sub">Select your role to continue</p>
        <div className="role-cards-row">
          {roles.map((r) => (
            <button
              key={r.key}
              className="role-select-card"
              style={{ "--accent": r.accent }}
              onClick={() => onRoleSelect(r.key)}
            >
              <span className="rsc-icon">{r.icon}</span>
              <span className="rsc-label">{r.label}</span>
              <span className="rsc-desc">{r.desc}</span>
              <span className="rsc-arrow">→</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Home;