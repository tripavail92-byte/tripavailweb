import { Test, TestingModule } from '@nestjs/testing';
import { RefundsService } from '../src/refunds/refunds.service';
import { PrismaService } from '../src/prisma.service';
import { RefundStatus, BookingStatus } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

/**
 * Week 9: Refunds Integration Tests - Smoke Tests
 * Verifies core refund functionality without full database setup
 */
describe('RefundsService - Smoke Tests', () => {
  let service: RefundsService;
  let prisma: PrismaService;
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      providers: [RefundsService, PrismaService],
    }).compile();

    service = module.get<RefundsService>(RefundsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterAll(async () => {
    await module.close();
  });

  describe('Service Initialization', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });

    it('should have requestRefund method', () => {
      expect(service.requestRefund).toBeDefined();
      expect(typeof service.requestRefund).toBe('function');
    });

    it('should have approveRefund method', () => {
      expect(service.approveRefund).toBeDefined();
      expect(typeof service.approveRefund).toBe('function');
    });

    it('should have processRefund method', () => {
      expect(service.processRefund).toBeDefined();
      expect(typeof service.processRefund).toBe('function');
    });
  });

  describe('Refund Request Flow', () => {
    let testUserId: string;
    let testProviderId: string;
    let testProviderProfileId: string;
    let testBookingId: string;

    beforeEach(async () => {
      // Create test user
      const user = await prisma.user.create({
        data: {
          email: `test-${Date.now()}@example.com`,
          firstName: 'Test',
          lastName: 'User',
          phone: '+15551234567',
          role: 'TRAVELER',
        },
      });
      testUserId = user.id;

      // Create test provider
      const provider = await prisma.user.create({
        data: {
          email: `provider-${Date.now()}@example.com`,
          firstName: 'Provider',
          lastName: 'Test',
          phone: '+15551234568',
          role: 'TRAVELER',
        },
      });
      testProviderId = provider.id;

      // Create provider profile
      const providerProfile = await prisma.providerProfile.create({
        data: {
          userId: provider.id,
          providerType: 'HOTEL_MANAGER',
          verificationStatus: 'APPROVED',
        },
      });
      testProviderProfileId = providerProfile.id;

      // Create hotel package for booking
      const hotelPackage = await prisma.hotelPackage.create({
        data: {
          providerId: testProviderProfileId,
          listingId: `listing-${Date.now()}`,
          templateId: `template-${Date.now()}`,
          name: 'Test Hotel Package',
          description: 'Test package',
          pricePerPerson: new Decimal(500),
          inclusions: ['WiFi'],
          exclusions: [],
          availabilityRule: 'FLEXIBLE',
          status: 'PUBLISHED',
        },
      });

      // Create test booking
      const booking = await prisma.booking.create({
        data: {
          userId: testUserId,
          hotelPackageId: hotelPackage.id,
          status: BookingStatus.CONFIRMED,
          numberOfGuests: 2,
          totalPrice: new Decimal(500),
          cancellationPolicy: 'FLEXIBLE',
          cancellationPolicyJson: { type: 'FLEXIBLE' },
          priceSnapshot: {
            basePrice: 500,
            tax: 50,
            total: 550,
          },
          checkInDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });
      testBookingId = booking.id;
    });

    afterEach(async () => {
      // Cleanup in order
      await prisma.refund.deleteMany({
        where: { bookingId: testBookingId },
      });
      await prisma.booking.deleteMany({
        where: { id: testBookingId },
      });
      await prisma.providerProfile.deleteMany({
        where: { userId: testProviderId },
      });
      await prisma.user.deleteMany({
        where: { id: { in: [testUserId, testProviderId] } },
      });
    });

    it('should create refund request in PENDING state', async () => {
      const refund = await service.requestRefund({
        bookingId: testBookingId,
        userId: testUserId,
        cancellationReason: 'Personal reasons',
      });

      expect(refund).toBeDefined();
      expect(refund.status).toBe(RefundStatus.PENDING);
      expect(refund.bookingId).toBe(testBookingId);
      expect(refund.refundAmount instanceof Decimal).toBe(true);
    });

    it('should prevent duplicate refund requests', async () => {
      // First request
      await service.requestRefund({
        bookingId: testBookingId,
        userId: testUserId,
      });

      // Second request should fail
      await expect(
        service.requestRefund({
          bookingId: testBookingId,
          userId: testUserId,
        }),
      ).rejects.toBeDefined();
    });

    it('should approve pending refund', async () => {
      const refund = await service.requestRefund({
        bookingId: testBookingId,
        userId: testUserId,
      });

      const approved = await service.approveRefund({
        refundId: refund.id,
        adminId: 'test-admin-id',
        notes: 'Approved',
      });

      expect(approved.status).toBe(RefundStatus.APPROVED);
      expect(approved.approvedBy).toBe('test-admin-id');
      expect(approved.approvedAt).toBeDefined();
    });

    it('should reject pending refund', async () => {
      const refund = await service.requestRefund({
        bookingId: testBookingId,
        userId: testUserId,
      });

      const rejected = await service.rejectRefund(
        refund.id,
        'test-admin-id',
        'Outside policy window'
      );

      expect(rejected.status).toBe(RefundStatus.REJECTED);
      expect(rejected.approvedBy).toBe('test-admin-id');
    });

    it('should process approved refund', async () => {
      const refund = await service.requestRefund({
        bookingId: testBookingId,
        userId: testUserId,
      });

      await service.approveRefund({
        refundId: refund.id,
        adminId: 'test-admin',
      });

      const processed = await service.processRefund({
        refundId: refund.id,
      });

      expect(processed.status).toBe(RefundStatus.PROCESSED);
      expect(processed.processedAt).toBeDefined();
    });

    it('should retrieve refund by booking id', async () => {
      const refund = await service.requestRefund({
        bookingId: testBookingId,
        userId: testUserId,
      });

      const retrieved = await service.getRefundByBooking(testBookingId);

      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe(refund.id);
    });
  });
});
