'use client';

import React from 'react';
import Link from 'next/link';
import { useFinShield } from '@/context/FinShieldContext';
import {
  MonochromeBarChart,
  SemiCircleArcGauge,
  InsetGroupedList,
  PageHeader,
} from '@/components/primitives';
import { formatINR } from '@/lib/finance-engine';

const LABEL = 'text-[13px] text-[#636366]';
const LINK =
  'text-[13px] font-medium text-[#1C1C1E] hover:underline inline-flex items-center min-h-[44px]';

export default function HomeInsightsPage() {
  const { state, setQuickEntryOpen } = useFinShield();

  const totalBudgetCap = state.budgets.reduce((acc, b) => acc + b.cap, 0);
  const totalBudgetSpent = state.budgets.reduce((acc, b) => acc + b.spent, 0);
  const budgetPct =
    totalBudgetCap > 0 ? Math.round((totalBudgetSpent / totalBudgetCap) * 100) : 0;

  const monthlyIncome = state.transactions
    .filter((tx) => tx.type === 'credit')
    .reduce((acc, tx) => acc + tx.amount, 0);
  const monthlyOutflow = state.transactions
    .filter((tx) => tx.type === 'debit')
    .reduce((acc, tx) => acc + tx.amount, 0);
  const netBalance = monthlyIncome - monthlyOutflow;
  const spendByDate = new Map<string, number>();
  for (const tx of state.transactions) {
    if (tx.type !== 'debit') continue;
    spendByDate.set(tx.date, (spendByDate.get(tx.date) || 0) + tx.amount);
  }
  const trajectory = [...spendByDate.entries()].slice(0, 6).map(([label, value], index, all) => ({
    label,
    value,
    formattedValue: formatINR(value),
    active: index === all.length - 1,
    tone: 'default' as const,
  }));
  const pendingSplitTotal = state.pendingCollections
    .filter((c) => c.status !== 'SETTLED')
    .reduce((acc, c) => acc + (c.amountOwed - c.amountPaid), 0);

  const dueBills = state.utilityBills.filter((u) => u.status !== 'PAID').slice(0, 2);

  return (
    <div className="pb-10">
      <PageHeader
        title="Overview"
        action={
          <button
            type="button"
            onClick={() => setQuickEntryOpen(true)}
            className="bg-[#1C1C1E] text-white rounded-full h-11 sm:h-10 px-5 text-[14px] font-medium cursor-pointer"
          >
            Log expense
          </button>
        }
      />

      <div className="space-y-6">
        <section className="bento-pod p-6">
          <p className={LABEL}>Net cash</p>
          <p className="text-[44px] sm:text-[56px] leading-none font-semibold tracking-[-0.03em] text-[#1C1C1E] tabular-nums mt-2">
            {formatINR(netBalance, { compact: state.settings.compactLakhs })}
          </p>
          <dl className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
            <div>
              <dt className={LABEL}>Income recorded</dt>
              <dd className="text-[20px] font-semibold tabular-nums">{formatINR(monthlyIncome)}</dd>
            </div>
            <div>
              <dt className={LABEL}>Spent</dt>
              <dd className="text-[20px] font-semibold tabular-nums">{formatINR(monthlyOutflow)}</dd>
            </div>
            <div>
              <dt className={LABEL}>Friends owe you</dt>
              <dd className="text-[20px] font-semibold tabular-nums">{formatINR(pendingSplitTotal)}</dd>
            </div>
          </dl>
          <Link href="/score" className={`${LINK} mt-4`}>
            Generic Score
          </Link>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <section className="bento-pod p-6 lg:col-span-8">
            <div className="flex items-center justify-between gap-3 mb-2">
              <h2 className="text-[17px] font-semibold">Spending by month</h2>
              <Link href="/analytics" className={LINK}>
                Details
              </Link>
            </div>
            {trajectory.length === 0 ? (
              <p className={`${LABEL} py-8`}>No spending recorded yet.</p>
            ) : (
              <MonochromeBarChart bars={trajectory} heightClass="h-48" />
            )}
          </section>

          <section className="bento-pod p-6 lg:col-span-4">
            <div className="flex items-center justify-between gap-3 mb-2">
              <h2 className="text-[17px] font-semibold">Budget</h2>
              <Link href="/budgets" className={LINK}>
                Manage
              </Link>
            </div>
            {state.budgets.length === 0 ? (
              <p className={LABEL}>No budgets yet. Add one to track your spending.</p>
            ) : (
              <>
                <SemiCircleArcGauge
                  percentage={budgetPct}
                  centerLabel={`${budgetPct}%`}
                  subLabel={`${formatINR(totalBudgetSpent)} of ${formatINR(totalBudgetCap)}`}
                  tone={budgetPct > 90 ? 'critical' : budgetPct > 75 ? 'warning' : 'default'}
                />
                <ul className="mt-4 space-y-3">
                  {state.budgets.slice(0, 3).map((b) => {
                    const pct = Math.min(100, Math.round((b.spent / b.cap) * 100));
                    const over = b.spent > b.cap;
                    return (
                      <li key={b.id} className="space-y-1">
                        <div className="flex items-center justify-between gap-2 text-[13px]">
                          <span className="font-medium">{b.category}</span>
                          <span
                            className={`tabular-nums ${
                              over ? 'text-[#D70015] font-medium' : 'text-[#636366]'
                            }`}
                          >
                            {over ? 'Over · ' : ''}
                            {formatINR(b.spent)} / {formatINR(b.cap)}
                          </span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-white overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              over ? 'bg-[#FF453A]' : 'bg-[#1C1C1E]'
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </>
            )}
          </section>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <section className="lg:col-span-8">
            <div className="flex items-center justify-between gap-3 mb-1">
              <h2 className="text-[17px] font-semibold">Recent transactions</h2>
              <Link href="/transactions" className={LINK}>
                See all
              </Link>
            </div>
            <InsetGroupedList>
              {state.transactions.length === 0 && (
                <p className={`${LABEL} p-6`}>No transactions yet.</p>
              )}
              {state.transactions.slice(0, 6).map((tx) => (
                <div key={tx.id} className="px-5 py-3.5 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-[15px] font-medium truncate">{tx.merchant}</p>
                    <p className={`${LABEL} truncate`}>
                      {tx.category} · {tx.date}
                    </p>
                  </div>
                  <p
                    className={`text-[15px] font-medium tabular-nums shrink-0 ${
                      tx.type === 'credit' ? 'text-[#1E8E3E]' : 'text-[#1C1C1E]'
                    }`}
                  >
                    {tx.type === 'credit' ? '+' : '−'}
                    {formatINR(tx.amount)}
                  </p>
                </div>
              ))}
            </InsetGroupedList>
          </section>

          <section className="bento-pod p-6 lg:col-span-4">
            <div className="flex items-center justify-between gap-3 mb-1">
              <h2 className="text-[17px] font-semibold">Upcoming bills</h2>
              <Link href="/subscriptions" className={LINK}>
                All bills
              </Link>
            </div>
            {state.debts.length === 0 && dueBills.length === 0 ? (
              <p className={LABEL}>Nothing due soon.</p>
            ) : (
              <ul className="space-y-4">
                {state.debts.map((debt) => (
                  <li key={debt.id} className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[15px] font-medium truncate">{debt.name}</p>
                      <p className={LABEL}>Due {debt.nextDueDate}</p>
                    </div>
                    <span className="text-[15px] font-medium tabular-nums shrink-0">
                      {formatINR(debt.emi)}
                    </span>
                  </li>
                ))}
                {dueBills.map((bill) => (
                  <li key={bill.id} className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[15px] font-medium truncate">{bill.provider}</p>
                      <p className={LABEL}>Due {bill.dueDate}</p>
                    </div>
                    <span className="text-[15px] font-medium tabular-nums shrink-0">
                      {formatINR(bill.amount)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
