'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import {
  getSession,
  hydrateSession,
  isMobileDevice,
  login as authLogin,
  logout as authLogout,
  register as authRegister,
  type Session,
} from '@/lib/auth';

interface AuthContextValue {
  session: Session | null;
  isMobile: boolean;
  needsLogin: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<string | null>;
  register: (name: string, email: string, password: string) => Promise<string | null>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setIsMobile(isMobileDevice());
    setSession(getSession());
    hydrateSession()
      .then((nextSession) => setSession(nextSession))
      .finally(() => setLoading(false));

    const onResize = () => setIsMobile(isMobileDevice());
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const result = await authLogin(email, password);
    if (!result.ok) return result.error;
    setSession(result.session);
    return null;
  }, []);

  const register = useCallback(async (name: string, email: string, password: string) => {
    const result = await authRegister(name, email, password);
    if (!result.ok) return result.error;
    setSession(result.session);
    return null;
  }, []);

  const logout = useCallback(() => {
    void authLogout();
    setSession(null);
  }, []);

  const needsLogin = isMobile && !loading && !session;

  return (
    <AuthContext.Provider value={{ session, isMobile, needsLogin, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
