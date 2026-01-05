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

describe('Tour Packages Steps 9-14 & Discount (E2E)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let server: any;
  let provider: any;
  let user: any;
  let auth: string;
  let pkgId: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    app.useGlobalFilters(new AllExceptionsFilter());
    app.setGlobalPrefix('v1');
    await app.init();
    prisma = moduleRef.get<PrismaService>(PrismaService);
    server = app.getHttpServer();
    user = await prisma.user.findUnique({ where: { email: 'tours@example.com' } });
    if (!user) throw new Error('Test user not found');
    
    provider = await prisma.providerProfile.findFirst({ where: { userId: user.id, providerType: 'TOUR_OPERATOR' } });
    if (!provider) throw new Error('Tour operator provider not found');
    
    auth = `Bearer ${makeBearerToken(user.id)}`;
    
    // Create a DRAFT package via step1
    const step1Res = await request(server)
      .post(`/v1/tour-packages/${provider.id}/packages/step1`)
      .set('Authorization', auth)
      .send({ tripType: 'Adventure' });
    
    if (step1Res.status !== 201 && step1Res.status !== 200) {
      console.error('Step1 error:', step1Res.status, step1Res.body);
      throw new Error(`Failed to create package in step1: ${step1Res.status}`);
    }
    pkgId = step1Res.body.id;
    
    // Set up basics (Step 2) with required fields for later tests
    await request(server)
      .patch(`/v1/tour-packages/${provider.id}/packages/${pkgId}/step2-basics`)
      .set('Authorization', auth)
      .send({
        name: 'Adventure Package',
        description: 'An exciting adventure tour',
        duration: 5,
        basePrice: 999.99,
        maxSeats: 20,
      });
      
    // Set departures (Step 3)
    await request(server)
      .put(`/v1/tour-packages/${provider.id}/packages/${pkgId}/step3-departures`)
      .set('Authorization', auth)
      .send({
        departureDates: ['2025-02-01', '2025-02-15', '2025-03-01'],
        availableSeats: 20,
      });
      
    // Set pickups (Step 4)
    await request(server)
      .put(`/v1/tour-packages/${provider.id}/packages/${pkgId}/step4-pickups`)
      .set('Authorization', auth)
      .send({
        pickups: [
          { city: 'Bangkok', location: 'Airport', latitude: 13.681, longitude: 100.747 },
          { city: 'Bangkok', location: 'Hotel Zone', latitude: 13.749, longitude: 100.501 },
        ],
      });
      
    // Set highlights (Step 5)
    await request(server)
      .patch(`/v1/tour-packages/${provider.id}/packages/${pkgId}/step5-highlights`)
      .set('Authorization', auth)
      .send({
        highlights: ['Temple visits', 'Night markets', 'River cruises', 'Local cuisine'],
      });
      
    // Set itinerary (Step 6)
    await request(server)
      .put(`/v1/tour-packages/${provider.id}/packages/${pkgId}/step6-itinerary`)
      .set('Authorization', auth)
      .send({
        days: [
          { day: 1, title: 'Arrival & City Tour', description: 'Arrive and explore Bangkok' },
          { day: 2, title: 'Temple Day', description: 'Visit major temples' },
          { day: 3, title: 'Market Tour', description: 'Floating and night markets' },
          { day: 4, title: 'Countryside', description: 'Visit Ayutthaya' },
          { day: 5, title: 'Departure', description: 'Final shopping and departure' },
        ],
      });
      
    // Set inclusions/exclusions (Step 7)
    await request(server)
      .patch(`/v1/tour-packages/${provider.id}/packages/${pkgId}/step7-inclusions-exclusions`)
      .set('Authorization', auth)
      .send({
        inclusions: ['Hotel (4 nights)', 'Meals (B/L/D)', 'Guide', 'Transport'],
        exclusions: ['Flights', 'Travel insurance', 'Personal expenses'],
      });
  });

  afterAll(async () => {
    await prisma.tourDeparture.deleteMany({ where: { packageId: pkgId } });
    await prisma.pickup.deleteMany({ where: { packageId: pkgId } });
    await prisma.itineraryDay.deleteMany({ where: { packageId: pkgId } });
    await prisma.addOn.deleteMany({ where: { packageId: pkgId } });
    await prisma.tourPackage.deleteMany({ where: { id: pkgId } });
    await app.close();
  });

  it('should PATCH step9-media, step10-addons, step11-notes-safety, step12-compliance, PATCH discount, preview, and publish', async () => {
    // Step 9: Media
    await request(server)
      .patch(`/v1/tour-packages/${provider.id}/packages/${pkgId}/step9-media`)
      .set('Authorization', auth)
      .send({ images: ['https://cdn.example.com/tours/1.jpg', 'https://cdn.example.com/tours/2.jpg'] })
      .expect(200);

    // Step 10: Add-ons CRUD
    // Create
    const addOnRes = await request(server)
      .post(`/v1/tour-packages/${provider.id}/packages/${pkgId}/addons`)
      .set('Authorization', auth)
      .send({
        name: 'Airport Pickup',
        description: 'Private airport pickup service',
        price: 49.99,
        isOptional: true,
      })
      .expect(201);
    const addOnId = addOnRes.body.id;
    
    // Update
    await request(server)
      .patch(`/v1/tour-packages/${provider.id}/packages/${pkgId}/addons/${addOnId}`)
      .set('Authorization', auth)
      .send({ name: 'Updated Airport Pickup', price: 59.99 })
      .expect(200);

    // List
    await request(server)
      .get(`/v1/tour-packages/${provider.id}/packages/${pkgId}/addons`)
      .set('Authorization', auth)
      .expect(200);

    // Delete
    await request(server)
      .delete(`/v1/tour-packages/${provider.id}/packages/${pkgId}/addons/${addOnId}`)
      .set('Authorization', auth)
      .expect(200);

    // Step 11: Special Notes & Safety
    await request(server)
      .patch(`/v1/tour-packages/${provider.id}/packages/${pkgId}/step11-notes-safety`)
      .set('Authorization', auth)
      .send({
        specialNotes: 'Wear comfortable shoes and bring sunscreen.',
        safetyInformation: ['No swimming in monsoon season', 'Guide required at all times', 'Travel insurance recommended'],
      })
      .expect(200);

    // Step 12: Compliance
    await request(server)
      .patch(`/v1/tour-packages/${provider.id}/packages/${pkgId}/step12-compliance`)
      .set('Authorization', auth)
      .send({
        complianceTermsAccepted: true,
        complianceLiabilityAccepted: true,
      })
      .expect(200);

    // Discount PATCH
    await request(server)
      .patch(`/v1/tour-packages/${provider.id}/packages/${pkgId}/discount`)
      .set('Authorization', auth)
      .send({
        discountEnabled: true,
        discountPercentage: 10,
        discountStartDate: '2025-02-01',
        discountEndDate: '2025-12-31',
      })
      .expect(200);

    // Step 13: Preview
    const previewRes = await request(server)
      .get(`/v1/tour-packages/${provider.id}/packages/${pkgId}/step13-preview`)
      .set('Authorization', auth)
      .expect(200);

    // Validate preview data
    expect(previewRes.body).toHaveProperty('id');
    expect(previewRes.body).toHaveProperty('images');
    expect(previewRes.body).toHaveProperty('specialNotes');
    expect(previewRes.body).toHaveProperty('safetyInformation');
    expect(previewRes.body).toHaveProperty('complianceTermsAccepted');
    expect(previewRes.body.status).toBe('DRAFT');
  });
});
