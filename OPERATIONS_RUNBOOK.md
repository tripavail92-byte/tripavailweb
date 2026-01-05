# TripAvail Operations Runbook

Audience: on-call engineers and operators. Purpose: daily operations, monitoring, incident response, and maintenance for TripAvail (NestJS API + Next.js web, Postgres, Redis, Meilisearch, BullMQ jobs).

## 1) Service Map and Dependencies
- API (NestJS) on port 4100; depends on Postgres, Redis, Meilisearch, BullMQ queues.
- Web (Next.js) on port 4000; depends on API and CDN.
- Postgres on 5432 for bookings, packages, ledger, and inventory locks.
- Redis on 6379 for rate limiting, idempotency keys, and BullMQ.
- Meilisearch on 7700 for search indexing (stubs acceptable if disabled).

## 2) Health Checks
- Liveness: `GET /health`.
- Readiness: `GET /health/ready` (verifies DB, Redis, Meilisearch).
- Smoke actions: auth register/login, list packages, quote → hold → confirm booking.

## 3) Monitoring Stack
- Errors: Sentry for API and web with release tags. Alert on P0/P1.
- Logs: Winston/JSON; include `requestId`, user context, path, status code, latency. Ship to log aggregation.
- Metrics: p95 latency < 200ms; DB connections; queue latency; Redis memory; Meilisearch uptime.
- Queues: BullMQ dashboards per queue (bookings, notifications, search indexing). Alert on waiting > threshold or failed > 0.5%.
- Database: Postgres slow query log; track lock waits and deadlocks; check autovacuum and bloat.

## 4) SLOs and Alert Thresholds
- Availability: 99.5% monthly.
- API latency: p95 < 200ms; p99 < 400ms.
- Error rate: <0.1% 5xx over 5 minutes.
- Queue delay: <30s for bookings/notifications; <2m for indexing.
- Booking integrity: no missing state transitions; holds expire on schedule.

## 5) Daily and Shift Checklist
- Review error dashboard (Sentry) and top stack traces.
- Check logs for repeated WARN/ERROR, especially booking transitions and payment webhooks.
- Inspect BullMQ queue depths and failed jobs; retry or fix root cause.
- Verify readiness on deployed environments; spot-check booking flow in staging.
- Check Postgres: connection count, slow query log entries, and lock waits.
- Ensure backups completed; confirm retention and integrity.

## 6) Incident Response
1) Classify severity
- P0: outage or bookings broken (quote/hold/confirm failing); security breach.
- P1: degraded performance (p95 > 400ms), queue backlog, partial feature outage.
- P2: minor issues or single feature bug.

2) Initial actions
- Acknowledge alert; assign incident commander.
- Capture requestId from error responses; pull logs.
- Check health/readiness; check DB, Redis, queues status.

3) Mitigation playbook
- If API failing: consider reverting to previous release (blue environment) if available.
- If DB under load: enable connection limits, analyze slow queries, kill long-running offenders after snapshotting.
- If queue backlog: scale workers horizontally; pause non-critical queues if needed.

4) Communication
- Post status to incident channel with: start time, impact, scope, next update time.
- Update every 15-30 minutes until resolved.

5) Resolution
- Verify health and key flows; close incident with root cause and action items.

## 7) Playbooks

### Booking stuck in HOLD or missing transitions
- Check `bookings` table status and `expiresAt` TTL.
- Verify BullMQ hold expiry worker running; inspect failed jobs.
- If many holds expired but not released, rerun expiry job or run manual script to release inventory.
- Confirm idempotency keys stored in Redis; if missing, investigate gateway retries.

### Inventory locking issues
- Ensure transactions use row-level locks per inventory update queries.
- Look for concurrent updates failing due to insufficient units; expect rejections beyond capacity.
- If overbooking suspected, stop confirmations temporarily, audit recent transactions, and replay ledger if needed.

### Payment webhook failure (when live)
- Check webhook event log table for status and last error.
- Replay webhook after fixing secret or handler; use idempotency to avoid duplicates.
- If payouts delayed, verify ledger entries and payout scheduling jobs.

### Search indexing backlog
- Check indexing queue depth; retry failed jobs.
- Confirm Meilisearch is reachable on 7700; if down, pause indexing jobs and resume after recovery.

### Provider verification gate bypass risk
- Ensure provider status is APPROVED and property profile APPROVED before publishing; audit recent publishes; suspend listings if gate misconfigured.

### Authentication anomalies
- Rate limit spikes: inspect Redis keys; adjust limits temporarily if false positives.
- JWT issues: verify clock skew, expiration, and signing keys.

## 8) Maintenance Tasks
- Backups: daily Postgres backups; weekly restore tests from backup.
- Vacuum/Analyze: monitor autovacuum; manually run `VACUUM ANALYZE` on bloated tables if needed off-peak.
- Index review: quarterly check on booking, provider, package, inventory tables.
- Dependency updates: monthly patch cycle; security fixes prioritized.
- Secrets rotation: rotate JWT secrets and storage signing keys quarterly; coordinate downtime or rolling update.

## 9) Change Management
- All migrations reviewed and staged before production.
- Releases follow blue-green with smoke tests before traffic cutover.
- Announce deployments with planned window and rollback plan.

## 10) Postmortems
- Required for P0/P1 incidents.
- Include timeline, impact, root cause, contributing factors, what worked, what failed, and action items with owners and dates.

## 11) Contact and Escalation
- Primary: on-call engineer (pager/phone).
- Secondary: backend lead.
- Tertiary: VP Engineering for launch risk.

Keep this runbook close to the deployment and troubleshooting guides. Follow playbooks first, then escalate. Document any deviations for future updates.
