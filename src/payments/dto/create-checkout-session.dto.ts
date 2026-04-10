import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsPositive,
  IsString,
  IsUrl
} from 'class-validator';

export class CreateCheckoutSessionDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  @IsPositive()
  showtimeId: number;

  @ApiProperty({ example: [1, 2, 3], type: [Number] })
  @IsArray()
  @IsInt({ each: true })
  @IsPositive({ each: true })
  @ArrayMinSize(1)
  seatIds: number[];

  @ApiProperty({ example: 'https://yourapp.com/payment/success' })
  @IsString()
  @IsUrl()
  successUrl: string;

  @ApiProperty({ example: 'https://yourapp.com/payment/cancel' })
  @IsString()
  @IsUrl()
  cancelUrl: string;
}
