'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { APP_CONFIG } from '@/lib/config';
import { useAuth } from '@/components/AuthProvider';
import {
  applyTheme,
  clearHistory,
  getHistory,
  getHistoryStats,
  getSettings,
  saveSettings,
} from '@/lib/storage';
import { useToast } from './useToast';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export default function SettingsClient() {
  const { session, logout } = useAuth();
  const [darkMode, setDarkMode] = useState(false);
  const [stats, setStats] = useState({ total: 0, aiCount: 0, realCount: 0, avgConfidence: 0 });
  const [recentScans, setRecentScans] = useState(getHistory().slice(0, 3));
  const { show, ToastContainer } = useToast();

  useEffect(() => {
    const s = getSettings();
    setDarkMode(s.theme === 'dark');
    setStats(getHistoryStats());
    setRecentScans(getHistory().slice(0, 3));
  }, []);

  const initial = session?.name?.charAt(0).toUpperCase() || '?';

  return (
    <>
      <ToastContainer />
      <div className="settings-page">
        {/* Profile */}
        <div className="settings-profile glass-card">
          <div className="settings-avatar" aria-hidden="true">{initial}</div>
          <div className="settings-profile-info">
            <h2>{session?.name || 'Guest'}</h2>
            <p>{session?.email || 'Not signed in'}</p>
          </div>
        </div>

        {/* Stats */}
        <div className="settings-stats">
          <div className="settings-stat glass-card">
            <span className="settings-stat-value">{stats.total}</span>
            <span className="settings-stat-label">Scans</span>
          </div>
          <div className="settings-stat glass-card stat-real">
            <span className="settings-stat-value">{stats.realCount}</span>
            <span className="settings-stat-label">Real</span>
          </div>
          <div className="settings-stat glass-card stat-ai">
            <span className="settings-stat-value">{stats.aiCount}</span>
            <span className="settings-stat-label">AI</span>
          </div>
        </div>

        {/* History section */}
        <section className="settings-section">
          <div className="settings-section-header">
            <h3>History</h3>
            <Link href="/history" className="settings-link">View all</Link>
          </div>
          {recentScans.length === 0 ? (
            <div className="settings-empty glass-card">
              <p>No scans yet</p>
              <Link href="/" className="btn btn-primary btn-sm">Analyze Image</Link>
            </div>
          ) : (
            <div className="settings-recent">
              {recentScans.map((scan) => (
                <div key={scan.id} className="settings-recent-item glass-card">
                  <img src={scan.thumbnail} alt="" className="settings-recent-thumb" />
                  <div className="settings-recent-info">
                    <span className={`history-pred ${scan.isAI ? 'pred-ai' : 'pred-real'}`}>
                      {scan.prediction}
                    </span>
                    <span className="settings-recent-meta">
                      {scan.confidence}% · {formatDate(scan.date)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Preferences */}
        <section className="settings-section">
          <h3>Preferences</h3>
          <div className="settings-menu glass-card">
            <div className="settings-menu-item">
              <div className="settings-menu-icon" aria-hidden="true">🌙</div>
              <div className="settings-menu-text">
                <span>Dark Mode</span>
                <small>Switch to dark theme</small>
              </div>
              <label className="toggle" aria-label="Toggle dark mode">
                <input
                  type="checkbox"
                  checked={darkMode}
                  onChange={(e) => {
                    const theme = e.target.checked ? 'dark' : 'light';
                    saveSettings({ theme });
                    applyTheme(theme);
                    setDarkMode(e.target.checked);
                  }}
                />
                <span className="toggle-slider" />
              </label>
            </div>
          </div>
        </section>

        {/* Data */}
        <section className="settings-section">
          <h3>Data</h3>
          <div className="settings-menu glass-card">
            <button
              type="button"
              className="settings-menu-item settings-menu-btn"
              onClick={() => {
                if (confirm('Clear all scan history?')) {
                  clearHistory();
                  setStats(getHistoryStats());
                  setRecentScans([]);
                  show('History cleared');
                }
              }}
            >
              <div className="settings-menu-icon" aria-hidden="true">🗑️</div>
              <div className="settings-menu-text">
                <span>Clear History</span>
                <small>Remove all saved scans</small>
              </div>
              <span className="settings-chevron" aria-hidden="true">›</span>
            </button>
          </div>
        </section>

        {/* Account */}
        {session && (
          <section className="settings-section">
            <h3>Account</h3>
            <div className="settings-menu glass-card">
              <button
                type="button"
                className="settings-menu-item settings-menu-btn danger"
                onClick={() => {
                  logout();
                  show('Signed out');
                }}
              >
                <div className="settings-menu-icon" aria-hidden="true">🚪</div>
                <div className="settings-menu-text">
                  <span>Sign Out</span>
                  <small>Log out of this device</small>
                </div>
                <span className="settings-chevron" aria-hidden="true">›</span>
              </button>
            </div>
          </section>
        )}

        {/* App info */}
        <section className="settings-section">
          <h3>About</h3>
          <div className="settings-menu glass-card">
            <div className="settings-menu-item">
              <div className="settings-menu-icon" aria-hidden="true">📱</div>
              <div className="settings-menu-text">
                <span>App Version</span>
                <small>AI or Not PWA</small>
              </div>
              <span className="setting-value">{APP_CONFIG.version}</span>
            </div>
            <div className="settings-menu-item">
              <div className="settings-menu-icon" aria-hidden="true">🔬</div>
              <div className="settings-menu-text">
                <span>Detection Engine</span>
                <small>Advanced AI vision analysis</small>
              </div>
              <span className="setting-value">v{APP_CONFIG.modelVersion}</span>
            </div>
          </div>
        </section>

        <p className="settings-privacy">
          Images are analyzed via API and not stored on servers. All scan history stays on this device.
        </p>
      </div>
    </>
  );
}
