import type { Metadata } from "next";
import { SmoothScroll } from "@/components/providers/SmoothScroll";
import { CanvasMount } from "@/components/three/CanvasMount";
import { Nav } from "@/components/sections/Nav";
import { Hero } from "@/components/sections/Hero";
import { Loop } from "@/components/sections/Loop";
import { Pillars } from "@/components/sections/Pillars";
import { Showcase } from "@/components/sections/Showcase";
import { Bento } from "@/components/sections/Bento";
import { Honest } from "@/components/sections/Honest";
import { Essentials } from "@/components/sections/Essentials";
import { Cta } from "@/components/sections/Cta";
import { Footer } from "@/components/sections/Footer";

export const metadata: Metadata = {
  title: "FinShield — Every rupee, understood and shielded",
  description:
    "Track income and expenses, scan bills with OCR, plan budgets, savings and EMIs, and let ML Shield flag unusual or duplicate transactions.",
};

export default function Home() {
  return (
    <SmoothScroll>
      <div className="marketing bg-white text-ink">
        <CanvasMount />
        <Nav />
        <main>
          <Hero />
          <Loop />
          <Pillars />
          <Showcase />
          <Bento />
          <Honest />
          <Essentials />
          <Cta />
        </main>
        <Footer />
      </div>
    </SmoothScroll>
  );
}
