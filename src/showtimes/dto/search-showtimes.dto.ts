import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsInt, IsOptional, IsPositive } from 'class-validator';

export class SearchShowtimesDto {
  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsInt()
  @IsPositive()
  movieId?: number;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsInt()
  @IsPositive()
  roomId?: number;

  @ApiPropertyOptional({ example: '2026-04-01T00:00:00Z' })
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @ApiPropertyOptional({ example: '2026-04-30T23:59:59Z' })
  @IsOptional()
  @IsDateString()
  dateTo?: string;
}
