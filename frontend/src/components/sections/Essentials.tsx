"use client";

import { useRef } from "react";
import { Stage } from "@/components/three/Stage";
import { RisingCoinScene } from "@/components/three/scenes/RisingCoinScene";
import type { CoinFinish } from "@/components/three/Coin";
import { Reveal, RevealLines } from "@/components/ui/Reveal";

const items: { title: string; body: string; finish: CoinFinish }[] = [
  {
    title: "Gentle reminders",
    body: "Upcoming EMIs, budget limits, savings-goal check-ins and recurring bills — nudged before they're due.",
    finish: "orchid",
  },
  {
    title: "Your data, exportable",
    body: "Download transactions, budgets and loan schedules as CSV or PDF whenever you want them.",
    finish: "cobalt",
  },
  {
    title: "Private by design",
    body: "Secure authentication, encrypted records and a profile you control. Never a bank credential.",
    finish: "gold",
  },
];

function EssentialCard({ item }: { item: (typeof items)[number] }) {
  const card = useRef<HTMLDivElement>(null);

  return (
    <div ref={card} className="flex flex-col overflow-hidden rounded-xl bg-haze">
      <div className="p-7">
        <h3 className="font-display text-[clamp(1.4rem,1.9vw,1.7rem)] font-normal leading-[1.15] tracking-[-0.02em] text-ink">
          {item.title}
        </h3>
        <p className="mt-3 text-[14px] leading-[1.6] text-muted">{item.body}</p>
      </div>
      <div className="relative mt-auto h-[240px]">
        <Stage className="absolute inset-0" z={5.5}>
          <RisingCoinScene track={card} finish={item.finish} />
        </Stage>
        <svg viewBox="0 0 400 90" preserveAspectRatio="none" className="absolute inset-x-0 bottom-0 z-20 h-[90px] w-full">
          <path d="M0 40 C 80 10, 150 70, 220 38 S 340 18, 400 44 L400 90 L0 90 Z" fill="#eceefb" />
          <path d="M0 40 C 80 10, 150 70, 220 38 S 340 18, 400 44" fill="none" stroke="#cbbef5" strokeWidth="2" />
          <path d="M0 58 C 90 34, 160 84, 240 56 S 350 38, 400 62" fill="none" stroke="#f3b8e6" strokeWidth="1.5" opacity="0.8" />
        </svg>
      </div>
    </div>
  );
}

export function Essentials() {
  return (
    <section id="security" className="container-fs py-[clamp(88px,10vw,160px)]">
      <div className="grid items-end gap-6 md:grid-cols-12">
        <div className="md:col-span-6">
          <Reveal as="p" className="eyebrow">
            The quiet essentials
          </Reveal>
          <RevealLines
            className="mt-5 font-display text-[clamp(2.25rem,4.2vw,3.9rem)] font-light leading-[1.04] tracking-[-0.032em] text-ink"
            lines={["Everything around", <span key="l2">the core, <span className="accent">handled</span></span>]}
          />
        </div>
        <Reveal as="p" className="text-[15px] leading-[1.6] text-muted md:col-span-4 md:col-start-9">
          Reminders, exports, authentication and a consolidated dashboard — the supporting cast that makes the core loop
          dependable.
        </Reveal>
      </div>
      <div className="mt-14 grid gap-4 md:grid-cols-3">
        {items.map((it) => (
          <EssentialCard key={it.title} item={it} />
        ))}
      </div>
    </section>
  );
}
