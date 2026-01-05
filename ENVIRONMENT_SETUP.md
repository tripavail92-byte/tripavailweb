# TripAvail Environment Setup

Purpose: consistent local, staging, and production environment setup for TripAvail (NestJS backend, Next.js web, Postgres, Redis, Meilisearch).

## 1) Prerequisites
- OS: macOS, Linux, or Windows with WSL2/PowerShell.
- Node: version from `.nvmrc` (install via nvm). Use pnpm as package manager.
- Docker + Docker Compose installed.
- Ports available: 4000 (web), 4100 (API), 5432 (Postgres), 6379 (Redis), 7700 (Meilisearch). Port 3000 is intentionally unused.

## 2) Repository Setup
- Clone repo and install dependencies:
  - `pnpm install`
- Recommended: enable Husky hooks and lint-staged (already configured).

## 3) Environment Files
Create per-environment env files; keep secrets out of git.

### Backend `.env.local` (example keys)
```
PORT=4100
DATABASE_URL=postgresql://user:pass@localhost:5432/tripavail
REDIS_URL=redis://localhost:6379
MEILISEARCH_HOST=http://localhost:7700
JWT_SECRET=change-me
JWT_EXPIRES_IN=24h
CORS_ORIGINS=http://localhost:4000
RATE_LIMIT_ANON=10
RATE_LIMIT_AUTH=100
RATE_LIMIT_PROVIDER=500
RATE_LIMIT_LOGIN=3
STORAGE_SIGNING_KEY=change-me
STRIPE_WEBHOOK_SECRET=placeholder
```

### Web `.env.local` (example keys)
```
PORT=4000
NEXT_PUBLIC_API_URL=http://localhost:4100
NEXT_PUBLIC_SENTRY_DSN=
NEXT_PUBLIC_MEILISEARCH_HOST=http://localhost:7700
```

## 4) Local Development
1) Start dependencies (optional via Docker): `docker-compose up -d` (Postgres, Redis, Meilisearch).
2) Run migrations: `cd backend && pnpm migration:run`.
3) Start API: `cd backend && pnpm dev` (listens on 4100).
4) Start web: `cd web && pnpm dev --port 4000`.
5) Access web at http://localhost:4000.

## 5) Testing and Linting
- Lint: `pnpm lint`.
- Unit/integration: `pnpm test -- --coverage` (backend).
- E2E (Playwright if configured): `pnpm test:e2e`.
- Smoke scripts (if present): run PowerShell `smoke-test.ps1` from backend root.

## 6) Staging Environment
- Mirror production configuration; use staging databases cloned from production schema/data when validating migrations.
- Set `CORS_ORIGINS` to staging domains only.
- Enable HTTPS via load balancer; ensure HSTS at edge.
- Run full smoke tests before promoting.

## 7) Production Environment
- Use managed Postgres/Redis with backups and monitoring enabled.
- Apply blue-green or canary deployments; verify `/health` and `/health/ready` before traffic cutover.
- Enforce secure env vars: unique JWT secrets, storage signing key, webhook secrets.
- Configure logging to aggregation with requestId; enable Sentry.

## 8) Data and Security Practices
- Never commit `.env*` files; verify `.gitignore` covers them.
- Use idempotency keys on all mutating endpoints.
- Provider verification gates must remain enabled; do not bypass in prod.
- Persist price snapshots at booking confirm; do not recompute historical totals.

## 9) Helpful Commands
- Recreate DB schema locally (dangerous): `psql -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"` then `pnpm migration:run`.
- Check health: `curl http://localhost:4100/health` and `/health/ready`.
- Build backend: `cd backend && pnpm build`.
- Build web: `cd web && pnpm build`.

Keep this guide alongside DEPLOYMENT_GUIDE and OPERATIONS_RUNBOOK. Update env templates whenever new configuration keys are added.
