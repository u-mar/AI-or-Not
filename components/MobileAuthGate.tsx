'use client';

import { useAuth } from './AuthProvider';
import MobileLoginScreen from './MobileLoginScreen';

export default function MobileAuthGate({ children }: { children: React.ReactNode }) {
  const { needsLogin, loading } = useAuth();

  if (loading) {
    return (
      <div className="auth-loading">
        <div className="auth-loading-spinner" aria-label="Loading" />
      </div>
    );
  }

  if (needsLogin) {
    return <MobileLoginScreen />;
  }

  return <>{children}</>;
}
