'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useFinShield } from '@/context/FinShieldContext';
import { PageHeader } from '@/components/primitives';
import { API } from '@/lib/account-api';
import { formatINR } from '@/lib/finance-engine';

interface RatingBand {
  from: number;
  to: number;
  label: string;
}

interface GenericScore {
  name: string;
  score: number;
  rating: string;
  ratings: RatingBand[];
  improvements: string[];
  mode: string;
  transactionCount: number;
  moneyIn: number;
  moneyOut: number;
}

const FALLBACK_BANDS: RatingBand[] = [
  { from: 300, to: 499, label: 'Building' },
  { from: 500, to: 649, label: 'Fair' },
  { from: 650, to: 749, label: 'Good' },
  { from: 750, to: 849, label: 'Strong' },
  { from: 850, to: 900, label: 'Excellent' },
];

export default function GenericScorePage() {
  const { state } = useFinShield();
  const [result, setResult] = useState<GenericScore | null>(null);
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState('');

  const body = useMemo(
    () => ({
      monthlyIncome: state.profile.monthlyIncome || 0,
      transactions: state.transactions.slice(0, 200).map((tx) => ({
        merchant: tx.merchant,
        category: tx.category,
        amount: tx.amount,
        type: tx.type,
      })),
    }),
    [state.profile.monthlyIncome, state.transactions]
  );
  const requestKey = JSON.stringify(body);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setNote('');
    fetch(`${API}/ai/generic-score`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: requestKey,
      signal: controller.signal,
    })
      .then(async (res) => {
        if (!res.ok) throw new Error('score failed');
        const data = (await res.json()) as GenericScore;
        if (!Array.isArray(data.ratings) || typeof data.score !== 'number') {
          throw new Error('score failed');
        }
        setResult(data);
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') return;
        setResult(null);
        setNote('The score could not be read. Try again.');
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [requestKey]);

  const bands = result?.ratings?.length ? result.ratings : FALLBACK_BANDS;
  const score = result?.score ?? null;

  return (
    <div className="pb-12">
      <PageHeader
        title="Generic Score"
        description="A score read from your transactions. It is not a bank credit report."
      />

      <section className="bento-pod p-6 mb-6">
        <p className="text-[13px] text-muted">Generic Score</p>
        <p className="mt-2 font-display text-[56px] leading-none font-light tracking-[-0.035em] tabular-nums text-ink">
          {loading && score === null ? '…' : score ?? '—'}
        </p>
        <p className="text-[17px] font-medium mt-3">{result?.rating || (loading ? 'Reading transactions' : 'No score yet')}</p>
        {result && (
          <p className="text-[13px] text-muted mt-1">
            {result.transactionCount} transaction{result.transactionCount === 1 ? '' : 's'} ·{' '}
            {formatINR(result.moneyIn)} in · {formatINR(result.moneyOut)} out
            {result.mode === 'ollama' ? ' · read with local AI' : ' · read from your totals'}
          </p>
        )}
        {note && (
          <p role="status" className="text-[14px] text-muted mt-3">
            {note}
          </p>
        )}
      </section>

      <h2 className="text-[17px] font-semibold mb-3">Score ratings</h2>
      <ol className="bento-pod divide-y divide-peri mb-6">
        {bands.map((band) => {
          const current = score !== null && score >= band.from && score <= band.to;
          return (
            <li
              key={band.label}
              className={`px-5 py-4 flex items-center justify-between gap-4 ${current ? 'bg-haze' : ''}`}
              aria-current={current ? 'true' : undefined}
            >
              <span className="text-[15px] font-medium">
                {band.label}
                {current ? ' · your rating' : ''}
              </span>
              <span className="text-[14px] tabular-nums text-muted">
                {band.from}–{band.to}
              </span>
            </li>
          );
        })}
      </ol>

      <h2 className="text-[17px] font-semibold mb-3">What would raise it</h2>
      <ul className="bento-pod divide-y divide-peri">
        {loading && !result ? (
          <li className="px-5 py-4 text-[14px] text-muted">Reading your transactions…</li>
        ) : result?.improvements?.length ? (
          result.improvements.map((tip) => (
            <li key={tip} className="px-5 py-4 text-[15px] leading-6">
              {tip}
            </li>
          ))
        ) : (
          <li className="px-5 py-4 text-[14px] text-muted">
            Add a few transactions, then open this page again.
          </li>
        )}
      </ul>
    </div>
  );
}
