'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  clearHistory,
  deleteHistoryItem,
  getHistory,
  getHistoryStats,
} from '@/lib/storage';
import type { HistoryItem } from '@/lib/config';
import { useToast } from './useToast';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

export default function HistoryClient() {
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [query, setQuery] = useState('');
  const [stats, setStats] = useState(getHistoryStats());
  const { show, ToastContainer } = useToast();

  const refresh = (filter = query) => {
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
    setItems(history);
    setStats(getHistoryStats());
  };

  useEffect(() => {
    refresh('');
  }, []);

  return (
    <>
      <ToastContainer />
      <div className="history-stats" aria-label="History statistics">
        <div className="stat-pill"><span className="stat-num">{stats.total}</span><span>Total Scans</span></div>
        <div className="stat-pill stat-real"><span className="stat-num">{stats.realCount}</span><span>Real</span></div>
        <div className="stat-pill stat-ai"><span className="stat-num">{stats.aiCount}</span><span>AI</span></div>
        <div className="stat-pill"><span className="stat-num">{stats.avgConfidence}%</span><span>Avg Confidence</span></div>
      </div>

      <div className="history-toolbar">
        <input
          type="search"
          className="history-search"
          placeholder="Search by prediction, filename, or date..."
          aria-label="Search history"
          value={query}
          onChange={(e) => { setQuery(e.target.value); refresh(e.target.value); }}
        />
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => {
            if (getHistory().length && confirm('Clear all scan history?')) {
              clearHistory();
              show('History cleared');
              refresh('');
            }
          }}
        >
          Clear All
        </button>
      </div>

      {items.length === 0 && !query && (
        <div className="empty-state glass-card">
          <div className="empty-state-icon" aria-hidden="true">📭</div>
          <h3>No scans yet</h3>
          <p>Upload an image in the detector to start building your history.</p>
          <Link href="/detector" className="btn btn-primary btn-ripple" style={{ marginTop: '1rem' }}>Analyze Image</Link>
        </div>
      )}

      <div className="history-list" role="list" aria-label="Scan history">
        {items.map((item) => (
          <article key={item.id} className="history-item glass-card reveal revealed" role="listitem">
            <img src={item.thumbnail} alt="" className="history-thumb" loading="lazy" />
            <div className="history-info">
              <span className={`history-pred ${item.isAI ? 'pred-ai' : 'pred-real'}`}>{item.prediction}</span>
              <span className="history-conf">{item.confidence}% confidence</span>
              <span className="history-file">{item.fileName || 'Image'}</span>
              <span className="history-date">{formatDate(item.date)} · {formatTime(item.date)}</span>
            </div>
            <button
              type="button"
              className="btn-icon delete-btn"
              aria-label="Delete scan"
              onClick={() => {
                deleteHistoryItem(item.id);
                show('Scan removed');
                refresh();
              }}
            >
              ✕
            </button>
          </article>
        ))}
      </div>
    </>
  );
}
