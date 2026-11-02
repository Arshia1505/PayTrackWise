'use client';

import React, { useState, useMemo } from 'react';
import { useFinShield } from '@/context/FinShieldContext';
import {
  PageHeader,
  DynamicQrSvg,
  InsetGroupedList,
} from '@/components/primitives';
import {
  CRYPTO_TOKENS,
  buildCryptoPaymentUri,
  convertInrToCrypto,
  formatINR,
} from '@/lib/finance-engine';

interface PeerContact {
  id: string;
  name: string;
  snsHandle: string;
  solanaAddress: string;
  defaultInr: number;
}

const PEER_CONTACTS: PeerContact[] = [
  {
    id: 'peer-1',
    name: 'Rohan Kulkarni',
    snsHandle: 'rohan.sol',
    solanaAddress: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
    defaultInr: 1417,
  },
  {
    id: 'peer-2',
    name: 'Priya Nair',
    snsHandle: 'priya.sol',
    solanaAddress: '9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin',
    defaultInr: 1630,
  },
  {
    id: 'peer-3',
    name: 'Vikram Singh',
    snsHandle: 'vikram.sol',
    solanaAddress: '3yMK9YpL7vWq2R8xN4tZc5bH6jK1mP9sD4fG7hJ2kL4',
    defaultInr: 850,
  },
];

const inputCls =
  'w-full h-11 px-4 rounded-[16px] bg-white text-[14px] text-[#1C1C1E] placeholder:text-[#8E8E93] outline-none focus:ring-2 focus:ring-[#1C1C1E]/20';
const labelCls = 'text-[13px] text-[#636366] block mb-1.5';
const primaryBtn =
  'inline-flex items-center justify-center h-10 px-5 rounded-full bg-[#1C1C1E] text-white text-[14px] font-medium cursor-pointer';
const secondaryBtn =
  'inline-flex items-center justify-center h-10 px-5 rounded-full bg-[#F5F5F7] text-[#1C1C1E] text-[14px] font-medium cursor-pointer hover:bg-[#EBEBED]';

export default function CryptoPage() {
  const { state, recordCryptoTransfer } = useFinShield();

  const [selectedSymbol, setSelectedSymbol] = useState<'SOL' | 'USDC' | 'USDT'>('SOL');
  const [selectedPeerId, setSelectedPeerId] = useState<string>('peer-1');
  const [recipientAddress, setRecipientAddress] = useState<string>(PEER_CONTACTS[0].solanaAddress);
  const [recipientName, setRecipientName] = useState<string>('Rohan Kulkarni (rohan.sol)');
  const [amountInr, setAmountInr] = useState<number>(1417);
  const [memoNote, setMemoNote] = useState<string>('Dinner split');
  const [txBroadcastBanner, setTxBroadcastBanner] = useState<string | null>(null);

  const selectedToken = useMemo(
    () => CRYPTO_TOKENS.find((t) => t.symbol === selectedSymbol) || CRYPTO_TOKENS[0],
    [selectedSymbol]
  );

  const handleSelectPeer = (peer: PeerContact) => {
    setSelectedPeerId(peer.id);
    setRecipientAddress(peer.solanaAddress);
    setRecipientName(`${peer.name} (${peer.snsHandle})`);
    setAmountInr(peer.defaultInr);
  };

  const conversion = useMemo(
    () => convertInrToCrypto(amountInr, selectedSymbol),
    [amountInr, selectedSymbol]
  );

  const solanaUri = useMemo(
    () =>
      buildCryptoPaymentUri({
        network: 'solana',
        recipientAddress,
        amountToken: conversion.tokenAmount,
        symbol: selectedSymbol,
        label: 'FinShield',
        message: `${memoNote} (${formatINR(amountInr)})`,
      }),
    [recipientAddress, conversion.tokenAmount, selectedSymbol, memoNote, amountInr]
  );

  const handleRecordPayment = () => {
    recordCryptoTransfer({
      recipientName,
      recipientAddress: `${recipientAddress.slice(0, 4)}...${recipientAddress.slice(-4)}`,
      symbol: selectedSymbol,
      tokenAmount: conversion.tokenAmount,
      inrEquivalent: amountInr,
    });
    setTxBroadcastBanner(
      `Sent ${conversion.tokenAmount} ${selectedSymbol} (${formatINR(amountInr)}) to ${recipientName}.`
    );
    setTimeout(() => setTxBroadcastBanner(null), 5000);
  };

  return (
    <div className="pb-12">
      <PageHeader title="Send crypto" />

      {txBroadcastBanner && (
        <div
          role="status"
          className="mb-6 p-4 rounded-[22px] bg-[#32D74B]/15 text-[#1E8E3E] text-[14px] font-medium"
        >
          {txBroadcastBanner}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        <div className="bento-pod p-5 sm:p-6 space-y-5 min-w-0">
          <div>
            <span className={labelCls}>Contacts</span>
            <div className="flex flex-wrap gap-2">
              {PEER_CONTACTS.map((peer) => {
                const active = selectedPeerId === peer.id;
                return (
                  <button
                    key={peer.id}
                    type="button"
                    aria-pressed={active}
                    onClick={() => handleSelectPeer(peer)}
                    className={`h-10 px-4 rounded-full text-[13px] font-medium cursor-pointer ${
                      active
                        ? 'bg-[#1C1C1E] text-white'
                        : 'bg-white text-[#1C1C1E] hover:bg-[#EBEBED]'
                    }`}
                  >
                    {peer.name}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <span className={labelCls}>Token</span>
            <div className="inline-flex bg-white p-1 rounded-full">
              {CRYPTO_TOKENS.map((tok) => {
                const active = selectedSymbol === tok.symbol;
                return (
                  <button
                    key={tok.symbol}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setSelectedSymbol(tok.symbol)}
                    className={`h-9 px-4 rounded-full text-[13px] font-medium cursor-pointer ${
                      active ? 'bg-[#1C1C1E] text-white' : 'text-[#636366]'
                    }`}
                  >
                    {tok.symbol}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label htmlFor="crypto-recipient" className={labelCls}>
              Recipient name
            </label>
            <input
              id="crypto-recipient"
              type="text"
              value={recipientName}
              onChange={(e) => setRecipientName(e.target.value)}
              className={inputCls}
            />
          </div>

          <div>
            <label htmlFor="crypto-address" className={labelCls}>
              Wallet address
            </label>
            <input
              id="crypto-address"
              type="text"
              value={recipientAddress}
              onChange={(e) => setRecipientAddress(e.target.value)}
              className={`${inputCls} font-mono text-[13px]`}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="crypto-inr" className={labelCls}>
                Amount (INR)
              </label>
              <input
                id="crypto-inr"
                type="number"
                min={10}
                value={amountInr}
                onChange={(e) => setAmountInr(Math.max(1, Number(e.target.value)))}
                className={`${inputCls} tabular-nums font-semibold`}
              />
            </div>
            <div>
              <span className={labelCls}>Amount ({selectedSymbol})</span>
              <div className="h-11 px-4 rounded-[16px] bg-white flex items-center justify-between">
                <span className="text-[14px] font-semibold tabular-nums">
                  {conversion.tokenAmount} {selectedSymbol}
                </span>
                <span className="text-[12px] text-[#636366] tabular-nums">
                  1 {selectedSymbol} = {formatINR(selectedToken.inrRate)}
                </span>
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="crypto-memo" className={labelCls}>
              Note
            </label>
            <input
              id="crypto-memo"
              type="text"
              value={memoNote}
              onChange={(e) => setMemoNote(e.target.value)}
              className={inputCls}
            />
          </div>

          <button type="button" onClick={handleRecordPayment} className={`${primaryBtn} w-full`}>
            Record transfer
          </button>
        </div>

        <div className="bento-pod p-5 sm:p-6 flex flex-col items-center text-center space-y-4 min-w-0">
          <div className="bg-white p-6 rounded-[22px] flex flex-col items-center">
            <DynamicQrSvg value={solanaUri} size={200} centerBadge={selectedSymbol} />
            <div className="mt-4 space-y-0.5">
              <div className="text-[22px] font-semibold tabular-nums">
                {conversion.tokenAmount} {selectedSymbol}
              </div>
              <div className="text-[13px] text-[#636366] tabular-nums">
                {formatINR(amountInr)} · {recipientName}
              </div>
            </div>
          </div>

          <details className="w-full text-left">
            <summary className="text-[13px] text-[#636366] cursor-pointer py-2">
              Show payment link
            </summary>
            <div className="mt-2 p-3 rounded-[16px] bg-white flex items-center justify-between gap-2">
              <code className="text-[12px] font-mono text-[#1C1C1E] truncate">{solanaUri}</code>
              <button
                type="button"
                onClick={() => navigator.clipboard?.writeText(solanaUri)}
                className={`${secondaryBtn} h-8 px-3 text-[12px] shrink-0`}
              >
                Copy
              </button>
            </div>
          </details>
        </div>
      </div>

      {state.cryptoTransfers.length > 0 && (
        <section className="mt-8 space-y-3" aria-labelledby="recent-transfers-h">
          <h2 id="recent-transfers-h" className="text-[17px] font-semibold">
            Recent transfers
          </h2>
          <InsetGroupedList
            items={state.cryptoTransfers.map((tx) => ({
              id: tx.id,
              title: tx.recipientName,
              subtitle: tx.timestamp,
              amountText: `${tx.tokenAmount} ${tx.symbol} (${formatINR(tx.inrEquivalent)})`,
            }))}
          />
        </section>
      )}
    </div>
  );
}
