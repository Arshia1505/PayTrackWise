'use client';

import React, { useState } from 'react';
import { useFinShield } from '@/context/FinShieldContext';
import { PageHeader, InsetGroupedList } from '@/components/primitives';
import { formatINR } from '@/lib/finance-engine';

export default function UnusualSpendingPage() {
  const { state, saveLedgerLocally } = useFinShield();
  const [sensitivitySigma, setSensitivitySigma] = useState<number>(2.5);
  const [auditOutput, setAuditOutput] = useState<string | null>(null);
  const [runningAudit, setRunningAudit] = useState(false);

  const flaggedTransactions = state.transactions.filter(
    (t) => (t.anomalyZScore || 0) >= sensitivitySigma
  );

  const runCheck = async () => {
    setRunningAudit(true);
    try {
      await saveLedgerLocally();
      setAuditOutput(
        `Checked ${state.transactions.length} transactions. ${flaggedTransactions.length} look unusual.`
      );
    } catch {
      setAuditOutput('Could not complete the check. Please try again.');
    } finally {
      setRunningAudit(false);
    }
  };

  return (
    <div className="pb-12">
      <PageHeader
        title="Unusual spending"
        description="Transactions that are much larger than you normally spend."
        action={
          <button
            type="button"
            onClick={runCheck}
            disabled={runningAudit}
            className="h-10 px-5 rounded-full bg-ink text-white text-[14px] font-medium cursor-pointer disabled:opacity-60"
          >
            {runningAudit ? 'Checking…' : 'Check again'}
          </button>
        }
      />

      {auditOutput && (
        <div role="status" className="mb-6 p-4 rounded-[16px] bg-haze text-[14px] text-ink">
          {auditOutput}
        </div>
      )}

      <div className="bento-pod p-5 sm:p-6 mb-6">
        <div className="flex items-baseline justify-between gap-3 mb-2">
          <label htmlFor="sensitivity" className="text-[13px] text-muted">
            Sensitivity
          </label>
          <span className="text-[13px] font-medium tabular-nums">
            {flaggedTransactions.length} flagged
          </span>
        </div>
        <input
          id="sensitivity"
          type="range"
          min={1.5}
          max={3.5}
          step={0.1}
          value={sensitivitySigma}
          onChange={(e) => setSensitivitySigma(Number(e.target.value))}
          className="w-full h-6 accent-ink"
        />
        <div className="flex justify-between text-[13px] text-muted mt-1">
          <span>More alerts</span>
          <span>Fewer alerts</span>
        </div>
      </div>

      <h2 className="text-[17px] font-semibold mb-3">Flagged transactions</h2>
      <InsetGroupedList>
        {flaggedTransactions.length === 0 ? (
          <div className="p-8 text-center text-[14px] text-muted">
            Nothing unusual at this sensitivity.
          </div>
        ) : (
          flaggedTransactions.map((tx) => (
            <div key={tx.id} className="px-5 py-4 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <div className="text-[15px] font-medium truncate">{tx.merchant}</div>
                <p className="text-[13px] text-muted truncate">
                  {tx.category} · {tx.date}
                  {tx.paymentMethod ? ` · ${tx.paymentMethod}` : ''}
                </p>
              </div>
              <span className="text-[15px] font-semibold tabular-nums shrink-0">
                {formatINR(tx.amount)}
              </span>
            </div>
          ))
        )}
      </InsetGroupedList>
    </div>
  );
}
