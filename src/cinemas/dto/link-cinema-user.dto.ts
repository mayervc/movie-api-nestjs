import { IsInt, IsNotEmpty, Min } from 'class-validator';

export class LinkCinemaUserDto {
  @IsNotEmpty()
  @IsInt()
  @Min(1)
  userId: number;
}
