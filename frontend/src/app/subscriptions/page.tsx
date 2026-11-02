'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useFinShield } from '@/context/FinShieldContext';
import { PageHeader, UniversalSheetModal } from '@/components/primitives';
import { formatINR } from '@/lib/finance-engine';

type UtilityType =
  | 'Electricity'
  | 'Broadband / Wi-Fi'
  | 'Piped Gas'
  | 'Water Board'
  | 'Rent & Maintenance';

const FIELD =
  'w-full h-11 px-4 rounded-2xl bg-[#F5F5F7] text-[14px] text-[#1C1C1E] tabular-nums focus:outline-none focus:ring-2 focus:ring-[#1C1C1E]';
const PRIMARY =
  'inline-flex items-center justify-center h-11 sm:h-10 px-5 rounded-full bg-[#1C1C1E] text-white text-[14px] font-medium cursor-pointer';
const SECONDARY =
  'inline-flex items-center justify-center h-11 sm:h-10 px-5 rounded-full bg-[#F5F5F7] hover:bg-[#EBEBED] text-[#1C1C1E] text-[14px] font-medium cursor-pointer';

export default function SubscriptionsPage() {
  const router = useRouter();
  const { state, toggleSubscriptionPause, addSubscription, payUtilityBill, addUtilityBill } =
    useFinShield();

  const [activeTab, setActiveTab] = useState<'subscriptions' | 'utilities'>('subscriptions');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const [newName, setNewName] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newConsumerId, setNewConsumerId] = useState('');
  const [newUtilityType, setNewUtilityType] = useState<UtilityType>('Electricity');

  const activeSubs = state.subscriptions.filter((s) => s.status === 'ACTIVE');
  const monthlySubsTotal = activeSubs.reduce((acc, s) => acc + s.amount, 0);

  const unpaidUtilities = state.utilityBills.filter((u) => u.status !== 'PAID');
  const totalUnpaidUtilities = unpaidUtilities.reduce((acc, u) => acc + u.amount, 0);

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = Math.max(49, Number(newAmount) || 499);
    if (activeTab === 'subscriptions') {
      addSubscription({
        name: newName.trim() || 'New subscription',
        category: 'AI & Developer Tools',
        amount: amt,
        billingCycle: 'Monthly',
        nextRenewalDate: '18 Nov 2026',
        renewalDay: 18,
        paymentMethod: 'HDFC Millennia ••4821',
        status: 'ACTIVE',
        usageNote: 'Active daily usage',
        icon: 'smart_toy',
      });
    } else {
      addUtilityBill({
        provider: newName.trim() || 'New bill',
        utilityType: newUtilityType,
        consumerId: newConsumerId.trim() || 'CON-88210',
        billingMonth: 'Oct–Nov 2026',
        amount: amt,
        previousAmount: Math.round(amt * 0.94),
        dueDate: '15 Nov 2026',
        status: 'DUE_SOON',
        autopay: false,
        splittableWithFlatmates: true,
        icon: 'bolt',
      });
    }
    setNewName('');
    setNewAmount('');
    setNewConsumerId('');
    setIsAddModalOpen(false);
  };

  const isSubs = activeTab === 'subscriptions';

  return (
    <div className="pb-12">
      <PageHeader
        title="Subscriptions & bills"
        action={
          <button type="button" onClick={() => setIsAddModalOpen(true)} className={PRIMARY}>
            {isSubs ? 'Add subscription' : 'Add bill'}
          </button>
        }
      />

      <div className="space-y-6">
        <div className="inline-flex bg-[#F5F5F7] p-1 rounded-full" role="group" aria-label="Section">
          {(['subscriptions', 'utilities'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setActiveTab(t)}
              aria-pressed={activeTab === t}
              className={`h-11 sm:h-9 px-5 rounded-full text-[14px] font-medium cursor-pointer ${
                activeTab === t ? 'bg-[#1C1C1E] text-white' : 'text-[#636366]'
              }`}
            >
              {t === 'subscriptions' ? 'Subscriptions' : 'Bills'}
            </button>
          ))}
        </div>

        {isSubs ? (
          <>
            <section className="bento-pod p-6">
              <p className="text-[13px] text-[#636366]">Monthly subscriptions</p>
              <p className="text-[40px] leading-[46px] font-semibold tracking-[-0.02em] tabular-nums mt-1">
                {formatINR(monthlySubsTotal)}
              </p>
              <p className="text-[13px] text-[#636366] mt-2">{activeSubs.length} active</p>
            </section>

            {state.subscriptions.length === 0 ? (
              <div className="bento-pod p-10 text-center">
                <p className="text-[15px] text-[#636366]">No subscriptions yet.</p>
                <button type="button" onClick={() => setIsAddModalOpen(true)} className={`${PRIMARY} mt-4`}>
                  Add subscription
                </button>
              </div>
            ) : (
              <div className="bento-pod overflow-hidden divide-y divide-black/[0.06]">
                {state.subscriptions.map((sub) => {
                  const isPaused = sub.status === 'PAUSED';
                  return (
                    <div
                      key={sub.id}
                      className="px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p
                            className={`text-[15px] font-medium ${
                              isPaused ? 'text-[#8E8E93]' : 'text-[#1C1C1E]'
                            }`}
                          >
                            {sub.name}
                          </p>
                          {sub.priceHikeAlert && (
                            <span className="px-2.5 py-0.5 rounded-full text-[12px] font-medium bg-[#FF9F0A]/15 text-[#B25000]">
                              {sub.priceHikeAlert}
                            </span>
                          )}
                        </div>
                        <p className="text-[13px] text-[#636366]">
                          {isPaused ? 'Paused' : `Renews ${sub.nextRenewalDate}`} · {sub.billingCycle}
                        </p>
                      </div>
                      <div className="flex items-center justify-between sm:justify-end gap-4">
                        <span className="text-[15px] font-medium tabular-nums">
                          {formatINR(sub.amount)}
                          <span className="text-[13px] font-normal text-[#636366]">/mo</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => toggleSubscriptionPause(sub.id)}
                          className={isPaused ? PRIMARY : SECONDARY}
                        >
                          {isPaused ? 'Resume' : 'Pause'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        ) : (
          <>
            <section className="bento-pod p-6">
              <p className="text-[13px] text-[#636366]">Bills to pay</p>
              <p className="text-[40px] leading-[46px] font-semibold tracking-[-0.02em] tabular-nums mt-1">
                {formatINR(totalUnpaidUtilities)}
              </p>
              <div className="flex items-center justify-between gap-3 flex-wrap mt-2">
                <p className="text-[13px] text-[#636366]">
                  {unpaidUtilities.length === 0 ? 'All paid' : `${unpaidUtilities.length} unpaid`}
                </p>
                <button type="button" onClick={() => router.push('/ocr')} className={SECONDARY}>
                  Scan a bill
                </button>
              </div>
            </section>

            {state.utilityBills.length === 0 ? (
              <div className="bento-pod p-10 text-center">
                <p className="text-[15px] text-[#636366]">No bills yet.</p>
                <button type="button" onClick={() => setIsAddModalOpen(true)} className={`${PRIMARY} mt-4`}>
                  Add bill
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {state.utilityBills.map((bill) => {
                  const delta = bill.amount - bill.previousAmount;
                  const deltaPct =
                    bill.previousAmount > 0 ? Math.round((delta / bill.previousAmount) * 100) : 0;
                  const isPaid = bill.status === 'PAID';
                  return (
                    <div key={bill.id} className="bento-pod p-5 flex flex-col gap-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="text-[15px] font-medium text-[#1C1C1E]">{bill.provider}</h3>
                          <p className="text-[13px] text-[#636366]">{bill.utilityType}</p>
                        </div>
                        {!isPaid && (
                          <span className="px-2.5 py-0.5 rounded-full text-[12px] font-medium bg-[#FF9F0A]/15 text-[#B25000] whitespace-nowrap">
                            Due {bill.dueDate}
                          </span>
                        )}
                      </div>
                      <div>
                        <p className="text-[24px] leading-[30px] font-semibold tabular-nums">
                          {formatINR(bill.amount)}
                        </p>
                        <p className="text-[13px] text-[#636366] tabular-nums">
                          {isPaid ? 'Paid · ' : ''}
                          {delta === 0
                            ? 'Same as last month'
                            : `${delta > 0 ? '+' : '−'}${Math.abs(deltaPct)}% vs last month`}
                        </p>
                      </div>
                      {(bill.splittableWithFlatmates || !isPaid) && (
                        <div className="flex flex-col sm:flex-row gap-2 mt-auto">
                          {bill.splittableWithFlatmates && (
                            <button
                              type="button"
                              onClick={() =>
                                router.push(
                                  `/split?merchant=${encodeURIComponent(
                                    bill.provider
                                  )}&amount=${bill.amount}&invoice=${encodeURIComponent(
                                    bill.consumerId
                                  )}`
                                )
                              }
                              className={`${SECONDARY} flex-1`}
                            >
                              Split
                            </button>
                          )}
                          {!isPaid && (
                            <button
                              type="button"
                              onClick={() => payUtilityBill(bill.id)}
                              className={`${PRIMARY} flex-1`}
                            >
                              Pay now
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      <UniversalSheetModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title={isSubs ? 'Add subscription' : 'Add bill'}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleAddSubmit} className="space-y-4">
          <div>
            <label htmlFor="sub-name" className="text-[13px] text-[#636366] block mb-1.5">
              {isSubs ? 'Name' : 'Provider'}
            </label>
            <input
              id="sub-name"
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder={isSubs ? 'e.g. Netflix' : 'e.g. ACT Fibernet'}
              className={FIELD}
            />
          </div>

          {!isSubs && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="bill-type" className="text-[13px] text-[#636366] block mb-1.5">
                  Type
                </label>
                <select
                  id="bill-type"
                  value={newUtilityType}
                  onChange={(e) => setNewUtilityType(e.target.value as UtilityType)}
                  className={FIELD}
                >
                  <option value="Electricity">Electricity</option>
                  <option value="Broadband / Wi-Fi">Broadband / Wi-Fi</option>
                  <option value="Piped Gas">Piped Gas</option>
                  <option value="Water Board">Water</option>
                  <option value="Rent & Maintenance">Rent & Maintenance</option>
                </select>
              </div>
              <div>
                <label htmlFor="bill-consumer" className="text-[13px] text-[#636366] block mb-1.5">
                  Account number
                </label>
                <input
                  id="bill-consumer"
                  type="text"
                  value={newConsumerId}
                  onChange={(e) => setNewConsumerId(e.target.value)}
                  className={FIELD}
                />
              </div>
            </div>
          )}

          <div>
            <label htmlFor="sub-amount" className="text-[13px] text-[#636366] block mb-1.5">
              Amount (₹)
            </label>
            <input
              id="sub-amount"
              type="number"
              inputMode="numeric"
              value={newAmount}
              onChange={(e) => setNewAmount(e.target.value)}
              placeholder="499"
              className={FIELD}
            />
          </div>

          <button type="submit" className={`${PRIMARY} w-full`}>
            Save
          </button>
        </form>
      </UniversalSheetModal>
    </div>
  );
}
