# PracticaTuPAES PWA Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a complete PWA for PAES preparation using Next.js 15, tRPC, Prisma + Supabase, and Clerk auth.

**Architecture:** T3 Stack with Next.js App Router, end-to-end typesafe API via tRPC, PostgreSQL via Supabase for persistence, Clerk for authentication, and PWA capabilities.

**Tech Stack:** Next.js 15, TypeScript, Tailwind CSS, shadcn/ui, tRPC, Prisma, Supabase PostgreSQL, Clerk, Vercel

---

## Phase 1: Project Setup

### Task 1: Initialize T3 Stack Project

**Files:**
- Create: `practicatupaes/` (entire T3 scaffold)

- [ ] **Step 1: Create T3 app**

```bash
cd /Users/diegofr/Documents/Proyectos/practicatupaes
npx create-t3-app@latest . --CI --noGit --trpc --prisma --tailwind --appRouter --dbProvider postgresql --authProvider clerk
```

Expected: Project scaffolded with all T3 dependencies

- [ ] **Step 2: Install additional dependencies**

```bash
npm install @clerk/nextjs @supabase/supabase-js next-pwa lucide-react recharts clsx tailwind-merge
npm install -D @types/node
```

- [ ] **Step 3: Configure environment**

Create `.env`:

```env
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres"
CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_WEBHOOK_SECRET=whsec_...
```

- [ ] **Step 4: Update app.json for PWA**

Create `src/app/pwa.ts`:

```typescript
import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'PracticaTuPAES',
    short_name: 'PracticaPAES',
    description: 'Prepárate para la PAES con preguntas oficiales DEMRE',
    start_url: '/',
    display: 'standalone',
    background_color: '#FAFAFA',
    theme_color: '#0F766E',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
  };
}
```

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: scaffold T3 stack project with PWA config"
```

---

### Task 2: Configure Prisma Schema

**Files:**
- Modify: `prisma/schema.prisma`
- Modify: `.env`

- [ ] **Step 1: Write Prisma schema**

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DATABASE_URL")
}

model User {
  id            String          @id @default(cuid())
  email         String          @unique
  name          String?
  image         String?
  sessions      Session[]
  errors        PendingError[]
  createdAt     DateTime        @default(now())
  updatedAt     DateTime        @updatedAt
}

model Session {
  id              String    @id @default(cuid())
  userId          String
  user            User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  subject         String
  mode            String
  questionCount   Int
  correctCount    Int
  incorrectCount  Int
  estimatedScore  Int
  answers         Json
  questions       Json
  createdAt       DateTime  @default(now())

  @@index([userId])
  @@index([userId, createdAt])
}

model PendingError {
  id                  String    @id @default(cuid())
  userId              String
  user                User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  questionId          String
  question            Json
  selectedAlternative String
  correctAlternative  String
  reviewCount         Int       @default(1)
  resolved            Boolean   @default(false)
  lastSeenAt          DateTime  @default(now())
  createdAt           DateTime  @default(now())

  @@unique([userId, questionId])
  @@index([userId])
}

model Question {
  id                       String   @id @default(cuid())
  subject                  String
  prompt                   String
  alternatives             Json
  correctAlternative       String
  explanationsByAlternative Json
  createdAt                DateTime @default(now())

  @@index([subject])
}
```

- [ ] **Step 2: Generate Prisma client**

```bash
npx prisma generate
```

Expected: Prisma Client generated successfully

- [ ] **Step 3: Commit**

```bash
git add prisma/schema.prisma .env.example
git commit -m "feat: add Prisma schema for Session, User, Question, PendingError"
```

---

### Task 3: Create tRPC Routers

**Files:**
- Create: `src/server/api/routers/session.ts`
- Create: `src/server/api/routers/question.ts`
- Create: `src/server/api/routers/error.ts`
- Create: `src/server/api/routers/progress.ts`
- Modify: `src/server/api/root.ts`

- [ ] **Step 1: Create session router**

Create `src/server/api/routers/session.ts`:

```typescript
import { z } from 'zod';
import { createTRPCRouter, protectedProcedure, publicProcedure } from '~/server/api/trpc';

export const sessionRouter = createTRPCRouter({
  create: protectedProcedure
    .input(z.object({
      subject: z.string(),
      mode: z.enum(['Ensayo oficial', 'Repaso errores']),
      questionCount: z.number().min(1).max(65),
    }))
    .mutation(async ({ ctx, input }) => {
      const { subject, mode, questionCount } = input;
      
      let questions;
      
      if (mode === 'Repaso errores') {
        const errors = await ctx.db.pendingError.findMany({
          where: { userId: ctx.auth.userId, resolved: false, question: { path: ['subject'], equals: subject } },
          take: questionCount,
        });
        if (errors.length === 0) {
          throw new Error(`No tienes errores pendientes para ${subject}`);
        }
        questions = errors.map(e => ({ ...(e.question as object), modeSource: mode }));
      } else {
        const dbQuestions = await ctx.db.question.findMany({
          where: { subject },
          take: questionCount,
          orderBy: { createdAt: 'asc' },
        });
        // Randomize
        questions = dbQuestions.sort(() => Math.random() - 0.5).map(q => ({
          id: q.id,
          subject: q.subject,
          prompt: q.prompt,
          alternatives: q.alternatives,
          correctAlternative: q.correctAlternative,
          explanationsByAlternative: q.explanationsByAlternative,
          modeSource: mode,
        }));
      }

      return ctx.db.session.create({
        data: {
          userId: ctx.auth.userId,
          subject,
          mode,
          questionCount: questions.length,
          correctCount: 0,
          incorrectCount: 0,
          estimatedScore: 0,
          answers: [],
          questions,
        },
      });
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.session.findFirst({
        where: { id: input.id, userId: ctx.auth.userId },
      });
    }),

  getRecent: protectedProcedure
    .input(z.object({ limit: z.number().default(10) }))
    .query(async ({ ctx, input }) => {
      return ctx.db.session.findMany({
        where: { userId: ctx.auth.userId },
        orderBy: { createdAt: 'desc' },
        take: input.limit,
      });
    }),

  complete: protectedProcedure
    .input(z.object({
      id: z.string(),
      answers: z.array(z.object({
        questionId: z.string(),
        selectedAlternative: z.string(),
        isCorrect: z.boolean(),
      })),
    }))
    .mutation(async ({ ctx, input }) => {
      const session = await ctx.db.session.findFirst({
        where: { id: input.id, userId: ctx.auth.userId },
      });
      if (!session) throw new Error('Sesión no encontrada');

      const correctCount = input.answers.filter(a => a.isCorrect).length;
      const incorrectCount = input.answers.length - correctCount;
      const percentage = (correctCount / input.answers.length) * 100;
      const estimatedScore = Math.round(150 + (percentage / 100) * 700);

      // Update pending errors
      for (const answer of input.answers) {
        if (!answer.isCorrect) {
          const question = (session.questions as object[]).find((q: any) => q.id === answer.questionId);
          if (question) {
            await ctx.db.pendingError.upsert({
              where: { userId_questionId: { userId: ctx.auth.userId, questionId: answer.questionId } },
              create: {
                userId: ctx.auth.userId,
                questionId: answer.questionId,
                question: question,
                selectedAlternative: answer.selectedAlternative,
                correctAlternative: (question as any).correctAlternative,
                reviewCount: 1,
                resolved: false,
              },
              update: {
                selectedAlternative: answer.selectedAlternative,
                reviewCount: { increment: 1 },
                resolved: false,
                lastSeenAt: new Date(),
              },
            });
          }
        } else {
          // Mark as resolved if previously failed
          await ctx.db.pendingError.updateMany({
            where: { userId: ctx.auth.userId, questionId: answer.questionId, resolved: false },
            data: { resolved: true },
          });
        }
      }

      return ctx.db.session.update({
        where: { id: input.id },
        data: {
          correctCount,
          incorrectCount,
          estimatedScore,
          answers: input.answers,
        },
      });
    }),
});
```

- [ ] **Step 2: Create question router**

Create `src/server/api/routers/question.ts`:

```typescript
import { z } from 'zod';
import { createTRPCRouter, publicProcedure } from '~/server/api/trpc';

export const questionRouter = createTRPCRouter({
  getRandom: publicProcedure
    .input(z.object({
      subject: z.string(),
      count: z.number().min(1).max(65),
    }))
    .query(async ({ ctx, input }) => {
      const questions = await ctx.db.question.findMany({
        where: { subject: input.subject },
      });
      const shuffled = questions.sort(() => Math.random() - 0.5);
      return shuffled.slice(0, input.count);
    }),

  getBySubject: publicProcedure
    .input(z.object({ subject: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.question.findMany({
        where: { subject: input.subject },
      });
    }),

  getAll: publicProcedure.query(async ({ ctx }) => {
    return ctx.db.question.findMany();
  }),
});
```

- [ ] **Step 3: Create error router**

Create `src/server/api/routers/error.ts`:

```typescript
import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '~/server/api/trpc';

export const errorRouter = createTRPCRouter({
  getPending: protectedProcedure
    .input(z.object({ subject: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.pendingError.findMany({
        where: {
          userId: ctx.auth.userId,
          resolved: false,
          ...(input.subject && { question: { path: ['subject'], equals: input.subject } }),
        },
        orderBy: { lastSeenAt: 'desc' },
      });
    }),

  resolve: protectedProcedure
    .input(z.object({ questionId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.pendingError.updateMany({
        where: { userId: ctx.auth.userId, questionId: input.questionId },
        data: { resolved: true },
      });
    }),
});
```

- [ ] **Step 4: Create progress router**

Create `src/server/api/routers/progress.ts`:

```typescript
import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '~/server/api/trpc';

export const progressRouter = createTRPCRouter({
  getStats: protectedProcedure.query(async ({ ctx }) => {
    const sessions = await ctx.db.session.findMany({
      where: { userId: ctx.auth.userId },
      orderBy: { createdAt: 'desc' },
    });

    const totalSessions = sessions.length;
    const totalCorrect = sessions.reduce((sum, s) => sum + s.correctCount, 0);
    const totalQuestions = sessions.reduce((sum, s) => sum + s.questionCount, 0);
    const averageScore = totalSessions > 0
      ? Math.round(sessions.reduce((sum, s) => sum + s.estimatedScore, 0) / totalSessions)
      : 0;

    const bySubject = await ctx.db.session.groupBy({
      by: ['subject'],
      where: { userId: ctx.auth.userId },
      _count: true,
      _avg: { estimatedScore: true },
    });

    return {
      totalSessions,
      totalCorrect,
      totalQuestions,
      averageScore,
      bySubject: bySubject.map(s => ({
        subject: s.subject,
        count: s._count,
        avgScore: Math.round(s._avg.estimatedScore ?? 0),
      })),
    };
  }),

  getTrend: protectedProcedure
    .input(z.object({ subject: z.string().optional(), limit: z.number().default(10) }))
    .query(async ({ ctx, input }) => {
      const sessions = await ctx.db.session.findMany({
        where: {
          userId: ctx.auth.userId,
          ...(input.subject && { subject: input.subject }),
        },
        orderBy: { createdAt: 'desc' },
        take: input.limit,
      });
      return sessions.map(s => ({
        date: s.createdAt,
        score: s.estimatedScore,
        subject: s.subject,
        correctCount: s.correctCount,
        totalCount: s.questionCount,
      }));
    }),
});
```

- [ ] **Step 5: Update root router**

Modify `src/server/api/root.ts`:

```typescript
import { sessionRouter } from '~/server/api/routers/session';
import { questionRouter } from '~/server/api/routers/question';
import { errorRouter } from '~/server/api/routers/error';
import { progressRouter } from '~/server/api/routers/progress';

export const appRouter = createTRPCRouter({
  session: sessionRouter,
  question: questionRouter,
  error: errorRouter,
  progress: progressRouter,
});

export type AppRouter = typeof appRouter;
```

- [ ] **Step 6: Update tRPC context**

Modify `src/server/api/trpc.ts` to add auth:

```typescript
import { initTRPC, TRPCError } from '@trpc/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '~/server/db';

export const createTRPCContext = async () => {
  const { userId } = auth();
  return { prisma, auth: { userId } };
};

export const createTRPCRouter = createTRPC.context<typeof createTRPCContext>().create;

export const publicProcedure = createTRPCRouter({ ctx, input }).publicProcedure;
export const protectedProcedure = createTRPCRouter({ ctx, input }).use(({ ctx, next }) => {
  if (!ctx.auth.userId) throw new TRPCError({ code: 'UNAUTHORIZED' });
  return next({ ctx: { ...ctx, auth: ctx.auth } });
});
```

- [ ] **Step 7: Commit**

```bash
git add src/server/api/routers/ src/server/api/root.ts
git commit -m "feat: add tRPC routers for sessions, questions, errors, progress"
```

---

## Phase 2: UI Components

### Task 4: Create Base UI Components

**Files:**
- Create: `src/components/ui/button.tsx`
- Create: `src/components/ui/card.tsx`
- Create: `src/components/ui/badge.tsx`
- Create: `src/lib/utils.ts`

- [ ] **Step 1: Create utils**

Create `src/lib/utils.ts`:

```typescript
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

- [ ] **Step 2: Create button component**

Create `src/components/ui/button.tsx`:

```typescript
import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '~/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-lg text-sm font-medium transition-colors focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-primary text-white hover:bg-primary/90',
        secondary: 'bg-surface-alt text-text hover:bg-surface-alt/80',
        outline: 'border border-border bg-transparent hover:bg-surface-alt',
        ghost: 'hover:bg-surface-alt',
        destructive: 'bg-error text-white hover:bg-error/90',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-8 px-3 text-xs',
        lg: 'h-12 px-6',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
```

- [ ] **Step 3: Create card component**

Create `src/components/ui/card.tsx`:

```typescript
import * as React from 'react';
import { cn } from '~/lib/utils';

const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('rounded-xl border border-border bg-surface shadow-sm', className)}
      {...props}
    />
  )
);
Card.displayName = 'Card';

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex flex-col space-y-1.5 p-4', className)} {...props} />
  )
);
CardHeader.displayName = 'CardHeader';

const CardTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3 ref={ref} className={cn('font-semibold leading-none tracking-tight', className)} {...props} />
  )
);
CardTitle.displayName = 'CardTitle';

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('p-4 pt-0', className)} {...props} />
  )
);
CardContent.displayName = 'CardContent';

export { Card, CardHeader, CardTitle, CardContent };
```

- [ ] **Step 4: Create badge component**

Create `src/components/ui/badge.tsx`:

```typescript
import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '~/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary text-white',
        secondary: 'border-transparent bg-surface-alt text-text',
        success: 'border-transparent bg-success/10 text-success',
        error: 'border-transparent bg-error/10 text-error',
        outline: 'text-text',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
```

- [ ] **Step 5: Add CSS variables**

Add to `src/styles/globals.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --color-primary: #0F766E;
  --color-primary-light: #14B8A6;
  --color-accent: #F59E0B;
  --color-bg: #FAFAFA;
  --color-surface: #FFFFFF;
  --color-surface-alt: #F3F4F6;
  --color-text: #111827;
  --color-text-muted: #6B7280;
  --color-success: #10B981;
  --color-error: #EF4444;
  --color-border: #E5E7EB;
}

@layer base {
  body {
    @apply bg-bg text-text;
  }
}
```

- [ ] **Step 6: Commit**

```bash
git add src/components/ui/ src/lib/utils.ts src/styles/globals.css
git commit -m "feat: add base UI components (Button, Card, Badge)"
```

---

### Task 5: Create Simulation Components

**Files:**
- Create: `src/components/simulation/question-card.tsx`
- Create: `src/components/simulation/alternative-button.tsx`
- Create: `src/components/simulation/progress-bar.tsx`
- Create: `src/components/simulation/score-card.tsx`

- [ ] **Step 1: Create QuestionCard**

Create `src/components/simulation/question-card.tsx`:

```typescript
'use client';

import { Card } from '~/components/ui/card';
import { cn } from '~/lib/utils';

interface QuestionCardProps {
  prompt: string;
  className?: string;
}

export function QuestionCard({ prompt, className }: QuestionCardProps) {
  return (
    <Card className={cn('p-6', className)}>
      <p className="text-lg leading-relaxed">{prompt}</p>
    </Card>
  );
}
```

- [ ] **Step 2: Create AlternativeButton**

Create `src/components/simulation/alternative-button.tsx`:

```typescript
'use client';

import { Pressable, Text } from 'react-native';
import { cn } from '~/lib/utils';
import type { AnswerOption } from '~/types/domain';

type AlternativeState = 'idle' | 'selected' | 'correct' | 'wrong' | 'dimmed';

interface AlternativeButtonProps {
  option: AnswerOption;
  text: string;
  state: AlternativeState;
  onPress: () => void;
  disabled?: boolean;
}

const stateStyles: Record<AlternativeState, string> = {
  idle: 'bg-surface border-border hover:border-primary',
  selected: 'bg-surface-alt border-primary',
  correct: 'bg-success/10 border-success',
  wrong: 'bg-error/10 border-error',
  dimmed: 'bg-surface border-border opacity-50',
};

const keyStyles: Record<AlternativeState, string> = {
  idle: 'bg-surface-alt',
  selected: 'bg-primary',
  correct: 'bg-success',
  wrong: 'bg-error',
  dimmed: 'bg-surface-alt',
};

export function AlternativeButton({ option, text, state, onPress, disabled }: AlternativeButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || state !== 'idle'}
      className={cn(
        'min-h-[72px] rounded-xl border-2 p-4 transition-all',
        stateStyles[state]
      )}
    >
      <div className="flex flex-row gap-3">
        <div className={cn('flex h-8 w-8 items-center justify-center rounded-lg', keyStyles[state])}>
          <Text className="text-sm font-bold text-white">{option}</Text>
        </div>
        <Text className="flex-1 text-base leading-relaxed">{text}</Text>
      </div>
    </Pressable>
  );
}
```

- [ ] **Step 3: Create ProgressBar**

Create `src/components/simulation/progress-bar.tsx`:

```typescript
'use client';

import { View, Text } from 'react-native';
import { cn } from '~/lib/utils';

interface ProgressBarProps {
  current: number;
  total: number;
  className?: string;
}

export function ProgressBar({ current, total, className }: ProgressBarProps) {
  const percentage = total > 0 ? (current / total) * 100 : 0;

  return (
    <View className={cn('flex flex-row items-center gap-3', className)}>
      <View className="h-2 flex-1 overflow-hidden rounded-full bg-border">
        <View className="h-full rounded-full bg-primary" style={{ width: `${percentage}%` }} />
      </View>
      <Text className="text-sm text-text-muted min-w-[60px] text-right">
        {current} / {total}
      </Text>
    </View>
  );
}
```

- [ ] **Step 4: Create ScoreCard**

Create `src/components/simulation/score-card.tsx`:

```typescript
'use client';

import { Card } from '~/components/ui/card';
import { Badge } from '~/components/ui/badge';

interface ScoreCardProps {
  score: number;
  correctCount: number;
  incorrectCount: number;
  totalCount: number;
}

export function ScoreCard({ score, correctCount, incorrectCount, totalCount }: ScoreCardProps) {
  const percentage = Math.round((correctCount / totalCount) * 100);
  const isGood = score >= 500;

  return (
    <Card className="p-6">
      <div className="flex flex-col items-center gap-4">
        <div className="text-6xl font-bold" style={{ color: isGood ? '#10B981' : '#EF4444' }}>
          {score}
        </div>
        <Badge variant={isGood ? 'success' : 'error'}>
          {isGood ? 'Sobre 500' : 'Bajo 500'}
        </Badge>
        <div className="flex gap-6 text-center">
          <div>
            <div className="text-2xl font-semibold text-success">{correctCount}</div>
            <div className="text-sm text-text-muted">Correctas</div>
          </div>
          <div>
            <div className="text-2xl font-semibold text-error">{incorrectCount}</div>
            <div className="text-sm text-text-muted">Incorrectas</div>
          </div>
          <div>
            <div className="text-2xl font-semibold">{percentage}%</div>
            <div className="text-sm text-text-muted">Aciertos</div>
          </div>
        </div>
      </div>
    </Card>
  );
}
```

- [ ] **Step 5: Commit**

```bash
git add src/components/simulation/
git commit -m "feat: add simulation components (QuestionCard, AlternativeButton, ProgressBar, ScoreCard)"
```

---

## Phase 3: Screens

### Task 6: Create Navigation & Layout

**Files:**
- Create: `src/app/(auth)/layout.tsx`
- Create: `src/app/(main)/layout.tsx`
- Create: `src/app/(main)/layout.tsx`
- Modify: `src/app/globals.css`

- [ ] **Step 1: Create auth layout**

Create `src/app/(auth)/layout.tsx`:

```typescript
import { ClerkProvider } from '@clerk/nextjs';
import { ReactNode } from 'react';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <ClerkProvider>
      <div className="min-h-screen bg-bg flex items-center justify-center p-4">
        {children}
      </div>
    </ClerkProvider>
  );
}
```

- [ ] **Step 2: Create main layout with navigation**

Create `src/app/(main)/layout.tsx`:

```typescript
import { auth, currentUser } from '@clerk/nextjs';
import { redirect } from 'next/navigation';
import { ReactNode } from 'react';
import { Navbar } from '~/components/layout/navbar';
import { prisma } from '~/server/db';

export default async function MainLayout({ children }: { children: ReactNode }) {
  const { userId } = auth();
  
  if (!userId) {
    redirect('/sign-in');
  }

  // Ensure user exists in DB
  await prisma.user.upsert({
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
```

- [ ] **Step 3: Create Navbar component**

Create `src/components/layout/navbar.tsx`:

```typescript
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
```

- [ ] **Step 4: Commit**

```bash
git add src/app/\(auth\)/ src/app/\(main\)/ src/components/layout/
git commit -m "feat: add navigation layouts and navbar"
```

---

### Task 7: Create Home Screen

**Files:**
- Create: `src/app/(main)/page.tsx`

- [ ] **Step 1: Create Home screen**

Create `src/app/(main)/page.tsx`:

```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '~/components/ui/card';
import { Button } from '~/components/ui/button';
import { api } from '~/trpc/react';

const SUBJECTS = [
  'Comprension Lectora',
  'Matematica M1',
  'Matematica M2',
  'Historia',
  'Ciencias',
] as const;

const MODE_LABELS = {
  'Ensayo oficial': { label: 'Ensayo Oficial', desc: 'Preguntas del banco oficial DEMRE' },
  'Repaso errores': { label: 'Repaso Errores', desc: 'Revisa tus respuestas incorrectas' },
};

const QUESTION_COUNTS = {
  'Ensayo oficial': [10, 20, 35, 65] as const,
  'Repaso errores': [3, 5, 10] as const,
};

export default function HomePage() {
  const router = useRouter();
  const [subject, setSubject] = useState<string>(SUBJECTS[0]);
  const [mode, setMode] = useState<'Ensayo oficial' | 'Repaso errores'>('Ensayo oficial');
  const [count, setCount] = useState<number>(10);

  const createSession = api.session.create.useMutation({
    onSuccess: (session) => {
      router.push(`/simulacion/${session.id}`);
    },
    onError: (error) => {
      alert(error.message);
    },
  });

  const handleStart = () => {
    createSession.mutate({ subject, mode, questionCount: count });
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-text">Nueva Simulación</h1>
        <p className="text-text-muted mt-2">
          Elige la materia, el modo y cuántas preguntas quieres responder.
        </p>
      </div>

      {/* Materia */}
      <div>
        <h2 className="text-sm font-semibold text-text uppercase tracking-wide mb-3">Materia</h2>
        <div className="flex flex-wrap gap-2">
          {SUBJECTS.map((s) => (
            <Button
              key={s}
              variant={subject === s ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSubject(s)}
            >
              {s}
            </Button>
          ))}
        </div>
      </div>

      {/* Modo */}
      <div>
        <h2 className="text-sm font-semibold text-text uppercase tracking-wide mb-3">Modo</h2>
        <div className="grid grid-cols-2 gap-4">
          {(Object.keys(MODE_LABELS) as Array<keyof typeof MODE_LABELS>).map((m) => (
            <Card
              key={m}
              className={`p-4 cursor-pointer transition-colors ${
                mode === m ? 'border-primary bg-primary/5' : ''
              }`}
              onClick={() => {
                setMode(m);
                setCount(QUESTION_COUNTS[m][0]);
              }}
            >
              <h3 className={`font-semibold ${mode === m ? 'text-primary' : ''}`}>
                {MODE_LABELS[m].label}
              </h3>
              <p className="text-sm text-text-muted mt-1">{MODE_LABELS[m].desc}</p>
            </Card>
          ))}
        </div>
      </div>

      {/* Cantidad */}
      <div>
        <h2 className="text-sm font-semibold text-text uppercase tracking-wide mb-3">Preguntas</h2>
        <div className="flex gap-2">
          {QUESTION_COUNTS[mode].map((n) => (
            <Button
              key={n}
              variant={count === n ? 'default' : 'outline'}
              size="sm"
              onClick={() => setCount(n)}
            >
              {n}
            </Button>
          ))}
        </div>
      </div>

      {/* Iniciar */}
      <div className="pt-4">
        <Button
          className="w-full h-14 text-lg"
          onClick={handleStart}
          disabled={createSession.isPending}
        >
          {createSession.isPending ? 'Preparando...' : 'Iniciar Simulación'}
        </Button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/\(main\)/page.tsx
git commit -m "feat: add home screen with simulation configuration"
```

---

### Task 8: Create Simulation Screen

**Files:**
- Create: `src/app/(main)/simulacion/[sessionId]/page.tsx`
- Create: `src/hooks/useSimulation.ts`

- [ ] **Step 1: Create useSimulation hook**

Create `src/hooks/useSimulation.ts`:

```typescript
'use client';

import { useState, useCallback } from 'react';
import type { QuestionItem, AnswerOption } from '~/types/domain';

type Phase = 'loading' | 'active' | 'feedback' | 'done';

interface UseSimulationReturn {
  currentQuestion: QuestionItem | null;
  currentIndex: number;
  totalCount: number;
  phase: Phase;
  selectedAnswer: AnswerOption | null;
  selectAnswer: (answer: AnswerOption) => void;
  advance: () => void;
  answers: Array<{ questionId: string; selectedAlternative: AnswerOption; isCorrect: boolean }>;
}

export function useSimulation(questions: QuestionItem[]): UseSimulationReturn {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>(questions.length > 0 ? 'active' : 'loading');
  const [selectedAnswer, setSelectedAnswer] = useState<AnswerOption | null>(null);
  const [answers, setAnswers] = useState<Array<{ questionId: string; selectedAlternative: AnswerOption; isCorrect: boolean }>>([]);

  const currentQuestion = questions[currentIndex] ?? null;

  const selectAnswer = useCallback((answer: AnswerOption) => {
    setSelectedAnswer(answer);
    setPhase('feedback');
  }, []);

  const advance = useCallback(() => {
    if (!currentQuestion || !selectedAnswer) return;

    const isCorrect = selectedAnswer === currentQuestion.correctAlternative;
    setAnswers((prev) => [...prev, {
      questionId: currentQuestion.id,
      selectedAlternative: selectedAnswer,
      isCorrect,
    }]);

    const nextIndex = currentIndex + 1;
    if (nextIndex >= questions.length) {
      setPhase('done');
    } else {
      setCurrentIndex(nextIndex);
      setSelectedAnswer(null);
      setPhase('active');
    }
  }, [currentQuestion, currentIndex, questions.length, selectedAnswer]);

  return {
    currentQuestion,
    currentIndex,
    totalCount: questions.length,
    phase,
    selectedAnswer,
    selectAnswer,
    advance,
    answers,
  };
}
```

- [ ] **Step 2: Create simulation page**

Create `src/app/(main)/simulacion/[sessionId]/page.tsx`:

```typescript
'use client';

import { useRouter } from 'next/navigation';
import { api } from '~/trpc/react';
import { QuestionCard } from '~/components/simulation/question-card';
import { AlternativeButton } from '~/components/simulation/alternative-button';
import { ProgressBar } from '~/components/simulation/progress-bar';
import { Button } from '~/components/ui/button';
import type { AnswerOption } from '~/types/domain';

const ALTERNATIVES: AnswerOption[] = ['A', 'B', 'C', 'D', 'E'];

export default function SimulationPage({ params }: { params: { sessionId: string } }) {
  const router = useRouter();
  const { data: session, isLoading } = api.session.getById.useQuery({ id: params.sessionId });
  const completeMutation = api.session.complete.useMutation({
    onSuccess: () => router.push('/historial'),
  });

  if (isLoading || !session) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="mt-4 text-text-muted">Preparando preguntas...</p>
        </div>
      </div>
    );
  }

  const questions = session.questions as any[];
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<AnswerOption | null>(null);
  const [answers, setAnswers] = useState<any[]>([]);
  const phase = selectedAnswer ? 'feedback' : 'active';
  const currentQuestion = questions[currentIndex];

  const selectAnswer = (answer: AnswerOption) => setSelectedAnswer(answer);

  const advance = () => {
    const isCorrect = selectedAnswer === currentQuestion.correctAlternative;
    const newAnswers = [...answers, {
      questionId: currentQuestion.id,
      selectedAlternative: selectedAnswer,
      isCorrect,
    }];

    if (currentIndex + 1 >= questions.length) {
      completeMutation.mutate({ id: session.id, answers: newAnswers });
    } else {
      setAnswers(newAnswers);
      setCurrentIndex(currentIndex + 1);
      setSelectedAnswer(null);
    }
  };

  const getAlternativeState = (key: AnswerOption) => {
    if (phase !== 'feedback') return selectedAnswer === key ? 'selected' : 'idle';
    if (key === currentQuestion.correctAlternative) return 'correct';
    if (key === selectedAnswer) return 'wrong';
    return 'dimmed';
  };

  return (
    <div className="space-y-6">
      <ProgressBar current={currentIndex + 1} total={questions.length} />

      <div className="text-center">
        <span className="text-sm text-primary font-medium">{session.subject}</span>
      </div>

      <QuestionCard prompt={currentQuestion.prompt} />

      <div className="space-y-3">
        {ALTERNATIVES.map((key) => {
          const alt = currentQuestion.alternatives.find((a: any) => a.key === key);
          if (!alt) return null;
          return (
            <div key={key}>
              <AlternativeButton
                option={key}
                text={alt.text}
                state={getAlternativeState(key)}
                onPress={() => selectAnswer(key)}
                disabled={phase === 'feedback'}
              />
              {phase === 'feedback' && (key === currentQuestion.correctAlternative || key === selectedAnswer) && (
                <p className="text-sm text-text-muted mt-2 ml-2">
                  {currentQuestion.explanationsByAlternative[key]}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {phase === 'feedback' && (
        <div className="pt-4">
          <Button className="w-full h-12" onPress={advance}>
            {currentIndex + 1 < questions.length ? 'Siguiente' : 'Ver Resultados'}
          </Button>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/\(main\)/simulacion/ src/hooks/
git commit -m "feat: add simulation screen with question flow"
```

---

### Task 9: Create Historial & Progress Screens

**Files:**
- Create: `src/app/(main)/historial/page.tsx`
- Create: `src/app/(main)/progreso/page.tsx`

- [ ] **Step 1: Create Historial screen**

Create `src/app/(main)/historial/page.tsx`:

```typescript
'use client';

import { api } from '~/trpc/react';
import { Card } from '~/components/ui/card';
import { Badge } from '~/components/ui/badge';
import { History } from 'lucide-react';

export default function HistorialPage() {
  const { data: sessions, isLoading } = api.session.getRecent.useQuery({ limit: 20 });

  if (isLoading) {
    return <div className="text-center py-12">Cargando...</div>;
  }

  if (!sessions || sessions.length === 0) {
    return (
      <div className="text-center py-12">
        <History className="w-16 h-16 mx-auto text-text-muted mb-4" />
        <h2 className="text-xl font-semibold">Sin sesiones</h2>
        <p className="text-text-muted mt-2">Completa tu primera simulación para ver el historial.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Historial</h1>
      <div className="space-y-3">
        {sessions.map((session) => (
          <Card key={session.id} className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold">{session.subject}</h3>
                <p className="text-sm text-text-muted">
                  {new Date(session.createdAt).toLocaleDateString('es-CL')}
                </p>
                <Badge variant="secondary" className="mt-2">{session.mode}</Badge>
              </div>
              <div className="text-right">
                <div className={`text-2xl font-bold ${session.estimatedScore >= 500 ? 'text-success' : 'text-error'}`}>
                  {session.estimatedScore}
                </div>
                <p className="text-xs text-text-muted">
                  {session.correctCount}/{session.questionCount}
                </p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create Progreso screen**

Create `src/app/(main)/progreso/page.tsx`:

```typescript
'use client';

import { api } from '~/trpc/react';
import { Card } from '~/components/ui/card';
import { TrendingUp } from 'lucide-react';

export default function ProgresoPage() {
  const { data: stats, isLoading } = api.progress.getStats.useQuery();
  const { data: trend } = api.progress.getTrend.useQuery({ limit: 10 });

  if (isLoading) {
    return <div className="text-center py-12">Cargando...</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Tu Progreso</h1>

      <div className="grid grid-cols-2 gap-4">
        <Card className="p-4 text-center">
          <div className="text-4xl font-bold text-primary">{stats?.totalSessions ?? 0}</div>
          <p className="text-sm text-text-muted">Simulaciones</p>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-4xl font-bold text-primary">{stats?.averageScore ?? 0}</div>
          <p className="text-sm text-text-muted">Promedio</p>
        </Card>
      </div>

      <Card className="p-4">
        <h2 className="font-semibold mb-4">Rendimiento por Materia</h2>
        {stats?.bySubject.length === 0 ? (
          <p className="text-text-muted text-center py-4">Sin datos aún</p>
        ) : (
          <div className="space-y-3">
            {stats?.bySubject.map((item) => (
              <div key={item.subject} className="flex justify-between items-center">
                <span>{item.subject}</span>
                <span className={`font-semibold ${item.avgScore >= 500 ? 'text-success' : 'text-error'}`}>
                  {item.avgScore} pts ({item.count})
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card className="p-4">
        <h2 className="font-semibold mb-4">Tendencia Reciente</h2>
        {trend && trend.length > 0 ? (
          <div className="flex items-end gap-1 h-32">
            {trend.map((item, i) => (
              <div
                key={i}
                className="flex-1 bg-primary rounded-t"
                style={{ height: `${(item.score / 850) * 100}%` }}
                title={`${item.score} pts - ${item.subject}`}
              />
            ))}
          </div>
        ) : (
          <p className="text-text-muted text-center py-4">Sin datos aún</p>
        )}
      </Card>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/\(main\)/historial/ src/app/\(main\)/progreso/
git commit -m "feat: add historial and progreso screens"
```

---

## Phase 4: Seed & Deploy

### Task 10: Create Seed Script

**Files:**
- Create: `prisma/seed.ts`

- [ ] **Step 1: Create seed script**

Create `prisma/seed.ts`:

```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding questions...');

  // Clear existing questions
  await prisma.question.deleteMany();

  const questions = [
    // Comprensión Lectora - sample
    {
      subject: 'Comprension Lectora',
      prompt: '¿Cuál es la idea principal del texto sobre el cambio climático?',
      alternatives: [
        { key: 'A', text: 'El cambio climático solo afecta a los polos' },
        { key: 'B', text: 'Las actividades humanas son la causa principal del calentamiento global' },
        { key: 'C', text: 'El clima siempre ha cambiado naturalmente' },
        { key: 'D', text: 'Los animales son los más afectados' },
        { key: 'E', text: 'No hay consenso científico sobre el tema' },
      ],
      correctAlternative: 'B',
      explanationsByAlternative: {
        A: 'Incorrecto. El cambio climático afecta a todo el planeta, no solo a los polos.',
        B: 'Correcto. El texto indica que las emisiones de gases de efecto invernadero son la causa principal.',
        C: 'Incorrecto. Si bien el clima ha cambiado naturalmente, la rapidez actual es anthropogenic.',
        D: 'Incorrecto. Aunque los animales se ven afectados, el impacto es global.',
        E: 'Incorrecto. Hay amplio consenso científico sobre el cambio climático.',
      },
    },
    // Matemática M1 - sample
    {
      subject: 'Matematica M1',
      prompt: 'Si 3x + 7 = 22, ¿cuál es el valor de x?',
      alternatives: [
        { key: 'A', text: '3' },
        { key: 'B', text: '5' },
        { key: 'C', text: '7' },
        { key: 'D', text: '15' },
        { key: 'E', text: '29' },
      ],
      correctAlternative: 'B',
      explanationsByAlternative: {
        A: 'Incorrecto. 3(3) + 7 = 16 ≠ 22',
        B: 'Correcto. 3(5) + 7 = 15 + 7 = 22',
        C: 'Incorrecto. 3(7) + 7 = 28 ≠ 22',
        D: 'Incorrecto. 3(15) + 7 = 52 ≠ 22',
        E: 'Incorrecto. 3(29) + 7 = 94 ≠ 22',
      },
    },
    // Add more questions as needed...
  ];

  for (const q of questions) {
    await prisma.question.create({ data: q });
  }

  console.log(`Seeded ${questions.length} questions`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

- [ ] **Step 2: Update package.json scripts**

Add to `package.json`:

```json
{
  "prisma": {
    "seed": "ts-node --compiler-options {\"module\":\"CommonJS\"} prisma/seed.ts"
  }
}
```

- [ ] **Step 3: Run seed**

```bash
npx prisma db seed
```

- [ ] **Step 4: Commit**

```bash
git add prisma/seed.ts package.json
git commit -m "feat: add seed script for questions"
```

---

### Task 11: Deploy to Vercel

- [ ] **Step 1: Push to GitHub**

```bash
gh repo create practicatupaes --public --push
```

- [ ] **Step 2: Deploy on Vercel**

1. Go to vercel.com
2. Import GitHub repo `practicatupaes`
3. Add environment variables:
   - `DATABASE_URL`
   - `CLERK_PUBLISHABLE_KEY`
   - `CLERK_SECRET_KEY`
4. Deploy

- [ ] **Step 3: Commit**

```bash
git log --oneline -1
```

---

## Spec Coverage Checklist

- [x] Stack: Next.js 15, tRPC, Prisma, Supabase, Clerk, Vercel
- [x] Architecture: App Router, tRPC routers, Prisma models
- [x] Database schema: User, Session, PendingError, Question
- [x] tRPC routers: session, question, error, progress
- [x] UI components: Button, Card, Badge, QuestionCard, AlternativeButton, ProgressBar, ScoreCard
- [x] Screens: Home, Simulation, Historial, Progreso
- [x] PWA manifest: name, short_name, icons
- [x] Auth: Clerk integration
- [x] Seed: prisma/seed.ts
