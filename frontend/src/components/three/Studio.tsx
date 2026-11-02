"use client";

import { Environment, Lightformer } from "@react-three/drei";

/**
 * Pastel studio with real contrast: a mid slate-lavender surround so metals show dark reflections,
 * cut by bright softboxes that draw crisp highlight bands along rims and edges.
 */
export function Studio() {
  return (
    <>
      <ambientLight intensity={0.35} color="#eef0ff" />
      <directionalLight position={[3, 5, 6]} intensity={1.6} color="#ffffff" />
      <directionalLight position={[-5, -2, -2]} intensity={0.8} color="#f3b8e6" />
      <Environment resolution={512} frames={1}>
        <color attach="background" args={["#6f74a8"]} />
        <Lightformer form="rect" intensity={4} color="#ffffff" position={[0, 5, 4]} scale={[12, 2.2, 1]} target={[0, 0, 0]} />
        <Lightformer form="rect" intensity={3} color="#ffffff" position={[4.5, 1.5, 4]} scale={[1.2, 7, 1]} target={[0, 0, 0]} />
        <Lightformer form="rect" intensity={2.6} color="#bcd0f7" position={[-6, 0.5, 2]} scale={[2.5, 9, 1]} target={[0, 0, 0]} />
        <Lightformer form="rect" intensity={3} color="#f3b8e6" position={[6, -1, 0]} scale={[2.5, 9, 1]} target={[0, 0, 0]} />
        <Lightformer form="ring" intensity={2} color="#cbbef5" position={[0, -5, -3]} scale={4} target={[0, 0, 0]} />
        <Lightformer form="rect" intensity={1.4} color="#f8dcd2" position={[0, 0, -7]} scale={[10, 4, 1]} target={[0, 0, 0]} />
        <Lightformer form="rect" intensity={0.6} color="#1c1b3a" position={[0, -4, 4]} scale={[14, 3, 1]} target={[0, 0, 0]} />
      </Environment>
    </>
  );
}
