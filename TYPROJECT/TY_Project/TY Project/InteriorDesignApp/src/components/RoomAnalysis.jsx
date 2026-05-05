// RoomAnalysis.jsx
import React, { useState } from "react";
import "./RoomAnalysis.css";

function RoomAnalysis() {
  const [image, setImage] = useState(null);
  const [imageUrl, setImageUrl] = useState("");
  const [analysis, setAnalysis] = useState("");
  const [inspiration, setInspiration] = useState("");
  const [loading, setLoading] = useState(false);

  // ===== Upload Image =====
  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImage(file);

    const formData = new FormData();
    formData.append("image", file); // backend expects 'image', not 'file'

    setLoading(true);
    try {
      const res = await fetch("http://127.0.0.1:5000/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        throw new Error(`Upload failed with status: ${res.status}`);
      }

      const data = await res.json();
      console.log("Upload response:", data);

      // Backend returns { "url": "https://..." }
      if (data.url) {
        setImageUrl(data.url);
        console.log("✅ Image URL set:", data.url);
      } else {
        console.error("No image URL found in response:", data);
        alert("Upload succeeded but no image URL returned.");
      }
    } catch (err) {
      console.error("Upload failed:", err);
      alert(`Image upload failed: ${err.message}`);
    }
    setLoading(false);
  };

  // ===== Analyze Room =====
  const handleAnalyze = async () => {
    if (!imageUrl) {
      alert("Please upload an image first.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("http://127.0.0.1:5000/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl }), // matches backend
      });

      if (!res.ok) {
        throw new Error(`Analysis failed with status: ${res.status}`);
      }

      const data = await res.json();
      console.log("Analysis response:", data);

      const aiText = data.analysis || "No analysis found.";
      setAnalysis(aiText);
    } catch (err) {
      console.error("Analysis failed:", err);
      alert(`AI analysis failed: ${err.message}`);
    }
    setLoading(false);
  };

  // ===== Generate Inspiration Image =====
  // ===== Generate Inspiration Image =====
const handleGenerateInspiration = async () => {
  if (!imageUrl || !analysis) {
    alert("Please upload and analyze the image first.");
    return;
  }

  setLoading(true);
  try {
    const res = await fetch("http://127.0.0.1:5000/api/generate-room-image", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        imageUrl,
        suggestions: analysis,
      }),
    });

    if (!res.ok) {
      throw new Error(`Generation failed with status: ${res.status}`);
    }

    const data = await res.json();
    console.log("Generation response:", data);

    // Access the correct field from backend
    const generatedUrl =
      data.generatedImageUrl || data.url || data.image_url || data.result;

    if (generatedUrl) {
      setInspiration(generatedUrl);
      console.log("✅ Inspiration Image Set:", generatedUrl);
    } else {
      console.error("⚠️ No generated image URL found:", data);
      alert("Generation succeeded but no image URL returned.");
    }
  } catch (err) {
    console.error("Image generation failed:", err);
    alert(`Image generation failed: ${err.message}`);
  }
  setLoading(false);
};


  return (
    <div className="room-analysis-container">
      <div className="content-wrapper">
        <div className="header">
          <h2 className="title">🏠 Smart Room Design Analyzer</h2>
          <p className="subtitle">
            Upload your room photo and get AI-powered design insights
          </p>
        </div>

        <div className="main-card">
          <div className="upload-section">
            <label className="upload-label">Upload Room Image</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleUpload}
              className="file-input"
            />
            {loading && <p className="upload-status">Processing...</p>}
            {imageUrl && (
              <p className="upload-status success">
                ✓ Image uploaded successfully!
              </p>
            )}
          </div>

          {imageUrl && (
            <div className="image-preview">
              <img src={imageUrl} alt="Uploaded Room" className="preview-image" />
            </div>
          )}

          <div className="buttons">
            <button
              onClick={handleAnalyze}
              disabled={loading || !imageUrl}
              className="btn btn-analyze"
            >
              {loading ? "Analyzing..." : "Analyze Room"}
            </button>
            <button
              onClick={handleGenerateInspiration}
              disabled={loading || !imageUrl || !analysis}
              className="btn btn-generate"
            >
              {loading ? "Generating..." : "Generate Inspiration"}
            </button>
          </div>
        </div>

        {analysis && (
          <div className="analysis-card">
            <h3 className="card-title">✨ AI Room Design Analysis</h3>
            <div
              className="analysis-content"
              dangerouslySetInnerHTML={{ __html: analysis }}
            />
          </div>
        )}

        {inspiration && (
          <div className="analysis-card">
            <h3 className="card-title">🎨 AI-Generated Room Inspiration</h3>
            <img
              src={inspiration}
              alt="Generated Room"
              className="preview-image"
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default RoomAnalysis;
