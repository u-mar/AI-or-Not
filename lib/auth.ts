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

async function jsonFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
  });

  const data = (await response.json().catch(() => ({}))) as T & { error?: string };
  if (!response.ok) {
    throw new Error(data.error || 'Request failed');
  }

  return data;
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

function persistSession(session: Session): Session {
  localStorage.setItem(APP_CONFIG.sessionKey, JSON.stringify(session));
  return session;
}

export async function register(
  name: string,
  email: string,
  password: string
): Promise<{ ok: true; session: Session } | { ok: false; error: string }> {
  try {
    const { session } = await jsonFetch<{ session: Session }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    });
    return { ok: true, session: persistSession(session) };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'Registration failed.' };
  }
}

export async function login(
  email: string,
  password: string
): Promise<{ ok: true; session: Session } | { ok: false; error: string }> {
  try {
    const { session } = await jsonFetch<{ session: Session }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    return { ok: true, session: persistSession(session) };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'Login failed.' };
  }
}

export async function hydrateSession(): Promise<Session | null> {
  try {
    const { session } = await jsonFetch<{ session: Session | null }>('/api/auth/session', {
      method: 'GET',
      headers: {},
    });
    if (!session) {
      localStorage.removeItem(APP_CONFIG.sessionKey);
      return null;
    }
    return persistSession(session);
  } catch {
    return getSession();
  }
}

export async function logout(): Promise<void> {
  try {
    await jsonFetch('/api/auth/logout', { method: 'POST', body: JSON.stringify({}) });
  } catch {
    // Ignore network issues and still clear the local session.
  }
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
