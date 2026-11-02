"use client";

import gsap from "gsap";
import { useEffect, useRef, useState, type RefObject } from "react";

const VIDEO_URL =
  "https://pub-86dc5b5484314368ac5436a674b0d919.r2.dev/cloudinarry%20to%20cloudflare/202606021731-e_hqa6sn.mp4";

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

/** Full-bleed video whose playhead follows the hero's scroll progress, with gentle pointer parallax. */
export function VideoScrubber({ progressRef }: { progressRef: RefObject<number> }) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const parallaxRef = useRef<HTMLDivElement | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = true;
    video.playsInline = true;
    if (video.readyState >= 2) setIsLoaded(true);
  }, []);

  useEffect(() => {
    let raf = 0;
    let current = 0;

    const tick = () => {
      const video = videoRef.current;
      if (video && video.readyState >= 1) {
        const duration = Number.isFinite(video.duration) && video.duration > 0 ? video.duration : 4.2;
        const target = clamp((progressRef.current ?? 0) * duration, 0, duration);
        current += (target - current) * 0.15;
        if (!video.seeking && Math.abs(video.currentTime - current) > 0.01) {
          video.currentTime = current;
        }
      }
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [progressRef]);

  useEffect(() => {
    const container = parallaxRef.current;
    if (!container) return;

    const onMove = (event: MouseEvent) => {
      const mx = event.clientX / window.innerWidth - 0.5;
      const my = event.clientY / window.innerHeight - 0.5;
      gsap.to(container, { x: -mx * 40, y: -my * 40, duration: 1.2, ease: "power2.out", overwrite: "auto" });
    };

    window.addEventListener("mousemove", onMove);
    return () => {
      window.removeEventListener("mousemove", onMove);
      gsap.killTweensOf(container);
    };
  }, []);

  return (
    <div ref={parallaxRef} className="absolute inset-0 bg-peri" style={{ willChange: "transform" }}>
      <div className="h-full w-full" style={{ scale: "1.05", willChange: "transform" }}>
        <video
          ref={videoRef}
          src={VIDEO_URL}
          playsInline
          muted
          preload="auto"
          onLoadedData={() => setIsLoaded(true)}
          onError={() => setIsLoaded(true)}
          className="pointer-events-none h-full w-full object-cover"
          style={{ filter: "hue-rotate(-36deg) saturate(0.55) brightness(1.18) contrast(0.92)" }}
        />
      </div>

      {!isLoaded ? (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-peri/95">
          <div className="relative h-16 w-16">
            <div className="absolute inset-0 animate-ping rounded-full bg-lilac/60" />
            <div className="absolute inset-0 m-auto h-10 w-10 animate-spin rounded-full border-4 border-iris/20 border-t-iris" />
          </div>
          <span className="mt-6 text-[12px] font-semibold uppercase tracking-[0.25em] text-iris">Loading FinShield...</span>
        </div>
      ) : null}
    </div>
  );
}
