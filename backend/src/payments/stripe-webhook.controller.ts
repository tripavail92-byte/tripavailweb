import {
  Controller,
  Post,
  Headers,
  Body,
  RawBodyRequest,
  Req,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { StripeWebhookService } from './stripe-webhook.service';

/**
 * Stripe Webhook Controller
 * Handles webhooks from Stripe for payment and transfer events
 * 
 * Important: Raw body is required for Stripe signature verification
 * Configure in main.ts with bodyParser: { verify: (req, res, buf) => { req.rawBody = buf } }
 */
@ApiTags('Webhooks')
@Controller('webhooks/stripe')
export class StripeWebhookController {
  private readonly logger = new Logger(StripeWebhookController.name);

  constructor(private stripeWebhookService: StripeWebhookService) {}

  /**
   * Handle Stripe webhook events
   * Verifies signature and processes events
   */
  @Post()
  @ApiOperation({
    summary: 'Stripe webhook handler',
    description:
      'Receives and processes Stripe webhook events for payments, transfers, disputes, etc.',
  })
  @ApiResponse({ status: 200, description: 'Webhook processed successfully' })
  @ApiResponse({ status: 400, description: 'Invalid signature or payload' })
  async handleWebhook(
    @Headers('stripe-signature') signature: string,
    @Req() req: RawBodyRequest<Request>,
    @Body() body: any,
  ) {
    if (!signature) {
      throw new BadRequestException('Missing stripe-signature header');
    }

    this.logger.log(`Received Stripe webhook: ${body?.type || 'unknown'}`);

    try {
      // Verify webhook signature and process event
      const rawBody = req.rawBody || Buffer.from(JSON.stringify(body));
      const event = await this.stripeWebhookService.verifyAndProcessWebhook(
        rawBody,
        signature,
      );

      this.logger.log(`Webhook processed: ${event.type}`);

      return { received: true, eventId: event.id };
    } catch (error: any) {
      this.logger.error(`Webhook processing failed: ${error.message}`, error.stack);
      throw new BadRequestException(`Webhook error: ${error.message}`);
    }
  }
}
