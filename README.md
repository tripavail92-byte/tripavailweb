# TripAvail

**Two-sided travel marketplace** with Stays, Hotel Packages, and Tour Packages.

## Architecture

- **Frontend:** Next.js 14+ (port 3100)
- **Backend:** NestJS (port 4100)
- **Database:** Postgres 16 (port 5432)
- **Cache:** Redis 7 (port 6379)
- **Search:** Meilisearch (port 7700)

## Quick Start

```bash
# Install dependencies
pnpm install

# Start local services
docker-compose up -d

# Run database migrations
cd backend && pnpm prisma migrate dev

# Start development servers
pnpm dev
```

## Tests

### Backend E2E tests (seeded)

The backend E2E suite seeds the database in Jest `globalSetup` (it wipes and re-seeds to a known-good baseline).

If `pnpm` is not available on PATH (common on Windows without an admin-installed pnpm/Corepack shim), you can run it via `npx`:

```bash
cd backend
npx -y pnpm@10.26.2 test:e2e
```

### Manual seed + unit tests

In CI (or locally), set the env vars, then seed and run tests:

```bash
cd backend
export DATABASE_URL="postgresql://postgres:postgres@localhost:5434/tripavail"
export REDIS_URL="redis://localhost:6380"
export MEILISEARCH_HOST="http://localhost:7700"
pnpm seed && pnpm test
```

## Development Ports

- Web: http://localhost:3100
- API: http://localhost:4100
- API Docs: http://localhost:4100/api

## Host Snapshot (UI Prefill)

The endpoint `GET /v1/host/properties/:id/snapshot` is intended for **UI prefill only** (web/Flutter can pre-populate hotel package creation forms).

- It is **not** a server-side auto-population guarantee.
- `media` (and any future primary cover URL) may be `null` until onboarding stores media steps.

## Documentation

- [Week 1 Plan](WEEK_1.md)
- [Master Checklist](MASTER_CHECKLIST.md)
- [Engineering Decisions](ENGINEERING_DECISIONS.md)
- [Production Roadmap](PRODUCTION_ROADMAP.md)

## Project Structure

```
tripavailweb/
├── backend/          # NestJS API
├── web/              # Next.js portal
├── shared/           # Shared types & utilities
├── docker-compose.yml
└── pnpm-workspace.yaml
```

## License

UNLICENSED - Proprietary
