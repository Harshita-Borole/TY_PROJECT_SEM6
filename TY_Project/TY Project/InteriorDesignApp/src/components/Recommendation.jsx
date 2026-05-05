import React, { useEffect, useState } from "react";
import axios from "axios";
import "./Recommendation.css";

// ✅ Now accepts roomData and onBack as props from Dashboard
// No more useLocation / useNavigate needed
function Recommendation({ roomData, onBack }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalChecked, setTotalChecked] = useState(0);

  useEffect(() => {
    if (!roomData) {
      setLoading(false);
      return;
    }

    const fetchRecommendations = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log("📤 Sending room details:", roomData);

        const res = await axios.post("http://localhost:5000/api/recommend", {
          length: roomData.length,
          width: roomData.width,
          height: roomData.height,
          type: roomData.type
        });

        console.log("📥 Response from backend:", res.data);

        setProducts(res.data.recommended || []);
        setTotalChecked(res.data.total_products || 0);
      } catch (err) {
        console.error("❌ Recommendation fetch error:", err);
        setError(
          err.response?.data?.error ||
          "Failed to fetch recommendations. Make sure the backend is running."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, [roomData]);

  // 🔴 No room data
  if (!roomData) {
    return (
      <div className="recommendation-container">
        <p className="no-data">No room data provided.</p>
        <button className="back-btn" onClick={onBack}>
          ← Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="recommendation-container">
      <h2 className="title">Recommended Products</h2>

      {/* Room summary */}
      <div className="room-summary">
        <span>
          📐 Room:{" "}
          <strong>
            {roomData.length} × {roomData.width} × {roomData.height} cm
          </strong>
          &nbsp;|&nbsp; 🏠 Type: <strong>{roomData.type}</strong>
        </span>

        {!loading && (
          <span>
            &nbsp;|&nbsp; Checked <strong>{totalChecked}</strong> products,
            found <strong>{products.length}</strong> that fit
          </span>
        )}
      </div>

      {loading ? (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Finding the best {roomData.type} products for your room...</p>
        </div>
      ) : error ? (
        <div className="error-state">
          <p className="error-msg">⚠️ {error}</p>
          <button className="back-btn" onClick={onBack}>
            ← Try Again
          </button>
        </div>
      ) : products.length === 0 ? (
        <div className="no-results">
          <p className="no-data">
            😕 No <strong>{roomData.type}</strong> products fit your room
            dimensions ({roomData.length} × {roomData.width} × {roomData.height} cm).
          </p>

          <p className="hint">
            💡 Make sure you entered dimensions in centimetres, not metres.
            <br />
            Example: 5m × 4m → 500 × 400
          </p>

          <button className="back-btn" onClick={onBack}>
            ← Change Room Details
          </button>
        </div>
      ) : (
        <>
          {/* PRODUCTS */}
          <div className="product-grid">
            {products.map((p, index) => (
              <div key={p._id || index} className="product-card">
                <div className="product-image-wrap">
                  <img
                    src={p.image}
                    alt={p.name}
                    onError={(e) => {
                      e.target.src =
                        "https://via.placeholder.com/300x200?text=No+Image";
                    }}
                  />
                </div>

                <div className="product-info">
                  <h3>{p.name}</h3>
                  <p className="category">🏷️ {p.category}</p>
                  <p className="size">
                    📏 {p.length} × {p.width} × {p.height} cm
                  </p>

                  {p.description && (
                    <p className="description">{p.description}</p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* FINAL BUTTONS */}
          <div className="button-group">
            <button className="back-btn" onClick={onBack}>
              🏠 Back to Room Input
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default Recommendation;