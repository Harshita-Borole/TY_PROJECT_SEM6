import React, { useState, lazy, Suspense } from "react";
import MiniModelPreview from "./MiniModelPreview"; // ← real GLB preview in cards
import "./Product3DExperience.css";

// Lazy load the heavy 3D room only when needed
const RoomPlanner3D = lazy(() => import("./RoomPlanner3D"));

const CATALOG = [
  { name: "Bed",          model: "/models/Bed.glb",          desc: "Comfortable double bed",  bg: "#e3f2fd" },
  { name: "Bunk Bed",     model: "/models/Bunk Bed.glb",     desc: "Space-saving bunk bed",   bg: "#f3e5f5" },
  { name: "Chair",        model: "/models/Chair.glb",         desc: "Elegant dining chair",    bg: "#e8f5e9" },
  { name: "Coffee Plant", model: "/models/Coffee plant.glb",  desc: "Indoor coffee plant",     bg: "#e8f5e9" },
  { name: "Couch",        model: "/models/Couch Large.glb",   desc: "Large L-shaped couch",   bg: "#fff8e1" },
  { name: "Drawer",       model: "/models/Drawer.glb",        desc: "Wooden storage drawer",   bg: "#fdf0e8" },
  { name: "Lamp",         model: "/models/Lamp.glb",          desc: "Modern floor lamp",       bg: "#fff8e1" },
  { name: "Office Chair", model: "/models/Office Chair.glb",  desc: "Ergonomic office chair",  bg: "#e8eaf6" },
  { name: "Side Table",   model: "/models/Side table.glb",    desc: "Compact bedside table",   bg: "#fce4ec" },
  { name: "Table",        model: "/models/Table.glb",         desc: "Solid wood dining table", bg: "#efebe9" },
];

// Error boundary — 3D room crash won't kill the page
class SafeBoundary extends React.Component {
  state = { crashed: false, msg: "" };
  static getDerivedStateFromError(e) { return { crashed: true, msg: e.message }; }
  render() {
    if (this.state.crashed) return (
      <div className="p3d-crash">
        <p>⚠️ 3D room failed: {this.state.msg}</p>
        <button onClick={() => this.setState({ crashed: false })}>Retry</button>
      </div>
    );
    return this.props.children;
  }
}

export default function Product3DExperience() {
  const [roomItems, setRoomItems] = useState([]);
  const [roomOpen,  setRoomOpen]  = useState(false);

  const addToRoom = (product) => {
    const instanceId = `${product.name}-${Date.now()}`;
    setRoomItems((prev) => [...prev, { ...product, instanceId }]);
    setRoomOpen(true);
    setTimeout(() => {
      document.getElementById("room-anchor")?.scrollIntoView({ behavior: "smooth" });
    }, 300);
  };

  const removeFromRoom = (instanceId) =>
    setRoomItems((prev) => prev.filter((i) => i.instanceId !== instanceId));

  const clearRoom = () => { setRoomItems([]); setRoomOpen(false); };

  return (
    <div className="p3d-page">

      {/* Header */}
      <div className="p3d-header">
        <h2 className="p3d-title">🏠 Virtual Room Planner</h2>
        <p className="p3d-sub">Add furniture → drag &amp; arrange inside a 3D room.</p>
      </div>

      {/* Room bar — shows when items added */}
      {roomItems.length > 0 && (
        <div className="room-bar">
          <div className="room-bar-pills">
            {roomItems.map((item) => (
              <span key={item.instanceId} className="room-pill">
                {item.name}
                <button className="room-pill-x" onClick={() => removeFromRoom(item.instanceId)}>✕</button>
              </span>
            ))}
          </div>
          <div className="room-bar-btns">
            <button className="btn-open"
              onClick={() => {
                setRoomOpen(true);
                setTimeout(() => document.getElementById("room-anchor")?.scrollIntoView({ behavior: "smooth" }), 100);
              }}>
              🏠 Open Room ({roomItems.length})
            </button>
            <button className="btn-clear" onClick={clearRoom}>🗑️ Clear All</button>
          </div>
        </div>
      )}

      {/* Catalog grid — uses MiniModelPreview (real GLB) just like your old code */}
      <p className="catalog-label">📦 Click a product to add it to your room:</p>
      <div className="p3d-grid">
        {CATALOG.map((product) => {
          const count    = roomItems.filter((i) => i.name === product.name).length;
          const isAdded  = count > 0;

          return (
            <div
              key={product.name}
              className={`p3d-card ${isAdded ? "p3d-card--added" : ""}`}
            >
              {/* ── Real GLB preview (same as your old MiniModelPreview) ── */}
              <div className="p3d-img-box" style={{ background: product.bg }}>
                <MiniModelPreview modelPath={product.model} />
                {isAdded && (
                  <span className="p3d-count-badge">×{count} in room</span>
                )}
              </div>

              <div className="p3d-card-body">
                <h3 className="p3d-name">{product.name}</h3>
                <p className="p3d-desc">{product.desc}</p>
                <button className="p3d-add-btn" onClick={() => addToRoom(product)}>
                  ➕ {isAdded ? "Add Another" : "Add to Room"}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* 3D Room — lazy loaded, only when open */}
      {roomOpen && roomItems.length > 0 && (
        <div id="room-anchor" className="room-section">
          <SafeBoundary>
            <Suspense fallback={
              <div className="room-loading">
                <div className="room-spinner" />
                <p>Loading 3D Room...</p>
              </div>
            }>
              <RoomPlanner3D
                items={roomItems}
                onRemoveItem={removeFromRoom}
                onClose={() => setRoomOpen(false)}
              />
            </Suspense>
          </SafeBoundary>
        </div>
      )}
    </div>
  );
}