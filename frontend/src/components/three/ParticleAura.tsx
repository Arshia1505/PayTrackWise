"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { simplex3 } from "./glsl";
import { motion } from "@/lib/motion";

const vertex = /* glsl */ `
uniform float uTime;
uniform float uSize;
uniform float uSpread;
uniform vec2 uPointer;
attribute float aRand;
varying float vAlpha;
varying float vTint;
${simplex3}
void main(){
  vec3 n = normalize(position);
  float slow = snoise(n * 1.4 + vec3(uTime * 0.11, uTime * 0.07, 0.0));
  float fine = snoise(n * 4.2 - vec3(0.0, uTime * 0.18, uTime * 0.05));
  float lean = dot(n.xy, uPointer) * 0.08;
  float r = 1.0 + slow * 0.2 + fine * 0.045 + aRand * 0.2 + lean + uSpread * aRand * 1.6;
  vec3 p = n * r;
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = uSize * (0.55 + aRand * 0.9) / -mv.z;
  float facing = abs(dot(normalize(normalMatrix * n), vec3(0.0, 0.0, 1.0)));
  vAlpha = mix(0.25, 1.0, smoothstep(0.85, 0.15, facing)) * (1.0 - uSpread * 0.85);
  vTint = aRand;
}
`;

const fragment = /* glsl */ `
varying float vAlpha;
varying float vTint;
void main(){
  float d = length(gl_PointCoord - 0.5);
  if (d > 0.5) discard;
  float a = smoothstep(0.5, 0.05, d) * vAlpha;
  vec3 col = mix(vec3(1.0), vec3(0.9, 0.9, 1.0), vTint);
  gl_FragColor = vec4(col, a);
}
`;

/** Breathing shell of noise-displaced points, densest at the silhouette like a soft membrane. */
export function ParticleAura({ count = 36000, radius = 1.55 }: { count?: number; radius?: number }) {
  const dpr = useThree((s) => s.viewport.dpr);
  const mat = useRef<THREE.ShaderMaterial>(null);

  const geometry = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const rand = new Float32Array(count);
    const golden = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < count; i++) {
      const y = 1 - (i / (count - 1)) * 2;
      const r = Math.sqrt(1 - y * y);
      const theta = golden * i;
      positions[i * 3] = Math.cos(theta) * r;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = Math.sin(theta) * r;
      const h = Math.sin(i * 12.9898) * 43758.5453;
      rand[i] = h - Math.floor(h);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    g.setAttribute("aRand", new THREE.BufferAttribute(rand, 1));
    return g;
  }, [count]);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uSize: { value: 22 },
      uSpread: { value: 0 },
      uPointer: { value: new THREE.Vector2() },
    }),
    [],
  );

  useFrame((state, dt) => {
    const u = mat.current?.uniforms;
    if (!u) return;
    if (!motion.reduced) u.uTime.value += dt;
    u.uSize.value = 20 * dpr * radius;
    u.uSpread.value = THREE.MathUtils.damp(u.uSpread.value, motion.progress.hero * 0.6, 4, dt);
    const p = u.uPointer.value as THREE.Vector2;
    p.x = THREE.MathUtils.damp(p.x, motion.pointer.x, 2.5, dt);
    p.y = THREE.MathUtils.damp(p.y, motion.pointer.y, 2.5, dt);
  });

  return (
    <points geometry={geometry} scale={radius}>
      <shaderMaterial
        ref={mat}
        vertexShader={vertex}
        fragmentShader={fragment}
        uniforms={uniforms}
        transparent
        depthWrite={false}
      />
    </points>
  );
}
