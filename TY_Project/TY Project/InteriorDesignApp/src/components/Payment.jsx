import React, { useState } from "react";
import "./Payment.css";
import { useNavigate } from "react-router-dom";

const Payment = () => {
  const navigate = useNavigate();

  const [cardNumber, setCardNumber] = useState("");
  const [name, setName] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");

  const handlePayment = (e) => {
    e.preventDefault();

    if (!cardNumber || !name || !expiry || !cvv) {
      alert("Please fill all fields");
      return;
    }

    alert("Payment Successful 🎉");
    navigate("/");
  };

  return (
    <div className="payment-section">   {/* ✅ was "payment-container" */}
      <h2>Complete Your Payment</h2>

      <div className="payment-form">    {/* ✅ changed form to div to avoid default form layout issues */}
        <input
          type="text"
          placeholder="Card Number"
          value={cardNumber}
          onChange={(e) => setCardNumber(e.target.value)}
        />

        <input
          type="text"
          placeholder="Card Holder Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <input
          type="text"
          placeholder="Expiry Date (MM/YY)"
          value={expiry}
          onChange={(e) => setExpiry(e.target.value)}
        />

        <input
          type="password"
          placeholder="CVV"
          value={cvv}
          onChange={(e) => setCvv(e.target.value)}
        />

        <button onClick={handlePayment}>Pay Now</button>
      </div>
    </div>
  );
};

export default Payment;