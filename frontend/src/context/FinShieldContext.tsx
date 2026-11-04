'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  buildSolanaExplorerUrl,
  buildUpiUri,
  formatINR,
  generateDeterministicTestnetWallet,
  isValidSolanaAddress,
  normalizeCryptHandle,
  resolveCryptHandle,
  type CryptHandleProfile,
  type SolanaCluster,
} from '@/lib/finance-engine';
import { API, pushTransaction, type AccountPayload } from '@/lib/account-api';
import { clearSession } from '@/lib/session';

export type ThemeAccentToken = 'obsidian' | 'orange' | 'electric' | 'emerald';

export interface LedgerTransaction {
  id: string;
  merchant: string;
  category: string;
  date: string;
  time: string;
  amount: number;
  type: 'debit' | 'credit';
  icon: string;
  paymentMethod?: 'UPI' | 'Card' | 'Auto-Debit' | 'Cash';
  verifiedOcr?: boolean;
  anomalyZScore?: number;
}

export interface BudgetEnvelopeItem {
  id: string;
  category: string;
  icon: string;
  spent: number;
  cap: number;
  paceNote: string;
}

export interface SavingsGoalItem {
  id: string;
  name: string;
  icon: string;
  saved: number;
  target: number;
  monthlyContribution: number;
  targetDate: string;
  autoSip: boolean;
}

export interface DebtItem {
  id: string;
  name: string;
  lender: string;
  totalLoan: number;
  paidPrincipal: number;
  emi: number;
  apr: number;
  remainingMonths: number;
  nextDueDate: string;
}

export interface SubscriptionItem {
  id: string;
  name: string;
  category: string;
  amount: number;
  billingCycle: 'Monthly' | 'Annual';
  nextRenewalDate: string;
  renewalDay: number;
  paymentMethod: string;
  status: 'ACTIVE' | 'PAUSED';
  usageNote: string;
  priceHikeAlert?: string;
  icon: string;
}

export interface UtilityBillItem {
  id: string;
  provider: string;
  utilityType:
    | 'Electricity'
    | 'Broadband / Wi-Fi'
    | 'Piped Gas'
    | 'Water Board'
    | 'Rent & Maintenance';
  consumerId: string;
  billingMonth: string;
  amount: number;
  previousAmount: number;
  dueDate: string;
  status: 'PAID' | 'DUE_SOON' | 'OVERDUE';
  autopay: boolean;
  splittableWithFlatmates: boolean;
  unitsConsumed?: string;
  icon: string;
}

export interface PendingCollectionRecord {
  id: string;
  friendName: string;
  friendPhone: string;
  friendUpiId: string;
  friendCryptHandle?: string;
  merchant: string;
  category: string;
  totalBill: number;
  amountOwed: number;
  amountPaid: number;
  createdAt: string;
  dueDate: string;
  status: 'PENDING' | 'PARTIAL' | 'SETTLED';
  upiUri: string;
  protectBudgetCap: boolean;
}

export interface CryptoTransferRecord {
  id: string;
  senderHandle?: string;
  recipientHandle?: string;
  recipientName: string;
  recipientAddress: string;
  symbol: 'SOL' | 'USDC' | 'USDT';
  tokenAmount: number;
  inrEquivalent: number;
  txHash: string;
  timestamp: string;
  network?: SolanaCluster;
  explorerUrl?: string;
  status: 'CONFIRMED';
}

export interface SystemNotification {
  id: string;
  title: string;
  body: string;
  timestamp: string;
  category: 'BUDGET_ALERT' | 'EMI_REMINDER' | 'ML_ANOMALY' | 'SPLIT_SETTLEMENT';
  tone: 'critical' | 'warning' | 'positive';
  read: boolean;
  actionHref?: string;
  actionLabel?: string;
}

export interface FinShieldState {
  profile: {
    name: string;
    email: string;
    upiVpa: string;
    initials: string;
    tier: string;
    cryptHandle: string;
    solanaWallet: string;
    solanaCluster: SolanaCluster;
    city?: string;
    monthlyIncome?: number;
    housingCost?: number;
    onboarded?: boolean;
  };
  settings: {
    themeAccent: ThemeAccentToken;
    compactLakhs: boolean;
    budgetThreshold80Alert: boolean;
    mlZScoreAnomalyGuard: boolean;
  };
  cryptDirectory: CryptHandleProfile[];
  testnetSolBalance: number;
  transactions: LedgerTransaction[];
  budgets: BudgetEnvelopeItem[];
  goals: SavingsGoalItem[];
  debts: DebtItem[];
  subscriptions: SubscriptionItem[];
  utilityBills: UtilityBillItem[];
  pendingCollections: PendingCollectionRecord[];
  cryptoTransfers: CryptoTransferRecord[];
  notifications: SystemNotification[];
}

const EMPTY_LEDGER: FinShieldState = {
  profile: {
    name: '',
    email: '',
    upiVpa: '',
    initials: '',
    tier: 'FinShield',
    cryptHandle: '',
    solanaWallet: '',
    solanaCluster: 'testnet',
    city: '',
    monthlyIncome: 0,
    housingCost: 0,
    onboarded: false,
  },
  cryptDirectory: [],
  testnetSolBalance: 0,
  settings: {
    themeAccent: 'obsidian',
    compactLakhs: false,
    budgetThreshold80Alert: true,
    mlZScoreAnomalyGuard: true,
  },
  transactions: [],
  budgets: [],
  goals: [],
  debts: [],
  subscriptions: [],
  utilityBills: [],
  pendingCollections: [],
  cryptoTransfers: [],
  notifications: [],
};

interface FinShieldContextType {
  state: FinShieldState;
  isQuickEntryOpen: boolean;
  setQuickEntryOpen: (v: boolean) => void;
  addTransaction: (tx: Omit<LedgerTransaction, 'id'>) => void;
  importCsvRowsToLedger: (
    rows: Array<{
      date: string;
      merchant: string;
      category: string;
      amount: number;
      type: 'debit' | 'credit';
      zScore?: number;
    }>
  ) => void;
  updateBudgetCap: (id: string, newCap: number) => void;
  contributeToGoal: (id: string, amount: number) => void;
  addGoal: (goal: Omit<SavingsGoalItem, 'id'>) => void;
  addDebt: (debt: Omit<DebtItem, 'id'>) => void;
  payDebtEmi: (id: string) => void;
  toggleSubscriptionPause: (id: string) => void;
  addSubscription: (sub: Omit<SubscriptionItem, 'id'>) => void;
  payUtilityBill: (id: string) => void;
  addUtilityBill: (bill: Omit<UtilityBillItem, 'id'>) => void;
  addPendingCollection: (col: Omit<PendingCollectionRecord, 'id'>) => void;
  markCollectionSettled: (id: string) => void;
  sendCollectionReminder: (id: string) => void;
  recordCryptoTransfer: (tx: Omit<CryptoTransferRecord, 'id'>) => void;
  registerOrUpdateCryptUser: (input: {
    name: string;
    email: string;
    upiVpa: string;
    cryptHandle?: string;
    solanaWallet?: string;
    phone?: string;
    network?: SolanaCluster;
    suggestedInr?: number;
    recentSplitNote?: string;
    setAsActiveProfile?: boolean;
  }) => Promise<{ ok: boolean; profile: CryptHandleProfile; message: string }>;
  switchActiveCryptUser: (handleOrId: string) => void;
  creditTestnetAirdrop: (solAmount: number, signature: string) => void;
  markAllNotificationsRead: () => void;
  dismissNotification: (id: string) => void;
  updateProfile: (partial: Partial<FinShieldState['profile']>) => void;
  updateSettings: (partial: Partial<FinShieldState['settings']>) => void;
  saveLedgerLocally: () => Promise<{ saved: boolean; message: string }>;
  resetDemoVault: () => void;
  hydrateFromAccount: (account: AccountPayload) => void;
}

const FinShieldContext = createContext<FinShieldContextType | undefined>(undefined);

const STORAGE_KEY = 'finshield_vault_state_v27';

export function FinShieldProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<FinShieldState>(EMPTY_LEDGER);
  const [isQuickEntryOpen, setQuickEntryOpen] = useState<boolean>(false);

  // Hydrate from localStorage on client mount & sync shared #crypt directory
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.transactions && parsed.budgets) {
          setState((prev) => {
            const mergedProfile = {
              ...prev.profile,
              ...(parsed.profile || {}),
              cryptHandle:
                parsed.profile?.cryptHandle ||
                normalizeCryptHandle(parsed.profile?.name || prev.profile.cryptHandle),
              solanaWallet:
                parsed.profile?.solanaWallet || prev.profile.solanaWallet,
              solanaCluster:
                parsed.profile?.solanaCluster === 'devnet' ? 'devnet' : 'testnet',
            };
            const existingDir: CryptHandleProfile[] = Array.isArray(parsed.cryptDirectory)
              ? parsed.cryptDirectory
              : [];
            delete parsed.awsConfig;
            return {
              ...prev,
              ...parsed,
              profile: mergedProfile,
              cryptDirectory: existingDir,
              testnetSolBalance:
                typeof parsed.testnetSolBalance === 'number'
                  ? parsed.testnetSolBalance
                  : prev.testnetSolBalance,
            };
          });
        }
      }
    } catch {
      // Ignore storage errors
    }

    // Fetch server-side shared #crypt directory so multi-user registrations sync across sessions
    fetch('/api/crypto/directory')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.ok && Array.isArray(data.directory)) {
          setState((prev) => {
            const byHandle = new Map<string, CryptHandleProfile>();
            for (const item of prev.cryptDirectory) {
              byHandle.set(item.handle.toLowerCase(), item);
            }
            for (const srvItem of data.directory as CryptHandleProfile[]) {
              if (srvItem?.handle && !byHandle.has(srvItem.handle.toLowerCase())) {
                byHandle.set(srvItem.handle.toLowerCase(), srvItem);
              }
            }
            return {
              ...prev,
              cryptDirectory: Array.from(byHandle.values()),
            };
          });
        }
      })
      .catch(() => {
        // Ignore offline error
      });
  }, []);

  // Persist to localStorage & apply --accent-primary CSS variable
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Ignore quota errors
    }

    const accentHex =
      state.settings.themeAccent === 'orange'
        ? '#8f7df0'
        : state.settings.themeAccent === 'electric'
        ? '#3d86ff'
        : state.settings.themeAccent === 'emerald'
        ? '#8f7df0'
        : '#1c1b3a';

    document.documentElement.style.setProperty('--accent-primary', accentHex);
  }, [state]);

  const addTransaction = (tx: Omit<LedgerTransaction, 'id'>) => {
    const newTx: LedgerTransaction = {
      ...tx,
      id: `tx-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    };
    setState((prev) => {
      const updatedBudgets =
        tx.type === 'debit'
          ? prev.budgets.map((b) =>
              b.category.toLowerCase() === tx.category.toLowerCase()
                ? { ...b, spent: b.spent + tx.amount }
                : b
            )
          : prev.budgets;

      return {
        ...prev,
        transactions: [newTx, ...prev.transactions],
        budgets: updatedBudgets,
      };
    });
    void pushTransaction({
      id: newTx.id,
      merchant: newTx.merchant,
      category: newTx.category,
      date: newTx.date,
      time: newTx.time,
      amount: newTx.amount,
      type: newTx.type,
      paymentMethod: newTx.paymentMethod,
    });
  };

  const importCsvRowsToLedger = (
    rows: Array<{
      date: string;
      merchant: string;
      category: string;
      amount: number;
      type: 'debit' | 'credit';
      zScore?: number;
    }>
  ) => {
    setState((prev) => {
      const imported: LedgerTransaction[] = rows.map((r, i) => ({
        id: `csv-${Date.now()}-${i}`,
        merchant: r.merchant,
        category: r.category,
        date: r.date,
        time: 'CSV Import',
        amount: r.amount,
        type: r.type,
        icon: r.type === 'credit' ? 'south_west' : 'receipt_long',
        paymentMethod: 'UPI',
        anomalyZScore: r.zScore,
      }));

      // Aggregate debit amounts by category to sync with Monthly Budgets
      const categorySpendDelta: Record<string, number> = {};
      for (const r of rows) {
        if (r.type === 'debit') {
          const key = r.category.toLowerCase();
          categorySpendDelta[key] = (categorySpendDelta[key] || 0) + r.amount;
        }
      }

      const updatedBudgets = prev.budgets.map((b) => {
        const delta = categorySpendDelta[b.category.toLowerCase()] || 0;
        return delta > 0 ? { ...b, spent: b.spent + delta } : b;
      });

      const newNotif: SystemNotification = {
        id: `notif-csv-${Date.now()}`,
        title: `Committed ${rows.length} Bank CSV Transactions`,
        body: `Synced ${rows.length} statement rows with Monthly Budget Envelopes & Ledger.`,
        timestamp: 'Just now',
        category: 'ML_ANOMALY',
        tone: 'positive',
        read: false,
        actionHref: '/transactions',
        actionLabel: 'View Ledger →',
      };

      return {
        ...prev,
        transactions: [...imported, ...prev.transactions],
        budgets: updatedBudgets,
        notifications: [newNotif, ...prev.notifications],
      };
    });
  };

  const updateBudgetCap = (id: string, newCap: number) => {
    setState((prev) => ({
      ...prev,
      budgets: prev.budgets.map((b) => (b.id === id ? { ...b, cap: newCap } : b)),
    }));
  };

  const contributeToGoal = (id: string, amount: number) => {
    setState((prev) => ({
      ...prev,
      goals: prev.goals.map((g) =>
        g.id === id ? { ...g, saved: g.saved + amount } : g
      ),
    }));
  };

  const addGoal = (goal: Omit<SavingsGoalItem, 'id'>) => {
    setState((prev) => ({
      ...prev,
      goals: [...prev.goals, { ...goal, id: `g-${Date.now()}` }],
    }));
  };

  const addDebt = (debt: Omit<DebtItem, 'id'>) => {
    setState((prev) => ({
      ...prev,
      debts: [...prev.debts, { ...debt, id: `debt-${Date.now()}` }],
    }));
  };

  const payDebtEmi = (id: string) => {
    const target = state.debts.find((d) => d.id === id);
    if (!target || target.emi <= 0) return;
    const paid = {
      id: `emi-${Date.now()}`,
      merchant: `${target.name} EMI`,
      category: 'EMI & Loans',
      date: 'Today',
      time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      amount: target.emi,
      type: 'debit' as const,
      icon: 'account_balance',
      paymentMethod: 'Auto-Debit' as const,
    };
    setState((prev) => ({
      ...prev,
      debts: prev.debts.map((d) =>
        d.id === id
          ? {
              ...d,
              paidPrincipal: Math.min(d.totalLoan, d.paidPrincipal + d.emi),
              remainingMonths: Math.max(0, d.remainingMonths - 1),
            }
          : d
      ),
      transactions: [paid, ...prev.transactions],
    }));
    void pushTransaction(paid);
  };

  const toggleSubscriptionPause = (id: string) => {
    setState((prev) => ({
      ...prev,
      subscriptions: prev.subscriptions.map((s) =>
        s.id === id
          ? { ...s, status: s.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE' }
          : s
      ),
    }));
  };

  const addSubscription = (sub: Omit<SubscriptionItem, 'id'>) => {
    setState((prev) => ({
      ...prev,
      subscriptions: [{ ...sub, id: `sub-${Date.now()}` }, ...prev.subscriptions],
    }));
  };

  const payUtilityBill = (id: string) => {
    setState((prev) => {
      const bill = prev.utilityBills.find((u) => u.id === id);
      if (!bill || bill.status === 'PAID') return prev;

      const updatedBudgets = prev.budgets.map((b) =>
        b.category === 'Utilities & Rent'
          ? { ...b, spent: b.spent + bill.amount }
          : b
      );

      const newNotif: SystemNotification = {
        id: `notif-util-${Date.now()}`,
        title: `Utility Bill Paid · ${bill.provider}`,
        body: `Paid ${formatINR(bill.amount)} for ${bill.utilityType} (${bill.consumerId}). Synced with Utilities & Rent budget.`,
        timestamp: 'Just now',
        category: 'EMI_REMINDER',
        tone: 'positive',
        read: false,
        actionHref: '/budgets',
        actionLabel: 'View Budget →',
      };

      return {
        ...prev,
        utilityBills: prev.utilityBills.map((u) =>
          u.id === id ? { ...u, status: 'PAID', dueDate: 'Paid Today' } : u
        ),
        budgets: updatedBudgets,
        notifications: [newNotif, ...prev.notifications],
        transactions: [
          {
            id: `util-pay-${Date.now()}`,
            merchant: bill.provider,
            category: 'Utilities & Rent',
            date: 'Today',
            time: new Date().toLocaleTimeString('en-IN', {
              hour: '2-digit',
              minute: '2-digit',
            }),
            amount: bill.amount,
            type: 'debit',
            icon: bill.icon,
            paymentMethod: 'UPI',
          },
          ...prev.transactions,
        ],
      };
    });
  };

  const addUtilityBill = (bill: Omit<UtilityBillItem, 'id'>) => {
    setState((prev) => ({
      ...prev,
      utilityBills: [{ ...bill, id: `util-${Date.now()}` }, ...prev.utilityBills],
    }));
  };

  const addPendingCollection = (col: Omit<PendingCollectionRecord, 'id'>) => {
    setState((prev) => ({
      ...prev,
      pendingCollections: [
        { ...col, id: `col-${Date.now()}-${Math.random().toString(36).slice(2, 5)}` },
        ...prev.pendingCollections,
      ],
    }));
  };

  const markCollectionSettled = (id: string) => {
    setState((prev) => {
      const target = prev.pendingCollections.find((c) => c.id === id);
      if (!target || target.status === 'SETTLED') return prev;
      const settledAmount = Math.max(0, target.amountOwed - target.amountPaid);

      const updatedBudgets = target.protectBudgetCap
        ? prev.budgets.map((b) =>
            b.category.toLowerCase() === target.category.toLowerCase()
              ? {
                  ...b,
                  spent: Math.max(0, b.spent - settledAmount),
                  paceNote: `Reimbursed ${formatINR(settledAmount)} from ${target.friendName}`,
                }
              : b
          )
        : prev.budgets;

      const newNotif: SystemNotification = {
        id: `notif-settle-${Date.now()}`,
        title: `UPI Split Settled by ${target.friendName}`,
        body: `Received ${formatINR(settledAmount)} for ${target.merchant}. Credited ledger & restored ${target.category} budget buffer.`,
        timestamp: 'Just now',
        category: 'SPLIT_SETTLEMENT',
        tone: 'positive',
        read: false,
        actionHref: '/transactions',
        actionLabel: 'View Credit →',
      };

      return {
        ...prev,
        pendingCollections: prev.pendingCollections.map((c) =>
          c.id === id
            ? {
                ...c,
                amountPaid: c.amountOwed,
                status: 'SETTLED',
                dueDate: 'Settled via UPI',
              }
            : c
        ),
        budgets: updatedBudgets,
        notifications: [newNotif, ...prev.notifications],
        transactions: [
          {
            id: `split-settle-${Date.now()}`,
            merchant: `UPI Split Settled · ${target.friendName} (${target.merchant})`,
            category: target.category,
            date: 'Today',
            time: new Date().toLocaleTimeString('en-IN', {
              hour: '2-digit',
              minute: '2-digit',
            }),
            amount: settledAmount,
            type: 'credit',
            icon: 'qr_code_2',
            paymentMethod: 'UPI',
          },
          ...prev.transactions,
        ],
      };
    });
  };

  const sendCollectionReminder = (id: string) => {
    setState((prev) => ({
      ...prev,
      pendingCollections: prev.pendingCollections.map((c) =>
        c.id === id ? { ...c, dueDate: 'WhatsApp Ping Sent' } : c
      ),
    }));
  };

  const recordCryptoTransfer = (tx: Omit<CryptoTransferRecord, 'id'>) => {
    setState((prev) => {
      const friendFirstName = tx.recipientName.split(' ')[0].toLowerCase();
      const targetHandle = (tx.recipientHandle || '').toLowerCase();
      const cluster = tx.network || prev.profile.solanaCluster || 'testnet';
      const updatedCollections = prev.pendingCollections.map((c) => {
        const matchesHandle =
          targetHandle &&
          c.friendCryptHandle &&
          c.friendCryptHandle.toLowerCase() === targetHandle;
        const matchesName = c.friendName.toLowerCase().includes(friendFirstName);
        if (c.status !== 'SETTLED' && (matchesHandle || matchesName)) {
          const nextPaid = Math.min(c.amountOwed, c.amountPaid + tx.inrEquivalent);
          const fullySettled = nextPaid >= c.amountOwed;
          return {
            ...c,
            amountPaid: nextPaid,
            status: (fullySettled ? 'SETTLED' : 'PARTIAL') as 'SETTLED' | 'PARTIAL',
            dueDate: fullySettled
              ? `Settled via ${tx.recipientHandle || 'Solana Testnet'} (${tx.symbol})`
              : c.dueDate,
          };
        }
        return c;
      });

      const nextSolBalance =
        tx.symbol === 'SOL'
          ? Number(Math.max(0.05, prev.testnetSolBalance - tx.tokenAmount).toFixed(4))
          : prev.testnetSolBalance;

      const newNotif: SystemNotification = {
        id: `notif-sol-${Date.now()}`,
        title: `Solana ${cluster === 'devnet' ? 'Devnet' : 'Testnet'} Payment Confirmed (${tx.tokenAmount} ${tx.symbol})`,
        body: `Sent ${formatINR(tx.inrEquivalent)} (${tx.tokenAmount} ${tx.symbol}) from ${
          tx.senderHandle || prev.profile.cryptHandle
        } to ${tx.recipientHandle || tx.recipientName} on Solana ${
          cluster === 'devnet' ? 'Devnet' : 'Testnet'
        }.`,
        timestamp: 'Just now',
        category: 'SPLIT_SETTLEMENT',
        tone: 'positive',
        read: false,
        actionHref: '/crypto',
        actionLabel: 'View Tx →',
      };

      return {
        ...prev,
        testnetSolBalance: nextSolBalance,
        cryptoTransfers: [
          {
            ...tx,
            senderHandle: tx.senderHandle || prev.profile.cryptHandle,
            network: cluster,
            explorerUrl:
              tx.explorerUrl || buildSolanaExplorerUrl(tx.txHash, 'tx', cluster),
            id: `sol-${Date.now()}`,
          },
          ...prev.cryptoTransfers,
        ],
        pendingCollections: updatedCollections,
        notifications: [newNotif, ...prev.notifications],
        transactions: [
          {
            id: `sol-ledger-${Date.now()}`,
            merchant: `Solana Testnet · ${tx.recipientHandle || tx.recipientName} (${tx.tokenAmount} ${tx.symbol})`,
            category: 'Investments',
            date: 'Today',
            time: 'Solana Testnet',
            amount: tx.inrEquivalent,
            type: 'debit',
            icon: 'bolt',
            paymentMethod: 'UPI',
          },
          ...prev.transactions,
        ],
      };
    });
  };

  const registerOrUpdateCryptUser = async (input: {
    name: string;
    email: string;
    upiVpa: string;
    cryptHandle?: string;
    solanaWallet?: string;
    phone?: string;
    network?: SolanaCluster;
    suggestedInr?: number;
    recentSplitNote?: string;
    setAsActiveProfile?: boolean;
  }): Promise<{ ok: boolean; profile: CryptHandleProfile; message: string }> => {
    const cleanName = (input.name || '').trim() || 'FinShield User';
    const cleanEmail = (input.email || '').trim();
    const cleanUpi = (input.upiVpa || '').trim();
    const normalizedHandle =
      normalizeCryptHandle(input.cryptHandle || cleanName.split(' ')[0]) ||
      'user#crypt';
    const usernamePart = normalizedHandle.replace(/#crypt$/i, '');
    const cluster: SolanaCluster = input.network === 'devnet' ? 'devnet' : 'testnet';

    const existing = resolveCryptHandle(normalizedHandle, state.cryptDirectory);
    const providedWallet = (input.solanaWallet || '').trim();
    const resolvedWallet = isValidSolanaAddress(providedWallet)
      ? providedWallet
      : existing?.walletAddress || generateDeterministicTestnetWallet(normalizedHandle);

    const initials =
      cleanName
        .split(' ')
        .filter(Boolean)
        .map((p) => p[0])
        .join('')
        .slice(0, 2)
        .toUpperCase() || 'FS';

    const newEntry: CryptHandleProfile = {
      id: existing?.id || `crypt-u-${Date.now()}`,
      handle: normalizedHandle,
      username: usernamePart,
      name: cleanName,
      email: cleanEmail,
      upiVpa: cleanUpi,
      phone: (input.phone || existing?.phone || '').trim(),
      walletAddress: resolvedWallet,
      snsDomain: `${usernamePart}.sol`,
      avatarInitials: initials,
      network: cluster,
      verified: true,
      createdAt: existing?.createdAt || new Date().toISOString(),
      recentSplitNote:
        input.recentSplitNote ||
        existing?.recentSplitNote ||
        'Registered on Solana Testnet (#crypt)',
      suggestedInr: input.suggestedInr ?? existing?.suggestedInr ?? 0,
    };

    const setAsActive = input.setAsActiveProfile !== false;

    setState((prev) => {
      const idx = prev.cryptDirectory.findIndex(
        (u) => u.handle.toLowerCase() === normalizedHandle.toLowerCase()
      );
      const nextDirectory =
        idx >= 0
          ? prev.cryptDirectory.map((u, i) => (i === idx ? newEntry : u))
          : [...prev.cryptDirectory, newEntry];

      const nextProfile = setAsActive
        ? {
            ...prev.profile,
            name: cleanName,
            email: cleanEmail,
            upiVpa: cleanUpi,
            initials,
            cryptHandle: normalizedHandle,
            solanaWallet: resolvedWallet,
            solanaCluster: cluster,
          }
        : prev.profile;

      const notif: SystemNotification = {
        id: `notif-crypt-${Date.now()}`,
        title: `Registered ${normalizedHandle} on Solana Testnet`,
        body: `${cleanName} (${normalizedHandle}) is now discoverable for instant P2P Testnet payments at ${resolvedWallet.slice(0, 6)}...${resolvedWallet.slice(-4)}.`,
        timestamp: 'Just now',
        category: 'SPLIT_SETTLEMENT',
        tone: 'positive',
        read: false,
        actionHref: '/crypto',
        actionLabel: 'Pay via #crypt →',
      };

      return {
        ...prev,
        profile: nextProfile,
        cryptDirectory: nextDirectory,
        notifications: [notif, ...prev.notifications],
      };
    });

    try {
      const res = await fetch('/api/crypto/directory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newEntry),
      });
      if (res.ok) {
        const data = await res.json();
        if (data?.ok && Array.isArray(data.directory)) {
          setState((prev) => {
            const byHandle = new Map<string, CryptHandleProfile>();
            for (const u of prev.cryptDirectory) {
              byHandle.set(u.handle.toLowerCase(), u);
            }
            for (const srv of data.directory as CryptHandleProfile[]) {
              byHandle.set(srv.handle.toLowerCase(), srv);
            }
            return {
              ...prev,
              cryptDirectory: Array.from(byHandle.values()),
            };
          });
        }
      }
    } catch {
      // Local directory already updated
    }

    return {
      ok: true,
      profile: newEntry,
      message: `Registered ${normalizedHandle} → ${resolvedWallet.slice(0, 6)}...${resolvedWallet.slice(-4)} on Solana Testnet`,
    };
  };

  const switchActiveCryptUser = (handleOrId: string) => {
    setState((prev) => {
      const found =
        prev.cryptDirectory.find(
          (u) =>
            u.id === handleOrId ||
            u.handle.toLowerCase() === handleOrId.toLowerCase()
        ) || resolveCryptHandle(handleOrId, prev.cryptDirectory);
      if (!found) return prev;
      return {
        ...prev,
        profile: {
          ...prev.profile,
          name: found.name,
          email: found.email,
          upiVpa: found.upiVpa,
          initials: found.avatarInitials,
          cryptHandle: found.handle,
          solanaWallet: found.walletAddress,
          solanaCluster: found.network,
        },
      };
    });
  };

  const creditTestnetAirdrop = (solAmount: number, signature: string) => {
    setState((prev) => {
      const nextBalance = Number(
        (prev.testnetSolBalance + Math.max(0, solAmount)).toFixed(4)
      );
      const notif: SystemNotification = {
        id: `notif-airdrop-${Date.now()}`,
        title: `Solana Testnet Faucet Credited +${solAmount} SOL`,
        body: `Wallet ${prev.profile.cryptHandle} (${prev.profile.solanaWallet.slice(0, 6)}...${prev.profile.solanaWallet.slice(-4)}) received +${solAmount} Testnet SOL (Tx: ${signature.slice(0, 10)}...).`,
        timestamp: 'Just now',
        category: 'SPLIT_SETTLEMENT',
        tone: 'positive',
        read: false,
        actionHref: '/crypto',
        actionLabel: 'Open Testnet Pay →',
      };
      return {
        ...prev,
        testnetSolBalance: nextBalance,
        notifications: [notif, ...prev.notifications],
      };
    });
  };

  const markAllNotificationsRead = () => {
    setState((prev) => ({
      ...prev,
      notifications: prev.notifications.map((n) => ({ ...n, read: true })),
    }));
  };

  const dismissNotification = (id: string) => {
    setState((prev) => ({
      ...prev,
      notifications: prev.notifications.filter((n) => n.id !== id),
    }));
  };

  const updateProfile = (partial: Partial<FinShieldState['profile']>) => {
    setState((prev) => {
      const nextProfile = { ...prev.profile, ...partial };
      if (partial.cryptHandle) {
        nextProfile.cryptHandle = normalizeCryptHandle(partial.cryptHandle) || prev.profile.cryptHandle;
      }
      // Keep the user's entry in cryptDirectory synced when profile updates
      const nextDirectory = prev.cryptDirectory.map((u) => {
        if (
          u.email.toLowerCase() === prev.profile.email.toLowerCase() ||
          u.handle.toLowerCase() === prev.profile.cryptHandle.toLowerCase()
        ) {
          const handleNorm = nextProfile.cryptHandle;
          const userPart = handleNorm.replace(/#crypt$/i, '');
          return {
            ...u,
            name: nextProfile.name,
            email: nextProfile.email,
            upiVpa: nextProfile.upiVpa,
            handle: handleNorm,
            username: userPart,
            snsDomain: `${userPart}.sol`,
            walletAddress: nextProfile.solanaWallet,
            network: nextProfile.solanaCluster,
          };
        }
        return u;
      });
      return {
        ...prev,
        profile: nextProfile,
        cryptDirectory: nextDirectory,
      };
    });
  };

  const updateSettings = (partial: Partial<FinShieldState['settings']>) => {
    setState((prev) => ({
      ...prev,
      settings: { ...prev.settings, ...partial },
    }));
  };

  const saveLedgerLocally = async (): Promise<{ saved: boolean; message: string }> => {
    try {
      const res = await fetch(`${API}/ledger/snapshot`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transactionCount: state.transactions.length,
          transactions: state.transactions.slice(0, 200).map((tx) => ({
            id: tx.id,
            merchant: tx.merchant,
            category: tx.category,
            amount: tx.amount,
            type: tx.type,
            date: tx.date,
          })),
        }),
      });
      if (res.ok) return { saved: true, message: 'Saved in SQLite' };
      return { saved: false, message: 'Kept on this device' };
    } catch {
      return { saved: false, message: 'Kept on this device' };
    }
  };

  const hydrateFromAccount = (account: AccountPayload) => {
    setState((prev) => {
      const samePerson = prev.profile.email.toLowerCase() === account.user.email.toLowerCase();
      const initials = account.user.name
        .split(' ')
        .filter(Boolean)
        .map((part) => part[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();
      const serverTransactions: LedgerTransaction[] = account.transactions.map((tx) => ({
        id: tx.id,
        merchant: tx.merchant,
        category: tx.category,
        date: tx.date,
        time: tx.time,
        amount: tx.amount,
        type: tx.type,
        icon: tx.type === 'credit' ? 'south_west' : 'receipt_long',
        paymentMethod:
          tx.paymentMethod === 'Card' ||
          tx.paymentMethod === 'Cash' ||
          tx.paymentMethod === 'Auto-Debit' ||
          tx.paymentMethod === 'UPI'
            ? tx.paymentMethod
            : undefined,
      }));
      const goals =
        samePerson && prev.goals.length
          ? prev.goals
          : account.profile.goalName && account.profile.goalTarget > 0
            ? [
                {
                  id: 'goal-onboarding',
                  name: account.profile.goalName,
                  icon: 'savings',
                  saved: 0,
                  target: account.profile.goalTarget,
                  monthlyContribution: 0,
                  targetDate: '',
                  autoSip: false,
                },
              ]
            : [];
      const budgets =
        samePerson && prev.budgets.length
          ? prev.budgets
          : account.profile.housingCost > 0
            ? [
                {
                  id: 'budget-housing',
                  category: 'Utilities & Rent',
                  icon: 'home',
                  spent: 0,
                  cap: account.profile.housingCost,
                  paceNote: 'Set during onboarding',
                },
              ]
            : [];
      return {
        ...EMPTY_LEDGER,
        settings: {
          ...prev.settings,
          budgetThreshold80Alert: account.profile.alerts,
          mlZScoreAnomalyGuard: account.profile.alerts,
        },
        profile: {
          ...EMPTY_LEDGER.profile,
          name: account.user.name,
          email: account.user.email,
          initials,
          upiVpa: samePerson ? prev.profile.upiVpa : '',
          city: account.profile.city,
          monthlyIncome: account.profile.monthlyIncome,
          housingCost: account.profile.housingCost,
          onboarded: account.profile.onboarded,
        },
        transactions: samePerson && prev.transactions.length ? prev.transactions : serverTransactions,
        goals,
        budgets,
      };
    });
  };

  const resetDemoVault = () => {
    localStorage.removeItem(STORAGE_KEY);
    clearSession();
    setState(EMPTY_LEDGER);
  };

  return (
    <FinShieldContext.Provider
      value={{
        state,
        isQuickEntryOpen,
        setQuickEntryOpen,
        addTransaction,
        importCsvRowsToLedger,
        updateBudgetCap,
        contributeToGoal,
        addGoal,
        addDebt,
        payDebtEmi,
        toggleSubscriptionPause,
        addSubscription,
        payUtilityBill,
        addUtilityBill,
        addPendingCollection,
        markCollectionSettled,
        sendCollectionReminder,
        recordCryptoTransfer,
        registerOrUpdateCryptUser,
        switchActiveCryptUser,
        creditTestnetAirdrop,
        markAllNotificationsRead,
        dismissNotification,
        updateProfile,
        updateSettings,
        saveLedgerLocally,
        resetDemoVault,
        hydrateFromAccount,
      }}
    >
      {children}
    </FinShieldContext.Provider>
  );
}

export function useFinShield() {
  const ctx = useContext(FinShieldContext);
  if (!ctx) {
    throw new Error('useFinShield must be used inside <FinShieldProvider>');
  }
  return ctx;
}
