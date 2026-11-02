"use client";

import { useMemo } from "react";
import * as THREE from "three";
import type { ThreeElements } from "@react-three/fiber";
import { shieldShape } from "./shapes";
import { getRupeeGlyph } from "./Coin";

/** Satin-chrome shield frame with a frosted iridescent glass face and a chrome ₹. */
export function ShieldEmblem(props: ThreeElements["group"]) {
  const { frame, face } = useMemo(() => {
    const frame = new THREE.ExtrudeGeometry(shieldShape(1.5, 1.85), {
      depth: 0.16,
      bevelEnabled: true,
      bevelThickness: 0.08,
      bevelSize: 0.07,
      bevelSegments: 12,
      curveSegments: 72,
    });
    frame.center();
    const face = new THREE.ExtrudeGeometry(shieldShape(1.2, 1.5), {
      depth: 0.08,
      bevelEnabled: true,
      bevelThickness: 0.06,
      bevelSize: 0.05,
      bevelSegments: 12,
      curveSegments: 72,
    });
    face.center();
    return { frame, face };
  }, []);

  return (
    <group {...props}>
      <mesh geometry={frame}>
        <meshPhysicalMaterial
          color="#dfe2f8"
          metalness={1}
          roughness={0.2}
          clearcoat={1}
          iridescence={0.45}
          envMapIntensity={1.3}
        />
      </mesh>
      <mesh geometry={face} position={[0, 0.02, 0.12]}>
        <meshPhysicalMaterial
          color="#f3f1ff"
          metalness={0.05}
          roughness={0.08}
          clearcoat={1}
          iridescence={1}
          iridescenceIOR={1.35}
          transparent
          opacity={0.78}
          envMapIntensity={1.4}
        />
      </mesh>
      <mesh geometry={getRupeeGlyph()} position={[0, 0.06, 0.27]} scale={0.78}>
        <meshPhysicalMaterial color="#eef0fb" metalness={1} roughness={0.14} clearcoat={1} envMapIntensity={1.6} />
      </mesh>
    </group>
  );
}
