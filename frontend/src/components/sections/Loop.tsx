"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { Stage } from "@/components/three/Stage";
import { RailScene } from "@/components/three/scenes/RailScene";
import { Reveal, RevealLines } from "@/components/ui/Reveal";
import { motion } from "@/lib/motion";

gsap.registerPlugin(ScrollTrigger, useGSAP);

export function Loop() {
  const stage = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    ScrollTrigger.create({
      trigger: stage.current,
      start: "top bottom",
      end: "bottom top",
      onUpdate: (s) => (motion.progress.rail = s.progress),
      onRefresh: (s) => (motion.progress.rail = s.progress),
    });
  });

  return (
    <section id="loop" className="relative pt-[clamp(88px,12vw,192px)]">
      <div className="container-fs text-center">
        <Reveal as="p" className="eyebrow">
          The FinShield loop
        </Reveal>
        <RevealLines
          className="mx-auto mt-6 font-display text-[clamp(2.25rem,4.6vw,4.25rem)] font-light leading-[1.06] tracking-[-0.032em] text-ink"
          lines={[
            "From a crumpled receipt",
            <span key="l2">
              to a calm, <span className="accent">protected</span> plan
            </span>,
          ]}
        />
        <Reveal delay={0.2} as="p" className="mt-6 text-[clamp(1rem,1.4vw,1.25rem)] text-mist">
          Capture · Understand · Plan · Protect
        </Reveal>
      </div>
      <div ref={stage}>
        <Stage className="relative h-[clamp(320px,50vw,640px)] w-full" fov={30} z={11}>
          <RailScene />
        </Stage>
      </div>
    </section>
  );
}
