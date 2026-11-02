'use client';

import React, { useState } from 'react';
import { useFinShield, type ThemeAccentToken } from '@/context/FinShieldContext';
import { PageHeader } from '@/components/primitives';

const ACCENT_PRESETS: Array<{ id: ThemeAccentToken; label: string; hex: string }> = [
  { id: 'obsidian', label: 'Black', hex: '#1C1C1E' },
  { id: 'orange', label: 'Orange', hex: '#FF5500' },
  { id: 'electric', label: 'Blue', hex: '#007AFF' },
  { id: 'emerald', label: 'Green', hex: '#1E8E3E' },
];

const inputCls =
  'w-full h-11 px-4 rounded-[16px] bg-[#F5F5F7] text-[14px] text-[#1C1C1E] placeholder:text-[#8E8E93] outline-none focus:ring-2 focus:ring-[#1C1C1E]/20';
const labelCls = 'text-[13px] text-[#636366] block mb-1.5';
const primaryBtn =
  'inline-flex items-center justify-center h-10 px-5 rounded-full bg-[#1C1C1E] text-white text-[14px] font-medium cursor-pointer';
const secondaryBtn =
  'inline-flex items-center justify-center h-10 px-5 rounded-full bg-[#F5F5F7] text-[#1C1C1E] text-[14px] font-medium cursor-pointer hover:bg-[#EBEBED]';

export default function SettingsPage() {
  const {
    state,
    updateProfile,
    updateSettings,
    updateAwsConfig,
    syncWithAwsCloud,
    resetDemoVault,
  } = useFinShield();

  const [awsAccessKey, setAwsAccessKey] = useState(state.awsConfig.accessKeyId || '');
  const [awsSecretKey, setAwsSecretKey] = useState(state.awsConfig.secretAccessKey || '');
  const [awsSessionToken, setAwsSessionToken] = useState(state.awsConfig.sessionToken || '');
  const [awsRegion, setAwsRegion] = useState(state.awsConfig.region || 'ap-south-1');
  const [s3Bucket, setS3Bucket] = useState(state.awsConfig.s3Bucket || 'finshield-vault-artifacts');
  const [dynamoTable, setDynamoTable] = useState(state.awsConfig.dynamoTable || 'FinShieldLedger');
  const [bedrockModel, setBedrockModel] = useState(
    state.awsConfig.bedrockModelId || 'anthropic.claude-3-5-haiku-20241022-v1:0'
  );
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  const handleSaveAwsConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    updateAwsConfig({
      enabled: Boolean(awsAccessKey.trim() && awsSecretKey.trim()),
      region: awsRegion,
      accessKeyId: awsAccessKey.trim(),
      secretAccessKey: awsSecretKey.trim(),
      sessionToken: awsSessionToken.trim() || undefined,
      s3Bucket: s3Bucket.trim(),
      dynamoTable: dynamoTable.trim(),
      bedrockModelId: bedrockModel.trim(),
    });
    const res = await syncWithAwsCloud();
    setSyncMessage(res.message);
    setTimeout(() => setSyncMessage(null), 4000);
  };

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
                <div className="text-[13px] text-[#636366] truncate">{state.profile.email}</div>
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
                      active ? 'bg-[#1C1C1E] text-white' : 'bg-[#F5F5F7] text-[#1C1C1E] hover:bg-[#EBEBED]'
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
            <div className="divide-y divide-black/[0.06]">
              {toggles.map((item) => (
                <label
                  key={item.key}
                  className="flex items-center justify-between gap-4 py-3 min-h-[44px] cursor-pointer"
                >
                  <span className="min-w-0">
                    <span className="text-[15px] font-medium block">{item.title}</span>
                    <span className="text-[13px] text-[#636366]">{item.desc}</span>
                  </span>
                  <input
                    type="checkbox"
                    checked={Boolean(state.settings[item.key])}
                    onChange={(e) => updateSettings({ [item.key]: e.target.checked })}
                    className="w-5 h-5 accent-[#1C1C1E] shrink-0 cursor-pointer"
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
                  <span className="text-[13px] text-[#636366]">Erase all data and restore the demo?</span>
                  <button
                    type="button"
                    onClick={() => {
                      resetDemoVault();
                      setConfirmReset(false);
                    }}
                    className="inline-flex items-center justify-center h-10 px-5 rounded-full bg-[#FF453A]/15 text-[#D70015] text-[14px] font-medium cursor-pointer"
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
                  className="inline-flex items-center justify-center h-10 px-5 rounded-full bg-[#FF453A]/15 text-[#D70015] text-[14px] font-medium cursor-pointer"
                >
                  Reset demo data
                </button>
              )}
            </div>
          </section>

          <details className="bento-pod p-5 sm:p-6 group">
            <summary className="text-[17px] font-semibold cursor-pointer min-h-[44px] flex items-center justify-between list-none">
              Advanced: cloud connection
              <span className="text-[13px] font-normal text-[#636366]">
                {state.awsConfig.enabled ? 'Connected' : 'Not connected'}
              </span>
            </summary>
            <form onSubmit={handleSaveAwsConfig} className="space-y-4 mt-4">
              <p className="text-[13px] text-[#636366]">
                Optional. Add cloud credentials to use live cloud services instead of the built-in demo mode.
              </p>
              {syncMessage && (
                <div role="status" className="p-3 rounded-[16px] bg-[#32D74B]/15 text-[#1E8E3E] text-[13px]">
                  {syncMessage}
                </div>
              )}
              <div>
                <label htmlFor="aws-ak" className={labelCls}>Access key ID</label>
                <input id="aws-ak" type="text" autoComplete="off" value={awsAccessKey} onChange={(e) => setAwsAccessKey(e.target.value)} className={inputCls} />
              </div>
              <div>
                <label htmlFor="aws-sk" className={labelCls}>Secret access key</label>
                <input id="aws-sk" type="password" autoComplete="off" value={awsSecretKey} onChange={(e) => setAwsSecretKey(e.target.value)} className={inputCls} />
              </div>
              <div>
                <label htmlFor="aws-st" className={labelCls}>Session token (optional)</label>
                <input id="aws-st" type="password" autoComplete="off" value={awsSessionToken} onChange={(e) => setAwsSessionToken(e.target.value)} className={inputCls} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="aws-rg" className={labelCls}>Region</label>
                  <input id="aws-rg" type="text" value={awsRegion} onChange={(e) => setAwsRegion(e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label htmlFor="aws-s3" className={labelCls}>Storage bucket</label>
                  <input id="aws-s3" type="text" value={s3Bucket} onChange={(e) => setS3Bucket(e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label htmlFor="aws-db" className={labelCls}>Database table</label>
                  <input id="aws-db" type="text" value={dynamoTable} onChange={(e) => setDynamoTable(e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label htmlFor="aws-md" className={labelCls}>AI model ID</label>
                  <input id="aws-md" type="text" value={bedrockModel} onChange={(e) => setBedrockModel(e.target.value)} className={inputCls} />
                </div>
              </div>
              <button type="submit" className={primaryBtn}>Save and test connection</button>
            </form>
          </details>
        </div>
      </div>
    </div>
  );
}
