import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma.service';
import { AllExceptionsFilter } from '../src/common/filters/all-exceptions.filter';

function base64Json(value: unknown): string {
  return Buffer.from(JSON.stringify(value)).toString('base64');
}

function makeBearerToken(userId: string): string {
  const header = base64Json({ alg: 'none', typ: 'JWT' });
  const payload = base64Json({ sub: userId });
  const signature = 'sig';
  return `${header}.${payload}.${signature}`;
}

describe('Host Property Snapshot (E2E)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let server: any;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    );
    app.useGlobalFilters(new AllExceptionsFilter());
    app.setGlobalPrefix('v1');
    await app.init();

    prisma = moduleRef.get<PrismaService>(PrismaService);
    server = app.getHttpServer();
  });

  afterAll(async () => {
    await app.close();
  });

  it('owner can fetch snapshot; non-owner is forbidden', async () => {
    const hotelUser = await prisma.user.findUnique({ where: { email: 'hotel@example.com' } });
    expect(hotelUser).toBeTruthy();

    const travelerUser = await prisma.user.findUnique({ where: { email: 'traveler@example.com' } });
    expect(travelerUser).toBeTruthy();

    const provider = await prisma.providerProfile.findFirst({
      where: { userId: hotelUser!.id, providerType: 'HOTEL_MANAGER' },
    });
    expect(provider).toBeTruthy();

    const listing = await prisma.listing.findFirst({ where: { providerId: provider!.id } });
    expect(listing).toBeTruthy();

    const ownerAuth = `Bearer ${makeBearerToken(hotelUser!.id)}`;
    const nonOwnerAuth = `Bearer ${makeBearerToken(travelerUser!.id)}`;

    const ownerRes = await request(server)
      .get(`/v1/host/properties/${listing!.id}/snapshot`)
      .set('Authorization', ownerAuth)
      .expect(200);

    expect(ownerRes.body?.property?.id).toBe(listing!.id);
    expect(Array.isArray(ownerRes.body?.rooms)).toBe(true);
    expect(ownerRes.body.rooms.length).toBeGreaterThan(0);
    expect(Array.isArray(ownerRes.body?.amenities)).toBe(true);
    // policies/media are optional (may be null depending on seed/onboarding data)

    await request(server)
      .get(`/v1/host/properties/${listing!.id}/snapshot`)
      .set('Authorization', nonOwnerAuth)
      .expect(403);
  });
});
