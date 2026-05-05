import React, { useState } from "react";
import "./Aiinspiration.css";

export default function AIInspiration() {
  const [step, setStep] = useState(1);
  const [roomImage, setRoomImage] = useState(null);
  const [roomPreview, setRoomPreview] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [selectedDecor, setSelectedDecor] = useState([]);
  const [generatedImage, setGeneratedImage] = useState("");
  const [loading, setLoading] = useState(false);
  const [imgLoading, setImgLoading] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [error, setError] = useState("");

  // ================= STEP 1: Upload Room =================
  const handleRoomUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setRoomImage(file);
    setRoomPreview(URL.createObjectURL(file));
    setStep(2);
  };

  // ================= STEP 2: Search Decor =================
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    try {
      const res = await fetch(
        `http://localhost:5000/api/search-decor?q=${encodeURIComponent(searchQuery)}`
      );
      const data = await res.json();
      setSearchResults(data.results || []);
    } catch (err) {
      console.error(err);
      setError("Search failed");
    }
  };

  const addDecor = (item) => {
    if (!selectedDecor.find((d) => d.id === item.id)) {
      setSelectedDecor((prev) => [...prev, item]);
    }
  };

  const removeDecor = (id) => {
    setSelectedDecor((prev) => prev.filter((d) => d.id !== id));
  };

  // ================= STEP 3: Generate =================
  const generate = async () => {
    if (!roomImage) {
      setError("Upload room image first");
      return;
    }
    if (selectedDecor.length === 0) {
      setError("Select at least one decor item");
      return;
    }

    setError("");
    setLoading(true);
    setStep(3);

    try {
      const formData = new FormData();
      formData.append("roomImage", roomImage);
      formData.append(
        "selectedItems",
        JSON.stringify(selectedDecor.map((d) => d.displayName))
      );

      const res = await fetch(
        "http://localhost:5000/api/generate-inspiration",
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Generation failed");

      setImgLoading(true);
      setImgError(false);
      setGeneratedImage(data.generatedImageUrl + `&t=${Date.now()}`);
      setStep(4);
    } catch (err) {
      console.error(err);
      setError(err.message);
      setStep(2);
    } finally {
      setLoading(false);
    }
  };

  // ================= RESET =================
  const reset = () => {
    setStep(1);
    setRoomImage(null);
    setRoomPreview("");
    setSearchQuery("");
    setSearchResults([]);
    setSelectedDecor([]);
    setGeneratedImage("");
    setError("");
    setImgError(false);
  };

  return (
    <div className="ai-wrap">
      <h2>✨ AI Room Inspiration</h2>

      {error && <p className="error-msg">{error}</p>}

      {/* ===== STEP 1: Upload ===== */}
      {step === 1 && (
        <div className="step-card">
          <h3>Step 1: Upload Your Room Photo</h3>
          <p>Upload a photo of your room to get started.</p>
          <label className="upload-btn">
            📷 Choose Room Image
            <input
              type="file"
              accept="image/*"
              onChange={handleRoomUpload}
              hidden
            />
          </label>
        </div>
      )}

      {/* ===== STEP 2: Search & Select Decor ===== */}
      {step === 2 && (
        <div className="step-card">
          <h3>Step 2: Search & Select Décor Items</h3>

          {roomPreview && (
            <img src={roomPreview} alt="Room" className="room-thumb" />
          )}

          <div className="search-row">
            <input
              type="text"
              placeholder="Search decor (e.g. sofa, lamp, rug...)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="search-input"
            />
            <button onClick={handleSearch} className="search-btn">
              🔍 Search
            </button>
          </div>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="results-grid">
              {searchResults.map((item) => (
                <div
                  key={item.id}
                  className={`result-item ${
                    selectedDecor.find((d) => d.id === item.id)
                      ? "selected"
                      : ""
                  }`}
                  onClick={() => addDecor(item)}
                >
                  <img src={item.image} alt={item.displayName} />
                  <p>{item.displayName?.slice(0, 40)}</p>
                </div>
              ))}
            </div>
          )}

          {/* Selected Items */}
          {selectedDecor.length > 0 && (
            <div className="selected-section">
              <h4>✅ Selected Items ({selectedDecor.length})</h4>
              <div className="selected-grid">
                {selectedDecor.map((item) => (
                  <div key={item.id} className="selected-item">
                    <img src={item.image} alt={item.displayName} />
                    <button
                      onClick={() => removeDecor(item.id)}
                      className="remove-btn"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>

              <button onClick={generate} className="generate-btn">
                🪄 Generate My Room
              </button>
            </div>
          )}
        </div>
      )}

      {/* ===== STEP 3: Loading ===== */}
      {step === 3 && loading && (
        <div className="step-card loading-card">
          <div className="spinner" />
          <h3>⏳ Generating your dream room...</h3>
          <p>This may take 20–40 seconds. Please wait.</p>
        </div>
      )}

      {/* ===== STEP 4: Result ===== */}
      {step === 4 && (
        <div className="step-card">
          <h3>🏠 Your AI-Redesigned Room</h3>
          <p>Here's how your room could look with your selected décor.</p>

          <div className="result-row">
            {/* Original */}
            <div className="result-box">
              <p className="box-label">🛋 ORIGINAL ROOM</p>
              <img src={roomPreview} alt="Original" className="result-image" />
            </div>

            <div className="arrow">→</div>

            {/* Generated */}
            <div className="result-box ai-box">
              <p className="box-label ai-label">✨ AI REDESIGNED</p>

              {imgLoading && !imgError && (
                <p className="loading-text">
                  ⏳ Loading image... (20–40 seconds)
                </p>
              )}

              {imgError && (
                <p className="error-msg">
                  ❌ Image failed to load. Please try again.
                </p>
              )}

              {generatedImage && (
                <img
                  src={generatedImage}
                  alt="AI Redesigned Room"
                  className="result-image"
                  style={{ display: imgLoading ? "none" : "block" }}
                  onLoad={() => setImgLoading(false)}
                  onError={() => {
                    setImgLoading(false);
                    setImgError(true);
                  }}
                />
              )}
            </div>
          </div>

          {/* Selected decor used */}
          <div className="used-items">
            <h4>🛍 Décor Items Used:</h4>
            <div className="selected-grid">
              {selectedDecor.map((item) => (
                <div key={item.id} className="selected-item">
                  <img src={item.image} alt={item.displayName} />
                </div>
              ))}
            </div>
          </div>

          <div className="action-btns">
            <button onClick={() => setStep(2)} className="secondary-btn">
              ← Try Different Décor
            </button>
            <button onClick={reset} className="generate-btn">
              🔄 Start Over
            </button>
          </div>
        </div>
      )}
    </div>
  );
}