'use client';

import React, { useState, useMemo, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useFinShield } from '@/context/FinShieldContext';
import { PageHeader, DynamicQrSvg, InsetGroupedList } from '@/components/primitives';
import {
  buildUpiUri,
  buildWhatsAppSplitLink,
  formatINR,
} from '@/lib/finance-engine';

interface SplitMember {
  id: string;
  name: string;
  phone: string;
  vpa: string;
  customShare: number;
  selected: boolean;
}

const INPUT =
  'w-full h-11 px-4 rounded-2xl bg-white text-[14px] text-[#1C1C1E] outline-none focus:ring-2 focus:ring-[#1C1C1E]';
const LABEL = 'text-[13px] text-[#636366] block mb-1.5';
const PRIMARY_BTN =
  'inline-flex items-center justify-center h-11 sm:h-10 px-5 rounded-full bg-[#1C1C1E] text-white text-[14px] font-medium cursor-pointer';
const SECONDARY_BTN =
  'inline-flex items-center justify-center h-11 sm:h-10 px-5 rounded-full bg-[#F5F5F7] hover:bg-[#EBEBED] text-[#1C1C1E] text-[14px] font-medium cursor-pointer';

export default function UpiSplitAndCollectionsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-[14px] text-[#636366]">Loading…</div>}>
      <UpiSplitAndCollectionsContent />
    </Suspense>
  );
}

function UpiSplitAndCollectionsContent() {
  const searchParams = useSearchParams();
  const {
    state,
    addPendingCollection,
    markCollectionSettled,
    sendCollectionReminder,
  } = useFinShield();

  const [merchant, setMerchant] = useState<string>('Church Street Social');
  const [totalBill, setTotalBill] = useState<number>(4250);
  const [invoiceRef, setInvoiceRef] = useState<string>('INV-88412');
  const [receiverVpa, setReceiverVpa] = useState<string>(state.profile.upiVpa || 'arjun@okicici');
  const [receiverName] = useState<string>(state.profile.name || 'Arjun Mehta');
  const [splitMode, setSplitMode] = useState<'equal' | 'exact'>('equal');
  const [budgetProtectionShield, setBudgetProtectionShield] = useState<boolean>(true);
  const [activeFriendPreviewId, setActiveFriendPreviewId] = useState<string>('m1');
  const [copiedUri, setCopiedUri] = useState<boolean>(false);

  useEffect(() => {
    const qMerchant = searchParams.get('merchant');
    const qAmount = searchParams.get('amount');
    const qMode = searchParams.get('mode');
    const qInvoice = searchParams.get('invoice');
    if (qMerchant) setMerchant(qMerchant);
    if (qAmount && !Number.isNaN(Number(qAmount))) setTotalBill(Number(qAmount));
    if (qMode === 'exact' || qMode === 'ocr') setSplitMode('exact');
    if (qMode === 'equal') setSplitMode('equal');
    if (qInvoice) setInvoiceRef(qInvoice);
  }, [searchParams]);

  const [members, setMembers] = useState<SplitMember[]>([
    {
      id: 'm1',
      name: 'Rohan Kulkarni',
      phone: '919845011223',
      vpa: 'rohan.k@okaxis',
      customShare: 1417,
      selected: true,
    },
    {
      id: 'm2',
      name: 'Priya Nair',
      phone: '919880144556',
      vpa: 'priya.nair@okhdfcbank',
      customShare: 1417,
      selected: true,
    },
    {
      id: 'm3',
      name: 'Vikram Singh',
      phone: '919740088991',
      vpa: 'vikram.s@ybl',
      customShare: 850,
      selected: false,
    },
  ]);

  const [newFriendName, setNewFriendName] = useState('');
  const [newFriendPhone, setNewFriendPhone] = useState('');
  const [newFriendVpa, setNewFriendVpa] = useState('');

  const selectedFriends = useMemo(() => members.filter((m) => m.selected), [members]);
  const totalParticipants = selectedFriends.length + 1;
  const equalPerPersonAmount = useMemo(
    () => Math.round((totalBill / Math.max(1, totalParticipants)) * 100) / 100,
    [totalBill, totalParticipants]
  );

  const getFriendShare = (m: SplitMember) =>
    splitMode === 'equal' ? equalPerPersonAmount : m.customShare;

  const totalFriendsShare = useMemo(
    () => selectedFriends.reduce((sum, m) => sum + getFriendShare(m), 0),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selectedFriends, splitMode, equalPerPersonAmount]
  );

  const yourNetShare = Math.max(0, totalBill - totalFriendsShare);

  const activePreviewFriend = useMemo(
    () =>
      selectedFriends.find((f) => f.id === activeFriendPreviewId) ||
      selectedFriends[0] ||
      members[0],
    [selectedFriends, activeFriendPreviewId, members]
  );

  const activePreviewShare = activePreviewFriend
    ? getFriendShare(activePreviewFriend)
    : equalPerPersonAmount;

  const upiUri = useMemo(
    () =>
      buildUpiUri({
        pa: receiverVpa,
        pn: receiverName,
        am: activePreviewShare,
        cu: 'INR',
        tn: `Split ${merchant} (${invoiceRef})`,
        tr: invoiceRef,
      }),
    [receiverVpa, receiverName, activePreviewShare, merchant, invoiceRef]
  );

  const handleToggleMember = (id: string) => {
    setMembers((prev) =>
      prev.map((m) => (m.id === id ? { ...m, selected: !m.selected } : m))
    );
  };

  const handleCustomShareChange = (id: string, val: number) => {
    setMembers((prev) =>
      prev.map((m) => (m.id === id ? { ...m, customShare: Math.max(0, val) } : m))
    );
  };

  const handleAddFriend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFriendName.trim()) return;
    const newId = `m-${Date.now()}`;
    setMembers((prev) => [
      ...prev,
      {
        id: newId,
        name: newFriendName.trim(),
        phone: newFriendPhone.trim() || '919800000000',
        vpa:
          newFriendVpa.trim() ||
          `${newFriendName.toLowerCase().replace(/\s+/g, '.')}@okicici`,
        customShare: equalPerPersonAmount,
        selected: true,
      },
    ]);
    setNewFriendName('');
    setNewFriendPhone('');
    setNewFriendVpa('');
  };

  const handleLogAllSplitsToTracker = () => {
    selectedFriends.forEach((friend) => {
      const share = getFriendShare(friend);
      addPendingCollection({
        friendName: friend.name,
        friendPhone: friend.phone,
        friendUpiId: friend.vpa,
        merchant,
        category: 'Dining Out',
        totalBill,
        amountOwed: share,
        dueDate: 'Due in 3 days',
        upiUri: buildUpiUri({
          pa: receiverVpa,
          pn: receiverName,
          am: share,
          cu: 'INR',
          tn: `Split ${merchant}`,
        }),
        protectBudgetCap: budgetProtectionShield,
      });
    });
  };

  const handleCopyUri = async () => {
    try {
      await navigator.clipboard.writeText(upiUri);
      setCopiedUri(true);
      setTimeout(() => setCopiedUri(false), 2000);
    } catch {
      setCopiedUri(true);
    }
  };

  const outstanding = state.pendingCollections
    .filter((c) => c.status !== 'SETTLED')
    .reduce((s, c) => s + (c.amountOwed - c.amountPaid), 0);

  return (
    <div className="space-y-8 pb-12">
      <PageHeader title="Split a bill" />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Bill & people */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bento-pod p-6 space-y-5">
            <h2 className="text-[17px] font-semibold">Bill details</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="split-merchant" className={LABEL}>
                  Merchant or description
                </label>
                <input
                  id="split-merchant"
                  type="text"
                  value={merchant}
                  onChange={(e) => setMerchant(e.target.value)}
                  className={INPUT}
                />
              </div>

              <div>
                <label htmlFor="split-total" className={LABEL}>
                  Total bill (INR)
                </label>
                <input
                  id="split-total"
                  type="number"
                  min={1}
                  value={totalBill}
                  onChange={(e) => setTotalBill(Math.max(1, Number(e.target.value)))}
                  className={`${INPUT} tabular-nums font-medium`}
                />
              </div>

              <div>
                <label htmlFor="split-vpa" className={LABEL}>
                  Your UPI ID
                </label>
                <input
                  id="split-vpa"
                  type="text"
                  value={receiverVpa}
                  onChange={(e) => setReceiverVpa(e.target.value)}
                  className={INPUT}
                />
              </div>

              <div>
                <span className={LABEL}>Split method</span>
                <div className="inline-flex bg-white p-1 rounded-full h-11 items-center">
                  <button
                    type="button"
                    aria-pressed={splitMode === 'equal'}
                    onClick={() => setSplitMode('equal')}
                    className={`h-9 px-4 rounded-full text-[13px] font-medium cursor-pointer ${
                      splitMode === 'equal' ? 'bg-[#1C1C1E] text-white' : 'text-[#636366]'
                    }`}
                  >
                    Equal
                  </button>
                  <button
                    type="button"
                    aria-pressed={splitMode === 'exact'}
                    onClick={() => setSplitMode('exact')}
                    className={`h-9 px-4 rounded-full text-[13px] font-medium cursor-pointer ${
                      splitMode === 'exact' ? 'bg-[#1C1C1E] text-white' : 'text-[#636366]'
                    }`}
                  >
                    Custom amounts
                  </button>
                </div>
              </div>
            </div>

            <label className="flex items-center justify-between gap-4 pt-2 cursor-pointer">
              <div>
                <div className="text-[14px] font-medium text-[#1C1C1E]">
                  Count only my share toward budget
                </div>
                <div className="text-[13px] text-[#636366]">
                  Your share: {formatINR(yourNetShare)} · Friends owe: {formatINR(totalFriendsShare)}
                </div>
              </div>
              <input
                type="checkbox"
                checked={budgetProtectionShield}
                onChange={(e) => setBudgetProtectionShield(e.target.checked)}
                className="w-5 h-5 accent-[#1C1C1E]"
              />
            </label>
          </div>

          <div className="bento-pod p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-[17px] font-semibold">People</h2>
              <span className="text-[13px] text-[#636366]">
                You + {selectedFriends.length} selected
              </span>
            </div>

            <div className="space-y-2">
              {members.map((m) => {
                const share = getFriendShare(m);
                const waUrl = buildWhatsAppSplitLink({
                  friendName: m.name,
                  phone: m.phone,
                  merchant,
                  shareAmount: share,
                  totalAmount: totalBill,
                  upiVpa: receiverVpa,
                });

                return (
                  <div
                    key={m.id}
                    className="p-4 rounded-2xl bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={m.selected}
                        onChange={() => handleToggleMember(m.id)}
                        className="w-4 h-4 accent-[#1C1C1E]"
                      />
                      <div>
                        <div className="text-[15px] font-medium text-[#1C1C1E]">{m.name}</div>
                        <div className="text-[13px] text-[#636366]">{m.vpa}</div>
                      </div>
                    </label>

                    {m.selected && (
                      <div className="flex items-center gap-2">
                        {splitMode === 'exact' ? (
                          <input
                            type="number"
                            aria-label={`${m.name} share in INR`}
                            value={m.customShare}
                            onChange={(e) =>
                              handleCustomShareChange(m.id, Number(e.target.value))
                            }
                            className="w-24 h-9 px-3 rounded-xl bg-[#F5F5F7] text-[14px] font-medium tabular-nums text-right"
                          />
                        ) : (
                          <span className="text-[15px] font-semibold tabular-nums px-2">
                            {formatINR(share)}
                          </span>
                        )}

                        <button
                          type="button"
                          onClick={() => setActiveFriendPreviewId(m.id)}
                          className={`h-9 px-3 rounded-full text-[13px] font-medium cursor-pointer ${
                            activePreviewFriend?.id === m.id
                              ? 'bg-[#1C1C1E] text-white'
                              : 'bg-[#F5F5F7] text-[#1C1C1E]'
                          }`}
                        >
                          Show QR
                        </button>

                        <a
                          href={waUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="h-9 px-3 rounded-full bg-[#F5F5F7] text-[#1C1C1E] text-[13px] font-medium inline-flex items-center"
                        >
                          WhatsApp
                        </a>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <form onSubmit={handleAddFriend} className="grid grid-cols-1 sm:grid-cols-4 gap-2 pt-2">
              <input
                type="text"
                aria-label="Friend name"
                placeholder="Name"
                value={newFriendName}
                onChange={(e) => setNewFriendName(e.target.value)}
                className={INPUT}
              />
              <input
                type="tel"
                aria-label="WhatsApp phone"
                placeholder="Phone"
                value={newFriendPhone}
                onChange={(e) => setNewFriendPhone(e.target.value)}
                className={INPUT}
              />
              <input
                type="text"
                aria-label="Friend UPI ID"
                placeholder="UPI ID (optional)"
                value={newFriendVpa}
                onChange={(e) => setNewFriendVpa(e.target.value)}
                className={INPUT}
              />
              <button type="submit" className={SECONDARY_BTN}>
                Add person
              </button>
            </form>

            <div className="pt-2">
              <button
                type="button"
                onClick={handleLogAllSplitsToTracker}
                className={`${PRIMARY_BTN} w-full`}
              >
                Save split ({selectedFriends.length} {selectedFriends.length === 1 ? 'person' : 'people'})
              </button>
            </div>
          </div>
        </div>

        {/* Right: QR code */}
        <div className="lg:col-span-5 bento-pod p-6 space-y-5">
          <div>
            <div className="text-[13px] text-[#636366]">Payment request for</div>
            <h2 className="text-[20px] font-semibold">
              {activePreviewFriend?.name || 'Friend'} · {formatINR(activePreviewShare)}
            </h2>
          </div>

          <div className="p-6 rounded-2xl bg-white flex flex-col items-center text-center space-y-3">
            <DynamicQrSvg value={upiUri} size={200} centerBadge="UPI" />
            <div className="text-[13px] text-[#636366]">
              Pay to {receiverVpa}
            </div>
          </div>

          <button type="button" onClick={handleCopyUri} className={`${SECONDARY_BTN} w-full bg-white`}>
            {copiedUri ? 'Copied payment link' : 'Copy payment link'}
          </button>

          <details className="text-[13px] text-[#636366]">
            <summary className="cursor-pointer select-none">Show payment link</summary>
            <p className="mt-2 p-3 rounded-xl bg-white font-mono text-[12px] text-[#1C1C1E] break-all">
              {upiUri}
            </p>
          </details>
        </div>
      </div>

      {/* People who owe you */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-[17px] font-semibold">People who owe you</h2>
          <span className="text-[13px] text-[#636366] tabular-nums">
            {formatINR(outstanding)} outstanding
          </span>
        </div>

        <InsetGroupedList
          items={state.pendingCollections.map((col) => {
            const remaining = Math.max(0, col.amountOwed - col.amountPaid);
            return {
              id: col.id,
              title: col.friendName,
              subtitle: `${col.merchant} · ${col.dueDate}`,
              amountText: col.status === 'SETTLED' ? 'Settled' : formatINR(remaining),
              tone: col.status === 'SETTLED' ? 'positive' : 'default',
              rightSlot:
                col.status !== 'SETTLED' ? (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => sendCollectionReminder(col.id)}
                      className="h-9 px-3 rounded-full bg-white text-[13px] font-medium text-[#1C1C1E] cursor-pointer"
                    >
                      Remind
                    </button>
                    <button
                      type="button"
                      onClick={() => markCollectionSettled(col.id)}
                      className="h-9 px-3 rounded-full bg-[#1C1C1E] text-white text-[13px] font-medium cursor-pointer"
                    >
                      Mark paid
                    </button>
                  </div>
                ) : null,
            };
          })}
        />
      </div>
    </div>
  );
}
