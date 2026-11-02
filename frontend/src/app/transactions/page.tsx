'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useFinShield } from '@/context/FinShieldContext';
import { PageHeader } from '@/components/primitives';
import { formatINR } from '@/lib/finance-engine';

const CATEGORIES = [
  'All categories',
  'Groceries',
  'Dining Out',
  'Transport',
  'Utilities & Rent',
  'Subscriptions',
  'Shopping & Lifestyle',
  'Salary / Income',
];

const FIELD =
  'w-full h-11 px-4 rounded-2xl bg-[#F5F5F7] text-[14px] text-[#1C1C1E] focus:outline-none focus:ring-2 focus:ring-[#1C1C1E]';

export default function TransactionsPage() {
  const { state } = useFinShield();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All categories');
  const [typeFilter, setTypeFilter] = useState<'all' | 'debit' | 'credit'>('all');

  const filteredTransactions = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return state.transactions.filter((tx) => {
      if (typeFilter !== 'all' && tx.type !== typeFilter) return false;
      if (selectedCategory !== 'All categories' && tx.category !== selectedCategory) return false;
      if (q && !tx.merchant.toLowerCase().includes(q) && !tx.category.toLowerCase().includes(q)) {
        return false;
      }
      return true;
    });
  }, [state.transactions, typeFilter, selectedCategory, searchQuery]);

  const totalOut = filteredTransactions
    .filter((t) => t.type === 'debit')
    .reduce((acc, t) => acc + t.amount, 0);
  const totalIn = filteredTransactions
    .filter((t) => t.type === 'credit')
    .reduce((acc, t) => acc + t.amount, 0);

  const filtersActive =
    typeFilter !== 'all' || selectedCategory !== 'All categories' || searchQuery.trim() !== '';

  const clearFilters = () => {
    setTypeFilter('all');
    setSelectedCategory('All categories');
    setSearchQuery('');
  };

  return (
    <div className="pb-10">
      <PageHeader
        title="Transactions"
        action={
          <Link
            href="/import-csv"
            className="inline-flex items-center justify-center h-11 sm:h-10 px-5 rounded-full bg-[#F5F5F7] hover:bg-[#EBEBED] text-[14px] font-medium text-[#1C1C1E]"
          >
            Import statement
          </Link>
        }
      />

      <div className="space-y-6">
        <div className="bento-pod p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_220px] gap-3">
            <div>
              <label htmlFor="tx-search" className="text-[13px] text-[#636366] block mb-1.5">
                Search
              </label>
              <input
                id="tx-search"
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Merchant or category"
                className={FIELD}
              />
            </div>
            <div>
              <label htmlFor="tx-category" className="text-[13px] text-[#636366] block mb-1.5">
                Category
              </label>
              <select
                id="tx-category"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className={FIELD}
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="inline-flex bg-[#F5F5F7] p-1 rounded-full self-start" role="group" aria-label="Transaction type">
              {(['all', 'debit', 'credit'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTypeFilter(t)}
                  aria-pressed={typeFilter === t}
                  className={`h-10 sm:h-9 px-4 rounded-full text-[14px] font-medium cursor-pointer ${
                    typeFilter === t ? 'bg-[#1C1C1E] text-white' : 'text-[#636366]'
                  }`}
                >
                  {t === 'all' ? 'All' : t === 'debit' ? 'Spent' : 'Received'}
                </button>
              ))}
            </div>
            <p className="text-[13px] text-[#636366] tabular-nums">
              Spent {formatINR(totalOut)} · Received {formatINR(totalIn)}
            </p>
          </div>
        </div>

        <div className="bento-pod overflow-hidden divide-y divide-black/[0.06]">
          {filteredTransactions.length === 0 ? (
            <div className="p-10 text-center">
              <p className="text-[15px] text-[#636366]">
                {filtersActive ? 'No transactions match these filters.' : 'No transactions yet.'}
              </p>
              {filtersActive && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="mt-4 h-11 sm:h-10 px-5 rounded-full bg-[#1C1C1E] text-white text-[14px] font-medium cursor-pointer"
                >
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            filteredTransactions.map((tx) => (
              <div key={tx.id} className="px-5 py-4 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-[15px] font-medium text-[#1C1C1E] truncate">{tx.merchant}</p>
                  <p className="text-[13px] text-[#636366] truncate">
                    {tx.category} · {tx.date}, {tx.time}
                  </p>
                </div>
                <span
                  className={`text-[15px] font-medium tabular-nums shrink-0 ${
                    tx.type === 'credit' ? 'text-[#1E8E3E]' : 'text-[#1C1C1E]'
                  }`}
                >
                  {tx.type === 'credit' ? '+' : '−'}
                  {formatINR(tx.amount)}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
