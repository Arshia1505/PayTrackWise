import Link from "next/link";
import type { ReactNode } from "react";
import { Logo } from "@/components/ui/Logo";

export const authField =
  "mt-1.5 h-12 w-full rounded-2xl border border-white/80 bg-white/80 px-4 text-[15px] text-ink outline-none shadow-[inset_0_0_0_1px_rgba(203,190,245,0.35)] focus:border-iris";

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
    <div className="auth-shell relative min-h-screen text-ink">
      <div className="container-fs flex items-center justify-between py-6">
        <Link href="/" aria-label="FinShield home">
          <Logo />
        </Link>
        {alternate ? (
          <Link
            href={alternate.href}
            className="rounded-full bg-white/70 px-4 py-2 text-[13px] font-medium text-muted shadow-[0_12px_30px_-18px_rgba(90,80,180,0.45)] backdrop-blur-xl"
          >
            {alternate.label}
          </Link>
        ) : null}
      </div>
      <main className="container-fs pb-24">
        <div className="mx-auto max-w-[440px] rounded-[28px] border border-white/70 bg-white/70 p-6 shadow-[0_30px_60px_-36px_rgba(120,96,210,0.35)] backdrop-blur-xl sm:p-8">
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
                  className="h-full rounded-full bg-iris transition-all duration-500"
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
