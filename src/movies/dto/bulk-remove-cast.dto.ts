import { IsArray, IsNumber, ArrayNotEmpty } from 'class-validator';

export class BulkRemoveCastDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsNumber({}, { each: true })
  actorIds: number[];
}
