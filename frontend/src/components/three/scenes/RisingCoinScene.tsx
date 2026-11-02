"use client";

import { useRef, type RefObject } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { Coin, type CoinFinish } from "../Coin";
import { clamp01, motion } from "@/lib/motion";

/** A coin that surfaces from below the card's wave line as the card scrolls into view. */
export function RisingCoinScene({
  track,
  finish,
}: {
  track: RefObject<HTMLElement | null>;
  finish: CoinFinish;
}) {
  const g = useRef<THREE.Group>(null);
  const smooth = useRef(0);

  useFrame((state, dt) => {
    if (!g.current || !track.current) return;
    const rect = track.current.getBoundingClientRect();
    const vh = window.innerHeight;
    const target = clamp01((vh * 0.95 - rect.top) / (vh * 0.45));
    smooth.current = THREE.MathUtils.damp(smooth.current, target, 4, dt);
    const p = 1 - Math.pow(1 - smooth.current, 3);
    const t = motion.reduced ? 0 : state.clock.elapsedTime;
    g.current.position.y = THREE.MathUtils.lerp(-2.4, 0.15, p) + Math.sin(t * 1.1) * 0.05;
    g.current.rotation.y = (1 - p) * 3.2 + Math.sin(t * 0.6) * 0.28 - 0.6;
    g.current.rotation.x = 0.2;
  });

  return (
    <group ref={g}>
      <Coin finish={finish} scale={1.05} />
    </group>
  );
}
