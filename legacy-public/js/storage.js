import { APP_CONFIG } from './config.js';

const defaultSettings = {
  theme: 'dark',
  notifications: true
};

export function getSettings() {
  try {
    const stored = localStorage.getItem(APP_CONFIG.settingsKey);
    return stored ? { ...defaultSettings, ...JSON.parse(stored) } : { ...defaultSettings };
  } catch {
    return { ...defaultSettings };
  }
}

export function saveSettings(settings) {
  const merged = { ...getSettings(), ...settings };
  localStorage.setItem(APP_CONFIG.settingsKey, JSON.stringify(merged));
  return merged;
}

export function getHistory() {
  try {
    const stored = localStorage.getItem(APP_CONFIG.historyKey);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function addHistoryItem(item) {
  const history = getHistory();
  const entry = {
    id: crypto.randomUUID(),
    thumbnail: item.thumbnail,
    prediction: item.prediction,
    isAI: item.isAI,
    confidence: item.confidence,
    model: item.model,
    duration: item.duration,
    fileName: item.fileName,
    date: new Date().toISOString()
  };
  history.unshift(entry);
  if (history.length > APP_CONFIG.maxHistoryItems) history.pop();
  localStorage.setItem(APP_CONFIG.historyKey, JSON.stringify(history));
  return entry;
}

export function deleteHistoryItem(id) {
  const history = getHistory().filter((item) => item.id !== id);
  localStorage.setItem(APP_CONFIG.historyKey, JSON.stringify(history));
  return history;
}

export function clearHistory() {
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
