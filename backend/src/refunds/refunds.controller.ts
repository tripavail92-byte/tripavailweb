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
import { RefundsService } from './refunds.service';
import { JwtAuthGuard } from '../rbac/guards/jwt-auth.guard';

class CreateRefundDto {
  bookingId!: string;
  cancellationReason?: string;
}

class ApproveRefundDto {
  notes?: string;
}

class RejectRefundDto {
  reason!: string;
}

class ProcessRefundDto {
  refundPaymentId?: string;
}

@ApiTags('Refunds')
@Controller('v1/refunds')
export class RefundsController {
  private readonly logger = new Logger(RefundsController.name);

  constructor(private refundsService: RefundsService) {}

  /**
   * Request a refund for a booking
   * State: PENDING → awaiting admin approval
   */
  @Post('request')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Request refund for booking',
    description:
      'Traveler requests a refund. Creates refund in PENDING state with auto-calculated amount based on cancellation policy.',
  })
  @ApiResponse({
    status: 201,
    description: 'Refund requested successfully',
    schema: {
      example: {
        id: 'refund_123',
        bookingId: 'booking_456',
        status: 'PENDING',
        refundAmount: '599.99',
        refundPercentage: 100,
        refundReason: 'Flexible policy: Full refund (cancelled 5 days before check-in)',
        createdAt: '2026-01-04T10:00:00Z',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid booking status or already has pending refund',
  })
  async requestRefund(@Request() req: any, @Body() dto: CreateRefundDto) {
    if (!dto.bookingId) {
      throw new BadRequestException('bookingId is required');
    }

    const refund = await this.refundsService.requestRefund({
      bookingId: dto.bookingId,
      userId: req.user.id,
      cancellationReason: dto.cancellationReason,
    });

    this.logger.log(
      `Refund requested by ${req.user.id} for booking ${dto.bookingId}`,
    );

    return refund;
  }

  /**
   * Approve a refund (admin only)
   * State: PENDING → APPROVED
   */
  @Post(':id/approve')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Approve refund (admin)',
    description:
      'Admin approves pending refund. Moves to APPROVED state, ready for payment processing.',
  })
  @ApiResponse({
    status: 200,
    description: 'Refund approved',
  })
  async approveRefund(
    @Request() req: any,
    @Param('id') refundId: string,
    @Body() dto: ApproveRefundDto,
  ) {
    // TODO: Check admin role
    if (req.user.role !== 'ADMIN') {
      throw new BadRequestException('Only admins can approve refunds');
    }

    const refund = await this.refundsService.approveRefund({
      refundId,
      adminId: req.user.id,
      notes: dto.notes,
    });

    this.logger.log(`Refund ${refundId} approved by ${req.user.id}`);

    return refund;
  }

  /**
   * Reject a refund (admin only)
   * State: PENDING → REJECTED
   */
  @Post(':id/reject')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Reject refund (admin)',
    description: 'Admin rejects refund request. Moves to REJECTED state.',
  })
  @ApiResponse({
    status: 200,
    description: 'Refund rejected',
  })
  async rejectRefund(
    @Request() req: any,
    @Param('id') refundId: string,
    @Body() dto: RejectRefundDto,
  ) {
    // TODO: Check admin role
    if (req.user.role !== 'ADMIN') {
      throw new BadRequestException('Only admins can reject refunds');
    }

    const refund = await this.refundsService.rejectRefund(
      refundId,
      req.user.id,
      dto.reason,
    );

    this.logger.log(`Refund ${refundId} rejected by ${req.user.id}`);

    return refund;
  }

  /**
   * Process an approved refund
   * State: APPROVED → PROCESSED (payment gateway integration)
   */
  @Post(':id/process')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Process refund (internal)',
    description:
      'Process approved refund via payment gateway. Creates ledger entries for double-entry accounting.',
  })
  @ApiResponse({
    status: 200,
    description: 'Refund processed',
  })
  async processRefund(
    @Param('id') refundId: string,
    @Body() dto: ProcessRefundDto,
  ) {
    // TODO: Check internal service access
    const refund = await this.refundsService.processRefund({
      refundId,
      refundPaymentId: dto.refundPaymentId,
    });

    this.logger.log(`Refund ${refundId} processed`);

    return refund;
  }

  /**
   * Get refund by ID
   */
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get refund details',
  })
  @ApiResponse({
    status: 200,
    description: 'Refund details',
  })
  async getRefund(@Param('id') refundId: string) {
    const refund = await this.refundsService.getRefund(refundId);
    if (!refund) {
      throw new BadRequestException(`Refund not found: ${refundId}`);
    }
    return refund;
  }

  /**
   * Get refund for a booking
   */
  @Get('booking/:bookingId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get refund for booking',
  })
  @ApiResponse({
    status: 200,
    description: 'Refund details or null',
  })
  async getRefundByBooking(@Param('bookingId') bookingId: string) {
    return this.refundsService.getRefundByBooking(bookingId);
  }

  /**
   * Get all refunds for logged-in user
   */
  @Get('my/refunds')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get my refunds',
    description: 'List all refunds requested by the current user',
  })
  @ApiResponse({
    status: 200,
    description: 'Array of refunds',
  })
  async getMyRefunds(@Request() req: any) {
    return this.refundsService.getUserRefunds(req.user.id);
  }

  /**
   * Get statistics on refunds (admin)
   */
  @Get('admin/statistics')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get refund statistics (admin)',
  })
  @ApiResponse({
    status: 200,
    description: 'Refund statistics',
  })
  async getStatistics(@Request() req: any) {
    // TODO: Check admin role
    if (req.user.role !== 'ADMIN') {
      throw new BadRequestException('Only admins can view statistics');
    }

    return this.refundsService.getRefundStatistics();
  }

  /**
   * Get pending refunds (admin dashboard)
   */
  @Get('admin/pending')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get pending refunds (admin)',
    description: 'List all refunds awaiting admin approval',
  })
  @ApiResponse({
    status: 200,
    description: 'Array of pending refunds',
  })
  async getPendingRefunds(@Request() req: any) {
    // TODO: Check admin role
    if (req.user.role !== 'ADMIN') {
      throw new BadRequestException('Only admins can view pending refunds');
    }

    return this.refundsService.getPendingRefunds();
  }
}



