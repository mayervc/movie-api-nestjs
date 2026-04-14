import { ApiProperty } from '@nestjs/swagger';

export class SubscriptionCheckoutResponseDto {
  @ApiProperty({ example: 'cs_test_abc123' })
  sessionId: string;

  @ApiProperty({ example: 'https://checkout.stripe.com/pay/cs_test_abc123' })
  url: string;
}
