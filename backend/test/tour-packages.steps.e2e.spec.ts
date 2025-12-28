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

describe('Tour Packages Steps 1-7 (E2E)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let server: any;

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
    await app.close();
  });

  it('builds a DRAFT tour package through steps 1-7', async () => {
    const seededUser = await prisma.user.findUnique({ where: { email: 'tours@example.com' } });
    expect(seededUser).toBeTruthy();

    const provider = await prisma.providerProfile.findFirst({
      where: { userId: seededUser!.id, providerType: 'TOUR_OPERATOR' },
    });
    expect(provider).toBeTruthy();

    const auth = `Bearer ${makeBearerToken(seededUser!.id)}`;

    const step1 = await request(server)
      .post(`/v1/tour-packages/${provider!.id}/packages/step1`)
      .set('Authorization', auth)
      .send({ tripType: 'Adventure' })
      .expect(201);

    expect(step1.body?.id).toBeTruthy();
    expect(step1.body?.status).toBe('DRAFT');
    expect(step1.body?.tripType).toBe('Adventure');
    createdPackageIds.push(step1.body.id);

    const pkgId = step1.body.id;

    const step2 = await request(server)
      .patch(`/v1/tour-packages/${provider!.id}/packages/${pkgId}/step2-basics`)
      .set('Authorization', auth)
      .send({
        name: 'E2E Builder Package',
        description: 'Built via steps 1-7 in E2E.',
        duration: 3,
        basePrice: 499.5,
        maxSeats: 20,
      })
      .expect(200);

    expect(step2.body?.name).toBe('E2E Builder Package');
    expect(step2.body?.duration).toBe(3);

    const step3 = await request(server)
      .put(`/v1/tour-packages/${provider!.id}/packages/${pkgId}/step3-departures`)
      .set('Authorization', auth)
      .send({ departureDates: ['2026-02-15', '2026-03-15'], availableSeats: 20 })
      .expect(200);

    expect(Array.isArray(step3.body?.departures)).toBe(true);
    expect(step3.body.departures.length).toBe(2);

    const step4 = await request(server)
      .put(`/v1/tour-packages/${provider!.id}/packages/${pkgId}/step4-pickups`)
      .set('Authorization', auth)
      .send({
        pickups: [
          {
            city: 'Denver',
            location: 'Denver International Airport',
            latitude: 39.8561,
            longitude: -104.6737,
          },
          {
            city: 'Boulder',
            location: 'Boulder Bus Station',
            latitude: 40.0176,
            longitude: -105.2797,
          },
        ],
      })
      .expect(200);

    expect(Array.isArray(step4.body?.pickups)).toBe(true);
    expect(step4.body.pickups.length).toBe(2);

    const step5 = await request(server)
      .patch(`/v1/tour-packages/${provider!.id}/packages/${pkgId}/step5-highlights`)
      .set('Authorization', auth)
      .send({ highlights: ['Summit hike', 'Alpine lake'] })
      .expect(200);

    expect(step5.body?.highlights).toEqual(['Summit hike', 'Alpine lake']);

    const step6 = await request(server)
      .put(`/v1/tour-packages/${provider!.id}/packages/${pkgId}/step6-itinerary`)
      .set('Authorization', auth)
      .send({
        days: [
          { day: 1, title: 'Arrival', description: 'Meet and greet.' },
          { day: 2, title: 'Hike', description: 'Guided hike.' },
          { day: 3, title: 'Departure', description: 'Return home.' },
        ],
      })
      .expect(200);

    expect(Array.isArray(step6.body?.itinerary)).toBe(true);
    expect(step6.body.itinerary.length).toBe(3);
    expect(step6.body.itinerary[0].day).toBe(1);

    const step7 = await request(server)
      .patch(`/v1/tour-packages/${provider!.id}/packages/${pkgId}/step7-inclusions-exclusions`)
      .set('Authorization', auth)
      .send({ inclusions: ['Guide'], exclusions: ['Flights'] })
      .expect(200);

    expect(step7.body?.inclusions).toEqual(['Guide']);
    expect(step7.body?.exclusions).toEqual(['Flights']);

    const getRes = await request(server).get(`/v1/tour-packages/${pkgId}`).expect(200);
    expect(getRes.body?.id).toBe(pkgId);
    expect(getRes.body?.tripType).toBe('Adventure');
    expect(getRes.body?.highlights).toEqual(['Summit hike', 'Alpine lake']);
    expect(getRes.body?.inclusions).toEqual(['Guide']);
    expect(getRes.body?.exclusions).toEqual(['Flights']);
    expect(getRes.body?.itinerary?.length).toBe(3);
    expect(getRes.body?.pickups?.length).toBe(2);
    expect(getRes.body?.departures?.length).toBe(2);
  });
});
