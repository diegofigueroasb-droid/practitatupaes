# Deployment Guide

## Prerequisites

- GitHub account
- Vercel account
- Supabase account
- Clerk account

## 1. Push to GitHub

```bash
# Create repo on GitHub (via web UI)
# Then add remote and push:
git remote add origin https://github.com/YOUR_USERNAME/practicatupaes.git
git push -u origin main
```

## 2. Vercel Deployment

1. Go to [vercel.com](https://vercel.com) and sign in with GitHub
2. Click "New Project"
3. Import the `practicatupaes` repo
4. Add environment variables:
   - `DATABASE_URL` - Supabase PostgreSQL connection string
   - `CLERK_PUBLISHABLE_KEY` - From Clerk dashboard
   - `CLERK_SECRET_KEY` - From Clerk dashboard
5. Click "Deploy"

## 3. Database Setup (Local)

```bash
# Connect to Supabase and get connection string
# Then run:
npx prisma db push    # Create tables
npx prisma db seed    # Seed questions
```

## 4. Clerk Setup

1. Go to [clerk.com](https://clerk.com) and create app
2. Copy Publishable Key and Secret Key
3. Add redirect URLs for your domains

## 5. Run Locally

```bash
npm install
npx prisma db push
npx prisma db seed
npm run dev
```
