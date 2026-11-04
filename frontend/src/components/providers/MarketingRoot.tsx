"use client";

import { useEffect, type ReactNode } from "react";
import { SmoothScroll } from "@/components/providers/SmoothScroll";
import { CanvasMount } from "@/components/three/CanvasMount";

export function MarketingRoot({ children }: { children: ReactNode }) {
  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    html.classList.add("marketing-root");
    body.classList.add("marketing-root");
    return () => {
      html.classList.remove("marketing-root");
      body.classList.remove("marketing-root");
    };
  }, []);

  return (
    <>
      <SmoothScroll>{children}</SmoothScroll>
      <CanvasMount />
    </>
  );
}
