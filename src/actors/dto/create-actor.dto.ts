import {
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateIf
} from 'class-validator';

export class CreateActorDto {
  @ValidateIf((o) => !o.lastName)
  @IsString()
  @IsNotEmpty()
  firstName?: string;

  @ValidateIf((o) => !o.firstName)
  @IsString()
  @IsNotEmpty()
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
