import type { ReactNode } from "react";
import { Reveal, RevealLines } from "@/components/ui/Reveal";

function Card({
  className,
  title,
  caption,
  children,
  delay = 0,
}: {
  className?: string;
  title: string;
  caption: string;
  children: ReactNode;
  delay?: number;
}) {
  return (
    <Reveal delay={delay} className={`frost group flex min-h-[480px] flex-col rounded-[28px] p-6 sm:p-8 ${className ?? ""}`}>
      <div className="relative flex flex-1 items-center justify-center">{children}</div>
      <h3 className="mt-8 font-display text-[clamp(1.5rem,2.1vw,1.85rem)] font-normal tracking-[-0.02em] text-ink">{title}</h3>
      <p className="mt-2 max-w-[380px] text-[14px] leading-[1.55] text-muted">{caption}</p>
    </Reveal>
  );
}

const panel = "rounded-2xl bg-white/90 shadow-[0_20px_40px_-24px_rgba(90,80,180,0.45),inset_0_0_0_1px_rgba(255,255,255,1)]";

function OcrMock() {
  const fields = [
    ["Merchant", "Blue Tokai Coffee Roasters"],
    ["Date", "28 Oct 2026 · 09:14"],
    ["Items", "Cappuccino ×2 · Almond croissant"],
    ["Tax (GST 5%)", "₹26.10"],
    ["Total", "₹548.10"],
  ];
  return (
    <div className="flex w-full max-w-[560px] items-center gap-5 max-sm:flex-col">
      <div className={`${panel} relative w-[170px] shrink-0 overflow-hidden p-4 text-[10px] leading-[1.7] text-mist`}>
        <p className="text-[11px] font-semibold text-ink">BLUE TOKAI</p>
        <p>Indiranagar, Bengaluru</p>
        <div className="my-2 h-px bg-haze" />
        <p className="flex justify-between"><span>Cappuccino ×2</span><span>380.00</span></p>
        <p className="flex justify-between"><span>Almond croissant</span><span>142.00</span></p>
        <p className="flex justify-between"><span>CGST + SGST</span><span>26.10</span></p>
        <div className="my-2 h-px bg-haze" />
        <p className="flex justify-between font-semibold text-ink"><span>TOTAL</span><span>548.10</span></p>
        <span className="animate-scan absolute inset-x-0 h-8 bg-gradient-to-b from-transparent via-azure/25 to-transparent">
          <span className="absolute inset-x-0 top-1/2 h-px bg-azure" />
        </span>
      </div>
      <div className="w-full space-y-2">
        {fields.map(([k, v], i) => (
          <div key={k} className={`${panel} flex items-center justify-between px-4 py-2.5 text-[12px]`}>
            <span className="text-mist">{k}</span>
            <span className={i === 4 ? "font-semibold text-ink" : "text-ink-soft"}>{v}</span>
          </div>
        ))}
        <div className="flex items-center gap-2 pt-1 text-[11px]">
          <span className="rounded-full bg-lilac/50 px-2.5 py-1 text-ink-soft">Food & Dining · auto</span>
          <span className="text-mist">98% confidence</span>
        </div>
      </div>
    </div>
  );
}

function BudgetMock() {
  const rows = [
    { k: "Food & Dining", v: 82, c: "from-lilac to-orchid", tag: "Approaching" },
    { k: "Travel", v: 46, c: "from-sky-soft to-lilac" },
    { k: "Shopping", v: 104, c: "from-orchid to-glow", tag: "Exceeded" },
    { k: "Utilities", v: 61, c: "from-sky-soft to-azure/70" },
  ];
  return (
    <div className="relative w-full max-w-[400px]">
      <div className={`${panel} p-5`}>
        <div className="flex items-baseline justify-between">
          <p className="text-[12px] text-mist">November budget</p>
          <p className="text-[12px] text-ink-soft">
            <span className="font-semibold text-ink">₹38,400</span> / ₹52,000
          </p>
        </div>
        <div className="mt-4 space-y-3.5">
          {rows.map((r) => (
            <div key={r.k}>
              <div className="flex justify-between text-[11px]">
                <span className="text-ink-soft">{r.k}</span>
                <span className={r.v > 100 ? "text-glow" : "text-mist"}>
                  {r.tag ? `${r.tag} · ` : ""}
                  {r.v}%
                </span>
              </div>
              <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-haze">
                <div className={`h-full rounded-full bg-gradient-to-r ${r.c}`} style={{ width: `${Math.min(r.v, 100)}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className={`${panel} absolute -right-3 -top-6 flex items-center gap-3 px-4 py-3 sm:-right-8`}>
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-orchid/40 text-[14px]">⚡</span>
        <div className="text-[11px] leading-tight">
          <p className="font-medium text-ink">Food is at 82%</p>
          <p className="text-mist">12 days left this month</p>
        </div>
      </div>
      <div className={`${panel} absolute -bottom-8 -left-3 flex items-center gap-3 px-4 py-3 sm:-left-8`}>
        <svg viewBox="0 0 36 36" className="h-9 w-9 -rotate-90">
          <circle cx="18" cy="18" r="15" fill="none" stroke="#eceefb" strokeWidth="4" />
          <circle cx="18" cy="18" r="15" fill="none" stroke="#8f7df0" strokeWidth="4" strokeLinecap="round" strokeDasharray="94.2" strokeDashoffset={94.2 * 0.4} />
        </svg>
        <div className="text-[11px] leading-tight">
          <p className="font-medium text-ink">Goa trip · 60%</p>
          <p className="text-mist">₹4,000/mo to hit ₹30,000</p>
        </div>
      </div>
    </div>
  );
}

function CalcMock() {
  const tabs = ["EMI", "Prepay", "SIP", "Compound", "Goal"];
  return (
    <div className={`${panel} w-full max-w-[400px] p-5`}>
      <div className="flex gap-1 rounded-full bg-haze p-1 text-[11px]">
        {tabs.map((t, i) => (
          <span key={t} className={`flex-1 rounded-full py-1.5 text-center ${i === 0 ? "bg-white font-medium text-ink shadow-sm" : "text-mist"}`}>
            {t}
          </span>
        ))}
      </div>
      <div className="mt-5 space-y-4 text-[11px]">
        {[
          ["Loan amount", "₹12,00,000", 62],
          ["Interest rate", "9.2% p.a.", 46],
          ["Tenure", "60 months", 38],
        ].map(([k, v, w]) => (
          <div key={k as string}>
            <div className="flex justify-between">
              <span className="text-mist">{k}</span>
              <span className="text-ink-soft">{v}</span>
            </div>
            <div className="relative mt-2 h-1 rounded-full bg-haze">
              <div className="h-full rounded-full bg-iris" style={{ width: `${w}%` }} />
              <span className="absolute top-1/2 h-3.5 w-3.5 -translate-y-1/2 rounded-full border-2 border-iris bg-white" style={{ left: `calc(${w}% - 7px)` }} />
            </div>
          </div>
        ))}
      </div>
      <div className="mt-6 flex items-end justify-between border-t border-haze pt-4">
        <div>
          <p className="text-[11px] text-mist">Monthly EMI</p>
          <p className="font-display text-[30px] font-normal tracking-[-0.03em] text-ink">₹25,026</p>
        </div>
        <div className="text-right text-[11px] leading-[1.6] text-mist">
          <p>Interest <span className="text-ink-soft">₹3,01,560</span></p>
          <p>Total <span className="text-ink-soft">₹15,01,560</span></p>
        </div>
      </div>
    </div>
  );
}

function ShieldMock() {
  const pts = [22, 30, 18, 26, 34, 20, 28, 24, 31, 19, 27, 33, 21, 25, 29, 23, 32, 26, 20, 28, 24];
  return (
    <div className="w-full max-w-[560px] space-y-3">
      <div className={`${panel} relative p-5`}>
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-mist">Last 30 days · Electronics & gadgets</span>
          <span className="rounded-full bg-orchid/40 px-2.5 py-1 text-ink">1 anomaly</span>
        </div>
        <svg viewBox="0 0 420 140" className="mt-3 w-full">
          <rect x="0" y="78" width="420" height="40" rx="8" fill="#eceefb" />
          {pts.map((p, i) => (
            <circle key={i} cx={14 + i * 19} cy={140 - p * 1.6 - 10} r="3.5" fill="#a3a8c3" />
          ))}
          <circle cx="318" cy="24" r="16" fill="#e35fc9" opacity="0.15">
            <animate attributeName="r" values="10;20;10" dur="2.4s" repeatCount="indefinite" />
          </circle>
          <circle cx="318" cy="24" r="6" fill="#e35fc9" />
          <line x1="318" y1="32" x2="318" y2="118" stroke="#e35fc9" strokeDasharray="3 4" opacity="0.5" />
        </svg>
        <div className={`${panel} absolute left-5 top-14 max-w-[200px] px-3.5 py-2.5 text-[11px] leading-[1.5]`}>
          <p className="font-medium text-ink">₹18,400 · 2:13 AM</p>
          <p className="text-mist">6.2× your usual electronics spend</p>
        </div>
      </div>
      <div className={`${panel} flex items-center justify-between gap-4 px-5 py-3.5 text-[12px]`}>
        <div>
          <p className="font-medium text-ink">Possible duplicate</p>
          <p className="text-mist">Swiggy · ₹642 · bill scanned twice on 29 Oct</p>
        </div>
        <div className="flex shrink-0 gap-2 text-[11px]">
          <span className="rounded-full bg-ink px-3 py-1.5 text-white">Merge</span>
          <span className="rounded-full bg-haze px-3 py-1.5 text-ink-soft">Keep both</span>
        </div>
      </div>
    </div>
  );
}

export function Bento() {
  return (
    <section id="inside" className="relative py-[clamp(88px,10vw,160px)]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(40% 35% at 8% 18%, rgba(203,190,245,0.55), transparent 70%), radial-gradient(40% 35% at 95% 92%, rgba(243,184,230,0.55), transparent 70%)",
        }}
      />
      <div className="container-fs">
        <div className="grid items-end gap-6 md:grid-cols-12">
          <div className="md:col-span-7">
            <Reveal as="p" className="eyebrow">
              A closer look
            </Reveal>
            <RevealLines
              className="mt-5 font-display text-[clamp(2.25rem,4.6vw,4.25rem)] font-light leading-[1.04] tracking-[-0.032em] text-ink"
              lines={["Quietly powerful,", <span key="l2">beautifully <span className="accent">simple</span></span>]}
            />
          </div>
          <Reveal as="p" className="text-[15px] leading-[1.6] text-muted md:col-span-4 md:col-start-9">
            No bank integrations, no paid data feeds — just your records, read accurately and turned into decisions.
          </Reveal>
        </div>

        <div className="mt-16 grid gap-5 md:grid-cols-12">
          <Card className="md:col-span-7" title="OCR bill scanner" caption="Upload a bill photo. Merchant, date, items, tax and total are extracted and categorised in seconds.">
            <OcrMock />
          </Card>
          <Card className="md:col-span-5" delay={0.1} title="Budgets that warn early" caption="Monthly and category limits with alerts before you overshoot, plus goals that tell you what to save.">
            <BudgetMock />
          </Card>
          <Card className="md:col-span-5" title="Calculator hub" caption="EMI, prepayment, SIP, compound interest and savings-goal calculators, all in one place.">
            <CalcMock />
          </Card>
          <Card className="md:col-span-7" delay={0.1} title="ML Shield" caption="Flags transactions that break your own patterns, and catches bills or entries recorded twice.">
            <ShieldMock />
          </Card>
        </div>
      </div>
    </section>
  );
}
