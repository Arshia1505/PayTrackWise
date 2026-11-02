'use client';

import React, { useState } from 'react';
import { useFinShield } from '@/context/FinShieldContext';
import {
  MonochromeBarChart,
  InsetGroupedList,
  PageHeader,
} from '@/components/primitives';
import { formatINR } from '@/lib/finance-engine';

const ANALYTICS_SERIES = {
  Week: [
    { label: 'Mon', value: 1850, formattedValue: '₹1,850' },
    { label: 'Tue', value: 2420, formattedValue: '₹2,420' },
    { label: 'Wed', value: 1490, formattedValue: '₹1,490' },
    { label: 'Thu', value: 3120, formattedValue: '₹3,120' },
    { label: 'Fri', value: 5890, formattedValue: '₹5,890', tone: 'warning' as const },
    { label: 'Sat', value: 7450, formattedValue: '₹7,450', active: true, tone: 'warning' as const },
    { label: 'Sun', value: 4920, formattedValue: '₹4,920' },
  ],
  Month: [
    { label: 'Wk 1', value: 16200, formattedValue: '₹16.2k' },
    { label: 'Wk 2', value: 12800, formattedValue: '₹12.8k' },
    { label: 'Wk 3', value: 18900, formattedValue: '₹18.9k', tone: 'warning' as const },
    { label: 'Wk 4', value: 10520, formattedValue: '₹10.5k', active: true },
  ],
  '6 Months': [
    { label: 'Jun', value: 42100, formattedValue: '₹42.1k' },
    { label: 'Jul', value: 49800, formattedValue: '₹49.8k' },
    { label: 'Aug', value: 46200, formattedValue: '₹46.2k' },
    { label: 'Sep', value: 53400, formattedValue: '₹53.4k' },
    { label: 'Oct', value: 55350, formattedValue: '₹55.3k' },
    { label: 'Nov', value: 58420, formattedValue: '₹58.4k', active: true },
  ],
};

const LABEL = 'text-[13px] text-[#636366]';

export default function SpendingAnalyticsPage() {
  const { state } = useFinShield();
  const [period, setPeriod] = useState<'Week' | 'Month' | '6 Months'>('6 Months');

  return (
    <div className="pb-10">
      <PageHeader
        title="Analytics"
        action={
          <div role="group" aria-label="Time period" className="inline-flex bg-[#F5F5F7] p-1 rounded-full">
            {(['Week', 'Month', '6 Months'] as const).map((p) => (
              <button
                key={p}
                type="button"
                aria-pressed={period === p}
                onClick={() => setPeriod(p)}
                className={`h-10 px-4 rounded-full text-[14px] font-medium cursor-pointer ${
                  period === p ? 'bg-[#1C1C1E] text-white' : 'text-[#636366]'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        }
      />

      <div className="space-y-6">
        <section className="bento-pod p-6">
          <p className={LABEL}>Spent this month</p>
          <p className="text-[44px] sm:text-[56px] leading-none font-semibold tracking-[-0.03em] tabular-nums mt-2">
            {formatINR(58420)}
          </p>
          <p className={`${LABEL} mt-2`}>₹3,070 more than October</p>
        </section>

        <section className="bento-pod p-6">
          <h2 className="text-[17px] font-semibold mb-2">Spending over time</h2>
          <MonochromeBarChart bars={ANALYTICS_SERIES[period]} heightClass="h-52" />
        </section>

        <section>
          <h2 className="text-[17px] font-semibold mb-3">By category</h2>
          <InsetGroupedList>
            {state.budgets.length === 0 && (
              <p className={`${LABEL} p-6`}>No categories yet. Create a budget to see a breakdown.</p>
            )}
            {state.budgets.map((b) => {
              const pct = Math.round((b.spent / b.cap) * 100);
              const over = b.spent > b.cap;
              return (
                <div
                  key={b.id}
                  className="px-5 py-4 flex items-center justify-between gap-4"
                >
                  <div className="min-w-0">
                    <p className="text-[15px] font-medium">{b.category}</p>
                    <p className={`${LABEL} ${over ? '!text-[#D70015]' : ''}`}>
                      {over ? 'Over budget' : `${pct}% used`}
                    </p>
                  </div>
                  <p className="text-[15px] font-medium tabular-nums shrink-0">
                    {formatINR(b.spent)}{' '}
                    <span className="text-[13px] font-normal text-[#636366]">
                      / {formatINR(b.cap)}
                    </span>
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
