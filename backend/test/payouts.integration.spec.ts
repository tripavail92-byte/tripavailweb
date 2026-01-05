import { Test, TestingModule } from '@nestjs/testing';
import { PayoutsService } from '../src/payouts/payouts.service';
import { PrismaService } from '../src/prisma.service';
import { PayoutStatus } from '@prisma/client';

/**
 * Week 9: Payouts Integration Tests
 * 
 * Tests the payout business logic:
 * - Provider earnings calculation from ledger
 * - Payout batch creation
 * - Batch approval and processing
 * - Provider payout statements
 */
describe('PayoutsService', () => {
  let service: PayoutsService;
  let prisma: PrismaService;
  let provider1Id: string;
  let provider2Id: string;
  let adminId: string;
  let provider1ProfileId: string;
  let provider2ProfileId: string;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PayoutsService, PrismaService],
    }).compile();

    service = module.get<PayoutsService>(PayoutsService);
    prisma = module.get<PrismaService>(PrismaService);

    // Create test providers
    const provider1 = await prisma.user.create({
      data: {
        email: `payout-provider1-${Date.now()}@example.com`,
        phone: `+1555${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`,
        firstName: 'Payout',
        lastName: 'Provider1',
        role: 'TRAVELER',
      },
    });
    provider1Id = provider1.id;

    const provider2 = await prisma.user.create({
      data: {
        email: `payout-provider2-${Date.now()}@example.com`,
        phone: `+1555${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`,
        firstName: 'Payout',
        lastName: 'Provider2',
        role: 'TRAVELER',
      },
    });
    provider2Id = provider2.id;

    // Create provider profiles
    const profile1 = await prisma.providerProfile.create({
      data: {
        userId: provider1Id,
        providerType: 'HOTEL_MANAGER',
        businessName: 'Payout Hotel 1',
        verificationStatus: 'APPROVED',
      },
    });
    provider1ProfileId = profile1.id;

    const profile2 = await prisma.providerProfile.create({
      data: {
        userId: provider2Id,
        providerType: 'HOTEL_MANAGER',
        businessName: 'Payout Hotel 2',
        verificationStatus: 'APPROVED',
      },
    });
    provider2ProfileId = profile2.id;

    // Create test admin
    const admin = await prisma.user.create({
      data: {
        email: `payout-admin-${Date.now()}@example.com`,
        phone: `+1555${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`,
        firstName: 'Payout',
        lastName: 'Admin',
        role: 'ADMIN',
      },
    });
    adminId = admin.id;

    // Create ledger entries (simulating booking earnings)
    await prisma.ledgerEntry.createMany({
      data: [
        // Provider 1 earnings
        {
          debitAccount: 'traveler:t1',
          creditAccount: `provider:${provider1Id}`,
          amount: 500,
          currency: 'USD',
          type: 'BOOKING_CHARGE',
          description: 'Hotel booking 1',
        },
        {
          debitAccount: 'traveler:t2',
          creditAccount: `provider:${provider1Id}`,
          amount: 300,
          currency: 'USD',
          type: 'BOOKING_CHARGE',
          description: 'Hotel booking 2',
        },
        // Provider 2 earnings
        {
          debitAccount: 'traveler:t3',
          creditAccount: `provider:${provider2Id}`,
          amount: 750,
          currency: 'USD',
          type: 'BOOKING_CHARGE',
          description: 'Hotel booking 3',
        },
        {
          debitAccount: 'traveler:t4',
          creditAccount: `provider:${provider2Id}`,
          amount: 450,
          currency: 'USD',
          type: 'BOOKING_CHARGE',
          description: 'Hotel booking 4',
        },
      ],
    });
  });

  afterAll(async () => {
    // Cleanup
    await prisma.payoutStatement.deleteMany({
      where: { providerProfileId: { in: [provider1ProfileId, provider2ProfileId] } },
    });
    await prisma.payoutBatch.deleteMany({
      where: {
        statements: {
          some: { providerProfileId: { in: [provider1ProfileId, provider2ProfileId] } },
        },
      },
    });
    await prisma.ledgerEntry.deleteMany({
      where: {
        OR: [
          { creditAccount: { in: [`provider:${provider1Id}`, `provider:${provider2Id}`] } },
          { debitAccount: { in: [`provider:${provider1Id}`, `provider:${provider2Id}`] } },
        ],
      },
    });
    await prisma.providerProfile.deleteMany({
      where: { id: { in: [provider1ProfileId, provider2ProfileId] } },
    });
    await prisma.user.deleteMany({
      where: { id: { in: [provider1Id, provider2Id, adminId] } },
    });
    await prisma.$disconnect();
  });

  describe('calculateProviderEarnings', () => {
    it('should calculate provider 1 earnings from ledger', async () => {
      const startDate = new Date('2026-01-01');
      const endDate = new Date('2026-12-31');

      const earnings = await service.calculateProviderEarnings(
        provider1Id,
        startDate,
        endDate,
      );

      expect(earnings.providerId).toBe(provider1Id);
      expect(earnings.currency).toBe('USD');
      expect(parseFloat(earnings.totalEarnings)).toBe(800); // 500 + 300
      expect(parseFloat(earnings.platformFee)).toBe(80); // 10%
      expect(parseFloat(earnings.netPayout)).toBe(720); // 800 - 80
    });

    it('should calculate provider 2 earnings from ledger', async () => {
      const startDate = new Date('2026-01-01');
      const endDate = new Date('2026-12-31');

      const earnings = await service.calculateProviderEarnings(
        provider2Id,
        startDate,
        endDate,
      );

      expect(parseFloat(earnings.totalEarnings)).toBe(1200); // 750 + 450
      expect(parseFloat(earnings.platformFee)).toBe(120); // 10%
      expect(parseFloat(earnings.netPayout)).toBe(1080); // 1200 - 120
    });
  });

  describe('createPayoutBatch', () => {
    it('should create a payout batch with statements for all providers', async () => {
      const batch = await service.createPayoutBatch({
        frequency: 'WEEKLY',
        startDate: new Date('2026-01-01'),
        endDate: new Date('2026-01-05'),
        notes: 'Test batch',
      });

      expect(batch.status).toBe(PayoutStatus.PENDING);
      expect(batch.frequency).toBe('WEEKLY');
      expect(batch.batchNumber).toMatch(/^PAYOUT-\d{4}-\d{2}-\d{3}$/);
      expect(batch.providerCount).toBeGreaterThanOrEqual(2);
      expect(batch.totalAmount).toBeGreaterThan(0);
    });
  });

  describe('approvePayoutBatch', () => {
    it('should allow admin to approve batch', async () => {
      const batch = await prisma.payoutBatch.findFirst({
        where: { status: PayoutStatus.PENDING },
        orderBy: { createdAt: 'desc' },
      });

      const approved = await service.approvePayoutBatch({
        batchId: batch!.id,
        approvedBy: adminId,
      });

      expect(approved.status).toBe(PayoutStatus.SCHEDULED);
    });
  });

  describe('processPayoutBatch', () => {
    it('should process batch and update statement statuses', async () => {
      const batch = await prisma.payoutBatch.findFirst({
        where: { status: PayoutStatus.SCHEDULED },
        orderBy: { createdAt: 'desc' },
      });

      const processed = await service.processPayoutBatch({
        batchId: batch!.id,
      });

      expect(processed.status).toBe(PayoutStatus.COMPLETED);

      // Verify statements were updated
      const statements = await prisma.payoutStatement.findMany({
        where: { payoutBatchId: batch!.id },
      });

      expect(statements.every((s) => s.status === PayoutStatus.COMPLETED)).toBe(
        true,
      );
    });
  });

  describe('getPayoutBatches', () => {
    it('should return all payout batches', async () => {
      const batches = await service.getPayoutBatches();

      expect(Array.isArray(batches)).toBe(true);
      expect(batches.length).toBeGreaterThanOrEqual(1);
      expect(batches[0]).toHaveProperty('id');
      expect(batches[0]).toHaveProperty('batchNumber');
      expect(batches[0]).toHaveProperty('status');
    });
  });

  describe('getPayoutBatchById', () => {
    it('should return batch details with statements', async () => {
      const batch = await prisma.payoutBatch.findFirst({
        orderBy: { createdAt: 'desc' },
      });

      const fetched = await service.getPayoutBatchById(batch!.id);

      expect(fetched).toMatchObject({
        id: batch!.id,
        status: batch!.status,
      });
      expect(Array.isArray(fetched.statements)).toBe(true);
    });
  });

  describe('getProviderPayoutStatements', () => {
    it('should return provider payout statements', async () => {
      const statements = await service.getProviderPayoutStatements(
        provider1ProfileId,
      );

      expect(Array.isArray(statements)).toBe(true);
      expect(statements.length).toBeGreaterThanOrEqual(1);
      expect(statements[0].providerProfileId).toBe(provider1ProfileId);
    });
  });

  describe('getPayoutStatistics', () => {
    it('should return admin payout statistics', async () => {
      const stats = await service.getPayoutStatistics();

      expect(stats).toHaveProperty('totalBatches');
      expect(stats).toHaveProperty('totalAmount');
      expect(stats).toHaveProperty('totalProviders');
      expect(stats).toHaveProperty('byStatus');
    });
  });

  describe('Edge Cases', () => {
    it('should handle provider with zero earnings', async () => {
      const provider3 = await prisma.user.create({
        data: {
          email: `payout-provider3-${Date.now()}@example.com`,
          phone: `+1555${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`,
          role: 'TRAVELER',
        },
      });

      const profile3 = await prisma.providerProfile.create({
        data: {
          userId: provider3.id,
          providerType: 'HOTEL_MANAGER',
          businessName: 'Zero Earnings Hotel',
          verificationStatus: 'APPROVED',
        },
      });

      const earnings = await service.calculateProviderEarnings(
        provider3.id,
        new Date('2026-01-01'),
        new Date('2026-12-31'),
      );

      expect(parseFloat(earnings.totalEarnings)).toBe(0);
      expect(parseFloat(earnings.platformFee)).toBe(0);
      expect(parseFloat(earnings.netPayout)).toBe(0);

      // Cleanup
      await prisma.providerProfile.delete({ where: { id: profile3.id } });
      await prisma.user.delete({ where: { id: provider3.id } });
    });
  });
});
