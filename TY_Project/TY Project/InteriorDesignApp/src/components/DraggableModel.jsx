import React from "react";
import { OrbitControls } from "@react-three/drei";
import DraggableModel from "./DraggableModel";

export default function BasicRoomScene({ modelPath }) {
  return (
    <>
      <ambientLight intensity={1.2} />
      <directionalLight position={[5, 8, 5]} intensity={2} />

      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[10, 10]} />
        <meshStandardMaterial color="#d9d2c3" />
      </mesh>

      {/* Walls */}
      <mesh position={[0, 2.5, -5]}>
        <planeGeometry args={[10, 5]} />
        <meshStandardMaterial color="#ece7de" />
      </mesh>

      <mesh rotation={[0, Math.PI / 2, 0]} position={[-5, 2.5, 0]}>
        <planeGeometry args={[10, 5]} />
        <meshStandardMaterial color="#e8e3db" />
      </mesh>

      <mesh rotation={[0, -Math.PI / 2, 0]} position={[5, 2.5, 0]}>
        <planeGeometry args={[10, 5]} />
        <meshStandardMaterial color="#e8e3db" />
      </mesh>

      <DraggableModel modelPath={modelPath} />

      <OrbitControls enableDamping />
    </>
  );
}