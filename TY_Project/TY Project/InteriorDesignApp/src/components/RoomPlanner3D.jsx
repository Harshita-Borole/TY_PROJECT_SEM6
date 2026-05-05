import React, { Suspense, useState, useRef, useMemo, useCallback } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import "./RoomPlanner3D.css";

// ── Fit a GLB model into the scene ────────────────────────────────────────────
// FIX: use box.min directly, NOT box.getMin() — getMin does not exist
function FurnitureModel({ modelPath }) {
  const { scene } = useGLTF(modelPath);

  const fitted = useMemo(() => {
    try {
      const cloned = scene.clone(true);

      // Step 1: measure original
      const box1 = new THREE.Box3().setFromObject(cloned);
      const size  = new THREE.Vector3();
      box1.getSize(size);                        // getSize() ✅ exists
      const maxDim = Math.max(size.x, size.y, size.z) || 1;

      // Step 2: scale to ~1.8 units tall
      const scale = 1.8 / maxDim;
      cloned.scale.setScalar(scale);

      // Step 3: re-measure after scaling, then sit on floor
      const box2   = new THREE.Box3().setFromObject(cloned);
      const center = new THREE.Vector3();
      box2.getCenter(center);                    // getCenter() ✅ exists
      const minY = box2.min.y;                   // .min.y   ✅ property (NOT getMin())

      cloned.position.set(-center.x, -minY, -center.z);
      return cloned;
    } catch (err) {
      console.error("FurnitureModel fit error:", err);
      return null;
    }
  }, [scene]);

  if (!fitted) return null;
  return <primitive object={fitted} />;
}

// ── Loading fallback inside Canvas ────────────────────────────────────────────
function LoadingBox() {
  const ref = useRef();
  return (
    <mesh ref={ref}>
      <boxGeometry args={[0.8, 0.8, 0.8]} />
      <meshStandardMaterial color="#c5cae9" wireframe />
    </mesh>
  );
}

// ── Single draggable furniture group ─────────────────────────────────────────
function FurnitureItem({ item, isSelected, onSelect, onMove, orbitRef }) {
  const { camera, gl } = useThree();
  const isDragging = useRef(false);
  const floorPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  const dragOffset = useRef(new THREE.Vector3());

  const getFloorPos = useCallback((clientX, clientY) => {
    const rect = gl.domElement.getBoundingClientRect();
    const ndc  = new THREE.Vector2(
      ((clientX - rect.left) / rect.width)  * 2 - 1,
      -((clientY - rect.top)  / rect.height) * 2 + 1
    );
    const ray    = new THREE.Raycaster();
    ray.setFromCamera(ndc, camera);
    const target = new THREE.Vector3();
    ray.ray.intersectPlane(floorPlane, target);
    return target;
  }, [camera, gl]);

  const [px, py, pz] = item.position;
  const ry           = item.rotation;

  const onPointerDown = (e) => {
    e.stopPropagation();
    onSelect(item.instanceId);
    if (!isSelected) return;

    isDragging.current = true;
    if (orbitRef.current) orbitRef.current.enabled = false;
    gl.domElement.style.cursor = "grabbing";

    const fp = getFloorPos(e.clientX, e.clientY);
    if (fp) dragOffset.current.set(px - fp.x, 0, pz - fp.z);
    e.target.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e) => {
    if (!isDragging.current) return;
    const fp = getFloorPos(e.clientX, e.clientY);
    if (!fp) return;
    const nx = Math.max(-4, Math.min(4, fp.x + dragOffset.current.x));
    const nz = Math.max(-4, Math.min(4, fp.z + dragOffset.current.z));
    onMove(item.instanceId, [nx, 0, nz]);
  };

  const onPointerUp = (e) => {
    if (!isDragging.current) return;
    isDragging.current = false;
    if (orbitRef.current) orbitRef.current.enabled = true;
    gl.domElement.style.cursor = "auto";
    e.target.releasePointerCapture(e.pointerId);
  };

  return (
    <group
      position={[px, py, pz]}
      rotation={[0, ry, 0]}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    >
      <Suspense fallback={<LoadingBox />}>
        <FurnitureModel modelPath={item.model} />
      </Suspense>

      {/* Selection ring on floor */}
      {isSelected && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
          <ringGeometry args={[1.0, 1.25, 32]} />
          <meshBasicMaterial color="#7c3aed" transparent opacity={0.6} side={THREE.DoubleSide} />
        </mesh>
      )}
    </group>
  );
}

// ── Room walls / floor / ceiling ──────────────────────────────────────────────
function RoomShell() {
  return (
    <group>
      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[10, 10]} />
        <meshStandardMaterial color="#c8b89a" roughness={0.85} />
      </mesh>
      {/* Rug */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]}>
        <planeGeometry args={[4.5, 4.5]} />
        <meshStandardMaterial color="#8b6e52" roughness={1} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.007, 0]}>
        <planeGeometry args={[4.0, 4.0]} />
        <meshStandardMaterial color="#a07850" roughness={1} />
      </mesh>
      {/* Ceiling */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 5, 0]}>
        <planeGeometry args={[10, 10]} />
        <meshStandardMaterial color="#f5f4f0" />
      </mesh>
      {/* Back wall */}
      <mesh position={[0, 2.5, -5]}>
        <planeGeometry args={[10, 5]} />
        <meshStandardMaterial color="#ede8df" />
      </mesh>
      {/* Left wall */}
      <mesh rotation={[0, Math.PI / 2, 0]} position={[-5, 2.5, 0]}>
        <planeGeometry args={[10, 5]} />
        <meshStandardMaterial color="#e8e3da" />
      </mesh>
      {/* Right wall */}
      <mesh rotation={[0, -Math.PI / 2, 0]} position={[5, 2.5, 0]}>
        <planeGeometry args={[10, 5]} />
        <meshStandardMaterial color="#e8e3da" />
      </mesh>
      {/* Skirting - back */}
      <mesh position={[0, 0.08, -4.95]}>
        <boxGeometry args={[10, 0.16, 0.06]} />
        <meshStandardMaterial color="#d4c8b4" />
      </mesh>
      {/* Skirting - left */}
      <mesh rotation={[0, Math.PI / 2, 0]} position={[-4.95, 0.08, 0]}>
        <boxGeometry args={[10, 0.16, 0.06]} />
        <meshStandardMaterial color="#d4c8b4" />
      </mesh>
      {/* Skirting - right */}
      <mesh rotation={[0, -Math.PI / 2, 0]} position={[4.95, 0.08, 0]}>
        <boxGeometry args={[10, 0.16, 0.06]} />
        <meshStandardMaterial color="#d4c8b4" />
      </mesh>
      {/* Window */}
      <mesh position={[2.5, 3.2, -4.96]}>
        <planeGeometry args={[2, 2.2]} />
        <meshStandardMaterial color="#b8d4ea" transparent opacity={0.55} />
      </mesh>
      <mesh position={[2.5, 3.2, -4.94]}>
        <boxGeometry args={[2.1, 2.3, 0.05]} />
        <meshStandardMaterial color="#d8cbb0" />
      </mesh>
      {/* Ceiling light */}
      <mesh position={[0, 4.82, 0]}>
        <cylinderGeometry args={[0.3, 0.38, 0.1, 20]} />
        <meshStandardMaterial color="#f0e8d0" emissive="#ffeecc" emissiveIntensity={0.6} />
      </mesh>
    </group>
  );
}

// ── Spread items around room by default ───────────────────────────────────────
function defaultPosition(index, total) {
  if (total === 1) return [0, 0, 0];
  const angle = (index / total) * Math.PI * 2;
  const r     = 1.8 + (index % 3) * 0.6;
  return [
    Math.cos(angle) * r,
    0,
    Math.sin(angle) * r,
  ];
}

// ── Main exported component ───────────────────────────────────────────────────
export default function RoomPlanner3D({ items, onRemoveItem, onClose }) {
  const [selectedId,  setSelectedId]  = useState(null);
  const [positions,   setPositions]   = useState({});
  const [rotations,   setRotations]   = useState({});
  const orbitRef = useRef();

  const selectedItem = items.find((i) => i.instanceId === selectedId) || null;

  const handleMove = (instanceId, newPos) => {
    setPositions((prev) => ({ ...prev, [instanceId]: newPos }));
  };

  const handleRotate = (dir) => {
    if (!selectedId) return;
    setRotations((prev) => ({
      ...prev,
      [selectedId]: ((prev[selectedId] || 0) + dir * (Math.PI / 8)),
    }));
  };

  const handleDeselect = () => setSelectedId(null);

  const enriched = items.map((item, idx) => ({
    ...item,
    position: positions[item.instanceId] || defaultPosition(idx, items.length),
    rotation: rotations[item.instanceId] || 0,
  }));

  return (
    <div className="rp3d-wrap">

      {/* Top bar */}
      <div className="rp3d-topbar">
        <div className="rp3d-topbar-left">
          <span>🏠</span>
          <span className="rp3d-topbar-title">Virtual Room Planner</span>
          <span className="rp3d-count-badge">{items.length} item{items.length !== 1 ? "s" : ""}</span>
        </div>
        <button className="rp3d-close-btn" onClick={onClose}>✕ Close</button>
      </div>

      {/* Controls */}
      <div className="rp3d-controls">
        <div className="rp3d-ctrl-left">
          {selectedItem ? (
            <>
              <span className="rp3d-selected-label">
                {selectedItem.emoji} <strong>{selectedItem.name}</strong> selected
              </span>
              <button className="ctrl-btn" onClick={() => handleRotate(-1)}>↺ Left</button>
              <button className="ctrl-btn" onClick={() => handleRotate(1)}>↻ Right</button>
              <button className="ctrl-btn ctrl-btn--remove"
                onClick={() => { onRemoveItem(selectedId); setSelectedId(null); }}>
                🗑️ Remove
              </button>
              <button className="ctrl-btn ctrl-btn--done" onClick={handleDeselect}>✓ Done</button>
            </>
          ) : (
            <span className="rp3d-hint">
              👆 Click a furniture item to select → drag to move it
            </span>
          )}
        </div>
        <span className="rp3d-hint-sm">Scroll = Zoom  •  Right-drag = Orbit</span>
      </div>

      {/* Canvas */}
      <div className="rp3d-canvas-wrap">
        <Canvas
          shadows
          camera={{ position: [6, 7, 9], fov: 48 }}
          onPointerMissed={handleDeselect}
        >
          <ambientLight intensity={0.75} />
          <directionalLight position={[5, 8, 5]} intensity={1.5} castShadow />
          <directionalLight position={[-4, 5, -4]} intensity={0.35} />
          <pointLight position={[0, 4.6, 0]} intensity={0.5} color="#fff5e8" />

          <RoomShell />

          {enriched.map((item) => (
            <FurnitureItem
              key={item.instanceId}
              item={item}
              isSelected={selectedId === item.instanceId}
              onSelect={(id) => setSelectedId((p) => p === id ? null : id)}
              onMove={handleMove}
              orbitRef={orbitRef}
            />
          ))}

          <OrbitControls
            ref={orbitRef}
            enableDamping
            dampingFactor={0.08}
            minDistance={3}
            maxDistance={14}
            maxPolarAngle={Math.PI / 2.05}
          />
        </Canvas>
      </div>

      {/* Sidebar */}
      <div className="rp3d-sidebar">
        <span className="rp3d-sidebar-title">🛋️ In Room:</span>
        {items.map((item) => (
          <div
            key={item.instanceId}
            className={`rp3d-pill ${selectedId === item.instanceId ? "rp3d-pill--active" : ""}`}
            onClick={() => setSelectedId((p) => p === item.instanceId ? null : item.instanceId)}
          >
            {item.emoji} {item.name}
            <button
              className="rp3d-pill-x"
              onClick={(e) => { e.stopPropagation(); onRemoveItem(item.instanceId); }}
            >✕</button>
          </div>
        ))}
      </div>
    </div>
  );
}