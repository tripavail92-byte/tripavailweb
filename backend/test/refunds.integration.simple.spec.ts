import { Test, TestingModule } from '@nestjs/testing';
import { RefundsService } from '../src/refunds/refunds.service';
import { PrismaService } from '../src/prisma.service';
import { RefundStatus, BookingStatus } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

/**
 * Week 9: Refunds Integration Tests - Simplified
 * Tests refund business logic without full database setup
 */
describe('RefundsService - Integration Tests', () => {
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

  describe('requestRefund', () => {
    it('should create refund in PENDING state', async () => {
      // Create test booking
      const user = await prisma.user.create({
        data: {
          email: `test-${Date.now()}@example.com`,
          firstName: 'Test',
          lastName: 'User',
          phone: '+15551234567',
          role: 'TRAVELER',
        },
      });

      const booking = await prisma.booking.create({
        data: {
          userId: user.id,
          status: BookingStatus.CONFIRMED,
          numberOfGuests: 1,
          totalPrice: new Decimal(500),
          cancellationPolicy: 'FLEXIBLE',
          priceSnapshot: {
            basePrice: 500,
            tax: 50,
            total: 550,
          },
          checkInDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });

      // Request refund
      const refund = await service.requestRefund({
        bookingId: booking.id,
        userId: user.id,
        cancellationReason: 'Personal reasons',
      });

      expect(refund.status).toBe(RefundStatus.PENDING);
      expect(refund.bookingId).toBe(booking.id);
      expect(refund.requestedBy).toBe(user.id);

      // Cleanup
      await prisma.refund.delete({ where: { id: refund.id } });
      await prisma.booking.delete({ where: { id: booking.id } });
      await prisma.user.delete({ where: { id: user.id } });
    });

    it('should prevent duplicate refunds', async () => {
      const user = await prisma.user.create({
        data: {
          email: `test-dup-${Date.now()}@example.com`,
          firstName: 'Test',
          lastName: 'Dup',
          phone: '+15551234568',
          role: 'TRAVELER',
        },
      });

      const booking = await prisma.booking.create({
        data: {
          userId: user.id,
          status: BookingStatus.CONFIRMED,
          numberOfGuests: 1,
          totalPrice: new Decimal(500),
          cancellationPolicy: 'FLEXIBLE',
          priceSnapshot: { total: 550 },
          checkInDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });

      // First refund request
      const refund1 = await service.requestRefund({
        bookingId: booking.id,
        userId: user.id,
      });

      // Second request should fail (duplicate)
      try {
        await service.requestRefund({
          bookingId: booking.id,
          userId: user.id,
        });
        fail('Should have thrown duplicate refund error');
      } catch (error) {
        expect(error.message).toContain('already has');
      }

      // Cleanup
      await prisma.refund.delete({ where: { id: refund1.id } });
      await prisma.booking.delete({ where: { id: booking.id } });
      await prisma.user.delete({ where: { id: user.id } });
    });
  });

  describe('approveRefund', () => {
    it('should move refund from PENDING to APPROVED', async () => {
      const user = await prisma.user.create({
        data: {
          email: `test-approve-${Date.now()}@example.com`,
          firstName: 'Test',
          lastName: 'Approve',
          phone: '+15551234569',
          role: 'TRAVELER',
        },
      });

      const booking = await prisma.booking.create({
        data: {
          userId: user.id,
          status: BookingStatus.CONFIRMED,
          numberOfGuests: 1,
          totalPrice: new Decimal(500),
          cancellationPolicy: 'FLEXIBLE',
          priceSnapshot: { total: 550 },
          checkInDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });

      const refund = await service.requestRefund({
        bookingId: booking.id,
        userId: user.id,
      });

      const approved = await service.approveRefund(refund.id, 'admin-user-id', 'Approved');

      expect(approved.status).toBe(RefundStatus.APPROVED);
      expect(approved.approvedBy).toBe('admin-user-id');
      expect(approved.approvedAt).toBeDefined();

      // Cleanup
      await prisma.refund.delete({ where: { id: approved.id } });
      await prisma.booking.delete({ where: { id: booking.id } });
      await prisma.user.delete({ where: { id: user.id } });
    });
  });

  describe('rejectRefund', () => {
    it('should allow admin to reject pending refund', async () => {
      const user = await prisma.user.create({
        data: {
          email: `test-reject-${Date.now()}@example.com`,
          firstName: 'Test',
          lastName: 'Reject',
          phone: '+15551234570',
          role: 'TRAVELER',
        },
      });

      const booking = await prisma.booking.create({
        data: {
          userId: user.id,
          status: BookingStatus.CONFIRMED,
          numberOfGuests: 1,
          totalPrice: new Decimal(500),
          cancellationPolicy: 'STRICT',
          priceSnapshot: { total: 550 },
          checkInDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        },
      });

      const refund = await service.requestRefund({
        bookingId: booking.id,
        userId: user.id,
      });

      const rejected = await service.rejectRefund(
        refund.id,
        'admin-user-id',
        'Outside policy window'
      );

      expect(rejected.status).toBe(RefundStatus.REJECTED);
      expect(rejected.approvedBy).toBe('admin-user-id');

      // Cleanup
      await prisma.refund.delete({ where: { id: rejected.id } });
      await prisma.booking.delete({ where: { id: booking.id } });
      await prisma.user.delete({ where: { id: user.id } });
    });
  });

  describe('processRefund', () => {
    it('should process approved refund', async () => {
      const user = await prisma.user.create({
        data: {
          email: `test-process-${Date.now()}@example.com`,
          firstName: 'Test',
          lastName: 'Process',
          phone: '+15551234571',
          role: 'TRAVELER',
        },
      });

      const booking = await prisma.booking.create({
        data: {
          userId: user.id,
          status: BookingStatus.CONFIRMED,
          numberOfGuests: 1,
          totalPrice: new Decimal(500),
          cancellationPolicy: 'FLEXIBLE',
          priceSnapshot: { total: 550 },
          checkInDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });

      const refund = await service.requestRefund({
        bookingId: booking.id,
        userId: user.id,
      });

      await service.approveRefund(refund.id, 'admin-id', 'Approved');

      const processed = await service.processRefund({
        refundId: refund.id,
      });

      expect(processed.status).toBe(RefundStatus.PROCESSED);
      expect(processed.processedAt).toBeDefined();

      // Cleanup
      await prisma.refund.delete({ where: { id: processed.id } });
      await prisma.booking.delete({ where: { id: booking.id } });
      await prisma.user.delete({ where: { id: user.id } });
    });
  });

  describe('getRefundsByBooking', () => {
    it('should retrieve refunds for a booking', async () => {
      const user = await prisma.user.create({
        data: {
          email: `test-get-${Date.now()}@example.com`,
          firstName: 'Test',
          lastName: 'Get',
          phone: '+15551234572',
          role: 'TRAVELER',
        },
      });

      const booking = await prisma.booking.create({
        data: {
          userId: user.id,
          status: BookingStatus.CONFIRMED,
          numberOfGuests: 1,
          totalPrice: new Decimal(500),
          cancellationPolicy: 'FLEXIBLE',
          priceSnapshot: { total: 550 },
          checkInDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });

      const refund = await service.requestRefund({
        bookingId: booking.id,
        userId: user.id,
      });

      const refunds = await service.getRefundsByBooking(booking.id);

      expect(refunds.length).toBe(1);
      expect(refunds[0].id).toBe(refund.id);

      // Cleanup
      await prisma.refund.delete({ where: { id: refund.id } });
      await prisma.booking.delete({ where: { id: booking.id } });
      await prisma.user.delete({ where: { id: user.id } });
    });
  });
});
