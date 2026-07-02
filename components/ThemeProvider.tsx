'use client';

import { useEffect } from 'react';
import { applyTheme, getSettings } from '@/lib/storage';

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    applyTheme(getSettings().theme);
  }, []);

  return <>{children}</>;
}
