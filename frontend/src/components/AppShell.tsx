'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useFinShield } from '@/context/FinShieldContext';
import { UniversalSheetModal } from '@/components/primitives';
import { Logo } from '@/components/ui/Logo';
import { formatINR } from '@/lib/finance-engine';
import { readSession } from '@/lib/session';

const QUICK_CATEGORIES = [
  'Groceries',
  'Dining Out',
  'Transport',
  'Utilities & Rent',
  'Subscriptions',
  'Shopping & Lifestyle',
  'Investments',
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const {
    state,
    isQuickEntryOpen,
    setQuickEntryOpen,
    addTransaction,
  } = useFinShield();

  // Rapid Input Sheet (Scene 2 Universal Sheet) State
  const [entryType, setEntryType] = useState<'debit' | 'credit'>('debit');
  const [amountStr, setAmountStr] = useState<string>('0');
  const [merchant, setMerchant] = useState<string>('');
  const [category, setCategory] = useState<string>('Dining Out');
  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'Card' | 'Auto-Debit' | 'Cash'>('UPI');
  const [syncingToast, setSyncingToast] = useState<string | null>(null);

  const [moreOpen, setMoreOpen] = useState(false);
  const [allowed, setAllowed] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);
  useEffect(() => setMoreOpen(false), [pathname]);

  useEffect(() => {
    if (!moreOpen) return;
    const close = (event: MouseEvent | PointerEvent) => {
      if (moreRef.current && !moreRef.current.contains(event.target as Node)) {
        setMoreOpen(false);
      }
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMoreOpen(false);
    };
    document.addEventListener('pointerdown', close);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', close);
      document.removeEventListener('keydown', onKey);
    };
  }, [moreOpen]);

  const isPublic =
    pathname === '/' ||
    pathname === '/signin' ||
    pathname === '/signup' ||
    pathname === '/onboarding' ||
    pathname === '/login';

  useEffect(() => {
    const session = readSession();
    if (!session && !isPublic) {
      router.replace('/signin');
      setAllowed(false);
      return;
    }
    if (session && !session.onboarded && pathname !== '/onboarding' && pathname !== '/' && pathname !== '/signin' && pathname !== '/signup') {
      router.replace('/onboarding');
      setAllowed(false);
      return;
    }
    if (session && (pathname === '/signin' || pathname === '/signup' || pathname === '/login')) {
      router.replace(session.onboarded ? '/dashboard' : '/onboarding');
      return;
    }
    setAllowed(true);
  }, [pathname, router, isPublic]);

  const unreadNotifications = state.notifications.filter((n) => !n.read).length;

  const handleKeypadPress = (key: string) => {
    if (key === 'BACK') {
      setAmountStr((prev) => (prev.length > 1 ? prev.slice(0, -1) : '0'));
      return;
    }
    if (key === '.') {
      if (!amountStr.includes('.')) {
        setAmountStr((prev) => prev + '.');
      }
      return;
    }
    setAmountStr((prev) => {
      if (prev === '0') return key;
      if (prev.length >= 9) return prev;
      return prev + key;
    });
  };

  const handleQuickCommit = (e: React.FormEvent) => {
    e.preventDefault();
    const numericAmount = parseFloat(amountStr) || 0;
    if (numericAmount <= 0) return;

    addTransaction({
      merchant: merchant.trim() || (entryType === 'credit' ? 'Direct Deposit' : 'Quick Expense'),
      category: entryType === 'credit' ? 'Salary / Income' : category,
      date: 'Today',
      time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      amount: numericAmount,
      type: entryType,
      icon:
        entryType === 'credit'
          ? 'south_west'
          : category.includes('Grocer')
          ? 'shopping_bag'
          : category.includes('Dining')
          ? 'restaurant'
          : category.includes('Transport')
          ? 'directions_car'
          : 'receipt_long',
      paymentMethod,
      verifiedOcr: false,
    });

    setQuickEntryOpen(false);
    setAmountStr('0');
  };


  const primaryNav = [
    { href: '/dashboard', label: 'Overview' },
    { href: '/transactions', label: 'Transactions' },
    { href: '/budgets', label: 'Budgets' },
    { href: '/subscriptions', label: 'Bills' },
    { href: '/goals', label: 'Goals' },
    { href: '/calculators', label: 'Calculators' },
  ];
  const moreNav = [
    { href: '/split', label: 'Split a bill' },
    { href: '/ocr', label: 'Scan a bill' },
    { href: '/import-csv', label: 'Import statement' },
    { href: '/crypto', label: 'Send crypto' },
    { href: '/score', label: 'Generic Score' },
    { href: '/ml-shield', label: 'Unusual spending' },
    { href: '/settings', label: 'Settings' },
  ];
  const isActive = (href: string) =>
    href === '/dashboard'
      ? pathname === '/dashboard' || pathname === '/analytics'
      : pathname.startsWith(href);

  if (isPublic) {
    return <>{children}</>;
  }

  if (!allowed) {
    return null;
  }
  const moreActive = moreNav.some((i) => isActive(i.href));

  return (
    <div className="app-shell min-h-screen flex flex-col text-ink">
      <header className="sticky top-0 z-40 px-3 pt-4 sm:px-6">
        <div className="mx-auto flex max-w-[1024px] items-center gap-2 rounded-full border border-white/70 bg-white/70 py-1.5 pl-3 pr-1.5 shadow-[0_12px_40px_-18px_rgba(90,80,180,0.45)] backdrop-blur-xl">
          <Link href="/dashboard" className="shrink-0 px-1" aria-label="FinShield home">
            <Logo />
          </Link>

          <nav aria-label="Primary" className="hidden md:flex items-center gap-0.5 flex-1">
            {primaryNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive(item.href) ? 'page' : undefined}
                className={`px-3 h-9 inline-flex items-center rounded-full text-[13px] font-medium transition-colors ${
                  isActive(item.href)
                    ? 'bg-ink text-white'
                    : 'text-muted hover:text-ink'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="flex-1 md:hidden" />

          <div className="flex items-center gap-1.5">
            <div className="relative" ref={moreRef}>
              <button
                type="button"
                onClick={() => setMoreOpen((o) => !o)}
                aria-expanded={moreOpen}
                aria-haspopup="menu"
                className={`h-9 px-3 rounded-full text-[13px] font-medium inline-flex items-center gap-1 ${
                  moreActive ? 'bg-ink text-white' : 'text-muted hover:text-ink'
                }`}
              >
                More
                <span className="material-symbols-outlined text-[18px]">expand_more</span>
              </button>
              {moreOpen && (
                <div
                  role="menu"
                  className="absolute right-0 z-50 mt-2 w-56 rounded-2xl border border-peri bg-white p-1.5 shadow-[0_18px_40px_rgba(28,27,58,0.16)]"
                >
                  {moreNav.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      role="menuitem"
                      className={`block px-3 py-2.5 rounded-xl text-[14px] hover:bg-haze ${
                        isActive(item.href) ? 'font-semibold text-ink' : 'text-muted'
                      }`}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <Link
              href="/notifications"
              aria-label={
                unreadNotifications > 0
                  ? `Notifications, ${unreadNotifications} unread`
                  : 'Notifications'
              }
              className="relative flex h-9 w-9 items-center justify-center rounded-full bg-haze text-ink hover:bg-peri"
            >
              <span className="material-symbols-outlined text-[20px]">notifications</span>
              {unreadNotifications > 0 && (
                <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-glow" />
              )}
            </Link>

            <button
              type="button"
              onClick={() => setQuickEntryOpen(true)}
              className="app-btn h-9 px-4 text-[13px] gap-1"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              <span className="hidden sm:inline">Add</span>
              <span className="sr-only sm:hidden">Add transaction</span>
            </button>
          </div>
        </div>

        <nav
          aria-label="Primary"
          className="md:hidden mx-auto mt-2 flex max-w-[1024px] gap-1 overflow-x-auto no-scrollbar px-1 pb-1"
        >
          {primaryNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive(item.href) ? 'page' : undefined}
              className={`px-3 h-9 shrink-0 inline-flex items-center rounded-full text-[13px] font-medium ${
                isActive(item.href) ? 'bg-ink text-white' : 'bg-white/70 text-muted'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </header>

      {syncingToast && (
        <div role="status" className="fixed top-16 right-4 z-50 rounded-full bg-ink px-4 py-2.5 text-sm text-white">
          {syncingToast}
        </div>
      )}

      <main className="flex-1 w-full max-w-[1024px] mx-auto px-4 sm:px-8 pt-6 pb-16">
        {children}
      </main>

      <UniversalSheetModal
        isOpen={isQuickEntryOpen}
        onClose={() => setQuickEntryOpen(false)}
        title="Add transaction"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleQuickCommit} className="space-y-4">
          <div className="grid grid-cols-2 bg-haze p-1 rounded-full">
            <button
              type="button"
              onClick={() => setEntryType('debit')}
              aria-pressed={entryType === 'debit'}
              className={`h-10 rounded-full text-[14px] font-medium cursor-pointer ${
                entryType === 'debit'
                  ? 'bg-ink text-white'
                  : 'text-muted hover:text-ink'
              }`}
            >
              Expense
            </button>
            <button
              type="button"
              onClick={() => setEntryType('credit')}
              aria-pressed={entryType === 'credit'}
              className={`h-10 rounded-full text-[14px] font-medium cursor-pointer ${
                entryType === 'credit'
                  ? 'bg-ink text-white'
                  : 'text-muted hover:text-ink'
              }`}
            >
              Income
            </button>
          </div>

          <div className="bg-haze rounded-2xl p-4 text-center">
            <span className="text-[13px] text-muted block mb-1">Amount</span>
            <div className="text-[32px] font-semibold tracking-tight text-ink tabular-nums">
              {entryType === 'debit' ? '−' : '+'}
              {formatINR(parseFloat(amountStr) || 0)}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="quick-merchant" className="text-[13px] text-muted block mb-1.5">
                Merchant
              </label>
              <input
                id="quick-merchant"
                type="text"
                value={merchant}
                onChange={(e) => setMerchant(e.target.value)}
                placeholder="e.g. Swiggy Instamart"
                className="w-full h-11 px-4 rounded-2xl bg-haze text-[14px] text-ink focus:outline-none focus:ring-2 focus:ring-ink"
              />
            </div>
            <div>
              <label htmlFor="quick-category" className="text-[13px] text-muted block mb-1.5">
                Category
              </label>
              <select
                id="quick-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full h-11 px-4 rounded-2xl bg-haze text-[14px] text-ink focus:outline-none focus:ring-2 focus:ring-ink"
              >
                {QUICK_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between gap-1.5" role="group" aria-label="Payment method">
            {(['UPI', 'Card', 'Auto-Debit', 'Cash'] as const).map((rail) => (
              <button
                key={rail}
                type="button"
                aria-pressed={paymentMethod === rail}
                onClick={() => setPaymentMethod(rail)}
                className={`flex-1 h-10 rounded-full text-[13px] font-medium cursor-pointer ${
                  paymentMethod === rail
                    ? 'bg-ink text-white'
                    : 'bg-haze text-muted'
                }`}
              >
                {rail}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-2">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', 'BACK'].map((key) => (
              <button
                key={key}
                type="button"
                aria-label={key === 'BACK' ? 'Backspace' : key}
                onClick={() => handleKeypadPress(key)}
                className="h-11 rounded-2xl bg-haze hover:bg-peri active:scale-95 transition-all text-[16px] font-semibold text-ink tabular-nums flex items-center justify-center cursor-pointer"
              >
                {key === 'BACK' ? (
                  <span className="material-symbols-outlined text-[18px]">backspace</span>
                ) : (
                  key
                )}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={() => {
                setQuickEntryOpen(false);
                router.push('/ocr');
              }}
              className="h-11 px-5 rounded-full bg-haze hover:bg-peri text-ink text-[14px] font-medium cursor-pointer"
            >
              Scan a bill
            </button>
            <button
              type="submit"
              className="flex-1 h-11 rounded-full bg-ink hover:bg-ink-soft text-white text-[14px] font-medium cursor-pointer"
            >
              Save
            </button>
          </div>
        </form>
      </UniversalSheetModal>
    </div>
  );
}
