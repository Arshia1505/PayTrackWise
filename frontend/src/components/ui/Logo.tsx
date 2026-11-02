import { useId } from "react";

export function LogoMark({ className = "h-8 w-8" }: { className?: string }) {
  const id = useId();
  return (
    <svg viewBox="0 0 32 36" className={className} aria-hidden>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#8f7df0" />
          <stop offset="1" stopColor="#1c1b3a" />
        </linearGradient>
      </defs>
      <path
        d="M16 1.5c4.2 2 8.6 2.7 13.6 2.9.5 13.2-4.1 23.6-13.6 30.1C6.5 28 1.9 17.6 2.4 4.4 7.4 4.2 11.8 3.5 16 1.5Z"
        fill={`url(#${id})`}
      />
      <path d="M10 17.6l4.4 4.4L22.6 13" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Logo({ tone = "dark" }: { tone?: "dark" | "light" }) {
  return (
    <span className="flex items-center gap-2">
      <LogoMark className="h-7 w-7" />
      <span
        className={`font-display text-[18px] font-medium tracking-[-0.03em] ${
          tone === "light" ? "text-white" : "text-ink"
        }`}
      >
        FinShield
      </span>
    </span>
  );
}
