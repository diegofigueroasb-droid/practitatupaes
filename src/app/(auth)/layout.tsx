import { ClerkProvider } from '@clerk/nextjs';
import type { ReactNode } from 'react';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <ClerkProvider>
      <div className="min-h-screen bg-bg flex items-center justify-center p-4">
        {children}
      </div>
    </ClerkProvider>
  );
}