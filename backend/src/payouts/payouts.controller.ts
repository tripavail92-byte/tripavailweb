import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  UseGuards,
  Request,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { PayoutsService } from './payouts.service';
import { JwtAuthGuard } from '../rbac/guards/jwt-auth.guard';
import { PayoutScheduleFrequency } from '@prisma/client';

class CreatePayoutBatchDto {
  frequency!: PayoutScheduleFrequency;
  startDate!: string; // ISO 8601
  endDate!: string; // ISO 8601
  notes?: string;
}

class CalculateEarningsDto {
  startDate!: string;
  endDate!: string;
}

@ApiTags('Payouts')
@Controller('v1/payouts')
export class PayoutsController {
  private readonly logger = new Logger(PayoutsController.name);

  constructor(private payoutsService: PayoutsService) {}

  /**
   * Calculate provider earnings for a time period (provider view)
   */
  @Post('calculate')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Calculate earnings',
    description:
      'Provider calculates their earnings for a time period. Shows gross earnings, platform fees, refund deductions, and net payout.',
  })
  @ApiResponse({
    status: 200,
    description: 'Earnings calculated',
    schema: {
      example: {
        providerId: 'provider_123',
        totalEarnings: '5000.00',
        platformFees: '500.00',
        refundsDeducted: '250.00',
        netAmount: '4250.00',
        bookingCount: 15,
        period: {
          startDate: '2026-01-01T00:00:00Z',
          endDate: '2026-01-07T23:59:59Z',
        },
      },
    },
  })
  async calculateEarnings(
    @Request() req: any,
    @Body() dto: CalculateEarningsDto,
  ) {
    // TODO: Get provider ID from user profile
    const providerId = req.user.providerId || 'test-provider-id';

    const earnings = await this.payoutsService.calculateProviderEarnings(
      providerId,
      new Date(dto.startDate),
      new Date(dto.endDate),
    );

    return {
      ...earnings,
      totalEarnings: earnings.totalEarnings.toString(),
      platformFees: earnings.platformFees.toString(),
      refundsDeducted: earnings.refundsDeducted.toString(),
      netAmount: earnings.netAmount.toString(),
    };
  }

  /**
   * Create a payout batch (admin only)
   */
  @Post('batches')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Create payout batch (admin)',
    description:
      'Admin creates a payout batch for a time period. Calculates earnings for all providers and creates payout statements.',
  })
  @ApiResponse({
    status: 201,
    description: 'Payout batch created',
    schema: {
      example: {
        id: 'batch_123',
        batchNumber: 'PAYOUT-2026-01-001',
        status: 'PENDING',
        totalAmount: '42500.00',
        totalCount: 10,
        startDate: '2026-01-01T00:00:00Z',
        endDate: '2026-01-07T23:59:59Z',
      },
    },
  })
  async createPayoutBatch(@Request() req: any, @Body() dto: CreatePayoutBatchDto) {
    // TODO: Check admin role
    if (req.user.role !== 'ADMIN') {
      throw new BadRequestException('Only admins can create payout batches');
    }

    const batch = await this.payoutsService.createPayoutBatch({
      frequency: dto.frequency,
      startDate: new Date(dto.startDate),
      endDate: new Date(dto.endDate),
      notes: dto.notes,
    });

    this.logger.log(`Payout batch created by ${req.user.id}: ${batch.batchNumber}`);

    return batch;
  }

  /**
   * Approve a payout batch (admin only)
   * Moves batch from PENDING to SCHEDULED
   */
  @Post('batches/:id/approve')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Approve payout batch (admin)',
    description:
      'Admin approves pending payout batch. Moves to SCHEDULED state, ready for processing.',
  })
  @ApiResponse({
    status: 200,
    description: 'Payout batch approved',
  })
  async approvePayoutBatch(@Request() req: any, @Param('id') batchId: string) {
    // TODO: Check admin role
    if (req.user.role !== 'ADMIN') {
      throw new BadRequestException('Only admins can approve payout batches');
    }

    const batch = await this.payoutsService.approvePayoutBatch(
      batchId,
      req.user.id,
    );

    this.logger.log(`Payout batch ${batchId} approved by ${req.user.id}`);

    return batch;
  }

  /**
   * Process a payout batch (admin/internal)
   * Triggers actual bank transfers via Stripe Connect
   */
  @Post('batches/:id/process')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Process payout batch (admin)',
    description:
      'Process approved payout batch. Triggers bank transfers to provider accounts via payment gateway.',
  })
  @ApiResponse({
    status: 200,
    description: 'Payout batch processed',
  })
  async processPayoutBatch(@Request() req: any, @Param('id') batchId: string) {
    // TODO: Check admin role
    if (req.user.role !== 'ADMIN') {
      throw new BadRequestException('Only admins can process payout batches');
    }

    const batch = await this.payoutsService.processPayoutBatch(batchId);

    this.logger.log(`Payout batch ${batchId} processed by ${req.user.id}`);

    return batch;
  }

  /**
   * Get payout batch by ID
   */
  @Get('batches/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get payout batch',
  })
  @ApiResponse({
    status: 200,
    description: 'Payout batch details with statements',
  })
  async getPayoutBatch(@Param('id') batchId: string) {
    const batch = await this.payoutsService.getPayoutBatch(batchId);
    if (!batch) {
      throw new BadRequestException(`Payout batch not found: ${batchId}`);
    }
    return batch;
  }

  /**
   * Get all payout batches (admin)
   */
  @Get('batches')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get all payout batches (admin)',
  })
  @ApiResponse({
    status: 200,
    description: 'Array of payout batches',
  })
  async getAllPayoutBatches(@Request() req: any) {
    // TODO: Check admin role
    if (req.user.role !== 'ADMIN') {
      throw new BadRequestException('Only admins can view all payout batches');
    }

    return this.payoutsService.getAllPayoutBatches();
  }

  /**
   * Get pending payout batches (admin dashboard)
   */
  @Get('batches/status/pending')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get pending payout batches (admin)',
    description: 'List all payout batches awaiting admin approval',
  })
  @ApiResponse({
    status: 200,
    description: 'Array of pending payout batches',
  })
  async getPendingPayoutBatches(@Request() req: any) {
    // TODO: Check admin role
    if (req.user.role !== 'ADMIN') {
      throw new BadRequestException('Only admins can view pending batches');
    }

    return this.payoutsService.getPendingPayoutBatches();
  }

  /**
   * Get payout statement by ID
   */
  @Get('statements/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get payout statement',
  })
  @ApiResponse({
    status: 200,
    description: 'Payout statement details',
  })
  async getPayoutStatement(@Param('id') statementId: string) {
    const statement = await this.payoutsService.getPayoutStatement(statementId);
    if (!statement) {
      throw new BadRequestException(`Payout statement not found: ${statementId}`);
    }
    return statement;
  }

  /**
   * Get all payout statements for logged-in provider
   */
  @Get('my/statements')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get my payout statements',
    description: 'List all payout statements for the current provider',
  })
  @ApiResponse({
    status: 200,
    description: 'Array of payout statements',
  })
  async getMyPayoutStatements(@Request() req: any) {
    // TODO: Get provider ID from user profile
    const providerId = req.user.providerId || 'test-provider-id';

    return this.payoutsService.getProviderPayoutStatements(providerId);
  }

  /**
   * Get provider payout statistics
   */
  @Get('my/statistics')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get my payout statistics',
    description:
      'Provider views their payout statistics: total earnings, paid out, pending, etc.',
  })
  @ApiResponse({
    status: 200,
    description: 'Provider payout statistics',
    schema: {
      example: {
        totalEarnings: '50000.00',
        totalPaidOut: '42500.00',
        pendingPayout: '7500.00',
        payoutCount: 25,
        lastPayoutDate: '2026-01-07T10:00:00Z',
      },
    },
  })
  async getMyPayoutStats(@Request() req: any) {
    // TODO: Get provider ID from user profile
    const providerId = req.user.providerId || 'test-provider-id';

    const stats = await this.payoutsService.getProviderPayoutStats(providerId);

    return {
      totalEarnings: stats.totalEarnings.toString(),
      totalPaidOut: stats.totalPaidOut.toString(),
      pendingPayout: stats.pendingPayout.toString(),
      payoutCount: stats.payoutCount,
      lastPayoutDate: stats.lastPayoutDate,
    };
  }
}
