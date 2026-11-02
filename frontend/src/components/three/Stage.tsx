"use client";

import type { CSSProperties, ReactNode } from "react";
import { PerspectiveCamera, View } from "@react-three/drei";
import { Studio } from "./Studio";

type StageProps = {
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
  fov?: number;
  z?: number;
};

/** A DOM-tracked window into the shared canvas, with its own camera and studio lighting. */
export function Stage({ className, style, children, fov = 32, z = 7 }: StageProps) {
  return (
    <View className={className} style={style} index={2}>
      <PerspectiveCamera makeDefault fov={fov} position={[0, 0, z]} />
      <Studio />
      {children}
    </View>
  );
}
