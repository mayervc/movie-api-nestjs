import {
  Controller,
  DefaultValuePipe,
  Get,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
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
import { SubscriptionPurchasesService } from './subscription-purchases.service';
import { SubscriptionResponseDto } from './dto/subscription-response.dto';
import { SubscriptionPurchaseResponseDto } from './dto/subscription-purchase-response.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@ApiTags('subscriptions')
@Controller('subscriptions')
export class SubscriptionsController {
  constructor(
    private readonly subscriptionsService: SubscriptionsService,
    private readonly subscriptionPurchasesService: SubscriptionPurchasesService
  ) {}

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
    return this.subscriptionPurchasesService.getSubscriptionHistory(
      currentUser.id,
      page,
      limit
    );
  }
}
