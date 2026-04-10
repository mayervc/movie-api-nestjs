import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags
} from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { CreateCheckoutSessionDto } from './dto/create-checkout-session.dto';
import { CheckoutSessionResponseDto } from './dto/checkout-session-response.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@ApiTags('payments')
@Controller('payments')
export class PaymentsController {
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
}
