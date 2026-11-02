"use client";

import { useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";
import { ShieldEmblem } from "../ShieldEmblem";
import { Coin } from "../Coin";
import { clamp01, easeInOut, motion } from "@/lib/motion";

type Weight = { value: number };

const frosted = {
  color: "#ffffff",
  roughness: 0.32,
  clearcoat: 1,
  transparent: true,
  opacity: 0.92,
  envMapIntensity: 1.2,
} as const;

function Receipt({ weight }: { weight: Weight }) {
  const beam = useRef<THREE.Group>(null);
  const lines = [
    { w: 0.8, y: 0.82, h: 0.08, c: "#1c1b3a" },
    { w: 0.5, y: 0.66, h: 0.04, c: "#a3a8c3" },
    { w: 1.1, y: 0.36, h: 0.045, c: "#cbbef5" },
    { w: 0.9, y: 0.2, h: 0.045, c: "#cbbef5" },
    { w: 1.1, y: 0.04, h: 0.045, c: "#cbbef5" },
    { w: 0.7, y: -0.12, h: 0.045, c: "#cbbef5" },
    { w: 1.2, y: -0.42, h: 0.012, c: "#a3a8c3" },
    { w: 0.4, y: -0.62, h: 0.045, c: "#a3a8c3" },
  ];

  useFrame((state) => {
    if (beam.current && !motion.reduced) beam.current.position.y = Math.sin(state.clock.elapsedTime * 1.3) * 0.95;
    if (beam.current) beam.current.scale.x = weight.value;
  });

  return (
    <group>
      <RoundedBox args={[1.55, 2.25, 0.07]} radius={0.05} smoothness={4}>
        <meshPhysicalMaterial {...frosted} />
      </RoundedBox>
      {lines.map((l, i) => (
        <mesh key={i} position={[-0.6 + l.w / 2, l.y, 0.045]}>
          <boxGeometry args={[l.w, l.h, 0.01]} />
          <meshBasicMaterial color={l.c} toneMapped={false} />
        </mesh>
      ))}
      <mesh position={[0.38, -0.62, 0.045]}>
        <boxGeometry args={[0.36, 0.1, 0.01]} />
        <meshBasicMaterial color="#1c1b3a" toneMapped={false} />
      </mesh>
      <group ref={beam} position={[0, 0, 0.09]}>
        <mesh>
          <planeGeometry args={[1.95, 0.025]} />
          <meshBasicMaterial color="#3d86ff" toneMapped={false} />
        </mesh>
        <mesh>
          <planeGeometry args={[1.95, 0.4]} />
          <meshBasicMaterial color="#3d86ff" transparent opacity={0.14} depthWrite={false} toneMapped={false} />
        </mesh>
      </group>
      <Coin finish="chrome" position={[1.05, -1.0, 0.35]} rotation={[0.2, -0.6, 0.1]} scale={0.32} />
    </group>
  );
}

const blockColors = ["#cbbef5", "#f3b8e6", "#f9e6a6", "#bcd0f7"];
const columns = [2, 4, 3, 5];
const CUBE = 0.36;

function BudgetBlocks({ weight }: { weight: Weight }) {
  const cubes = useRef<(THREE.Mesh | null)[]>([]);
  const layout = useMemo(
    () =>
      columns.flatMap((n, ci) =>
        Array.from({ length: n }, (_, j) => ({ ci, j, x: (ci - 1.5) * 0.46, y: j * 0.4 - 1 })),
      ),
    [],
  );

  useFrame(() => {
    const w = weight.value;
    layout.forEach((b, i) => {
      const m = cubes.current[i];
      if (m) m.position.y = b.y + (1 - w) * (b.j + 1) * 0.7;
    });
  });

  return (
    <group>
      {layout.map((b, i) => (
        <RoundedBox
          key={i}
          ref={(el: THREE.Mesh | null) => void (cubes.current[i] = el)}
          args={[CUBE, CUBE, CUBE]}
          radius={0.07}
          smoothness={4}
          position={[b.x, b.y, 0]}
        >
          <meshPhysicalMaterial
            color={blockColors[b.ci]}
            roughness={0.12}
            clearcoat={1}
            iridescence={0.35}
            transparent
            opacity={0.94}
            envMapIntensity={1.2}
          />
        </RoundedBox>
      ))}
      <mesh position={[0, 0.78, 0.25]}>
        <boxGeometry args={[2.3, 0.02, 0.02]} />
        <meshBasicMaterial color="#e35fc9" toneMapped={false} />
      </mesh>
      <RoundedBox args={[2.3, 0.05, 0.6]} radius={0.02} position={[0, 0.78, 0]}>
        <meshPhysicalMaterial color="#ffffff" roughness={0.1} transparent opacity={0.45} clearcoat={1} />
      </RoundedBox>
    </group>
  );
}

function VaultDial({ weight }: { weight: Weight }) {
  const needle = useRef<THREE.Group>(null);
  const ticks = useMemo(() => Array.from({ length: 48 }, (_, i) => (i / 48) * Math.PI * 2), []);

  useFrame((state) => {
    const t = motion.reduced ? 0 : state.clock.elapsedTime;
    if (needle.current) needle.current.rotation.z = -weight.value * Math.PI * 1.44 + Math.sin(t) * 0.04;
  });

  return (
    <group>
      <mesh>
        <torusGeometry args={[1.05, 0.13, 48, 160]} />
        <meshPhysicalMaterial color="#e6e8f8" metalness={1} roughness={0.18} clearcoat={1} envMapIntensity={1.4} />
      </mesh>
      {ticks.map((a, i) => (
        <mesh key={i} position={[Math.sin(a) * 0.8, Math.cos(a) * 0.8, 0.06]} rotation={[0, 0, -a]}>
          <boxGeometry args={[0.025, i % 4 === 0 ? 0.13 : 0.07, 0.02]} />
          <meshBasicMaterial color={i % 4 === 0 ? "#2d2f55" : "#a3a8c3"} toneMapped={false} />
        </mesh>
      ))}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.92, 0.92, 0.08, 96]} />
        <meshPhysicalMaterial color="#efeaff" roughness={0.15} clearcoat={1} iridescence={0.8} transparent opacity={0.85} />
      </mesh>
      <mesh rotation={[0, 0, Math.PI / 2]} position={[0, 0, 0.07]}>
        <torusGeometry args={[0.64, 0.025, 16, 120, Math.PI * 1.44]} />
        <meshBasicMaterial color="#3d86ff" toneMapped={false} />
      </mesh>
      <group ref={needle} position={[0, 0, 0.1]}>
        <mesh position={[0, 0.28, 0]}>
          <boxGeometry args={[0.05, 0.56, 0.03]} />
          <meshBasicMaterial color="#1c1b3a" toneMapped={false} />
        </mesh>
      </group>
      <mesh position={[0, 0, 0.12]}>
        <sphereGeometry args={[0.1, 32, 32]} />
        <meshPhysicalMaterial color="#eef0fb" metalness={1} roughness={0.15} />
      </mesh>
    </group>
  );
}

function ShieldPiece() {
  return (
    <group>
      <ShieldEmblem scale={1.05} />
      <Coin finish="orchid" position={[1.15, 0.95, -0.4]} rotation={[0.3, -0.8, 0]} scale={0.26} />
      <Coin finish="iris" position={[-1.1, -0.9, 0.3]} rotation={[-0.3, 0.7, 0]} scale={0.2} />
    </group>
  );
}

/** Four module objects that cross-fade (scale + spin) as the pinned list advances. */
export function ShowcaseScene() {
  const root = useRef<THREE.Group>(null);
  const [groups] = useState<(THREE.Group | null)[]>(() => [null, null, null, null]);
  const [weights] = useState<Weight[]>(() => [{ value: 1 }, { value: 0 }, { value: 0 }, { value: 0 }]);
  const smooth = useRef(0);

  useFrame((state, dt) => {
    smooth.current = THREE.MathUtils.damp(smooth.current, motion.progress.showcase, 6, dt);
    const idx = Math.min(3, Math.max(0, smooth.current * 4 - 0.5));
    const t = motion.reduced ? 0 : state.clock.elapsedTime;
    groups.forEach((g, i) => {
      if (!g) return;
      const e = easeInOut(clamp01(1 - Math.abs(idx - i) * 1.6));
      weights[i].value = e;
      g.visible = e > 0.002;
      g.scale.setScalar(0.0001 + e);
      g.rotation.y = (idx - i) * -1.3 + Math.sin(t * 0.45 + i) * 0.22;
      g.position.y = (idx - i) * 0.5 + Math.sin(t * 0.8 + i) * 0.05;
    });
    if (root.current) {
      root.current.rotation.x = THREE.MathUtils.damp(root.current.rotation.x, -motion.pointer.y * 0.12, 3, dt);
      root.current.rotation.z = THREE.MathUtils.damp(root.current.rotation.z, -motion.pointer.x * 0.05, 3, dt);
    }
  });

  const set = (i: number) => (el: THREE.Group | null) => void (groups[i] = el);

  return (
    <group ref={root}>
      <group ref={set(0)}>
        <Receipt weight={weights[0]} />
      </group>
      <group ref={set(1)}>
        <BudgetBlocks weight={weights[1]} />
      </group>
      <group ref={set(2)}>
        <VaultDial weight={weights[2]} />
      </group>
      <group ref={set(3)}>
        <ShieldPiece />
      </group>
    </group>
  );
}
