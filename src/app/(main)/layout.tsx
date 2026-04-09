import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';
import { Navbar } from '~/components/layout/navbar';
import { db } from '~/server/db';

export default async function MainLayout({ children }: { children: ReactNode }) {
  const { userId } = await auth();
  
  if (!userId) {
    redirect('/sign-in');
  }

  // Ensure user exists in DB
  await db.user.upsert({
    where: { id: userId },
    create: { id: userId, email: '' },
    update: {},
  });

  return (
    <div className="min-h-screen bg-bg">
      <Navbar />
      <main className="container mx-auto max-w-4xl p-4 pb-24">
        {children}
      </main>
    </div>
  );
}