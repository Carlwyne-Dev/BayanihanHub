'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Grid2x2, Map, HeartHandshake, User, CirclePlus } from 'lucide-react';

const navItems = [
  { href: '/feed',      label: 'Feed',   icon: Grid2x2      },
  { href: '/map',       label: 'Map',    icon: Map          },
  { href: '/ask',       label: 'Post',   icon: HeartHandshake },
  { href: '/profile',   label: 'Profile', icon: User         },
];

export function BottomNav() {
  const pathname = usePathname();

  if (pathname === '/') return null;

  return (
    <nav
      className="fixed bottom-4 left-4 right-4 md:hidden z-[9999] flex justify-around items-center h-16 px-2 rounded-2xl shadow-lg border border-outline-variant"
      style={{ background: 'rgba(252,249,246,0.95)', backdropFilter: 'blur(12px)' }}
      role="navigation"
      aria-label="Main navigation"
    >
      {navItems.map(({ href, label, icon: Icon }) => {
        const isActive = pathname === href || (href !== '/' && pathname.startsWith(href));
        return (
          <Link
            key={href}
            href={href}
            className={`flex flex-col items-center justify-center w-16 h-full rounded-xl transition-all duration-200 active:scale-90 ${
              isActive
                ? 'text-primary font-bold'
                : 'text-on-surface-variant hover:bg-surface-container-low'
            }`}
            aria-label={label}
            aria-current={isActive ? 'page' : undefined}
          >
            <Icon
              size={24}
              strokeWidth={isActive ? 2.4 : 1.8}
              className="mb-1"
            />
            <span className="text-[11px] font-semibold tracking-wide">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
