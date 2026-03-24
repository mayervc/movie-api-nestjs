import { IsArray, IsNumber, IsString, ArrayNotEmpty } from 'class-validator';

export class AddCastDto {
  @IsNumber()
  actorId: number;

  @IsString()
  role: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  characters: string[];
}
