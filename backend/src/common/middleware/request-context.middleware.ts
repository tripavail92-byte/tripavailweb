import { Injectable, NestMiddleware } from '@nestjs/common';
import { randomUUID } from 'crypto';

@Injectable()
export class RequestContextMiddleware implements NestMiddleware {
  use(req: any, res: any, next: () => void) {
    // Generate or use existing request ID
    const requestId = (req.headers['x-request-id'] as string) || randomUUID();
    req.headers['x-request-id'] = requestId;
    res.setHeader('X-Request-ID', requestId);

    // Log request details
    const { method, originalUrl, ip } = req;
    const userAgent = req.get('user-agent') || 'unknown';
    const startTime = Date.now();

    console.log(`[${requestId}] ${method} ${originalUrl} - ${ip} - ${userAgent}`);

    // Log response details
    res.on('finish', () => {
      const { statusCode } = res;
      const duration = Date.now() - startTime;
      console.log(`[${requestId}] ${method} ${originalUrl} ${statusCode} - ${duration}ms`);
    });

    next();
  }
}
