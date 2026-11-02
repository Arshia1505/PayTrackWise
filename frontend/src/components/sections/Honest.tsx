import { Stage } from "@/components/three/Stage";
import { RibbonScene } from "@/components/three/scenes/RibbonScene";

function RotatingBadge() {
  return (
    <div className="relative h-36 w-36">
      <svg viewBox="0 0 120 120" className="animate-spin-slow absolute inset-0 h-full w-full">
        <defs>
          <path id="badge-circle" d="M60,60 m-46,0 a46,46 0 1,1 92,0 a46,46 0 1,1 -92,0" />
        </defs>
        <text className="fill-ink text-[10.5px] tracking-[0.32em]">
          <textPath href="#badge-circle">SCAN · PLAN · PROTECT · SCAN · PLAN · </textPath>
        </text>
      </svg>
      <svg viewBox="0 0 32 36" className="absolute left-1/2 top-1/2 h-9 w-9 -translate-x-1/2 -translate-y-1/2" aria-hidden>
        <path d="M16 1.5c4.2 2 8.6 2.7 13.6 2.9.5 13.2-4.1 23.6-13.6 30.1C6.5 28 1.9 17.6 2.4 4.4 7.4 4.2 11.8 3.5 16 1.5Z" fill="#1c1b3a" />
      </svg>
    </div>
  );
}

/** raidx-style frame: the white editorial panel sits above the canvas (z-20) so the ribbon flows behind it. */
export function Honest() {
  return (
    <section id="shield" className="container-fs py-[clamp(48px,6vw,96px)]">
      <div
        className="relative min-h-[680px] overflow-hidden rounded-[32px] lg:h-[min(780px,94vh)]"
        style={{ background: "linear-gradient(135deg, #dcd2fb 0%, #c9d6fb 45%, #f1c9ee 100%)" }}
      >
        <Stage className="absolute inset-x-0 bottom-0 h-[460px] lg:top-0 lg:h-auto" fov={30} z={9}>
          <RibbonScene />
        </Stage>

        <div className="relative z-20 flex w-full flex-col justify-between rounded-br-[56px] bg-white p-8 sm:p-12 lg:absolute lg:left-0 lg:top-0 lg:h-[76%] lg:w-[56%] lg:p-14">
          <span className="concave left-full top-0 max-lg:hidden" />
          <span className="concave left-0 top-full max-lg:hidden" />
          <div>
            <div className="flex items-center gap-5 text-[13px] text-ink-soft">
              <span>ML Shield, honestly</span>
              <span className="h-px flex-1 bg-ink/15" />
              <span>v1</span>
            </div>
            <h2 className="mt-10 font-display text-[clamp(2.4rem,4.8vw,4.6rem)] font-light leading-[1.02] tracking-[-0.035em] text-ink">
              Protection that&apos;s <span className="font-semibold">honest</span> about its <span className="accent">limits</span>
            </h2>
            <p className="mt-7 max-w-[500px] text-[15px] leading-[1.65] text-muted">
              ML Shield studies the transactions you record — not your bank. It compares every new entry with your own
              history and flags what doesn&apos;t fit, with a plain-language reason. No bank passwords, no black boxes, no
              false fraud alarms.
            </p>
          </div>
          <div className="mt-10 flex flex-wrap items-center gap-8">
            <a href="/signup" className="rounded-full bg-ink px-8 py-4 text-[15px] font-medium text-white transition-transform duration-500 hover:-translate-y-0.5">
              Create your account
            </a>
            <div className="flex gap-8 text-[12px] leading-[1.5] text-mist">
              <p>
                <span className="block font-display text-[22px] text-ink">Anomaly</span>vs. your history
              </p>
              <p>
                <span className="block font-display text-[22px] text-ink">Duplicate</span>bills & entries
              </p>
            </div>
          </div>
        </div>

        <div className="absolute right-[12%] top-[14%] z-20 max-lg:hidden">
          <RotatingBadge />
        </div>

        <div className="frost absolute bottom-6 right-6 z-20 w-[min(340px,calc(100%-3rem))] rounded-2xl p-5 max-lg:relative max-lg:bottom-auto max-lg:right-auto max-lg:m-6 max-lg:mt-[340px]">
          <div className="flex items-center justify-between text-[13px]">
            <span className="font-medium text-ink">Every flag explains itself</span>
            <span className="text-iris">●</span>
          </div>
          <p className="mt-2 text-[12px] leading-[1.55] text-muted">
            “₹18,400 at 2:13 AM is 6.2× your usual electronics spend and outside your normal hours.”
          </p>
        </div>
      </div>
    </section>
  );
}
