import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class CreateCinemaDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  name: string;
}

