# AGENTS.md

## Dev Commands

```bash
npm run dev      # Dev server with Turbo mode
npm run build    # Production build
npm run typecheck # TS validation (fails build on errors)
npm run db:push # Push Prisma schema to DB
npm run db:seed # Seed questions from prisma/seed.ts
npx prisma studio # GUI for database
```

## Tech Stack

- **T3 Stack**: Next.js 15 (App Router), tRPC, Prisma, Tailwind CSS v4
- **Auth**: Clerk
- **DB**: PostgreSQL via Supabase
- **PWA**: next-pwa configured

## Architecture

- `src/server/api/routers/` - tRPC endpoints (session, progress, question, error)
- `src/server/db.ts` - Prisma client singleton
- `prisma/schema.prisma` - Database schema
- Pages in `src/app/` (Next.js App Router)

## Gotchas

- `npm install` triggers `prisma generate` (postinstall hook)
- Tailwind v4 uses `@tailwindcss/postcss` and CSS config (not tailwind.config.js)
- Build fails on TypeScript errors (`ignoreBuildErrors: false`)
- Prisma seed uses CommonJS (`ts-node --compiler-options {"module":"CommonJS"}`)