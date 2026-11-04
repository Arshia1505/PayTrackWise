'use client';

import React, { useState, useMemo } from 'react';
import { PageHeader } from '@/components/primitives';
import {
  calculateEMI,
  calculateLoanPrepayment,
  calculateSIP,
  formatINR,
} from '@/lib/finance-engine';

type Mode = 'emi' | 'prepayment' | 'sip';

const TABS: { id: Mode; label: string }[] = [
  { id: 'emi', label: 'EMI' },
  { id: 'prepayment', label: 'Prepayment' },
  { id: 'sip', label: 'SIP' },
];

function Slider({
  id,
  label,
  display,
  min,
  max,
  step,
  value,
  onChange,
}: {
  id: string;
  label: string;
  display: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="flex justify-between gap-3 mb-2 text-[13px]">
        <label htmlFor={id} className="text-muted">
          {label}
        </label>
        <span className="font-medium text-ink tabular-nums">{display}</span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-6 accent-ink"
      />
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: 'positive' }) {
  return (
    <div className="bg-haze rounded-[16px] p-4">
      <div className="text-[13px] text-muted">{label}</div>
      <div
        className={`text-[17px] font-semibold tabular-nums mt-1 ${
          tone === 'positive' ? 'text-[#1E8E3E]' : 'text-ink'
        }`}
      >
        {value}
      </div>
    </div>
  );
}

export default function FinancialCalculatorsPage() {
  const [calcMode, setCalcMode] = useState<Mode>('emi');

  const [principal, setPrincipal] = useState<number>(2500000);
  const [annualRate, setAnnualRate] = useState<number>(8.5);
  const [tenureMonths, setTenureMonths] = useState<number>(120);
  const [extraMonthlyPayment, setExtraMonthlyPayment] = useState<number>(5000);

  const [monthlySip, setMonthlySip] = useState<number>(25000);
  const [sipReturnRate, setSipReturnRate] = useState<number>(12.5);
  const [sipYears, setSipYears] = useState<number>(10);

  const emiResult = useMemo(
    () => calculateEMI(principal, annualRate, tenureMonths),
    [principal, annualRate, tenureMonths]
  );
  const prepayResult = useMemo(
    () => calculateLoanPrepayment(principal, annualRate, tenureMonths, extraMonthlyPayment),
    [principal, annualRate, tenureMonths, extraMonthlyPayment]
  );
  const sipResult = useMemo(
    () => calculateSIP(monthlySip, sipReturnRate, sipYears),
    [monthlySip, sipReturnRate, sipYears]
  );

  return (
    <div className="pb-10">
      <PageHeader title="Calculators" description="Plan a loan or an investment." />

      <div
        role="tablist"
        aria-label="Calculator type"
        className="inline-flex bg-haze p-1 rounded-full mb-6 max-w-full"
      >
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={calcMode === t.id}
            onClick={() => setCalcMode(t.id)}
            className={`h-10 px-5 rounded-full text-[14px] font-medium cursor-pointer transition-colors ${
              calcMode === t.id ? 'bg-ink text-white' : 'text-muted hover:text-ink'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        <div className="bento-pod p-5 sm:p-6 space-y-6">
          {calcMode === 'sip' ? (
            <>
              <Slider
                id="sip-amount"
                label="Monthly investment"
                display={formatINR(monthlySip)}
                min={1000}
                max={200000}
                step={1000}
                value={monthlySip}
                onChange={setMonthlySip}
              />
              <Slider
                id="sip-return"
                label="Expected yearly return"
                display={`${sipReturnRate}%`}
                min={6}
                max={24}
                step={0.5}
                value={sipReturnRate}
                onChange={setSipReturnRate}
              />
              <Slider
                id="sip-years"
                label="Duration"
                display={`${sipYears} years`}
                min={1}
                max={30}
                step={1}
                value={sipYears}
                onChange={setSipYears}
              />
            </>
          ) : (
            <>
              <Slider
                id="loan-amount"
                label="Loan amount"
                display={formatINR(principal)}
                min={100000}
                max={10000000}
                step={50000}
                value={principal}
                onChange={setPrincipal}
              />
              <Slider
                id="loan-rate"
                label="Interest rate (per year)"
                display={`${annualRate.toFixed(2)}%`}
                min={5}
                max={18}
                step={0.05}
                value={annualRate}
                onChange={setAnnualRate}
              />
              <Slider
                id="loan-tenure"
                label="Loan term"
                display={`${tenureMonths} months (${(tenureMonths / 12).toFixed(1)} years)`}
                min={12}
                max={360}
                step={6}
                value={tenureMonths}
                onChange={setTenureMonths}
              />
              {calcMode === 'prepayment' && (
                <Slider
                  id="loan-extra"
                  label="Extra payment each month"
                  display={formatINR(extraMonthlyPayment)}
                  min={1000}
                  max={50000}
                  step={1000}
                  value={extraMonthlyPayment}
                  onChange={setExtraMonthlyPayment}
                />
              )}
            </>
          )}
        </div>

        <div className="bento-pod p-5 sm:p-6 space-y-6">
          {calcMode === 'sip' ? (
            <>
              <div>
                <div className="text-[13px] text-muted">Value after {sipYears} years</div>
                <div className="text-[34px] sm:text-[40px] font-semibold tracking-[-0.02em] tabular-nums break-words">
                  {formatINR(sipResult.futureValue)}
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Stat label="You invest" value={formatINR(sipResult.totalInvested)} />
                <Stat label="Growth" value={formatINR(sipResult.wealthGain)} tone="positive" />
              </div>
            </>
          ) : (
            <>
              <div>
                <div className="text-[13px] text-muted">
                  {calcMode === 'prepayment' ? 'Monthly EMI' : 'Monthly payment (EMI)'}
                </div>
                <div className="text-[34px] sm:text-[40px] font-semibold tracking-[-0.02em] tabular-nums break-words">
                  {formatINR(emiResult.monthlyEMI)}
                  <span className="text-[15px] font-normal text-muted"> / month</span>
                </div>
              </div>

              {calcMode === 'prepayment' && (
                <div className="rounded-[16px] bg-[#32D74B]/15 p-4">
                  <div className="text-[15px] font-semibold text-[#1E8E3E]">
                    You finish {prepayResult.monthsSaved} months sooner
                  </div>
                  <p className="text-[13px] text-ink mt-1 tabular-nums">
                    Saves {formatINR(prepayResult.interestSaved)} in interest. New term:{' '}
                    {prepayResult.revisedMonths} months.
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Stat label="Loan amount" value={formatINR(principal, { compact: true })} />
                <Stat label="Total interest" value={formatINR(emiResult.totalInterest, { compact: true })} />
                <Stat label="Total payable" value={formatINR(emiResult.totalPayable, { compact: true })} />
              </div>

              <div>
                <h2 className="text-[15px] font-semibold mb-2">Year by year</h2>
                <div className="overflow-x-auto -mx-1 px-1">
                  <table className="w-full text-left text-[13px] tabular-nums min-w-[320px]">
                    <thead className="text-muted">
                      <tr>
                        <th className="py-2 pr-2 font-medium">Year</th>
                        <th className="py-2 px-2 font-medium text-right">Principal</th>
                        <th className="py-2 px-2 font-medium text-right">Interest</th>
                        <th className="py-2 pl-2 font-medium text-right">Balance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-lilac/40">
                      {emiResult.yearlySchedule.map((row) => (
                        <tr key={row.year}>
                          <td className="py-2 pr-2">{row.year}</td>
                          <td className="py-2 px-2 text-right">{formatINR(row.principalPaid)}</td>
                          <td className="py-2 px-2 text-right text-muted">{formatINR(row.interestPaid)}</td>
                          <td className="py-2 pl-2 text-right">{formatINR(row.closingBalance)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
