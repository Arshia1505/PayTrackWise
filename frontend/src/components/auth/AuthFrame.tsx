import Link from "next/link";
import type { ReactNode } from "react";
import { Logo } from "@/components/ui/Logo";

export const authField =
  "mt-1.5 h-12 w-full rounded-2xl border border-haze bg-white px-4 text-[15px] text-ink outline-none focus:border-iris";

export function AuthFrame({
  title,
  subtitle,
  children,
  step,
  steps,
  alternate,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  step?: number;
  steps?: number;
  alternate?: { href: string; label: string };
}) {
  const progress = step && steps ? Math.round((step / steps) * 100) : 0;
  return (
    <div className="marketing min-h-screen bg-white text-ink">
      <div className="container-fs flex items-center justify-between py-6">
        <Link href="/" aria-label="FinShield home">
          <Logo />
        </Link>
        {alternate ? (
          <Link href={alternate.href} className="text-[13px] font-medium text-muted">
            {alternate.label}
          </Link>
        ) : null}
      </div>
      <main className="container-fs pb-24">
        <div className="mx-auto max-w-[440px]">
          {step && steps ? (
            <div className="mb-8">
              <div className="mb-2 flex items-center justify-between text-[12px] uppercase tracking-[0.14em] text-mist">
                <span>
                  Step {step} of {steps}
                </span>
                <span>{progress}%</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-haze" aria-hidden>
                <div
                  className="h-full rounded-full bg-ink transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          ) : null}
          <h1 className="font-display text-[clamp(2.2rem,5vw,3rem)] font-light leading-none tracking-[-0.035em]">
            {title}
          </h1>
          <p className="mt-3 text-[15px] leading-relaxed text-muted">{subtitle}</p>
          <div className="mt-8">{children}</div>
        </div>
      </main>
    </div>
  );
}
