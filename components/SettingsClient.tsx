'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { APP_CONFIG } from '@/lib/config';
import { useAuth } from '@/components/AuthProvider';
import {
  applyTheme,
  clearHistory,
  getHistoryStats,
  getSettings,
  saveSettings,
} from '@/lib/storage';
import { useToast } from './useToast';

export default function SettingsClient() {
  const { session, logout } = useAuth();
  const [lightMode, setLightMode] = useState(false);
  const [scanCount, setScanCount] = useState(0);
  const { show, ToastContainer } = useToast();

  useEffect(() => {
    const s = getSettings();
    setLightMode(s.theme === 'light');
    setScanCount(getHistoryStats().total);
  }, []);

  return (
    <>
      <ToastContainer />
      <div className="settings-list">
        {session && (
          <div className="settings-group">
            <h3>Account</h3>
            <div className="setting-item glass-card">
              <div className="setting-info">
                <h4>{session.name}</h4>
                <p>{session.email}</p>
              </div>
            </div>
            <div className="setting-item glass-card">
              <div className="setting-info">
                <h4>Sign Out</h4>
                <p>Log out of your mobile session</p>
              </div>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => {
                  logout();
                  show('Signed out successfully');
                }}
              >
                Sign Out
              </button>
            </div>
          </div>
        )}

        <div className="settings-group">
          <h3>Appearance</h3>
          <div className="setting-item glass-card">
            <div className="setting-info">
              <h4>Light Mode</h4>
              <p>Switch between dark (default) and light themes</p>
            </div>
            <label className="toggle" aria-label="Toggle light mode">
              <input
                type="checkbox"
                checked={lightMode}
                onChange={(e) => {
                  const theme = e.target.checked ? 'light' : 'dark';
                  saveSettings({ theme });
                  applyTheme(theme);
                  setLightMode(e.target.checked);
                  show(`Switched to ${theme} mode`);
                }}
              />
              <span className="toggle-slider" />
            </label>
          </div>
        </div>

        <div className="settings-group">
          <h3>Data</h3>
          <div className="setting-item glass-card">
            <div className="setting-info">
              <h4>Total Scans</h4>
              <p>Number of analyses stored in local history</p>
            </div>
            <span className="setting-value">{scanCount}</span>
          </div>
          <div className="setting-item glass-card">
            <div className="setting-info">
              <h4>Clear History</h4>
              <p>Remove all saved scan records from this device</p>
            </div>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => {
                if (confirm('Clear all scan history?')) {
                  clearHistory();
                  setScanCount(0);
                  show('History cleared');
                }
              }}
            >
              Clear
            </button>
          </div>
        </div>

        <div className="settings-group">
          <h3>About</h3>
          <div className="setting-item glass-card">
            <div className="setting-info"><h4>App Version</h4><p>Current release</p></div>
            <span className="setting-value">{APP_CONFIG.version}</span>
          </div>
          <div className="setting-item glass-card">
            <div className="setting-info"><h4>Model Version</h4><p>Logistic regression model</p></div>
            <span className="setting-value">{APP_CONFIG.modelVersion}</span>
          </div>
          <Link href="/about" className="setting-item glass-card contact-link" style={{ border: 'none' }}>
            <div className="setting-info"><h4>About Project</h4><p>Learn how detection works</p></div>
            <span aria-hidden="true">→</span>
          </Link>
        </div>

        <div className="settings-group" id="privacy">
          <h3>Privacy</h3>
          <div className="setting-item glass-card" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
            <h4 style={{ marginBottom: '0.5rem' }}>Privacy Policy</h4>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', lineHeight: 1.7 }}>
              AI or Not processes images through a prediction API for analysis. Images are not permanently stored on servers.
              Scan history is saved locally in your browser. You can clear all local data anytime from this page.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
