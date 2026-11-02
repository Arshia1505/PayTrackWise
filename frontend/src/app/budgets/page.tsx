'use client';

import React, { useState } from 'react';
import { useFinShield } from '@/context/FinShieldContext';
import { PageHeader, UniversalSheetModal } from '@/components/primitives';
import { formatINR } from '@/lib/finance-engine';

export default function BudgetsPage() {
  const { state, updateBudgetCap } = useFinShield();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newCapValue, setNewCapValue] = useState<string>('');

  const totalCap = state.budgets.reduce((acc, b) => acc + b.cap, 0);
  const totalSpent = state.budgets.reduce((acc, b) => acc + b.spent, 0);
  const remaining = totalCap - totalSpent;
  const pctSpent = totalCap > 0 ? Math.min(100, Math.round((totalSpent / totalCap) * 100)) : 0;

  const editingBudget = state.budgets.find((b) => b.id === editingId);

  const openCapEditor = (id: string, currentCap: number) => {
    setEditingId(id);
    setNewCapValue(String(currentCap));
  };

  const saveCapEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;
    const numeric = Math.max(500, Number(newCapValue) || 0);
    updateBudgetCap(editingId, numeric);
    setEditingId(null);
  };

  return (
    <div className="pb-10">
      <PageHeader title="Budgets" description="Monthly limits by category. Select one to change its limit." />

      <div className="space-y-6">
        <section className="bento-pod p-6">
          <p className="text-[13px] text-[#636366]">
            {remaining >= 0 ? 'Left this month' : 'Over budget this month'}
          </p>
          <p
            className={`text-[40px] leading-[46px] font-semibold tracking-[-0.02em] tabular-nums mt-1 ${
              remaining < 0 ? 'text-[#D70015]' : 'text-[#1C1C1E]'
            }`}
          >
            {formatINR(Math.abs(remaining))}
          </p>
          <div className="h-2 w-full rounded-full bg-[#E5E5EA] overflow-hidden mt-5">
            <div
              className={`h-full rounded-full ${remaining < 0 ? 'bg-[#FF453A]' : 'bg-[#1C1C1E]'}`}
              style={{ width: `${pctSpent}%` }}
            />
          </div>
          <p className="text-[13px] text-[#636366] mt-2 tabular-nums">
            {formatINR(totalSpent)} spent of {formatINR(totalCap)}
          </p>
        </section>

        {state.budgets.length === 0 ? (
          <div className="bento-pod p-10 text-center text-[15px] text-[#636366]">
            No budgets yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {state.budgets.map((b) => {
              const pct = b.cap > 0 ? Math.round((b.spent / b.cap) * 100) : 0;
              const over = b.spent > b.cap;
              return (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => openCapEditor(b.id, b.cap)}
                  aria-label={`Edit ${b.category} limit`}
                  className="bento-pod p-5 text-left space-y-4 cursor-pointer hover:bg-[#EFEFF2] transition-colors min-h-[44px]"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-[15px] font-medium text-[#1C1C1E]">{b.category}</h3>
                    {over && (
                      <span className="px-2.5 py-0.5 rounded-full text-[12px] font-medium bg-[#FF453A]/15 text-[#D70015] whitespace-nowrap">
                        Over by {formatINR(b.spent - b.cap)}
                      </span>
                    )}
                  </div>
                  <div className="h-2 w-full rounded-full bg-[#E5E5EA] overflow-hidden">
                    <div
                      className={`h-full rounded-full ${over ? 'bg-[#FF453A]' : 'bg-[#1C1C1E]'}`}
                      style={{ width: `${Math.min(100, pct)}%` }}
                    />
                  </div>
                  <p className="text-[13px] text-[#636366] tabular-nums">
                    {formatINR(b.spent)} of {formatINR(b.cap)}
                  </p>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <UniversalSheetModal
        isOpen={Boolean(editingBudget)}
        onClose={() => setEditingId(null)}
        title={`${editingBudget?.category || ''} limit`}
        maxWidth="max-w-md"
      >
        {editingBudget && (
          <form onSubmit={saveCapEdit} className="space-y-4">
            <p className="text-[13px] text-[#636366] tabular-nums">
              Spent so far: {formatINR(editingBudget.spent)}
            </p>

            <div>
              <label htmlFor="cap-input" className="text-[13px] text-[#636366] block mb-1.5">
                Monthly limit (₹)
              </label>
              <input
                id="cap-input"
                type="number"
                inputMode="numeric"
                value={newCapValue}
                onChange={(e) => setNewCapValue(e.target.value)}
                className="w-full h-12 px-4 rounded-2xl bg-[#F5F5F7] text-[17px] tabular-nums text-[#1C1C1E] focus:outline-none focus:ring-2 focus:ring-[#1C1C1E]"
              />
            </div>

            <div className="grid grid-cols-4 gap-2">
              {[5000, 10000, 15000, 25000].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setNewCapValue(String(preset))}
                  className="h-11 rounded-full bg-[#F5F5F7] hover:bg-[#EBEBED] text-[13px] font-medium tabular-nums text-[#1C1C1E] cursor-pointer"
                >
                  {formatINR(preset, { compact: true })}
                </button>
              ))}
            </div>

            <button
              type="submit"
              className="w-full h-11 sm:h-10 rounded-full bg-[#1C1C1E] text-white text-[14px] font-medium cursor-pointer"
            >
              Save limit
            </button>
          </form>
        )}
      </UniversalSheetModal>
    </div>
  );
}
