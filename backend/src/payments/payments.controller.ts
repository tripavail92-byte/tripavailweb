import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { PaymentResponseDto } from './dto/payment-response.dto';
import { JwtAuthGuard } from '../rbac/guards/jwt-auth.guard';

/**
 * Day 38: Payments Controller
 *
 * Handles payment pre-authorization for bookings.
 */
@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('pre-authorize')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Pre-authorize payment for booking',
    description:
      'Day 38: Holds payment on traveler\'s card without capturing funds. Requires booking in HOLD state. Transitions booking: HOLD → PAYMENT_PENDING.',
  })
  @ApiResponse({
    status: 201,
    description: 'Payment pre-authorized successfully',
    type: PaymentResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid booking state or payment method declined' })
  @ApiResponse({ status: 401, description: 'Unauthorized - JWT required' })
  @ApiResponse({ status: 404, description: 'Booking not found' })
  async preAuthorizePayment(
    @Req() req: any,
    @Body() dto: CreatePaymentDto,
  ): Promise<PaymentResponseDto> {
    return this.paymentsService.preAuthorizePayment(req.user.id, dto);
  }
}

