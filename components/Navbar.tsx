'use client';

import { usePathname } from 'next/navigation';

const titles: Record<string, string> = {
  '/history': 'History',
  '/settings': 'Settings',
};

export default function Navbar() {
  const pathname = usePathname();
  if (pathname === '/') return null;

  const title = titles[pathname] || 'AI or Not';

  return (
    <header className="app-header" aria-label="Screen header">
      <div className="app-header-inner">
        <h1 className="app-header-title">{title}</h1>
      </div>
    </header>
  );
}
