'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useFinShield } from '@/context/FinShieldContext';
import { InsetGroupedList, PageHeader } from '@/components/primitives';

type Filter = 'ALL' | 'BUDGET_ALERT' | 'EMI_REMINDER' | 'ML_ANOMALY' | 'SPLIT_SETTLEMENT';

const TABS: { id: Filter; label: string }[] = [
  { id: 'ALL', label: 'All' },
  { id: 'BUDGET_ALERT', label: 'Budgets' },
  { id: 'EMI_REMINDER', label: 'Bills' },
  { id: 'ML_ANOMALY', label: 'Unusual spending' },
  { id: 'SPLIT_SETTLEMENT', label: 'Splits' },
];

export default function NotificationsCenterPage() {
  const { state, markAllNotificationsRead, dismissNotification } = useFinShield();
  const [filter, setFilter] = useState<Filter>('ALL');

  const unreadCount = state.notifications.filter((n) => !n.read).length;
  const filtered = state.notifications.filter((n) =>
    filter === 'ALL' ? true : n.category === filter
  );

  return (
    <div className="pb-12">
      <PageHeader
        title="Notifications"
        action={
          unreadCount > 0 ? (
            <button
              type="button"
              onClick={markAllNotificationsRead}
              className="bg-ink text-white rounded-full h-11 sm:h-10 px-5 text-[14px] font-medium cursor-pointer"
            >
              Mark all as read
            </button>
          ) : undefined
        }
      />

      <div className="space-y-6">
        <div role="group" aria-label="Filter notifications" className="flex flex-wrap items-center gap-2">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              aria-pressed={filter === tab.id}
              onClick={() => setFilter(tab.id)}
              className={`h-11 sm:h-10 px-4 rounded-full text-[14px] font-medium cursor-pointer ${
                filter === tab.id ? 'bg-ink text-white' : 'bg-haze text-ink'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <InsetGroupedList>
          {filtered.length === 0 ? (
            <div className="p-10 text-center text-[13px] text-muted">
              You&apos;re all caught up.
            </div>
          ) : (
            filtered.map((n) => (
              <div
                key={n.id}
                className="px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <span
                    aria-hidden="true"
                    className={`w-2 h-2 rounded-full mt-2 shrink-0 ${
                      n.read
                        ? 'bg-transparent'
                        : n.tone === 'critical'
                        ? 'bg-glow'
                        : n.tone === 'warning'
                        ? 'bg-azure'
                        : 'bg-ink'
                    }`}
                  />
                  <div className="min-w-0">
                    <p className={`text-[15px] text-ink ${n.read ? 'font-normal' : 'font-semibold'}`}>
                      {n.title}
                    </p>
                    <p className="text-[13px] text-muted mt-0.5">{n.body}</p>
                    <p className="text-[13px] text-mist mt-0.5">{n.timestamp}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 pl-5 sm:pl-0">
                  {n.actionHref && (
                    <Link
                      href={n.actionHref}
                      className="bg-ink text-white rounded-full h-11 sm:h-10 px-5 text-[14px] font-medium inline-flex items-center"
                    >
                      {n.actionLabel || 'Open'}
                    </Link>
                  )}
                  <button
                    type="button"
                    onClick={() => dismissNotification(n.id)}
                    className="bg-haze text-ink rounded-full h-11 sm:h-10 px-5 text-[14px] font-medium cursor-pointer"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            ))
          )}
        </InsetGroupedList>
      </div>
    </div>
  );
}
