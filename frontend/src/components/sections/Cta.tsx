import Link from "next/link";
import { Reveal, RevealLines } from "@/components/ui/Reveal";

export function Cta() {
  return (
    <section id="get-started" className="relative isolate overflow-hidden py-[clamp(110px,14vw,220px)] text-center">
      <div
        aria-hidden
        className="absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(38% 60% at 30% 60%, rgba(188,208,247,0.7), transparent 70%), radial-gradient(34% 55% at 72% 40%, rgba(243,184,230,0.6), transparent 70%), radial-gradient(30% 40% at 50% 50%, #ffffff, transparent 80%)",
        }}
      />
      <div className="container-fs">
        <Reveal as="p" className="eyebrow">
          Free to start
        </Reveal>
        <RevealLines
          className="mx-auto mt-6 font-display text-[clamp(2.75rem,6.4vw,6rem)] font-light leading-[1] tracking-[-0.038em] text-ink"
          lines={["Start with one receipt.", <span key="l2"><span className="accent">See</span> the whole picture.</span>]}
        />
        <Reveal delay={0.3} className="mt-12 flex flex-wrap items-center justify-center gap-4">
          <Link href="/signup" className="rounded-full bg-ink px-10 py-[18px] text-[15px] font-medium text-white shadow-[0_18px_40px_-16px_rgba(28,27,58,0.7)] transition-transform duration-500 hover:-translate-y-0.5">
            Create your account
          </Link>
          <Link href="/signin" className="glass-pill rounded-full px-9 py-[18px] text-[15px] font-medium text-ink transition-transform duration-500 hover:-translate-y-0.5">
            Sign in
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
