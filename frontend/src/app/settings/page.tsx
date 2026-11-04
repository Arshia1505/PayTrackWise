'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useFinShield, type ThemeAccentToken } from '@/context/FinShieldContext';
import { PageHeader } from '@/components/primitives';
import { API } from '@/lib/account-api';
import { clearSession } from '@/lib/session';

const ACCENT_PRESETS: Array<{ id: ThemeAccentToken; label: string; hex: string }> = [
  { id: 'obsidian', label: 'Ink', hex: '#1c1b3a' },
  { id: 'orange', label: 'Iris', hex: '#8f7df0' },
  { id: 'electric', label: 'Azure', hex: '#3d86ff' },
  { id: 'emerald', label: 'Glow', hex: '#e35fc9' },
];

const inputCls =
  'w-full h-11 px-4 rounded-[16px] bg-haze text-[14px] text-ink placeholder:text-mist outline-none focus:ring-2 focus:ring-ink/20';
const labelCls = 'text-[13px] text-muted block mb-1.5';
const secondaryBtn =
  'inline-flex items-center justify-center h-10 px-5 rounded-full bg-haze text-ink text-[14px] font-medium cursor-pointer hover:bg-peri';

export default function SettingsPage() {
  const {
    state,
    updateProfile,
    updateSettings,
    resetDemoVault,
  } = useFinShield();
  const router = useRouter();
  const [confirmReset, setConfirmReset] = useState(false);
  const [engine, setEngine] = useState<{ ollama: boolean; model: string } | null>(null);

  useEffect(() => {
    let live = true;
    fetch(`${API}/health`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (live && data) setEngine({ ollama: Boolean(data.ollama), model: String(data.model || '') });
      })
      .catch(() => {
        if (live) setEngine(null);
      });
    return () => {
      live = false;
    };
  }, []);

  const handleExportLedgerCsv = () => {
    const headers = ['ID,Date,Time,Merchant,Category,Type,AmountINR,PaymentMethod,OCRVerified'];
    const rows = state.transactions.map(
      (t) =>
        `"${t.id}","${t.date}","${t.time}","${t.merchant.replace(/"/g, '""')}","${
          t.category
        }","${t.type}",${t.amount},"${t.paymentMethod || 'UPI'}",${Boolean(t.verifiedOcr)}`
    );
    const csvContent = [headers, ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `finshield-ledger-export-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const toggles = [
    {
      key: 'compactLakhs' as const,
      title: 'Short amounts',
      desc: 'Show large amounts as ₹1.85L or ₹2Cr.',
    },
    {
      key: 'budgetThreshold80Alert' as const,
      title: 'Budget warnings',
      desc: 'Warn me when a category reaches 80% of its budget.',
    },
    {
      key: 'mlZScoreAnomalyGuard' as const,
      title: 'Unusual spending alerts',
      desc: 'Flag transactions that look out of the ordinary.',
    },
  ];

  return (
    <div className="pb-12">
      <PageHeader title="Settings" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        <div className="space-y-6 min-w-0">
          <section className="bento-pod p-5 sm:p-6 space-y-5" aria-labelledby="profile-h">
            <h2 id="profile-h" className="text-[17px] font-semibold">Profile</h2>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-[var(--accent-primary)] text-white text-[15px] font-semibold flex items-center justify-center shrink-0">
                {state.profile.initials}
              </div>
              <div className="min-w-0">
                <div className="text-[15px] font-medium truncate">{state.profile.name}</div>
                <div className="text-[13px] text-muted truncate">{state.profile.email}</div>
              </div>
            </div>
            <div>
              <label htmlFor="s-name" className={labelCls}>Name</label>
              <input
                id="s-name"
                type="text"
                value={state.profile.name}
                onChange={(e) => updateProfile({ name: e.target.value })}
                className={inputCls}
              />
            </div>
            <div>
              <label htmlFor="s-upi" className={labelCls}>UPI ID</label>
              <input
                id="s-upi"
                type="text"
                value={state.profile.upiVpa}
                onChange={(e) => updateProfile({ upiVpa: e.target.value })}
                className={inputCls}
              />
            </div>
          </section>

          <section className="bento-pod p-5 sm:p-6 space-y-3" aria-labelledby="session-h">
            <h2 id="session-h" className="text-[17px] font-semibold">Account</h2>
            <p className="text-[13px] text-muted">
              Sign out of this device. Your data stays here until you reset it.
            </p>
            <button
              type="button"
              onClick={() => {
                clearSession();
                router.replace('/');
              }}
              className="inline-flex items-center justify-center h-10 px-5 rounded-full bg-ink text-white text-[14px] font-medium cursor-pointer hover:bg-ink-soft"
            >
              Log out
            </button>
          </section>

          <section className="bento-pod p-5 sm:p-6 space-y-4" aria-labelledby="appearance-h">
            <h2 id="appearance-h" className="text-[17px] font-semibold">Accent colour</h2>
            <div className="flex flex-wrap gap-3" role="radiogroup" aria-label="Accent colour">
              {ACCENT_PRESETS.map((preset) => {
                const active = state.settings.themeAccent === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    aria-label={preset.label}
                    onClick={() => updateSettings({ themeAccent: preset.id })}
                    className={`h-11 pl-3 pr-4 rounded-full flex items-center gap-2 text-[14px] font-medium cursor-pointer ${
                      active ? 'bg-ink text-white' : 'bg-haze text-ink hover:bg-peri'
                    }`}
                  >
                    <span className="w-5 h-5 rounded-full" style={{ backgroundColor: preset.hex }} />
                    {preset.label}
                  </button>
                );
              })}
            </div>
          </section>
        </div>

        <div className="space-y-6 min-w-0">
          <section className="bento-pod p-5 sm:p-6" aria-labelledby="prefs-h">
            <h2 id="prefs-h" className="text-[17px] font-semibold mb-2">Preferences</h2>
            <div className="divide-y divide-lilac/40">
              {toggles.map((item) => (
                <label
                  key={item.key}
                  className="flex items-center justify-between gap-4 py-3 min-h-[44px] cursor-pointer"
                >
                  <span className="min-w-0">
                    <span className="text-[15px] font-medium block">{item.title}</span>
                    <span className="text-[13px] text-muted">{item.desc}</span>
                  </span>
                  <input
                    type="checkbox"
                    checked={Boolean(state.settings[item.key])}
                    onChange={(e) => updateSettings({ [item.key]: e.target.checked })}
                    className="w-5 h-5 accent-ink shrink-0 cursor-pointer"
                  />
                </label>
              ))}
            </div>
          </section>

          <section className="bento-pod p-5 sm:p-6 space-y-4" aria-labelledby="data-h">
            <h2 id="data-h" className="text-[17px] font-semibold">Your data</h2>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={handleExportLedgerCsv} className={secondaryBtn}>
                Export as CSV
              </button>
              <button type="button" onClick={() => window.print()} className={secondaryBtn}>
                Print report
              </button>
            </div>
            <div className="pt-2">
              {confirmReset ? (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[13px] text-muted">Erase all data on this device and sign out?</span>
                  <button
                    type="button"
                    onClick={() => {
                      resetDemoVault();
                      setConfirmReset(false);
                      router.replace('/signin');
                    }}
                    className="inline-flex items-center justify-center h-10 px-5 rounded-full bg-glow/15 text-glow text-[14px] font-medium cursor-pointer"
                  >
                    Yes, reset
                  </button>
                  <button type="button" onClick={() => setConfirmReset(false)} className={secondaryBtn}>
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmReset(true)}
                  className="inline-flex items-center justify-center h-10 px-5 rounded-full bg-glow/15 text-glow text-[14px] font-medium cursor-pointer"
                >
                  Reset demo data
                </button>
              )}
            </div>
          </section>

          <section className="bento-pod p-5 sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-[17px] font-semibold">Local engine</h2>
              <span className="text-[13px] text-muted">
                {engine ? (engine.ollama ? 'Ollama ready' : 'SQLite only') : 'Checking'}
              </span>
            </div>
            <p className="text-[13px] text-muted mt-3">
              Accounts, receipts, and statement summaries stay in SQLite on this machine.
              {engine?.model ? ` Summaries use ${engine.model}.` : ''}
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
