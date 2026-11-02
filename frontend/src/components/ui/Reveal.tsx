"use client";

import { useRef, type ElementType, type ReactNode } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { prefersReducedMotion } from "@/lib/motion";

gsap.registerPlugin(ScrollTrigger, useGSAP);

type RevealLinesProps = {
  lines: ReactNode[];
  as?: ElementType;
  className?: string;
  delay?: number;
};

/** Editorial headline reveal: each line slides up from behind a mask. */
export function RevealLines({ lines, as: Tag = "h2", className, delay = 0 }: RevealLinesProps) {
  const ref = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      if (prefersReducedMotion() || !ref.current) return;
      gsap.to(ref.current.querySelectorAll("[data-line]"), {
        y: 0,
        duration: 1.15,
        ease: "expo.out",
        stagger: 0.08,
        delay,
        scrollTrigger: { trigger: ref.current, start: "top 88%", once: true },
      });
    },
    { scope: ref },
  );

  return (
    <Tag ref={ref} className={className}>
      {lines.map((line, i) => (
        <span key={i} className="block overflow-hidden pb-[0.08em] -mb-[0.08em]">
          <span data-line className="block will-change-transform">
            {line}
          </span>
        </span>
      ))}
    </Tag>
  );
}

type RevealProps = {
  children: ReactNode;
  as?: ElementType;
  className?: string;
  delay?: number;
  stagger?: boolean;
};

/** Fade-and-rise for blocks. With `stagger`, direct children marked data-reveal animate in sequence. */
export function Reveal({ children, as: Tag = "div", className, delay = 0, stagger }: RevealProps) {
  const ref = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      if (prefersReducedMotion() || !ref.current) return;
      const targets = stagger
        ? ref.current.querySelectorAll(":scope > [data-reveal]")
        : [ref.current];
      gsap.to(targets, {
        opacity: 1,
        y: 0,
        duration: 1.1,
        ease: "expo.out",
        delay,
        stagger: 0.1,
        scrollTrigger: { trigger: ref.current, start: "top 88%", once: true },
      });
    },
    { scope: ref },
  );

  return (
    <Tag ref={ref} className={className} {...(stagger ? {} : { "data-reveal": "" })}>
      {children}
    </Tag>
  );
}
