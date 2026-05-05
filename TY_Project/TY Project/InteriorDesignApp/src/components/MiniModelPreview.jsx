import React, { useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, useGLTF, Environment } from "@react-three/drei";
import * as THREE from "three";

function AutoFitModel({ modelPath }) {
  const { scene } = useGLTF(modelPath);

  const fittedScene = useMemo(() => {
    const cloned = scene.clone();
    const box    = new THREE.Box3().setFromObject(cloned);
    const size   = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);
    const maxDim = Math.max(size.x, size.y, size.z) || 1;
    const scale  = 2 / maxDim;
    cloned.scale.setScalar(scale);
    const newBox    = new THREE.Box3().setFromObject(cloned);
    const newCenter = new THREE.Vector3();
    newBox.getCenter(newCenter);
    cloned.position.set(-newCenter.x, -newCenter.y, -newCenter.z);
    return cloned;
  }, [scene]);

  return <primitive object={fittedScene} />;
}

export default function MiniModelPreview({ modelPath }) {
  return (
    <div style={{ width: "100%", height: "180px" }}>
      <Canvas camera={{ position: [0, 0.5, 4], fov: 45 }}>
        <ambientLight intensity={1.5} />
        <directionalLight position={[5, 5, 5]} intensity={2} />
        <Environment preset="apartment" />
        <AutoFitModel modelPath={modelPath} />
        <OrbitControls enableZoom={false} autoRotate autoRotateSpeed={1.5} />
      </Canvas>
    </div>
  );
}