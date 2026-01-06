import { Injectable, NestMiddleware } from '@nestjs/common';
import { randomUUID } from 'crypto';

@Injectable()
export class RequestContextMiddleware implements NestMiddleware {
  use(req: any, res: any, next: () => void) {
    // Generate or use existing request ID
    const requestId = (req.headers['x-request-id'] as string) || randomUUID();
    req.headers['x-request-id'] = requestId;
    res.setHeader('X-Request-ID', requestId);

    // Extract user ID from JWT (if authenticated)
    let userId: string | null = null;
    try {
      if (req.user?.id) {
        userId = req.user.id;
      }
    } catch {
      // Ignore JWT parsing errors; userId stays null
    }

    // Log request details (structured JSON format)
    const { method, originalUrl, ip } = req;
    const userAgent = req.get('user-agent') || 'unknown';
    const startTime = Date.now();

    console.log(JSON.stringify({
      level: 'info',
      type: 'request',
      requestId,
      userId,
      method,
      route: originalUrl,
      ip,
      userAgent,
      timestamp: new Date().toISOString(),
    }));

    // Log response details (structured JSON format)
    res.on('finish', () => {
      const { statusCode } = res;
      const duration = Date.now() - startTime;
      console.log(JSON.stringify({
        level: 'info',
        type: 'response',
        requestId,
        userId,
        method,
        route: originalUrl,
        statusCode,
        duration,
        timestamp: new Date().toISOString(),
      }));
    });

    next();
  }
}
