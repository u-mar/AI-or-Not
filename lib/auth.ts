import { APP_CONFIG } from './config';

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  createdAt: string;
}

export interface Session {
  userId: string;
  name: string;
  email: string;
  expiresAt: string;
}

async function hashPassword(password: string): Promise<string> {
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const data = new TextEncoder().encode(password);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hash))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }
  return btoa(password);
}

function getUsers(): User[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(APP_CONFIG.usersKey);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveUsers(users: User[]): void {
  localStorage.setItem(APP_CONFIG.usersKey, JSON.stringify(users));
}

export function getSession(): Session | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(APP_CONFIG.sessionKey);
    if (!raw) return null;
    const session: Session = JSON.parse(raw);
    if (new Date(session.expiresAt) < new Date()) {
      localStorage.removeItem(APP_CONFIG.sessionKey);
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

export function isAuthenticated(): boolean {
  return getSession() !== null;
}

function createSession(user: User): Session {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + APP_CONFIG.sessionDays);
  const session: Session = {
    userId: user.id,
    name: user.name,
    email: user.email,
    expiresAt: expiresAt.toISOString(),
  };
  localStorage.setItem(APP_CONFIG.sessionKey, JSON.stringify(session));
  return session;
}

export async function register(
  name: string,
  email: string,
  password: string
): Promise<{ ok: true; session: Session } | { ok: false; error: string }> {
  const trimmedName = name.trim();
  const trimmedEmail = email.trim().toLowerCase();

  if (!trimmedName || trimmedName.length < 2) {
    return { ok: false, error: 'Name must be at least 2 characters.' };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
    return { ok: false, error: 'Please enter a valid email address.' };
  }
  if (password.length < 6) {
    return { ok: false, error: 'Password must be at least 6 characters.' };
  }

  const users = getUsers();
  if (users.some((u) => u.email === trimmedEmail)) {
    return { ok: false, error: 'An account with this email already exists.' };
  }

  const user: User = {
    id: crypto.randomUUID(),
    name: trimmedName,
    email: trimmedEmail,
    passwordHash: await hashPassword(password),
    createdAt: new Date().toISOString(),
  };

  saveUsers([...users, user]);
  const session = createSession(user);
  return { ok: true, session };
}

export async function login(
  email: string,
  password: string
): Promise<{ ok: true; session: Session } | { ok: false; error: string }> {
  const trimmedEmail = email.trim().toLowerCase();
  const users = getUsers();
  const user = users.find((u) => u.email === trimmedEmail);

  if (!user) {
    return { ok: false, error: 'No account found with this email.' };
  }

  const passwordHash = await hashPassword(password);
  if (user.passwordHash !== passwordHash) {
    return { ok: false, error: 'Incorrect password.' };
  }

  const session = createSession(user);
  return { ok: true, session };
}

export function logout(): void {
  localStorage.removeItem(APP_CONFIG.sessionKey);
}

export function isMobileDevice(): boolean {
  if (typeof window === 'undefined') return false;

  const ua = navigator.userAgent || '';
  const mobileUa = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
  const narrow = window.matchMedia('(max-width: 768px)').matches;
  const touch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  const standalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true;

  return (mobileUa || standalone) && (narrow || touch || standalone);
}
