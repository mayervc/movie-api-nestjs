import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SubscriptionPlan } from '../enums/subscription-plan.enum';

export class SubscriptionResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  userId: number;

  @ApiProperty()
  stripeSubscriptionId: string;

  @ApiProperty()
  stripeCustomerId: string;

  @ApiProperty({ enum: SubscriptionPlan })
  plan: SubscriptionPlan;

  @ApiProperty()
  status: string;

  @ApiProperty()
  currentPeriodStart: Date;

  @ApiProperty()
  currentPeriodEnd: Date;

  @ApiProperty()
  cancelAtPeriodEnd: boolean;

  @ApiProperty()
  discountPercent: number;

  @ApiProperty()
  freeTicketsPerMonth: number;

  @ApiProperty()
  freeTicketsRemaining: number;

  @ApiProperty()
  freeTicketsUsed: number;

  @ApiProperty()
  createdAt: Date;

  @ApiPropertyOptional()
  updatedAt: Date;
}
