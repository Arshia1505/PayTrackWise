export interface Session {
  token: string;
  email: string;
  name: string;
  onboarded: boolean;
}

const KEY = 'finshield_session_v1';

export function readSession(): Session | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Session;
    if (!parsed?.token || !parsed.email) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writeSession(session: Session) {
  localStorage.setItem(KEY, JSON.stringify(session));
}

export function clearSession() {
  localStorage.removeItem(KEY);
}

export function markSessionOnboarded() {
  const current = readSession();
  if (!current) return;
  writeSession({ ...current, onboarded: true });
}
