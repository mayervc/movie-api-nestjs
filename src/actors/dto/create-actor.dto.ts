import {
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  Min
} from 'class-validator';

export class CreateActorDto {
  @IsString()
  @IsOptional()
  firstName?: string;

  @IsString()
  @IsOptional()
  lastName?: string;

  @IsString()
  @IsOptional()
  nickName?: string;

  @IsDateString()
  @IsOptional()
  birthdate?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  popularity?: number;

  @IsString()
  @IsOptional()
  profileImage?: string;
}
