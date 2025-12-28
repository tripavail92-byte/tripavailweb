# WEEK 1: Infrastructure & Foundation Setup

**Duration:** Day 1-5 (26-30 Dec 2025)  
**Goal:** Get local development environment running with all Tier 1 standards in place  
**Team:** Full team (3-4 devs)  
**Status:** 🟠 IN PROGRESS

---

## Week 1 Objectives

✅ All services running locally (Postgres, Redis, Meilisearch, etc.)  
✅ TypeScript strict mode enabled  
✅ OpenAPI/Swagger documentation framework  
✅ Git workflow + branch protection set up  
✅ Error handling & logging infrastructure  
✅ Security headers (Helmet, CORS, rate limiting)  
✅ Environment validation (Zod)  
✅ CI/CD pipeline passing first tests

---

## 📅 Daily Breakdown

### Day 1 (Wed 26 Dec): Project Initialization

**Morning (2-3 hours)**

- [ ] Clone repository and set up workspace
- [ ] Install Node.js 20.x LTS
- [ ] Install pnpm 8.x
- [ ] Initialize monorepo workspace structure

```bash
# Root directory structure
tripavailweb/
├── backend/          # NestJS
├── web/              # Next.js
├── shared/           # Shared types
└── docs/             # Documentation
```

- [ ] Create root `package.json` with workspaces

```json
{
  "name": "tripavail",
  "version": "1.0.0",
  "private": true,
  "packageManager": "pnpm@8.15.0",
  "workspaces": ["backend", "web", "shared"]
}
```

- [ ] Set up `.gitignore`, `.nvmrc`
- [ ] Create initial GitHub repository (main, develop, staging branches)

**Afternoon (2-3 hours)**

- [ ] Initialize NestJS backend

```bash
cd backend
npx @nestjs/cli new . --skip-git --package-manager pnpm
```

- [ ] Initialize Next.js web

```bash
cd ../web
npx create-next-app@latest . --typescript --tailwind --app --skip-git
```

- [ ] Initialize shared types package

```bash
cd ../shared
mkdir -p packages/shared/src/types
```

- [ ] Update pnpm-workspace.yaml

**End of Day**

- [ ] Verify all three projects have consistent tsconfig.json
- [ ] Commit: `chore: initialize monorepo structure`

---

### Day 2 (Thu 27 Dec): Docker & Local Services Setup

**Morning (3 hours)**

- [ ] Copy `docker-compose.yml` (already created)
- [ ] Update for core services only (Postgres, Redis, Meilisearch)

```bash
cd tripavailweb
# Start services
docker-compose up -d

# Wait 30s for health checks
sleep 30
docker-compose ps
```

- [ ] Verify all services healthy:
  - [ ] Postgres: `psql -h localhost -U postgres -d tripavail -c "SELECT 1"`
  - [ ] Redis: `redis-cli -h localhost ping` (should return PONG)
  - [ ] Meilisearch: `curl http://localhost:7700/health`

- [ ] Create `.env.local` file (backend)

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/tripavail"
DATABASE_TEST_URL="postgresql://postgres:postgres@localhost:5433/tripavail_test"
REDIS_URL="redis://:redis_password@localhost:6379"
NODE_ENV=development
```

- [ ] Create `.env.local` file (web)

```env
NEXT_PUBLIC_API_URL=http://localhost:4100
NEXT_PUBLIC_APP_NAME=TripAvail
```

**Afternoon (2 hours)**

- [ ] Set up Prisma in backend

```bash
cd backend
pnpm add -D @prisma/cli
pnpm add @prisma/client
npx prisma init
```

- [ ] Update `prisma/schema.prisma` with basic User model

```prisma
// prisma/schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id        String   @id @default(uuid())
  email     String   @unique
  password  String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

- [ ] Run first migration

```bash
npx prisma migrate dev --name init
```

- [ ] Generate Prisma client

```bash
npx prisma generate
```

**End of Day**

- [ ] All services running and healthy
- [ ] Database migrations working
- [ ] Commit: `chore: setup docker services and prisma`

---

### Day 3 (Fri 28 Dec): TypeScript Strict Mode & Configuration

**Morning (2 hours)**

- [ ] Enable TypeScript strict mode in backend `tsconfig.json`

```json
{
  "compilerOptions": {
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

- [ ] Apply same to web `tsconfig.json`
- [ ] Apply same to shared `tsconfig.json`
- [ ] Update backend `.eslintrc.js`

```typescript
module.exports = {
  parser: '@typescript-eslint/parser',
  extends: ['plugin:@typescript-eslint/strict', 'plugin:prettier/recommended'],
  rules: {
    '@typescript-eslint/explicit-function-return-types': 'error',
    '@typescript-eslint/explicit-module-boundary-types': 'error',
  },
};
```

- [ ] Add Prettier config (`.prettierrc`)

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2
}
```

**Afternoon (2 hours)**

- [ ] Set up Husky and commitlint

```bash
cd backend
pnpm add -D husky lint-staged commitlint @commitlint/cli @commitlint/config-conventional

npx husky install
npx husky add .husky/pre-commit "pnpm lint-staged"
npx husky add .husky/pre-push "pnpm test"
```

- [ ] Create `.commitlintrc.js`

```typescript
module.exports = { extends: ['@commitlint/config-conventional'] };
```

- [ ] Update `package.json` with lint-staged

```json
{
  "lint-staged": {
    "*.ts": ["eslint --fix", "prettier --write"],
    "*.tsx": ["eslint --fix", "prettier --write"]
  }
}
```

- [ ] Run linter on all files

```bash
pnpm lint --fix
pnpm format
```

**End of Day**

- [ ] All TypeScript files pass strict mode checks
- [ ] ESLint and Prettier configured
- [ ] Pre-commit hooks working
- [ ] Commit: `chore: enable typescript strict mode and linting`

---

### Day 4 (Sat 29 Dec): Security Foundations & Error Handling

**Morning (2.5 hours)**

- [ ] Install security packages in backend

```bash
pnpm add helmet @nestjs/throttler
pnpm add zod
```

- [ ] Update `main.ts` with Helmet, rate limiting, CORS, validation

```typescript
// backend/src/main.ts
import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Security
  app.use(helmet());

  app.enableCors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3100'],
    credentials: true,
  });

  // Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  await app.listen(4100);
}
bootstrap();
```

- [ ] Create `src/config/env.config.ts` with Zod validation

```typescript
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  PORT: z.coerce.number().default(4100),
});

export const env = envSchema.parse(process.env);
```

**Afternoon (2.5 hours)**

- [ ] Create global exception filter

```typescript
// backend/src/common/filters/http-exception.filter.ts
import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { v4 as uuid } from 'uuid';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();
    const requestId = request.id || uuid();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let error = 'INTERNAL_ERROR';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      message =
        typeof exceptionResponse === 'string'
          ? exceptionResponse
          : (exceptionResponse as any).message || message;
      error = (exceptionResponse as any).error || error;
    }

    response.status(status).json({
      statusCode: status,
      message,
      error,
      timestamp: new Date().toISOString(),
      path: request.url,
      requestId,
    });
  }
}
```

- [ ] Create request context middleware

```typescript
// backend/src/common/middleware/request-context.middleware.ts
import { Injectable, NestMiddleware } from '@nestjs/common';
import { v4 as uuid } from 'uuid';
import { NextFunction, Request, Response } from 'express';

@Injectable()
export class RequestContextMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    req['id'] = req.headers['x-request-id'] || uuid();
    res.setHeader('X-Request-ID', req['id']);
    next();
  }
}
```

**End of Day**

- [ ] Error handling working (test with invalid endpoint)
- [ ] Request IDs being generated and logged
- [ ] Security headers in place
- [ ] Commit: `feat(common): add global exception filter and request context`

---

### Day 5 (Sun 30 Dec): OpenAPI & Swagger Setup

**Morning (2 hours)**

- [ ] Install Swagger/OpenAPI packages

```bash
pnpm add @nestjs/swagger swagger-ui-express
```

- [ ] Update `main.ts` to enable Swagger

```typescript
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

const config = new DocumentBuilder()
  .setTitle('TripAvail API')
  .setDescription('Two-sided travel marketplace API')
  .setVersion('1.0')
  .addBearerAuth()
  .addServer('http://localhost:4100', 'Development')
  .build();

const document = SwaggerModule.createDocument(app, config);
SwaggerModule.setup('api', app, document);
```

- [ ] Create sample controller with Swagger decorators

```typescript
// backend/src/health/health.controller.ts
import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiOkResponse } from '@nestjs/swagger';

@Controller('health')
export class HealthController {
  @Get()
  @ApiOperation({ summary: 'Health check' })
  @ApiOkResponse({ schema: { example: { status: 'ok', timestamp: new Date() } } })
  check(): { status: string; timestamp: Date } {
    return { status: 'ok', timestamp: new Date() };
  }
}
```

**Afternoon (2.5 hours)**

- [ ] Create shared types package structure

```bash
mkdir -p shared/src/types/{dtos,models}
```

- [ ] Create shared types index file

```typescript
// shared/src/types/index.ts
export interface ApiResponse<T> {
  statusCode: number;
  message: string;
  data?: T;
  requestId?: string;
}

export interface ErrorResponse {
  statusCode: number;
  message: string;
  error: string;
  timestamp: string;
  path: string;
  requestId: string;
}
```

- [ ] Set up TypeScript path aliases in shared `tsconfig.json`

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@shared/*": ["src/*"]
    }
  }
}
```

- [ ] Test Swagger UI: http://localhost:4100/api

**End of Day (Status Check)**

- [ ] Swagger UI accessible and showing Health endpoint
- [ ] All code passes linter
- [ ] All commits follow convention
- [ ] Final commit: `feat: setup openapi and swagger documentation`

---

## 📋 Week 1 Completion Checklist

**Infrastructure** ✅

- [ ] Docker Compose running all services
- [ ] Postgres migrations working
- [ ] Redis connectivity verified
- [ ] Meilisearch running

**Code Quality** ✅

- [ ] TypeScript strict mode enabled everywhere
- [ ] ESLint passing all checks
- [ ] Prettier formatting applied
- [ ] Husky pre-commit hooks working

**Security** ✅

- [ ] Helmet installed and configured
- [ ] CORS whitelist configured
- [ ] Rate limiting package installed
- [ ] Zod env validation in place

**Error Handling** ✅

- [ ] Global exception filter working
- [ ] Request IDs generated and logged
- [ ] Error responses standardized

**API Documentation** ✅

- [ ] Swagger UI running
- [ ] Sample endpoint documented
- [ ] Shared types package created

**Git & CI/CD** ✅

- [ ] Branch protection on main
- [ ] Commitlint enforcing conventions
- [ ] Pre-commit hooks preventing bad commits

---

## 🚀 Week 1 Success Criteria

**All of these must be done:**

1. ✅ Run `docker-compose ps` → all services healthy
2. ✅ Run `pnpm lint` → zero errors
3. ✅ Run `pnpm test` → passing (basic)
4. ✅ Visit `http://localhost:4100/api` → Swagger UI visible
5. ✅ Make bad commit → commitlint blocks it
6. ✅ Visit `http://localhost:3100` → Next.js homepage loads
7. ✅ All git branches created (main, develop, staging)

**If any of the above fails, stop and fix before moving to Week 2.**

---

## 📝 Notes for Week 2 Handoff

- Backend running on port 4100 ✅
- Web running on port 3100 ✅
- All CI checks passing ✅
- Ready to build auth module ✅

---

**Week Status:** 🟠 IN PROGRESS  
**Estimated Completion:** 30 Dec 2025  
**Next:** [WEEK_2.md](WEEK_2.md) - Database Schema & OpenAPI Codegen
