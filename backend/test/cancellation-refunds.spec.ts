import { Test, TestingModule } from '@nestjs/testing';
import { CancellationService, RefundCalculation } from '../cancellation.service';
import { PrismaService } from '../../prisma.service';
import { CancellationPolicyType } from '@prisma/client';

/**
 * Day 38B: Cancellation Policy Refund Calculation Tests
 *
 * Tests the core refund logic for all policy types.
 */
describe('CancellationService - Refund Calculations', () => {
  let service: CancellationService;
  let prisma: PrismaService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CancellationService, PrismaService],
    }).compile();

    service = module.get<CancellationService>(CancellationService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  /**
   * Test FLEXIBLE policy refund calculations.
   *
   * FLEXIBLE: Full refund until 24 hours before check-in.
   */
  describe('FLEXIBLE Policy', () => {
    it('should give 100% refund when cancelling 2 days before check-in', () => {
      const totalPaid = 500.0;
      const daysUntilCheckIn = 2;

      const refund = (service as any).calculateRefundAmount(
        CancellationPolicyType.FLEXIBLE,
        daysUntilCheckIn,
        totalPaid,
      );

      expect(refund).toBe(500.0); // 100% refund
    });

    it('should give 100% refund when cancelling 1 day before check-in', () => {
      const totalPaid = 500.0;
      const daysUntilCheckIn = 1;

      const refund = (service as any).calculateRefundAmount(
        CancellationPolicyType.FLEXIBLE,
        daysUntilCheckIn,
        totalPaid,
      );

      expect(refund).toBe(500.0); // 100% refund (exactly 24h)
    });

    it('should give 0% refund when cancelling same day as check-in', () => {
      const totalPaid = 500.0;
      const daysUntilCheckIn = 0;

      const refund = (service as any).calculateRefundAmount(
        CancellationPolicyType.FLEXIBLE,
        daysUntilCheckIn,
        totalPaid,
      );

      expect(refund).toBe(0); // No refund
    });
  });

  /**
   * Test MODERATE policy refund calculations.
   *
   * MODERATE: Full refund until 7 days, 50% until 24h before.
   */
  describe('MODERATE Policy', () => {
    it('should give 100% refund when cancelling 10 days before', () => {
      const totalPaid = 500.0;
      const daysUntilCheckIn = 10;

      const refund = (service as any).calculateRefundAmount(
        CancellationPolicyType.MODERATE,
        daysUntilCheckIn,
        totalPaid,
      );

      expect(refund).toBe(500.0);
    });

    it('should give 100% refund when cancelling exactly 7 days before', () => {
      const totalPaid = 500.0;
      const daysUntilCheckIn = 7;

      const refund = (service as any).calculateRefundAmount(
        CancellationPolicyType.MODERATE,
        daysUntilCheckIn,
        totalPaid,
      );

      expect(refund).toBe(500.0);
    });

    it('should give 50% refund when cancelling 3 days before', () => {
      const totalPaid = 500.0;
      const daysUntilCheckIn = 3;

      const refund = (service as any).calculateRefundAmount(
        CancellationPolicyType.MODERATE,
        daysUntilCheckIn,
        totalPaid,
      );

      expect(refund).toBe(250.0); // 50% refund
    });

    it('should give 0% refund when cancelling same day', () => {
      const totalPaid = 500.0;
      const daysUntilCheckIn = 0;

      const refund = (service as any).calculateRefundAmount(
        CancellationPolicyType.MODERATE,
        daysUntilCheckIn,
        totalPaid,
      );

      expect(refund).toBe(0);
    });
  });

  /**
   * Test STRICT policy refund calculations.
   *
   * STRICT: Full refund until 30 days, 50% until 7 days before.
   */
  describe('STRICT Policy', () => {
    it('should give 100% refund when cancelling 45 days before', () => {
      const totalPaid = 1000.0;
      const daysUntilCheckIn = 45;

      const refund = (service as any).calculateRefundAmount(
        CancellationPolicyType.STRICT,
        daysUntilCheckIn,
        totalPaid,
      );

      expect(refund).toBe(1000.0);
    });

    it('should give 100% refund when cancelling exactly 30 days before', () => {
      const totalPaid = 1000.0;
      const daysUntilCheckIn = 30;

      const refund = (service as any).calculateRefundAmount(
        CancellationPolicyType.STRICT,
        daysUntilCheckIn,
        totalPaid,
      );

      expect(refund).toBe(1000.0);
    });

    it('should give 50% refund when cancelling 15 days before', () => {
      const totalPaid = 1000.0;
      const daysUntilCheckIn = 15;

      const refund = (service as any).calculateRefundAmount(
        CancellationPolicyType.STRICT,
        daysUntilCheckIn,
        totalPaid,
      );

      expect(refund).toBe(500.0); // 50% refund
    });

    it('should give 50% refund when cancelling exactly 7 days before', () => {
      const totalPaid = 1000.0;
      const daysUntilCheckIn = 7;

      const refund = (service as any).calculateRefundAmount(
        CancellationPolicyType.STRICT,
        daysUntilCheckIn,
        totalPaid,
      );

      expect(refund).toBe(500.0);
    });

    it('should give 0% refund when cancelling 3 days before', () => {
      const totalPaid = 1000.0;
      const daysUntilCheckIn = 3;

      const refund = (service as any).calculateRefundAmount(
        CancellationPolicyType.STRICT,
        daysUntilCheckIn,
        totalPaid,
      );

      expect(refund).toBe(0);
    });
  });

  /**
   * Test NON_REFUNDABLE policy.
   */
  describe('NON_REFUNDABLE Policy', () => {
    it('should never give refunds regardless of timing', () => {
      const totalPaid = 500.0;

      // Test various days before check-in
      const scenarios = [60, 30, 14, 7, 1, 0];

      scenarios.forEach((days) => {
        const refund = (service as any).calculateRefundAmount(
          CancellationPolicyType.NON_REFUNDABLE,
          days,
          totalPaid,
        );

        expect(refund).toBe(0);
      });
    });
  });
});
