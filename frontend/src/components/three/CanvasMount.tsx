"use client";

import dynamic from "next/dynamic";

const SceneCanvas = dynamic(() => import("./SceneCanvas"), { ssr: false });

export function CanvasMount() {
  return <SceneCanvas />;
}
