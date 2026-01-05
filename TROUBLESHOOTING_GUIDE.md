# TripAvail Troubleshooting Guide

Purpose: fast diagnosis and fixes for common production issues across API, web, database, queues, and infrastructure. Use with Deployment Guide and Operations Runbook.

## General Triage Flow
1) Reproduce or collect failing requestId and endpoint.
2) Check health: `/health` and `/health/ready`.
3) Review logs around requestId (API and web) for stack traces and validation errors.
4) Check metrics: latency, error rate, queue depth, DB connections.
5) Decide: rollback, hotfix, or configuration change.

## Common Issues and Fixes

### 1) Database connection failures
- Symptoms: readiness fails; `ECONNREFUSED` or `too many clients`.
- Checks: Postgres reachable on 5432; credentials/`DATABASE_URL` correct; security group/firewall open; connection pool limits.
- Fixes: restart app instances to clear leaked connections; reduce pool size; kill idle-in-transaction sessions; confirm migrations ran.

### 2) High response times (p95 > 200ms)
- Symptoms: latency alerts; timeouts on booking endpoints.
- Checks: Postgres slow query log; look for N+1 in listing/package queries; queue latency; CPU on app nodes.
- Fixes: add or verify indexes (package status, providerId, booking status); limit includes; cache immutable reference data; scale API instances; ensure Redis available for rate limits and idempotency.

### 3) Memory leaks or spikes
- Symptoms: pod/container OOM; restarts; rising RSS.
- Checks: heap snapshots if enabled; long-lived arrays or caches; unbounded queue retries.
- Fixes: cap cache sizes; ensure stream/readers closed; upgrade instance memory; deploy with Node flags to inspect heap if persists.

### 4) Queue backlog (BullMQ)
- Symptoms: delayed holds expiry, notifications stuck, indexing delayed.
- Checks: queue depth and failed counts; Redis latency; worker logs.
- Fixes: scale workers; clear poison jobs; retry failures; verify Redis memory not evicting keys; pause non-critical queues if needed.

### 5) Booking state stuck or wrong
- Symptoms: bookings not moving from QUOTE→HOLD→CONFIRMED; duplicate confirmations; expired holds not releasing inventory.
- Checks: status field and timestamps; priceSnapshot presence; inventory tables for decremented units; hold expiry job status; idempotency key stored.
- Fixes: rerun expiry worker; manually release expired holds with transaction; ensure idempotency keys enforced; replay ledger if duplicate entries detected.

### 6) Idempotency errors
- Symptoms: duplicate responses or 409 conflicts on POST.
- Checks: Redis TTL for idempotency keys; header `Idempotency-Key` presence; clock skew.
- Fixes: validate key reuse rules; increase TTL to 24h; purge corrupted keys; educate clients to reuse key on retry.

### 7) Search not returning new packages
- Symptoms: published package not searchable.
- Checks: indexing queue; Meilisearch availability on 7700; recent job failures.
- Fixes: retry failed jobs; reindex package; if Meilisearch down, queue jobs and resume after recovery.

### 8) Provider cannot publish
- Symptoms: publish API returns forbidden or validation error.
- Checks: provider verificationStatus == APPROVED; property profile status APPROVED for hotels; RBAC role correct.
- Fixes: complete verification; update property profile; ensure gate guard deployed.

### 9) Authentication/authorization failures
- Symptoms: 401/403 across endpoints.
- Checks: JWT expiry and clock drift; `CORS_ORIGINS` mismatch; rate limit blocks; auth service secrets.
- Fixes: resync clocks; update CORS whitelist; reset rate limit buckets in Redis; rotate JWT secret if compromised (force logout).

### 10) Payment webhook issues (when live)
- Symptoms: missing confirmations or payouts; duplicate charges.
- Checks: webhook event log table; signature verification; idempotency on gateway.
- Fixes: replay events; rotate webhook secret if invalid; ensure ledger double-entry matches payment status.

### 11) Kubernetes or container issues
- Symptoms: pod crashloop; readiness failing after deploy.
- Checks: env vars present; config maps up to date; liveness/readiness probes hitting correct path; resource limits.
- Fixes: correct probe paths (/health, /health/ready); increase memory/CPU; redeploy with correct env; roll back to prior image if new bug.

### 12) Frontend rendering errors
- Symptoms: blank pages, hydration errors, API CORS failures.
- Checks: browser console; network requests to API base URL; env `NEXT_PUBLIC_API_URL` set; build cache.
- Fixes: clear CDN cache; redeploy web with correct API URL and CORS origins; fix SSR data fetching errors.

## Rollback Decision Tree
- If schema change broke prod and incompatible: restore DB backup and redeploy previous image.
- If app bug but schema compatible: flip traffic back to blue release; keep green for debugging.
- If only config wrong: fix env var or secret and restart; avoid rollback if stateful change not impacted.

## Data Safety Reminders
- Never modify booking totals manually; use snapshots and ledger corrections.
- Always use transactions for inventory adjustments and refunds.
- Log admin actions; keep audit trail intact.

## Contacts
- Production issues: on-call engineer.
- Database issues: database team.
- Security incidents: security lead and VP Engineering.

Use this guide alongside the runbook; capture requestIds and timelines during every incident for postmortems.
