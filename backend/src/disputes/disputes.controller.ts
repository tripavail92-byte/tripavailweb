import {
  Controller,
  Get,
  Post,
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
import { DisputesService, DisputeStatus } from './disputes.service';
import { JwtAuthGuard } from '../rbac/guards/jwt-auth.guard';

class AddEvidenceDto {
  evidence!: string;
}

@ApiTags('Disputes')
@Controller('v1/disputes')
export class DisputesController {
  private readonly logger = new Logger(DisputesController.name);

  constructor(private disputesService: DisputesService) {}

  /**
   * Get dispute by ID (admin only)
   */
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get dispute details',
  })
  @ApiResponse({
    status: 200,
    description: 'Dispute details',
  })
  async getDispute(@Request() req: any, @Param('id') disputeId: string) {
    // TODO: Check admin role
    if (req.user.role !== 'ADMIN') {
      throw new BadRequestException('Only admins can view disputes');
    }

    const dispute = await this.disputesService.getDispute(disputeId);
    if (!dispute) {
      throw new BadRequestException(`Dispute not found: ${disputeId}`);
    }
    return dispute;
  }

  /**
   * Get all disputes (admin dashboard)
   */
  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get all disputes (admin)',
  })
  @ApiResponse({
    status: 200,
    description: 'Array of disputes',
  })
  async getAllDisputes(@Request() req: any) {
    // TODO: Check admin role
    if (req.user.role !== 'ADMIN') {
      throw new BadRequestException('Only admins can view disputes');
    }

    return this.disputesService.getAllDisputes();
  }

  /**
   * Get open disputes (admin dashboard)
   */
  @Get('status/open')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get open disputes (admin)',
  })
  @ApiResponse({
    status: 200,
    description: 'Array of open disputes',
  })
  async getOpenDisputes(@Request() req: any) {
    // TODO: Check admin role
    if (req.user.role !== 'ADMIN') {
      throw new BadRequestException('Only admins can view disputes');
    }

    return this.disputesService.getDisputesByStatus(DisputeStatus.OPEN);
  }

  /**
   * Get disputes for a booking
   */
  @Get('booking/:bookingId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get disputes for booking',
  })
  @ApiResponse({
    status: 200,
    description: 'Array of disputes for the booking',
  })
  async getBookingDisputes(@Param('bookingId') bookingId: string) {
    return this.disputesService.getDisputesForBooking(bookingId);
  }

  /**
   * Add evidence to a dispute (admin or provider)
   */
  @Post(':id/evidence')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Add evidence to dispute',
    description: 'Provider or admin adds evidence to support their case in the dispute',
  })
  @ApiResponse({
    status: 200,
    description: 'Evidence added successfully',
  })
  async addEvidence(
    @Request() req: any,
    @Param('id') disputeId: string,
    @Body() dto: AddEvidenceDto,
  ) {
    const dispute = await this.disputesService.addEvidence(
      disputeId,
      dto.evidence,
    );

    this.logger.log(`Evidence added to dispute ${disputeId} by ${req.user.id}`);

    return dispute;
  }

  /**
   * Get dispute statistics (admin dashboard)
   */
  @Get('admin/statistics')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get dispute statistics (admin)',
  })
  @ApiResponse({
    status: 200,
    description: 'Dispute statistics',
    schema: {
      example: {
        totalDisputes: 25,
        openDisputes: 5,
        wonDisputes: 15,
        lostDisputes: 5,
        totalDisputedAmount: 250000,
      },
    },
  })
  async getStatistics(@Request() req: any) {
    // TODO: Check admin role
    if (req.user.role !== 'ADMIN') {
      throw new BadRequestException('Only admins can view statistics');
    }

    return this.disputesService.getDisputeStatistics();
  }
}
