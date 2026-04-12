'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { cn } from '~/lib/utils';
import { Home } from 'lucide-react';
import { useEffect, useState } from 'react';

export function Navbar() {
  const pathname = usePathname();
  const [show, setShow] = useState(true);

  useEffect(() => {
    if (pathname.includes('/simulacion') || pathname.includes('/result')) {
      setShow(false);
    } else {
      setShow(true);
    }
  }, [pathname]);

  if (!show) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-surface border-t border-border z-50">
      <div className="container mx-auto max-w-4xl">
        <div className="flex justify-center">
          <Link
            href="/"
            className={cn(
              'flex flex-col items-center py-3 px-8',
              pathname === '/' ? 'text-primary' : 'text-text-muted'
            )}
          >
            <Home className="h-6 w-6" />
            <span className="text-xs mt-1 font-medium">Inicio</span>
          </Link>
        </div>
      </div>
    </nav>
  );
}