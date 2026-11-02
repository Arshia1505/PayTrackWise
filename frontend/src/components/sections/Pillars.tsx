import { Reveal, RevealLines } from "@/components/ui/Reveal";

const pillars = [
  {
    title: "Capture",
    body: "Add income and expenses in seconds, or scan a bill and let OCR read the merchant, items, tax and total.",
    place: "md:col-start-1 md:row-start-1",
  },
  {
    title: "Understand",
    body: "Automatic categories and monthly reports show where money goes and how income compares with spending.",
    place: "md:col-start-2 md:row-start-1",
  },
  {
    title: "Plan",
    body: "Category budgets, savings goals and EMI schedules turn insight into a plan you can actually follow.",
    place: "md:col-start-2 md:row-start-2",
  },
  {
    title: "Protect",
    body: "ML Shield learns your patterns and flags unusual or duplicate transactions for a second look.",
    place: "md:col-start-3 md:row-start-2",
  },
];

export function Pillars() {
  return (
    <section className="container-fs py-[clamp(88px,10vw,160px)]">
      <div className="grid gap-4 md:grid-cols-4 md:grid-rows-[auto_auto]">
        {pillars.map((p, i) => (
          <Reveal
            key={p.title}
            delay={i * 0.08}
            className={`${p.place} group flex min-h-[220px] flex-col md:min-h-[280px] justify-between rounded-lg bg-haze p-7 transition-[background,box-shadow,transform] duration-700 ease-[var(--ease-expo)] hover:-translate-y-1 hover:bg-white hover:shadow-[0_30px_60px_-30px_rgba(120,96,210,0.45)]`}
          >
            <h3 className="font-display text-[clamp(1.5rem,2.2vw,1.9rem)] font-normal tracking-[-0.02em] text-ink">
              {p.title}
            </h3>
            <div className="mt-10 flex gap-5">
              <span className="flex flex-col items-center gap-2 pt-1 text-[12px] text-mist">
                {i + 1}
                <span className="h-7 w-px bg-mist/60 transition-all duration-700 group-hover:h-10 group-hover:bg-iris" />
              </span>
              <p className="text-[14px] leading-[1.55] text-muted">{p.body}</p>
            </div>
          </Reveal>
        ))}

        <div className="flex flex-col justify-end pb-2 md:col-span-2 md:col-start-3 md:row-start-1 md:pl-10 max-md:order-first max-md:mb-8">
          <Reveal as="p" className="eyebrow">
            One calm routine
          </Reveal>
          <RevealLines
            className="mt-5 font-display text-[clamp(2rem,3.6vw,3.4rem)] font-light leading-[1.04] tracking-[-0.03em] text-ink"
            lines={["Four steps.", <span key="l2">Every month, <span className="accent">clearer.</span></span>]}
          />
        </div>

        <Reveal className="hidden self-end pb-2 text-[14px] leading-[1.6] text-mist md:col-start-1 md:row-start-2 md:block md:pr-6">
          Every module feeds the next: what you capture becomes what you understand, plan and protect.
        </Reveal>
      </div>
    </section>
  );
}
