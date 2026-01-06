import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    const status =
      exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException ? exception.message : 'Internal server error';

    const requestId = request.headers['x-request-id'] || 'unknown';

    // Extract user ID from JWT (if authenticated)
    let userId: string | null = null;
    try {
      if (request.user?.id) {
        userId = request.user.id;
      }
    } catch {
      // Ignore JWT parsing errors; userId stays null
    }

    const errorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message,
      requestId,
    };

    // Log error details in structured JSON format
    console.log(JSON.stringify({
      level: status >= 500 ? 'error' : 'warn',
      type: 'exception',
      requestId,
      userId,
      method: request.method,
      route: request.url,
      statusCode: status,
      message,
      exceptionType: exception instanceof Error ? exception.constructor.name : typeof exception,
      timestamp: new Date().toISOString(),
    }));

    // Log full exception details for 500+ errors (for debugging)
    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      console.error(JSON.stringify({
        level: 'error',
        type: 'exception_detail',
        requestId,
        userId,
        stack: exception instanceof Error ? exception.stack : 'no stack',
        timestamp: new Date().toISOString(),
      }));
    }

    response.status(status).json(errorResponse);
  }
}
