"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { LogoMark } from "@/components/ui/Logo";
import { prefersReducedMotion } from "@/lib/motion";

gsap.registerPlugin(ScrollTrigger, useGSAP);

const nav = [
  { label: "Home", href: "#top" },
  { label: "Features", href: "#features" },
  { label: "ML Shield", href: "#shield" },
  { label: "Calculators", href: "#inside" },
  { label: "Security", href: "#security" },
];

const socials = [
  {
    label: "X",
    path: "M17.8 3h3.1l-6.8 7.8L22 21h-6.2l-4.9-6.4L5.3 21H2.2l7.3-8.3L2 3h6.4l4.4 5.8L17.8 3Zm-1.1 16.2h1.7L7.4 4.7H5.6l11.1 14.5Z",
  },
  {
    label: "LinkedIn",
    path: "M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5ZM3 9.5h4v11H3v-11Zm6.5 0h3.8v1.6h.1c.5-1 1.8-2 3.8-2 4 0 4.8 2.6 4.8 6v5.4h-4v-4.8c0-1.2 0-2.6-1.6-2.6s-1.9 1.2-1.9 2.5v4.9h-4v-11Z",
  },
  {
    label: "Instagram",
    path: "M12 7.3a4.7 4.7 0 1 0 0 9.4 4.7 4.7 0 0 0 0-9.4Zm0 7.7a3 3 0 1 1 0-6 3 3 0 0 1 0 6Zm6-7.9a1.1 1.1 0 1 1-2.2 0 1.1 1.1 0 0 1 2.2 0ZM12 2.5c-2.6 0-2.9 0-3.9.1-3.4.2-5.4 2.1-5.5 5.5-.1 1-.1 1.3-.1 3.9s0 2.9.1 3.9c.2 3.4 2.1 5.4 5.5 5.5 1 .1 1.3.1 3.9.1s2.9 0 3.9-.1c3.4-.2 5.4-2.1 5.5-5.5.1-1 .1-1.3.1-3.9s0-2.9-.1-3.9c-.2-3.4-2.1-5.4-5.5-5.5-1-.1-1.3-.1-3.9-.1Z",
  },
];

export function Footer() {
  const word = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (prefersReducedMotion()) return;
    gsap.fromTo(
      word.current,
      { yPercent: 35 },
      {
        yPercent: 0,
        ease: "none",
        scrollTrigger: { trigger: word.current, start: "top bottom", end: "bottom bottom", scrub: true },
      },
    );
  });

  return (
    <footer className="bg-[#dcdcf7] px-[clamp(10px,2.6vw,40px)] pb-[clamp(10px,2.6vw,40px)]">
      <div className="relative overflow-hidden rounded-2xl bg-white shadow-[0_40px_80px_-40px_rgba(90,80,180,0.45)]">
        <div className="container-fs grid grid-cols-12 items-start gap-y-10 pt-[clamp(56px,7vw,110px)]">
          <div className="col-span-6 md:col-span-2">
            <LogoMark className="h-20 w-[72px] md:h-28 md:w-24" />
          </div>
          <div className="col-span-6 flex justify-end gap-3 md:order-last md:col-span-2 md:flex-col md:items-end">
            {socials.map((s) => (
              <a
                key={s.label}
                href="#"
                aria-label={s.label}
                className="grid h-12 w-12 place-items-center rounded-full bg-haze text-ink-soft transition-all duration-500 hover:bg-ink hover:text-white"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden>
                  <path d={s.path} />
                </svg>
              </a>
            ))}
          </div>
          <nav className="col-span-12 flex flex-col items-center md:col-span-8">
            {nav.map((n) => (
              <a
                key={n.label}
                href={n.href}
                className="group font-display text-[clamp(2.4rem,5vw,4.3rem)] font-light leading-[1.04] tracking-[-0.035em] text-ink-soft transition-colors duration-500 hover:text-iris"
              >
                <span className="group-hover:hidden">{n.label}</span>
                <span className="accent hidden group-hover:inline">{n.label}</span>
              </a>
            ))}
          </nav>
        </div>

        <div className="container-fs mt-[clamp(56px,7vw,110px)] flex flex-wrap items-center justify-between gap-4 text-[12px]">
          <span className="text-mist">©2026 FinShield</span>
          <span className="flex gap-6 font-medium text-ink">
            <a href="#">Privacy Policy</a>
            <a href="#">Terms</a>
          </span>
          <span className="text-mist">Made in India · All rights reserved.</span>
        </div>

        <div aria-hidden className="mt-6 overflow-hidden">
          <div
            ref={word}
            className="-mb-[4.2vw] select-none text-center font-display text-[15.2vw] font-semibold leading-[0.8] tracking-[-0.06em] text-[#f1f2fb]"
          >
            FINSHIELD
          </div>
        </div>
      </div>
    </footer>
  );
}
