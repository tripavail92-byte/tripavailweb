import { Test, TestingModule } from '@nestjs/testing';
import { RefundsService } from '../src/refunds/refunds.service';
import { PrismaService } from '../src/prisma.service';
import { RefundStatus, BookingStatus } from '@prisma/client';

/**
 * Week 9: Refunds Integration Tests
 * 
 * Tests the refund business logic:
 * - Refund calculation based on cancellation policy
 * - State machine transitions (PENDING → APPROVED → PROCESSED)
 * - Ledger entry creation (double-entry accounting)
 * - Admin approval workflow
 */
describe('RefundsService', () => {
  let service: RefundsService;
  let prisma: PrismaService;
  let travelerId: string;
  let providerId: string;
  let adminId: string;
  let bookingId: string;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RefundsService, PrismaService],
    }).compile();

    service = module.get<RefundsService>(RefundsService);
    prisma = module.get<PrismaService>(PrismaService);

    // Create test users
    const traveler = await prisma.user.create({
      data: {
        email: `refund-traveler-${Date.now()}@example.com`,
        phone: `+1555${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`,
        firstName: 'Refund',
        lastName: 'Traveler',
        role: 'TRAVELER',
      },
    });
    travelerId = traveler.id;

    const provider = await prisma.user.create({
      data: {
        email: `refund-provider-${Date.now()}@example.com`,
        phone: `+1555${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`,
        firstName: 'Refund',
        lastName: 'Provider',
        role: 'TRAVELER',
      },
    });
    providerId = provider.id;

    await prisma.providerProfile.create({
      data: {
        userId: providerId,
        providerType: 'HOTEL_MANAGER',
        businessName: 'Test Hotel',
        verificationStatus: 'APPROVED',
      },
    });

    const admin = await prisma.user.create({
      data: {
        email: `refund-admin-${Date.now()}@example.com`,
        phone: `+1555${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`,
        firstName: 'Refund',
        lastName: 'Admin',
        role: 'ADMIN',
      },
    });
    adminId = admin.id;

    // Create a test booking
    const booking = await prisma.booking.create({
      data: {
        userId: travelerId,
        status: BookingStatus.CONFIRMED,
        checkInDate: new Date('2026-02-15'),
        checkOutDate: new Date('2026-02-17'),
        numberOfGuests: 2,
        totalPrice: 480,
        cancellationPolicy: 'FLEXIBLE',
        priceSnapshot: {
          basePrice: 400,
          taxes: 50,
          serviceFee: 30,
          totalPrice: 480,
          platformCommission: 48,
          providerEarnings: 382,
          cancellationPolicy: {
            type: 'FLEXIBLE',
            rules: [
              { daysBeforeCheckIn: 1, refundPercentage: 100 },
              { daysBeforeCheckIn: 0, refundPercentage: 50 },
            ],
          },
        },
      },
    });
    bookingId = booking.id;

    // Create initial ledger entries
    await prisma.ledgerEntry.createMany({
      data: [
        {
          debitAccount: `traveler:${travelerId}`,
          creditAccount: `provider:${providerId}`,
          amount: 480,
          currency: 'USD',
          type: 'BOOKING_CHARGE',
          description: 'Hotel booking charge',
          bookingId,
        },
      ],
    });
  });

  afterAll(async () => {
    // Cleanup
    await prisma.refund.deleteMany({ where: { bookingId } });
    await prisma.ledgerEntry.deleteMany({ where: { bookingId } });
    await prisma.booking.deleteMany({ where: { id: bookingId } });
    await prisma.providerProfile.deleteMany({ where: { userId: providerId } });
    await prisma.user.deleteMany({
      where: { id: { in: [travelerId, providerId, adminId] } },
    });
    await prisma.$disconnect();
  });

  describe('requestRefund', () => {
    it('should create a refund request with auto-calculated amount', async () => {
      const refund = await service.requestRefund({
        bookingId,
        userId: travelerId,
        cancellationReason: 'Change of plans',
      });

      expect(refund.status).toBe(RefundStatus.PENDING);
      expect(refund.bookingId).toBe(bookingId);
      expect(refund.userId).toBe(travelerId);
      expect(refund.reason).toBe('Change of plans');
      expect(refund.refundAmount).toBeGreaterThan(0);
      expect(refund.refundAmount).toBeLessThanOrEqual(480);
    });

    it('should fail if refund already exists for booking', async () => {
      await expect(
        service.requestRefund({
          bookingId,
          userId: travelerId,
          cancellationReason: 'Duplicate',
        }),
      ).rejects.toThrow();
    });
  });

  describe('approveRefund', () => {
    it('should allow admin to approve refund', async () => {
      const pending = await prisma.refund.findFirst({
        where: { bookingId },
      });

      const approved = await service.approveRefund({
        refundId: pending!.id,
        adminId,
        notes: 'Approved',
      });

      expect(approved.status).toBe(RefundStatus.APPROVED);
      expect(approved.approvedBy).toBe(adminId);
      expect(approved.approvedAt).toBeDefined();
    });
  });

  describe('processRefund', () => {
    it('should process approved refund and create ledger entries', async () => {
      const approved = await prisma.refund.findFirst({
        where: { bookingId, status: RefundStatus.APPROVED },
      });

      const processed = await service.processRefund({
        refundId: approved!.id,
        paymentReversal: 'stripe_refund_123',
      });
        const processed = await service.processRefund({
          refundId: approved!.id,
        });
      expect(processed.status).toBe(RefundStatus.PROCESSED);
      expect(processed.processedAt).toBeDefined();

      // Verify ledger entry was created
      const ledgerEntries = await prisma.ledgerEntry.findMany({
        where: { type: 'REFUND' },
      });

      expect(ledgerEntries.length).toBeGreaterThan(0);
    });
  });

  describe('rejectRefund', () => {
    it('should allow admin to reject pending refund', async () => {
      // Create new refund for rejection
      const booking2 = await prisma.booking.create({
        data: {
          userId: travelerId,
          status: BookingStatus.CONFIRMED,
          checkInDate: new Date('2026-03-15'),
          checkOutDate: new Date('2026-03-17'),
          numberOfGuests: 1,
          totalPrice: 200,
          cancellationPolicy: 'STRICT',
          priceSnapshot: {
            totalPrice: 200,
            cancellationPolicy: { type: 'STRICT' },
          },
        },
      });

      const refund2 = await service.requestRefund({
        bookingId: booking2.id,
        userId: travelerId,
        cancellationReason: 'Test rejection',
      });

      const rejected = await service.rejectRefund({
        refundId: refund2.id,
        adminId,
        rejectionReason: 'Outside policy window',
      });
        const rejected = await service.rejectRefund(
          refund2.id,
          adminId,
          'Outside policy window',
        );
      expect(rejected.status).toBe(RefundStatus.REJECTED);
      expect(rejected.approvedBy).toBe(adminId);

      // Cleanup
      await prisma.refund.delete({ where: { id: refund2.id } });
      await prisma.booking.delete({ where: { id: booking2.id } });
    });
  });

  describe('getRefund', () => {
    it('should return refund details', async () => {
      const refund = await prisma.refund.findFirst({
        where: { bookingId },
      });

      const fetched = await service.getRefund(refund!.id);

      expect(fetched).toMatchObject({
        id: refund!.id,
        bookingId,
        userId: travelerId,
      });
    });
  });

  describe('getUserRefunds', () => {
    it('should return traveler refunds', async () => {
      const refunds = await service.getUserRefunds(travelerId);

      expect(Array.isArray(refunds)).toBe(true);
      expect(refunds.length).toBeGreaterThanOrEqual(1);
      expect(refunds[0].userId).toBe(travelerId);
    });
  });

  describe('getPendingRefunds', () => {
    it('should return pending refunds for admin', async () => {
      const pending = await service.getPendingRefunds();

      expect(Array.isArray(pending)).toBe(true);
      expect(
        pending.every((r: any) => r.status === RefundStatus.PENDING),
      ).toBe(true);
    });
  });

  describe('getRefundStatistics', () => {
    it('should return refund statistics', async () => {
      const stats = await service.getRefundStatistics();

      expect(stats).toHaveProperty('totalRefunds');
      expect(stats).toHaveProperty('totalAmount');
      expect(stats).toHaveProperty('byStatus');
    });
  });
});
