import {
  Body,
  Controller,
  DefaultValuePipe,
  Get,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
  Post,
  Query
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags
} from '@nestjs/swagger';
import { SubscriptionsService } from './subscriptions.service';
import { SubscriptionResponseDto } from './dto/subscription-response.dto';
import { SubscriptionPurchaseResponseDto } from './dto/subscription-purchase-response.dto';
import { CreateSubscriptionCheckoutDto } from './dto/create-subscription-checkout.dto';
import { SubscriptionCheckoutResponseDto } from './dto/subscription-checkout-response.dto';
import { VerifySubscriptionDto } from './dto/verify-subscription.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { Subscription } from './entities/subscription.entity';

@ApiTags('subscriptions')
@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Post('create-checkout')
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Create a Stripe Checkout session for a subscription plan'
  })
  @ApiResponse({
    status: 201,
    description:
      'Checkout session created — redirect the user to the returned URL',
    type: SubscriptionCheckoutResponseDto
  })
  @ApiResponse({
    status: 400,
    description: 'Stripe not configured or price ID missing'
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  createCheckout(
    @Body() dto: CreateSubscriptionCheckoutDto
  ): Promise<SubscriptionCheckoutResponseDto> {
    return this.subscriptionsService.createCheckout(dto);
  }

  @Post('verify')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Verify a completed Stripe checkout session and sync subscription'
  })
  @ApiResponse({
    status: 200,
    description: 'Subscription created or updated',
    type: SubscriptionResponseDto
  })
  @ApiResponse({ status: 400, description: 'Session not completed or invalid' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  verify(
    @Body() dto: VerifySubscriptionDto,
    @CurrentUser() currentUser: User
  ): Promise<Subscription> {
    return this.subscriptionsService.verify(dto, currentUser.id);
  }

  @Get('my-subscription')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get the current subscription of the authenticated user'
  })
  @ApiResponse({
    status: 200,
    description: 'Active subscription or null if none exists',
    type: SubscriptionResponseDto
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getMySubscription(
    @CurrentUser() currentUser: User
  ): Promise<SubscriptionResponseDto | null> {
    return this.subscriptionsService.getMySubscription(currentUser.id);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get subscription purchase history for the authenticated user'
  })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  @ApiResponse({
    status: 200,
    description: 'Paginated subscription purchase history',
    type: SubscriptionPurchaseResponseDto
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getSubscriptionHistory(
    @CurrentUser() currentUser: User,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number
  ): Promise<SubscriptionPurchaseResponseDto> {
    return this.subscriptionsService.getSubscriptionHistory(
      currentUser.id,
      page,
      limit
    );
  }
}
