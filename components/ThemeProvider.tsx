'use client';

import { useEffect } from 'react';
import { applyTheme, getSettings, loadSettings } from '@/lib/storage';

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    applyTheme(getSettings().theme);
    void loadSettings().then((settings) => applyTheme(settings.theme));
  }, []);

  return <>{children}</>;
}
