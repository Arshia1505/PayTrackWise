'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useFinShield } from '@/context/FinShieldContext';
import { PageHeader, DynamicQrSvg, InsetGroupedList } from '@/components/primitives';
import {
  CRYPTO_TOKENS,
  buildCryptoPaymentUri,
  convertInrToCrypto,
  formatINR,
  generateDeterministicTestnetWallet,
  isValidSolanaAddress,
  normalizeCryptHandle,
  resolveCryptHandle,
} from '@/lib/finance-engine';

const inputCls =
  'w-full h-11 px-4 rounded-[16px] bg-white text-[14px] text-[#1C1C1E] placeholder:text-[#8E8E93] outline-none focus:ring-2 focus:ring-[#1C1C1E]/20';
const labelCls = 'text-[13px] text-[#636366] block mb-1.5';
const primaryBtn =
  'inline-flex items-center justify-center h-10 px-5 rounded-full bg-[#1C1C1E] text-white text-[14px] font-medium cursor-pointer disabled:opacity-40';
const secondaryBtn =
  'inline-flex items-center justify-center h-10 px-5 rounded-full bg-[#F5F5F7] text-[#1C1C1E] text-[14px] font-medium cursor-pointer hover:bg-[#EBEBED]';

function shortAddress(address: string) {
  if (address.length < 12) return address;
  return `${address.slice(0, 4)}…${address.slice(-4)}`;
}

export default function CryptoPage() {
  const { state, recordCryptoTransfer, registerOrUpdateCryptUser } = useFinShield();
  const profile = state.profile;

  const [myHandle, setMyHandle] = useState(profile.cryptHandle);
  const [myWallet, setMyWallet] = useState(profile.solanaWallet);
  const [payTo, setPayTo] = useState('');
  const [selectedSymbol, setSelectedSymbol] = useState<'SOL' | 'USDC' | 'USDT'>('SOL');
  const [amountInr, setAmountInr] = useState('');
  const [memoNote, setMemoNote] = useState('');
  const [notice, setNotice] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const ensured = useRef(false);

  useEffect(() => {
    setMyHandle(profile.cryptHandle);
    setMyWallet(profile.solanaWallet);
  }, [profile.cryptHandle, profile.solanaWallet]);

  useEffect(() => {
    if (ensured.current || !profile.email || profile.solanaWallet) return;
    ensured.current = true;
    void registerOrUpdateCryptUser({
      name: profile.name || profile.email,
      email: profile.email,
      upiVpa: profile.upiVpa,
      cryptHandle: profile.cryptHandle || profile.name || profile.email,
      setAsActiveProfile: true,
    });
  }, [
    profile.email,
    profile.solanaWallet,
    profile.name,
    profile.upiVpa,
    profile.cryptHandle,
    registerOrUpdateCryptUser,
  ]);

  const tokens = useMemo(() => Object.values(CRYPTO_TOKENS), []);
  const selectedToken = tokens.find((token) => token.symbol === selectedSymbol) || tokens[0];
  const amount = Math.max(0, Number(amountInr) || 0);
  const conversion = useMemo(
    () => convertInrToCrypto(amount, selectedSymbol),
    [amount, selectedSymbol]
  );

  const contacts = state.cryptDirectory.filter(
    (entry) =>
      entry.email.toLowerCase() !== profile.email.toLowerCase() &&
      entry.handle.toLowerCase() !== profile.cryptHandle.toLowerCase()
  );

  const payee = useMemo(() => {
    const query = payTo.trim();
    if (!query) return null;
    const known = resolveCryptHandle(query, state.cryptDirectory);
    if (known) {
      return { name: known.name, handle: known.handle, address: known.walletAddress, saved: true };
    }
    if (isValidSolanaAddress(query)) {
      return { name: shortAddress(query), handle: '', address: query.trim(), saved: false };
    }
    const handle = normalizeCryptHandle(query);
    if (!handle) return null;
    return {
      name: handle,
      handle,
      address: generateDeterministicTestnetWallet(handle),
      saved: false,
    };
  }, [payTo, state.cryptDirectory]);

  const receiveUri = profile.solanaWallet
    ? buildCryptoPaymentUri({
        symbol: selectedSymbol,
        recipientAddress: profile.solanaWallet,
        recipientHandle: profile.cryptHandle,
        tokenAmount: 0,
        message: `Pay ${profile.cryptHandle || profile.name}`,
      })
    : '';

  const sendUri = payee
    ? buildCryptoPaymentUri({
        symbol: selectedSymbol,
        recipientAddress: payee.address,
        recipientHandle: payee.handle,
        directory: state.cryptDirectory,
        tokenAmount: conversion.tokenAmount,
        memo: memoNote,
        message: memoNote || `Payment to ${payee.name}`,
      })
    : '';

  const saveMyProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const handle = normalizeCryptHandle(myHandle || profile.name || profile.email);
    if (!handle) {
      setProfileError('Enter an id, such as your name.');
      return;
    }
    const pasted = myWallet.trim();
    if (pasted && !isValidSolanaAddress(pasted)) {
      setProfileError('That wallet address is not a Solana address. Leave it blank to create one.');
      return;
    }
    setProfileError(null);
    await registerOrUpdateCryptUser({
      name: profile.name || handle,
      email: profile.email,
      upiVpa: profile.upiVpa,
      cryptHandle: handle,
      solanaWallet: pasted,
      setAsActiveProfile: true,
    });
    setNotice('Your receive address is saved.');
  };

  const saveContact = async () => {
    if (!payee || payee.handle.toLowerCase() === profile.cryptHandle.toLowerCase()) return;
    await registerOrUpdateCryptUser({
      name: payee.name,
      email: '',
      upiVpa: '',
      cryptHandle: payee.handle || payee.name,
      solanaWallet: payee.address,
      setAsActiveProfile: false,
    });
    setNotice(`${payee.name} is saved as a contact.`);
  };

  const recordPayment = () => {
    if (!payee || amount <= 0) return;
    recordCryptoTransfer({
      recipientName: payee.name,
      recipientHandle: payee.handle || undefined,
      recipientAddress: payee.address,
      symbol: selectedSymbol,
      tokenAmount: conversion.tokenAmount,
      inrEquivalent: amount,
      txHash: `local-${Date.now()}`,
      timestamp: 'Just now',
      status: 'CONFIRMED',
    });
    setNotice(`Sent ${conversion.tokenAmount} ${selectedSymbol} to ${payee.name}.`);
    setAmountInr('');
    setMemoNote('');
  };

  return (
    <div className="pb-12">
      <PageHeader title="Crypto" />

      {notice && (
        <div role="status" className="mb-6 p-4 rounded-[22px] bg-[#32D74B]/15 text-[#1E8E3E] text-[14px] font-medium">
          {notice}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        <section className="bento-pod p-5 sm:p-6 space-y-5 min-w-0">
          <div>
            <h2 className="text-[17px] font-semibold">Your address</h2>
            <p className="text-[13px] text-[#636366] mt-1">
              This is where people pay you. Leave the wallet blank and one is created from your id.
            </p>
          </div>
          <form onSubmit={saveMyProfile} className="space-y-4">
            <div>
              <label htmlFor="my-handle" className={labelCls}>Your id</label>
              <input
                id="my-handle"
                type="text"
                value={myHandle}
                onChange={(e) => setMyHandle(e.target.value)}
                placeholder="yourname#crypt"
                className={inputCls}
              />
            </div>
            <div>
              <label htmlFor="my-wallet" className={labelCls}>Your wallet</label>
              <input
                id="my-wallet"
                type="text"
                value={myWallet}
                onChange={(e) => setMyWallet(e.target.value)}
                placeholder="Leave blank to create one"
                className={`${inputCls} font-mono text-[13px]`}
              />
            </div>
            {profileError && <p className="text-[13px] text-[#D70015]">{profileError}</p>}
            <button type="submit" className={primaryBtn}>Save address</button>
          </form>
          {receiveUri && (
            <div className="bg-white p-5 rounded-[22px] flex flex-col items-center text-center">
              <DynamicQrSvg value={receiveUri} size={180} badgeLabel={selectedSymbol} />
              <p className="mt-3 text-[14px] font-medium">{profile.cryptHandle}</p>
              <p className="text-[12px] text-[#636366] font-mono break-all">{profile.solanaWallet}</p>
            </div>
          )}
        </section>

        <section className="bento-pod p-5 sm:p-6 space-y-5 min-w-0">
          <div>
            <h2 className="text-[17px] font-semibold">Send</h2>
            <p className="text-[13px] text-[#636366] mt-1">
              Pay a saved contact, an id, or a wallet address.
            </p>
          </div>

          {contacts.length > 0 && (
            <div>
              <span className={labelCls}>Contacts</span>
              <div className="flex flex-wrap gap-2">
                {contacts.map((contact) => {
                  const active = payee?.handle === contact.handle;
                  return (
                    <button
                      key={contact.id}
                      type="button"
                      aria-pressed={active}
                      onClick={() => setPayTo(contact.handle)}
                      className={`h-10 px-4 rounded-full text-[13px] font-medium cursor-pointer ${
                        active ? 'bg-[#1C1C1E] text-white' : 'bg-white text-[#1C1C1E] hover:bg-[#EBEBED]'
                      }`}
                    >
                      {contact.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div>
            <label htmlFor="pay-to" className={labelCls}>Pay to</label>
            <input
              id="pay-to"
              type="text"
              value={payTo}
              onChange={(e) => setPayTo(e.target.value)}
              placeholder="name#crypt or a wallet address"
              className={inputCls}
            />
            {payee && (
              <p className="text-[12px] text-[#636366] mt-2 font-mono break-all">
                {payee.name} · {payee.address}
              </p>
            )}
          </div>

          <div>
            <span className={labelCls}>Token</span>
            <div className="inline-flex bg-white p-1 rounded-full">
              {tokens.map((token) => {
                const active = selectedSymbol === token.symbol;
                return (
                  <button
                    key={token.symbol}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setSelectedSymbol(token.symbol)}
                    className={`h-9 px-4 rounded-full text-[13px] font-medium cursor-pointer ${
                      active ? 'bg-[#1C1C1E] text-white' : 'text-[#636366]'
                    }`}
                  >
                    {token.symbol}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="crypto-inr" className={labelCls}>Amount (INR)</label>
              <input
                id="crypto-inr"
                type="number"
                min={1}
                value={amountInr}
                onChange={(e) => setAmountInr(e.target.value)}
                placeholder="0"
                className={`${inputCls} tabular-nums font-semibold`}
              />
            </div>
            <div>
              <span className={labelCls}>Amount ({selectedSymbol})</span>
              <div className="h-11 px-4 rounded-[16px] bg-white flex items-center justify-between">
                <span className="text-[14px] font-semibold tabular-nums">
                  {amount > 0 ? `${conversion.tokenAmount} ${selectedSymbol}` : '—'}
                </span>
                <span className="text-[12px] text-[#636366] tabular-nums">
                  1 {selectedSymbol} = {formatINR(selectedToken.inrRate)}
                </span>
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="crypto-memo" className={labelCls}>Note</label>
            <input
              id="crypto-memo"
              type="text"
              value={memoNote}
              onChange={(e) => setMemoNote(e.target.value)}
              placeholder="What this payment is for"
              className={inputCls}
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={recordPayment} disabled={!payee || amount <= 0} className={primaryBtn}>
              Record transfer
            </button>
            {payee && !payee.saved && (
              <button type="button" onClick={saveContact} className={secondaryBtn}>
                Save contact
              </button>
            )}
          </div>

          {sendUri && (
            <div className="bg-white p-5 rounded-[22px] flex flex-col items-center text-center">
              <DynamicQrSvg value={sendUri} size={180} badgeLabel={selectedSymbol} />
              <p className="mt-3 text-[14px] font-medium tabular-nums">
                {amount > 0 ? `${conversion.tokenAmount} ${selectedSymbol}` : 'Payment link'}
              </p>
              <button
                type="button"
                onClick={() => navigator.clipboard?.writeText(sendUri)}
                className={`${secondaryBtn} mt-3 h-8 px-3 text-[12px]`}
              >
                Copy payment link
              </button>
            </div>
          )}
        </section>
      </div>

      {state.cryptoTransfers.length > 0 && (
        <section className="mt-8 space-y-3" aria-labelledby="recent-transfers-h">
          <h2 id="recent-transfers-h" className="text-[17px] font-semibold">Recent transfers</h2>
          <InsetGroupedList>
            {state.cryptoTransfers.map((tx) => (
              <div key={tx.id} className="px-5 py-3.5 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-[15px] font-medium truncate">{tx.recipientName}</p>
                  <p className="text-[13px] text-[#636366] truncate">
                    {tx.recipientHandle || shortAddress(tx.recipientAddress)} · {tx.timestamp}
                  </p>
                </div>
                <p className="text-[15px] font-medium tabular-nums shrink-0">
                  {tx.tokenAmount} {tx.symbol}
                </p>
              </div>
            ))}
          </InsetGroupedList>
        </section>
      )}
    </div>
  );
}
