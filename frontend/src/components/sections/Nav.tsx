"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { readSession } from "@/lib/session";

const links = [
  { label: "Home", href: "#top" },
  { label: "Features", href: "#features" },
  { label: "Inside", href: "#inside" },
  { label: "ML Shield", href: "#shield" },
  { label: "Security", href: "#security" },
];

export function Nav() {
  const [active, setActive] = useState("#top");
  const [hidden, setHidden] = useState(false);
  const [accountHref, setAccountHref] = useState("/signin");
  const [accountLabel, setAccountLabel] = useState("Sign in");

  useEffect(() => {
    const session = readSession();
    if (session) {
      setAccountHref(session.onboarded ? "/dashboard" : "/onboarding");
      setAccountLabel(session.onboarded ? "Open app" : "Continue");
    }
    const onScroll = () => setHidden(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => e.isIntersecting && setActive(`#${e.target.id}`));
      },
      { rootMargin: "-45% 0px -50% 0px" },
    );
    links.forEach((l) => {
      const el = document.querySelector(l.href);
      if (el) observer.observe(el);
    });

    return () => {
      window.removeEventListener("scroll", onScroll);
      observer.disconnect();
    };
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-5 z-50 flex justify-center px-4 transition-all duration-500 ease-[var(--ease-expo)] ${
        hidden ? "pointer-events-none -translate-y-24 opacity-0" : "translate-y-0 opacity-100"
      }`}
    >
      <div className="flex items-center gap-1 rounded-full border border-white/70 bg-white/70 py-1.5 pl-4 pr-1.5 shadow-[0_12px_40px_-18px_rgba(90,80,180,0.45)] backdrop-blur-xl">
        <a href="#top" aria-label="FinShield home" className="mr-1">
          <Logo />
        </a>
        <nav className="hidden items-center md:flex">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className={`rounded-full px-3 py-1.5 text-[13px] transition-colors duration-300 ${
                active === l.href ? "font-medium text-ink" : "text-muted hover:text-ink"
              }`}
            >
              {l.label}
            </a>
          ))}
        </nav>
        <Link
          href={accountHref}
          className="ml-1 rounded-full bg-ink px-4 py-2 text-[13px] font-medium text-white transition-transform duration-500 ease-[var(--ease-expo)] hover:-translate-y-0.5"
        >
          {accountLabel}
        </Link>
      </div>
    </header>
  );
}
