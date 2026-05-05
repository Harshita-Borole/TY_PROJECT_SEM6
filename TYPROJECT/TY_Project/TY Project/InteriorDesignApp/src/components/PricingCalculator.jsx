// PricingCalculator.jsx
import React, { useState } from "react";
import "./PricingCalculator.css";

const PricingCalculator = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    room_type: "Living Room",
    room_size: "",
    size_unit: "sqft",
    services: [],
    material_quality: "Basic"
  });
  const [estimate, setEstimate] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showConsultation, setShowConsultation] = useState(false);
  const [consultationData, setConsultationData] = useState({
    name: "",
    email: "",
    phone: "",
    preferred_date: "",
    preferred_time: "",
    message: ""
  });

  // Options
  const roomTypes = [
    "Living Room", "Bedroom", "Kitchen", "Office Space", "Dining Room", "Bathroom", "Kids Room"
  ];

  const servicesList = [
    { id: "3D Design", label: "3D Design & Visualization", icon: "🎨" },
    { id: "Furniture Layout", label: "Furniture Layout Planning", icon: "🛋️" },
    { id: "False Ceiling", label: "False Ceiling Design", icon: "⬆️" },
    { id: "Lighting Plan", label: "Lighting Design Plan", icon: "💡" },
    { id: "Wall Decor", label: "Wall Decor & Paint", icon: "🖼️" },
    { id: "Modular Kitchen", label: "Modular Kitchen", icon: "🍳" },
    { id: "Wardrobe Design", label: "Wardrobe Design", icon: "👔" },
    { id: "Flooring", label: "Flooring Solutions", icon: "📐" }
  ];

  const materialQualities = [
    { value: "Basic", label: "Basic", multiplier: 1 },
    { value: "Premium", label: "Premium", multiplier: 1.5 },
    { value: "Luxury", label: "Luxury", multiplier: 2.2 }
  ];

  // Handlers
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setError("");
  };

  const handleServiceToggle = (serviceId) => {
    const services = [...formData.services];
    const index = services.indexOf(serviceId);
    if (index > -1) {
      services.splice(index, 1);
    } else {
      services.push(serviceId);
    }
    setFormData({ ...formData, services });
  };

  const handleCalculate = () => {
    // Validation
    if (!formData.room_size || formData.room_size <= 0) {
      setError("Please enter a valid room size");
      return;
    }
    if (formData.services.length === 0) {
      setError("Please select at least one service");
      return;
    }

    setLoading(true);
    setError("");

    // calculation for demo (replace with backend call if needed)
    const basePrice = 1000 * Number(formData.room_size);
    const servicesTotal = formData.services.length * 500;
    const subtotal = basePrice + servicesTotal;
    const qualityMultiplier = materialQualities.find(m => m.value === formData.material_quality)?.multiplier || 1;
    const adjusted = subtotal * qualityMultiplier;
    const gst = adjusted * 0.18;
    const total = adjusted + gst;

    setEstimate({
      ...formData,
      services: [...formData.services],
      breakdown: {
        base_price: basePrice,
        services_total: servicesTotal,
        subtotal: subtotal,
        quality_adjustment: adjusted - subtotal,
        gst_18_percent: gst,
        estimated_price: total
      },
      estimated_price: total
    });

    setStep(2);
    setLoading(false);
  };

  const handleConsultationSubmit = (e) => {
    e.preventDefault();
    alert("Consultation booked successfully!");
    setShowConsultation(false);
    // Reset form
    setStep(1);
    setFormData({
      room_type: "Living Room",
      room_size: "",
      size_unit: "sqft",
      services: [],
      material_quality: "Basic"
    });
    setEstimate(null);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="pricing-calculator-container">
      <div className="pricing-header">
        <h1>Interior Design Pricing Calculator</h1>
        <p>Get an instant estimate for your dream space</p>
      </div>

      <div className="pricing-content">
        {/* Step 1: Input Form */}
        {step === 1 && (
          <div className="calculator-form">
            {/* Room Type */}
            <div className="form-section">
              <h3>Select Room Type</h3>
              <div className="room-type-grid">
                {roomTypes.map(type => (
                  <button
                    key={type}
                    className={`room-type-btn ${formData.room_type === type ? 'active' : ''}`}
                    onClick={() => setFormData({ ...formData, room_type: type })}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Room Size */}
            <div className="form-section">
              <h3>Room Size</h3>
              <div className="size-input-group">
                <input
                  type="number"
                  name="room_size"
                  placeholder="Enter size"
                  value={formData.room_size}
                  onChange={handleInputChange}
                  className="size-input"
                />
                <select
                  name="size_unit"
                  value={formData.size_unit}
                  onChange={handleInputChange}
                  className="unit-select"
                >
                  <option value="sqft">sq ft</option>
                  <option value="sqm">sq m</option>
                </select>
              </div>
            </div>

            {/* Services */}
            <div className="form-section">
              <h3>Services Required</h3>
              <div className="services-grid">
                {servicesList.map(service => (
                  <label key={service.id} className="service-checkbox">
                    <input
                      type="checkbox"
                      checked={formData.services.includes(service.id)}
                      onChange={() => handleServiceToggle(service.id)}
                    />
                    <div className="service-card">
                      <span className="service-icon">{service.icon}</span>
                      <span className="service-label">{service.label}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Material Quality */}
            <div className="form-section">
              <h3>Material Quality</h3>
              <div className="quality-options">
                {materialQualities.map(quality => (
                  <label key={quality.value} className="quality-option">
                    <input
                      type="radio"
                      name="material_quality"
                      value={quality.value}
                      checked={formData.material_quality === quality.value}
                      onChange={handleInputChange}
                    />
                    <div className="quality-card">
                      <div className="quality-header">
                        <span className="quality-name">{quality.label}</span>
                        <span className="quality-multiplier">{quality.multiplier}x</span>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {error && <p className="error-message">{error}</p>}

            <button onClick={handleCalculate} className="calculate-btn" disabled={loading}>
              {loading ? "Calculating..." : "Calculate Estimate"}
            </button>
          </div>
        )}

        {/* Step 2: Estimate */}
        {step === 2 && estimate && (
          <div className="estimate-summary">
            <div className="summary-card">
              <h2>Your Estimate Summary</h2>

              <div className="summary-details">
                <div className="detail-item">
                  <span className="detail-label">Room Type:</span>
                  <span className="detail-value">{estimate.room_type}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Room Size:</span>
                  <span className="detail-value">{estimate.room_size} {estimate.size_unit}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Material Quality:</span>
                  <span className="detail-value">{estimate.material_quality}</span>
                </div>
              </div>

              <div className="selected-services">
                <h3>Selected Services:</h3>
                <ul>
                  {(estimate.services || []).map(s => <li key={s}>✅ {s}</li>)}
                </ul>
              </div>

              <div className="price-breakdown">
                <div className="breakdown-item">
                  <span>Base Price</span>
                  <span>{formatCurrency(estimate.breakdown.base_price)}</span>
                </div>
                <div className="breakdown-item">
                  <span>Services Total</span>
                  <span>{formatCurrency(estimate.breakdown.services_total)}</span>
                </div>
                <div className="breakdown-item subtotal">
                  <span>Subtotal</span>
                  <span>{formatCurrency(estimate.breakdown.subtotal)}</span>
                </div>
                <div className="breakdown-item">
                  <span>Quality Adjustment</span>
                  <span>+{formatCurrency(estimate.breakdown.quality_adjustment)}</span>
                </div>
                <div className="breakdown-item">
                  <span>GST (18%)</span>
                  <span>{formatCurrency(estimate.breakdown.gst_18_percent)}</span>
                </div>
                <div className="breakdown-item total">
                  <span>Total Estimate</span>
                  <span>{formatCurrency(estimate.breakdown.estimated_price)}</span>
                </div>
              </div>

              <div className="action-buttons">
                <button onClick={() => setShowConsultation(true)} className="consultation-btn">Book Consultation</button>
                <button onClick={() => setStep(1)} className="recalculate-btn">Recalculate</button>
              </div>
            </div>
          </div>
        )}

        {/* Consultation Modal */}
        {showConsultation && (
          <div className="modal-overlay">
            <div className="consultation-modal">
              <button className="close-modal-btn" onClick={() => setShowConsultation(false)}>×</button>
              <h2>Book Your Consultation</h2>
              <form onSubmit={handleConsultationSubmit}>
                <input type="text" placeholder="Full Name" required onChange={e => setConsultationData({...consultationData, name: e.target.value})} />
                <input type="email" placeholder="Email" required onChange={e => setConsultationData({...consultationData, email: e.target.value})} />
                <input type="tel" placeholder="Phone" required onChange={e => setConsultationData({...consultationData, phone: e.target.value})} />
                <input type="date" required onChange={e => setConsultationData({...consultationData, preferred_date: e.target.value})} />
                <input type="time" required onChange={e => setConsultationData({...consultationData, preferred_time: e.target.value})} />
                <textarea placeholder="Additional notes" rows="3" onChange={e => setConsultationData({...consultationData, message: e.target.value})}></textarea>
                <button type="submit">Confirm Consultation</button>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default PricingCalculator;
