"use client";

import { useRef, type RefObject } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { Coin, type CoinFinish } from "../Coin";
import { motion } from "@/lib/motion";

const sides: {
  finish: CoinFinish;
  x: number;
  y: number;
  scale: number;
  ry: number;
  dir: -1 | 1;
}[] = [
  { finish: "cobalt", x: -2.35, y: 0.35, scale: 0.52, ry: 0.65, dir: -1 },
  { finish: "gold", x: -2.05, y: -0.72, scale: 0.3, ry: -0.35, dir: -1 },
  { finish: "orchid", x: 2.35, y: 0.05, scale: 0.48, ry: -0.75, dir: 1 },
  { finish: "chrome", x: 2.1, y: -0.85, scale: 0.28, ry: 0.4, dir: 1 },
];

/** Coins parked at the hero edges. They slide off outward as the scroll (and the bunny) begins. */
export function HeroSideCoins({ progressRef }: { progressRef: RefObject<number> }) {
  const groups = useRef<(THREE.Group | null)[]>([]);

  useFrame((_, dt) => {
    const p = Math.min(1, Math.max(0, (progressRef.current ?? 0) / 0.32));
    const ease = p * p * (3 - 2 * p);
    const t = motion.reduced ? 0 : performance.now() / 1000;

    sides.forEach((coin, i) => {
      const g = groups.current[i];
      if (!g) return;
      const drift = motion.reduced ? 0 : Math.sin(t * 0.8 + i) * 0.05;
      g.position.x = THREE.MathUtils.damp(g.position.x, coin.x + coin.dir * ease * 4.5, 5, dt);
      g.position.y = coin.y + drift;
      g.rotation.y = coin.ry + (motion.reduced ? 0 : t * 0.2 * coin.dir);
      g.visible = ease < 0.98;
    });
  });

  return (
    <>
      {sides.map((coin, i) => (
        <group
          key={coin.finish + i}
          ref={(el) => {
            groups.current[i] = el;
          }}
          position={[coin.x, coin.y, 0]}
          rotation={[0.22, coin.ry, coin.dir * 0.08]}
        >
          <Coin finish={coin.finish} scale={coin.scale} />
        </group>
      ))}
    </>
  );
}
