import React, { useState } from "react";
import "./Bookappointment.css";
import { appointmentsAPI } from "../utils/api";
import { useNavigate } from "react-router-dom";

const Appointment = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    date: "",
    time: "",
    type: "Zoom Call",
    message: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Get logged-in user
  const user = JSON.parse(localStorage.getItem("user"));

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    // Check login before booking
    if (!user || !user.id) {
      alert("Please log in to book an appointment.");
      navigate("/"); // Redirect to Home
      return;
    }

    try {
      // Attach client_id to appointment data
      const dataToSend = { ...formData, client_id: user.id };

      const response = await appointmentsAPI.create(dataToSend);

      setSuccess("Appointment booked successfully! We'll contact you soon.");

      // Reset form
      setFormData({
        name: "",
        email: "",
        phone: "",
        date: "",
        time: "",
        type: "Zoom Call",
        message: "",
      });
    } catch (err) {
      setError(err.message || "Failed to book appointment. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="appointment-section">
      <h2>Book an Appointment</h2>
      <p>Fill in the form below and we will get back to you.</p>

      {error && (
        <p style={{ color: "red", textAlign: "center", marginBottom: "15px" }}>
          {error}
        </p>
      )}
      {success && (
        <p style={{ color: "green", textAlign: "center", marginBottom: "15px" }}>
          {success}
        </p>
      )}

      <form className="appointment-form" onSubmit={handleSubmit}>
        <input
          type="text"
          name="name"
          placeholder="Your Name"
          value={formData.name}
          onChange={handleChange}
          required
        />
        <input
          type="email"
          name="email"
          placeholder="Your Email"
          value={formData.email}
          onChange={handleChange}
          required
        />
        <input
          type="tel"
          name="phone"
          placeholder="Your Phone Number"
          value={formData.phone}
          onChange={handleChange}
          required
        />
        <input
          type="date"
          name="date"
          value={formData.date}
          onChange={handleChange}
          required
        />
        <input
          type="time"
          name="time"
          value={formData.time}
          onChange={handleChange}
          required
        />

        <select
          name="type"
          value={formData.type}
          onChange={handleChange}
          required
        >
          <option value="Zoom Call">Zoom Call</option>
          <option value="Phone Call">Phone Call</option>
          <option value="In-Person Meeting">In-Person Meeting</option>
        </select>

        <textarea
          name="message"
          placeholder="Additional Details"
          value={formData.message}
          onChange={handleChange}
        ></textarea>

        <button type="submit" disabled={loading}>
          {loading ? "Booking..." : "Book Appointment"}
        </button>
      </form>
    </section>
  );
};

export default Appointment;
