import { APP_CONFIG, type HistoryItem, type Settings, type Theme } from './config';

const defaultSettings: Settings = { theme: 'dark', notifications: true };

export function getSettings(): Settings {
  if (typeof window === 'undefined') return defaultSettings;
  try {
    const stored = localStorage.getItem(APP_CONFIG.settingsKey);
    return stored ? { ...defaultSettings, ...JSON.parse(stored) } : defaultSettings;
  } catch {
    return defaultSettings;
  }
}

export function saveSettings(settings: Partial<Settings>): Settings {
  const merged = { ...getSettings(), ...settings };
  localStorage.setItem(APP_CONFIG.settingsKey, JSON.stringify(merged));
  return merged;
}

export function getHistory(): HistoryItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(APP_CONFIG.historyKey);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function addHistoryItem(item: Omit<HistoryItem, 'id' | 'date'>): HistoryItem {
  const history = getHistory();
  const entry: HistoryItem = {
    ...item,
    id: crypto.randomUUID(),
    date: new Date().toISOString(),
  };
  history.unshift(entry);
  if (history.length > APP_CONFIG.maxHistoryItems) history.pop();
  localStorage.setItem(APP_CONFIG.historyKey, JSON.stringify(history));
  return entry;
}

export function deleteHistoryItem(id: string): HistoryItem[] {
  const history = getHistory().filter((item) => item.id !== id);
  localStorage.setItem(APP_CONFIG.historyKey, JSON.stringify(history));
  return history;
}

export function clearHistory(): void {
  localStorage.removeItem(APP_CONFIG.historyKey);
}

export function getHistoryStats() {
  const history = getHistory();
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
