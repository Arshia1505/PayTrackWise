'use client';

import React, { useState } from 'react';
import { useFinShield } from '@/context/FinShieldContext';
import { PageHeader, UniversalSheetModal } from '@/components/primitives';
import { formatINR } from '@/lib/finance-engine';

const FIELD =
  'w-full h-11 px-4 rounded-2xl bg-[#F5F5F7] text-[14px] text-[#1C1C1E] tabular-nums focus:outline-none focus:ring-2 focus:ring-[#1C1C1E]';
const PRIMARY =
  'inline-flex items-center justify-center h-11 sm:h-10 px-5 rounded-full bg-[#1C1C1E] text-white text-[14px] font-medium cursor-pointer';
const SECONDARY =
  'inline-flex items-center justify-center h-11 sm:h-10 px-5 rounded-full bg-[#F5F5F7] hover:bg-[#EBEBED] text-[#1C1C1E] text-[14px] font-medium cursor-pointer';

function Bar({ pct }: { pct: number }) {
  return (
    <div className="h-2 w-full rounded-full bg-[#E5E5EA] overflow-hidden">
      <div className="h-full rounded-full bg-[#1C1C1E]" style={{ width: `${pct}%` }} />
    </div>
  );
}

export default function GoalsPage() {
  const { state, contributeToGoal, addGoal, payDebtEmi } = useFinShield();
  const [activeTab, setActiveTab] = useState<'goals' | 'debts'>('goals');

  const [contributeGoalId, setContributeGoalId] = useState<string | null>(null);
  const [contributeAmount, setContributeAmount] = useState<string>('');

  const [isAddGoalOpen, setIsAddGoalOpen] = useState(false);
  const [newGoalName, setNewGoalName] = useState('');
  const [newGoalTarget, setNewGoalTarget] = useState('');
  const [newGoalSip, setNewGoalSip] = useState('');

  const totalGoalTarget = state.goals.reduce((acc, g) => acc + g.target, 0);
  const totalGoalSaved = state.goals.reduce((acc, g) => acc + g.saved, 0);
  const goalPct =
    totalGoalTarget > 0 ? Math.min(100, Math.round((totalGoalSaved / totalGoalTarget) * 100)) : 0;

  const totalDebtPrincipal = state.debts.reduce((acc, d) => acc + d.totalLoan, 0);
  const totalDebtPaid = state.debts.reduce((acc, d) => acc + d.paidPrincipal, 0);
  const totalDebtRemaining = Math.max(0, totalDebtPrincipal - totalDebtPaid);
  const debtPct =
    totalDebtPrincipal > 0 ? Math.min(100, Math.round((totalDebtPaid / totalDebtPrincipal) * 100)) : 0;

  const handleContributionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contributeGoalId) return;
    const amt = Math.max(500, Number(contributeAmount) || 0);
    contributeToGoal(contributeGoalId, amt);
    setContributeGoalId(null);
  };

  const handleCreateGoal = (e: React.FormEvent) => {
    e.preventDefault();
    const targetNum = Math.max(10000, Number(newGoalTarget) || 100000);
    const sipNum = Math.max(1000, Number(newGoalSip) || 10000);
    addGoal({
      name: newGoalName.trim() || 'New goal',
      icon: 'flag',
      saved: 0,
      target: targetNum,
      monthlyContribution: sipNum,
      targetDate: 'Dec 2027',
      autoSip: true,
    });
    setNewGoalName('');
    setNewGoalTarget('');
    setNewGoalSip('');
    setIsAddGoalOpen(false);
  };

  const contributingGoal = state.goals.find((g) => g.id === contributeGoalId);

  return (
    <div className="pb-10">
      <PageHeader
        title={activeTab === 'goals' ? 'Goals' : 'Debts'}
        action={
          activeTab === 'goals' ? (
            <button type="button" onClick={() => setIsAddGoalOpen(true)} className={PRIMARY}>
              New goal
            </button>
          ) : undefined
        }
      />

      <div className="space-y-6">
        <div
          className="inline-flex bg-[#F5F5F7] p-1 rounded-full"
          role="group"
          aria-label="Section"
        >
          {(['goals', 'debts'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setActiveTab(t)}
              aria-pressed={activeTab === t}
              className={`h-11 sm:h-9 px-5 rounded-full text-[14px] font-medium cursor-pointer ${
                activeTab === t ? 'bg-[#1C1C1E] text-white' : 'text-[#636366]'
              }`}
            >
              {t === 'goals' ? 'Goals' : 'Debts'}
            </button>
          ))}
        </div>

        {activeTab === 'goals' ? (
          <>
            <section className="bento-pod p-6">
              <p className="text-[13px] text-[#636366]">Saved across all goals</p>
              <p className="text-[40px] leading-[46px] font-semibold tracking-[-0.02em] tabular-nums mt-1">
                {formatINR(totalGoalSaved)}
              </p>
              <div className="mt-5">
                <Bar pct={goalPct} />
              </div>
              <p className="text-[13px] text-[#636366] mt-2 tabular-nums">
                {goalPct}% of {formatINR(totalGoalTarget)}
              </p>
            </section>

            {state.goals.length === 0 ? (
              <div className="bento-pod p-10 text-center">
                <p className="text-[15px] text-[#636366]">No goals yet.</p>
                <button
                  type="button"
                  onClick={() => setIsAddGoalOpen(true)}
                  className={`${PRIMARY} mt-4`}
                >
                  Create a goal
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {state.goals.map((g) => {
                  const pct = g.target > 0 ? Math.min(100, Math.round((g.saved / g.target) * 100)) : 0;
                  return (
                    <div key={g.id} className="bento-pod p-5 flex flex-col gap-4">
                      <div>
                        <h3 className="text-[15px] font-medium text-[#1C1C1E]">{g.name}</h3>
                        <p className="text-[13px] text-[#636366]">By {g.targetDate}</p>
                      </div>
                      <div className="space-y-2">
                        <Bar pct={pct} />
                        <p className="text-[13px] text-[#636366] tabular-nums">
                          {formatINR(g.saved)} of {formatINR(g.target)}
                        </p>
                      </div>
                      <p className="text-[13px] text-[#636366] tabular-nums">
                        {formatINR(g.monthlyContribution)}/month{g.autoSip ? ', automatic' : ''}
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setContributeGoalId(g.id);
                          setContributeAmount(String(g.monthlyContribution));
                        }}
                        className={`${SECONDARY} mt-auto`}
                      >
                        Add money
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        ) : (
          <>
            <section className="bento-pod p-6">
              <p className="text-[13px] text-[#636366]">Remaining to repay</p>
              <p className="text-[40px] leading-[46px] font-semibold tracking-[-0.02em] tabular-nums mt-1">
                {formatINR(totalDebtRemaining)}
              </p>
              <div className="mt-5">
                <Bar pct={debtPct} />
              </div>
              <p className="text-[13px] text-[#636366] mt-2 tabular-nums">
                {debtPct}% repaid of {formatINR(totalDebtPrincipal)}
              </p>
            </section>

            {state.debts.length === 0 ? (
              <div className="bento-pod p-10 text-center text-[15px] text-[#636366]">
                No debts tracked.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {state.debts.map((d) => {
                  const pct =
                    d.totalLoan > 0 ? Math.min(100, Math.round((d.paidPrincipal / d.totalLoan) * 100)) : 0;
                  return (
                    <div key={d.id} className="bento-pod p-5 flex flex-col gap-4">
                      <div>
                        <h3 className="text-[15px] font-medium text-[#1C1C1E]">{d.name}</h3>
                        <p className="text-[13px] text-[#636366]">
                          {d.lender} · {d.apr}% interest · {d.remainingMonths} months left
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Bar pct={pct} />
                        <p className="text-[13px] text-[#636366] tabular-nums">
                          {formatINR(d.paidPrincipal)} of {formatINR(d.totalLoan)} repaid
                        </p>
                      </div>
                      <p className="text-[13px] text-[#636366] tabular-nums">
                        {formatINR(d.emi)} due {d.nextDueDate}
                      </p>
                      <button
                        type="button"
                        onClick={() => payDebtEmi(d.id)}
                        className={`${SECONDARY} mt-auto`}
                      >
                        Mark {formatINR(d.emi)} as paid
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      <UniversalSheetModal
        isOpen={Boolean(contributeGoalId)}
        onClose={() => setContributeGoalId(null)}
        title={contributingGoal ? `Add to ${contributingGoal.name}` : 'Add money'}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleContributionSubmit} className="space-y-4">
          <div>
            <label htmlFor="contribute-amount" className="text-[13px] text-[#636366] block mb-1.5">
              Amount (₹)
            </label>
            <input
              id="contribute-amount"
              type="number"
              inputMode="numeric"
              value={contributeAmount}
              onChange={(e) => setContributeAmount(e.target.value)}
              className={FIELD}
            />
          </div>
          <button type="submit" className={`${PRIMARY} w-full`}>
            Add money
          </button>
        </form>
      </UniversalSheetModal>

      <UniversalSheetModal
        isOpen={isAddGoalOpen}
        onClose={() => setIsAddGoalOpen(false)}
        title="New goal"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleCreateGoal} className="space-y-4">
          <div>
            <label htmlFor="goal-name" className="text-[13px] text-[#636366] block mb-1.5">
              Name
            </label>
            <input
              id="goal-name"
              type="text"
              value={newGoalName}
              onChange={(e) => setNewGoalName(e.target.value)}
              placeholder="e.g. New laptop"
              className={FIELD}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="goal-target" className="text-[13px] text-[#636366] block mb-1.5">
                Target amount (₹)
              </label>
              <input
                id="goal-target"
                type="number"
                inputMode="numeric"
                value={newGoalTarget}
                onChange={(e) => setNewGoalTarget(e.target.value)}
                placeholder="100000"
                className={FIELD}
              />
            </div>
            <div>
              <label htmlFor="goal-sip" className="text-[13px] text-[#636366] block mb-1.5">
                Monthly saving (₹)
              </label>
              <input
                id="goal-sip"
                type="number"
                inputMode="numeric"
                value={newGoalSip}
                onChange={(e) => setNewGoalSip(e.target.value)}
                placeholder="10000"
                className={FIELD}
              />
            </div>
          </div>
          <button type="submit" className={`${PRIMARY} w-full`}>
            Create goal
          </button>
        </form>
      </UniversalSheetModal>
    </div>
  );
}
