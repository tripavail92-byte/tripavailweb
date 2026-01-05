import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { AllExceptionsFilter } from '../src/common/filters/all-exceptions.filter';
import { PrismaService } from '../src/prisma.service';

describe('Listings detail endpoints (e2e)', () => {
  let app: INestApplication;
  let server: any;
  let prisma: PrismaService;
  const createdHotelPackageIds: string[] = [];
  const createdTourPackageIds: string[] = [];
  const createdUserIds: string[] = [];
  const createdProviderIds: string[] = [];
  const createdListingIds: string[] = [];

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

    server = app.getHttpServer();
    prisma = moduleRef.get<PrismaService>(PrismaService);

    // Create test data if none exists
    const existingHotelPackages = await prisma.hotelPackage.findMany({ where: { status: 'PUBLISHED' }, take: 1 });
    if (existingHotelPackages.length === 0) {
      // Create user
      const user = await prisma.user.create({
        data: {
          email: `hotel-test-${Date.now()}@example.com`,
          phone: `+1${Math.floor(Math.random() * 10000000000).toString().padStart(10, '0')}`,
          password: '$2b$10$mockHashedPassword',
          role: 'TRAVELER',
          emailVerified: true,
          phoneVerified: true,
        },
      });
      createdUserIds.push(user.id);

      // Create provider
      const provider = await prisma.providerProfile.create({
        data: {
          userId: user.id,
          providerType: 'HOTEL_MANAGER',
          businessName: 'Test Hotel',
          verificationStatus: 'APPROVED',
        },
      });
      createdProviderIds.push(provider.id);

      // Create listing first
      const listing = await prisma.listing.create({
        data: {
          providerId: provider.id,
          name: 'Test Listing',
          address: '123 Test St',
          city: 'Test City',
          latitude: 40.7128,
          longitude: -74.006,
          description: 'Test listing for hotel package',
          status: 'PUBLISHED',
          checkInTime: '14:00',
          checkOutTime: '11:00',
        },
      });
      createdListingIds.push(listing.id);

      // Create hotel package
      const hotelPackage = await prisma.hotelPackage.create({
        data: {
          providerId: provider.id,
          listingId: listing.id,
          templateId: 'weekend-getaway',
          name: 'Test Hotel Package',
          description: 'A test hotel package',
          status: 'PUBLISHED',
          pricePerPerson: '200',
          availabilityRule: 'FLEXIBLE',
        },
      });
      createdHotelPackageIds.push(hotelPackage.id);
    }

    const existingTourPackages = await prisma.tourPackage.findMany({ where: { status: 'PUBLISHED' }, take: 1 });
    if (existingTourPackages.length === 0) {
      // Create user
      const user = await prisma.user.create({
        data: {
          email: `tour-test-${Date.now()}@example.com`,
          phone: `+1${Math.floor(Math.random() * 10000000000).toString().padStart(10, '0')}`,
          password: '$2b$10$mockHashedPassword',
          role: 'TRAVELER',
          emailVerified: true,
          phoneVerified: true,
        },
      });
      createdUserIds.push(user.id);

      // Create provider
      const provider = await prisma.providerProfile.create({
        data: {
          userId: user.id,
          providerType: 'TOUR_OPERATOR',
          businessName: 'Test Tours',
          verificationStatus: 'APPROVED',
        },
      });
      createdProviderIds.push(provider.id);

      // Create tour package
      const tourPackage = await prisma.tourPackage.create({
        data: {
          providerId: provider.id,
          tripType: 'Adventure',
          name: 'Test Tour Package',
          description: 'A test tour package',
          status: 'PUBLISHED',
          duration: 3,
          maxSeats: 10,
          basePrice: '500',
          highlights: ['Hiking'],
          inclusions: ['Guide'],
          exclusions: [],
          images: [],
          specialNotes: 'Test notes',
          safetyInformation: [],
          complianceTermsAccepted: true,
          complianceLiabilityAccepted: true,
          publishedAt: new Date(),
        },
      });
      createdTourPackageIds.push(tourPackage.id);
    }
  });

  afterAll(async () => {
    // Clean up created data
    if (createdTourPackageIds.length > 0) {
      await prisma.tourDeparture.deleteMany({ where: { packageId: { in: createdTourPackageIds } } });
      await prisma.pickup.deleteMany({ where: { packageId: { in: createdTourPackageIds } } });
      await prisma.itineraryDay.deleteMany({ where: { packageId: { in: createdTourPackageIds } } });
      await prisma.tourPackage.deleteMany({ where: { id: { in: createdTourPackageIds } } });
    }
    if (createdHotelPackageIds.length > 0) {
      await prisma.hotelPackage.deleteMany({ where: { id: { in: createdHotelPackageIds } } });
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

  it('GET /v1/hotel-packages returns paginated envelope', async () => {
    const res = await request(server).get('/v1/hotel-packages').expect(200);
    expect(res.body).toMatchObject({
      items: expect.any(Array),
      total: expect.any(Number),
      page: expect.any(Number),
      pageSize: expect.any(Number),
    });
    expect(res.body.items.length).toBeGreaterThan(0);
  });

  it('GET /v1/tour-packages returns paginated envelope', async () => {
    const res = await request(server).get('/v1/tour-packages').expect(200);
    expect(res.body).toMatchObject({
      items: expect.any(Array),
      total: expect.any(Number),
      page: expect.any(Number),
      pageSize: expect.any(Number),
    });
    expect(res.body.items.length).toBeGreaterThan(0);
  });

  it('GET /v1/hotel-packages/:id returns hotel package detail', async () => {
    const listRes = await request(server).get('/v1/hotel-packages?status=PUBLISHED').expect(200);
    const first = listRes.body.items[0];

    const res = await request(server).get(`/v1/hotel-packages/${first.id}`).expect(200);

    expect(res.body).toMatchObject({
      id: first.id,
      name: first.name,
      status: expect.any(String),
      templateId: expect.any(String),
    });
  });

  it('GET /v1/tour-packages/:id returns tour package detail', async () => {
    const listRes = await request(server).get('/v1/tour-packages?status=PUBLISHED').expect(200);
    const first = listRes.body.items[0];

    const res = await request(server).get(`/v1/tour-packages/${first.id}`).expect(200);

    expect(res.body).toMatchObject({
      id: first.id,
      name: first.name,
      status: expect.any(String),
      tripType: expect.any(String),
      basePrice: expect.anything(),
    });
  });

  it('GET /v1/hotel-packages/:id returns 404 for missing package', async () => {
    const res = await request(server).get('/v1/hotel-packages/non-existent-id').expect(404);
    expect(res.body.message.toLowerCase()).toContain('not found');
  });

  it('GET /v1/tour-packages/:id returns 404 for missing package', async () => {
    const res = await request(server).get('/v1/tour-packages/non-existent-id').expect(404);
    expect(res.body.message.toLowerCase()).toContain('not found');
  });
});
