"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { Float } from "@react-three/drei";
import { ParticleAura } from "../ParticleAura";
import { HalftoneCore } from "../HalftoneCore";
import { ShieldEmblem } from "../ShieldEmblem";
import { Coin } from "../Coin";
import { motion } from "@/lib/motion";

const { damp } = THREE.MathUtils;

export function HeroScene() {
  const group = useRef<THREE.Group>(null);
  const shield = useRef<THREE.Group>(null);
  const particles = useMemo(() => (window.innerWidth < 768 ? 14000 : 36000), []);

  useFrame((state, dt) => {
    const g = group.current;
    if (!g) return;
    const p = motion.progress.hero;
    const t = state.clock.elapsedTime;
    g.rotation.y = damp(g.rotation.y, motion.pointer.x * 0.22, 3, dt);
    g.rotation.x = damp(g.rotation.x, -motion.pointer.y * 0.12, 3, dt);
    g.position.y = damp(g.position.y, p * 0.9, 6, dt);
    g.scale.setScalar(damp(g.scale.x, 1 - p * 0.18, 6, dt));

    if (shield.current && !motion.reduced) {
      shield.current.rotation.y = Math.sin(t * 0.5) * 0.32 + p * 1.4;
      shield.current.rotation.x = Math.sin(t * 0.35) * 0.06;
      shield.current.position.y = Math.sin(t * 0.8) * 0.06;
    }
  });

  return (
    <group ref={group}>
      <ParticleAura count={particles} radius={1.75} />
      <HalftoneCore radius={1.2} />
      <group ref={shield} position={[0, 0, 1.35]} scale={0.72}>
        <ShieldEmblem />
      </group>
      <Float speed={1.2} rotationIntensity={1.2} floatIntensity={1.4} enabled={!motion.reduced}>
        <Coin finish="orchid" position={[1.95, 1.35, 0.4]} rotation={[0.3, -0.7, 0.2]} scale={0.3} />
      </Float>
      <Float speed={1.6} rotationIntensity={1.4} floatIntensity={1.2} enabled={!motion.reduced}>
        <Coin finish="chrome" position={[-1.85, -1.3, 1]} rotation={[-0.2, 0.9, -0.3]} scale={0.22} />
      </Float>
      <Float speed={1} rotationIntensity={1} floatIntensity={1} enabled={!motion.reduced}>
        <Coin finish="iris" position={[1.6, -1.65, -0.6]} rotation={[0.5, 0.4, 0]} scale={0.17} />
      </Float>
    </group>
  );
}
