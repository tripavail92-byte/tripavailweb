import { Controller, Post, Body, UseGuards, Req, Param, HttpCode } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { BookingsService } from './bookings.service';
import { CreateQuoteDto } from './dto/create-quote.dto';
import { QuoteResponseDto } from './dto/quote-response.dto';
import { CreateHoldDto } from './dto/create-hold.dto';
import { HoldResponseDto } from './dto/hold-response.dto';
import { JwtAuthGuard } from '../rbac/guards/jwt-auth.guard';

@ApiTags('Bookings')
@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post('quote')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Create a booking quote',
    description:
      'Day 36: QUOTE state - Creates a price quote with server-calculated pricing. No inventory is locked at this stage. Quote expires in 24 hours.',
  })
  @ApiResponse({
    status: 201,
    description: 'Quote created successfully',
    type: QuoteResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid request or package unavailable' })
  @ApiResponse({ status: 401, description: 'Unauthorized - JWT required' })
  async createQuote(@Req() req: any, @Body() dto: CreateQuoteDto): Promise<QuoteResponseDto> {
    return this.bookingsService.createQuote(req.user.id, dto);
  }

  @Post('hold')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Create a booking hold',
    description:
      'Day 37: HOLD state - Locks inventory atomically using Postgres row-level locks. Hold expires in 10 minutes. Transitions QUOTE → HOLD.',
  })
  @ApiResponse({
    status: 201,
    description: 'Hold created successfully with inventory locked',
    type: HoldResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid quote or insufficient inventory' })
  @ApiResponse({ status: 401, description: 'Unauthorized - JWT required' })
  @ApiResponse({ status: 404, description: 'Quote not found' })
  async createHold(@Req() req: any, @Body() dto: CreateHoldDto): Promise<HoldResponseDto> {
    return this.bookingsService.createHold(req.user.id, dto);
  }

  @Post(':bookingId/confirm')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Confirm a booking',
    description:
      'Day 39: CONFIRMED state - Captures pre-authorized payment and creates double-entry ledger entries. Transitions PAYMENT_PENDING → CONFIRMED.',
  })
  @ApiResponse({
    status: 200,
    description: 'Booking confirmed successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid booking state' })
  @ApiResponse({ status: 401, description: 'Unauthorized - JWT required' })
  @ApiResponse({ status: 404, description: 'Booking not found' })
  async confirmBooking(@Param('bookingId') bookingId: string) {
    return this.bookingsService.confirmBooking(bookingId);
  }

  @Post(':bookingId/cancel/guest')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Cancel a booking (by guest)',
    description:
      'Day 39: CANCELLED_BY_GUEST - Calculates refund based on cancellation policy, processes refund, and creates reversal ledger entries. Transitions CONFIRMED → CANCELLED_BY_GUEST.',
  })
  @ApiResponse({
    status: 200,
    description: 'Booking cancelled successfully with refund calculation',
  })
  @ApiResponse({ status: 400, description: 'Invalid booking state or not your booking' })
  @ApiResponse({ status: 401, description: 'Unauthorized - JWT required' })
  @ApiResponse({ status: 404, description: 'Booking not found' })
  async cancelBookingByGuest(@Param('bookingId') bookingId: string, @Req() req: any) {
    return this.bookingsService.cancelBookingByGuest(bookingId, req.user.id);
  }

  @Post(':bookingId/cancel/provider')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Cancel a booking (by provider)',
    description:
      'Day 39: CANCELLED_BY_PROVIDER - Processes 100% refund (regardless of policy) and creates reversal ledger entries. Transitions CONFIRMED → CANCELLED_BY_PROVIDER.',
  })
  @ApiResponse({
    status: 200,
    description: 'Booking cancelled successfully with full refund',
  })
  @ApiResponse({ status: 400, description: 'Invalid booking state or not your booking' })
  @ApiResponse({ status: 401, description: 'Unauthorized - JWT required' })
  @ApiResponse({ status: 404, description: 'Booking not found' })
  async cancelBookingByProvider(@Param('bookingId') bookingId: string, @Req() req: any) {
    // User ID is in req.user.id (from JwtAuthGuard)
    // Service will fetch provider profile internally
    return this.bookingsService.cancelBookingByProvider(bookingId, req.user.id);
  }
}

