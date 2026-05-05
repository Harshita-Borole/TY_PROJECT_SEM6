import React, { useState, useEffect } from "react";
import "./RepairsMaintenance.css";
import { useNavigate } from "react-router-dom"; // Import navigation hook

export default function Repairs() {
  const navigate = useNavigate(); //  Initialize navigate

  const [formData, setFormData] = useState({
    fullName: "",
    contactNumber: "",
    address: "",
    productName: "",
    message: "",
  });

  const [clientId, setClientId] = useState("");
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
  const token = localStorage.getItem("token");
  if (!token) {
    console.log("NO TOKEN FOUND");
  } else {
    console.log("TOKEN FOUND:", token);
  }
}, []);


  //  Load clientId from localStorage on mount
  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user"));
    if (storedUser && storedUser.client_id) {
      // match same key used in backend
      setClientId(storedUser.client_id);
    }
  }, []);

  // Handle input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Validate form inputs
  const validateForm = () => {
    let newErrors = {};
    const phonePattern = /^[0-9]{10}$/;

    if (!formData.fullName.trim()) newErrors.fullName = "Full name is required.";
    if (!phonePattern.test(formData.contactNumber))
      newErrors.contactNumber = "Enter a valid 10-digit phone number.";
    if (!formData.address.trim()) newErrors.address = "Address is required.";
    if (!formData.productName.trim())
      newErrors.productName = "Product name is required.";
    if (!formData.message.trim())
      newErrors.message = "Issue description is required.";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  //  Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    //  Check login before submitting
    if (!clientId) {
      alert("Please log in before submitting a repair request.");
      navigate("/"); // Redirect to Home page
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("http://localhost:5000/api/repairs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, client_id: clientId }), //  key name fixed
      });

      const data = await response.json();

      if (response.ok) {
        alert("✅ " + data.message);
        setFormData({
          fullName: "",
          contactNumber: "",
          address: "",
          productName: "",
          message: "",
        });
      } else {
        alert("⚠️ " + (data.error || "Something went wrong."));
      }
    } catch (error) {
      console.error(error);
      alert("Server error. Please try again later.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="repair-container">
      <h2 className="repair-title">
        🧰 Already a customer? Our repair and maintenance team is here to help.
      </h2>

      <form onSubmit={handleSubmit} className="repair-form">
        {/* Row 1: Name + Phone */}
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">
              Full Name <span className="required">*</span>
            </label>
            <input
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              className="form-input"
              placeholder="Enter your full name"
            />
            {errors.fullName && <p className="error">{errors.fullName}</p>}
          </div>

          <div className="form-group">
            <label className="form-label">
              Contact Number <span className="required">*</span>
            </label>
            <input
              type="text"
              name="contactNumber"
              value={formData.contactNumber}
              onChange={handleChange}
              className="form-input"
              placeholder="10-digit number (e.g. 9876543210)"
              maxLength="10"
            />
            {errors.contactNumber && (
              <p className="error">{errors.contactNumber}</p>
            )}
          </div>
        </div>

        {/* Address */}
        <div className="form-group">
          <label className="form-label">
            Address <span className="required">*</span>
          </label>
          <input
            type="text"
            name="address"
            value={formData.address}
            onChange={handleChange}
            className="form-input"
            placeholder="Your full address"
          />
          {errors.address && <p className="error">{errors.address}</p>}
        </div>

        {/* Product */}
        <div className="form-group">
          <label className="form-label">
            Product Name <span className="required">*</span>
          </label>
          <input
            type="text"
            name="productName"
            value={formData.productName}
            onChange={handleChange}
            className="form-input"
            placeholder="Product name or model"
          />
          {errors.productName && <p className="error">{errors.productName}</p>}
        </div>

        {/* Message */}
        <div className="form-group">
          <label className="form-label">
            Drop your message <span className="required">*</span>
          </label>
          <textarea
            name="message"
            value={formData.message}
            onChange={handleChange}
            className="form-input textarea"
            placeholder="Briefly describe the issue"
          />
          {errors.message && <p className="error">{errors.message}</p>}
        </div>

        {/* Hidden Client ID */}
        {clientId && <input type="hidden" name="client_id" value={clientId} />}

        {/* Submit */}
        <div className="form-submit">
          <button type="submit" disabled={isSubmitting} className="submit-btn">
            {isSubmitting ? "Submitting..." : "Submit"}
          </button>
        </div>
      </form>
    </div>
  );
}
