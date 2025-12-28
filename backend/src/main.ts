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
  app.enableCors({
    origin: ['http://localhost:4000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID', 'Idempotency-Key'],
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

  await app.listen(4100, '0.0.0.0');
  console.log(`Application is running on: http://localhost:4100`);
  console.log(`API Documentation available at: http://localhost:4100/api`);
}
bootstrap();
