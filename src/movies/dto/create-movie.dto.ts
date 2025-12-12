import {
  IsString,
  IsNotEmpty,
  IsDateString,
  IsArray,
  IsOptional,
  IsInt,
  Min,
  IsBoolean,
  IsNumber,
  MinLength,
  Max,
  ValidateIf,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateMovieDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  title: string;

  @IsDateString()
  @IsNotEmpty()
  releaseDate: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  genres?: string[];

  @IsInt()
  @Min(1)
  duration: number;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  trending?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10)
  @ValidateIf((o) => o.rating !== null && o.rating !== undefined)
  rating?: number;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  clasification?: string;

  @IsOptional()
  @IsInt()
  tmdbId?: number;
}


