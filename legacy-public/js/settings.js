import { getSettings, saveSettings, clearHistory, getHistoryStats } from './storage.js';
import { toggleTheme, showToast, APP_CONFIG } from './ui.js';

export function initSettings() {
  const themeToggle = document.getElementById('themeToggle');
  const clearHistoryBtn = document.getElementById('settingsClearHistory');
  const appVersion = document.getElementById('appVersion');
  const modelVersion = document.getElementById('modelVersion');
  const scanCount = document.getElementById('scanCount');

  if (appVersion) appVersion.textContent = APP_CONFIG.version;
  if (modelVersion) modelVersion.textContent = APP_CONFIG.modelVersion;
  if (scanCount) scanCount.textContent = getHistoryStats().total;

  const settings = getSettings();
  if (themeToggle) {
    themeToggle.checked = settings.theme === 'light';
    themeToggle.addEventListener('change', () => {
      const theme = toggleTheme();
      showToast(`Switched to ${theme} mode`);
    });
  }

  clearHistoryBtn?.addEventListener('click', () => {
    if (confirm('Clear all scan history?')) {
      clearHistory();
      if (scanCount) scanCount.textContent = '0';
      showToast('History cleared');
    }
  });
}
