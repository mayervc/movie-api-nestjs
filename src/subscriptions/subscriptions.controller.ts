import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags
} from '@nestjs/swagger';
import { SubscriptionsService } from './subscriptions.service';
import { SubscriptionResponseDto } from './dto/subscription-response.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@ApiTags('subscriptions')
@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

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
}
