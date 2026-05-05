import React, { useState, useEffect } from "react";
import "./Dashboard.css";
import Login from "./Login";

import RoomInput from "./RoomInput";
import RoomAnalysis from "./RoomAnalysis";
import DesignExplorer from "./DesignExplorer";
import PricingCalculator from "./PricingCalculator";
import Contact from "./Contact";
import Portfolio from "./Portfolio";
import Payment from "./Payment";
import AddProduct from "./AddProduct";
import RepairsMaintenance from "./RepairsMaintenance";
import { appointmentsAPI } from "../utils/api";
import AIInspiration from "./Aiinspiration";
import Product3DExperience from "./Product3DExperience";
import Recommendation from "./Recommendation";

const STATUS_CONFIG = {
  Requested: { bg: "#e3f2fd", color: "#1565c0" },
  Confirmed: { bg: "#e8f5e9", color: "#2e7d32" },
  "In Progress": { bg: "#fff3e0", color: "#e65100" },
  Completed: { bg: "#e0f2f1", color: "#00695c" },
};

const ALL_STATUSES = ["Requested", "Confirmed", "In Progress", "Completed"];

const StatusBadge = ({ status }) => {
  const c = STATUS_CONFIG[status] || { bg: "#f5f5f5", color: "#555" };
  return (
    <span
      style={{
        background: c.bg,
        color: c.color,
        padding: "3px 12px",
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 600,
      }}
    >
      {status}
    </span>
  );
};

const ROLE_CARDS = {
  user: [
    { key: "ai-analysis", label: "AI Analysis", emoji: "🔍", bg: "#f3e5f5", accent: "#7B1FA2" },
    { key: "ai-inspiration", label: "AI Inspiration", emoji: "✨", bg: "#fff8e1", accent: "#F57F17" },
    { key: "product-3d-view", label: "3D Product View", emoji: "🛋️", bg: "#ede9fe", accent: "#7c3aed" },
    { key: "design-explorer", label: "Design Explorer", emoji: "🖼️", bg: "#fdf0e8", accent: "#E64A19" },
    { key: "pricing-calculator", label: "Pricing Calculator", emoji: "💰", bg: "#e8f5e9", accent: "#388E3C" },
    { key: "book-appointment", label: "Book Appointment", emoji: "📅", bg: "#fce4ec", accent: "#C62828" },
    { key: "room-planner", label: "Room Planner", emoji: "🏠", bg: "#e3f2fd", accent: "#1976D2" },
    { key: "payment", label: "Payment", emoji: "💳", bg: "#e0f7fa", accent: "#00838F" },
    { key: "portfolio", label: "Portfolio", emoji: "🖼️", bg: "#f3e5f5", accent: "#7B1FA2" },
    { key: "contact", label: "Contact", emoji: "📞", bg: "#e8eaf6", accent: "#3949AB" },
    { key: "repairs", label: "Repairs", emoji: "🔧", bg: "#efebe9", accent: "#5D4037" },
  ],
  designer: [
    { key: "book-appointment", label: "Appointments", emoji: "📅", bg: "#fce4ec", accent: "#C62828" },
  ],
  admin: [
    { key: "monitor-appointments", label: "Appointments", emoji: "🗓️", bg: "#fce4ec", accent: "#C62828" },
    { key: "add-product", label: "Product Catalog", emoji: "📦", bg: "#e8f5e9", accent: "#388E3C" },
  ],
};

const AppointmentsPanel = ({ role, appointments, setAppointments, currentUser }) => {
  const [formData, setFormData] = useState({
    name: currentUser || "",
    email: "",
    phone: "",
    date: "",
    time: "",
    type: "Zoom Call",
    message: "",
    room: "Living Room",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleBook = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const newAppointment = {
        id: Date.now(),
        user: formData.name || currentUser || "You",
        designer: "TBD",
        room: formData.room,
        date: formData.date,
        time: formData.time,
        type: formData.type,
        message: formData.message,
        status: "Requested",
      };

      setAppointments((prev) => [newAppointment, ...prev]);

      try {
        await appointmentsAPI.create(newAppointment);
      } catch {
        console.log("Backend sync failed");
      }

      setSuccess("Appointment booked successfully! Track status below.");

      setFormData({
        name: currentUser || "",
        email: "",
        phone: "",
        date: "",
        time: "",
        type: "Zoom Call",
        message: "",
        room: "Living Room",
      });
    } catch {
      setError("Failed to book appointment.");
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id, status) => {
    setAppointments(appointments.map((a) => (a.id === id ? { ...a, status } : a)));
    try {
      await appointmentsAPI.updateStatus(id, status);
    } catch {
      console.log("Status sync failed");
    }
  };

  return (
    <>
      {role === "user" && (
        <section className="appointment-section">
          <h2>Book an Appointment</h2>
          <p>Fill in the form below and track status below.</p>
          {error && <p style={{ color: "red", textAlign: "center" }}>{error}</p>}
          {success && <p style={{ color: "green", textAlign: "center" }}>{success}</p>}
          <form className="appointment-form" onSubmit={handleBook}>
            <input type="text" name="name" placeholder="Your Name" value={formData.name} onChange={handleChange} required />
            <input type="email" name="email" placeholder="Your Email" value={formData.email} onChange={handleChange} required />
            <input type="tel" name="phone" placeholder="Your Phone Number" value={formData.phone} onChange={handleChange} required />
            <input type="date" name="date" value={formData.date} onChange={handleChange} required />
            <input type="time" name="time" value={formData.time} onChange={handleChange} required />
            <select name="type" value={formData.type} onChange={handleChange} required>
              <option>Zoom Call</option>
              <option>Phone Call</option>
              <option>In-Person Meeting</option>
            </select>
            <select name="room" value={formData.room} onChange={handleChange}>
              <option>Living Room</option>
              <option>Bedroom</option>
              <option>Kitchen</option>
              <option>Office</option>
            </select>
            <textarea name="message" placeholder="Additional Details" value={formData.message} onChange={handleChange} />
            <button type="submit" disabled={loading}>{loading ? "Booking..." : "Book Appointment"}</button>
          </form>
        </section>
      )}

      <h4 className="form-sub" style={{ margin: "20px 0 12px" }}>
        {role === "designer" ? "Assigned Appointments" : role === "admin" ? "All Appointments" : "My Appointment Tracking"}
      </h4>

      <div className="table-scroll">
        <table className="data-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Room</th>
              <th>Date</th>
              <th>Time</th>
              {role !== "user" && <th>Designer</th>}
              <th>Status</th>
              {role === "designer" && <th>Update</th>}
            </tr>
          </thead>
          <tbody>
            {appointments.map((a) => (
              <tr key={a.id}>
                <td>{a.user}</td>
                <td>{a.room}</td>
                <td>{a.date}</td>
                <td>{a.time}</td>
                {role !== "user" && <td>{a.designer}</td>}
                <td><StatusBadge status={a.status} /></td>
                {role === "designer" && (
                  <td>
                    <select value={a.status} onChange={(e) => updateStatus(a.id, e.target.value)}>
                      {ALL_STATUSES.map((s) => <option key={s}>{s}</option>)}
                    </select>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
};

function Dashboard({ role, onBack }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showLogin, setShowLogin] = useState(true);
  const [activeSection, setActiveSection] = useState(null);
  const [currentUser, setCurrentUser] = useState("");
  const [appointments, setAppointments] = useState(() => JSON.parse(localStorage.getItem("appointments") || "[]"));

  // ✅ NEW: store room recommendation data inside dashboard state
  const [roomData, setRoomData] = useState(null);
  const [showRecommendation, setShowRecommendation] = useState(false);

  useEffect(() => {
    localStorage.setItem("appointments", JSON.stringify(appointments));
  }, [appointments]);

  const handleLoginSuccess = (_, username) => {
    setCurrentUser(username);
    setShowLogin(false);
    setIsLoggedIn(true);
  };

  const cards = ROLE_CARDS[role] || [];
  const roleEmoji = { user: "👤", designer: "🎨", admin: "⚙️" }[role] || "👤";
  const activeCard = cards.find((c) => c.key === activeSection);

  // ✅ Called from RoomInput when user submits room details
  const handleRoomSubmit = (data) => {
    setRoomData(data);
    setShowRecommendation(true);
  };

  // ✅ Called from Recommendation when user clicks Back
  const handleBackFromRecommendation = () => {
    setShowRecommendation(false);
    setRoomData(null);
  };

  const renderContent = () => {
    // ✅ Show Recommendation inline inside dashboard
    if (activeSection === "room-planner" && showRecommendation) {
      return (
        <Recommendation
          roomData={roomData}
          onBack={handleBackFromRecommendation}
        />
      );
    }

    switch (activeSection) {
      case "room-planner":
        return (
          <RoomInput
            onSubmit={handleRoomSubmit}
            onBack={() => setActiveSection(null)}
          />
        );
      case "ai-analysis":
        return <RoomAnalysis />;
      case "ai-inspiration":
        return <AIInspiration />;
      case "product-3d-view":
        return <Product3DExperience />;
      case "design-explorer":
        return <DesignExplorer />;
      case "pricing-calculator":
        return <PricingCalculator />;
      case "payment":
        return <Payment />;
      case "portfolio":
        return <Portfolio />;
      case "contact":
        return <Contact />;
      case "repairs":
        return <RepairsMaintenance />;
      case "add-product":
        return <AddProduct />;
      case "book-appointment":
      case "monitor-appointments":
        return (
          <AppointmentsPanel
            role={role}
            appointments={appointments}
            setAppointments={setAppointments}
            currentUser={currentUser}
          />
        );
      default:
        return <p className="panel-desc">Coming soon.</p>;
    }
  };

  return (
    <div className="dash-screen">
      {showLogin && (
        <div className="modal-back" onClick={() => { setShowLogin(false); onBack(); }}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <button className="modal-x" onClick={() => { setShowLogin(false); onBack(); }}>✕</button>
            <Login selectedRole={role} onLoginSuccess={handleLoginSuccess} />
          </div>
        </div>
      )}

      {isLoggedIn && (
        <>
          <header className="dash-topbar">
            <div className="topbar-left">
              {activeSection && (
                <button
                  className="back-btn"
                  onClick={() => {
                    // ✅ If showing recommendation, go back to room input
                    if (showRecommendation) {
                      handleBackFromRecommendation();
                    } else {
                      setActiveSection(null);
                    }
                  }}
                >
                  ← Dashboard
                </button>
              )}
              <span className="topbar-role-icon">{roleEmoji}</span>
              <h1 className="topbar-title">{role} Dashboard</h1>
            </div>
            <div className="topbar-right">
              <span className="topbar-user">🌟 {currentUser}</span>
              <button className="logout-pill" onClick={onBack}>Logout</button>
            </div>
          </header>

          <main className="dash-body">
            {!activeSection && (
              <div className="dash-home">
                <div className="dash-welcome">
                  <h2 className="welcome-title">Hello, {currentUser}!</h2>
                  <p className="welcome-sub">What would you like to do today?</p>
                </div>

                <div className="service-grid">
                  {cards.map((card, i) => (
                    <button
                      key={card.key}
                      className="service-card"
                      style={{
                        "--card-bg": card.bg,
                        "--card-accent": card.accent,
                        animationDelay: `${i * 0.06}s`,
                      }}
                      onClick={() => {
                        setShowRecommendation(false);
                        setRoomData(null);
                        setActiveSection(card.key);
                      }}
                    >
                      <div className="sc-icon-wrap">
                        <span className="sc-icon">{card.emoji}</span>
                      </div>
                      <span className="sc-label">{card.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {activeSection && (
              <div className="panel-view">
                <div className="panel-header">
                  <span className="panel-emoji">{activeCard?.emoji}</span>
                  <h2 className="panel-title">{activeCard?.label}</h2>
                </div>
                <div className="panel-content">{renderContent()}</div>
              </div>
            )}
          </main>
        </>
      )}
    </div>
  );
}

export default Dashboard;