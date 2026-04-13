import { ApiProperty } from '@nestjs/swagger';

export class SubscriptionPurchaseItemDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  plan_slug: string;

  @ApiProperty()
  plan_name: string;

  @ApiProperty()
  total_amount: number;

  @ApiProperty()
  created_at: Date;
}

export class SubscriptionPurchasePaginationDto {
  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  total: number;

  @ApiProperty()
  totalPages: number;
}

export class SubscriptionPurchaseResponseDto {
  @ApiProperty({ type: [SubscriptionPurchaseItemDto] })
  purchases: SubscriptionPurchaseItemDto[];

  @ApiProperty({ type: SubscriptionPurchasePaginationDto })
  pagination: SubscriptionPurchasePaginationDto;
}
