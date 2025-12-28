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

describe('Tour Packages lifecycle (E2E)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let server: any;

  const createdUserIds: string[] = [];
  const createdProviderIds: string[] = [];
  const createdPackageIds: string[] = [];

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
    if (createdPackageIds.length > 0) {
      await prisma.tourDeparture.deleteMany({ where: { packageId: { in: createdPackageIds } } });
      await prisma.pickup.deleteMany({ where: { packageId: { in: createdPackageIds } } });
      await prisma.itineraryDay.deleteMany({ where: { packageId: { in: createdPackageIds } } });
      await prisma.tourPackage.deleteMany({ where: { id: { in: createdPackageIds } } });
    }

    if (createdProviderIds.length > 0) {
      await prisma.providerProfile.deleteMany({ where: { id: { in: createdProviderIds } } });
    }

    if (createdUserIds.length > 0) {
      await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } });
    }

    await app.close();
  });

  it('allows verified provider to publish, pause, and archive a tour package', async () => {
    const seededUser = await prisma.user.findUnique({ where: { email: 'tours@example.com' } });
    expect(seededUser).toBeTruthy();

    const provider = await prisma.providerProfile.findFirst({
      where: { userId: seededUser!.id, providerType: 'TOUR_OPERATOR' },
    });
    expect(provider).toBeTruthy();

    const auth = `Bearer ${makeBearerToken(seededUser!.id)}`;

    const createRes = await request(server)
      .post(`/v1/tour-packages/${provider!.id}/packages`)
      .set('Authorization', auth)
      .send({
        tripType: 'Adventure',
        name: 'Lifecycle E2E Package',
        description: 'Created for lifecycle E2E test.',
        duration: 2,
        basePrice: 199.5,
        maxSeats: 10,
      })
      .expect(201);

    expect(createRes.body?.id).toBeTruthy();
    expect(createRes.body?.status).toBe('DRAFT');
    createdPackageIds.push(createRes.body.id);

    const pkgId = createRes.body.id;

    const publishRes = await request(server)
      .post(`/v1/tour-packages/${provider!.id}/packages/${pkgId}/publish`)
      .set('Authorization', auth)
      .expect(200);

    expect(publishRes.body?.status).toBe('PUBLISHED');
    expect(publishRes.body?.publishedAt).toBeTruthy();

    const pauseRes = await request(server)
      .post(`/v1/tour-packages/${provider!.id}/packages/${pkgId}/pause`)
      .set('Authorization', auth)
      .expect(200);

    expect(pauseRes.body?.status).toBe('PAUSED');

    const archiveRes = await request(server)
      .post(`/v1/tour-packages/${provider!.id}/packages/${pkgId}/archive`)
      .set('Authorization', auth)
      .expect(200);

    expect(archiveRes.body?.status).toBe('ARCHIVED');
  });

  it('blocks publish when provider is not verified/approved', async () => {
    const unverifiedUser = await prisma.user.create({
      data: {
        email: `unverified-tour-${Date.now()}@example.com`,
        phone: `+1999${Math.floor(Math.random() * 1_000_000_000)
          .toString()
          .padStart(9, '0')}`,
        password: '$2b$10$mockHashedPassword',
        role: 'TRAVELER',
        emailVerified: true,
        phoneVerified: true,
      },
    });
    createdUserIds.push(unverifiedUser.id);

    const unverifiedProvider = await prisma.providerProfile.create({
      data: {
        userId: unverifiedUser.id,
        providerType: 'TOUR_OPERATOR',
        businessName: 'Unverified Tours',
        businessDescription: 'Not approved yet',
        verificationStatus: 'SUBMITTED',
      },
    });
    createdProviderIds.push(unverifiedProvider.id);

    const auth = `Bearer ${makeBearerToken(unverifiedUser.id)}`;

    const createRes = await request(server)
      .post(`/v1/tour-packages/${unverifiedProvider.id}/packages`)
      .set('Authorization', auth)
      .send({
        tripType: 'Adventure',
        name: 'Unverified Lifecycle Package',
        description: 'Created for unverified publish test.',
        duration: 1,
        basePrice: 99.5,
        maxSeats: 5,
      })
      .expect(201);

    createdPackageIds.push(createRes.body.id);

    await request(server)
      .post(`/v1/tour-packages/${unverifiedProvider.id}/packages/${createRes.body.id}/publish`)
      .set('Authorization', auth)
      .expect(403);
  });
});
