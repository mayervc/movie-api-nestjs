import { ApiProperty } from '@nestjs/swagger';
import {
  IsDateString,
  IsInt,
  IsNumber,
  IsPositive,
  Min
} from 'class-validator';

export class CreateShowtimeDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  @IsPositive()
  movieId: number;

  @ApiProperty({ example: 1 })
  @IsInt()
  @IsPositive()
  roomId: number;

  @ApiProperty({ example: '2026-04-01T20:00:00Z' })
  @IsDateString()
  startTime: string;

  @ApiProperty({ example: 9.99 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  ticketPrice: number;
}
