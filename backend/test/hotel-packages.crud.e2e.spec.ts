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

describe('Hotel Packages CRUD (E2E)', () => {
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
      await prisma.hotelPackage.deleteMany({ where: { id: { in: createdPackageIds } } });
    }
    await app.close();
  });

  it('DRAFT package can be updated and deleted; PUBLISHED cannot', async () => {
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
        name: 'E2E CRUD Package',
        description: 'Created for update/delete test.',
        pricePerPerson: 77.77,
        availabilityRule: 'FLEXIBLE',
      })
      .expect(201);

    const packageId = createRes.body?.id;
    expect(packageId).toBeTruthy();
    createdPackageIds.push(packageId);

    const updateRes = await request(server)
      .patch(`/v1/hotel-packages/${provider!.id}/packages/${packageId}`)
      .set('Authorization', auth)
      .send({ name: 'E2E CRUD Package (Updated)', pricePerPerson: 88.88 })
      .expect(200);

    expect(updateRes.body?.name).toBe('E2E CRUD Package (Updated)');

    const delRes = await request(server)
      .delete(`/v1/hotel-packages/${provider!.id}/packages/${packageId}`)
      .set('Authorization', auth)
      .expect(200);

    expect(delRes.body?.deleted).toBe(true);

    // ensure removed
    await request(server).get(`/v1/hotel-packages/${packageId}`).expect(404);

    // create + publish, then verify update/delete blocked
    const create2 = await request(server)
      .post(`/v1/hotel-packages/${provider!.id}/packages`)
      .set('Authorization', auth)
      .send({
        templateId: 'weekend-getaway',
        listingId: listing!.id,
        name: 'E2E CRUD Package (Publish)',
        description: 'Created to verify status restrictions.',
        pricePerPerson: 55,
        availabilityRule: 'WEEKEND_ONLY',
      })
      .expect(201);

    const publishedId = create2.body?.id;
    expect(publishedId).toBeTruthy();
    createdPackageIds.push(publishedId);

    await request(server)
      .post(`/v1/hotel-packages/${provider!.id}/packages/${publishedId}/publish`)
      .set('Authorization', auth)
      .expect(200);

    await request(server)
      .patch(`/v1/hotel-packages/${provider!.id}/packages/${publishedId}`)
      .set('Authorization', auth)
      .send({ name: 'should fail' })
      .expect(400);

    await request(server)
      .delete(`/v1/hotel-packages/${provider!.id}/packages/${publishedId}`)
      .set('Authorization', auth)
      .expect(400);
  });
});
