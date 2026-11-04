'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useFinShield } from '@/context/FinShieldContext';
import { PageHeader, InsetGroupedList } from '@/components/primitives';
import { parseAndAnalyzeBankCSV, formatINR, type CsvAnalysisReport } from '@/lib/finance-engine';
import { API } from '@/lib/account-api';

export default function CsvBankImportAndAiAnalysisPage() {
  const router = useRouter();
  const { importCsvRowsToLedger } = useFinShield();

  const [csvText, setCsvText] = useState<string>('');
  const [analyzing, setAnalyzing] = useState<boolean>(false);
  const [filterMode, setFilterMode] = useState<'all' | 'anomalies' | 'recurring'>('all');
  const [committedBanner, setCommittedBanner] = useState<string | null>(null);
  const [aiNote, setAiNote] = useState<string | null>(null);

  const [customReport, setCustomReport] = useState<CsvAnalysisReport | null>(null);
  const report = useMemo(
    () => customReport || parseAndAnalyzeBankCSV(csvText),
    [csvText, customReport]
  );

  const [selectedRowIds, setSelectedRowIds] = useState<Record<string, boolean>>({});

  const isRowSelected = (id: string) => selectedRowIds[id] ?? true;

  const toggleRowSelection = (id: string) => {
    setSelectedRowIds((prev) => ({
      ...prev,
      [id]: !(prev[id] ?? true),
    }));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    setCsvText(text);
    setCustomReport(null);
    setAiNote(null);
    await writeLocalSummary(text);
  };

  const writeLocalSummary = async (rawText: string) => {
    setAnalyzing(true);
    const local = parseAndAnalyzeBankCSV(rawText);
    setCustomReport(local);
    const prompt = [
      `Format: ${local.detectedBankFormat}.`,
      `Credits ${formatINR(local.totalCredits)}, debits ${formatINR(local.totalDebits)}, net ${formatINR(local.netCashflow)}.`,
      `Savings rate ${local.savingsRatePct}%.`,
      `${local.rows.length} rows, ${local.flaggedAnomalies.length} unusual, ${local.discoveredCommitments.length} recurring.`,
    ].join(' ');
    try {
      const res = await fetch(`${API}/ai/summary`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, fallback: local.aiExecutiveSummary }),
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.summary) && data.summary.length) {
          setCustomReport({ ...local, aiExecutiveSummary: data.summary });
        }
        if (data.mode === 'ollama') setAiNote(`Written by Ollama · ${data.model}`);
        else if (data.cached) setAiNote('Ollama did not answer. Showing the summary saved in SQLite.');
        else setAiNote('Ollama did not answer. This summary was saved in SQLite.');
      }
    } catch {
      setAiNote('Showing the summary calculated on this device.');
    } finally {
      setAnalyzing(false);
    }
  };

  const visibleRows = useMemo(() => {
    if (filterMode === 'anomalies') {
      return report.rows.filter((r) => r.anomalyStatus !== 'NORMAL');
    }
    if (filterMode === 'recurring') {
      return report.rows.filter(
        (r) =>
          r.category === 'Subscriptions' ||
          r.category === 'Utilities & Rent' ||
          r.category === 'EMI & Loans'
      );
    }
    return report.rows;
  }, [report.rows, filterMode]);

  const selectedCount = report.rows.filter((r) => isRowSelected(r.id)).length;

  const handleCommitSelectedToVault = () => {
    const chosen = report.rows.filter((r) => isRowSelected(r.id));
    if (chosen.length === 0) return;

    importCsvRowsToLedger(
      chosen.map((r) => ({
        date: r.date,
        merchant: r.merchant,
        category: r.category,
        amount: r.amount,
        type: r.type,
        zScore: r.zScore,
      }))
    );

    setCommittedBanner(`Imported ${chosen.length} transactions.`);
    setTimeout(() => setCommittedBanner(null), 5000);
  };

  return (
    <div className="pb-12">
      <PageHeader
        title="Import statement"
        description="Upload a bank CSV file to categorize transactions and spot recurring bills."
        action={
          <label className="inline-flex items-center justify-center h-11 sm:h-10 px-5 rounded-full bg-ink text-white text-[14px] font-medium cursor-pointer">
            <span>{analyzing ? 'Reading…' : 'Upload CSV'}</span>
            <input
              type="file"
              accept=".csv,text/csv"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        }
      />

      <div className="space-y-6">
        {committedBanner && (
          <div
            role="status"
            className="p-4 rounded-2xl bg-[#32D74B]/15 text-[#1E8E3E] text-[14px] flex items-center justify-between gap-3"
          >
            <span>{committedBanner}</span>
            <button
              type="button"
              onClick={() => router.push('/transactions')}
              className="underline font-medium cursor-pointer"
            >
              View transactions
            </button>
          </div>
        )}

        {/* Hero summary */}
        <section className="bento-pod p-6">
          <p className="text-[13px] text-muted">Net cashflow in statement</p>
          <p className="text-[40px] leading-[46px] font-semibold tracking-[-0.02em] tabular-nums mt-1">
            {report.netCashflow >= 0 ? '+' : '−'}
            {formatINR(Math.abs(report.netCashflow))}
          </p>
          <dl className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-5">
            <div>
              <dt className="text-[13px] text-muted">Money in</dt>
              <dd className="text-[18px] font-semibold tabular-nums">
                {formatINR(report.totalCredits)}
              </dd>
            </div>
            <div>
              <dt className="text-[13px] text-muted">Money out</dt>
              <dd className="text-[18px] font-semibold tabular-nums">
                {formatINR(report.totalDebits)}
              </dd>
            </div>
            <div>
              <dt className="text-[13px] text-muted">Unusual transactions</dt>
              <dd className="text-[18px] font-semibold tabular-nums">
                {report.flaggedAnomalies.length}
              </dd>
            </div>
          </dl>
        </section>

        {/* Highlights + Recurring bills */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-6 bento-pod p-5 sm:p-6 space-y-3">
            <h2 className="text-[17px] font-semibold">Statement summary</h2>
            {aiNote ? <p className="text-[13px] text-muted">{aiNote}</p> : null}
            <ul className="space-y-2.5 text-[14px] text-ink">
              {report.aiExecutiveSummary.map((bullet, idx) => (
                <li key={idx} className="bg-white rounded-2xl p-3.5 leading-relaxed">
                  {bullet}
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-6 bento-pod p-5 sm:p-6 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-[17px] font-semibold">Recurring bills found</h2>
              <button
                type="button"
                onClick={() => router.push('/subscriptions')}
                className="text-[13px] font-medium text-ink underline cursor-pointer min-h-[44px] inline-flex items-center"
              >
                All bills
              </button>
            </div>

            <div className="bg-white rounded-2xl divide-y divide-lilac/40">
              {report.discoveredCommitments.map((c, idx) => (
                <div key={idx} className="p-3.5 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[14px] font-medium text-ink truncate">{c.name}</p>
                    <p className="text-[13px] text-muted">
                      {c.cadence} · {c.date}
                    </p>
                  </div>
                  <span className="text-[14px] font-semibold text-ink tabular-nums shrink-0">
                    {formatINR(c.amount)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Transactions to import */}
        <section className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-[17px] font-semibold">
                Transactions ({visibleRows.length})
              </h2>
              <div
                role="group"
                aria-label="Filter statement rows"
                className="inline-flex bg-haze p-1 rounded-full"
              >
                {[
                  { id: 'all', label: 'All' },
                  { id: 'anomalies', label: `Unusual (${report.flaggedAnomalies.length})` },
                  { id: 'recurring', label: 'Recurring' },
                ].map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    aria-pressed={filterMode === f.id}
                    onClick={() => setFilterMode(f.id as 'all' | 'anomalies' | 'recurring')}
                    className={`h-9 px-4 rounded-full text-[13px] font-medium cursor-pointer ${
                      filterMode === f.id ? 'bg-ink text-white' : 'text-muted'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={handleCommitSelectedToVault}
              disabled={selectedCount === 0}
              className="h-11 sm:h-10 px-5 rounded-full bg-ink text-white text-[14px] font-medium cursor-pointer disabled:opacity-50 self-start sm:self-auto"
            >
              Import {selectedCount} selected
            </button>
          </div>

          <InsetGroupedList>
            {visibleRows.map((row) => {
              const checked = isRowSelected(row.id);
              return (
                <label
                  key={row.id}
                  className="px-5 py-3.5 flex items-center justify-between gap-4 cursor-pointer"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleRowSelection(row.id)}
                      className="w-5 h-5 accent-ink rounded mt-0.5 cursor-pointer shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[15px] font-medium text-ink">
                          {row.merchant}
                        </span>
                        {row.anomalyStatus !== 'NORMAL' && (
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[12px] font-medium ${
                              row.anomalyStatus === 'HIGH_DEVIATION'
                                ? 'bg-glow/15 text-glow'
                                : 'bg-azure/15 text-azure'
                            }`}
                          >
                            Unusual amount
                          </span>
                        )}
                      </div>
                      <p className="text-[13px] text-muted">
                        {row.category} · {row.date}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`text-[15px] font-medium tabular-nums shrink-0 ${
                      row.type === 'credit' ? 'text-[#1E8E3E]' : 'text-ink'
                    }`}
                  >
                    {row.type === 'credit' ? '+' : '−'}
                    {formatINR(row.amount)}
                  </span>
                </label>
              );
            })}
          </InsetGroupedList>
        </section>
      </div>
    </div>
  );
}
