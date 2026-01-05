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

    const errorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message,
      requestId: request.headers['x-request-id'] || 'unknown',
    };

    // Log ALL exceptions to debug auth issues
    console.log('[AllExceptionsFilter] Exception caught:', {
      status,
      message,
      path: request.url,
      exception: exception instanceof Error ? exception.message : exception,
    });

    // Log error details (in production, use proper logger like Winston)
    if (status === HttpStatus.INTERNAL_SERVER_ERROR) {
      console.error('Unhandled exception:', exception);
    }

    response.status(status).json(errorResponse);
  }
}
