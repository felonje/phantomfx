# Phantom FX

A multi-user forex trading platform built with Next.js, TypeScript and Prisma.

Every client gets a **demo account** (virtual $10,000) and a **live account** (funded through admin-approved deposits).

## Features

- **Trading terminal**: live FX prices for 10 major pairs (Yahoo Finance, with a simulated fallback), candlestick charts (1m–1d), market/limit/stop orders, stop loss / take profit, leverage from 1:10 to 1:500, margin, free margin, equity and margin level
- **Risk engine**: fills pending orders, triggers SL/TP, auto stop-out at a 50% margin level (worst position closed first), negative balance protection
- **Wallet**: deposit and withdrawal requests (M-Pesa, bank transfer, card, USDT) with a full transaction ledger
- **History**: closed trades, order history, ledger, win rate
- **Admin panel**: approve/reject deposits and withdrawals, manage clients (suspend, adjust balance), monitor open positions and house exposure, force-close positions, edit spreads/commission/lot limits, audit log

## Quick start

Requirements: Node.js 20+ and Docker (for the local Postgres database).

```bash
npm install
cp .env.example .env      # then set AUTH_SECRET and ADMIN_PASSWORD
docker compose up -d db   # local Postgres 16 on :5432 (matches DATABASE_URL in .env.example)
npm run setup             # applies migrations, seeds instruments + admin user
npm run dev               # http://localhost:3000
```

Sign in as the admin with `ADMIN_EMAIL` / `ADMIN_PASSWORD` from `.env`, or register a new client at `/register`.

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Dev server |
| `npm run build` / `npm start` | Production build / standalone server |
| `npm test` | Unit tests (trading math) |
| `npm run lint` / `npm run typecheck` | ESLint / TypeScript |
| `npm run setup` | Apply migrations + seed |
| `npm run db:migrate` | Create a new migration after editing `prisma/schema.prisma` |
| `npm run db:deploy` | Apply pending migrations (production) |

## Configuration

See `.env.example`. Key settings:

- `PRICE_FEED`: `yahoo` (live, falls back to simulated if unreachable) or `simulated`
- `ENFORCE_MARKET_HOURS`: reject orders while the FX market is closed (Sun 22:00 – Fri 22:00 UTC)
- `DEMO_BALANCE`: starting balance for demo accounts
- `APP_URL`: public URL used for links in emails
- `SMTP_URL` / `MAIL_FROM`: outgoing mail (verification, password reset, security alerts). Without `SMTP_URL`, emails are printed to the server log
- `NEXT_PUBLIC_COMPANY_NAME` / `NEXT_PUBLIC_SUPPORT_EMAIL`: shown on the Terms, Privacy and Risk Disclosure pages

## Account security

- Email verification (required before deposits and withdrawals), password reset by email, and password change from **Account** settings
- Optional TOTP two-factor authentication (Google Authenticator, Authy, 1Password…) with one-time recovery codes; admins can reset a client's 2FA
- Server-side sessions: clients can see their signed-in devices and sign out of one or all; password changes/resets and suspensions revoke sessions
- Rate limits on sign-in, registration, 2FA and reset endpoints (in-memory, per instance)
- Terms, Privacy Policy and Risk Disclosure pages at `/terms`, `/privacy`, `/risk-disclosure`; registration records acceptance. **These are templates: have them reviewed by a lawyer for your jurisdiction before launch.**

## Deployment

The app ships as a Docker image (Next.js standalone output) and needs a PostgreSQL database.

**Docker Compose (single server / VPS):**

```bash
cp .env.example .env      # set AUTH_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD
docker compose --profile prod up -d --build
```

This starts Postgres, runs migrations + seed once (`migrate` service), then starts the app on port 3000. Put a reverse proxy with TLS (Caddy, Nginx, Cloudflare) in front of it.

**Any container platform (Railway, Render, Fly.io, ECS, ...):**

1. Provision Postgres and set `DATABASE_URL`, `AUTH_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`.
2. Run migrations + seed before each release: `docker build --target migrate -t phantomfx-migrate . && docker run --rm --env-file .env phantomfx-migrate` (or `npm run setup` from a release/pre-deploy command).
3. Deploy the default Dockerfile target (`runner`). It listens on `PORT` (default 3000).
4. Use `GET /api/health` for health checks (returns 503 if the database is unreachable).

Run **exactly one** app instance: the price feed, trading engine and account locks live in process memory.

## Production notes

This is a working trading platform, but it is **not ready to take real client money yet**:

- **Execution**: the platform is the counterparty for all trades (B-book). Hedging to a liquidity provider (e.g. via FIX/bridge) is not implemented.
- **Payments**: deposits/withdrawals are manual requests that an admin approves. No payment gateway (M-Pesa Daraja, Stripe, etc.) is connected yet.
- **Compliance**: you need a forex broker license (e.g. CMA in Kenya), KYC/AML checks and segregated client funds before you can accept real deposits.
- **Infrastructure**: run a **single** app instance. The price feed, trading engine and account locks run in memory, inside one process. Balances are stored as floating point; move to `Decimal` before handling significant real money.
- **Market data**: Yahoo Finance is unofficial and rate-limited. Use a licensed feed for production.
- **Accounts**: rate limits are kept in memory per instance; move them to Redis when you scale out.
