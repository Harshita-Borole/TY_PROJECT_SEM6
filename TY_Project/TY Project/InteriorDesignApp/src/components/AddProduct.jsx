import React, { useState } from "react";
import axios from "axios";
import "./AddProduct.css";

// ✅ All dimensions are in CENTIMETRES (cm)
// These are realistic furniture dimensions:
// Sofa Small:   200cm long × 80cm wide × 90cm tall
// Sofa Large:   300cm long × 120cm wide × 100cm tall
// A typical room: 500cm × 400cm × 300cm (5m × 4m × 3m ceiling)

const QUICK_PRODUCTS = {
  "Living Room": [
    {
      name: "Sofa Small",
      category: "living room",
      image: "https://images.unsplash.com/photo-1484101403633-562f891dc89a?q=80&w=1174&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      length: 200, width: 80, height: 90,
      description: "Compact sofa, fits rooms 200cm+ long"
    },
    {
      name: "Sofa Large",
      category: "living room",
      image: "https://images.unsplash.com/photo-1664711942326-2c3351e215e6?q=80&w=1117&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      length: 300, width: 120, height: 100,
      description: "Large sofa for spacious living rooms 300cm+"
    },
    {
      name: "TV Unit Small",
      category: "living room",
      image: "https://images.unsplash.com/photo-1738168259543-d0c58e2b91ed?q=80&w=764&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      length: 150, width: 50, height: 60,
      description: "Compact TV unit"
    },
    {
      name: "TV Unit Large",
      category: "living room",
      image: "https://images.unsplash.com/photo-1746439324747-bdda31a83533?q=80&w=1183&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      length: 250, width: 80, height: 70,
      description: "Large TV unit for bigger living rooms"
    },
    {
      name: "Coffee Table",
      category: "living room",
      image: "https://images.unsplash.com/photo-1647967527216-adea2f078e07?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      length: 120, width: 60, height: 45,
      description: "Standard coffee table"
    }
  ],
  "Bedroom": [
    {
      name: "Single Bed",
      category: "bedroom",
      image: "https://plus.unsplash.com/premium_photo-1682377520349-f56f47cb633f?q=80&w=1171&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      length: 200, width: 100, height: 50,
      description: "Single bed for small bedrooms"
    },
    {
      name: "Double Bed",
      category: "bedroom",
      image: "https://images.unsplash.com/photo-1618773928121-c32242e63f39?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      length: 220, width: 180, height: 60,
      description: "Double bed for master bedroom"
    },
    {
      name: "Wardrobe Small",
      category: "bedroom",
      image: "https://plus.unsplash.com/premium_photo-1675615949593-880f20c86ec4?q=80&w=1120&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      length: 100, width: 55, height: 200,
      description: "Small wardrobe"
    },
    {
      name: "Wardrobe Large",
      category: "bedroom",
      image: "https://images.unsplash.com/photo-1631889993877-71e193bf79b8?q=80&w=1074&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      length: 200, width: 60, height: 220,
      description: "Large wardrobe for master bedroom"
    }
  ],
  "Kitchen": [
    {
      name: "Kitchen Table",
      category: "kitchen",
      image: "https://plus.unsplash.com/premium_photo-1684445034959-b3faeb4597d2?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      length: 120, width: 80, height: 75,
      description: "Standard dining table for kitchen"
    },
    {
      name: "Dining Chair",
      category: "kitchen",
      image: "https://images.unsplash.com/photo-1758977404131-d5ed3b6e1684?q=80&w=754&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      length: 45, width: 50, height: 90,
      description: "Dining chair"
    }
  ],
  "Appliances": [
    {
      name: "Refrigerator",
      category: "appliances",
      image: "https://images.unsplash.com/photo-1722603929403-de9e80c46a9a?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      length: 70, width: 65, height: 180,
      description: "Standard refrigerator"
    },
    {
      name: "Washing Machine",
      category: "appliances",
      image: "https://images.unsplash.com/photo-1626806819282-2c1dc01a5e0c?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      length: 60, width: 60, height: 85,
      description: "Front-load washing machine"
    }
  ]
};

function AddProduct() {
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    image: "",
    length: "",
    width: "",
    height: "",
    description: ""
  });

  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData({
      ...formData,
      [name]: type === "number" ? (value === "" ? "" : parseFloat(value)) : value
    });
  };

  const fillData = (product) => {
    setFormData({
      name: product.name,
      category: product.category,
      image: product.image,
      length: Number(product.length),
      width: Number(product.width),
      height: Number(product.height),
      description: product.description
    });
    setSuccessMsg("");
    setErrorMsg("");
    window.scrollTo({ top: document.getElementById("product-form").offsetTop - 20, behavior: "smooth" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setSuccessMsg("");
    setErrorMsg("");

    // Basic validation
    if (!formData.name || !formData.category || !formData.image) {
      setErrorMsg("Please fill in all required fields.");
      setSubmitting(false);
      return;
    }
    if (!formData.length || !formData.width || !formData.height ||
        formData.length <= 0 || formData.width <= 0 || formData.height <= 0) {
      setErrorMsg("All dimensions must be positive numbers in centimetres.");
      setSubmitting(false);
      return;
    }

    try {
      const payload = {
        ...formData,
        length: parseFloat(formData.length),
        width:  parseFloat(formData.width),
        height: parseFloat(formData.height)
      };

      console.log("📤 Submitting product:", payload);
      await axios.post("http://localhost:5000/api/products", payload);

      setSuccessMsg(`✅ "${formData.name}" added successfully!`);
      setFormData({
        name: "", category: "", image: "",
        length: "", width: "", height: "", description: ""
      });
    } catch (err) {
      console.error("❌ Error adding product:", err);
      setErrorMsg(err.response?.data?.error || "Error adding product. Is the backend running?");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="add-container">
      <h2 className="title">Add Product</h2>
      <p className="subtitle">
        All dimensions must be in <strong>centimetres (cm)</strong>.
        A typical sofa is 200×80×90cm. A typical room is 500×400×300cm.
      </p>

      {/* QUICK BUTTONS */}
      <div className="quick-section">
        <h3>⚡ Quick Fill</h3>
        {Object.entries(QUICK_PRODUCTS).map(([category, items]) => (
          <div key={category} className="quick-category">
            <h4>{category}</h4>
            <div className="quick-buttons">
              {items.map((item) => (
                <button
                  key={item.name}
                  type="button"
                  className="quick-btn"
                  onClick={() => fillData(item)}
                  title={`${item.length}×${item.width}×${item.height} cm`}
                >
                  {item.name}
                  <small>{item.length}×{item.width}×{item.height}cm</small>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* FORM */}
      <form id="product-form" onSubmit={handleSubmit} className="product-form">

        {successMsg && <div className="success-banner">{successMsg}</div>}
        {errorMsg   && <div className="error-banner">{errorMsg}</div>}

        <div className="field-group">
          <label>Product Name *</label>
          <input
            name="name"
            placeholder="e.g. Sofa Small"
            value={formData.name}
            onChange={handleChange}
            required
          />
        </div>

        <div className="field-group">
          <label>Category *</label>
          <select name="category" value={formData.category} onChange={handleChange} required>
            <option value="">Select Category</option>
            <option value="living room">Living Room</option>
            <option value="bedroom">Bedroom</option>
            <option value="kitchen">Kitchen</option>
            <option value="appliances">Appliances</option>
          </select>
        </div>

        <div className="field-group">
          <label>Image URL *</label>
          <input
            name="image"
            placeholder="https://..."
            value={formData.image}
            onChange={handleChange}
            required
          />
        </div>

        <div className="dimensions-row">
          <div className="field-group">
            <label>Length (cm) *</label>
            <input
              type="number"
              name="length"
              placeholder="e.g. 200"
              value={formData.length}
              onChange={handleChange}
              required
              min="1"
              step="0.1"
            />
          </div>

          <div className="field-group">
            <label>Width (cm) *</label>
            <input
              type="number"
              name="width"
              placeholder="e.g. 80"
              value={formData.width}
              onChange={handleChange}
              required
              min="1"
              step="0.1"
            />
          </div>

          <div className="field-group">
            <label>Height (cm) *</label>
            <input
              type="number"
              name="height"
              placeholder="e.g. 90"
              value={formData.height}
              onChange={handleChange}
              required
              min="1"
              step="0.1"
            />
          </div>
        </div>

        <div className="field-group">
          <label>Description</label>
          <textarea
            name="description"
            placeholder="Optional description..."
            value={formData.description}
            onChange={handleChange}
            rows={3}
          />
        </div>

        <button type="submit" className="submit-btn" disabled={submitting}>
          {submitting ? "Adding..." : "Add Product"}
        </button>

      </form>
    </div>
  );
}

export default AddProduct;