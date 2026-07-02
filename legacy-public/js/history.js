import { getHistory, deleteHistoryItem, clearHistory, getHistoryStats } from './storage.js';
import { formatDate, formatTime, escapeHtml, showToast } from './ui.js';

export function initHistory() {
  const list = document.getElementById('historyList');
  const searchInput = document.getElementById('historySearch');
  const clearAllBtn = document.getElementById('clearAllBtn');
  const emptyState = document.getElementById('historyEmpty');
  const statsEl = document.getElementById('historyStats');

  if (!list) return;

  function render(filter = '') {
    let history = getHistory();
    const q = filter.toLowerCase().trim();
    if (q) {
      history = history.filter(
        (h) =>
          h.prediction.toLowerCase().includes(q) ||
          h.fileName?.toLowerCase().includes(q) ||
          formatDate(h.date).toLowerCase().includes(q)
      );
    }

    const stats = getHistoryStats();
    if (statsEl) {
      statsEl.innerHTML = `
        <div class="stat-pill"><span class="stat-num">${stats.total}</span><span>Total Scans</span></div>
        <div class="stat-pill stat-real"><span class="stat-num">${stats.realCount}</span><span>Real</span></div>
        <div class="stat-pill stat-ai"><span class="stat-num">${stats.aiCount}</span><span>AI</span></div>
        <div class="stat-pill"><span class="stat-num">${stats.avgConfidence}%</span><span>Avg Confidence</span></div>`;
    }

    if (history.length === 0) {
      list.innerHTML = '';
      if (emptyState) emptyState.hidden = !!q;
      return;
    }
    if (emptyState) emptyState.hidden = true;

    list.innerHTML = history
      .map(
        (item) => `
      <article class="history-item glass-card reveal" data-id="${item.id}">
        <img src="${item.thumbnail}" alt="" class="history-thumb" loading="lazy">
        <div class="history-info">
          <span class="history-pred ${item.isAI ? 'pred-ai' : 'pred-real'}">${escapeHtml(item.prediction)}</span>
          <span class="history-conf">${item.confidence}% confidence</span>
          <span class="history-file">${escapeHtml(item.fileName || 'Image')}</span>
          <span class="history-date">${formatDate(item.date)} · ${formatTime(item.date)}</span>
        </div>
        <button class="btn-icon delete-btn" aria-label="Delete scan" data-id="${item.id}">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14z"/></svg>
        </button>
      </article>`
      )
      .join('');

    list.querySelectorAll('.delete-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        deleteHistoryItem(btn.dataset.id);
        showToast('Scan removed from history');
        render(searchInput?.value || '');
      });
    });

    requestAnimationFrame(() => {
      list.querySelectorAll('.reveal').forEach((el, i) => {
        setTimeout(() => el.classList.add('revealed'), i * 50);
      });
    });
  }

  searchInput?.addEventListener('input', (e) => render(e.target.value));
  clearAllBtn?.addEventListener('click', () => {
    if (getHistory().length && confirm('Clear all scan history? This cannot be undone.')) {
      clearHistory();
      showToast('History cleared');
      render();
    }
  });

  render();

  if (getHistory().length === 0 && emptyState) {
    emptyState.hidden = false;
  }
}
