import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Security headers
  app.use(helmet());

  // CORS configuration
  const corsOrigins = process.env.CORS_ORIGINS?.split(',').map((o) => o.trim()) || [
    'http://localhost:3000',
    'http://localhost:3100',
    'https://tripavailweb-web.vercel.app',
    'https://tripavailweb-web-2ojm.vercel.app',
  ];

  // Stricter regex patterns for dynamic origin matching
  const isLocalhost = /^http:\/\/localhost(:\d+)?$/i;
  const isVercelPreview = /^https:\/\/[a-z0-9-]+\.vercel\.app$/i;

  const corsOriginFunction = (
    origin: string | undefined,
    callback: (err: Error | null, allow?: boolean) => void,
  ) => {
    // Debug log (can be removed after testing in production)
    if (process.env.DEBUG_CORS) {
      console.log('[CORS Debug]', { origin, allowed: false });
    }

    // Explicitly deny if no origin (non-browser requests; uncomment if strict mode needed)
    // if (!origin) return callback(new Error('Origin required'));

    // Allow no origin for health checks, internal requests
    if (!origin) {
      return callback(null, true);
    }

    // Check against explicit whitelist first (production domains)
    if (corsOrigins.includes(origin)) {
      return callback(null, true);
    }

    // Allow localhost for development
    if (isLocalhost.test(origin)) {
      return callback(null, true);
    }

    // Allow Vercel preview deployments with stricter regex
    if (isVercelPreview.test(origin)) {
      return callback(null, true);
    }

    // Deny all other origins
    callback(new Error('CORS: Origin not allowed'));
  };

  app.enableCors({
    origin: corsOriginFunction,
    credentials: true, // Required for Bearer tokens + any cookies
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID', 'Idempotency-Key'],
    exposedHeaders: ['X-Request-ID'],
    maxAge: 3600,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Global exception filter
  app.useGlobalFilters(new AllExceptionsFilter());

  // Global prefix for API versioning
  app.setGlobalPrefix('v1');

  // Swagger/OpenAPI documentation
  const config = new DocumentBuilder()
    .setTitle('TripAvail API')
    .setDescription('Two-sided travel marketplace API - Stays, Hotel Packages, Tour Packages')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('health', 'Health check endpoints')
    .addTag('auth', 'Authentication & Authorization')
    .addTag('users', 'User management')
    .addTag('providers', 'Provider profiles & verification')
    .addTag('listings', 'Stays, Hotel & Tour packages')
    .addTag('bookings', 'Booking state machine')
    .addTag('payments', 'Payment processing')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document, {
    customSiteTitle: 'TripAvail API Docs',
    customCss: '.swagger-ui .topbar { display: none }',
  });

  const port = process.env.PORT || 8001;
  const host = process.env.HOST || '0.0.0.0';

  try {
    await app.listen(port, host);
    console.log(`✅ Application is running on: http://${host}:${port}`);
    console.log(`✅ API Documentation available at: http://${host}:${port}/api`);
    console.log(`✅ Health check: http://${host}:${port}/v1/health`);
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    throw error;
  }
}
bootstrap().catch((error) => {
  console.error('❌ Bootstrap failed:', error);
  process.exit(1);
});
