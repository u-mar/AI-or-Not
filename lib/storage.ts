import { APP_CONFIG, type HistoryItem, type Settings, type Theme } from './config';
import { getSession } from './auth';

const defaultSettings: Settings = { theme: 'light', notifications: true };

function hasWindow() {
  return typeof window !== 'undefined';
}

function readLocalSettings(): Settings {
  if (!hasWindow()) return defaultSettings;
  try {
    const stored = localStorage.getItem(APP_CONFIG.settingsKey);
    return stored ? { ...defaultSettings, ...JSON.parse(stored) } : defaultSettings;
  } catch {
    return defaultSettings;
  }
}

function writeLocalSettings(settings: Settings) {
  if (!hasWindow()) return;
  localStorage.setItem(APP_CONFIG.settingsKey, JSON.stringify(settings));
}

function readLocalHistory(): HistoryItem[] {
  if (!hasWindow()) return [];
  try {
    const stored = localStorage.getItem(APP_CONFIG.historyKey);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function writeLocalHistory(history: HistoryItem[]) {
  if (!hasWindow()) return;
  localStorage.setItem(APP_CONFIG.historyKey, JSON.stringify(history));
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

function isSignedIn() {
  return hasWindow() && !!getSession();
}

export function getSettings(): Settings {
  return readLocalSettings();
}

export async function loadSettings(): Promise<Settings> {
  if (!isSignedIn()) return readLocalSettings();

  try {
    const { settings } = await jsonFetch<{ settings: Settings }>('/api/settings', { method: 'GET' });
    writeLocalSettings(settings);
    return settings;
  } catch {
    return readLocalSettings();
  }
}

export async function saveSettings(settings: Partial<Settings>): Promise<Settings> {
  const optimistic = { ...readLocalSettings(), ...settings };
  writeLocalSettings(optimistic);

  if (!isSignedIn()) return optimistic;

  try {
    const { settings: saved } = await jsonFetch<{ settings: Settings }>('/api/settings', {
      method: 'PATCH',
      body: JSON.stringify(settings),
    });
    writeLocalSettings(saved);
    return saved;
  } catch {
    return optimistic;
  }
}

export function getHistory(): HistoryItem[] {
  return readLocalHistory();
}

export async function loadHistory(): Promise<HistoryItem[]> {
  if (!isSignedIn()) return readLocalHistory();

  try {
    const { history } = await jsonFetch<{ history: HistoryItem[] }>('/api/history', { method: 'GET' });
    writeLocalHistory(history);
    return history;
  } catch {
    return readLocalHistory();
  }
}

export async function addHistoryItem(item: Omit<HistoryItem, 'id' | 'date'>): Promise<HistoryItem> {
  if (!isSignedIn()) {
    const history = readLocalHistory();
    const entry: HistoryItem = {
      ...item,
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
    };
    history.unshift(entry);
    if (history.length > APP_CONFIG.maxHistoryItems) history.pop();
    writeLocalHistory(history);
    return entry;
  }

  try {
    const { item: saved } = await jsonFetch<{ item: HistoryItem }>('/api/history', {
      method: 'POST',
      body: JSON.stringify(item),
    });
    const next = [saved, ...readLocalHistory().filter((historyItem) => historyItem.id !== saved.id)];
    writeLocalHistory(next.slice(0, APP_CONFIG.maxHistoryItems));
    return saved;
  } catch {
    const history = readLocalHistory();
    const entry: HistoryItem = {
      ...item,
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
    };
    history.unshift(entry);
    if (history.length > APP_CONFIG.maxHistoryItems) history.pop();
    writeLocalHistory(history);
    return entry;
  }
}

export async function deleteHistoryItem(id: string): Promise<HistoryItem[]> {
  const next = readLocalHistory().filter((item) => item.id !== id);
  writeLocalHistory(next);

  if (isSignedIn()) {
    try {
      await jsonFetch(`/api/history/${id}`, { method: 'DELETE' });
    } catch {
      // Keep local deletion even if the network request fails.
    }
  }

  return next;
}

export async function clearHistory(): Promise<void> {
  if (hasWindow()) {
    localStorage.removeItem(APP_CONFIG.historyKey);
  }

  if (isSignedIn()) {
    try {
      await jsonFetch('/api/history', { method: 'DELETE' });
    } catch {
      // Local clear is still useful even when remote sync fails.
    }
  }
}

export function getHistoryStats(history = readLocalHistory()) {
  const total = history.length;
  const aiCount = history.filter((h) => h.isAI).length;
  const realCount = total - aiCount;
  const avgConfidence = total
    ? Math.round(history.reduce((sum, h) => sum + h.confidence, 0) / total)
    : 0;
  return { total, aiCount, realCount, avgConfidence };
}

export function applyTheme(theme: Theme): void {
  document.documentElement.setAttribute('data-theme', theme);
}
