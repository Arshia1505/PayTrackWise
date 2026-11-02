"use client";

import { useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";
import { Coin, type CoinFinish } from "../Coin";
import { motion } from "@/lib/motion";

const ANGLE = -0.13;
const RAIL_HALF = 0.18;
const R = 0.62;
const coins: { start: number; finish: CoinFinish }[] = [
  { start: -9.6, finish: "cobalt" },
  { start: -6.2, finish: "gold" },
  { start: -2.8, finish: "chrome" },
  { start: 0.6, finish: "orchid" },
];

/** Coins roll down a frosted glass rail, scrubbed by scroll — savings flowing in. */
export function RailScene() {
  const refs = useRef<(THREE.Group | null)[]>([]);
  const rolls = useRef<(THREE.Group | null)[]>([]);
  const smooth = useRef(0);

  useFrame((state, dt) => {
    smooth.current = THREE.MathUtils.damp(smooth.current, motion.progress.rail, 5, dt);
    const idle = motion.reduced ? 0 : state.clock.elapsedTime * 0.04;
    const cos = Math.cos(ANGLE);
    const sin = Math.sin(ANGLE);
    coins.forEach((c, i) => {
      const g = refs.current[i];
      const roll = rolls.current[i];
      if (!g || !roll) return;
      const s = c.start + smooth.current * 7.5 + idle;
      const h = RAIL_HALF + R;
      g.position.set(s * cos - h * sin, s * sin + h * cos, 0);
      roll.rotation.z = -s / R;
    });
  });

  return (
    <group>
      <group rotation={[0, 0, ANGLE]}>
        <RoundedBox args={[22, RAIL_HALF * 2, 1.3]} radius={0.16} smoothness={6}>
          <meshPhysicalMaterial
            color="#f1edff"
            roughness={0.14}
            clearcoat={1}
            iridescence={0.6}
            transparent
            opacity={0.88}
            envMapIntensity={1.3}
          />
        </RoundedBox>
        <mesh position={[0, -RAIL_HALF - 0.02, 0.62]}>
          <boxGeometry args={[22, 0.04, 0.04]} />
          <meshBasicMaterial color="#f08bd8" toneMapped={false} />
        </mesh>
      </group>
      <group rotation={[0, 0, 0.06]} position={[0, -2.1, -2.6]}>
        <RoundedBox args={[26, 0.26, 0.9]} radius={0.12} smoothness={6}>
          <meshPhysicalMaterial color="#f6b6e6" emissive="#e35fc9" emissiveIntensity={0.3} roughness={0.2} clearcoat={1} />
        </RoundedBox>
      </group>
      {coins.map((c, i) => (
        <group key={i} ref={(el) => void (refs.current[i] = el)}>
          <group rotation={[0, -0.55, 0]}>
            <group ref={(el) => void (rolls.current[i] = el)}>
              <Coin finish={c.finish} scale={R} />
            </group>
          </group>
        </group>
      ))}
    </group>
  );
}
