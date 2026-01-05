# TripAvail Deployment Guide

Audience: DevOps, backend, and release engineers deploying TripAvail (NestJS API + Next.js web) to staging and production. Scope: versioned API `/v1`, blue-green releases, database migrations, and rollback strategy.

## 1) Architecture and Ports
- API: NestJS modular monolith on port 4100 (versioned `/v1`).
- Web: Next.js on port 4000 (avoid port 3000).
- Postgres: 5432. Redis: 6379. Meilisearch: 7700.
- Background jobs: BullMQ (TTL for holds, indexing, notifications).
- Booking state machine: QUOTE → HOLD → PAYMENT → CONFIRMED → COMPLETED, with EXPIRED_HOLD/CANCEL paths. Never skip states.

## 2) Release Gates (must be true before deploying)
- Tests: unit + integration + E2E green; coverage ≥ target (70%+ overall; bookings 95%+).
- Security: rate limiting active; CORS whitelist set; HTTPS enforced in production; secrets not in logs; JWT expiry set.
- Performance: p95 < 200ms; no known N+1; DB indexes verified for hot queries.
- Data integrity: migrations reviewed and validated on staging clone of prod; backups taken.
- Feature gates: provider verification must block publishing; booking price snapshots persisted; idempotency keys enforced on hold/confirm.

## 3) Environment Requirements
- Node per `.nvmrc` and pnpm installed.
- Docker/Docker Compose available for build and local validation.
- Access to Postgres/Redis/Meilisearch endpoints and credentials.
- DNS/Load balancer credentials for blue-green switch.

## 4) Environment Variables (minimum)
Create `.env` files per environment; never commit secrets.
- Backend: `DATABASE_URL`, `REDIS_URL`, `MEILISEARCH_HOST`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `CORS_ORIGINS`, `RATE_LIMIT_ANON`, `RATE_LIMIT_AUTH`, `STORAGE_SIGNING_KEY`, `STRIPE_WEBHOOK_SECRET` (when live), `PORT=4100`.
- Web: `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_SENTRY_DSN` (if used), `NEXT_PUBLIC_MEILISEARCH_HOST`, `PORT=4000`.
- Observability: `SENTRY_DSN`, `LOG_LEVEL`, `REQUEST_ID_HEADER`.

## 5) Database Migration Policy (critical)
- Staging-first: run all migrations on a staging DB cloned from production; verify reads/writes and booking flow.
- Peer review: every migration PR reviewed by another engineer for performance and backward compatibility.
- Backups: take a production backup (pg_dump or snapshot) immediately before running migrations.
- Zero-downtime rules: avoid destructive changes; use expand-and-contract (add columns nullable, backfill, then enforce).
- Roll-forward preferred; rollback plan documented for every migration.

## 6) Pre-Deployment Checklist
- Code: main branch up to date; version bump if needed; changelog updated.
- Tests: `pnpm lint`, `pnpm test -- --coverage`, integration/E2E suite green.
- Build: `pnpm build` in backend and web succeeds.
- Assets: OpenAPI/Swagger generated and published; environment files present on target hosts.
- Secrets: loaded into secret manager or deployment env; verified non-empty.
- DB: migrations queued; backup completed; locks/long transactions cleared.
- Queues: BullMQ queues healthy; no stuck jobs; clean delayed/failed jobs that would conflict.

## 7) Build and Package
- Install deps: `pnpm install` (workspace root).
- Backend build: `cd backend && pnpm build` (outputs dist/).
- Web build: `cd web && pnpm build`.
- Docker (example tags):
  - `docker build -t tripavail/api:latest -f backend/Dockerfile .`
  - `docker build -t tripavail/web:latest -f web/Dockerfile .`
- Tag with release: `tripavail/api:mvp-v1.0.0`, `tripavail/web:mvp-v1.0.0` and date tags.

## 8) Deployment Steps (blue-green)
1) Provision green environment
- Create new app instances (API + web) with new image tags and env vars.
- Do not cut traffic yet.

2) Run migrations on database
- Point migration job to production DB:
  - `cd backend && pnpm migration:run`
- Verify schema version table updated; check logs for errors.

3) Warm up green
- Start services: API on 4100, web on 4000 (internal).
- Hit health checks: `GET /health` (liveness) and `GET /health/ready` (DB, Redis, Meilisearch).
- Run smoke suite against green: registration, login, provider onboarding happy path, hotel/tour package fetch, quote → hold → confirm.

4) Switch traffic
- Update load balancer to send traffic to green (keep blue draining for a short period).
- Monitor error rate, latency, and queue depths for 10-15 minutes.

5) Decommission blue
- After stability window, scale down old tasks/containers.
- Archive old images with tag `previous-release` for rollback.

## 9) Rollback Procedures
- If failure during migration and schema incompatible: restore DB from pre-deploy backup, redeploy previous app images.
- If failure after switch but schema compatible: revert LB to blue; keep green running for inspection.
- If migration introduces data issue but backward compatible: hotfix migration or roll forward with corrective script.
- Always announce rollback in release channel; record duration and impact.

## 10) Post-Deployment Validation
- Health: `/health` and `/health/ready` return 200.
- Booking flow: create quote (priceSnapshot persisted), hold (inventory decremented with TTL), confirm (ledger entries recorded, status CONFIRMED).
- Provider gating: unapproved providers cannot publish; approved providers can publish packages.
- Search indexing: new/updated packages enqueued; Meilisearch sync jobs not failing.
- Notifications: confirmation email/SMS jobs enqueued.
- Logs: no P0/P1 errors; structured JSON with requestId present.
- Metrics: p95 latency < 200ms; DB connections within pool limits; Redis memory stable; queue wait times low.

## 11) Smoke Tests (minimum)
- API: auth register/login; GET `/v1/hotel-packages`; GET `/v1/tour-packages`; POST `/v1/bookings/quote` + hold + confirm.
- Web: landing renders; discovery list loads; package detail renders; quote form submits and displays price.
- Admin (if enabled): login; provider approval action succeeds.

## 12) Observability Setup
- Sentry DSN configured for API and web; release tag set to git tag.
- Winston/structured logs shipped to log aggregation; include `requestId`, `userId`, and path.
- Postgres monitoring: slow query log enabled; alerts on connections, replication lag, and locks.
- BullMQ dashboards: watch active/waiting/failed counts for bookings, notifications, indexing.

## 13) Security and Compliance
- HTTPS enforced; HSTS enabled at edge.
- CORS whitelist matches allowed origins; no wildcard in production.
- Rate limiting profiles: anonymous 10 req/min, authenticated 100 req/min, providers 500 req/min, login 3 req/5 min.
- Signed URLs for uploads with MIME validation; no direct file storage in DB.
- Webhook event logs persisted for payment gateways.

## 14) Post-Launch Checklist (Day 50)
- Git tag `mvp-v1.0.0` pushed.
- Docker images pushed with release and date tags.
- Staging/production deployed and smoke tests passed.
- Monitoring dashboards open; alerts enabled.
- Launch announcement sent with features and known limitations.

## 15) Appendix: Command Reference
- Lint: `pnpm lint`
- Tests: `pnpm test -- --coverage`
- Backend dev: `cd backend && pnpm dev`
- Web dev: `cd web && pnpm dev --port 4000`
- Docker compose (local): `docker-compose up -d`
- Health: `curl http://localhost:4100/health` and `/health/ready`

Follow this guide sequentially. Do not bypass migration policy or release gates. If anything fails, pause the rollout and execute rollback before retrying.
