import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma.service';

/**
 * Day 40: E2E Tests for Booking Confirmation & Cancellation Flows
 *
 * Tests the complete booking lifecycle:
 * 1. QUOTE → HOLD → PAYMENT_PENDING → CONFIRMED
 * 2. CONFIRMED → CANCELLED_BY_GUEST (with policy-based refunds)
 * 3. CONFIRMED → CANCELLED_BY_PROVIDER (with 100% refunds)
 * 4. Ledger entry validation (double-entry accounting)
 */
describe('Booking Confirmation & Cancellation (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authToken: string;
  let userId: string;
  let providerId: string;
  let hotelPackageId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    app.setGlobalPrefix('v1'); // Add global prefix for API versioning
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);

    // Setup: Create test user and authenticate
    const testUser = await prisma.user.create({
      data: {
        email: `test-${Date.now()}@example.com`,
        phone: `+12025550${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`,
        firstName: 'Test',
        lastName: 'User',
        role: 'TRAVELER',
      },
    });
    userId = testUser.id;

    // Create auth token (mock JWT for testing)
    const startResponse = await request(app.getHttpServer())
      .post('/v1/auth/start')
      .send({ phone: testUser.phone, channel: 'phone', purpose: 'login' });
    
    if (startResponse.status !== 201) {
      console.error('Auth start failed:', startResponse.status, startResponse.body);
      throw new Error(`Auth start failed: ${JSON.stringify(startResponse.body)}`);
    }

    const otpRecord = await prisma.authOtp.findFirst({
      where: { target: testUser.phone! },
      orderBy: { createdAt: 'desc' },
    });

    await request(app.getHttpServer())
      .post('/v1/auth/verify')
      .send({ phone: testUser.phone, channel: 'phone', purpose: 'login', code: otpRecord!.code });

    // Extract the mock token and create a proper JWT format token for testing
    // The mock format is "mock-access-{userId}", we need "header.payload.signature"
    userId = testUser.id;
    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64');
    
    // Setup: Create test provider first (before creating JWT)
    const provider = await prisma.providerProfile.create({
      data: {
        userId: testUser.id,
        providerType: 'HOTEL_MANAGER',
        businessName: 'Test Hotel',
        verificationStatus: 'APPROVED',
      },
    });
    providerId = provider.id;
    
    // Include providerId in JWT payload for provider cancellation tests
    const payload = Buffer.from(JSON.stringify({ sub: userId, email: testUser.email, providerId: providerId })).toString('base64');
    const signature = Buffer.from('mock-signature').toString('base64');
    authToken = `${header}.${payload}.${signature}`;

    // Setup: Create hotel package

    // Create cancellation policy (MODERATE: 100% until 7d, 50% until 1d)
    const policy = await prisma.cancellationPolicy.create({
      data: {
        type: 'MODERATE',
        name: 'Moderate Cancellation',
        description: 'Full refund 7+ days before, 50% 1-6 days before',
        fullRefundUntilDays: 7,
        partialRefundUntilDays: 1,
        noRefundUntilDays: 0,
      },
    });

    const hotelPackage = await prisma.hotelPackage.create({
      data: {
        providerId: provider.id,
        listingId: 'test-listing-id',
        templateId: 'weekend-getaway',
        name: 'Weekend Package',
        description: 'Test package',
        status: 'PUBLISHED',
        pricePerPerson: 200.0,
        inclusions: ['Breakfast'],
        exclusions: ['Lunch'],
        availabilityRule: 'FLEXIBLE',
        cancellationPolicyId: policy.id,
      },
    });
    hotelPackageId = hotelPackage.id;

    // Seed a concrete Listing, Room, and InventoryNight rows for inventory locking
    const listing = await prisma.listing.create({
      data: {
        id: 'test-listing-id',
        providerId: provider.id,
        name: 'Test Listing',
        address: '123 Test Street',
        city: 'Test City',
        latitude: 0,
        longitude: 0,
        description: 'Test listing for E2E booking flows',
        status: 'PUBLISHED',
        checkInTime: '14:00',
        checkOutTime: '11:00',
      },
    });

    const room = await prisma.room.create({
      data: {
        listingId: listing.id,
        name: 'Standard Room',
        capacity: 2,
        bedConfig: '1 Queen',
        basePrice: 200.0,
        totalUnits: 10,
      },
    });

    // Create inventory for the next 60 days so holds/pre-authorizations can succeed
    const today = new Date();
    const inventoryNightsData = [] as any[];
    for (let i = 0; i < 60; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      inventoryNightsData.push({
        roomId: room.id,
        date,
        totalUnits: 10,
        availableUnits: 10,
        basePrice: 200.0,
      });
    }

    await prisma.inventoryNight.createMany({ data: inventoryNightsData });
  });

  afterAll(async () => {
    // Cleanup
    await prisma.review.deleteMany({});
    await prisma.ledgerEntry.deleteMany({});
    await prisma.payment.deleteMany({});
    await prisma.booking.deleteMany({});
    await prisma.hotelPackage.deleteMany({});
    await prisma.cancellationPolicy.deleteMany({});
    await prisma.providerProfile.deleteMany({});
    await prisma.listing.deleteMany({});
    await prisma.room.deleteMany({});
    await prisma.inventoryNight.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.$disconnect();
    await app.close();
  });

  describe('Booking Confirmation Flow', () => {
    let bookingId: string;
    let paymentId: string;

    it('should create a quote (QUOTE state)', async () => {
      const checkInDate = new Date();
      checkInDate.setDate(checkInDate.getDate() + 30); // 30 days from now

      const checkOutDate = new Date(checkInDate);
      checkOutDate.setDate(checkOutDate.getDate() + 2);

      const response = await request(app.getHttpServer())
        .post('/v1/bookings/quote')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          packageType: 'HOTEL_PACKAGE',
          packageId: hotelPackageId,
          checkInDate: checkInDate.toISOString(),
          checkOutDate: checkOutDate.toISOString(),
          numberOfGuests: 2,
          numberOfRooms: 1,
          selectedRoomIds: [],
          selectedAddOns: [],
          idempotencyKey: `test-quote-${Date.now()}`,
        })
        .expect(201);

      expect(response.body.status).toBe('QUOTE');
      expect(response.body.totalPrice).toBeGreaterThan(0);
      bookingId = response.body.id;
    });

    it('should create a hold (HOLD state)', async () => {
      const response = await request(app.getHttpServer())
        .post('/v1/bookings/hold')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          quoteId: bookingId,
          idempotencyKey: `test-hold-${Date.now()}`,
        });

      if (response.status !== 201) {
        // Helpful debug output when the inventory locking fails
        console.error('Hold creation failed:', response.status, response.body);
        throw new Error(`Hold creation failed: ${JSON.stringify(response.body)}`);
      }

      expect(response.body.status).toBe('HOLD');
      expect(response.body.holdExpiresAt).toBeDefined();
    });

    it('should pre-authorize payment (PAYMENT_PENDING state)', async () => {
      const response = await request(app.getHttpServer())
        .post('/v1/payments/pre-authorize')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          bookingId,
          paymentMethodId: 'pm_test_card',
          idempotencyKey: `test-payment-${Date.now()}`,
        })
        .expect(201);

      expect(response.body.status).toBe('PRE_AUTHORIZED');
      expect(response.body.bookingStatus).toBe('PAYMENT_PENDING');
      paymentId = response.body.id;
    });

    it('should confirm booking and create ledger entries (CONFIRMED state)', async () => {
      const response = await request(app.getHttpServer())
        .post(`/v1/bookings/${bookingId}/confirm`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.status).toBe('CONFIRMED');
      expect(response.body.confirmedAt).toBeDefined();

      // Verify payment was captured
      const payment = await prisma.payment.findUnique({
        where: { id: paymentId },
      });
      expect(payment!.status).toBe('CAPTURED');

      // Verify ledger entries (double-entry accounting)
      const ledgerEntries = await prisma.ledgerEntry.findMany({
        where: { bookingId },
        orderBy: { createdAt: 'asc' },
      });

      expect(ledgerEntries.length).toBe(3);

      // Entry 1: Debit traveler, Credit platform escrow
      expect(ledgerEntries[0].type).toBe('BOOKING_CONFIRMED');
      expect(ledgerEntries[0].debitAccount).toBe(`traveler:${userId}`);
      expect(ledgerEntries[0].creditAccount).toBe('platform:escrow');

      // Entry 2: Debit platform escrow, Credit provider earnings
      expect(ledgerEntries[1].type).toBe('BOOKING_CONFIRMED');
      expect(ledgerEntries[1].debitAccount).toBe('platform:escrow');
      expect(ledgerEntries[1].creditAccount).toBe(`provider:${providerId}`);

      // Entry 3: Debit platform escrow, Credit platform revenue (commission)
      expect(ledgerEntries[2].type).toBe('BOOKING_CONFIRMED');
      expect(ledgerEntries[2].debitAccount).toBe('platform:escrow');
      expect(ledgerEntries[2].creditAccount).toBe('platform:revenue');

      // Verify accounting balance (total debits = total credits)
      const totalDebits = ledgerEntries
        .filter((e) => e.debitAccount === `traveler:${userId}`)
        .reduce((sum, e) => sum + Number(e.amount), 0);

      const totalProviderCredits = ledgerEntries
        .filter((e) => e.creditAccount === `provider:${providerId}`)
        .reduce((sum, e) => sum + Number(e.amount), 0);

      const totalCommissionCredits = ledgerEntries
        .filter((e) => e.creditAccount === 'platform:revenue')
        .reduce((sum, e) => sum + Number(e.amount), 0);

      expect(totalDebits).toBeCloseTo(totalProviderCredits + totalCommissionCredits, 2);
    });

    it('should reject confirmation if booking is not in PAYMENT_PENDING state', async () => {
      const response = await request(app.getHttpServer())
        .post(`/v1/bookings/${bookingId}/confirm`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body.message).toContain('Cannot confirm booking');
      expect(response.body.message).toContain('CONFIRMED');
    });
  });

  describe('Guest Cancellation Flow (Policy-Based Refunds)', () => {
    let bookingId: string;
    let paymentId: string;
    let totalPaid: number;

    beforeAll(async () => {
      // Create and confirm a new booking
      const checkInDate = new Date();
      checkInDate.setDate(checkInDate.getDate() + 10); // 10 days from now (within MODERATE policy: 100% refund if >7d)

      const checkOutDate = new Date(checkInDate);
      checkOutDate.setDate(checkOutDate.getDate() + 2);

      // Create quote
      const quoteResponse = await request(app.getHttpServer())
        .post('/v1/bookings/quote')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          packageType: 'HOTEL_PACKAGE',
          packageId: hotelPackageId,
          checkInDate: checkInDate.toISOString(),
          checkOutDate: checkOutDate.toISOString(),
          numberOfGuests: 2,
          numberOfRooms: 1,
          selectedRoomIds: [],
          selectedAddOns: [],
          idempotencyKey: `test-cancel-quote-${Date.now()}`,
        });

      bookingId = quoteResponse.body.id;
      totalPaid = quoteResponse.body.totalPrice;

      // Create hold
      await request(app.getHttpServer())
        .post('/v1/bookings/hold')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          quoteId: bookingId,
          idempotencyKey: `test-cancel-hold-${Date.now()}`,
        });

      // Pre-authorize payment
      const paymentResponse = await request(app.getHttpServer())
        .post('/v1/payments/pre-authorize')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          bookingId,
          paymentMethodId: 'pm_test_card',
          idempotencyKey: `test-cancel-payment-${Date.now()}`,
        });

      paymentId = paymentResponse.body.id;

      // Confirm booking
      await request(app.getHttpServer())
        .post(`/v1/bookings/${bookingId}/confirm`)
        .set('Authorization', `Bearer ${authToken}`);
    });

    it('should cancel booking with policy-based refund (MODERATE: 100% if >7d)', async () => {
      const response = await request(app.getHttpServer())
        .post(`/v1/bookings/${bookingId}/cancel/guest`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.status).toBe('CANCELLED_BY_GUEST');
      expect(response.body.cancelledAt).toBeDefined();
      expect(response.body.refundCalculation).toBeDefined();

      const refundCalc = response.body.refundCalculation;
      expect(refundCalc.policyType).toBe('MODERATE');
      expect(refundCalc.daysUntilCheckIn).toBeGreaterThanOrEqual(7);
      expect(refundCalc.refundPercentage).toBe(100);
      expect(refundCalc.isEligibleForRefund).toBe(true);
      expect(refundCalc.refundAmount).toBeCloseTo(totalPaid, 2);

      // Verify payment was refunded
      const payment = await prisma.payment.findUnique({
        where: { id: paymentId },
      });
      expect(payment!.status).toBe('REFUNDED');

      // Verify reversal ledger entries
      const refundEntries = await prisma.ledgerEntry.findMany({
        where: { bookingId, type: 'REFUND_PROCESSED' },
        orderBy: { createdAt: 'asc' },
      });

      expect(refundEntries.length).toBe(3);

      // Entry 1: Debit provider (take back earnings)
      expect(refundEntries[0].debitAccount).toBe(`provider:${providerId}`);
      expect(refundEntries[0].creditAccount).toBe('platform:escrow');

      // Entry 2: Debit platform revenue (take back commission)
      expect(refundEntries[1].debitAccount).toBe('platform:revenue');
      expect(refundEntries[1].creditAccount).toBe('platform:escrow');

      // Entry 3: Credit traveler (refund payment)
      expect(refundEntries[2].debitAccount).toBe('platform:escrow');
      expect(refundEntries[2].creditAccount).toBe(`traveler:${userId}`);
    });

    it('should reject cancellation if booking is not CONFIRMED', async () => {
      const response = await request(app.getHttpServer())
        .post(`/v1/bookings/${bookingId}/cancel/guest`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body.message).toContain('Cannot cancel booking');
    });
  });

  describe('Provider Cancellation Flow (100% Refund)', () => {
    let bookingId: string;
    let totalPaid: number;

    beforeAll(async () => {
      // Create and confirm a new booking with check-in TOMORROW (should be 0% refund for guest, but 100% for provider cancellation)
      const checkInDate = new Date();
      checkInDate.setDate(checkInDate.getDate() + 1); // 1 day from now

      const checkOutDate = new Date(checkInDate);
      checkOutDate.setDate(checkOutDate.getDate() + 2);

      // Create quote
      const quoteResponse = await request(app.getHttpServer())
        .post('/v1/bookings/quote')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          packageType: 'HOTEL_PACKAGE',
          packageId: hotelPackageId,
          checkInDate: checkInDate.toISOString(),
          checkOutDate: checkOutDate.toISOString(),
          numberOfGuests: 2,
          numberOfRooms: 1,
          selectedRoomIds: [],
          selectedAddOns: [],
          idempotencyKey: `test-provider-cancel-quote-${Date.now()}`,
        });

      bookingId = quoteResponse.body.id;
      totalPaid = quoteResponse.body.totalPrice;

      // Create hold
      await request(app.getHttpServer())
        .post('/v1/bookings/hold')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          quoteId: bookingId,
          idempotencyKey: `test-provider-cancel-hold-${Date.now()}`,
        });

      // Pre-authorize payment
      await request(app.getHttpServer())
        .post('/v1/payments/pre-authorize')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          bookingId,
          paymentMethodId: 'pm_test_card',
          idempotencyKey: `test-provider-cancel-payment-${Date.now()}`,
        });

      // Confirm booking
      await request(app.getHttpServer())
        .post(`/v1/bookings/${bookingId}/confirm`)
        .set('Authorization', `Bearer ${authToken}`);
    });

    it('should cancel booking with 100% refund (regardless of policy)', async () => {
      // Note: In real implementation, this would require provider authentication
      // For testing, we'll simulate provider cancellation
      const response = await request(app.getHttpServer())
        .post(`/v1/bookings/${bookingId}/cancel/provider`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.status).toBe('CANCELLED_BY_PROVIDER');
      expect(response.body.cancelledAt).toBeDefined();
      expect(response.body.refundAmount).toBeCloseTo(totalPaid, 2);

      // Verify 100% refund even though check-in is tomorrow (MODERATE policy would give 50%)
      expect(response.body.refundAmount).toBe(response.body.totalPaid);

      // Verify reversal ledger entries
      const refundEntries = await prisma.ledgerEntry.findMany({
        where: { bookingId, type: 'REFUND_PROCESSED' },
        orderBy: { createdAt: 'asc' },
      });

      expect(refundEntries.length).toBe(3);

      // Verify full refund to traveler
      const travelerRefund = refundEntries.find(
        (e) => e.creditAccount === `traveler:${userId}`,
      );
      expect(Number(travelerRefund!.amount)).toBeCloseTo(totalPaid, 2);
    });
  });

  describe('Error Handling', () => {
    it('should handle missing booking', async () => {
      await request(app.getHttpServer())
        .post('/v1/bookings/nonexistent-id/confirm')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    it('should handle unauthorized cancellation', async () => {
      // Create another user
      const otherUser = await prisma.user.create({
        data: {
          email: `other-${Date.now()}@example.com`,
          phone: `+12025551${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`,
          firstName: 'Other',
          lastName: 'User',
          role: 'TRAVELER',
        },
      });

      // Create auth token for other user
      await request(app.getHttpServer())
        .post('/v1/auth/start')
        .send({ phone: otherUser.phone, channel: 'phone', purpose: 'login' });

      const otpRecord = await prisma.authOtp.findFirst({
        where: { target: otherUser.phone! },
        orderBy: { createdAt: 'desc' },
      });

      await request(app.getHttpServer())
        .post('/v1/auth/verify')
        .send({
          phone: otherUser.phone,
          channel: 'phone',
          purpose: 'login',
          code: otpRecord!.code,
        });

      // Create a proper JWT format token for testing
      const otherUserId = otherUser.id;
      const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64');
      const payload = Buffer.from(JSON.stringify({ sub: otherUserId, email: otherUser.email })).toString('base64');
      const signature = Buffer.from('mock-signature').toString('base64');
      const otherUserToken = `${header}.${payload}.${signature}`;

      // Create a booking for the original user
      const checkInDate = new Date();
      checkInDate.setDate(checkInDate.getDate() + 15);
      const checkOutDate = new Date(checkInDate);
      checkOutDate.setDate(checkOutDate.getDate() + 2);

      const quoteResponse = await request(app.getHttpServer())
        .post('/v1/bookings/quote')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          packageType: 'HOTEL_PACKAGE',
          packageId: hotelPackageId,
          checkInDate: checkInDate.toISOString(),
          checkOutDate: checkOutDate.toISOString(),
          numberOfGuests: 2,
          numberOfRooms: 1,
          selectedRoomIds: [],
          selectedAddOns: [],
          idempotencyKey: `test-unauthorized-${Date.now()}`,
        });

      const bookingId = quoteResponse.body.id;

      await request(app.getHttpServer())
        .post('/v1/bookings/hold')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          quoteId: bookingId,
          idempotencyKey: `test-unauthorized-hold-${Date.now()}`,
        });

      await request(app.getHttpServer())
        .post('/v1/payments/pre-authorize')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          bookingId,
          paymentMethodId: 'pm_test_card',
          idempotencyKey: `test-unauthorized-payment-${Date.now()}`,
        });

      await request(app.getHttpServer())
        .post(`/v1/bookings/${bookingId}/confirm`)
        .set('Authorization', `Bearer ${authToken}`);

      // Try to cancel with other user's token
      const response = await request(app.getHttpServer())
        .post(`/v1/bookings/${bookingId}/cancel/guest`)
        .set('Authorization', `Bearer ${otherUserToken}`)
        .expect(400);

      expect(response.body.message).toContain('only cancel your own bookings');
    });
  });
});
