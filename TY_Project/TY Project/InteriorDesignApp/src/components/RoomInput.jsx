import React, { useState } from "react";
import "./RoomInput.css";

function RoomInput({ onSubmit, onBack }) {
  const [room, setRoom] = useState({
    length: "",
    width: "",
    height: "",
    type: ""
  });

  const handleChange = (e) => {
    setRoom({
      ...room,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const lengthNum = Number(room.length);
    const widthNum = Number(room.width);
    const heightNum = Number(room.height);

    if (
      isNaN(lengthNum) || lengthNum <= 0 ||
      isNaN(widthNum) || widthNum <= 0 ||
      isNaN(heightNum) || heightNum <= 0 ||
      !room.type
    ) {
      alert("Please enter valid room dimensions and select room type.");
      return;
    }

    // ✅ Instead of navigate, call the callback passed from Dashboard
    onSubmit({
      length: lengthNum,
      width: widthNum,
      height: heightNum,
      type: room.type,
    });
  };

  return (
    <div className="room-container">
      <h2 className="room-title">Enter Room Details</h2>

      <form onSubmit={handleSubmit} className="room-form">
        <input
          type="number"
          name="length"
          placeholder="Room Length (cm)"
          value={room.length}
          onChange={handleChange}
          min="1"
          step="0.1"
          required
        />

        <input
          type="number"
          name="width"
          placeholder="Room Width (cm)"
          value={room.width}
          onChange={handleChange}
          min="1"
          step="0.1"
          required
        />

        <input
          type="number"
          name="height"
          placeholder="Room Height (cm)"
          value={room.height}
          onChange={handleChange}
          min="1"
          step="0.1"
          required
        />

        <select
          name="type"
          value={room.type}
          onChange={handleChange}
          required
        >
          <option value="">Select Room Type</option>
          <option value="living room">Living Room</option>
          <option value="bedroom">Bedroom</option>
          <option value="kitchen">Kitchen</option>
          <option value="appliances">Appliances</option>
        </select>

        <button type="submit">Get Recommendation</button>
      </form>
    </div>
  );
}

export default RoomInput;