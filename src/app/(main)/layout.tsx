import type { ReactNode } from 'react';
import { Navbar } from '~/components/layout/navbar';

export default async function MainLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-bg">
      <Navbar />
      <main className="container mx-auto max-w-4xl p-4 pb-24">
        {children}
      </main>
    </div>
  );
}
