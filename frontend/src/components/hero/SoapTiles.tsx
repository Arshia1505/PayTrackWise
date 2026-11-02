"use client";

import { useEffect, useState } from "react";

const TILES = [
  { label: "Scan Receipts & Track Spend", baseXOffset: 120, delay: 0 },
  { label: "Budgets, Goals & EMI Plans", baseXOffset: 180, delay: 100 },
  { label: "Anomaly & Duplicate Shield", baseXOffset: 240, delay: 200 },
] as const;

function clamp01(value: number) {
  return Math.min(1, Math.max(0, value));
}

function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(min-width: 768px)");
    const onChange = () => setIsDesktop(query.matches);
    onChange();
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  return isDesktop;
}

/**
 * White feature tiles that slide in from the left once the hero scroll passes three quarters,
 * and nudge apart when one is hovered.
 */
export function SoapTiles({ scrollProgress }: { scrollProgress: number }) {
  const [hovered, setHovered] = useState<number | null>(null);
  const isDesktop = useIsDesktop();
  const visible = scrollProgress > 0.75;
  const easeProgress = clamp01((scrollProgress - 0.75) / 0.22);

  return (
    <div
      className={`absolute left-4 right-4 top-[38%] z-40 flex -translate-y-1/2 flex-col gap-2 transition-all duration-[800ms] ease-out md:left-[64px] md:top-1/2 md:gap-[10px] ${
        visible ? "" : "pointer-events-none -translate-x-6 opacity-0 md:-translate-x-12"
      }`}
    >
      {TILES.map((tile, index) => {
        const offset = isDesktop ? tile.baseXOffset : tile.baseXOffset * 0.25;
        const translateX = (easeProgress - 1) * offset;
        const shiftY = isDesktop && hovered !== null && hovered !== index ? (index < hovered ? -13.8 : 13.8) : 0;
        const scale = isDesktop && hovered === index ? 1.2 : 1;

        return (
          <div
            key={tile.label}
            className="relative flex h-[52px] w-full origin-left cursor-pointer items-center justify-center self-start whitespace-nowrap rounded-xl bg-white px-4 text-ink shadow-[0_24px_50px_-24px_rgba(90,80,180,0.45)] transition-all duration-[400ms] ease-[cubic-bezier(0.16,1,0.3,1)] sm:h-[72px] sm:rounded-2xl sm:px-8 md:h-[138px] md:w-auto md:rounded-[34px] md:px-14"
            style={{
              transform: `translateX(${translateX}px) translateY(${shiftY}px) scale(${scale})`,
              opacity: easeProgress,
              filter: `blur(${(1 - easeProgress) * 12}px)`,
              transitionDelay: `${tile.delay}ms`,
            }}
            onMouseEnter={() => setHovered(index)}
            onMouseLeave={() => setHovered(null)}
          >
            <span className="font-michroma text-[11px] font-medium leading-[16px] tracking-[-0.03em] sm:text-[14px] sm:leading-[22px] md:text-[23px] md:leading-[34px]">
              {tile.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
