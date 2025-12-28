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

function uniqueStamp(): string {
  return `${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
}

describe('Hotel Packages Publish Flow (E2E)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let server: any;

  const createdUserIds: string[] = [];
  const createdProviderIds: string[] = [];
  const createdListingIds: string[] = [];
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
      await prisma.hotelPackage.deleteMany({ where: { id: { in: createdPackageIds } } });
    }
    if (createdListingIds.length > 0) {
      await prisma.listing.deleteMany({ where: { id: { in: createdListingIds } } });
    }
    if (createdProviderIds.length > 0) {
      await prisma.providerProfile.deleteMany({ where: { id: { in: createdProviderIds } } });
    }
    if (createdUserIds.length > 0) {
      await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } });
    }

    await app.close();
  });

  it('GET /v1/hotel-packages/templates returns supported templates', async () => {
    const res = await request(server).get('/v1/hotel-packages/templates').expect(200);
    expect(Array.isArray(res.body?.items)).toBe(true);
    expect(res.body.items.length).toBe(14);
    expect(res.body.items.some((t: any) => t.id === 'weekend-getaway')).toBe(true);
  });

  it('approved provider can create DRAFT and publish it', async () => {
    const seededUser = await prisma.user.findUnique({ where: { email: 'hotel@example.com' } });
    expect(seededUser).toBeTruthy();

    const provider = await prisma.providerProfile.findFirst({
      where: { userId: seededUser!.id, providerType: 'HOTEL_MANAGER' },
    });
    expect(provider).toBeTruthy();

    const listing = await prisma.listing.findFirst({ where: { providerId: provider!.id } });
    expect(listing).toBeTruthy();

    const auth = `Bearer ${makeBearerToken(seededUser!.id)}`;

    const createRes = await request(server)
      .post(`/v1/hotel-packages/${provider!.id}/packages`)
      .set('Authorization', auth)
      .send({
        templateId: 'weekend-getaway',
        listingId: listing!.id,
        name: 'E2E Weekend Package',
        description: 'A simple package for E2E.',
        pricePerPerson: 123.45,
        inclusions: ['Breakfast'],
        exclusions: ['Flights'],
        availabilityRule: 'WEEKEND_ONLY',
      })
      .expect(201);

    expect(createRes.body?.status).toBe('DRAFT');
    expect(createRes.body?.id).toBeTruthy();
    createdPackageIds.push(createRes.body.id);

    const publishRes = await request(server)
      .post(`/v1/hotel-packages/${provider!.id}/packages/${createRes.body.id}/publish`)
      .set('Authorization', auth)
      .expect(200);

    expect(publishRes.body?.status).toBe('PUBLISHED');
    expect(publishRes.body?.publishedAt).toBeTruthy();
  });

  it('unapproved provider can create DRAFT but cannot publish', async () => {
    const stamp = uniqueStamp();
    const user = await prisma.user.create({
      data: {
        email: `unverified-provider-${stamp}@test.com`,
        phone: `+1-800-${stamp}`,
        firstName: 'Unverified',
        lastName: 'Provider',
        password: 'hashedpassword',
        role: 'TRAVELER',
      },
    });
    createdUserIds.push(user.id);

    const provider = await prisma.providerProfile.create({
      data: {
        userId: user.id,
        providerType: 'HOTEL_MANAGER',
        businessName: 'Unverified Hotel Co',
        businessDescription: 'Not approved yet',
        verificationStatus: 'UNDER_REVIEW',
      },
    });
    createdProviderIds.push(provider.id);

    const listing = await prisma.listing.create({
      data: {
        providerId: provider.id,
        name: 'Unverified Listing',
        address: '123 Test Street',
        city: 'Test City',
        latitude: 1.23,
        longitude: 4.56,
        description: 'A listing for E2E publish gate.',
        status: 'DRAFT',
        checkInTime: '15:00',
        checkOutTime: '11:00',
      },
    });
    createdListingIds.push(listing.id);

    const auth = `Bearer ${makeBearerToken(user.id)}`;

    const createRes = await request(server)
      .post(`/v1/hotel-packages/${provider.id}/packages`)
      .set('Authorization', auth)
      .send({
        templateId: 'weekend-getaway',
        listingId: listing.id,
        name: 'E2E Draft Package (Unverified)',
        description: 'Draft should be allowed.',
        pricePerPerson: 50,
        availabilityRule: 'FLEXIBLE',
      })
      .expect(201);

    expect(createRes.body?.status).toBe('DRAFT');
    createdPackageIds.push(createRes.body.id);

    await request(server)
      .post(`/v1/hotel-packages/${provider.id}/packages/${createRes.body.id}/publish`)
      .set('Authorization', auth)
      .expect(403);
  });
});
