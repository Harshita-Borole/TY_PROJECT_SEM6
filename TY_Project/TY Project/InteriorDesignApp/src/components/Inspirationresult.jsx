import React, { useState } from "react";

export default function InspirationResult({ originalImage, result, onReset, onBack }) {
  const [comparing, setComparing] = useState(false);

  const { output_url, suggestions = [], prompt = "", selected_items = [] } = result;

  return (
    <div className="result-section">
      <div className="result-header">
        <h3 className="step-heading">🏠 Your AI-Redesigned Room</h3>
        <p className="step-desc">
          Here's how your room could look with your selected décor.
        </p>
      </div>

      {/* ── Before / After comparison ── */}
      <div className="compare-wrap">
        <div className="compare-card">
          <p className="compare-label">📷 Original Room</p>
          <img src={originalImage} alt="Original room" className="compare-img" />
        </div>

        <div className="compare-arrow">→</div>

        <div className="compare-card compare-card--result">
          <p className="compare-label">✨ AI Redesigned</p>
          {output_url ? (
            <img src={`http://localhost:5000${output_url}`} alt="AI redesigned room" className="compare-img" />
          ) : (
            <div className="result-placeholder">
              <p>Image generation complete.</p>
              <p className="result-placeholder-sub">
                (Stable Diffusion output would appear here in production)
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── Selected items used ── */}
      {selected_items.length > 0 && (
        <div className="used-items">
          <p className="used-label">Items used in generation:</p>
          <div className="used-pills">
            {selected_items.map((item) => (
              <span key={item} className="used-pill">{item}</span>
            ))}
          </div>
        </div>
      )}

      {/* ── AI Prompt used ── */}
      {prompt && (
        <div className="prompt-box">
          <p className="prompt-label">🤖 AI Prompt Used</p>
          <p className="prompt-text">{prompt}</p>
        </div>
      )}

      {/* ── Placement suggestions ── */}
      {suggestions.length > 0 && (
        <div className="suggestions-section">
          <h4 className="suggestions-title">💡 Design Placement Suggestions</h4>
          <div className="suggestions-list">
            {suggestions.map((s, i) => (
              <div key={i} className="suggestion-card">
                <span className="suggestion-num">{i + 1}</span>
                <p className="suggestion-text">{s}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Download + actions ── */}
      <div className="result-actions">
        {output_url && (
          <a
            href={`http://localhost:5000${output_url}`}
            download="ai-room-design.jpg"
            className="download-btn"
          >
            ⬇ Download Design
          </a>
        )}
        <button className="result-back-btn" onClick={onBack}>
          ← Try Different Décor
        </button>
        <button className="result-reset-btn" onClick={onReset}>
          🔄 Start Over
        </button>
      </div>
    </div>
  );
}