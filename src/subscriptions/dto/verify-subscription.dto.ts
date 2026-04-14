import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class VerifySubscriptionDto {
  @ApiProperty({ example: 'cs_test_abc123' })
  @IsString()
  sessionId: string;
}
