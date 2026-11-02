import { readSession, writeSession, type Session } from '@/lib/session';

export const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://127.0.0.1:8000';
const LOCAL_USERS = 'finshield_local_users_v1';

export interface AccountProfile {
  city: string;
  monthlyIncome: number;
  housingCost: number;
  goalName: string;
  goalTarget: number;
  alerts: boolean;
  onboarded: boolean;
}

export interface AccountTransaction {
  id: string;
  merchant: string;
  category: string;
  date: string;
  time: string;
  amount: number;
  type: 'debit' | 'credit';
  paymentMethod?: string;
}

export interface AccountPayload {
  token: string;
  user: { name: string; email: string };
  profile: AccountProfile;
  transactions: AccountTransaction[];
}

interface LocalUser {
  name: string;
  email: string;
  salt: string;
  passwordHash: string;
  profile: AccountProfile;
  transactions: AccountTransaction[];
}

function emptyProfile(): AccountProfile {
  return {
    city: '',
    monthlyIncome: 0,
    housingCost: 0,
    goalName: '',
    goalTarget: 0,
    alerts: true,
    onboarded: false,
  };
}

async function digest(value: string) {
  const bytes = new TextEncoder().encode(value);
  const buf = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

function readLocalUsers(): LocalUser[] {
  try {
    const raw = localStorage.getItem(LOCAL_USERS);
    return raw ? (JSON.parse(raw) as LocalUser[]) : [];
  } catch {
    return [];
  }
}

function writeLocalUsers(users: LocalUser[]) {
  localStorage.setItem(LOCAL_USERS, JSON.stringify(users));
}

function toPayload(user: LocalUser, token: string): AccountPayload {
  return {
    token,
    user: { name: user.name, email: user.email },
    profile: user.profile,
    transactions: user.transactions,
  };
}

async function remote<T>(path: string, init: RequestInit): Promise<T> {
  const response = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
  });
  const data = (await response.json().catch(() => ({}))) as T & { detail?: string };
  if (!response.ok) {
    const message = typeof data.detail === 'string' ? data.detail : 'Request failed';
    throw Object.assign(new Error(message), { status: response.status });
  }
  return data;
}

function saveSession(payload: AccountPayload): Session {
  const session: Session = {
    token: payload.token,
    email: payload.user.email,
    name: payload.user.name,
    onboarded: payload.profile.onboarded,
  };
  writeSession(session);
  return session;
}

export async function signUp(input: { name: string; email: string; password: string }) {
  const email = input.email.trim().toLowerCase();
  const name = input.name.trim();
  try {
    const payload = await remote<AccountPayload>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ name, email, password: input.password }),
    });
    saveSession(payload);
    return payload;
  } catch (error) {
    const status = (error as { status?: number }).status;
    if (status) throw error;
    const users = readLocalUsers();
    if (users.some((user) => user.email === email)) {
      throw new Error('An account with that email already exists');
    }
    const salt = crypto.randomUUID();
    const user: LocalUser = {
      name,
      email,
      salt,
      passwordHash: await digest(`${salt}:${input.password}`),
      profile: emptyProfile(),
      transactions: [],
    };
    writeLocalUsers([...users, user]);
    const payload = toPayload(user, `local.${email}`);
    saveSession(payload);
    return payload;
  }
}

export async function signIn(input: { email: string; password: string }) {
  const email = input.email.trim().toLowerCase();
  try {
    const payload = await remote<AccountPayload>('/auth/signin', {
      method: 'POST',
      body: JSON.stringify({ email, password: input.password }),
    });
    saveSession(payload);
    return payload;
  } catch (error) {
    const status = (error as { status?: number }).status;
    if (status) throw error;
    const user = readLocalUsers().find((item) => item.email === email);
    if (!user || user.passwordHash !== (await digest(`${user.salt}:${input.password}`))) {
      throw new Error('Email or password is incorrect');
    }
    const payload = toPayload(user, `local.${email}`);
    saveSession(payload);
    return payload;
  }
}

export async function saveOnboarding(input: {
  name: string;
  city: string;
  monthlyIncome: number;
  housingCost: number;
  goalName: string;
  goalTarget: number;
  alerts: boolean;
}) {
  const session = readSession();
  if (!session) throw new Error('Sign in before continuing');
  if (session.token.startsWith('local.')) {
    const users = readLocalUsers();
    const next = users.map((user) =>
      user.email === session.email
        ? {
            ...user,
            name: input.name.trim() || user.name,
            profile: {
              city: input.city,
              monthlyIncome: input.monthlyIncome,
              housingCost: input.housingCost,
              goalName: input.goalName,
              goalTarget: input.goalTarget,
              alerts: input.alerts,
              onboarded: true,
            },
            transactions:
              input.monthlyIncome > 0
                ? [
                    {
                      id: `tx-${Date.now()}`,
                      merchant: 'Monthly income',
                      category: 'Salary / Income',
                      date: 'Today',
                      time: 'Onboarding',
                      amount: input.monthlyIncome,
                      type: 'credit' as const,
                      paymentMethod: 'Auto-Debit',
                    },
                    ...user.transactions,
                  ]
                : user.transactions,
          }
        : user
    );
    writeLocalUsers(next);
    writeSession({
      ...session,
      name: input.name.trim() || session.name,
      onboarded: true,
    });
    const user = next.find((item) => item.email === session.email)!;
    return toPayload(user, session.token);
  }
  const payload = await remote<AccountPayload>('/onboarding', {
    method: 'PUT',
    headers: { Authorization: `Bearer ${session.token}` },
    body: JSON.stringify(input),
  });
  saveSession(payload);
  return payload;
}

export async function pushTransaction(tx: AccountTransaction) {
  const session = readSession();
  if (!session) return;
  if (session.token.startsWith('local.')) {
    const users = readLocalUsers();
    writeLocalUsers(
      users.map((user) =>
        user.email === session.email ? { ...user, transactions: [tx, ...user.transactions] } : user
      )
    );
    return;
  }
  try {
    await remote('/transactions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${session.token}` },
      body: JSON.stringify(tx),
    });
  } catch {
    // The ledger is already saved on this device.
  }
}
