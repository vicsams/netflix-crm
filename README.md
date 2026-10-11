# Netflix CRM

Back-office app for reselling streaming accounts (Netflix and similar) by profile.
Each user manages their own catalog of services, the streaming accounts they own,
the profiles (screens) inside each account, the clients renting those profiles,
and the income earned in Bs and USDT.

## Features

- **Services**: streaming platforms you resell, with price and brand colors
- **Active accounts**: the real accounts you own, with up to 5 profiles each
- **Subscriptions**: link a client to a profile, track expiration and renewals,
  and message the client on WhatsApp
- **Clients**: customer list with phone numbers
- **Bank**: income balance in Bs and USDT, conversion using the live Binance P2P
  USDT/VES rate, and a withdrawals log
- **Auth**: sign up with email verification and password reset (better-auth + Resend)

All data is scoped to the signed-in user: two accounts never see each other's data.

## Stack

Next.js (App Router), React, TypeScript, Prisma + PostgreSQL, better-auth,
TanStack Query/Table, Tailwind CSS, shadcn/ui, Resend.

## Getting started

```bash
bun install
bunx prisma migrate deploy
bun dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment variables

Set these in `.env` locally, and in Vercel → Project → Settings → Environment
Variables (Production + Preview as needed):

- `DATABASE_URL`
- `BETTER_AUTH_SECRET` (do not use the default secret)
- `NEXT_PUBLIC_APP_URL` (e.g. `https://netflix-crm.vercel.app`)
- `ACCOUNT_ENCRYPTION_KEY`: encrypts streaming account passwords at rest.
  Generate it with `openssl rand -base64 32`. Keep it safe: if it is lost,
  encrypted passwords cannot be recovered.
- `RESEND_API_KEY` (if using email features)
