"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { motion } from "@/lib/motion";

function Ribbon({
  points,
  radius,
  color,
  sheen,
}: {
  points: [number, number, number][];
  radius: number;
  color: string;
  sheen: string;
}) {
  const geometry = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p)));
    return new THREE.TubeGeometry(curve, 320, radius, 64, false);
  }, [points, radius]);

  return (
    <mesh geometry={geometry}>
      <meshPhysicalMaterial
        color={color}
        roughness={0.16}
        metalness={0.1}
        clearcoat={1}
        iridescence={1}
        iridescenceIOR={1.6}
        sheen={1}
        sheenColor={sheen}
        sheenRoughness={0.4}
        envMapIntensity={1.4}
      />
    </mesh>
  );
}

const a: [number, number, number][] = [
  [-4.5, -2.6, -1],
  [-2.4, 1.4, -0.5],
  [-0.6, -0.8, 1.1],
  [1.2, 1.6, 0.2],
  [2.6, -0.6, -0.4],
  [4.6, 1.8, -1.2],
];
const b: [number, number, number][] = [
  [-4.2, 2.4, -2],
  [-1.8, -1.6, -1.2],
  [0.8, 0.4, -1.8],
  [2.8, -2.0, -0.8],
  [4.8, -0.4, -1.6],
];

/** Two thick iridescent ribbons drifting — the flow of money, smoothed. */
export function RibbonScene() {
  const group = useRef<THREE.Group>(null);

  useFrame((state, dt) => {
    const g = group.current;
    if (!g) return;
    const t = motion.reduced ? 0 : state.clock.elapsedTime;
    g.rotation.y = THREE.MathUtils.damp(g.rotation.y, Math.sin(t * 0.15) * 0.25 + motion.pointer.x * 0.15, 2, dt);
    g.rotation.x = THREE.MathUtils.damp(g.rotation.x, Math.cos(t * 0.12) * 0.1 - motion.pointer.y * 0.1, 2, dt);
    g.position.y = Math.sin(t * 0.4) * 0.08;
  });

  return (
    <group ref={group}>
      <Ribbon points={a} radius={0.62} color="#c7b6ff" sheen="#f3b8e6" />
      <Ribbon points={b} radius={0.42} color="#f2c3ee" sheen="#bcd0f7" />
    </group>
  );
}
