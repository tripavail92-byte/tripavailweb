import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma.service';

describe('Bookings - Quote Creation (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authToken: string;
  let travelerUser: any;
  let hotelPackage: any;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('v1');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    );

    await app.init();

    prisma = app.get<PrismaService>(PrismaService);

    // Get seeded traveler user
    travelerUser = await prisma.user.findFirst({
      where: { role: 'TRAVELER' },
    });

    // Get published hotel package
    hotelPackage = await prisma.hotelPackage.findFirst({
      where: { status: 'PUBLISHED' },
    });

    // Authenticate
    const authStartRes = await request(app.getHttpServer())
      .post('/v1/auth/start')
      .send({
        channel: 'phone',
        phone: travelerUser.phone,
        purpose: 'login',
      });

    const otp = authStartRes.body.code;

    const authVerifyRes = await request(app.getHttpServer())
      .post('/v1/auth/verify')
      .send({
        channel: 'phone',
        phone: travelerUser.phone,
        code: otp,
      });

    authToken = authVerifyRes.body.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /v1/bookings/quote', () => {
    it('should require authentication', () => {
      return request(app.getHttpServer())
        .post('/v1/bookings/quote')
        .send({
          packageType: 'HOTEL_PACKAGE',
          packageId: hotelPackage.id,
          checkInDate: '2026-02-15',
          checkOutDate: '2026-02-18',
          numberOfGuests: 2,
        })
        .expect(401);
    });

    it('should create a hotel package quote with server-calculated pricing', async () => {
      const response = await request(app.getHttpServer())
        .post('/v1/bookings/quote')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          packageType: 'HOTEL_PACKAGE',
          packageId: hotelPackage.id,
          checkInDate: '2026-02-15',
          checkOutDate: '2026-02-18',
          numberOfGuests: 2,
          numberOfRooms: 1,
        })
        .expect(201);

      expect(response.body).toMatchObject({
        id: expect.any(String),
        status: 'QUOTE',
        packageType: 'HOTEL_PACKAGE',
        packageId: hotelPackage.id,
        numberOfGuests: 2,
        priceSnapshot: {
          basePrice: expect.any(Number),
          tax: expect.any(Number),
          commission: expect.any(Number),
          total: expect.any(Number),
          breakdown: expect.objectContaining({
            nights: 3,
            pricePerNight: Number(hotelPackage.pricePerPerson),
            subtotal: expect.any(Number),
            taxRate: 0.10,
            taxAmount: expect.any(Number),
            commissionRate: 0.10,
            commissionAmount: expect.any(Number),
            grandTotal: expect.any(Number),
          }),
        },
        totalPrice: expect.any(Number),
        currency: 'USD',
        quotedAt: expect.any(String),
        expiresAt: expect.any(String),
      });

      // Verify price snapshot is persisted in DB
      const booking = await prisma.booking.findUnique({
        where: { id: response.body.id },
      });
      expect(booking).toBeDefined();
      expect(booking?.status).toBe('QUOTE');
      expect(booking?.priceSnapshot).toBeDefined();
    });

    it('should support idempotency keys', async () => {
      const idempotencyKey = 'test-idempotency-key-' + Date.now();

      // First request
      const response1 = await request(app.getHttpServer())
        .post('/v1/bookings/quote')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          packageType: 'HOTEL_PACKAGE',
          packageId: hotelPackage.id,
          checkInDate: '2026-03-15',
          checkOutDate: '2026-03-18',
          numberOfGuests: 2,
          idempotencyKey,
        })
        .expect(201);

      // Second request with same key - should return same quote
      const response2 = await request(app.getHttpServer())
        .post('/v1/bookings/quote')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          packageType: 'HOTEL_PACKAGE',
          packageId: hotelPackage.id,
          checkInDate: '2026-03-15',
          checkOutDate: '2026-03-18',
          numberOfGuests: 2,
          idempotencyKey,
        })
        .expect(201);

      expect(response1.body.id).toBe(response2.body.id);
    });

    it('should validate required fields', async () => {
      await request(app.getHttpServer())
        .post('/v1/bookings/quote')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          packageType: 'HOTEL_PACKAGE',
          // Missing packageId, checkInDate, checkOutDate, numberOfGuests
        })
        .expect(400);
    });

    it('should reject invalid package type', async () => {
      await request(app.getHttpServer())
        .post('/v1/bookings/quote')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          packageType: 'INVALID_TYPE',
          packageId: hotelPackage.id,
          checkInDate: '2026-02-15',
          checkOutDate: '2026-02-18',
          numberOfGuests: 2,
        })
        .expect(400);
    });

    it('should reject non-existent package', async () => {
      await request(app.getHttpServer())
        .post('/v1/bookings/quote')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          packageType: 'HOTEL_PACKAGE',
          packageId: 'non-existent-package-id',
          checkInDate: '2026-02-15',
          checkOutDate: '2026-02-18',
          numberOfGuests: 2,
        })
        .expect(400);
    });
  });
});
