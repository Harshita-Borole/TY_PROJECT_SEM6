
import React, { useState } from "react";
import "./Contact.css";
import { contactAPI } from "../utils/api";
import { useNavigate } from "react-router-dom";

const Contact = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const user = JSON.parse(localStorage.getItem("user"));

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Redirect if not logged in
    if (!user || !user.id) {
      alert("Please log in to use the contact form.");
      navigate("/"); // Redirect to Home instead of Login
      return;
    }

    setLoading(true);

    try {
      const dataToSend = { ...formData, client_id: user.id };
      await contactAPI.send(dataToSend);
      setSuccess("Message sent successfully! We'll get back to you soon.");
      setFormData({ name: "", email: "", message: "" });
    } catch (err) {
      setError(err.message || "Failed to send message. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="contact-section">
      <h2>Contact Us</h2>

      <div className="contact-container">
        <div className="contact-info">
          <h3 style={{ color: "black" }}>Get in Touch</h3>
          <p>Email: <a href="mailto:abc@gmail.com">abc@gmail.com</a></p>
          <p>Phone: +91 98765 43210</p>
          <p>Location: Pune, India</p>
        </div>

        <form className="contact-form" onSubmit={handleSubmit}>
          {error && <p style={{ color: "red", marginBottom: "10px" }}>{error}</p>}
          {success && <p style={{ color: "green", marginBottom: "10px" }}>{success}</p>}

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
          <textarea
            name="message"
            placeholder="Your Message"
            value={formData.message}
            onChange={handleChange}
            required
          ></textarea>
          <button type="submit" disabled={loading}>
            {loading ? "Sending..." : "Send Message"}
          </button>
        </form>
      </div>
    </section>
  );
};

export default Contact;
