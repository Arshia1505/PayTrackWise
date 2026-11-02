"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { motion } from "@/lib/motion";

const vertex = /* glsl */ `
varying vec3 vNormal;
varying vec3 vObj;
varying vec2 vUv;
void main(){
  vNormal = normalize(normalMatrix * normal);
  vObj = position;
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const fragment = /* glsl */ `
uniform float uTime;
varying vec3 vNormal;
varying vec3 vObj;
varying vec2 vUv;
void main(){
  vec3 n = normalize(vNormal);
  float t = normalize(vObj).y * 0.5 + 0.5;
  vec3 azure = vec3(0.22, 0.5, 1.0);
  vec3 lilac = vec3(0.79, 0.74, 0.97);
  vec3 peach = vec3(0.99, 0.86, 0.82);
  vec3 base = mix(azure, lilac, smoothstep(0.25, 0.7, t));
  base = mix(base, peach, smoothstep(0.68, 1.0, t));

  float light = clamp(dot(n, normalize(vec3(-0.4, 0.65, 0.65))) * 0.5 + 0.5, 0.0, 1.0);
  vec2 grid = vec2(vUv.x * 110.0 + uTime * 0.6, vUv.y * 55.0);
  vec2 cell = fract(grid) - 0.5;
  float r = mix(0.1, 0.34, light);
  float dots = 1.0 - smoothstep(r - 0.07, r, length(cell));

  float fres = pow(1.0 - abs(n.z), 2.2);
  vec3 col = mix(base, vec3(1.0), dots * 0.7);
  col = mix(col, vec3(1.0), fres * 0.9);
  float alpha = 1.0 - smoothstep(0.55, 1.0, fres) * 0.55;
  gl_FragColor = vec4(col, alpha);
}
`;

/** Gradient orb (peach crown → azure base) covered in light-driven halftone dots. */
export function HalftoneCore({ radius = 1.15 }: { radius?: number }) {
  const mat = useRef<THREE.ShaderMaterial>(null);
  const uniforms = useMemo(() => ({ uTime: { value: 0 } }), []);

  useFrame((_, dt) => {
    if (mat.current && !motion.reduced) mat.current.uniforms.uTime.value += dt;
  });

  return (
    <mesh>
      <sphereGeometry args={[radius, 96, 96]} />
      <shaderMaterial ref={mat} vertexShader={vertex} fragmentShader={fragment} uniforms={uniforms} transparent />
    </mesh>
  );
}
