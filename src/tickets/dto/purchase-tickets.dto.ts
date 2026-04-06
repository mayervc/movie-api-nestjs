import { ApiProperty } from '@nestjs/swagger';
import { ArrayMinSize, IsArray, IsInt, IsPositive } from 'class-validator';

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
}
