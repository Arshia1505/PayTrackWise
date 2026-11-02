'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import type { AwsCloudConfig } from '@/lib/aws-cloud';
import {
  DEFAULT_CRYPT_DIRECTORY,
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
  };
  settings: {
    themeAccent: ThemeAccentToken;
    compactLakhs: boolean;
    budgetThreshold80Alert: boolean;
    mlZScoreAnomalyGuard: boolean;
  };
  awsConfig: AwsCloudConfig;
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

const DEFAULT_STATE: FinShieldState = {
  profile: {
    name: 'Arjun Mehta',
    email: 'arjun.mehta@finshield.in',
    upiVpa: 'arjun@okicici',
    initials: 'AM',
    tier: 'FinShield Pro · AWS + Solana Testnet Enclave',
    cryptHandle: 'arjun#crypt',
    solanaWallet: '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R',
    solanaCluster: 'testnet',
  },
  cryptDirectory: DEFAULT_CRYPT_DIRECTORY,
  testnetSolBalance: 4.85,
  settings: {
    themeAccent: 'obsidian',
    compactLakhs: false,
    budgetThreshold80Alert: true,
    mlZScoreAnomalyGuard: true,
  },
  awsConfig: {
    enabled: false,
    region: 'ap-south-1',
    accessKeyId: '',
    secretAccessKey: '',
    s3Bucket: 'finshield-vault-artifacts',
    dynamoTable: 'FinShieldLedger',
    bedrockModelId: 'anthropic.claude-3-5-haiku-20241022-v1:0',
  },
  transactions: [
    {
      id: 'tx-1',
      merchant: 'Reliance Fresh Supermarket',
      category: 'Groceries',
      date: 'Today',
      time: '10:15 AM',
      amount: 3450,
      type: 'debit',
      icon: 'shopping_bag',
      paymentMethod: 'UPI',
      verifiedOcr: true,
    },
    {
      id: 'tx-2',
      merchant: 'Church Street Social',
      category: 'Dining Out',
      date: 'Yesterday',
      time: '09:40 PM',
      amount: 4250,
      type: 'debit',
      icon: 'restaurant',
      paymentMethod: 'UPI',
      verifiedOcr: true,
    },
    {
      id: 'tx-3',
      merchant: 'TechCorp India Salary Credit',
      category: 'Salary / Income',
      date: '01 Nov',
      time: '09:00 AM',
      amount: 145000,
      type: 'credit',
      icon: 'south_west',
      paymentMethod: 'Auto-Debit',
    },
    {
      id: 'tx-4',
      merchant: 'Croma Electronics Indiranagar',
      category: 'Shopping & Lifestyle',
      date: '01 Nov',
      time: '06:20 PM',
      amount: 12490,
      type: 'debit',
      icon: 'devices',
      paymentMethod: 'Card',
      anomalyZScore: 2.9,
    },
    {
      id: 'tx-5',
      merchant: 'Shell Fuel Station Bengaluru',
      category: 'Transport',
      date: '31 Oct',
      time: '08:15 AM',
      amount: 2850,
      type: 'debit',
      icon: 'local_gas_station',
      paymentMethod: 'UPI',
    },
    {
      id: 'tx-6',
      merchant: 'OpenAI ChatGPT Plus',
      category: 'Subscriptions',
      date: '29 Oct',
      time: '11:00 AM',
      amount: 1950,
      type: 'debit',
      icon: 'smart_toy',
      paymentMethod: 'Card',
    },
  ],
  budgets: [
    {
      id: 'b-1',
      category: 'Utilities & Rent',
      icon: 'home_work',
      spent: 25258,
      cap: 28000,
      paceNote: 'Fixed rent + BESCOM & Airtel on track',
    },
    {
      id: 'b-2',
      category: 'Groceries',
      icon: 'shopping_bag',
      spent: 11850,
      cap: 15000,
      paceNote: '79% utilized · ₹3,150 buffer remaining',
    },
    {
      id: 'b-3',
      category: 'Dining Out',
      icon: 'restaurant',
      spent: 7650,
      cap: 8500,
      paceNote: '90% Near Cap · Weekend surge detected',
    },
    {
      id: 'b-4',
      category: 'Shopping & Lifestyle',
      icon: 'shopping_cart',
      spent: 12490,
      cap: 10000,
      paceNote: 'Over Cap by ₹2,490 (Croma 2.9σ swipe)',
    },
    {
      id: 'b-5',
      category: 'Transport',
      icon: 'directions_car',
      spent: 5400,
      cap: 8000,
      paceNote: '67% utilized · Optimal fuel cadence',
    },
    {
      id: 'b-6',
      category: 'Subscriptions',
      icon: 'subscriptions',
      spent: 3671,
      cap: 4500,
      paceNote: '5 active digital mandates',
    },
  ],
  goals: [
    {
      id: 'g-1',
      name: 'Emergency Liquid Reserve (6 Mo)',
      icon: 'shield',
      saved: 245000,
      target: 450000,
      monthlyContribution: 25000,
      targetDate: 'Aug 2027',
      autoSip: true,
    },
    {
      id: 'g-2',
      name: 'Kyoto & Tokyo Autumn Expedition',
      icon: 'flight_takeoff',
      saved: 115000,
      target: 220000,
      monthlyContribution: 15000,
      targetDate: 'Oct 2027',
      autoSip: true,
    },
    {
      id: 'g-3',
      name: 'Index Portfolio Step-Up Corpus',
      icon: 'trending_up',
      saved: 180000,
      target: 1000000,
      monthlyContribution: 35000,
      targetDate: 'Dec 2028',
      autoSip: true,
    },
  ],
  debts: [
    {
      id: 'd-1',
      name: 'HDFC Home Loan Facility',
      lender: 'HDFC Bank Ltd',
      totalLoan: 2500000,
      paidPrincipal: 685000,
      emi: 18500,
      apr: 8.5,
      remainingMonths: 114,
      nextDueDate: '05 Nov 2026',
    },
    {
      id: 'd-2',
      name: 'SBI EV Car Green Loan',
      lender: 'State Bank of India',
      totalLoan: 650000,
      paidPrincipal: 162000,
      emi: 9600,
      apr: 8.85,
      remainingMonths: 48,
      nextDueDate: '10 Nov 2026',
    },
  ],
  subscriptions: [
    {
      id: 'sub-1',
      name: 'OpenAI ChatGPT Plus',
      category: 'AI & Developer Tools',
      amount: 1950,
      billingCycle: 'Monthly',
      nextRenewalDate: '08 Nov 2026',
      renewalDay: 8,
      paymentMethod: 'HDFC Millennia ••4821',
      status: 'ACTIVE',
      usageNote: 'High daily productivity usage',
      icon: 'smart_toy',
    },
    {
      id: 'sub-2',
      name: 'Netflix 4K Ultra HD',
      category: 'Media & Streaming',
      amount: 649,
      billingCycle: 'Monthly',
      nextRenewalDate: '05 Nov 2026',
      renewalDay: 5,
      paymentMethod: 'UPI Autopay (arjun@okicici)',
      status: 'ACTIVE',
      usageNote: 'Shared household screen plan',
      priceHikeAlert: 'Plan increased +₹150 vs Q3',
      icon: 'tv',
    },
    {
      id: 'sub-3',
      name: 'Cloud Storage Plan',
      category: 'Cloud & Backup',
      amount: 528,
      billingCycle: 'Monthly',
      nextRenewalDate: '15 Nov 2026',
      renewalDay: 15,
      paymentMethod: 'ICICI Coral ••9012',
      status: 'ACTIVE',
      usageNote: '2TB family storage',
      icon: 'cloud',
    },
    {
      id: 'sub-4',
      name: 'Apple One Premier India',
      category: 'Cloud & Music',
      amount: 365,
      billingCycle: 'Monthly',
      nextRenewalDate: '21 Nov 2026',
      renewalDay: 21,
      paymentMethod: 'UPI Autopay',
      status: 'ACTIVE',
      usageNote: '2TB iCloud+ & Apple Music active',
      icon: 'cloud_done',
    },
    {
      id: 'sub-5',
      name: 'Spotify Duo India',
      category: 'Audio Streaming',
      amount: 179,
      billingCycle: 'Monthly',
      nextRenewalDate: '26 Nov 2026',
      renewalDay: 26,
      paymentMethod: 'UPI Autopay',
      status: 'ACTIVE',
      usageNote: 'Active commute audio stream',
      icon: 'headphones',
    },
    {
      id: 'sub-6',
      name: 'YouTube Premium Individual',
      category: 'Video Streaming',
      amount: 149,
      billingCycle: 'Monthly',
      nextRenewalDate: '28 Nov 2026',
      renewalDay: 28,
      paymentMethod: 'UPI Autopay',
      status: 'PAUSED',
      usageNote: 'Paused until next month',
      icon: 'play_circle',
    },
  ],
  utilityBills: [
    {
      id: 'util-1',
      provider: 'BESCOM Electricity Bengaluru',
      utilityType: 'Electricity',
      consumerId: 'BLR-BES-449102881',
      billingMonth: 'Oct–Nov 2026',
      amount: 3258,
      previousAmount: 2890,
      dueDate: '06 Nov 2026',
      status: 'DUE_SOON',
      autopay: false,
      splittableWithFlatmates: true,
      unitsConsumed: '384 kWh (+12.7% vs Oct)',
      icon: 'electric_bolt',
    },
    {
      id: 'util-2',
      provider: 'Airtel Xstream Fiber 300 Mbps',
      utilityType: 'Broadband / Wi-Fi',
      consumerId: 'AIR-BLR-08044192',
      billingMonth: 'Nov 2026',
      amount: 1179,
      previousAmount: 1179,
      dueDate: '09 Nov 2026',
      status: 'DUE_SOON',
      autopay: true,
      splittableWithFlatmates: true,
      unitsConsumed: '640 GB Unlimited Fiber',
      icon: 'router',
    },
    {
      id: 'util-3',
      provider: 'GAIL Piped Natural Gas (PNG)',
      utilityType: 'Piped Gas',
      consumerId: 'GAIL-KA-9920114',
      billingMonth: 'Oct–Nov 2026',
      amount: 845,
      previousAmount: 790,
      dueDate: '12 Nov 2026',
      status: 'DUE_SOON',
      autopay: false,
      splittableWithFlatmates: true,
      unitsConsumed: '19.4 SCM Metered',
      icon: 'local_fire_department',
    },
    {
      id: 'util-4',
      provider: 'BWSSB Cauvery Water Supply',
      utilityType: 'Water Board',
      consumerId: 'BWSSB-E4-11029',
      billingMonth: 'Oct 2026',
      amount: 620,
      previousAmount: 610,
      dueDate: 'Paid 01 Nov',
      status: 'PAID',
      autopay: true,
      splittableWithFlatmates: true,
      unitsConsumed: '18 KL Domestic',
      icon: 'water_drop',
    },
    {
      id: 'util-5',
      provider: 'Prestige Shantiniketan Rent & Maint.',
      utilityType: 'Rent & Maintenance',
      consumerId: 'PSN-T14-904',
      billingMonth: 'Nov 2026',
      amount: 22000,
      previousAmount: 22000,
      dueDate: 'Paid 02 Nov',
      status: 'PAID',
      autopay: true,
      splittableWithFlatmates: true,
      unitsConsumed: '3BHK Flatmate Share (1/3)',
      icon: 'apartment',
    },
  ],
  pendingCollections: [
    {
      id: 'col-1',
      friendName: 'Rohan Kulkarni',
      friendPhone: '919845011223',
      friendUpiId: 'rohan.k@okaxis',
      friendCryptHandle: 'rohan#crypt',
      merchant: 'Church Street Social',
      category: 'Dining Out',
      totalBill: 4250,
      amountOwed: 1417,
      amountPaid: 0,
      createdAt: 'Yesterday, 9:45 PM',
      dueDate: 'Due Today',
      status: 'PENDING',
      upiUri: buildUpiUri({
        pa: 'arjun@okicici',
        pn: 'Arjun Mehta',
        am: 1417,
        cu: 'INR',
        tn: 'Split Church Street Social',
      }),
      protectBudgetCap: true,
    },
    {
      id: 'col-2',
      friendName: 'Priya Nair',
      friendPhone: '919880144556',
      friendUpiId: 'priya.nair@okhdfcbank',
      friendCryptHandle: 'priya#crypt',
      merchant: 'BESCOM Electricity + Airtel Fiber',
      category: 'Utilities & Rent',
      totalBill: 4437,
      amountOwed: 1479,
      amountPaid: 500,
      createdAt: '01 Nov 2026',
      dueDate: 'Due 06 Nov',
      status: 'PARTIAL',
      upiUri: buildUpiUri({
        pa: 'arjun@okicici',
        pn: 'Arjun Mehta',
        am: 979,
        cu: 'INR',
        tn: 'Split BESCOM and Airtel',
      }),
      protectBudgetCap: true,
    },
    {
      id: 'col-3',
      friendName: 'Vikram Singh',
      friendPhone: '919740088991',
      friendUpiId: 'vikram.s@ybl',
      friendCryptHandle: 'vikram#crypt',
      merchant: 'Blue Tokai Roasters',
      category: 'Dining Out',
      totalBill: 1260,
      amountOwed: 630,
      amountPaid: 630,
      createdAt: '29 Oct 2026',
      dueDate: 'Settled',
      status: 'SETTLED',
      upiUri: buildUpiUri({
        pa: 'arjun@okicici',
        pn: 'Arjun Mehta',
        am: 630,
        cu: 'INR',
        tn: 'Split Blue Tokai',
      }),
      protectBudgetCap: true,
    },
  ],
  cryptoTransfers: [
    {
      id: 'sol-tx-1',
      senderHandle: 'arjun#crypt',
      recipientHandle: 'rohan#crypt',
      recipientName: 'Rohan Kulkarni (rohan.sol)',
      recipientAddress: '7xKX...gAsU',
      symbol: 'USDC',
      tokenAmount: 16.59,
      inrEquivalent: 1417,
      txHash: '5xK9...8mPqSol',
      timestamp: 'Yesterday',
      network: 'testnet',
      explorerUrl: buildSolanaExplorerUrl('5xK98mPqSolTestnet111111111111111111111111', 'tx', 'testnet'),
      status: 'CONFIRMED',
    },
    {
      id: 'sol-tx-2',
      senderHandle: 'arjun#crypt',
      recipientHandle: 'priya#crypt',
      recipientName: 'Priya Nair (priya.sol)',
      recipientAddress: '9xQe...VFin',
      symbol: 'SOL',
      tokenAmount: 0.1028,
      inrEquivalent: 1630,
      txHash: '2nL4...9vRtSol',
      timestamp: '30 Oct 2026',
      network: 'testnet',
      explorerUrl: buildSolanaExplorerUrl('2nL49vRtSolTestnet222222222222222222222222', 'tx', 'testnet'),
      status: 'CONFIRMED',
    },
  ],
  notifications: [
    {
      id: 'notif-1',
      title: 'Shopping & Lifestyle is over budget',
      body: 'Your ₹12,490 payment at Croma Electronics put Shopping at 125% of your ₹10,000 monthly limit.',
      timestamp: '2 hours ago',
      category: 'BUDGET_ALERT',
      tone: 'critical',
      read: false,
      actionHref: '/budgets',
      actionLabel: 'Edit budget',
    },
    {
      id: 'notif-2',
      title: 'BESCOM Electricity bill due in 4 days',
      body: 'Your ₹3,258 bill is due on 06 Nov.',
      timestamp: '5 hours ago',
      category: 'EMI_REMINDER',
      tone: 'warning',
      read: false,
      actionHref: '/subscriptions',
      actionLabel: 'View bill',
    },
    {
      id: 'notif-3',
      title: 'Rohan Kulkarni owes you ₹1,417',
      body: 'From your split for Church Street Social.',
      timestamp: 'Yesterday',
      category: 'SPLIT_SETTLEMENT',
      tone: 'warning',
      read: false,
      actionHref: '/split',
      actionLabel: 'Send reminder',
    },
    {
      id: 'notif-4',
      title: 'Statement check complete',
      body: 'Found 1 unusually large payment and 5 recurring bills in your HDFC statement.',
      timestamp: 'Yesterday',
      category: 'ML_ANOMALY',
      tone: 'positive',
      read: true,
      actionHref: '/import-csv',
      actionLabel: 'View summary',
    },
  ],
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
  updateAwsConfig: (partial: Partial<AwsCloudConfig>) => void;
  syncWithAwsCloud: () => Promise<{ synced: boolean; message: string }>;
  resetDemoVault: () => void;
}

const FinShieldContext = createContext<FinShieldContextType | undefined>(undefined);

const STORAGE_KEY = 'finshield_vault_state_v26';

export function FinShieldProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<FinShieldState>(DEFAULT_STATE);
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
              : prev.cryptDirectory;
            // Ensure all DEFAULT_CRYPT_DIRECTORY entries exist alongside any user-added handles
            const byHandle = new Map<string, CryptHandleProfile>();
            for (const d of DEFAULT_CRYPT_DIRECTORY) {
              byHandle.set(d.handle.toLowerCase(), d);
            }
            for (const u of existingDir) {
              if (u && u.handle) {
                byHandle.set(u.handle.toLowerCase(), u);
              }
            }
            return {
              ...prev,
              ...parsed,
              profile: mergedProfile,
              cryptDirectory: Array.from(byHandle.values()),
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
        ? '#FF5500'
        : state.settings.themeAccent === 'electric'
        ? '#007AFF'
        : state.settings.themeAccent === 'emerald'
        ? '#1E8E3E'
        : '#1C1C1E';

    document.documentElement.style.setProperty('--accent-primary', accentHex);
  }, [state]);

  const addTransaction = (tx: Omit<LedgerTransaction, 'id'>) => {
    setState((prev) => {
      const newTx: LedgerTransaction = {
        ...tx,
        id: `tx-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      };
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

  const payDebtEmi = (id: string) => {
    setState((prev) => {
      const target = prev.debts.find((d) => d.id === id);
      if (!target) return prev;
      return {
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
        transactions: [
          {
            id: `emi-${Date.now()}`,
            merchant: `${target.name} EMI`,
            category: 'EMI & Loans',
            date: 'Today',
            time: new Date().toLocaleTimeString('en-IN', {
              hour: '2-digit',
              minute: '2-digit',
            }),
            amount: target.emi,
            type: 'debit',
            icon: 'account_balance',
            paymentMethod: 'Auto-Debit',
          },
          ...prev.transactions,
        ],
      };
    });
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
            category: 'Dining Out',
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
    const cleanEmail =
      (input.email || '').trim() ||
      `${cleanName.toLowerCase().replace(/\s+/g, '.')}@finshield.in`;
    const cleanUpi =
      (input.upiVpa || '').trim() ||
      `${cleanName.split(' ')[0].toLowerCase()}@okicici`;
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
      phone: input.phone || existing?.phone || '919845099887',
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
      suggestedInr: input.suggestedInr || existing?.suggestedInr || 750,
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
        body: JSON.stringify({
          ...newEntry,
          awsConfig: state.awsConfig,
        }),
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

  const updateAwsConfig = (partial: Partial<AwsCloudConfig>) => {
    setState((prev) => ({
      ...prev,
      awsConfig: { ...prev.awsConfig, ...partial },
    }));
  };

  const syncWithAwsCloud = async (): Promise<{
    synced: boolean;
    message: string;
  }> => {
    try {
      const res = await fetch('/api/aws/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entityType: 'VAULT_SNAPSHOT',
          entityId: state.profile.email,
          payload: {
            transactionCount: state.transactions.length,
            budgetCount: state.budgets.length,
            pendingSplitsCount: state.pendingCollections.length,
            cryptDirectoryCount: state.cryptDirectory.length,
            activeCryptHandle: state.profile.cryptHandle,
            totalInrTracked: formatINR(184500),
          },
          awsConfig: state.awsConfig,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        return {
          synced: true,
          message:
            data.mode === 'AWS_CLOUD'
              ? `Synced Vault to AWS DynamoDB (${data.tableName})`
              : `Saved Snapshot to Hybrid Vault (${data.tableName} Ready)`,
        };
      }
      return { synced: false, message: 'Local Vault Snapshot Saved' };
    } catch {
      return { synced: true, message: 'Hybrid Local Vault Synced' };
    }
  };

  const resetDemoVault = () => {
    localStorage.removeItem(STORAGE_KEY);
    setState(DEFAULT_STATE);
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
        updateAwsConfig,
        syncWithAwsCloud,
        resetDemoVault,
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
