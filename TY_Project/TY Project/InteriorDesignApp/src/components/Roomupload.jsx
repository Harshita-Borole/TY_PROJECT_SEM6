import React, { useRef, useState } from "react";

export default function RoomUpload({ roomImage, onUpload }) {
  const inputRef   = useRef(null);
  const [drag, setDrag] = useState(false);

  const processFile = (file) => {
    if (!file || !file.type.startsWith("image/")) return;
    const preview = URL.createObjectURL(file);
    onUpload({ file, preview });
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDrag(false);
    processFile(e.dataTransfer.files[0]);
  };

  return (
    <div className="upload-section">
      <h3 className="step-heading">📷 Step 1 — Upload Your Room</h3>
      <p className="step-desc">Upload a photo of your room to get started.</p>

      {/* Drop zone */}
      <div
        className={`drop-zone ${drag ? "drop-zone--drag" : ""} ${roomImage ? "drop-zone--has-image" : ""}`}
        onClick={() => inputRef.current.click()}
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={handleDrop}
      >
        {roomImage ? (
          <img src={roomImage.preview} alt="Room preview" className="drop-preview" />
        ) : (
          <div className="drop-placeholder">
            <span className="drop-icon">🏠</span>
            <p className="drop-text">Click or drag & drop your room photo here</p>
            <p className="drop-hint">Supports JPG, PNG, WEBP</p>
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={(e) => processFile(e.target.files[0])}
      />

      <div className="upload-actions">
        <button className="upload-btn" onClick={() => inputRef.current.click()}>
          {roomImage ? "Change Image" : "Choose Image"}
        </button>
        {roomImage && (
          <button
            className="upload-btn upload-btn--next"
            onClick={() => onUpload(roomImage)}
          >
            Next — Choose Décor →
          </button>
        )}
      </div>
    </div>
  );
}