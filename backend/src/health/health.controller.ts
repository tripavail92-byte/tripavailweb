import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Client } from 'pg';
import Redis from 'ioredis';

@ApiTags('health')
@Controller('health')
export class HealthController {
  @Get()
  @ApiOperation({ summary: 'Basic health check' })
  @ApiResponse({ status: 200, description: 'Service is healthy' })
  getHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      service: 'TripAvail API',
      version: '1.0.0',
    };
  }

  @Get('ready')
  @ApiOperation({ summary: 'Readiness check with dependencies' })
  @ApiResponse({ status: 200, description: 'Service is ready' })
  @ApiResponse({ status: 503, description: 'Service is not ready' })
  async getReadiness() {
    const timestamp = new Date().toISOString();

    const dbStatus = await this.checkDatabase();
    const redisStatus = await this.checkRedis();
    const meiliStatus = await this.checkMeilisearch();

    const allOk = [dbStatus, redisStatus, meiliStatus].every((s) => s === 'ok');

    return {
      status: allOk ? 'ready' : 'not_ready',
      timestamp,
      checks: {
        database: dbStatus,
        redis: redisStatus,
        meilisearch: meiliStatus,
      },
    };
  }

  private async checkDatabase(): Promise<string> {
    const url = process.env.DATABASE_URL;
    if (!url) return 'missing DATABASE_URL';
    const client = new Client({ connectionString: url });
    try {
      await client.connect();
      await client.query('SELECT 1');
      return 'ok';
    } catch (e: any) {
      return `error: ${e?.message ?? 'unknown'}`;
    } finally {
      try {
        await client.end();
      } catch {}
    }
  }

  private async checkRedis(): Promise<string> {
    const url = process.env.REDIS_URL;
    if (!url) return 'missing REDIS_URL';
    const redis = new Redis(url, { lazyConnect: true, maxRetriesPerRequest: 1 });
    try {
      await redis.connect();
      const pong = await redis.ping();
      return pong.toLowerCase().includes('pong') ? 'ok' : `error: ${pong}`;
    } catch (e: any) {
      return `error: ${e?.message ?? 'unknown'}`;
    } finally {
      try {
        await redis.quit();
      } catch {}
    }
  }

  private async checkMeilisearch(): Promise<string> {
    const host = process.env.MEILISEARCH_HOST;
    if (!host) return 'missing MEILISEARCH_HOST';
    try {
      const res = await fetch(`${host}/health`, { method: 'GET' });
      if (!res.ok) return `error: status ${res.status}`;
      const body = await res.json();
      return body?.status === 'available' ? 'ok' : 'error: unavailable';
    } catch (e: any) {
      return `error: ${e?.message ?? 'unknown'}`;
    }
  }
}
