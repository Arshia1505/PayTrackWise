'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useFinShield } from '@/context/FinShieldContext';
import { UniversalSheetModal } from '@/components/primitives';
import { formatINR } from '@/lib/finance-engine';

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
  useEffect(() => setMoreOpen(false), [pathname]);

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


  // Hide chrome on standalone login canvas if desired, or keep minimal navigation bar
  const isLoginRoute = pathname === '/login';

  const primaryNav = [
    { href: '/', label: 'Overview' },
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
    { href: '/ml-shield', label: 'Unusual spending' },
    { href: '/settings', label: 'Settings' },
  ];
  const isActive = (href: string) =>
    href === '/' ? pathname === '/' || pathname === '/analytics' : pathname.startsWith(href);
  const moreActive = moreNav.some((i) => isActive(i.href));

  if (isLoginRoute) {
    return <div className="min-h-screen bg-white text-[#1C1C1E]">{children}</div>;
  }

  return (
    <div className="min-h-screen flex flex-col bg-white text-[#1C1C1E]">
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-xl">
        <div className="max-w-[1024px] mx-auto px-4 sm:px-8 h-14 flex items-center gap-6">
          <Link href="/" className="text-[17px] font-semibold tracking-tight shrink-0">
            FinShield
          </Link>

          <nav aria-label="Primary" className="hidden md:flex items-center gap-1 flex-1">
            {primaryNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive(item.href) ? 'page' : undefined}
                className={`px-3 h-9 inline-flex items-center rounded-full text-[14px] font-medium transition-colors ${
                  isActive(item.href)
                    ? 'bg-[#F5F5F7] text-[#1C1C1E]'
                    : 'text-[#636366] hover:text-[#1C1C1E]'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="flex-1 md:hidden" />

          <div className="flex items-center gap-2">
            <div className="relative">
              <button
                type="button"
                onClick={() => setMoreOpen((o) => !o)}
                aria-expanded={moreOpen}
                aria-haspopup="menu"
                className={`h-9 px-3 rounded-full text-[14px] font-medium inline-flex items-center gap-1 ${
                  moreActive ? 'bg-[#F5F5F7]' : 'text-[#636366] hover:text-[#1C1C1E]'
                }`}
              >
                More
                <span className="material-symbols-outlined text-[18px]">expand_more</span>
              </button>
              {moreOpen && (
                <div
                  role="menu"
                  className="absolute right-0 mt-2 w-56 bg-white rounded-2xl p-1.5 shadow-[0_8px_30px_rgba(0,0,0,0.12)]"
                >
                  {moreNav.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      role="menuitem"
                      className={`block px-3 py-2.5 rounded-xl text-[14px] hover:bg-[#F5F5F7] ${
                        isActive(item.href) ? 'font-semibold' : ''
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
              className="relative w-9 h-9 rounded-full bg-[#F5F5F7] hover:bg-[#EBEBED] flex items-center justify-center"
            >
              <span className="material-symbols-outlined text-[20px]">notifications</span>
              {unreadNotifications > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#FF453A]" />
              )}
            </Link>

            <button
              type="button"
              onClick={() => setQuickEntryOpen(true)}
              className="h-9 px-4 rounded-full bg-[#1C1C1E] text-white text-[14px] font-medium inline-flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              <span className="hidden sm:inline">Add</span>
              <span className="sr-only sm:hidden">Add transaction</span>
            </button>
          </div>
        </div>

        <nav
          aria-label="Primary"
          className="md:hidden flex gap-1 overflow-x-auto no-scrollbar px-4 pb-2"
        >
          {primaryNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive(item.href) ? 'page' : undefined}
              className={`px-3 h-9 shrink-0 inline-flex items-center rounded-full text-[14px] font-medium ${
                isActive(item.href) ? 'bg-[#F5F5F7]' : 'text-[#636366]'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </header>

      {syncingToast && (
        <div role="status" className="fixed top-16 right-4 z-50 bg-[#1C1C1E] text-white px-4 py-2.5 rounded-full text-sm">
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
          <div className="grid grid-cols-2 bg-[#F5F5F7] p-1 rounded-full">
            <button
              type="button"
              onClick={() => setEntryType('debit')}
              aria-pressed={entryType === 'debit'}
              className={`h-10 rounded-full text-[14px] font-medium cursor-pointer ${
                entryType === 'debit'
                  ? 'bg-[#1C1C1E] text-white'
                  : 'text-[#636366] hover:text-[#1C1C1E]'
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
                  ? 'bg-[#1C1C1E] text-white'
                  : 'text-[#636366] hover:text-[#1C1C1E]'
              }`}
            >
              Income
            </button>
          </div>

          <div className="bg-[#F5F5F7] rounded-2xl p-4 text-center">
            <span className="text-[13px] text-[#636366] block mb-1">Amount</span>
            <div className="text-[32px] font-semibold tracking-tight text-[#1C1C1E] tabular-nums">
              {entryType === 'debit' ? '−' : '+'}
              {formatINR(parseFloat(amountStr) || 0)}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="quick-merchant" className="text-[13px] text-[#636366] block mb-1.5">
                Merchant
              </label>
              <input
                id="quick-merchant"
                type="text"
                value={merchant}
                onChange={(e) => setMerchant(e.target.value)}
                placeholder="e.g. Swiggy Instamart"
                className="w-full h-11 px-4 rounded-2xl bg-[#F5F5F7] text-[14px] text-[#1C1C1E] focus:outline-none focus:ring-2 focus:ring-[#1C1C1E]"
              />
            </div>
            <div>
              <label htmlFor="quick-category" className="text-[13px] text-[#636366] block mb-1.5">
                Category
              </label>
              <select
                id="quick-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full h-11 px-4 rounded-2xl bg-[#F5F5F7] text-[14px] text-[#1C1C1E] focus:outline-none focus:ring-2 focus:ring-[#1C1C1E]"
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
                    ? 'bg-[#1C1C1E] text-white'
                    : 'bg-[#F5F5F7] text-[#636366]'
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
                className="h-11 rounded-2xl bg-[#F5F5F7] hover:bg-[#EBEBED] active:scale-95 transition-all text-[16px] font-semibold text-[#1C1C1E] tabular-nums flex items-center justify-center cursor-pointer"
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
              className="h-11 px-5 rounded-full bg-[#F5F5F7] hover:bg-[#EBEBED] text-[#1C1C1E] text-[14px] font-medium cursor-pointer"
            >
              Scan a bill
            </button>
            <button
              type="submit"
              className="flex-1 h-11 rounded-full bg-[#1C1C1E] hover:bg-[#2C2C2E] text-white text-[14px] font-medium cursor-pointer"
            >
              Save
            </button>
          </div>
        </form>
      </UniversalSheetModal>
    </div>
  );
}
