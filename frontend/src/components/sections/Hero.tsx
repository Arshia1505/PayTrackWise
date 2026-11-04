"use client";

import { useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { ScrollExitSplitText } from "@/components/hero/ScrollExitSplitText";
import { SoapTiles } from "@/components/hero/SoapTiles";
import { VideoScrubber } from "@/components/hero/VideoScrubber";
import { Stage } from "@/components/three/Stage";
import { HeroSideCoins } from "@/components/three/scenes/HeroSideCoins";

gsap.registerPlugin(ScrollTrigger, useGSAP);

/**
 * The scroll-scrubbed hero: the video, the falling FINSHIELD wordmark and the feature tiles
 * play out across this section, then the page continues into the rest of the site.
 */
export function Hero() {
  const ref = useRef<HTMLElement>(null);
  const progress = useRef(0);
  const [tileProgress, setTileProgress] = useState(0);

  useGSAP(
    () => {
      ScrollTrigger.create({
        trigger: ref.current,
        start: "top top",
        end: "bottom bottom",
        onUpdate: (s) => {
          progress.current = s.progress;
          setTileProgress(s.progress);
        },
        onRefresh: (s) => {
          progress.current = s.progress;
          setTileProgress(s.progress);
        },
      });
    },
    { scope: ref },
  );

  return (
    <section id="top" ref={ref} className="relative h-[230svh]">
      <div className="sticky top-0 h-[100svh] overflow-hidden">
        <VideoScrubber progressRef={progress} />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-[5] mix-blend-soft-light"
          style={{
            background: [
              "radial-gradient(46% 50% at 18% 38%, #ffffff 0%, rgba(255,255,255,0) 70%)",
              "radial-gradient(40% 46% at 88% 12%, #f3b8e6 0%, rgba(243,184,230,0) 68%)",
              "radial-gradient(52% 58% at 72% 88%, #bcd0f7 0%, rgba(188,208,247,0) 70%)",
              "linear-gradient(165deg, #e4ebfd 0%, #ddd6fb 52%, #f6d4ee 100%)",
            ].join(","),
          }}
        />
        <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 z-[6] h-48 bg-gradient-to-b from-transparent to-white" />

        <Stage className="pointer-events-none absolute inset-0" fov={30} z={6.4}>
          <HeroSideCoins progressRef={progress} />
        </Stage>

        <div className="pointer-events-none absolute bottom-[40px] left-[1%] right-[1%] z-20 flex select-none items-center justify-center">
          <ScrollExitSplitText
            progressRef={progress}
            className="w-full whitespace-nowrap text-center font-michroma text-[10.4vw] font-normal uppercase leading-none text-ink"
            style={{ letterSpacing: "-0.07em" }}
          >
            FINSHIELD
          </ScrollExitSplitText>
        </div>

        <SoapTiles scrollProgress={tileProgress} />
        <h1 className="sr-only">FinShield — every rupee, understood and shielded</h1>
      </div>
    </section>
  );
}
