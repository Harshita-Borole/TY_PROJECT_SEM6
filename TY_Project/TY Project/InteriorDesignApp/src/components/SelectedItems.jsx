import React from "react";

export default function SelectedItems({ items, onRemove, onGenerate, disabled }) {
  if (items.length === 0) {
    return (
      <div className="selected-empty">
        <p>🛒 No items selected yet. Search and select décor items above.</p>
      </div>
    );
  }

  return (
    <div className="selected-section">
      <h4 className="selected-title">
        🛒 Selected Items ({items.length})
      </h4>

      <div className="selected-grid">
        {items.map((item) => (
          <div key={item.name} className="selected-card">
            <img
              src={item.image}
              alt={item.displayName || item.name}
              className="selected-img"
            />
            <p className="selected-name">{item.displayName || item.name}</p>
            <button
              className="remove-btn"
              onClick={() => onRemove(item.name)}
              title="Remove"
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      <button
        className="generate-btn"
        onClick={onGenerate}
        disabled={disabled}
      >
        ✨ Generate AI Inspiration ({items.length} items)
      </button>
    </div>
  );
}