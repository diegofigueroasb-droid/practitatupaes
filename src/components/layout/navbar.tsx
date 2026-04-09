'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '~/lib/utils';
import { Home, History, TrendingUp, User } from 'lucide-react';

const navItems = [
  { href: '/', label: 'Inicio', icon: Home },
  { href: '/historial', label: 'Historial', icon: History },
  { href: '/progreso', label: 'Progreso', icon: TrendingUp },
  { href: '/perfil', label: 'Perfil', icon: User },
];

export function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-surface border-t border-border z-50">
      <div className="container mx-auto max-w-4xl">
        <div className="flex justify-around">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex flex-col items-center py-3 px-4 min-w-[64px]',
                  isActive ? 'text-primary' : 'text-text-muted'
                )}
              >
                <Icon className="h-6 w-6" />
                <span className="text-xs mt-1 font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}