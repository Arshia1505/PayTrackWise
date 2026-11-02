"use client";

import { useState } from "react";
import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";
import { PerformanceMonitor, View } from "@react-three/drei";

/**
 * Views render with scissoring and never clear the full canvas, so stale pixels must be wiped each frame.
 * The clear colour is reset every time because Environment's cube capture leaves an opaque one behind.
 */
function ClearPass() {
  useFrame(({ gl }) => {
    gl.setScissorTest(false);
    gl.setClearColor(0x000000, 0);
    gl.clear(true, true, true);
  }, 1);
  return null;
}

export default function SceneCanvas() {
  const [dpr, setDpr] = useState(1.5);

  return (
    <Canvas
      dpr={dpr}
      gl={{
        antialias: true,
        alpha: true,
        powerPreference: "high-performance",
        toneMapping: THREE.NeutralToneMapping,
        toneMappingExposure: 1.08,
      }}
      style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 10 }}
    >
      <PerformanceMonitor
        onIncline={() => setDpr(Math.min(2, window.devicePixelRatio))}
        onDecline={() => setDpr(1)}
      />
      <ClearPass />
      <View.Port />
    </Canvas>
  );
}
