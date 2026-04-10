import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  Matches
} from 'class-validator';

const PAYMENT_INTENT_ID_PATTERN = /^pi_[a-zA-Z0-9]+$/;

export class PurchaseTicketsDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  @IsPositive()
  showtimeId: number;

  @ApiProperty({ example: [1, 2, 3], type: [Number] })
  @IsArray()
  @IsInt({ each: true })
  @IsPositive({ each: true })
  @ArrayMinSize(1)
  roomSeatIds: number[];

  @ApiPropertyOptional({
    description:
      'Stripe PaymentIntent id after successful client-side payment (same id is stored on every ticket in this purchase)',
    example: 'pi_3Qexample'
  })
  @IsOptional()
  @IsString()
  @Matches(PAYMENT_INTENT_ID_PATTERN, {
    message: 'paymentIntentId must be a valid Stripe PaymentIntent id (pi_...)'
  })
  paymentIntentId?: string;
}
