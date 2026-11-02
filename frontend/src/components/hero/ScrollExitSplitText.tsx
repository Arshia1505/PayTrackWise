"use client";

import gsap from "gsap";
import { useEffect, useLayoutEffect, useRef, type CSSProperties, type RefObject } from "react";

/** Oversized wordmark whose letters fall away, one after another, as the hero scrolls. */
export function ScrollExitSplitText({
  children,
  progressRef,
  className,
  style,
}: {
  children: string;
  progressRef: RefObject<number>;
  className?: string;
  style?: CSSProperties;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);
  const lines = children.split("\n");

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const chars = container.querySelectorAll<HTMLElement>(".char");
    const timeline = gsap.timeline({ paused: true });
    timeline.fromTo(
      chars,
      { opacity: 1, yPercent: 0, y: 0, scaleY: 1, scaleX: 1, transformOrigin: "50% 0%" },
      { opacity: 0, yPercent: 300, y: "25vh", scaleY: 1.2, scaleX: 0.9, stagger: 0.03, ease: "power2.inOut" },
    );
    timelineRef.current = timeline;

    return () => {
      timeline.kill();
      timelineRef.current = null;
    };
  }, [children]);

  useEffect(() => {
    let raf = 0;

    const loop = () => {
      const timeline = timelineRef.current;
      if (timeline && Math.abs(timeline.progress() - (progressRef.current ?? 0)) > 0.0005) {
        gsap.to(timeline, {
          progress: progressRef.current ?? 0,
          duration: 0.6,
          ease: "power1.out",
          overwrite: "auto",
        });
      }
      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [progressRef]);

  return (
    <div ref={containerRef} className={className} style={style} aria-hidden>
      {lines.map((line, lineIndex) => {
        const words = line.split(" ");
        return (
          <div key={lineIndex} className="block">
            {words.map((word, wordIndex) => (
              <span key={wordIndex} className="inline-block">
                {Array.from(word).map((char, charIndex) => (
                  <span key={charIndex} className="char inline-block will-change-transform">
                    {char}
                  </span>
                ))}
                {wordIndex < words.length - 1 ? <span>&nbsp;</span> : null}
              </span>
            ))}
          </div>
        );
      })}
    </div>
  );
}
