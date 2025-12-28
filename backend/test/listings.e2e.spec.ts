import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { AllExceptionsFilter } from '../src/common/filters/all-exceptions.filter';

describe('Listings detail endpoints (e2e)', () => {
  let app: INestApplication;
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

    server = app.getHttpServer();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /v1/stays returns paginated envelope', async () => {
    const res = await request(server).get('/v1/stays').expect(200);
    expect(res.body).toMatchObject({
      items: expect.any(Array),
      total: expect.any(Number),
      page: expect.any(Number),
      pageSize: expect.any(Number),
    });
    expect(res.body.items.length).toBeGreaterThan(0);
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

  it('GET /v1/stays/:id returns seeded stay detail', async () => {
    const listRes = await request(server).get('/v1/stays?status=PUBLISHED').expect(200);
    const first = listRes.body.items[0];

    const res = await request(server).get(`/v1/stays/${first.id}`).expect(200);

    expect(res.body).toMatchObject({
      id: first.id,
      name: first.name,
      status: expect.any(String),
      city: expect.any(String),
      amenities: expect.any(Array),
    });
  });

  it('GET /v1/hotel-packages/:id returns seeded hotel package detail', async () => {
    const listRes = await request(server).get('/v1/hotel-packages?status=PUBLISHED').expect(200);
    const first = listRes.body.items[0];

    const res = await request(server).get(`/v1/hotel-packages/${first.id}`).expect(200);

    expect(res.body).toMatchObject({
      id: first.id,
      name: first.name,
      status: expect.any(String),
      templateId: expect.any(String),
      amenities: expect.any(Array),
    });
  });

  it('GET /v1/tour-packages/:id returns seeded tour package detail', async () => {
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

  it('GET /v1/stays/:id returns 404 for missing stay', async () => {
    const res = await request(server).get('/v1/stays/non-existent-id').expect(404);
    expect(res.body.message.toLowerCase()).toContain('not found');
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
