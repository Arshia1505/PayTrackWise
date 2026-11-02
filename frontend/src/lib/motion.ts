/**
 * Mutable, non-reactive motion state shared between the DOM (GSAP/Lenis)
 * and the WebGL render loop. Read it inside useFrame; never put it in React state.
 */
export const motion = {
  pointer: { x: 0, y: 0 },
  scroll: { y: 0, velocity: 0 },
  progress: {
    hero: 0,
    rail: 0,
    showcase: 0,
  },
  reduced: false,
};

export const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

export const easeInOut = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

export const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;
