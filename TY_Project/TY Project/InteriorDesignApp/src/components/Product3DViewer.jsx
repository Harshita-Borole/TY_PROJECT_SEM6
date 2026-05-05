import React, { useState } from "react";
import Product3DViewer from "./Product3DViewer";
import MiniModelPreview from "./MiniModelPreview";
import "./Product3DExperience.css";

const products = [
  { name: "Bed", model: "/models/Bed.glb", description: "Comfortable double bed", color: "#e3f2fd" },
  { name: "Bunk Bed", model: "/models/Bunk Bed.glb", description: "Space-saving bunk bed", color: "#f3e5f5" },
  { name: "Chair", model: "/models/Chair.glb", description: "Elegant dining chair", color: "#e8f5e9" },
  { name: "Coffee Plant", model: "/models/Coffee plant.glb", description: "Indoor coffee plant", color: "#e8f5e9" },
  { name: "Couch", model: "/models/Couch Large.glb", description: "Large couch", color: "#fff8e1" },
  { name: "Drawer", model: "/models/Drawer.glb", description: "Storage drawer", color: "#fdf0e8" },
  { name: "Lamp", model: "/models/Lamp.glb", description: "Modern lamp", color: "#fff8e1" },
  { name: "Office Chair", model: "/models/Office Chair.glb", description: "Ergonomic office chair", color: "#e8eaf6" },
  { name: "Side Table", model: "/models/Side table.glb", description: "Compact table", color: "#fce4ec" },
  { name: "Table", model: "/models/Table.glb", description: "Wood dining table", color: "#efebe9" },
];


export default function Product3DExperience() {
  const [selectedProduct, setSelectedProduct] = useState(null);

  const handleCardClick = (product) => {
    setSelectedProduct(product);
  };

  return (
    <div className="p3d-page">
      <h2 className="p3d-title">🛋️ Interactive 3D Product View</h2>
      <p className="p3d-sub">Select furniture to preview inside a room.</p>

      <div className="p3d-grid">
        {products.map((product) => (
          <div key={product.name} className="p3d-card">
            <div className="p3d-img-box">
              <MiniModelPreview modelPath={product.model} />
            </div>

            <div className="p3d-card-body">
              <h3 className="p3d-name">{product.name}</h3>
              <p className="p3d-desc">{product.description}</p>

              <button
                className="p3d-btn"
                onClick={() => handleCardClick(product)}
              >
                View in Room
              </button>
            </div>
          </div>
        ))}
      </div>

      {selectedProduct && (
        <Product3DViewer
          modelPath={selectedProduct.model}
          productName={selectedProduct.name}
          onClose={() => setSelectedProduct(null)}
        />
      )}
    </div>
  );
}