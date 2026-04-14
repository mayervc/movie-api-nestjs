import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString, IsUrl } from 'class-validator';
import { SubscriptionPlan } from '../enums/subscription-plan.enum';

export class CreateSubscriptionCheckoutDto {
  @ApiProperty({ enum: SubscriptionPlan, example: SubscriptionPlan.BASIC })
  @IsEnum(SubscriptionPlan)
  plan: SubscriptionPlan;

  @ApiProperty({ example: 'https://yourapp.com/subscription/success' })
  @IsString()
  @IsUrl()
  successUrl: string;

  @ApiProperty({ example: 'https://yourapp.com/subscription/cancel' })
  @IsString()
  @IsUrl()
  cancelUrl: string;
}
