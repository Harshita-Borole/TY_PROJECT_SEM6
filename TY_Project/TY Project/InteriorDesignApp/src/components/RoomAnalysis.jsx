import React, { useState } from "react";
import "./RoomAnalysis.css";

function RoomAnalysis() {
  const [image, setImage] = useState(null);
  const [imageUrl, setImageUrl] = useState("");
  const [analysis, setAnalysis] = useState("");
  const [inspiration, setInspiration] = useState("");
  const [inspirationLoading, setInspirationLoading] = useState(false);

  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [generating, setGenerating] = useState(false);

  // ================= UPLOAD =================
  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setImage(file);

    const formData = new FormData();
    formData.append("image", file);

    setUploading(true);

    try {
      const res = await fetch("http://127.0.0.1:5000/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      console.log("Upload response:", data);

      const url = data.url || data.imageUrl || data.image_url;

      if (url) {
        setImageUrl(url);
      } else {
        alert("Upload failed: no URL returned");
      }
    } catch (err) {
      console.error(err);
      alert("Upload failed");
    }

    setUploading(false);
  };

  // ================= ANALYZE =================
  const handleAnalyze = async () => {
    if (!imageUrl) return alert("Upload image first");

    setAnalyzing(true);

    try {
      const res = await fetch("http://127.0.0.1:5000/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl }),
      });

      const data = await res.json();
      console.log("Analysis response:", data);

      setAnalysis(data.raw_text || data.suggestions || "No analysis found");
    } catch (err) {
      console.error(err);
      alert("Analysis failed");
    }

    setAnalyzing(false);
  };

  // ================= GENERATE IMAGE =================
  // ================= GENERATE IMAGE =================
const handleGenerateInspiration = async () => {
  if (!imageUrl || !analysis) {
    return alert("Upload & analyze first");
  }

  setGenerating(true);
  setInspiration("");
  setInspirationLoading(true);

  try {
    const res = await fetch(
      "http://127.0.0.1:5000/api/generate-room-image",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageUrl,
          suggestions: analysis,
        }),
      }
    );

    const data = await res.json();
    console.log("Generate response:", data);

    let url =
      data.generatedImageUrl ||
      data.url ||
      data.image_url ||
      data.result;

    if (url && typeof url === "string") {
      url = decodeURIComponent(url);
    }

    if (url) {
      const proxyUrl = `http://127.0.0.1:5000/api/proxy-image?url=${encodeURIComponent(url)}`;
      setTimeout(() => {
        setInspiration(proxyUrl + `&t=${Date.now()}`);
      }, 100);
    } else {
      alert("No image generated");
      setInspirationLoading(false);
    }
  } catch (err) {
    console.error(err);
    alert("Generation failed");
    setInspirationLoading(false);
  }

  setGenerating(false);
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

            {uploading && <p className="upload-status">Uploading...</p>}
            {imageUrl && (
              <p className="upload-status success">
                ✓ Image uploaded successfully!
              </p>
            )}
          </div>

          {imageUrl && (
            <div className="image-preview">
              <img
                src={imageUrl}
                alt="Uploaded Room"
                className="preview-image"
              />
            </div>
          )}

          <div className="buttons">
            <button
              onClick={handleAnalyze}
              disabled={analyzing || !imageUrl}
              className="btn btn-analyze"
            >
              {analyzing ? "Analyzing..." : "Analyze Room"}
            </button>

            <button
              onClick={handleGenerateInspiration}
              disabled={generating || !analysis}
              className="btn btn-generate"
            >
              {generating ? "Generating..." : "Generate Inspiration"}
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

            {inspirationLoading && (
              <p className="upload-status">
                ⏳ Loading generated image... (this may take 10–20 seconds)
              </p>
            )}

            <img
              src={inspiration}
              alt="Generated Room"
              className="preview-image"
              onLoad={() => {
                console.log("✅ Inspiration image loaded!");
                setInspirationLoading(false);
              }}
              onError={(e) => {
                console.error("❌ Inspiration image failed to load");
                setInspirationLoading(false);
                e.target.style.display = "none";
                alert(
                  "Image failed to load. Pollinations may be slow — please try again."
                );
              }}
              style={{ display: inspirationLoading ? "none" : "block" }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default RoomAnalysis;