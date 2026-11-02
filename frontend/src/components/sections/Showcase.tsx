"use client";

import { useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { Stage } from "@/components/three/Stage";
import { ShowcaseScene } from "@/components/three/scenes/ShowcaseScene";
import { Reveal, RevealLines } from "@/components/ui/Reveal";
import { motion } from "@/lib/motion";

gsap.registerPlugin(ScrollTrigger, useGSAP);

const modules = [
  {
    title: "Expense & OCR Intelligence",
    body: "Log income and expenses by hand, or upload a bill and let OCR extract the merchant, date, line items, tax and total — then auto-categorise it.",
    tags: ["Income & expense tracking", "OCR bill scanner", "Auto-categorisation", "Spending analytics"],
  },
  {
    title: "Budgets & Savings Goals",
    body: "Set monthly and category-wise budgets with early alerts, and savings goals that calculate exactly what to set aside each month.",
    tags: ["Smart budget planner", "Savings goal planner"],
  },
  {
    title: "Debt & Calculator Hub",
    body: "Record loans, interest rates, outstanding principal, EMIs and due dates. Run EMI, prepayment, SIP, compound interest and goal calculators.",
    tags: ["Debt & EMI tracker", "5 financial calculators"],
  },
  {
    title: "ML Shield",
    body: "Anomaly detection compares every transaction with your own spending history; duplicate detection catches repeated bills and entries.",
    tags: ["Anomaly detection", "Duplicate detection"],
  },
];

export function Showcase() {
  const track = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  useGSAP(() => {
    ScrollTrigger.create({
      trigger: track.current,
      start: "top top",
      end: "bottom bottom",
      onRefresh: (s) => (motion.progress.showcase = s.progress),
      onUpdate: (s) => {
        motion.progress.showcase = s.progress;
        const next = Math.min(modules.length - 1, Math.floor(s.progress * modules.length));
        setActive((prev) => (prev === next ? prev : next));
      },
    });
  });

  return (
    <section id="features" className="relative">
      <div className="container-fs pt-[clamp(88px,10vw,160px)] text-center">
        <Reveal as="p" className="eyebrow">
          4 core modules · 10 features
        </Reveal>
        <RevealLines
          className="mx-auto mt-6 font-display text-[clamp(2.25rem,4.6vw,4.25rem)] font-light leading-[1.06] tracking-[-0.032em] text-ink"
          lines={["Built around how money", <span key="l2">actually <span className="accent">moves</span></span>]}
        />
      </div>

      <div ref={track} className="relative h-[420vh]">
        <div className="sticky top-0 flex h-[100svh] items-center overflow-hidden max-lg:pt-20">
          <div className="container-fs grid items-center gap-6 lg:grid-cols-12 lg:gap-10">
            <div className="relative h-[40svh] lg:col-span-6 lg:h-[76vh]">
              <div
                aria-hidden
                className="absolute inset-[8%] rounded-full opacity-80 blur-3xl"
                style={{ background: "radial-gradient(circle at 40% 40%, #dfe6fd, #f1dcf6 55%, transparent 72%)" }}
              />
              <Stage className="absolute inset-0" z={6.4}>
                <ShowcaseScene />
              </Stage>
              <div className="absolute bottom-2 left-0 font-display text-[13px] tracking-[0.12em] text-mist">
                0{active + 1} <span className="text-mist/50">/ 0{modules.length}</span>
              </div>
            </div>

            <ol className="lg:col-span-5 lg:col-start-8">
              {modules.map((m, i) => {
                const on = i === active;
                return (
                  <li
                    key={m.title}
                    className={`border-t border-ink/10 py-5 transition-opacity duration-700 ease-[var(--ease-expo)] lg:py-7 ${
                      on ? "opacity-100" : "opacity-25"
                    }`}
                  >
                    <div className="flex items-center gap-4 text-[12px] text-mist">
                      <span>{i + 1}</span>
                      <span
                        className={`h-px bg-iris transition-all duration-700 ease-[var(--ease-expo)] ${on ? "w-16" : "w-4"}`}
                      />
                    </div>
                    <h3 className="mt-3 font-display text-[clamp(1.5rem,2.4vw,2.15rem)] font-normal leading-[1.1] tracking-[-0.025em] text-ink">
                      {m.title}
                    </h3>
                    <div
                      className={`grid transition-[grid-template-rows] duration-700 ease-[var(--ease-expo)] ${
                        on ? "grid-rows-[1fr]" : "grid-rows-[0fr] lg:grid-rows-[1fr]"
                      }`}
                    >
                      <div className="overflow-hidden">
                        <p className="mt-3 max-w-[460px] text-[15px] leading-[1.6] text-muted">{m.body}</p>
                        <div className="mt-4 flex flex-wrap gap-2">
                          {m.tags.map((t) => (
                            <span key={t} className="rounded-full bg-haze px-3 py-1.5 text-[12px] text-ink-soft">
                              {t}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
}
