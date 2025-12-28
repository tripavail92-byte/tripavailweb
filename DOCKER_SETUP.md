# TripAvail - Complete Local Development Setup

## Quick Start

```bash
# 1. Start all services
docker-compose up -d

# 2. Install dependencies (after backend/web are initialized)
pnpm install

# 3. Run database migrations
cd backend && pnpm prisma migrate dev

# 4. Seed database (optional)
pnpm seed

# 5. Start development servers
# Terminal 1 - Backend
cd backend && pnpm dev

# Terminal 2 - Web
cd web && pnpm dev
```

## Service Access Points

### Core Services

- **Web Portal:** http://localhost:3100
- **API Backend:** http://localhost:4100
- **API Docs:** http://localhost:4100/api (Swagger UI)

### Databases

- **Postgres (Main):** `localhost:5432`
  - Database: `tripavail`
  - User: `postgres`
  - Password: `postgres`
- **Postgres (Test):** `localhost:5433`
  - Database: `tripavail_test`
  - User: `postgres`
  - Password: `postgres`

- **Redis:** `localhost:6379`
  - Password: `redis_password`

- **Meilisearch:** `localhost:7700`
  - Master Key: `meilisearch_master_key_change_in_production`

### Development Tools

- **MailHog (Email Testing):** http://localhost:8025
- **MinIO Console (S3 Storage):** http://localhost:9001
  - User: `minioadmin`
  - Password: `minioadmin123`
- **Adminer (Database GUI):** http://localhost:8080
- **Redis Commander (Redis GUI):** http://localhost:8081

## Complete Port Reference

| Port | Service         | Purpose               |
| ---- | --------------- | --------------------- |
| 3100 | Next.js Web     | Public web portal     |
| 4100 | NestJS API      | Backend API           |
| 5432 | Postgres        | Main database         |
| 5433 | Postgres Test   | Test database         |
| 6379 | Redis           | Cache & job queue     |
| 7700 | Meilisearch     | Search engine         |
| 1025 | MailHog SMTP    | Email server          |
| 8025 | MailHog UI      | Email inbox           |
| 8080 | Adminer         | Database GUI          |
| 8081 | Redis Commander | Redis GUI             |
| 9000 | MinIO API       | S3-compatible storage |
| 9001 | MinIO Console   | Storage management    |

## Docker Commands

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# View logs for specific service
docker-compose logs -f postgres

# Stop all services
docker-compose down

# Stop and remove volumes (⚠️ deletes all data)
docker-compose down -v

# Restart a specific service
docker-compose restart redis

# Check service health
docker-compose ps
```

## Health Checks

All services include health checks. Check status:

```bash
# Check all services
docker-compose ps

# Expected output:
# NAME                        STATUS
# tripavail_postgres         Up (healthy)
# tripavail_postgres_test    Up (healthy)
# tripavail_redis            Up (healthy)
# tripavail_meilisearch      Up (healthy)
# tripavail_mailhog          Up (healthy)
# tripavail_minio            Up (healthy)
```

## Database Connection Strings

```env
# .env file examples

# Main database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/tripavail"

# Test database
TEST_DATABASE_URL="postgresql://postgres:postgres@localhost:5433/tripavail_test"

# Redis
REDIS_URL="redis://:redis_password@localhost:6379"

# Meilisearch
MEILISEARCH_HOST="http://localhost:7700"
MEILISEARCH_API_KEY="meilisearch_master_key_change_in_production"

# SMTP (MailHog)
SMTP_HOST="localhost"
SMTP_PORT="1025"
SMTP_SECURE="false"

# S3 (MinIO)
S3_ENDPOINT="http://localhost:9000"
S3_ACCESS_KEY="minioadmin"
S3_SECRET_KEY="minioadmin123"
S3_BUCKET="tripavail"
```

## Troubleshooting

### Port Already in Use

```bash
# Windows (PowerShell)
netstat -ano | findstr :5432
taskkill /PID <process_id> /F

# Or change port in docker-compose.yml
# ports:
#   - "5434:5432"  # Changed from 5432
```

### Services Won't Start

```bash
# Check Docker Desktop is running
docker info

# Reset Docker volumes
docker-compose down -v
docker-compose up -d
```

### Database Connection Refused

```bash
# Wait for health check to pass
docker-compose ps

# Check logs
docker-compose logs postgres

# Test connection manually
docker exec -it tripavail_postgres psql -U postgres -d tripavail
```

### Reset Everything

```bash
# Nuclear option - delete all data and start fresh
docker-compose down -v
docker system prune -a
docker-compose up -d
```

## Production Differences

⚠️ **Never use these settings in production:**

1. **Remove development tools:**
   - MailHog (use real SMTP: SendGrid, AWS SES)
   - MinIO (use AWS S3, Cloudflare R2)
   - Adminer (security risk)
   - Redis Commander (security risk)

2. **Use managed services:**
   - Postgres → AWS RDS, Supabase, Neon
   - Redis → AWS ElastiCache, Upstash
   - Meilisearch → Meilisearch Cloud, self-hosted cluster

3. **Secure credentials:**
   - Generate strong random passwords
   - Use secrets management (AWS Secrets Manager, HashiCorp Vault)
   - Enable TLS/SSL for all connections

4. **Scale configuration:**
   - Connection pooling (PgBouncer)
   - Redis cluster mode
   - Read replicas for databases
   - CDN for static assets

## Next Steps

After services are running:

1. **Initialize Backend:**

   ```bash
   cd backend
   pnpm install
   pnpm prisma generate
   pnpm prisma migrate dev
   ```

2. **Initialize Web:**

   ```bash
   cd web
   pnpm install
   ```

3. **Create first user:** Visit http://localhost:3100/auth/register

4. **Test API:** Visit http://localhost:4100/api (Swagger docs)

5. **Send test email:** Trigger any email action, check http://localhost:8025

6. **Upload test image:** Use any file upload, check http://localhost:9001

---

_For detailed setup and engineering standards, see [DEVELOPER_SETUP_IMPROVEMENTS.md](DEVELOPER_SETUP_IMPROVEMENTS.md)_
