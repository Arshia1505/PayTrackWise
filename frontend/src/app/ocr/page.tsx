'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useFinShield } from '@/context/FinShieldContext';
import { PageHeader } from '@/components/primitives';
import { formatINR } from '@/lib/finance-engine';

interface OcrLineItem {
  id: string;
  description: string;
  qty: number;
  amount: number;
  confidence: number;
}

const SAMPLE_RECEIPTS = {
  grocery: {
    label: 'Groceries',
    fileName: 'reliance-fresh-pos.jpg',
    merchant: 'Reliance Fresh Supermarket',
    invoiceNumber: 'INV-BLR-88412',
    date: '02 Nov 2026',
    category: 'Groceries',
    gstin: '29AAACR5055K1Z7',
    taxAmount: 198,
    confidence: 98.4,
    items: [
      { id: '1', description: 'Organic Alphonso Mangoes (1.5kg)', qty: 1, amount: 680, confidence: 99.1 },
      { id: '2', description: 'Artisanal Sourdough & Dairy Pack', qty: 2, amount: 540, confidence: 98.7 },
      { id: '3', description: 'Cold Pressed Olive Oil (1L)', qty: 1, amount: 1150, confidence: 97.2 },
      { id: '4', description: 'Household Essentials & Filter Coffee', qty: 1, amount: 882, confidence: 98.9 },
    ],
  },
  utility: {
    label: 'Electricity bill',
    fileName: 'bescom-electricity-bill.jpg',
    merchant: 'BESCOM Electricity Board',
    invoiceNumber: 'BLR-BES-449102881',
    date: '01 Nov 2026',
    category: 'Utilities & Rent',
    gstin: '29AACCB1928L1Z2',
    taxAmount: 162,
    confidence: 99.1,
    items: [
      { id: 'u1', description: 'Fixed Sanctioned Load Charge (5 kW)', qty: 1, amount: 550, confidence: 99.4 },
      { id: 'u2', description: 'Energy Consumption Charges (384 kWh)', qty: 384, amount: 2548, confidence: 98.9 },
      { id: 'u3', description: 'Fuel Adjustment & Electricity Duty', qty: 1, amount: 160, confidence: 98.5 },
    ],
  },
  dining: {
    label: 'Dinner bill',
    fileName: 'church-street-social-dinner.jpg',
    merchant: 'Church Street Social',
    invoiceNumber: 'SOC-BLR-10944',
    date: '02 Nov 2026',
    category: 'Dining Out',
    gstin: '29AABCI4912F1Z9',
    taxAmount: 380,
    confidence: 97.6,
    items: [
      { id: 'd1', description: 'Truffle Mushroom Flatbread & Mezze', qty: 2, amount: 1480, confidence: 98.8 },
      { id: 'd2', description: 'Korean Gochujang Bao Platter', qty: 2, amount: 1260, confidence: 97.9 },
      { id: 'd3', description: 'Artisanal Cold Brew & Mocktails (x4)', qty: 4, amount: 1130, confidence: 94.2 },
    ],
  },
};

const INPUT =
  'w-full h-11 px-4 rounded-2xl bg-white text-[14px] text-[#1C1C1E] outline-none focus:ring-2 focus:ring-[#1C1C1E]';
const LABEL = 'text-[13px] text-[#636366] block mb-1.5';

export default function OcrBillScannerPage() {
  const router = useRouter();
  const { state, addTransaction } = useFinShield();

  const [presetKey, setPresetKey] = useState<'grocery' | 'utility' | 'dining'>('grocery');
  const [merchant, setMerchant] = useState(SAMPLE_RECEIPTS.grocery.merchant);
  const [invoiceNumber, setInvoiceNumber] = useState(SAMPLE_RECEIPTS.grocery.invoiceNumber);
  const [billDate, setBillDate] = useState(SAMPLE_RECEIPTS.grocery.date);
  const [category, setCategory] = useState(SAMPLE_RECEIPTS.grocery.category);
  const [taxAmount, setTaxAmount] = useState(SAMPLE_RECEIPTS.grocery.taxAmount);
  const [items, setItems] = useState<OcrLineItem[]>(SAMPLE_RECEIPTS.grocery.items);
  const [scanning, setScanning] = useState(false);
  const [savedNotice, setSavedNotice] = useState<string | null>(null);

  const subtotal = items.reduce((acc, item) => acc + item.amount, 0);
  const grandTotal = subtotal + taxAmount;

  const loadPreset = async (key: 'grocery' | 'utility' | 'dining') => {
    setPresetKey(key);
    setScanning(true);
    const preset = SAMPLE_RECEIPTS[key];
    try {
      await fetch('/api/ocr/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: preset.fileName,
          awsConfig: state.awsConfig,
        }),
      });
    } catch {
      // Fallback to local preset
    } finally {
      setMerchant(preset.merchant);
      setInvoiceNumber(preset.invoiceNumber);
      setBillDate(preset.date);
      setCategory(preset.category);
      setTaxAmount(preset.taxAmount);
      setItems(preset.items);
      setScanning(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setScanning(true);
    try {
      const res = await fetch('/api/ocr/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: file.name,
          awsConfig: state.awsConfig,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const ext = data.extraction;
        setMerchant(ext.merchant);
        setInvoiceNumber(ext.invoiceNumber);
        setBillDate(ext.date);
        setCategory(ext.category);
        setTaxAmount(ext.taxAmount);
        setItems(
          ext.lineItems.map(
            (
              li: { description: string; qty: number; amount: number; confidence: number },
              idx: number
            ) => ({
              id: `ocr-${idx}`,
              ...li,
            })
          )
        );
      }
    } finally {
      setScanning(false);
    }
  };

  const updateLineItem = (id: string, field: 'description' | 'amount', value: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              [field]: field === 'amount' ? Math.max(0, Number(value) || 0) : value,
            }
          : item
      )
    );
  };

  const handleConfirmSave = () => {
    addTransaction({
      merchant,
      category,
      date: 'Today',
      time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      amount: grandTotal,
      type: 'debit',
      icon: 'document_scanner',
      paymentMethod: 'UPI',
      verifiedOcr: true,
    });
    setSavedNotice(`Saved ${formatINR(grandTotal)} at ${merchant}.`);
    setTimeout(() => setSavedNotice(null), 4000);
  };

  const handleRouteToSplit = () => {
    router.push(
      `/split?merchant=${encodeURIComponent(merchant)}&amount=${grandTotal}&mode=ocr&invoice=${encodeURIComponent(
        invoiceNumber
      )}`
    );
  };

  return (
    <div className="pb-12">
      <PageHeader
        title="Scan a bill"
        description="Upload a photo of a receipt or bill to review items before saving."
        action={
          <label className="inline-flex items-center justify-center h-11 sm:h-10 px-5 rounded-full bg-[#1C1C1E] text-white text-[14px] font-medium cursor-pointer">
            <span>Upload receipt</span>
            <input
              type="file"
              accept="image/*,.pdf"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        }
      />

      <div className="space-y-6">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[13px] text-[#636366] mr-1">Try an example:</span>
          {(['grocery', 'utility', 'dining'] as const).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => loadPreset(key)}
              aria-pressed={presetKey === key}
              className={`h-10 px-4 rounded-full text-[13px] font-medium cursor-pointer ${
                presetKey === key
                  ? 'bg-[#1C1C1E] text-white'
                  : 'bg-[#F5F5F7] text-[#1C1C1E] hover:bg-[#EBEBED]'
              }`}
            >
              {SAMPLE_RECEIPTS[key].label}
            </button>
          ))}
        </div>

        {savedNotice && (
          <div
            role="status"
            className="p-4 rounded-2xl bg-[#32D74B]/15 text-[#1E8E3E] text-[14px] flex items-center justify-between gap-3"
          >
            <span>{savedNotice}</span>
            <button
              type="button"
              onClick={() => router.push('/transactions')}
              className="underline font-medium cursor-pointer"
            >
              View transactions
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left: Receipt summary */}
          <div className="lg:col-span-5 bento-pod p-5 sm:p-6 space-y-4">
            <h2 className="text-[17px] font-semibold">Receipt summary</h2>

            <div className="bg-white rounded-2xl p-5 space-y-4 relative">
              {scanning && (
                <div className="absolute inset-0 bg-white/85 rounded-2xl flex items-center justify-center z-10">
                  <span className="text-[14px] font-medium text-[#1C1C1E]">Reading receipt…</span>
                </div>
              )}

              <div>
                <p className="text-[16px] font-semibold text-[#1C1C1E]">{merchant}</p>
                <p className="text-[13px] text-[#636366]">
                  {billDate} · {invoiceNumber}
                </p>
              </div>

              <div className="divide-y divide-black/[0.06]">
                {items.map((item) => (
                  <div key={item.id} className="py-2.5 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[14px] text-[#1C1C1E]">
                        {item.qty > 1 ? `${item.qty} × ` : ''}
                        {item.description}
                      </p>
                      {item.confidence < 95 && (
                        <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#FF9F0A]/15 text-[#B25000]">
                          Please check amount
                        </span>
                      )}
                    </div>
                    <span className="text-[14px] font-medium text-[#1C1C1E] tabular-nums shrink-0">
                      {formatINR(item.amount)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="pt-3 border-t border-black/[0.08] space-y-1.5 text-[14px]">
                <div className="flex justify-between text-[#636366] tabular-nums">
                  <span>Subtotal</span>
                  <span>{formatINR(subtotal)}</span>
                </div>
                <div className="flex justify-between text-[#636366] tabular-nums">
                  <span>Tax</span>
                  <span>{formatINR(taxAmount)}</span>
                </div>
                <div className="flex justify-between text-[17px] font-semibold text-[#1C1C1E] pt-1 tabular-nums">
                  <span>Total</span>
                  <span>{formatINR(grandTotal)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Editable details */}
          <div className="lg:col-span-7 bento-pod p-5 sm:p-6 space-y-5">
            <h2 className="text-[17px] font-semibold">Edit details</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="ocr-merchant" className={LABEL}>
                  Merchant
                </label>
                <input
                  id="ocr-merchant"
                  type="text"
                  value={merchant}
                  onChange={(e) => setMerchant(e.target.value)}
                  className={INPUT}
                />
              </div>
              <div>
                <label htmlFor="ocr-invoice" className={LABEL}>
                  Bill or invoice number
                </label>
                <input
                  id="ocr-invoice"
                  type="text"
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  className={INPUT}
                />
              </div>
              <div>
                <label htmlFor="ocr-category" className={LABEL}>
                  Category
                </label>
                <select
                  id="ocr-category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className={INPUT}
                >
                  <option value="Groceries">Groceries</option>
                  <option value="Utilities & Rent">Utilities & Rent</option>
                  <option value="Dining Out">Dining Out</option>
                  <option value="Shopping & Lifestyle">Shopping & Lifestyle</option>
                  <option value="Transport">Transport</option>
                </select>
              </div>
              <div>
                <label htmlFor="ocr-tax" className={LABEL}>
                  Tax (₹)
                </label>
                <input
                  id="ocr-tax"
                  type="number"
                  inputMode="numeric"
                  value={taxAmount}
                  onChange={(e) => setTaxAmount(Math.max(0, Number(e.target.value) || 0))}
                  className={`${INPUT} tabular-nums`}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[13px] text-[#636366]">Items</span>
                <button
                  type="button"
                  onClick={() =>
                    setItems((prev) => [
                      ...prev,
                      {
                        id: `custom-${Date.now()}`,
                        description: 'New item',
                        qty: 1,
                        amount: 250,
                        confidence: 99.0,
                      },
                    ])
                  }
                  className="text-[13px] font-medium text-[#1C1C1E] underline cursor-pointer min-h-[44px] inline-flex items-center"
                >
                  Add item
                </button>
              </div>

              <div className="bg-white rounded-2xl divide-y divide-black/[0.06]">
                {items.map((item, idx) => (
                  <div key={item.id} className="p-3 flex items-center gap-3">
                    <input
                      type="text"
                      aria-label={`Item ${idx + 1} description`}
                      value={item.description}
                      onChange={(e) => updateLineItem(item.id, 'description', e.target.value)}
                      className="flex-1 h-10 px-2 text-[14px] text-[#1C1C1E] bg-transparent focus:outline-none"
                    />
                    {item.confidence < 95 && (
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#FF9F0A]/15 text-[#B25000] shrink-0">
                        Check
                      </span>
                    )}
                    <input
                      type="number"
                      inputMode="numeric"
                      aria-label={`Item ${idx + 1} amount in rupees`}
                      value={item.amount}
                      onChange={(e) => updateLineItem(item.id, 'amount', e.target.value)}
                      className="w-28 h-10 text-right tabular-nums text-[14px] font-medium text-[#1C1C1E] bg-[#F5F5F7] px-3 rounded-xl"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-[13px] text-[#636366] block">Total</span>
                <span className="text-[28px] font-semibold text-[#1C1C1E] tabular-nums">
                  {formatINR(grandTotal)}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleRouteToSplit}
                  className="h-11 sm:h-10 px-5 rounded-full bg-white hover:bg-[#EBEBED] text-[#1C1C1E] text-[14px] font-medium cursor-pointer"
                >
                  Split this bill
                </button>
                <button
                  type="button"
                  onClick={handleConfirmSave}
                  className="h-11 sm:h-10 px-5 rounded-full bg-[#1C1C1E] text-white text-[14px] font-medium cursor-pointer"
                >
                  Save transaction
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
