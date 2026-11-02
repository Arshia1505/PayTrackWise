"use client";

import * as THREE from "three";
import type { ThreeElements } from "@react-three/fiber";
import { rupeeShapes } from "./shapes";

export type CoinFinish = "chrome" | "iris" | "orchid" | "gold" | "cobalt";

/** Anodised / plated metals: the same hue is used for every part, roughness differentiates them. */
const metalColor: Record<CoinFinish, string> = {
  chrome: "#e1e5f0",
  iris: "#9c8ef2",
  orchid: "#f2b4d2",
  gold: "#e8d3a6",
  cobalt: "#7d92ea",
};

const R = 1;
const H = 0.16;
const FIELD = H * 0.68;
const FIELD_R = R * 0.8;

function canvasTexture(size: number, draw: (ctx: CanvasRenderingContext2D, size: number) => void) {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  draw(canvas.getContext("2d")!, size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 8;
  return tex;
}

let dotTex: THREE.CanvasTexture | null = null;
let ringTex: THREE.CanvasTexture | null = null;
let rimGeo: THREE.LatheGeometry | null = null;
let fieldGeo: THREE.CylinderGeometry | null = null;
let edgeGeo: THREE.BufferGeometry | null = null;
let glyphGeo: THREE.ExtrudeGeometry | null = null;

/** Halftone dot screen for the embossed glyph (the stippled finish in minted bullion). */
function getDotTexture() {
  dotTex ??= (() => {
    const t = canvasTexture(64, (ctx, s) => {
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, s, s);
      const g = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s * 0.32);
      g.addColorStop(0, "#fff");
      g.addColorStop(1, "#000");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(s / 2, s / 2, s * 0.32, 0, Math.PI * 2);
      ctx.fill();
    });
    t.repeat.set(18, 18);
    return t;
  })();
  return dotTex;
}

/** Fine concentric turning marks for the coin field. */
function getRingTexture() {
  ringTex ??= canvasTexture(1024, (ctx, s) => {
    ctx.fillStyle = "#808080";
    ctx.fillRect(0, 0, s, s);
    for (let r = 4; r < s / 2; r += 3) {
      ctx.strokeStyle = (r / 3) % 2 < 1 ? "#6c6c6c" : "#999999";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(s / 2, s / 2, r, 0, Math.PI * 2);
      ctx.stroke();
    }
  });
  return ringTex;
}

/** Raised, bevelled rim ring (cross-section revolved around Y). */
function getRimGeometry() {
  rimGeo ??= new THREE.LatheGeometry(
    [
      new THREE.Vector2(FIELD_R, -FIELD),
      new THREE.Vector2(R * 0.83, -H),
      new THREE.Vector2(R * 0.955, -H),
      new THREE.Vector2(R, -H * 0.72),
      new THREE.Vector2(R, H * 0.72),
      new THREE.Vector2(R * 0.955, H),
      new THREE.Vector2(R * 0.83, H),
      new THREE.Vector2(FIELD_R, FIELD),
    ],
    160,
  );
  return rimGeo;
}

function getFieldGeometry() {
  fieldGeo ??= new THREE.CylinderGeometry(FIELD_R, FIELD_R, FIELD * 2, 128);
  return fieldGeo;
}

/** Reeded edge: real alternating ridges, flat-shaded so each one catches light. */
function getEdgeGeometry() {
  if (!edgeGeo) {
    const ridges = 150;
    const g = new THREE.CylinderGeometry(R, R, H * 1.36, ridges * 2, 1, true);
    const pos = g.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const a = Math.atan2(z, x);
      const seg = Math.round(((a + Math.PI) / (Math.PI * 2)) * ridges * 2);
      const k = seg % 2 === 0 ? 1.012 : 0.996;
      pos.setX(i, x * k);
      pos.setZ(i, z * k);
    }
    edgeGeo = g.toNonIndexed();
    edgeGeo.computeVertexNormals();
    g.dispose();
  }
  return edgeGeo;
}

export function getRupeeGlyph() {
  if (!glyphGeo) {
    glyphGeo = new THREE.ExtrudeGeometry(rupeeShapes(), {
      depth: 0.07,
      bevelEnabled: true,
      bevelThickness: 0.025,
      bevelSize: 0.016,
      bevelSegments: 5,
      curveSegments: 40,
    });
    glyphGeo.center();
  }
  return glyphGeo;
}

type CoinProps = ThreeElements["group"] & { finish?: CoinFinish };

/**
 * Minted rupee coin: polished bevelled rim, reeded edge, turned field and a stippled, high-relief ₹.
 * Faces along ±Z.
 */
const tones = new Map<CoinFinish, { field: THREE.Color; glyph: THREE.Color }>();

function getTones(finish: CoinFinish) {
  let t = tones.get(finish);
  if (!t) {
    const base = new THREE.Color(metalColor[finish]);
    t = {
      field: base.clone().lerp(new THREE.Color("#23224a"), 0.22),
      glyph: base.clone().lerp(new THREE.Color("#ffffff"), 0.2),
    };
    tones.set(finish, t);
  }
  return t;
}

export function Coin({ finish = "chrome", ...props }: CoinProps) {
  const color = metalColor[finish];
  const { field, glyph } = getTones(finish);
  const glyphZ = FIELD + 0.012;

  return (
    <group {...props}>
      <group rotation={[Math.PI / 2, 0, 0]}>
        <mesh geometry={getRimGeometry()}>
          <meshPhysicalMaterial color={color} metalness={1} roughness={0.1} clearcoat={0.6} clearcoatRoughness={0.08} envMapIntensity={1.5} side={THREE.DoubleSide} />
        </mesh>
        <mesh geometry={getEdgeGeometry()}>
          <meshStandardMaterial color={color} metalness={1} roughness={0.24} envMapIntensity={1.35} />
        </mesh>
        <mesh geometry={getFieldGeometry()}>
          <meshStandardMaterial
            color={field}
            metalness={1}
            roughness={0.4}
            bumpMap={getRingTexture()}
            bumpScale={0.8}
            envMapIntensity={1.1}
          />
        </mesh>
      </group>
      {[1, -1].map((side) => (
        <mesh
          key={side}
          geometry={getRupeeGlyph()}
          position={[0, 0, glyphZ * side]}
          rotation={[0, side === 1 ? 0 : Math.PI, 0]}
          scale={[0.6, 0.6, 1.2]}
        >
          <meshStandardMaterial
            color={glyph}
            metalness={1}
            roughness={0.28}
            bumpMap={getDotTexture()}
            bumpScale={2.4}
            envMapIntensity={1.7}
          />
        </mesh>
      ))}
    </group>
  );
}
