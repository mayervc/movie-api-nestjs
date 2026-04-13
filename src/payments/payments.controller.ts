import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Logger,
  Post,
  Query,
  RawBodyRequest,
  Req
} from '@nestjs/common';
import { Request } from 'express';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags
} from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { CreateCheckoutSessionDto } from './dto/create-checkout-session.dto';
import { CheckoutSessionResponseDto } from './dto/checkout-session-response.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { User } from '../users/entities/user.entity';

@ApiTags('payments')
@Controller('payments')
export class PaymentsController {
  private readonly logger = new Logger(PaymentsController.name);

  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('create-checkout-session')
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Create a Stripe Checkout session for ticket purchase'
  })
  @ApiResponse({
    status: 201,
    description:
      'Checkout session created — redirect the user to the returned URL',
    type: CheckoutSessionResponseDto
  })
  @ApiResponse({
    status: 400,
    description: 'Stripe not configured or validation failure'
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Showtime not found' })
  createCheckoutSession(
    @Body() dto: CreateCheckoutSessionDto,
    @CurrentUser() currentUser: User
  ): Promise<CheckoutSessionResponseDto> {
    return this.paymentsService.createCheckoutSession(dto, currentUser);
  }

  @Get('order-by-session')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get order by Stripe session ID' })
  @ApiQuery({ name: 'sessionId', required: true, example: 'cs_test_abc123' })
  @ApiResponse({ status: 200, description: 'Order found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - order owner or ADMIN required'
  })
  @ApiResponse({ status: 404, description: 'Order not found' })
  findBySessionId(
    @Query('sessionId') sessionId: string,
    @CurrentUser() currentUser: User
  ) {
    return this.paymentsService.findBySessionId(sessionId, currentUser);
  }

  @Post('webhook')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Handle Stripe webhook events (public, raw body, signature verified)'
  })
  @ApiResponse({ status: 200, description: 'Event processed' })
  @ApiResponse({
    status: 400,
    description: 'Invalid signature or missing webhook secret'
  })
  handleWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string
  ) {
    this.logger.log(
      `Stripe webhook for payments received, payload: ${req.rawBody?.toString()}`
    );
    return this.paymentsService.handleWebhook(req.rawBody, signature);
  }
}
