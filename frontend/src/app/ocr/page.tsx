'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useFinShield } from '@/context/FinShieldContext';
import { PageHeader } from '@/components/primitives';
import { formatINR } from '@/lib/finance-engine';
import { API } from '@/lib/account-api';

interface OcrLineItem {
  id: string;
  description: string;
  qty: number;
  amount: number;
  confidence: number;
}

const INPUT =
  'w-full h-11 px-4 rounded-2xl bg-white text-[14px] text-ink outline-none focus:ring-2 focus:ring-ink';
const LABEL = 'text-[13px] text-muted block mb-1.5';

export default function OcrBillScannerPage() {
  const router = useRouter();
  const { addTransaction } = useFinShield();

  const [merchant, setMerchant] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [billDate, setBillDate] = useState('');
  const [category, setCategory] = useState('');
  const [readText, setReadText] = useState('');
  const [taxAmount, setTaxAmount] = useState(0);
  const [items, setItems] = useState<OcrLineItem[]>([]);
  const [scanning, setScanning] = useState(false);
  const [savedNotice, setSavedNotice] = useState<string | null>(null);
  const [scanNote, setScanNote] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewKind, setPreviewKind] = useState<'image' | 'pdf' | null>(null);

  const subtotal = items.reduce((acc, item) => acc + item.amount, 0);
  const grandTotal = subtotal + taxAmount;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setScanning(true);
    setScanNote(null);
    setReadText('');
    const kind = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf') ? 'pdf' : 'image';
    const objectUrl = URL.createObjectURL(file);
    setPreviewKind(kind);
    setPreviewUrl((current) => {
      if (current) URL.revokeObjectURL(current);
      return objectUrl;
    });
    try {
      const base64Image = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ''));
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
      });
      const res = await fetch(`${API}/ocr/scan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: file.name,
          image: base64Image,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const ext = data.extraction;
        const lineItems = Array.isArray(ext?.lineItems) ? ext.lineItems : [];
        const read = String(data.text || '');
        setReadText(read);
        if (ext?.note) setScanNote(ext.note);
        if (!read) {
          setScanNote(ext?.note || 'No text could be read from this file.');
        }
        setMerchant(ext?.merchant || '');
        setInvoiceNumber(ext.invoiceNumber || '');
        setBillDate(ext.date || '');
        setCategory(ext.category || '');
        setTaxAmount(Number(ext.taxAmount) || 0);
        setItems(
          lineItems.map(
            (
              li: { description: string; qty: number; amount: number; confidence: number },
              idx: number
            ) => ({
              id: `ocr-${idx}`,
              ...li,
            })
          )
        );
      } else {
        setScanNote('The scan failed. Enter the receipt yourself.');
      }
    } catch {
      setScanNote('The scan failed. Enter the receipt yourself.');
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
    if (!merchant.trim() || items.length === 0) {
      setScanNote('Add a merchant and at least one line from the bill before saving.');
      return;
    }
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
          <label className="inline-flex items-center justify-center h-11 sm:h-10 px-5 rounded-full bg-ink text-white text-[14px] font-medium cursor-pointer">
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
        {scanNote && (
          <p role="status" className="text-[14px] text-muted">
            {scanNote}
          </p>
        )}

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
              {previewUrl && previewKind === 'image' && (
                <img src={previewUrl} alt="Uploaded bill" className="w-full max-h-80 object-contain rounded-xl bg-haze" />
              )}
              {previewUrl && previewKind === 'pdf' && (
                <iframe title="Uploaded bill" src={previewUrl} className="w-full h-80 rounded-xl bg-haze" />
              )}
              {!previewUrl && (
                <p className="text-[14px] text-muted">Upload a photo or PDF to see the bill here.</p>
              )}
              {readText && (
                <pre className="max-h-48 overflow-auto whitespace-pre-wrap text-[12px] leading-5 text-ink bg-haze rounded-xl p-3">
                  {readText}
                </pre>
              )}
              {scanning && (
                <div className="absolute inset-0 bg-white/85 rounded-2xl flex items-center justify-center z-10">
                  <span className="text-[14px] font-medium text-ink">Reading receipt…</span>
                </div>
              )}

              <div>
                <p className="text-[16px] font-semibold text-ink">{merchant}</p>
                <p className="text-[13px] text-muted">
                  {billDate} · {invoiceNumber}
                </p>
              </div>

              <div className="divide-y divide-lilac/40">
                {items.map((item) => (
                  <div key={item.id} className="py-2.5 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[14px] text-ink">
                        {item.qty > 1 ? `${item.qty} × ` : ''}
                        {item.description}
                      </p>
                      {item.confidence < 70 && (
                        <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-azure/15 text-azure">
                          Please check amount
                        </span>
                      )}
                    </div>
                    <span className="text-[14px] font-medium text-ink tabular-nums shrink-0">
                      {formatINR(item.amount)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="pt-3 border-t border-black/[0.08] space-y-1.5 text-[14px]">
                <div className="flex justify-between text-muted tabular-nums">
                  <span>Subtotal</span>
                  <span>{formatINR(subtotal)}</span>
                </div>
                <div className="flex justify-between text-muted tabular-nums">
                  <span>Tax</span>
                  <span>{formatINR(taxAmount)}</span>
                </div>
                <div className="flex justify-between text-[17px] font-semibold text-ink pt-1 tabular-nums">
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
                  <option value="">Category</option>
                  <option value="Bills">Bills</option>
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
                <span className="text-[13px] text-muted">Items</span>
                <button
                  type="button"
                  onClick={() =>
                    setItems((prev) => [
                      ...prev,
                      {
                        id: `custom-${Date.now()}`,
                        description: '',
                        qty: 1,
                        amount: 0,
                        confidence: 100,
                      },
                    ])
                  }
                  className="text-[13px] font-medium text-ink underline cursor-pointer min-h-[44px] inline-flex items-center"
                >
                  Add item
                </button>
              </div>

              <div className="bg-white rounded-2xl divide-y divide-lilac/40">
                {items.map((item, idx) => (
                  <div key={item.id} className="p-3 flex items-center gap-3">
                    <input
                      type="text"
                      aria-label={`Item ${idx + 1} description`}
                      value={item.description}
                      onChange={(e) => updateLineItem(item.id, 'description', e.target.value)}
                      className="flex-1 h-10 px-2 text-[14px] text-ink bg-transparent focus:outline-none"
                    />
                    {item.confidence < 70 && (
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-azure/15 text-azure shrink-0">
                        Check
                      </span>
                    )}
                    <input
                      type="number"
                      inputMode="numeric"
                      aria-label={`Item ${idx + 1} amount in rupees`}
                      value={item.amount}
                      onChange={(e) => updateLineItem(item.id, 'amount', e.target.value)}
                      className="w-28 h-10 text-right tabular-nums text-[14px] font-medium text-ink bg-haze px-3 rounded-xl"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-[13px] text-muted block">Total</span>
                <span className="text-[28px] font-semibold text-ink tabular-nums">
                  {formatINR(grandTotal)}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleRouteToSplit}
                  className="h-11 sm:h-10 px-5 rounded-full bg-white hover:bg-peri text-ink text-[14px] font-medium cursor-pointer"
                >
                  Split this bill
                </button>
                <button
                  type="button"
                  onClick={handleConfirmSave}
                  className="h-11 sm:h-10 px-5 rounded-full bg-ink text-white text-[14px] font-medium cursor-pointer"
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
