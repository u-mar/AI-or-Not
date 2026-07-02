'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { IconDetect, IconHistory, IconSettings } from './icons';

const tabs = [
  { href: '/', label: 'Detect', Icon: IconDetect },
  { href: '/history', label: 'History', Icon: IconHistory },
  { href: '/settings', label: 'Settings', Icon: IconSettings },
];

export default function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="bottom-nav" aria-label="App navigation">
      {tabs.map(({ href, label, Icon }) => {
        const active = href === '/' ? pathname === '/' : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={`bottom-nav-item${active ? ' active' : ''}`}
            aria-current={active ? 'page' : undefined}
          >
            <span className="bottom-nav-icon"><Icon active={active} /></span>
            <span className="bottom-nav-label">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
