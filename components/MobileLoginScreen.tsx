'use client';

import { FormEvent, useState } from 'react';
import { useAuth } from './AuthProvider';

export default function MobileLoginScreen() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const err =
      mode === 'login'
        ? await login(email, password)
        : await register(name, email, password);

    if (err) setError(err);
    setLoading(false);
  };

  return (
    <div className="mobile-login" role="dialog" aria-modal="true" aria-label="Sign in">
      <div className="mobile-login-bg" aria-hidden="true" />
      <div className="mobile-login-card glass-card">
        <div className="mobile-login-header">
          <span className="logo-icon mobile-login-logo" aria-hidden="true">🧠</span>
          <h1>AI or Not</h1>
          <p>Sign in to continue on mobile</p>
        </div>

        <div className="login-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'login'}
            className={mode === 'login' ? 'active' : ''}
            onClick={() => { setMode('login'); setError(''); }}
          >
            Sign In
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'register'}
            className={mode === 'register' ? 'active' : ''}
            onClick={() => { setMode('register'); setError(''); }}
          >
            Register
          </button>
        </div>

        <form onSubmit={onSubmit} className="login-form" noValidate>
          {mode === 'register' && (
            <div className="form-group">
              <label htmlFor="login-name">Name</label>
              <input
                id="login-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                autoComplete="name"
                required
                maxLength={100}
              />
            </div>
          )}
          <div className="form-group">
            <label htmlFor="login-email">Email</label>
            <input
              id="login-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              required
              maxLength={254}
            />
          </div>
          <div className="form-group">
            <label htmlFor="login-password">Password</label>
            <input
              id="login-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={mode === 'register' ? 'Min. 6 characters' : 'Your password'}
              autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
              required
              minLength={6}
            />
          </div>

          {error && (
            <div className="validation-msg error" role="alert">{error}</div>
          )}

          <button type="submit" className="btn btn-primary btn-lg btn-block btn-ripple" disabled={loading}>
            {loading ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <p className="login-note">
          Your account is stored securely on this device. Desktop users can access the app without signing in.
        </p>
      </div>
    </div>
  );
}
