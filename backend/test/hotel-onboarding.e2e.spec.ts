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
  // JwtAuthGuard checks: token has 3 parts, payload.sub exists, and user exists.
  const header = base64Json({ alg: 'none', typ: 'JWT' });
  const payload = base64Json({ sub: userId });
  const signature = 'sig';
  return `${header}.${payload}.${signature}`;
}

function uniqueStamp(): string {
  return `${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
}

describe('Hotel Onboarding 7-Step Flow (E2E)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let server: any;

  const createdUserIds: string[] = [];
  const createdProviderIds: string[] = [];
  const createdListingIds: string[] = [];
  const createdAmenityIds: string[] = [];

  async function createUser(role: 'TRAVELER' | 'ADMIN' = 'TRAVELER') {
    const stamp = uniqueStamp();
    const user = await prisma.user.create({
      data: {
        email: `hotel-e2e-${stamp}@test.com`,
        phone: `+1-700-${stamp}`,
        firstName: 'E2E',
        lastName: 'User',
        password: 'hashedpassword',
        role,
      },
    });
    createdUserIds.push(user.id);
    return user;
  }

  async function startHotelOnboarding(userId: string) {
    const res = await request(server)
      .post('/v1/provider-onboarding/start')
      .set('Authorization', `Bearer ${makeBearerToken(userId)}`)
      .send({ providerType: 'HOTEL_MANAGER' })
      .expect(201);

    const providerId = res.body?.profile?.id;
    expect(providerId).toBeTruthy();
    createdProviderIds.push(providerId);
    return { providerId };
  }

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
    // Only delete records created by THIS suite (do not wipe seeded data).
    if (createdListingIds.length > 0) {
      await prisma.listing.deleteMany({ where: { id: { in: createdListingIds } } });
    }
    if (createdAmenityIds.length > 0) {
      await prisma.amenity.deleteMany({ where: { id: { in: createdAmenityIds } } });
    }
    if (createdProviderIds.length > 0) {
      await prisma.providerProfile.deleteMany({ where: { id: { in: createdProviderIds } } });
    }
    if (createdUserIds.length > 0) {
      await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } });
    }

    await app.close();
  });

  it('happy path: completes steps 2-7 and creates a Listing + Rooms + ListingAmenities', async () => {
    const user = await createUser('TRAVELER');
    const auth = `Bearer ${makeBearerToken(user.id)}`;
    const { providerId } = await startHotelOnboarding(user.id);

    await request(server)
      .post(`/v1/provider-onboarding/${providerId}/hotel/step-2-basics`)
      .set('Authorization', auth)
      .send({
        hotelName: 'Sunset Beach Resort',
        propertyType: 'RESORT',
        starRating: 5,
        description: 'Luxury beachfront resort with world-class amenities',
        contactEmail: 'contact@sunset.com',
        contactPhone: '+1-555-9999',
      })
      .expect(201);

    await request(server)
      .post(`/v1/provider-onboarding/${providerId}/hotel/step-3-location`)
      .set('Authorization', auth)
      .send({
        streetAddress: '123 Beach Lane',
        city: 'Maui',
        stateProvince: 'Hawaii',
        country: 'USA',
        postalCode: '96761',
        latitude: 20.7967,
        longitude: -156.4729,
      })
      .expect(201);

    await request(server)
      .post(`/v1/provider-onboarding/${providerId}/hotel/step-4-rooms`)
      .set('Authorization', auth)
      .send({
        rooms: [
          {
            name: 'Standard Room',
            capacity: 2,
            bedConfig: '1 Queen Bed',
            basePrice: '150.00',
            totalUnits: 20,
          },
          {
            name: 'Deluxe Suite',
            capacity: 4,
            bedConfig: '2 Queen Beds',
            basePrice: '250.00',
            totalUnits: 10,
          },
        ],
      })
      .expect(201);

    const stamp = uniqueStamp();
    const amenity1 = await prisma.amenity.create({
      data: { name: `E2E WiFi ${stamp}`, category: 'connectivity' },
    });
    const amenity2 = await prisma.amenity.create({
      data: { name: `E2E Pool ${stamp}`, category: 'recreation' },
    });
    createdAmenityIds.push(amenity1.id, amenity2.id);

    await request(server)
      .post(`/v1/provider-onboarding/${providerId}/hotel/step-5-amenities`)
      .set('Authorization', auth)
      .send({ amenities: [amenity1.id, amenity2.id] })
      .expect(201);

    await request(server)
      .post(`/v1/provider-onboarding/${providerId}/hotel/step-6-policies`)
      .set('Authorization', auth)
      .send({
        cancellationPolicy: 'FLEXIBLE',
        paymentTerms: 'FULL_AT_BOOKING',
        checkInTime: '15:00',
        checkOutTime: '11:00',
        houseRules: 'No smoking, quiet hours after 10 PM',
        ageRestrictions: 'Minimum age 18',
      })
      .expect(201);

    const step7Res = await request(server)
      .post(`/v1/provider-onboarding/${providerId}/hotel/step-7-review`)
      .set('Authorization', auth)
      .send({ acceptTerms: true, marketingOptIn: true })
      .expect(201);

    expect(step7Res.body).toHaveProperty('listingId');
    expect(step7Res.body).toHaveProperty('roomsCreated', 2);

    const listingId = step7Res.body.listingId as string;
    createdListingIds.push(listingId);

    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      include: { rooms: true, amenities: true },
    });

    expect(listing).toBeTruthy();
    expect(listing!.name).toBe('Sunset Beach Resort');
    expect(listing!.city).toBe('Maui');
    expect(listing!.status).toBe('DRAFT');
    expect(listing!.rooms.length).toBe(2);
    expect(listing!.amenities.length).toBe(2);
  });

  it('step 2 rejects invalid email', async () => {
    const user = await createUser('TRAVELER');
    const auth = `Bearer ${makeBearerToken(user.id)}`;
    const { providerId } = await startHotelOnboarding(user.id);

    await request(server)
      .post(`/v1/provider-onboarding/${providerId}/hotel/step-2-basics`)
      .set('Authorization', auth)
      .send({
        hotelName: 'Invalid Email Hotel',
        propertyType: 'HOTEL',
        starRating: 4,
        description: 'Test',
        contactEmail: 'not-an-email',
        contactPhone: '+1-555-0000',
      })
      .expect(400);
  });

  it('step sequence: cannot do step 3 before step 2', async () => {
    const user = await createUser('TRAVELER');
    const auth = `Bearer ${makeBearerToken(user.id)}`;
    const { providerId } = await startHotelOnboarding(user.id);

    await request(server)
      .post(`/v1/provider-onboarding/${providerId}/hotel/step-3-location`)
      .set('Authorization', auth)
      .send({
        streetAddress: '123 Beach Lane',
        city: 'Maui',
        stateProvince: 'Hawaii',
        country: 'USA',
        postalCode: '96761',
        latitude: 20.7967,
        longitude: -156.4729,
      })
      .expect(400);
  });

  it('status endpoint returns totalSteps=7 and progress >= 0', async () => {
    const user = await createUser('TRAVELER');
    const auth = `Bearer ${makeBearerToken(user.id)}`;
    const { providerId } = await startHotelOnboarding(user.id);

    const res = await request(server)
      .get(`/v1/provider-onboarding/${providerId}/status`)
      .set('Authorization', auth)
      .expect(200);

    expect(res.body).toHaveProperty('totalSteps', 7);
    expect(res.body).toHaveProperty('progress');
    expect(typeof res.body.progress).toBe('number');
  });

  it('list endpoint returns the current user onboardings', async () => {
    const user = await createUser('TRAVELER');
    const auth = `Bearer ${makeBearerToken(user.id)}`;
    await startHotelOnboarding(user.id);

    const res = await request(server)
      .get('/v1/provider-onboarding/list')
      .set('Authorization', auth)
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });
});
