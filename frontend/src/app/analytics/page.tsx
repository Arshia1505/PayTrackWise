'use client';

import React from 'react';
import { useFinShield } from '@/context/FinShieldContext';
import { MonochromeBarChart, InsetGroupedList, PageHeader } from '@/components/primitives';
import { formatINR } from '@/lib/finance-engine';

const LABEL = 'text-[13px] text-[#636366]';

export default function SpendingAnalyticsPage() {
  const { state } = useFinShield();
  const debits = state.transactions.filter((tx) => tx.type === 'debit');
  const spent = debits.reduce((acc, tx) => acc + tx.amount, 0);
  const byCategory = new Map<string, number>();
  for (const tx of debits) {
    byCategory.set(tx.category, (byCategory.get(tx.category) || 0) + tx.amount);
  }
  const bars = [...byCategory.entries()].map(([label, value], index, all) => ({
    label,
    value,
    formattedValue: formatINR(value),
    active: index === all.length - 1,
  }));

  return (
    <div className="pb-10">
      <PageHeader title="Analytics" />

      <div className="space-y-6">
        <section className="bento-pod p-6">
          <p className={LABEL}>Spent</p>
          <p className="text-[44px] sm:text-[56px] leading-none font-semibold tracking-[-0.03em] tabular-nums mt-2">
            {formatINR(spent)}
          </p>
          <p className={`${LABEL} mt-2`}>
            {debits.length === 0
              ? 'Log an expense to see it here.'
              : `${debits.length} expense${debits.length === 1 ? '' : 's'} recorded`}
          </p>
        </section>

        <section className="bento-pod p-6">
          <h2 className="text-[17px] font-semibold mb-2">Spending by category</h2>
          {bars.length === 0 ? (
            <p className={LABEL}>No categories yet.</p>
          ) : (
            <MonochromeBarChart bars={bars} heightClass="h-52" />
          )}
        </section>

        <section>
          <h2 className="text-[17px] font-semibold mb-3">Budgets</h2>
          <InsetGroupedList>
            {state.budgets.length === 0 && (
              <p className={`${LABEL} p-6`}>No budgets yet.</p>
            )}
            {state.budgets.map((b) => {
              const pct = b.cap > 0 ? Math.round((b.spent / b.cap) * 100) : 0;
              const over = b.spent > b.cap;
              return (
                <div key={b.id} className="px-5 py-4 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-[15px] font-medium">{b.category}</p>
                    <p className={`${LABEL} ${over ? '!text-[#D70015]' : ''}`}>
                      {over ? 'Over budget' : `${pct}% used`}
                    </p>
                  </div>
                  <p className="text-[15px] font-medium tabular-nums shrink-0">
                    {formatINR(b.spent)}{' '}
                    <span className="text-[13px] font-normal text-[#636366]">/ {formatINR(b.cap)}</span>
                  </p>
                </div>
              );
            })}
          </InsetGroupedList>
        </section>
      </div>
    </div>
  );
}
